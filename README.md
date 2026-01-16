# Aura HRMS (Human Resource Management System)

**Aura HRMS** is a modern, dual-portal application capable of managing both industrial workforce (hourly/shift-based) and corporate employees (salary-based). It features a distinct separation of concerns between Worker and HR portals, running on a single codebase with dynamic entry points.

## 🚀 Key Features

### 🏭 Worker Portal (Industrial & Corporate)
- **Dashboard**: Real-time clock, punch-in/out controls, and shift notices.
- **Attendance**: Detailed daily logs, overtime tracking, and monthly visualization.
- **Leave Management**: Apply for leave, view balance, and track status.
- **Payroll**: Download payslips and view detailed salary/wage breakdowns.
- **Role-Based Profile**: Differentiates between Hourly Workers and Salaried Employees.

### 🏢 HR Corporate Portal
- **Dashboard Analytics**: Bird's-eye view of workforce attendance, leave requests, and payroll estimates.
- **Talent Pool**:
  - Comprehensive employee directory.
  - **Recruitment Wizard**: Register new hires with an integrated **Salary Calculator** (CTC - > Breakdown).
- **Attendance Monitoring**: centralized logs for all staff with monthly drill-down views.
- **Leave Approvals**: One-click Approve/Reject workflow for manager requests.
- **Financial Engine**: Payroll summary and disbursement tracking.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS (Variables, Glassmorphism design system)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Architecture**: Dual-Port simulation on Localhost
  - `Worker App`: Port 5173
  - `HR App`: Port 5174

---

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Start-Up-Inc/HRRMS.git
    cd HRRMS
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run the Application**
    The app runs two simultaneous servers for the simulation:

    *   **Worker Portal**:
        ```bash
        npm run dev:worker
        # Runs on http://localhost:5173
        ```

    *   **HR Portal**:
        ```bash
        npm run dev:hr
        # Runs on http://localhost:5174
        ```

---

## 🔐 Default Credentials

| Portal | User ID | Password | Role |
| :--- | :--- | :--- | :--- |
| **Worker** | `W-1024` | `12345` | Hourly Worker |
| **Corporate**| `E-124` | `12345` | Salaried Employee |
| **HR Admin** | `H-101` | `12345` | HR Manager |

---

## 📂 Project Structure

```
src/
├── components/         # Shared UI (Sidebar, Nav, etc.)
├── pages/
│   ├── Login.jsx       # Worker/Employee Login
│   ├── HRLogin.jsx     # Corporate Admin Login
│   ├── hr/             # HR Specific Modules
│   └── ...             # Worker Specific Modules
├── services/
│   └── mockService.js  # API Simulation Layer
├── main-worker.jsx     # Entry point for Worker App
└── main-hr.jsx         # Entry point for HR App
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
