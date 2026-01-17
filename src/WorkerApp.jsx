import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import LeaveApplication from './pages/LeaveApplication';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';

function WorkerApp() {
    const [user, setUser] = useState(null);
    const [isDesktopMode, setIsDesktopMode] = useState(false);

    const handleLogin = (userData) => {
        // Filter: only allow workers or handle role gracefully
        if (userData.role === 'hr') {
            alert("This is the Worker Portal. Please use the HR Portal at /hr");
            return;
        }
        setUser(userData);
    };

    return (
        <div className={`simulator-dead-zone ${isDesktopMode ? 'desktop-mode' : ''}`}>
            <button
                className="view-toggle-btn"
                onClick={() => setIsDesktopMode(!isDesktopMode)}
                title={isDesktopMode ? "Switch to Mobile Mode" : "Switch to Desktop Mode"}
            >
                {isDesktopMode ? <Smartphone size={20} /> : <Monitor size={20} />}
                <span>{isDesktopMode ? 'Mobile' : 'Desktop'}</span>
            </button>

            <div className="simulator-live-zone">
                {/* Note: Router is provided by App.jsx now */}
                <div className={isDesktopMode ? "main-content" : ""}>
                    <Routes>
                        <Route
                            path="/login"
                            element={user ? <Navigate to="/" /> : <Login onLoginSuccess={handleLogin} />}
                        />
                        <Route
                            path="/"
                            element={user ? <Dashboard user={user} isDesktop={isDesktopMode} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/history"
                            element={user ? <AttendanceHistory isDesktop={isDesktopMode} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/leave"
                            element={user ? <LeaveApplication isDesktop={isDesktopMode} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/profile"
                            element={user ? <Profile user={user} onLogout={() => setUser(null)} isDesktop={isDesktopMode} /> : <Navigate to="/login" />}
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
                {user && <BottomNav isDesktop={isDesktopMode} />}
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
                    gap: 12px;
                    cursor: pointer;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    font-weight: 600;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .view-toggle-btn:hover { background: var(--primary); transform: translateY(-2px); }
                
                /* Override grid layout for Worker portal in desktop mode */
                .simulator-dead-zone.desktop-mode .simulator-live-zone {
                    display: block !important;
                    grid-template-columns: none !important;
                }
            `}</style>
        </div>
    );
}

export default WorkerApp;
