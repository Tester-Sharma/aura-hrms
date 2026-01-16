# Aura HRMS - Project Handover & Technical Documentation

This document serves as a comprehensive guide for **Backend Developers** and **Antigravity Agents** to understand the Aura HRMS frontend codebase, its architecture, and the requirements for backend integration.

---

## 1. Project Overview

**Aura HRMS** is a dual-portal application designed for manufacturing and corporate environments. It separates the "Worker" experience (hourly paid, shift-based) from the "Corporate HR" experience (salary-based, management).

### Key Features
*   **Worker Portal (:5173)**: Dashboard, Attendance History (Table & Stats), Leave Management, Profile with Salary Breakdown.
*   **HR Portal (:5174)**: Dashboard (Analytics), Talent Pool (CRUD + Salary Calc), Attendance Monitoring, Leave Approvals, Payroll Engine.
*   **Dual-Port Architecture**: The app runs on two separate ports using a single codebase, dynamically rendering `WorkerApp` or `HRApp` based on the entry point.

---

## 2. Technical Architecture

### Tech Stack
*   **Frontend**: React (Vite)
*   **Styling**: Vanilla CSS (Global Variables in `index.css`) + Lucide React (Icons)
*   **Routing**: `react-router-dom` v6
*   **Mock Data**: In-memory service (`src/services/mockService.js`) simulating async API calls.

### Directory Structure
```
src/
├── components/         # Shared UI components (Sidebar, BottomNav)
├── pages/
│   ├── Login.jsx       # Worker Login
│   ├── Dashboard.jsx   # Worker Dashboard
│   ├── ...             # Other Worker Pages
│   ├── HRLogin.jsx     # HR Corporate Login
│   └── hr/             # All HR-specific Pages (Dashboard, Employees, etc.)
├── services/
│   └── mockService.js  # CENTRAL DATA AUTHORITY (Replace with Real API)
├── App.jsx / Main.jsx  # Entry points (Split into main-worker.jsx & main-hr.jsx)
└── index.css           # Global Design System (Variables & Reset)
```

---

## 3. Data Models & Logic

### Employee Types
The system strictly distinguishes between two types of users:
1.  **Worker (`type: 'Worker'`)**:
    *   Paid via **Hourly Rate**.
    *   Focus on Shift Timing, OT, and Punch In/Out.
2.  **Employee (`type: 'Employee'`)**:
    *   Paid via **Fixed Monthly Salary (CTC)**.
    *   Focus on Salary Structure (Basic, HRA, PF, etc.).

### Salary Logic (Frontend Implementation in `HREmployees.jsx`)
*   **Calculator**: There is a built-in logic to reverse-calculate breakdown from Annual CTC:
    *   *Basic*: 50% of Monthly Gross
    *   *HRA*: 50% of Basic
    *   *PF*: 12% of Basic
    *   *Special Allowance*: Balance amount
    *   *Professional Tax*: Flat ₹200

---

## 4. API Integration Guide (For Backend Dev)

The frontend is currently powered by `src/services/mockService.js`. The backend developer needs to replace these mock functions with real REST API calls.

### **Authentication**
- `POST /api/auth/login`
    - **Input**: `{ id, password }`
    - **Output**: Full User Object + `role` ('worker' | 'hr')
    - **Critical**: Must return `hourlyRate` for workers and `salaryBreakdown` object for employees.

### **Worker Endpoints**
- `GET /api/worker/dashboard`: Returns widgets stats (Worked Hours, Earnings).
- `GET /api/worker/attendance?month=YYYY-MM`: Returns `stats` object + `history` array.
- `GET /api/worker/leave-stats`: Returns `{ totalBalance, used, pending }`.
- `POST /api/worker/apply-leave`: Accepts `{ fromDate, toDate, type, reason }`.

### **HR Endpoints**
- `GET /api/hr/employees`: List full roster.
- `GET /api/hr/attendance-overview`: Returns status of all employees for today.
- `GET /api/hr/employee-attendance/:id?month=YYYY-MM`: Detailed logs for one employee.
- `POST /api/hr/register`: Accepts full profile + `salaryBreakdown` JSON.
- `POST /api/hr/leave-action`: `{ requestId, status: 'Approved' | 'Rejected' }`.

---

## 5. Critical UI/UX Patterns (For Antigravity Agents)

When editing this project, adhere to these established patterns:

1.  **Glassmorphism**: Use the `.glass` class for cards/containers.
2.  **Gradients**: Use `var(--primary)` to `var(--primary-dark)` for key actions/headers.
3.  **Responsive Design**:
    *   **Mobile First**: Default styles are mobile.
    *   **Desktop Override**: Check `isDesktop={true}` prop or `.desktop-mode` class.
4.  **Simulation Mode**:
    *   The app lives inside a `.simulator-live-zone` container to mimic a mobile device on desktop screens unless "Desktop Mode" is toggled.

---

## 6. Known "Gotchas"
*   **Port-Based Rendering**: `main-worker.jsx` checks `window.location.port`. If `5174`, it renders `<HRApp />`, else `<WorkerApp />`. Do not break this check.
*   **Safe Rendering**: HR Dashboard relies on `safeStats` defaults. Ensure APIs always return valid null-safe JSON structure.
