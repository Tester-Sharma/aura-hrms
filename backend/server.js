const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
    const { userId } = req.query;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).send('User not found');
        
        let salary = {};
        try { salary = JSON.parse(user.salaryBreakdown || '{}'); } catch(e) {}
        
        // Calculate Net
        const special = salary.special || salary.specialAllowance || 0;
        const earnings = (salary.basic || 0) + (salary.hra || 0) + special;
        const deductions = (salary.pf || 0) + (salary.pt || 0);
        const netPayable = earnings - deductions;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Payslip_${userId}.pdf`);
        
        doc.pipe(res);

        // -- HEADER --
        doc.fillColor('#44337a') // Primary Purple
           .fontSize(20)
           .text('AURA HRMS', { align: 'center' })
           .fontSize(10)
           .text('123 Corporate Park, Tech City, India', { align: 'center' })
           .moveDown();

        doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#e2e8f0').stroke();
        
        doc.moveDown();
        doc.fillColor('black').fontSize(16).text('PAYSLIP', { align: 'center', underline: true });
        doc.fontSize(10).text(`For the month of ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        const yStart = doc.y;
        doc.rect(50, yStart, 500, 70).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('black');
        
        doc.text('Name:', 70, yStart + 15).text(user.name, 150, yStart + 15);
        doc.text('Employee ID:', 70, yStart + 35).text(user.id, 150, yStart + 35);
        
        doc.text('Department:', 300, yStart + 15).text(user.department || '-', 400, yStart + 15);
        doc.text('Designation:', 300, yStart + 35).text(user.designation || '-', 400, yStart + 35);

        doc.moveDown(5);

        // -- SALARY TABLE --
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        
        // Coordinates
        const c1_x = 50;
        const c1_val_x = 200;
        const c1_val_w = 80; // Ends at 280
        
        const c2_x = 310;
        const c2_val_x = 460;
        const c2_val_w = 80; // Ends at 540
        
        doc.text('EARNINGS', c1_x, tableTop);
        doc.text('AMOUNT (INR)', c1_val_x, tableTop, { width: c1_val_w, align: 'right' });
        
        doc.text('DEDUCTIONS', c2_x, tableTop);
        doc.text('AMOUNT (INR)', c2_val_x, tableTop, { width: c2_val_w, align: 'right' });
        
        doc.font('Helvetica');
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let rowY = tableTop + 25;
        const addRow = (label, amt, xLabel, xAmtStart, xAmtW) => {
            if(amt) {
                doc.text(label, xLabel, rowY);
                doc.text(amt.toLocaleString(), xAmtStart, rowY, { width: xAmtW, align: 'right' });
            }
        };

        // Earnings List
        addRow('Basic Pay', salary.basic, c1_x, c1_val_x, c1_val_w); rowY += 20;
        addRow('HRA', salary.hra, c1_x, c1_val_x, c1_val_w); rowY += 20;
        addRow('Special Allowance', special, c1_x, c1_val_x, c1_val_w); rowY += 20;
        
        // Deductions List
        let dedY = tableTop + 25;
        const addDed = (label, amt) => {
             if(amt !== undefined) {
                 doc.text(label, c2_x, dedY);
                 doc.text(amt.toLocaleString(), c2_val_x, dedY, { width: c2_val_w, align: 'right' });
                 dedY += 20;
             }
        };
        addDed('Provident Fund', salary.pf);
        addDed('Professional Tax', salary.pt);
        
        rowY = Math.max(rowY, dedY) + 10;
        
        doc.moveTo(50, rowY).lineTo(550, rowY).stroke();
        rowY += 10;
        
        // Totals
        doc.font('Helvetica-Bold');
        doc.text('Total Earnings', c1_x, rowY);
        doc.text(earnings.toLocaleString(), c1_val_x, rowY, { width: c1_val_w, align: 'right' });
        
        doc.text('Total Deductions', c2_x, rowY);
        doc.text(deductions.toLocaleString(), c2_val_x, rowY, { width: c2_val_w, align: 'right' });
        
        rowY += 30;
        doc.rect(50, rowY, 500, 40).fill('#e0e7ff');
        doc.fillColor('#3730a3').fontSize(14).text('NET PAYABLE', 70, rowY + 12);
        doc.text(`INR ${netPayable.toLocaleString()}`, 380, rowY + 12, { width: 150, align: 'right' });
        
        // Footer
        doc.text('This is a computer generated document.', 50, 700, { align: 'center' });
        
        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).send("PDF Generation Failed");
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
