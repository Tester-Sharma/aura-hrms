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
        
        // Fetch any saved payroll records for this month
        const payrollRecords = await prisma.payrollRecord.findMany({
            where: { month }
        });
        const payrollMap = {};
        payrollRecords.forEach(pr => { payrollMap[pr.userId] = pr; });

        const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=SalarySheet_${month}.pdf`);
        doc.pipe(res);

        // --- CONSTANTS ---
        const THEME_COLOR = '#6200EA';
        const [year, monthNum] = month.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parseInt(monthNum) - 1] || month;

        // --- HEADER ---
        // Top Info Row
        doc.fontSize(7).font('Helvetica').fillColor('black');
        doc.text(`[rule 78 (1) (a) (i)]`, 20, 20);
        doc.text(`Register of Wages Form No. 27 (1)`, 650, 20, { width: 150, align: 'right' });
        doc.text(`Page 1`, 750, 30, { width: 50, align: 'right' });
        
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`P.F.Code : ${company?.taxId || 'XXXXXXXXXX'}`, 20, 35);
        doc.text(`MonthDays    26`, 700, 35, { width: 100, align: 'right' });
        
        // Company Name (Center, Large)
        doc.fontSize(14).font('Helvetica-Bold').fillColor(THEME_COLOR);
        doc.text(`${company?.name || 'AURA TEXTILES PRIVATE LIMITED'}`, 20, 50, { width: 800, align: 'center' });
        
        doc.fontSize(8).font('Helvetica').fillColor('black');
        doc.text(`ESI Code : ${company?.email || 'XXXXXXXXXX'}`, 20, 48);
        
        // Address Line
        doc.fontSize(7).text(`${company?.address || 'PLOT NO. XXX, INDUSTRIAL AREA, GROWTH CENTRE, DISTRICT'}`, 20, 70, { width: 800, align: 'center' });
        
        // Month Header
        doc.fontSize(10).font('Helvetica-Bold').text(`FOR THE MONTH ${monthName.toUpperCase()} ${year}`, 20, 85, { width: 800, align: 'center' });

        // --- TABLE HEADER ---
        let y = 105;
        const startX = 20;
        
        // Column widths
        // Column widths optimized for A4 Landscape (total ~760px)
        const cols = [
            { name: 'S.No', w: 22 },
            { name: 'NAME / FATHER NAME\nP.F.NO. / ESI NO.\nUAN No.', w: 100 },
            { name: 'DESIG.', w: 45 },
            { name: 'SALARY\nRATE', w: 42 },
            { name: 'DAYS\n/HRS', w: 28 },
            // Earnings
            { name: 'SALARY', w: 45 },
            { name: 'H.R.A', w: 40 },
            { name: 'CONV.', w: 38 },
            { name: 'OTHER', w: 38 },
            { name: 'TOTAL', w: 48 },
            // Deductions
            { name: 'P.F.', w: 38 },
            { name: 'E.S.I.', w: 38 },
            { name: 'Advance', w: 40 },
            { name: 'Other', w: 35 },
            { name: 'TDS', w: 32 },
            { name: 'TOTAL', w: 45 },
            // Net
            { name: 'NET PAYABLE\nAMOUNT', w: 55 },
            { name: 'SIGN.', w: 35 }
        ];
        
        // Draw header row background
        const totalWidth = cols.reduce((sum, c) => sum + c.w, 0);
        doc.rect(startX, y, totalWidth, 35).fillAndStroke('#f3e8ff', '#CBD5E1');
        
        // Earnings/Deductions group headers
        doc.fontSize(7).font('Helvetica-Bold').fillColor(THEME_COLOR);
        doc.text('[--------E A R N I N G S--------]', 255, y + 2, { width: 210, align: 'center' });
        doc.text('[-------- DEDUCTIONS --------]', 465, y + 2, { width: 230, align: 'center' });
        
        y += 12;
        let x = startX;
        doc.fontSize(6).font('Helvetica-Bold').fillColor('black');
        cols.forEach(c => {
            doc.text(c.name, x + 2, y, { width: c.w - 4, align: 'center' });
            x += c.w;
        });
        
        y += 25;
        doc.moveTo(startX, y).lineTo(800 - 20, y).strokeColor('#CBD5E1').stroke();
        y += 5;

        // --- DATA ROWS ---
        doc.font('Helvetica').fontSize(7);
        let sno = 1;
        
        users.forEach(u => {
            if (y > 520) { 
                doc.addPage({ layout: 'landscape', size: 'A4' }); 
                y = 30; 
            }

            // Check if there's a saved payroll record
            const pr = payrollMap[u.id];
            
            // Calculate salary components
            let salary = {};
            try { salary = JSON.parse(u.salaryBreakdown || '{}'); } catch(e) {}
            
            const days = pr?.daysWorked || (overrides?.[u.id] ? parseFloat(overrides[u.id]) : 26);
            const ratio = days / 26;

            let basic, hra, conv, other, grossEarnings;
            let pfDed, esiDed, advanceDed, otherDed, tdsDed, totalDed, netPay;
            let salaryRate = 0;

            if (pr) {
                // Use saved payroll record
                basic = pr.basic;
                hra = pr.hra;
                conv = pr.conveyance;
                other = pr.otherEarnings;
                grossEarnings = pr.grossEarnings;
                pfDed = pr.pf;
                esiDed = pr.esi;
                advanceDed = pr.advance;
                otherDed = pr.otherDeductions;
                tdsDed = pr.tds;
                totalDed = pr.totalDeductions;
                netPay = pr.netPayable;
                salaryRate = Math.round((basic / ratio) || 0);
            } else {
                // Calculate from user data
                if (u.role === 'employee') {
                    // Auto-split: 50% Basic, 30% HRA, 10% Conv, 10% Other
                    const monthlySalary = salary.basic ? (salary.basic + (salary.hra || 0) + (salary.specialAllowance || 0)) : (u.monthlySalary || 0);
                    salaryRate = monthlySalary;
                    basic = Math.round(monthlySalary * 0.5 * ratio);
                    hra = Math.round(monthlySalary * 0.3 * ratio);
                    conv = Math.round(monthlySalary * 0.1 * ratio);
                    other = Math.round(monthlySalary * 0.1 * ratio);
                } else {
                    // Worker: hourly rate * 8 hours * days
                    basic = Math.round(days * 8 * (u.hourlyRate || 0));
                    salaryRate = (u.hourlyRate || 0) * 8 * 26;
                    hra = 0;
                    conv = 0;
                    other = 0;
                }
                grossEarnings = basic + hra + conv + other;
                
                // Deductions
                pfDed = u.epfoEnabled ? Math.round(basic * 0.12) : 0;
                esiDed = u.esicEnabled ? Math.round(grossEarnings * 0.0075) : 0;
                advanceDed = u.advanceAmount || 0;
                otherDed = 0;
                tdsDed = u.tdsEnabled ? Math.round(grossEarnings * 0.1) : 0; // 10% TDS if enabled
                totalDed = pfDed + esiDed + advanceDed + otherDed + tdsDed;
                netPay = grossEarnings - totalDed;
            }

            // Row background (alternating)
            if (sno % 2 === 0) {
                doc.rect(startX, y - 2, totalWidth, 38).fill('#fafafa');
            }
            
            let cx = startX;
            doc.fillColor('black');
            
            // S.No
            doc.text(sno.toString(), cx, y + 10, { width: cols[0].w, align: 'center' });
            cx += cols[0].w;
            
            // Name Block (multi-line)
            doc.font('Helvetica-Bold').fontSize(7).text(u.name?.toUpperCase() || '-', cx, y, { width: cols[1].w - 4 });
            doc.font('Helvetica').fontSize(6).text(`S/o ${u.fatherName?.toUpperCase() || 'N/A'}`, cx, y + 10, { width: cols[1].w - 4 });
            doc.text(`${u.epfoNumber || 'XXXXXXXX'}`, cx, y + 18, { width: cols[1].w - 4 });
            doc.text(`UAN No. ${u.epfoNumber || 'XXXXXXXXXX'}`, cx, y + 26, { width: cols[1].w - 4 });
            cx += cols[1].w;
            
            // Designation
            doc.fontSize(6).text(u.designation?.toUpperCase() || '-', cx, y + 10, { width: cols[2].w - 4 });
            cx += cols[2].w;
            
            // Salary Rate
            doc.fontSize(7).text(Math.round(salaryRate).toLocaleString(), cx, y + 5, { width: cols[3].w - 4, align: 'right' });
            cx += cols[3].w;
            
            // Days
            doc.text(days.toString(), cx, y + 10, { width: cols[4].w - 4, align: 'center' });
            cx += cols[4].w;
            
            // Earnings
            doc.text(Math.round(basic).toLocaleString(), cx, y + 10, { width: cols[5].w - 4, align: 'right' });
            cx += cols[5].w;
            doc.text(Math.round(hra).toLocaleString(), cx, y + 10, { width: cols[6].w - 4, align: 'right' });
            cx += cols[6].w;
            doc.text(Math.round(conv).toLocaleString(), cx, y + 10, { width: cols[7].w - 4, align: 'right' });
            cx += cols[7].w;
            doc.text(Math.round(other).toLocaleString(), cx, y + 10, { width: cols[8].w - 4, align: 'right' });
            cx += cols[8].w;
            doc.font('Helvetica-Bold').text(Math.round(grossEarnings).toLocaleString(), cx, y + 10, { width: cols[9].w - 4, align: 'right' });
            cx += cols[9].w;
            
            // Deductions
            doc.font('Helvetica').text(Math.round(pfDed).toLocaleString(), cx, y + 10, { width: cols[10].w - 4, align: 'right' });
            cx += cols[10].w;
            doc.text(Math.round(esiDed).toLocaleString(), cx, y + 10, { width: cols[11].w - 4, align: 'right' });
            cx += cols[11].w;
            doc.text(Math.round(advanceDed).toLocaleString(), cx, y + 10, { width: cols[12].w - 4, align: 'right' });
            cx += cols[12].w;
            doc.text(Math.round(otherDed).toLocaleString(), cx, y + 10, { width: cols[13].w - 4, align: 'right' });
            cx += cols[13].w;
            doc.text(Math.round(tdsDed).toLocaleString(), cx, y + 10, { width: cols[14].w - 4, align: 'right' });
            cx += cols[14].w;
            doc.font('Helvetica-Bold').text(Math.round(totalDed).toLocaleString(), cx, y + 10, { width: cols[15].w - 4, align: 'right' });
            cx += cols[15].w;
            
            // Net Payable
            doc.fillColor(THEME_COLOR).text(Math.round(netPay).toLocaleString(), cx, y + 10, { width: cols[16].w - 4, align: 'right' });
            cx += cols[16].w;
            
            // Signature (empty)
            doc.fillColor('black').text('', cx, y + 10, { width: cols[17].w - 4 });
            
            // Row separator
            doc.moveTo(startX, y + 38).lineTo(startX + totalWidth, y + 38).strokeColor('#e2e8f0').stroke();
            
            y += 40;
            sno++;
        });

        // Footer - System Generated Notice
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748B');
        doc.text('This is a system generated salary sheet and does not require a signature.', startX, y + 20, { width: totalWidth, align: 'center' });

        doc.end();
    } catch(e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

// --- PAYROLL RECORD CRUD ---
// Get payroll record for a user/month
app.get('/api/hr/payroll-record', async (req, res) => {
    const { userId, month } = req.query;
    try {
        const record = await prisma.payrollRecord.findUnique({
            where: { userId_month: { userId, month } }
        });
        res.json(record || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch payroll record' });
    }
});

// Save/Update payroll record
app.post('/api/hr/payroll-record', async (req, res) => {
    const data = req.body;
    try {
        // Calculate totals
        const grossEarnings = (data.basic || 0) + (data.hra || 0) + (data.conveyance || 0) + (data.otherEarnings || 0);
        const totalDeductions = (data.pf || 0) + (data.esi || 0) + (data.advance || 0) + (data.tds || 0) + (data.otherDeductions || 0);
        const netPayable = grossEarnings - totalDeductions;
        
        const record = await prisma.payrollRecord.upsert({
            where: { userId_month: { userId: data.userId, month: data.month } },
            update: {
                daysWorked: data.daysWorked || 26,
                basic: data.basic || 0,
                hra: data.hra || 0,
                conveyance: data.conveyance || 0,
                otherEarnings: data.otherEarnings || 0,
                grossEarnings,
                pf: data.pf || 0,
                esi: data.esi || 0,
                advance: data.advance || 0,
                tds: data.tds || 0,
                otherDeductions: data.otherDeductions || 0,
                totalDeductions,
                netPayable
            },
            create: {
                userId: data.userId,
                month: data.month,
                daysWorked: data.daysWorked || 26,
                basic: data.basic || 0,
                hra: data.hra || 0,
                conveyance: data.conveyance || 0,
                otherEarnings: data.otherEarnings || 0,
                grossEarnings,
                pf: data.pf || 0,
                esi: data.esi || 0,
                advance: data.advance || 0,
                tds: data.tds || 0,
                otherDeductions: data.otherDeductions || 0,
                totalDeductions,
                netPayable
            }
        });
        res.json({ success: true, record });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save payroll record' });
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
            password: '12345',
            
            // Application Form Fields
            positionAppliedFor: data.positionAppliedFor,
            educationInstitution: data.educationInstitution,
            educationDegree: data.educationDegree,
            educationYearCompleted: data.educationYearCompleted,
            previousCompany: data.previousCompany,
            previousPosition: data.previousPosition,
            previousEmploymentDates: data.previousEmploymentDates,
            skillsQualifications: data.skillsQualifications,
            referenceName: data.referenceName,
            referenceRelationship: data.referenceRelationship,
            referencePhone: data.referencePhone,
            applicantSignature: data.applicantSignature
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

// Update Employee Endpoint
app.post('/api/hr/update-employee', async (req, res) => {
    const data = req.body;
    try {
        if (!data.id) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        // Prepare update data (exclude ID from updates)
        const updateData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            department: data.department,
            designation: data.designation,
            shift: data.shift,
            
            // Salary fields
            hourlyRate: data.role === 'worker' ? parseFloat(data.baseRate || data.hourlyRate) : null,
            monthlySalary: data.role === 'employee' ? parseFloat(data.monthlySalary) : null,
            ctc: data.role === 'employee' ? parseFloat(data.baseRate || data.ctc) : null,
            
            // Financial Engine Fields
            esicNumber: data.esicNumber,
            epfoNumber: data.epfoNumber,
            esicEnabled: data.esicEnabled || false,
            epfoEnabled: data.epfoEnabled !== undefined ? data.epfoEnabled : true,
            advanceAmount: parseFloat(data.advanceAmount) || 0,
            loanAmount: parseFloat(data.loanAmount) || 0,
            tdsEnabled: data.tdsEnabled || false,
            
            // Application Form Fields
            positionAppliedFor: data.positionAppliedFor,
            educationInstitution: data.educationInstitution,
            educationDegree: data.educationDegree,
            educationYearCompleted: data.educationYearCompleted,
            previousCompany: data.previousCompany,
            previousPosition: data.previousPosition,
            previousEmploymentDates: data.previousEmploymentDates,
            skillsQualifications: data.skillsQualifications,
            referenceName: data.referenceName,
            referenceRelationship: data.referenceRelationship,
            referencePhone: data.referencePhone,
            applicantSignature: data.applicantSignature
        };

        const updatedUser = await prisma.user.update({
            where: { id: data.id },
            data: updateData
        });

        res.json({ success: true, user: updatedUser });
    } catch (e) {
        console.error('Update Error:', e.message);
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

        // Reduced margins to fit content on one page
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Application_${user.name}.pdf`);
        doc.pipe(res);

        // --- CONSTANTS ---
        const THEME_COLOR = '#6200EA'; 
        const BORDER_COLOR = '#CBD5E1'; 
        const TEXT_MAIN = '#1E293B';
        const TEXT_LABEL = '#64748B';

        // --- HELPER FUNCTIONS ---
        // Helper to draw fields with Specific Dummy Data
        const drawField = (label, value, dummyValue, x, y, w, h = 30) => {
            // Label
            doc.fontSize(7).fillColor(TEXT_LABEL).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
            
            // Box
            doc.rect(x, y + 10, w, h).strokeColor(BORDER_COLOR).stroke();
            
            // Value or Realistic Dummy Placeholder
            const cleanValue = value ? String(value).trim() : '';
            const displayValue = cleanValue.length > 0 ? cleanValue : dummyValue;
            
            // Use lighter color for placeholders
            const isPlaceholder = displayValue === dummyValue;
            
            doc.fontSize(9).fillColor(isPlaceholder ? '#94A3B8' : TEXT_MAIN).font('Helvetica')
               .text(displayValue, x + 5, y + 18, { width: w - 10, ellipsis: true });
        };

        const drawSectionHeader = (title, yPos) => {
            doc.rect(30, yPos, 535, 20).fill('#EDE7F6');
            doc.fontSize(10).fillColor(THEME_COLOR).font('Helvetica-Bold').text(title.toUpperCase(), 40, yPos + 6);
            return yPos + 30; // Return next Y position
        };

        // --- HEADER (Compact) ---
        doc.rect(0, 0, 595.28, 60).fill(THEME_COLOR);
        doc.fontSize(18).fillColor('white').font('Helvetica-Bold').text('JOB APPLICATION FORM', 30, 22);
        if (company?.name) {
            doc.fontSize(9).font('Helvetica').text(company.name.toUpperCase(), 350, 20, { width: 215, align: 'right' });
            doc.fontSize(7).text('CONFIDENTIAL', 350, 32, { width: 215, align: 'right', opacity: 0.8 });
        }
        
        let y = 80;

        // --- 1. APPLIED POSITION ---
        drawField('Position Applied For', user.positionAppliedFor || user.designation, 'Software Engineer', 30, y, 535);
        y += 50;

        // --- 2. PERSONAL INFORMATION ---
        y = drawSectionHeader('Personal Information', y);
        
        // Row 1
        drawField('Full Name', user.name, 'John Doe', 30, y, 260);
        drawField('Address', user.address, '123 Tech Park, Silicon Valley, CA', 305, y, 260);
        y += 45;

        // Row 2
        drawField('Phone Number', user.phone, '+1 (555) 123-4567', 30, y, 260);
        drawField('Email Address', user.email, 'john.doe@example.com', 305, y, 260);
        y += 55;

        // --- 3. EDUCATION ---
        y = drawSectionHeader('Education', y);
        
        drawField('School / Institution', user.educationInstitution, 'State University of Technology', 30, y, 170);
        drawField('Degree / Certification', user.educationDegree, 'B.Sc. Computer Science', 210, y, 170);
        drawField('Year Completed', user.educationYearCompleted, '2023', 390, y, 175);
        y += 55;

        // --- 4. EMPLOYMENT HISTORY ---
        y = drawSectionHeader('Recent Employment History', y);
        
        drawField('Company Name', user.previousCompany, 'Global Tech Solutions Inc.', 30, y, 170);
        drawField('Position Held', user.previousPosition, 'Junior Developer', 210, y, 170);
        drawField('Employment Dates', user.previousEmploymentDates, 'Jan 2021 - Dec 2023', 390, y, 175);
        y += 55;

        // --- 5. SKILLS & QUALIFICATIONS ---
        y = drawSectionHeader('Skills & Qualifications', y);
        
        doc.fontSize(7).fillColor(TEXT_LABEL).font('Helvetica-Bold').text('RELEVANT SKILLS, CERTIFICATIONS, OR QUALIFICATIONS', 30, y);
        doc.rect(30, y + 10, 535, 45).strokeColor(BORDER_COLOR).stroke();
        
        const dummySkills = 'JavaScript, React, Node.js, PostgreSQL, Team Leadership, Agile Methodology';
        const skillsText = (user.skillsQualifications && user.skillsQualifications.trim().length > 0) ? user.skillsQualifications : dummySkills;
        
        doc.fontSize(9).fillColor((user.skillsQualifications && user.skillsQualifications.trim().length > 0) ? TEXT_MAIN : '#94A3B8').font('Helvetica')
           .text(skillsText, 35, y + 18, { width: 525, height: 35, ellipsis: true });
        y += 65;

        // --- 6. REFERENCES ---
        y = drawSectionHeader('References', y);
        
        drawField('Reference Name', user.referenceName, 'Jane Smith', 30, y, 170);
        drawField('Relationship', user.referenceRelationship, 'Project Manager', 210, y, 170);
        drawField('Phone Number', user.referencePhone, '+1 (555) 987-6543', 390, y, 175);
        y += 55;

        // --- 7. DECLARATION ---
        doc.fontSize(8).fillColor('#64748B').font('Helvetica-Oblique').text(
            'I certify that the information provided in this application is accurate and complete. I understand that providing false information may result in disqualification from consideration for employment.',
            30, y, { width: 535, align: 'justify' }
        );
        y += 35;

        // --- 8. SIGNATURE (Compact) ---
        drawField('Applicant Signature', user.applicantSignature, 'John Doe (Signed)', 365, y, 200, 35);
        
        // Date Field
        drawField('Date', new Date().toLocaleDateString(), new Date().toLocaleDateString(), 30, y, 150, 35);

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
