import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HRLogin from './pages/HRLogin';
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HRLeaveApprovals from './pages/hr/HRLeaveApprovals';
import HRPayroll from './pages/hr/HRPayroll';
import HRAttendance from './pages/hr/HRAttendance';
import HRCompanyProfile from './pages/hr/HRCompanyProfile';
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';

function HRApp() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        // Filter: only allow HRs
        if (userData.role !== 'hr') {
            alert("This is the Corporate HR Portal. Please use the Worker Portal at /");
            return;
        }
        setUser(userData);
    };

    return (
        <div className="simulator-dead-zone desktop-mode">
            <div className="simulator-live-zone" style={{ width: '100%', height: '100vh', borderRadius: 0, boxShadow: 'none', maxWidth: 'none', border: 'none', display: 'grid', gridTemplateColumns: user ? '300px 1fr' : '1fr' }}>
                
                {user && <Sidebar user={user} onLogout={() => setUser(null)} />}

                <div className={user ? "main-content" : ""}>
                    <Routes>
                        <Route
                            path="/login"
                            element={user ? <Navigate to="/hr/" /> : <HRLogin onLoginSuccess={handleLogin} />}
                        />

                        {/* HR Only Routes */}
                        <Route
                            path="/"
                            element={user ? <HRDashboard user={user} isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/employees"
                            element={user ? <HREmployees isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/attendance"
                            element={user ? <HRAttendance isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/leave-approvals"
                            element={user ? <HRLeaveApprovals isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/payroll"
                            element={user ? <HRPayroll isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/company"
                            element={user ? <HRCompanyProfile isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route
                            path="/profile"
                            element={user ? <Profile user={user} onLogout={() => setUser(null)} isDesktop={true} /> : <Navigate to="/hr/login" />}
                        />
                        <Route path="*" element={<Navigate to="/hr/" />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

export default HRApp;
