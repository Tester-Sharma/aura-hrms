import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import LeaveApplication from './pages/LeaveApplication';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HRLeaveApprovals from './pages/hr/HRLeaveApprovals';
import HRPayroll from './pages/hr/HRPayroll';

function App() {
    const [user, setUser] = useState(null);
    const [isDesktopMode, setIsDesktopMode] = useState(false);

    const handleLogin = (userData) => {
        setUser(userData);
        // Force desktop mode for HR users
        if (userData.role === 'hr') {
            setIsDesktopMode(true);
        }
    };

    return (
        <div className={`simulator-dead-zone ${isDesktopMode ? 'desktop-mode' : ''}`}>
            {/* View Toggle Button - Hide for HR */}
            {user?.role !== 'hr' && (
                <button
                    className="view-toggle-btn"
                    onClick={() => setIsDesktopMode(!isDesktopMode)}
                    title={isDesktopMode ? "Switch to Mobile Mode" : "Switch to Desktop Mode"}
                >
                    {isDesktopMode ? <Smartphone size={20} /> : <Monitor size={20} />}
                    <span>{isDesktopMode ? 'Mobile' : 'Desktop'}</span>
                </button>
            )}

            <div className="simulator-live-zone">
                <Router>
                    {user && isDesktopMode && <Sidebar user={user} onLogout={() => setUser(null)} />}

                    <div className={isDesktopMode ? "main-content" : ""}>
                        <Routes>
                            <Route
                                path="/login"
                                element={user ? <Navigate to="/" /> : <Login onLoginSuccess={handleLogin} />}
                            />

                            {/* Role-Based Dashboards */}
                            <Route
                                path="/"
                                element={
                                    user ? (
                                        user.role === 'hr' ?
                                            <HRDashboard user={user} isDesktop={isDesktopMode} /> :
                                            <Dashboard user={user} isDesktop={isDesktopMode} />
                                    ) : <Navigate to="/login" />
                                }
                            />

                            {/* Worker Routes */}
                            <Route
                                path="/history"
                                element={user && user.role === 'worker' ? <AttendanceHistory isDesktop={isDesktopMode} /> : <Navigate to="/" />}
                            />
                            <Route
                                path="/leave"
                                element={user && user.role === 'worker' ? <LeaveApplication isDesktop={isDesktopMode} /> : <Navigate to="/" />}
                            />
                            <Route
                                path="/profile"
                                element={user ? <Profile user={user} onLogout={() => setUser(null)} isDesktop={isDesktopMode} /> : <Navigate to="/login" />}
                            />

                            {/* HR Routes */}
                            <Route
                                path="/employees"
                                element={user && user.role === 'hr' ? <HREmployees isDesktop={isDesktopMode} /> : <Navigate to="/" />}
                            />
                            <Route
                                path="/leave-approvals"
                                element={user && user.role === 'hr' ? <HRLeaveApprovals isDesktop={isDesktopMode} /> : <Navigate to="/" />}
                            />
                            <Route
                                path="/payroll"
                                element={user && user.role === 'hr' ? <HRPayroll isDesktop={isDesktopMode} /> : <Navigate to="/" />}
                            />
                        </Routes>
                    </div>

                    {user && !isDesktopMode && <BottomNav isDesktop={isDesktopMode} />}
                </Router>
            </div>

            <style jsx>{`
                .view-toggle-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${isDesktopMode ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    font-weight: 600;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .view-toggle-btn:hover {
                    background: var(--primary);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}

export default App;
