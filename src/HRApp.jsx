import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HRLogin from './pages/HRLogin';
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HRLeaveApprovals from './pages/hr/HRLeaveApprovals';
import HRPayroll from './pages/hr/HRPayroll';
import HRAttendance from './pages/hr/HRAttendance';
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';

function HRApp() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        // Filter: only allow HRs
        if (userData.role !== 'hr') {
            alert("This is the Corporate HR Portal. Please use the Worker Portal at :5173");
            return;
        }
        setUser(userData);
    };

    return (
        <div className="simulator-dead-zone desktop-mode">
            <div className="simulator-live-zone" style={{ width: '100%', height: '100vh', borderRadius: 0, boxShadow: 'none', maxWidth: 'none', border: 'none', display: 'grid', gridTemplateColumns: user ? '300px 1fr' : '1fr' }}>
                <Router>
                    {user && <Sidebar user={user} onLogout={() => setUser(null)} />}

                    <div className={user ? "main-content" : ""}>
                        <Routes>
                            <Route
                                path="/login"
                                element={user ? <Navigate to="/" /> : <HRLogin onLoginSuccess={handleLogin} />}
                            />

                            {/* HR Only Routes */}
                            <Route
                                path="/"
                                element={user ? <HRDashboard user={user} isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route
                                path="/employees"
                                element={user ? <HREmployees isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route
                                path="/attendance"
                                element={user ? <HRAttendance isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route
                                path="/leave-approvals"
                                element={user ? <HRLeaveApprovals isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route
                                path="/payroll"
                                element={user ? <HRPayroll isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route
                                path="/profile"
                                element={user ? <Profile user={user} onLogout={() => setUser(null)} isDesktop={true} /> : <Navigate to="/login" />}
                            />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                </Router>
            </div>
        </div>
    );
}

export default HRApp;
