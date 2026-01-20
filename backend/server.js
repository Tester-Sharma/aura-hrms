const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const sendResponse = (res, data = null, success = true, message = '', error = null) => {
    if (!success) {
        console.error(`[API Error] ${message}`, error);
        return res.status(500).json({ success: false, message, error: error?.message });
    }
    return res.json({ success: true, data });
};

app.post('/api/auth/login', async (req, res) => {
    const { id, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Parse JSON fields
        const userData = { ...user };
        if (userData.salaryBreakdown) {
            try { userData.salaryBreakdown = JSON.parse(userData.salaryBreakdown); } catch(e) {}
        }
        
        // Return user data directly (MockService expects this structure)
        res.json(userData); 
    } catch (e) {
        sendResponse(res, null, false, 'Login failed', e);
    }
});

app.get('/api/worker/dashboard', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Calculate Stats (Total)
        const attendanceRecords = await prisma.attendance.findMany({ where: { userId } });
        const workedHours = attendanceRecords.reduce((sum, r) => sum + (r.workedHours || 0), 0);
        const otHours = attendanceRecords.reduce((sum, r) => sum + (r.otHours || 0), 0);

        // Calculate Stats (Today)
        const today = new Date();
        const todayRecords = attendanceRecords.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === today.getFullYear() &&
                   d.getMonth() === today.getMonth() &&
                   d.getDate() === today.getDate();
        });
        const todayWorked = todayRecords.reduce((sum, r) => sum + (r.workedHours || 0), 0);
        const todayOT = todayRecords.reduce((sum, r) => sum + (r.otHours || 0), 0);

        // Calculate Earnings (Estimate)
        let estimatedEarnings = 0;
        let todayEarnings = 0;
        
        if (user.role === 'worker') {
            estimatedEarnings = Math.round(workedHours * (user.hourlyRate || 0));
            todayEarnings = Math.round(todayWorked * (user.hourlyRate || 0));
        } else {
            estimatedEarnings = user.monthlySalary || 0;
            // Daily estimate for salaried
            todayEarnings = Math.round((user.monthlySalary || 0) / 26); 
        }

        // Active Check...
        const lastRecord = await prisma.attendance.findFirst({
            where: { userId },
            orderBy: { id: 'desc' }
        });
        const isPunchedIn = !!(lastRecord && lastRecord.inTime && !lastRecord.outTime);

        res.json({
            stats: {
                workedHours: parseFloat(workedHours.toFixed(2)),
                overtime: parseFloat(otHours.toFixed(2)),
                leaveBalance: 12,
                estimatedEarnings,
                todayEarnings,
                todayWorked: parseFloat(todayWorked.toFixed(2)),
                todayOT: parseFloat(todayOT.toFixed(2))
            },
            status: {
                isPunchedIn,
                lastPunchTime: (isPunchedIn && lastRecord) ? lastRecord.inTime : null
            },
            notices: [
                { id: '1', text: 'Safety drill tomorrow at 10 AM' },
                { id: '2', text: 'Canteen menu updated' }
            ]
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Attendance Actions
app.post('/api/attendance/punch-in', async (req, res) => {
    const { userId } = req.body;
    try {
        // Validation: Don't punch in if already in
        const lastRecord = await prisma.attendance.findFirst({
            where: { userId },
            orderBy: { id: 'desc' }
        });

        if (lastRecord && lastRecord.inTime && !lastRecord.outTime) {
            return res.json({ success: false, message: 'Already punched in' });
        }

        const now = new Date();
        await prisma.attendance.create({
            data: {
                userId,
                date: now,
                inTime: now,
                status: 'Present'
            }
        });
        
        res.json({ success: true, timestamp: now });
    } catch (e) {
        sendResponse(res, null, false, 'Punch In Failed', e);
    }
});

app.post('/api/attendance/punch-out', async (req, res) => {
    const { userId } = req.body;
    try {
        // Find the open session
        const lastRecord = await prisma.attendance.findFirst({
            where: { userId },
            orderBy: { id: 'desc' }
        });

        if (!lastRecord || !lastRecord.inTime || lastRecord.outTime) {
             return res.json({ success: false, message: 'No active session found to punch out' });
        }

        const now = new Date();
        const inTime = new Date(lastRecord.inTime);
        const durationMs = now - inTime;
        const workedHours = durationMs / (1000 * 60 * 60);

        // Overtime Logic: Anything > 9 hours is OT (Simplified)
        let regularHours = workedHours;
        let ot = 0;
        if (workedHours > 9) {
            regularHours = 9;
            ot = workedHours - 9;
        }

        await prisma.attendance.update({
            where: { id: lastRecord.id },
            data: {
                outTime: now,
                workedHours: parseFloat(workedHours.toFixed(2)),
                otHours: parseFloat(ot.toFixed(2))
            }
        });

        res.json({ success: true, timestamp: now });
    } catch (e) {
        sendResponse(res, null, false, 'Punch Out Failed', e);
    }
});

// 3. Attendance History
app.get('/api/worker/attendance-history', async (req, res) => {
    const { userId, month } = req.query; // Month format: 'YYYY-MM'
    if (!userId) return res.status(400).json({ error: 'Missing details' });

    try {
        // Filter by month if provided
        let dateFilter = {};
        if (month) {
            const startDate = new Date(`${month}-01`);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            dateFilter = {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        const history = await prisma.attendance.findMany({
            where: { userId, ...dateFilter },
            orderBy: { date: 'desc' }
        });

        // Format for Frontend
        const formatted = history.map(r => ({
            date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }),
            in: r.inTime ? new Date(r.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            out: r.outTime ? new Date(r.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            total: r.workedHours?.toFixed(1) || 0,
            ot: r.otHours?.toFixed(1) || 0,
            status: r.status
        }));

        const stats = {
            totalDays: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
            presentDays: history.filter(r => r.status === 'Present').length,
            workedHours: history.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(1),
            otHours: history.reduce((acc, r) => acc + (r.otHours || 0), 0).toFixed(1),
            pendingHours: 0
        };

        res.json({ stats, history: formatted });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'History fetch failed' });
    }
});

// 4. Leaves & Profile
app.get('/api/worker/profile', async (req, res) => {
    const userId = req.query.userId;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).send('Not Found');

        if (user.salaryBreakdown) {
            try { user.salaryBreakdown = JSON.parse(user.salaryBreakdown); } catch(e) {}
        }

        let weeklyStats = null;
        if (user.role === 'worker') {
            const now = new Date();
            const startOfWeek = new Date(now);
            const day = now.getDay(); 
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);

            const weeklyAttendance = await prisma.attendance.findMany({
                where: {
                    userId,
                    date: { gte: startOfWeek }
                }
            });

            const weeklyHours = weeklyAttendance.reduce((sum, r) => sum + (r.workedHours || 0), 0);
            const weeklyEarnings = Math.round(weeklyHours * (user.hourlyRate || 0));
            
            weeklyStats = {
                hours: parseFloat(weeklyHours.toFixed(1)),
                earnings: weeklyEarnings,
                count: weeklyAttendance.length
            };
        }

        res.json({ ...user, weeklyStats });
    } catch (e) { 
        console.error(e);
        res.status(500).send('Error'); 
    }
});

// Download Payslip (PDF)
app.get('/api/worker/download-payslip', async (req, res) => {
    const { userId, overrideDays, month } = req.query; // overrides
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).send('User not found');
        
        const company = await prisma.company.findFirst();

        let salary = {};
        try { salary = JSON.parse(user.salaryBreakdown || '{}'); } catch(e) {}
        
        // --- Calculation Logic with Override ---
        let earnings = 0; 
        let basic = salary.basic || 0;
        let hra = salary.hra || 0;
        let special = salary.special || salary.specialAllowance || 0;
        
        // If Worker (Hourly)
        if (user.role === 'worker') {
            // If override days provided, assume 8 hours per day
            if (overrideDays) {
                earnings = parseFloat(overrideDays) * 8 * (user.hourlyRate || 0);
            } else {
                // Default to standard ESTIMATE if not provided OR fetch actuals (complex)
                // For simplicity in this "Instant" generation, we use stored or estimate
                earnings = 26 * 8 * (user.hourlyRate || 0); 
            }
            basic = earnings; // Structure for worker often simpler
            hra = 0; special = 0;
        } else {
            // Employee
            if (overrideDays) {
                const ratio = parseFloat(overrideDays) / 26; // 26 working days standard
                basic *= ratio;
                hra *= ratio;
                special *= ratio;
                earnings = basic + hra + special;
            } else {
                earnings = basic + hra + special;
            }
        }

        const deductions = (salary.pf || 0) + (salary.pt || 0);
        const netPayable = earnings - deductions;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Payslip_${userId}.pdf`);
        
        doc.pipe(res);

        // -- HEADER --
        if (company?.logo) {
            try {
                const logoBuffer = Buffer.from(company.logo.split(',')[1], 'base64');
                doc.image(logoBuffer, 50, 45, { width: 50 });
            } catch (e) {}
        }

        doc.fillColor('#44337a')
           .fontSize(20)
           .text(company?.name || 'AURA HRMS', { align: 'center' })
           .fontSize(10)
           .text(company?.address || 'Corporate Office', { align: 'center' })
           .moveDown();

        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').stroke();
        
        doc.moveDown();
        doc.fillColor('black').fontSize(16).text('PAYSLIP', { align: 'center', underline: true });
        
        const dateObj = month ? new Date(month + '-01') : new Date();
        doc.fontSize(10).text(`For the month of ${dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        // Details Box
        const yStart = doc.y;
        doc.rect(50, yStart, 500, 70).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('black');
        
        doc.text('Name:', 70, yStart + 15).text(user.name, 150, yStart + 15);
        doc.text('Employee ID:', 70, yStart + 35).text(user.id, 150, yStart + 35);
        doc.text('Paid Days:', 70, yStart + 55).text(overrideDays || 'Full Month', 150, yStart + 55);
        
        doc.text('Department:', 300, yStart + 15).text(user.department || '-', 400, yStart + 15);
        doc.text('Designation:', 300, yStart + 35).text(user.designation || '-', 400, yStart + 35);

        doc.moveDown(5);

        // -- SALARY TABLE --
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        
        // Coordinates
        const c1_x = 50; const c1_val_x = 200;
        const c2_x = 310; const c2_val_x = 460;
        
        doc.text('EARNINGS', c1_x, tableTop);
        doc.text('AMOUNT', c1_val_x, tableTop, { width: 80, align: 'right' });
        
        doc.text('DEDUCTIONS', c2_x, tableTop);
        doc.text('AMOUNT', c2_val_x, tableTop, { width: 80, align: 'right' });
        
        doc.font('Helvetica');
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let rowY = tableTop + 25;
        const addRow = (label, amt, xL, xV) => {
            if(amt && amt > 0) {
                doc.text(label, xL, rowY);
                doc.text(Math.round(amt).toLocaleString(), xV, rowY, { width: 80, align: 'right' });
                return true;
            }
            return false;
        };

        // Left Side
        let ly = rowY;
        addRow('Basic Pay', basic, c1_x, c1_val_x); ly += 20;
        if (hra > 0) { doc.text('HRA', c1_x, ly); doc.text(Math.round(hra).toLocaleString(), c1_val_x, ly, { width: 80, align: 'right' }); ly += 20; }
        if (special > 0) { doc.text('Special Allow.', c1_x, ly); doc.text(Math.round(special).toLocaleString(), c1_val_x, ly, { width: 80, align: 'right' }); ly += 20; }

        // Right Side
        let ry = rowY;
        addRow('Provident Fund', salary.pf, c2_x, c2_val_x); if (salary.pf > 0) ry += 20;
        addRow('Professional Tax', salary.pt, c2_x, c2_val_x); if (salary.pt > 0) ry += 20;

        const finalY = Math.max(ly, ry) + 20;
        doc.moveTo(50, finalY).lineTo(550, finalY).stroke();
        
        doc.font('Helvetica-Bold');
        doc.text('Total Earnings', c1_x, finalY + 10);
        doc.text(Math.round(earnings).toLocaleString(), c1_val_x, finalY + 10, { width: 80, align: 'right' });
        
        doc.text('Total Deductions', c2_x, finalY + 10);
        doc.text(Math.round(deductions).toLocaleString(), c2_val_x, finalY + 10, { width: 80, align: 'right' });

        const netY = finalY + 40;
        doc.rect(50, netY, 500, 40).fill('#e0e7ff');
        doc.fillColor('#3730a3').fontSize(14).text('NET PAYABLE', 70, netY + 12);
        doc.text(`INR ${Math.round(netPayable).toLocaleString()}`, 380, netY + 12, { width: 150, align: 'right' });
        
        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

// HR: Generate Salary Sheet
app.post('/api/hr/salary-sheet/pdf', async (req, res) => {
    const { month, overrides } = req.body; // overrides = { userId: days }
    try {
        const users = await prisma.user.findMany({ 
            where: { role: { in: ['worker', 'employee'] } },
            orderBy: { name: 'asc' }
        });
        const company = await prisma.company.findFirst();

        const doc = new PDFDocument({ margin: 30, layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=SalarySheet_${month}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text(`${company?.name || 'AURA'} - Salary Sheet (${month})`, { align: 'center' });
        doc.moveDown();

        // Table Header
        const startX = 30;
        let y = 100;
        doc.fontSize(9).font('Helvetica-Bold');
        
        const cols = [
            { name: 'ID', w: 50 },
            { name: 'Name', w: 120 },
            { name: 'Role', w: 60 },
            { name: 'Days', w: 40 },
            { name: 'Basic', w: 70 },
            { name: 'HRA', w: 70 },
            { name: 'Special', w: 70 },
            { name: 'Gross', w: 80 },
            { name: 'Deductions', w: 70 },
            { name: 'Net Pay', w: 80 }
        ];

        let x = startX;
        cols.forEach(c => {
            doc.text(c.name, x, y);
            x += c.w;
        });
        
        y += 15;
        doc.moveTo(startX, y).lineTo(x, y).stroke();
        y += 10;
        doc.font('Helvetica');

        // Rows
        users.forEach(u => {
             if (y > 500) { doc.addPage({ layout: 'landscape' }); y = 50; }

             // Calc
             let salary = {};
             try { salary = JSON.parse(u.salaryBreakdown || '{}'); } catch(e) {}
             
             const days = overrides?.[u.id] ? parseFloat(overrides[u.id]) : 26;
             const ratio = days / 26;

             let basic = 0, hra = 0, special = 0;
             if (u.role === 'employee') {
                 basic = (salary.basic || 0) * ratio;
                 hra = (salary.hra || 0) * ratio;
                 special = (salary.specialAllowance || 0) * ratio;
             } else {
                 basic = days * 8 * (u.hourlyRate || 0); // Worker assumption
             }
             
             const gross = basic + hra + special;
             const ded = (salary.pf || 0) + (salary.pt || 0);
             const net = gross - ded;

             let cx = startX;
             doc.text(u.id, cx, y, { width: 50 }); cx += 50;
             doc.text(u.name, cx, y, { width: 120, ellipsis: true }); cx += 120;
             doc.text(u.role, cx, y, { width: 60 }); cx += 60;
             doc.text(days.toString(), cx, y, { width: 40 }); cx += 40;
             doc.text(Math.round(basic).toString(), cx, y, { width: 60 }); cx += 70;
             doc.text(Math.round(hra).toString(), cx, y, { width: 60 }); cx += 70;
             doc.text(Math.round(special).toString(), cx, y, { width: 60 }); cx += 70;
             doc.font('Helvetica-Bold').text(Math.round(gross).toString(), cx, y, { width: 70 }); cx += 80;
             doc.font('Helvetica').text(Math.round(ded).toString(), cx, y, { width: 60 }); cx += 70;
             doc.font('Helvetica-Bold').text(Math.round(net).toString(), cx, y, { width: 70 });
             
             y += 20;
             doc.font('Helvetica');
        });

        doc.end();
    } catch(e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

app.post('/api/worker/apply-leave', async (req, res) => {
    try {
        const data = req.body;
        const leave = await prisma.leaveRequest.create({
            data: {
                userId: data.userId,
                type: data.type,
                reason: data.reason,
                fromDate: new Date(data.fromDate),
                toDate: new Date(data.toDate),
                status: 'Pending'
            }
        });
        res.json({ success: true, requestId: leave.id });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Leave fail' }); 
    }
});

app.get('/api/worker/my-leaves', async (req, res) => {
    const { userId } = req.query;
    try {
        const leaves = await prisma.leaveRequest.findMany({
            where: { userId },
            orderBy: { id: 'desc' }
        });
        res.json(leaves);
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.get('/api/worker/leave-stats', async (req, res) => {
    const userId = req.query.userId;
    try {
        const approved = await prisma.leaveRequest.count({ where: { userId, status: 'Approved' } });
        const pending = await prisma.leaveRequest.count({ where: { userId, status: 'Pending' } });
        res.json({
            totalBalance: 12,
            used: approved,
            pending,
            available: 12 - approved
        });
    } catch (e) { res.status(500).send('Error'); }
});

// --- HR PORTAL LOGIC ---

app.get('/api/hr/dashboard-stats', async (req, res) => {
    try {
        const employees = await prisma.user.findMany();
        const activeShift = await prisma.attendance.count({
            where: {
                outTime: null, // Currently Punched In
                // And check if InTime is recent (last 24 hours) to avoid stale "Active" counts
                inTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
            }
        });
        
        // Calculate Payroll
        let payroll = 0;
        employees.forEach(e => {
            if (e.role === 'worker') payroll += (e.hourlyRate || 0) * 160; // Estimate
            else payroll += (e.monthlySalary || 0);
        });

        res.json({
            totalEmployees: employees.length,
            activeShiftWorkers: activeShift,
            pendingLeaves: await prisma.leaveRequest.count({ where: { status: 'Pending' } }),
            monthlyPayrollTotal: Math.round(payroll),
            departmentDistribution: [ // Mock for now, difficult to group in basic prisma without raw query
                { name: 'Production', count: employees.filter(e => e.department === 'Production').length },
                { name: 'Engineering', count: employees.filter(e => e.department === 'Engineering').length },
                { name: 'HR', count: employees.filter(e => e.department === 'Human Resources' || e.department === 'HR').length }
            ]
        });
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/api/hr/employees', async (req, res) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
        const clean = users.map(u => {
            if (u.salaryBreakdown) u.salaryBreakdown = JSON.parse(u.salaryBreakdown);
            return u;
        });
        res.json(clean);
    } catch (e) { res.status(500).send("Error"); }
});

app.post('/api/hr/register-employee', async (req, res) => {
    const data = req.body;
    try {
        // Generate proper ID
        const prefix = data.type === 'Worker' ? 'W' : 'E';
        const id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Prepare salary fields based on type
        const salaryFields = data.type === 'Worker' 
            ? { 
                hourlyRate: parseFloat(data.baseRate), 
                monthlySalary: null, 
                ctc: null 
              }
            : { 
                hourlyRate: null, 
                monthlySalary: parseFloat(data.baseRate) / 12, 
                ctc: parseFloat(data.baseRate) 
              };

        // Prepare the complete user data object
        const userData = {
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            role: data.type === 'Worker' ? 'worker' : 'employee',
            department: data.department,
            designation: data.designation || 'N/A',
            shift: data.shift || '09:00 AM - 05:00 PM',
            joiningDate: new Date(),
            ...salaryFields,
            photo: data.photo, // Add photo to user data
            salaryBreakdown: data.salaryBreakdown ? JSON.stringify(data.salaryBreakdown) : null,
            password: '12345'
        };

        const user = await prisma.user.create({
            data: userData
        });
        
        res.json({ success: true, user });
    } catch (e) { 
        console.error('Registration Error:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Generate Employee Application Form (PDF)
app.get('/api/hr/application-form/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).send("User not found");

        const company = await prisma.company.findFirst();

        const doc = new PDFDocument({ margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Application_${user.name}.pdf`);
        doc.pipe(res);

        // -- HEADER --
        if (company?.logo) {
            try {
                const logoBuffer = Buffer.from(company.logo.split(',')[1], 'base64');
                doc.image(logoBuffer, 40, 40, { width: 50 });
            } catch (e) { console.error("Logo Error", e); }
        }

        doc.fontSize(20).font('Helvetica-Bold').text(company?.name || 'AURA HRMS', 100, 45);
        doc.fontSize(10).font('Helvetica').text(company?.address || 'Corporate Office', 100, 70);
        
        doc.moveDown(4);

        // -- TITLE --
        doc.fontSize(16).text('EMPLOYEE APPLICATION FORM', { align: 'center', underline: true });
        doc.moveDown(2);

        // -- PHOTO --
        if (user.photo) {
            try {
                const photoBuffer = Buffer.from(user.photo.split(',')[1], 'base64');
                doc.image(photoBuffer, 450, 40, { width: 100, height: 100, fit: [100, 100] });
            } catch (e) { console.error("Photo Error", e); }
        }

        // -- DETAILS --
        const yStart = doc.y;
        
        const field = (label, value, y) => {
            doc.font('Helvetica-Bold').fontSize(11).text(label, 50, y);
            doc.font('Helvetica').text(value || '-', 200, y);
            doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#e2e8f0').stroke();
        };

        let currentY = yStart;
        field('Full Name:', user.name, currentY); currentY += 30;
        field('Employee ID:', user.id, currentY); currentY += 30;
        field('Date of Joining:', new Date(user.joiningDate).toLocaleDateString(), currentY); currentY += 30;
        field('Designation:', user.designation, currentY); currentY += 30;
        field('Department:', user.department, currentY); currentY += 30;
        field('Email Address:', user.email, currentY); currentY += 30;
        field('Phone Number:', user.phone, currentY); currentY += 30;
        field('Current Address:', user.address, currentY); currentY += 30;
        
        doc.moveDown(2);
        
        // -- DECLARATION --
        doc.fontSize(12).font('Helvetica-Bold').text('Declaration', 50);
        doc.fontSize(10).font('Helvetica').text(
            'I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief.',
            50, doc.y + 10, { width: 500 }
        );

        doc.moveDown(4);
        
        doc.text('__________________________', 50);
        doc.text('Employee Signature', 50);
        
        doc.text('__________________________', 350);
        doc.text('Authorised Signatory', 350);

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

app.get('/api/hr/pending-leaves', async (req, res) => {
    try {
        const leaves = await prisma.leaveRequest.findMany({
            where: { status: 'Pending' },
            orderBy: { id: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, department: true, designation: true }
                }
            }
        });
        res.json(leaves);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

// HR: Manual Attendance Entry
app.post('/api/hr/attendance/manual', async (req, res) => {
    const { userId, date, status, inTime, outTime } = req.body;
    try {
        const targetDate = new Date(date);
        
        // Find existing record for this user & date
        // Note: Check date range to span that specific day
        const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);
        
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Calculate hours if times are provided
        let workedHours = 0;
        let ot = 0;
        let inDate = null;
        let outDate = null;

        if (inTime && outTime) {
            inDate = new Date(`${date}T${inTime}`);
            outDate = new Date(`${date}T${outTime}`);
            const diff = outDate - inDate;
            workedHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
            if (workedHours > 9) ot = parseFloat((workedHours - 9).toFixed(2));
        } else if (inTime) {
            inDate = new Date(`${date}T${inTime}`);
        }

        const data = {
            userId,
            date: targetDate,
            status,
            inTime: inDate,
            outTime: outDate,
            workedHours,
            otHours: ot
        };

        if (existing) {
            await prisma.attendance.update({ where: { id: existing.id }, data });
        } else {
            await prisma.attendance.create({ data });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Update Failed");
    }
});

// HR: Download Attendance Sheet PDF
app.post('/api/hr/attendance-sheet/pdf', async (req, res) => {
    const { month } = req.body; // YYYY-MM
    try {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
        const daysInMonth = endDate.getDate();

        // Fetch Data
        const employees = await prisma.user.findMany({ 
            where: { role: { in: ['worker', 'employee'] } },
            orderBy: { name: 'asc' } 
        });

        const attendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: new Date(endDate.setHours(23,59,59))
                }
            }
        });

        const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A3' }); // A3 for width
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${month}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text(`Attendance Sheet - ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        const startX = 20;
        const startY = 80;
        const cellWidth = 25;
        const nameWidth = 150;
        const rowHeight = 20;

        // Draw Header
        doc.fontSize(8);
        doc.text('Employee', startX, startY + 5);
        
        for (let i = 1; i <= daysInMonth; i++) {
            doc.text(i.toString(), startX + nameWidth + ((i-1) * cellWidth) + 8, startY + 5);
        }
        
        // Grid Lines (Header)
        doc.rect(startX, startY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
        
        // Draw Rows
        let currentY = startY + rowHeight;
        employees.forEach(emp => {
            if (currentY > 750) { // New Page
                doc.addPage({ margin: 20, layout: 'landscape', size: 'A3' });
                currentY = 40;
            }

            doc.text(emp.name, startX + 5, currentY + 5, { width: nameWidth - 5, ellipsis: true });
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDate = new Date(year, monthNum - 1, i);
                const record = attendance.find(a => 
                    a.userId === emp.id && 
                    new Date(a.date).getDate() === i
                );

                let mark = '-';
                if (record) {
                    if (record.status === 'Present') mark = 'P';
                    else if (record.status === 'Absent') mark = 'A';
                    else if (record.status === 'Leave') mark = 'L';
                    else if (record.status === 'Half Day') mark = 'HD';
                }

                // Highlight Color
                if (mark === 'A') doc.fillColor('red');
                else if (mark === 'L') doc.fillColor('blue');
                else doc.fillColor('black');

                doc.text(mark, startX + nameWidth + ((i-1) * cellWidth) + 8, currentY + 5);
                doc.fillColor('black'); // Reset
            }
            
            // Row Border
            doc.rect(startX, currentY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
            currentY += rowHeight;
        });

        // Vertical Lines for Matrix
        // Left Border (Name)
        // doc.moveTo(startX + nameWidth, startY).lineTo(startX + nameWidth, currentY).stroke();
        
        for (let i = 0; i < daysInMonth; i++) {
           // doc.moveTo(startX + nameWidth + (i * cellWidth), startY).lineTo(startX + nameWidth + (i * cellWidth), currentY).stroke();
        }

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

app.post('/api/hr/update-leave-status', async (req, res) => {
    const { requestId, status } = req.body;
    try {
        const updated = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: { status }
        });
        res.json({ success: true, leave: updated });
    } catch (e) {
        console.error('Update Leave Error:', e.message);
        res.status(500).json({ success: false, message: e.message || "Update failed" });
    }
});

app.get('/api/hr/payroll-summary', async (req, res) => {
    const { month } = req.query;
    try {
        const employees = await prisma.user.findMany({
            where: {
                role: { in: ['worker', 'employee'] }
            }
        });

        let payrollData = [];
        
        for (const emp of employees) {
            let earnings = 0;
            
            if (emp.role === 'worker') {
                const attendance = await prisma.attendance.findMany({
                    where: { userId: emp.id }
                });
                const totalHours = attendance.reduce((sum, r) => sum + (r.workedHours || 0), 0);
                earnings = Math.round(totalHours * (emp.hourlyRate || 0));
            } else {
                earnings = emp.monthlySalary || 0;
            }
            
            payrollData.push({
                id: emp.id,
                name: emp.name,
                department: emp.department,
                role: emp.role,
                earnings,
                type: emp.role === 'worker' ? 'Hourly' : 'Salaried'
            });
        }
        
        const total = payrollData.reduce((sum, emp) => sum + emp.earnings, 0);
        
        res.json({
            employees: payrollData,
            totalPayroll: total,
            count: payrollData.length
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

// HR: Manual Attendance Entry
app.post('/api/hr/attendance/manual', async (req, res) => {
    const { userId, date, status, inTime, outTime } = req.body;
    try {
        const targetDate = new Date(date);
        
        // Find existing record for this user & date
        // Note: Check date range to span that specific day
        const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);
        
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Calculate hours if times are provided
        let workedHours = 0;
        let ot = 0;
        let inDate = null;
        let outDate = null;

        if (inTime && outTime) {
            inDate = new Date(`${date}T${inTime}`);
            outDate = new Date(`${date}T${outTime}`);
            const diff = outDate - inDate;
            workedHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
            if (workedHours > 9) ot = parseFloat((workedHours - 9).toFixed(2));
        } else if (inTime) {
            inDate = new Date(`${date}T${inTime}`);
        }

        const data = {
            userId,
            date: targetDate,
            status,
            inTime: inDate,
            outTime: outDate,
            workedHours,
            otHours: ot
        };

        if (existing) {
            await prisma.attendance.update({ where: { id: existing.id }, data });
        } else {
            await prisma.attendance.create({ data });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Update Failed");
    }
});

// HR: Download Attendance Sheet PDF
app.post('/api/hr/attendance-sheet/pdf', async (req, res) => {
    const { month } = req.body; // YYYY-MM
    try {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
        const daysInMonth = endDate.getDate();

        // Fetch Data
        const employees = await prisma.user.findMany({ 
            where: { role: { in: ['worker', 'employee'] } },
            orderBy: { name: 'asc' } 
        });

        const attendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: new Date(endDate.setHours(23,59,59))
                }
            }
        });

        const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A3' }); // A3 for width
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${month}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text(`Attendance Sheet - ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        const startX = 20;
        const startY = 80;
        const cellWidth = 25;
        const nameWidth = 150;
        const rowHeight = 20;

        // Draw Header
        doc.fontSize(8);
        doc.text('Employee', startX, startY + 5);
        
        for (let i = 1; i <= daysInMonth; i++) {
            doc.text(i.toString(), startX + nameWidth + ((i-1) * cellWidth) + 8, startY + 5);
        }
        
        // Grid Lines (Header)
        doc.rect(startX, startY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
        
        // Draw Rows
        let currentY = startY + rowHeight;
        employees.forEach(emp => {
            if (currentY > 750) { // New Page
                doc.addPage({ margin: 20, layout: 'landscape', size: 'A3' });
                currentY = 40;
            }

            doc.text(emp.name, startX + 5, currentY + 5, { width: nameWidth - 5, ellipsis: true });
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDate = new Date(year, monthNum - 1, i);
                const record = attendance.find(a => 
                    a.userId === emp.id && 
                    new Date(a.date).getDate() === i
                );

                let mark = '-';
                if (record) {
                    if (record.status === 'Present') mark = 'P';
                    else if (record.status === 'Absent') mark = 'A';
                    else if (record.status === 'Leave') mark = 'L';
                    else if (record.status === 'Half Day') mark = 'HD';
                }

                // Highlight Color
                if (mark === 'A') doc.fillColor('red');
                else if (mark === 'L') doc.fillColor('blue');
                else doc.fillColor('black');

                doc.text(mark, startX + nameWidth + ((i-1) * cellWidth) + 8, currentY + 5);
                doc.fillColor('black'); // Reset
            }
            
            // Row Border
            doc.rect(startX, currentY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
            currentY += rowHeight;
        });

        // Vertical Lines for Matrix
        // Left Border (Name)
        // doc.moveTo(startX + nameWidth, startY).lineTo(startX + nameWidth, currentY).stroke();
        
        for (let i = 0; i < daysInMonth; i++) {
           // doc.moveTo(startX + nameWidth + (i * cellWidth), startY).lineTo(startX + nameWidth + (i * cellWidth), currentY).stroke();
        }

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

// HR: Get today's attendance for all employees
app.get('/api/hr/attendance-today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const employees = await prisma.user.findMany({
            where: {
                role: { in: ['worker', 'employee'] }
            },
            select: {
                id: true,
                name: true,
                department: true,
                shift: true,
                role: true
            }
        });
        
        const attendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: today
                }
            }
        });
        
        const result = employees.map(emp => {
            const todayAtt = attendance.find(a => a.userId === emp.id);
            return {
                ...emp,
                status: todayAtt ? (todayAtt.inTime ? 'Present' : todayAtt.status) : 'Absent',
                inTime: todayAtt?.inTime || null,
                outTime: todayAtt?.outTime || null
            };
        });
        
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

// HR: Manual Attendance Entry
app.post('/api/hr/attendance/manual', async (req, res) => {
    const { userId, date, status, inTime, outTime } = req.body;
    try {
        const targetDate = new Date(date);
        
        // Find existing record for this user & date
        // Note: Check date range to span that specific day
        const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);
        
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Calculate hours if times are provided
        let workedHours = 0;
        let ot = 0;
        let inDate = null;
        let outDate = null;

        if (inTime && outTime) {
            inDate = new Date(`${date}T${inTime}`);
            outDate = new Date(`${date}T${outTime}`);
            const diff = outDate - inDate;
            workedHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
            if (workedHours > 9) ot = parseFloat((workedHours - 9).toFixed(2));
        } else if (inTime) {
            inDate = new Date(`${date}T${inTime}`);
        }

        const data = {
            userId,
            date: targetDate,
            status,
            inTime: inDate,
            outTime: outDate,
            workedHours,
            otHours: ot
        };

        if (existing) {
            await prisma.attendance.update({ where: { id: existing.id }, data });
        } else {
            await prisma.attendance.create({ data });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Update Failed");
    }
});

// HR: Download Attendance Sheet PDF
app.post('/api/hr/attendance-sheet/pdf', async (req, res) => {
    const { month } = req.body; // YYYY-MM
    try {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
        const daysInMonth = endDate.getDate();

        // Fetch Data
        const employees = await prisma.user.findMany({ 
            where: { role: { in: ['worker', 'employee'] } },
            orderBy: { name: 'asc' } 
        });

        const attendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: new Date(endDate.setHours(23,59,59))
                }
            }
        });

        const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A3' }); // A3 for width
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${month}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text(`Attendance Sheet - ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        const startX = 20;
        const startY = 80;
        const cellWidth = 25;
        const nameWidth = 150;
        const rowHeight = 20;

        // Draw Header
        doc.fontSize(8);
        doc.text('Employee', startX, startY + 5);
        
        for (let i = 1; i <= daysInMonth; i++) {
            doc.text(i.toString(), startX + nameWidth + ((i-1) * cellWidth) + 8, startY + 5);
        }
        
        // Grid Lines (Header)
        doc.rect(startX, startY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
        
        // Draw Rows
        let currentY = startY + rowHeight;
        employees.forEach(emp => {
            if (currentY > 750) { // New Page
                doc.addPage({ margin: 20, layout: 'landscape', size: 'A3' });
                currentY = 40;
            }

            doc.text(emp.name, startX + 5, currentY + 5, { width: nameWidth - 5, ellipsis: true });
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDate = new Date(year, monthNum - 1, i);
                const record = attendance.find(a => 
                    a.userId === emp.id && 
                    new Date(a.date).getDate() === i
                );

                let mark = '-';
                if (record) {
                    if (record.status === 'Present') mark = 'P';
                    else if (record.status === 'Absent') mark = 'A';
                    else if (record.status === 'Leave') mark = 'L';
                    else if (record.status === 'Half Day') mark = 'HD';
                }

                // Highlight Color
                if (mark === 'A') doc.fillColor('red');
                else if (mark === 'L') doc.fillColor('blue');
                else doc.fillColor('black');

                doc.text(mark, startX + nameWidth + ((i-1) * cellWidth) + 8, currentY + 5);
                doc.fillColor('black'); // Reset
            }
            
            // Row Border
            doc.rect(startX, currentY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
            currentY += rowHeight;
        });

        // Vertical Lines for Matrix
        // Left Border (Name)
        // doc.moveTo(startX + nameWidth, startY).lineTo(startX + nameWidth, currentY).stroke();
        
        for (let i = 0; i < daysInMonth; i++) {
           // doc.moveTo(startX + nameWidth + (i * cellWidth), startY).lineTo(startX + nameWidth + (i * cellWidth), currentY).stroke();
        }

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

// HR: Get attendance history for specific employee
app.get('/api/hr/attendance-history/:userId', async (req, res) => {
    const { userId } = req.params;
    const { month } = req.query; // Format: 2026-01
    
    try {
        let startDate, endDate;
        
        if (month) {
            const [year, monthNum] = month.split('-');
            startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        
        const records = await prisma.attendance.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        const history = records.map(r => ({
            date: r.date.toISOString().split('T')[0],
            status: r.inTime ? 'Present' : r.status,
            in: r.inTime ? new Date(r.inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            out: r.outTime ? new Date(r.outTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            total: r.workedHours || 0
        }));
        
        const totalHours = records.reduce((sum, r) => sum + (r.workedHours || 0), 0);
        
        res.json({
            history,
            stats: {
                totalDays: records.length,
                workedHours: totalHours.toFixed(1),
                pendingHours: Math.max(0, (records.length * 8) - totalHours).toFixed(1)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

// HR: Manual Attendance Entry
app.post('/api/hr/attendance/manual', async (req, res) => {
    const { userId, date, status, inTime, outTime } = req.body;
    try {
        const targetDate = new Date(date);
        
        // Find existing record for this user & date
        // Note: Check date range to span that specific day
        const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);
        
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Calculate hours if times are provided
        let workedHours = 0;
        let ot = 0;
        let inDate = null;
        let outDate = null;

        if (inTime && outTime) {
            inDate = new Date(`${date}T${inTime}`);
            outDate = new Date(`${date}T${outTime}`);
            const diff = outDate - inDate;
            workedHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
            if (workedHours > 9) ot = parseFloat((workedHours - 9).toFixed(2));
        } else if (inTime) {
            inDate = new Date(`${date}T${inTime}`);
        }

        const data = {
            userId,
            date: targetDate,
            status,
            inTime: inDate,
            outTime: outDate,
            workedHours,
            otHours: ot
        };

        if (existing) {
            await prisma.attendance.update({ where: { id: existing.id }, data });
        } else {
            await prisma.attendance.create({ data });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Update Failed");
    }
});

// HR: Download Attendance Sheet PDF
app.post('/api/hr/attendance-sheet/pdf', async (req, res) => {
    const { month } = req.body; // YYYY-MM
    try {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
        const daysInMonth = endDate.getDate();

        // Fetch Data
        const employees = await prisma.user.findMany({ 
            where: { role: { in: ['worker', 'employee'] } },
            orderBy: { name: 'asc' } 
        });

        const attendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: new Date(endDate.setHours(23,59,59))
                }
            }
        });

        const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A3' }); // A3 for width
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${month}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text(`Attendance Sheet - ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        const startX = 20;
        const startY = 80;
        const cellWidth = 25;
        const nameWidth = 150;
        const rowHeight = 20;

        // Draw Header
        doc.fontSize(8);
        doc.text('Employee', startX, startY + 5);
        
        for (let i = 1; i <= daysInMonth; i++) {
            doc.text(i.toString(), startX + nameWidth + ((i-1) * cellWidth) + 8, startY + 5);
        }
        
        // Grid Lines (Header)
        doc.rect(startX, startY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
        
        // Draw Rows
        let currentY = startY + rowHeight;
        employees.forEach(emp => {
            if (currentY > 750) { // New Page
                doc.addPage({ margin: 20, layout: 'landscape', size: 'A3' });
                currentY = 40;
            }

            doc.text(emp.name, startX + 5, currentY + 5, { width: nameWidth - 5, ellipsis: true });
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDate = new Date(year, monthNum - 1, i);
                const record = attendance.find(a => 
                    a.userId === emp.id && 
                    new Date(a.date).getDate() === i
                );

                let mark = '-';
                if (record) {
                    if (record.status === 'Present') mark = 'P';
                    else if (record.status === 'Absent') mark = 'A';
                    else if (record.status === 'Leave') mark = 'L';
                    else if (record.status === 'Half Day') mark = 'HD';
                }

                // Highlight Color
                if (mark === 'A') doc.fillColor('red');
                else if (mark === 'L') doc.fillColor('blue');
                else doc.fillColor('black');

                doc.text(mark, startX + nameWidth + ((i-1) * cellWidth) + 8, currentY + 5);
                doc.fillColor('black'); // Reset
            }
            
            // Row Border
            doc.rect(startX, currentY, nameWidth + (daysInMonth * cellWidth), rowHeight).stroke();
            currentY += rowHeight;
        });

        // Vertical Lines for Matrix
        // Left Border (Name)
        // doc.moveTo(startX + nameWidth, startY).lineTo(startX + nameWidth, currentY).stroke();
        
        for (let i = 0; i < daysInMonth; i++) {
           // doc.moveTo(startX + nameWidth + (i * cellWidth), startY).lineTo(startX + nameWidth + (i * cellWidth), currentY).stroke();
        }

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
    }
});

// --- COMPANY MANAGEMENT ---

app.get('/api/company', async (req, res) => {
    try {
        // Assume single company for now
        const company = await prisma.company.findFirst();
        res.json(company || {});
    } catch (e) {
        console.error(e);
        res.status(500).send("Error fetching company details");
    }
});

app.post('/api/company', async (req, res) => {
    const data = req.body;
    try {
        const existing = await prisma.company.findFirst();
        
        let company;
        if (existing) {
            company = await prisma.company.update({
                where: { id: existing.id },
                data: {
                    name: data.name,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    website: data.website,
                    taxId: data.taxId,
                    logo: data.logo // Base64 string
                }
            });
        } else {
            company = await prisma.company.create({
                data: {
                    name: data.name,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    website: data.website,
                    taxId: data.taxId,
                    logo: data.logo
                }
            });
        }
        res.json({ success: true, company });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Failed to save company details" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
