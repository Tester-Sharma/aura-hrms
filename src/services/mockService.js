/**
 * Mock Service Layer for Worker Portal UI
 * This service simulates API calls to a backend server.
 * All methods return Promises to mimic asynchronous behavior.
 */

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory mock database
let employees = [
    {
        id: 'W-1024',
        name: 'John Doe',
        role: 'worker',
        designation: 'Assembly Specialist',
        department: 'Production',
        type: 'Worker',
        hourlyRate: 15.00,
        shift: '09:00 AM - 05:00 PM',
        joiningDate: '2022-03-15',
        phone: '9876543210',
        email: 'john.doe@aura.inc',
        address: '123, Industrial Area, Sector 4'
    },
    {
        id: 'E-124',
        name: 'Jane Smith',
        role: 'employee',
        designation: 'Production Lead',
        department: 'Production',
        type: 'Employee',
        monthlySalary: 50000, // Monthly Base
        ctc: 600000, // Yearly CTC
        shift: '09:00 AM - 05:00 PM',
        joiningDate: '2021-06-01',
        phone: '9876543211',
        email: 'jane.smith@aura.inc',
        salaryBreakdown: {
            basic: 25000,
            hra: 12500,
            specialAllowance: 7500,
            pf: 3000,
            pt: 200,
            netPayable: 41800
        }
    },
    { id: 'E-125', name: 'Robert Brown', designation: 'QA Inspector', type: 'Worker', hourlyRate: 18, department: 'Quality', role: 'worker', shift: '09:00 AM - 05:00 PM' },
    { id: 'E-126', name: 'Michael Wilson', designation: 'Maintenance', type: 'Worker', hourlyRate: 14, department: 'Production', role: 'worker', shift: '09:00 AM - 05:00 PM' }
];

let leaveRequests = [
    { id: 'REQ-101', employeeName: 'Michael Wilson', employeeId: 'E-126', type: 'Sick Leave', fromDate: '2023-11-15', toDate: '2023-11-16', reason: 'Flu', status: 'Pending' },
    { id: 'REQ-102', employeeName: 'John Doe', employeeId: 'W-1024', type: 'Casual Leave', fromDate: '2023-11-20', toDate: '2023-11-20', reason: 'Family event', status: 'Pending' }
];

const mockService = {
    /**
     * @api POST /api/auth/login
     */
    login: async (credentials) => {
        await delay(800);
        if (credentials.id === 'H-101' && credentials.password === '12345') {
            return {
                id: 'H-101',
                name: 'Anjali Sharma',
                role: 'hr',
                designation: 'HR Manager',
                department: 'Human Resources'
            };
        }

        const user = employees.find(e => e.id === credentials.id);
        if (user && credentials.password === '12345') {
            return {
                ...user,
                // Ensure critical fields are present
                hourlyRate: user.hourlyRate || 0
            };
        }
        throw new Error('Invalid credentials');
    },

    /**
     * @api GET /api/worker/dashboard
     */
    getDashboardData: async () => {
        await delay(600);
        return {
            stats: {
                workedHours: 145,
                overtime: 12,
                leaveBalance: 5,
                estimatedEarnings: 2400
            },
            notices: [
                { id: '1', text: 'Safety inspection at 2 PM' },
                { id: '2', text: 'Holiday on Friday' },
                { id: '3', text: 'New uniforms distribution tomorrow' }
            ]
        };
    },

    /**
     * @api POST /api/attendance/punch-in
     */
    punchIn: async () => {
        await delay(400);
        return { success: true, timestamp: new Date().toISOString() };
    },

    /**
     * @api POST /api/attendance/punch-out
     */
    punchOut: async () => {
        await delay(400);
        return { success: true, timestamp: new Date().toISOString() };
    },

    /**
     * @api GET /api/worker/attendance-history
     */
    getAttendanceHistory: async (month) => {
        await delay(700);
        // Stats for the stats cards
        const stats = {
            totalDays: 22,
            presentDays: 18,
            totalHours: 176,
            workedHours: 145,
            pendingHours: 31,
            otHours: 12
        };

        const history = [
            { date: 'Oct 24, Mon', in: '09:00 AM', out: '05:00 PM', total: 8, ot: 0, status: 'Present' },
            { date: 'Oct 25, Tue', in: '08:50 AM', out: '06:00 PM', total: 9, ot: 1, status: 'Present' },
            { date: 'Oct 26, Wed', in: '09:05 AM', out: '05:05 PM', total: 8, ot: 0, status: 'Present' },
            { date: 'Oct 27, Thu', in: '-', out: '-', total: 0, ot: 0, status: 'Leave' },
            { date: 'Oct 28, Fri', in: '09:00 AM', out: '05:00 PM', total: 8, ot: 0, status: 'Present' },
            { date: 'Oct 31, Mon', in: '09:10 AM', out: '05:10 PM', total: 8, ot: 0, status: 'Present' },
        ];

        return { stats, history };
    },

    /**
     * @api POST /api/worker/apply-leave
     */
    applyLeave: async (leaveData) => {
        await delay(1000);
        const newReq = {
            id: 'REQ-' + Math.floor(Math.random() * 10000),
            ...leaveData,
            status: 'Pending',
            employeeName: 'John Doe',
            employeeId: 'W-1024'
        };
        leaveRequests.push(newReq);
        return { success: true, requestId: newReq.id };
    },

    /**
     * @api GET /api/worker/leave-stats
     */
    getLeaveStats: async () => {
        await delay(500);
        // Calculate mock stats
        return {
            totalBalance: 12,
            used: 4,
            pending: 1,
            available: 7
        };
    },

    /**
     * @api GET /api/worker/profile
     */
    getProfile: async () => {
        await delay(500);
        // Default mock user for profile page if no specific ID passed (simulating session)
        return employees[1]; // Return the Employee one to show salary breakdown or [0] for worker
    },

    /**
     * @api GET /api/worker/download-payslip
     */
    downloadPayslip: async () => {
        await delay(1500);
        return { success: true, url: '#' };
    },

    // --- HR SPECIFIC METHODS ---

    /**
     * @api GET /api/hr/dashboard-stats
     */
    getHRDashboardStats: async () => {
        await delay(700);
        return {
            totalEmployees: employees.length,
            pendingLeaves: leaveRequests.filter(r => r.status === 'Pending').length,
            activeShiftWorkers: 85,
            monthlyPayrollTotal: 450000,
            departmentDistribution: [
                { name: 'Production', count: 80 },
                { name: 'Assembly', count: 25 },
                { name: 'Quality', count: 12 },
                { name: 'HR/Admin', count: 7 }
            ]
        };
    },

    /**
     * @api GET /api/hr/employees
     */
    getEmployees: async () => {
        await delay(800);
        return [...employees];
    },

    /**
     * @api POST /api/hr/register-employee
     */
    registerEmployee: async (employeeData) => {
        await delay(1000);
        const newEmployee = {
            id: employeeData.type === 'Worker' ? `W-${1000 + employees.length + 1}` : `E-${100 + employees.length + 1}`,
            ...employeeData
        };
        employees.push(newEmployee);
        return { success: true, employee: newEmployee };
    },

    /**
     * @api GET /api/hr/employee-details/:id
     */
    getEmployeeDetails: async (id) => {
        await delay(600);
        const emp = employees.find(e => e.id === id);
        if (!emp) throw new Error("Employee not found");
        return emp;
    },

    /**
     * @api GET /api/hr/pending-leaves
     */
    getPendingLeaves: async () => {
        await delay(600);
        return leaveRequests.filter(r => r.status === 'Pending');
    },

    /**
     * @api POST /api/hr/update-leave-status
     */
    updateLeaveStatus: async (requestId, status) => {
        await delay(500);
        const reqIndex = leaveRequests.findIndex(r => r.id === requestId);
        if (reqIndex >= 0) {
            leaveRequests[reqIndex].status = status;
            return { success: true, status: status, id: requestId };
        }
        throw new Error("Request not found");
    },

    /**
     * @api GET /api/hr/payroll-summary
     */
    getPayrollSummary: async (month) => {
        await delay(1000);
        return {
            month: month,
            totalGross: 450000,
            totalDeductions: 85000,
            netPayable: 365000,
            breakdown: employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                workedHours: 160,
                otHours: emp.type === 'Worker' ? 10 : 0,
                totalPay: emp.type === 'Worker' ? (160 * emp.hourlyRate) + (10 * emp.hourlyRate * 1.5) : (emp.monthlySalary || 0)
            }))
        };
    }
};

export default mockService;
