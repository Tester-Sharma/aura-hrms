/**
 * API Service Layer
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getUserId = () => localStorage.getItem('currentUserId') || 'W-101';

const request = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const config = {
            ...options,
            headers,
            cache: 'no-store' // Critical for preventing stale data
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (data && data.success === false) {
            throw new Error(data.message || 'API Error');
        }

        return data; // Return full response
    } catch (error) {
        throw error;
    }
};

const mockService = {
    // --- AUTH ---
    login: async (credentials) => {
        const user = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        localStorage.setItem('currentUserId', user.id);
        return user;
    },

    // --- WORKER DASHBOARD ---
    getDashboardData: async () => {
        const userId = getUserId();
        // Backend v2.0 expects userId query param
        return request(`/worker/dashboard?userId=${userId}`);
    },

    // --- ATTENDANCE ---
    punchIn: async () => {
        const userId = getUserId();
        return request('/attendance/punch-in', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    },

    punchOut: async () => {
        const userId = getUserId();
        return request('/attendance/punch-out', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    },

    getAttendanceHistory: async (month) => {
        const userId = getUserId();
        // Backend expects month like '2023-11'
        return request(`/worker/attendance-history?userId=${userId}&month=${month}`);
    },

    // --- LEAVES ---
    applyLeave: async (leaveData) => {
        const userId = getUserId();
        return request('/worker/apply-leave', {
            method: 'POST',
            body: JSON.stringify({ ...leaveData, userId })
        });
    },

    getLeaveStats: async () => {
        const userId = getUserId();
        return request(`/worker/leave-stats?userId=${userId}`);
    },

    getMyLeaves: async () => {
        const userId = getUserId();
        return request(`/worker/my-leaves?userId=${userId}`);
    },

    // --- PROFILE ---
    getProfile: async () => {
        const userId = getUserId();
        return request(`/worker/profile?userId=${userId}`);
    },

    downloadPayslip: async () => {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/worker/download-payslip?userId=${userId}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        
        // Trigger Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${userId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    },

    // --- HR PORTAL ---
    getHRDashboardStats: async () => {
        return request('/hr/dashboard-stats');
    },

    getEmployees: async () => {
        return request('/hr/employees');
    },

    registerEmployee: async (data) => {
        return request('/hr/register-employee', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getEmployeeDetails: async (id) => {
        return request(`/worker/profile?userId=${id}`);
    },

    getPendingLeaves: async () => {
        return request('/hr/pending-leaves');
    },

    updateLeaveStatus: async (requestId, status) => {
        return request('/hr/update-leave-status', {
            method: 'POST',
            body: JSON.stringify({ requestId, status })
        });
    },

    getPayrollSummary: async (month) => {
        return request(`/hr/payroll-summary?month=${month}`);
    },

    getAttendanceToday: async () => {
        return request('/hr/attendance-today');
    },

    getEmployeeAttendanceHistory: async (userId, month) => {
        return request(`/hr/attendance-history/${userId}?month=${month}`);
    }
};

export default mockService;
