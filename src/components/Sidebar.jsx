import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Calendar, User, Factory, LogOut, ChevronLeft, Clock } from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-box">
                    <Factory size={22} color="white" strokeWidth={2} />
                </div>
                <div className="brand-info">
                    <span className="brand-name">Aura HRMS</span>
                    <span className="brand-tagline">Enterprise Edition</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>
                {user?.role === 'worker' ? (
                    <>
                        <NavLink to="/" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Home size={18} />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/history" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <History size={18} />
                            <span>Activity Logs</span>
                        </NavLink>
                        <NavLink to="/leave" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Calendar size={18} />
                            <span>Leave Control</span>
                        </NavLink>
                        <NavLink to="/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <User size={18} />
                            <span>Account Details</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        <NavLink to="/hr/" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Home size={18} />
                            <span>HR Intelligence</span>
                        </NavLink>
                        <NavLink to="/hr/employees" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <User size={18} />
                            <span>Talent Pool</span>
                        </NavLink>
                        <NavLink to="/hr/attendance" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Clock size={18} />
                            <span>Attendance Logs</span>
                        </NavLink>
                        <NavLink to="/hr/leave-approvals" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Calendar size={18} />
                            <span>Leave Approvals</span>
                        </NavLink>
                        <NavLink to="/hr/payroll" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <Factory size={18} />
                            <span>Financial Engine</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="avatar-chip">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info-stack">
                        <span className="display-name">{user?.name || 'User'}</span>
                        <span className="display-id">#{user?.id}</span>
                    </div>
                </div>
                <button className="logout-action" onClick={onLogout} title="Sign Out">
                    <LogOut size={16} />
                </button>
            </div>

            <style jsx>{`
                .sidebar {
                    width: 300px;
                    background-color: #ffffff;
                    border-right: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    box-shadow: 10px 0 30px rgba(0,0,0,0.02);
                }

                .sidebar-header {
                    padding: 40px 24px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .logo-box {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 16px rgba(98, 0, 234, 0.2);
                }

                .brand-info { display: flex; flex-direction: column; }

                .brand-name {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: var(--primary-dark);
                    letter-spacing: -0.02em;
                    line-height: 1;
                }

                .brand-tagline {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 4px;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 0 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .nav-section-label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #cbd5e1;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 0 16px 12px;
                    margin-top: 20px;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    text-decoration: none;
                    color: #64748b;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .sidebar-item:hover {
                    background-color: #f8fafc;
                    color: var(--primary);
                    padding-left: 20px;
                }

                .sidebar-item.active {
                    background-color: var(--background);
                    color: var(--primary);
                    box-shadow: inset 0 0 0 1px #e2e8f0;
                }

                .sidebar-footer {
                    margin: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid #f1f5f9;
                }

                .user-profile-mini {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .avatar-chip {
                    width: 36px;
                    height: 36px;
                    background-color: white;
                    color: var(--primary);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.9rem;
                    border: 1px solid #e2e8f0;
                }

                .user-info-stack {
                    display: flex;
                    flex-direction: column;
                }

                .display-name {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--text-main);
                    max-width: 100px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .display-id {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #94a3b8;
                }

                .logout-action {
                    background: white;
                    border: 1px solid #f1f5f9;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 10px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logout-action:hover {
                    background-color: #fff1f2;
                    color: var(--danger);
                    border-color: #fecaca;
                    transform: translateX(2px);
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
