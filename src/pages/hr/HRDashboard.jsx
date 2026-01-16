import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, DollarSign, Activity, PieChart, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import mockService from '../../services/mockService';

const HRDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await mockService.getHRDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch HR stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Activity className="animate-spin" size={48} color="var(--primary)" />
                <p>Curating HR Intelligence...</p>
            </div>
        );
    }

    // Safety check if stats failed to load
    const safeStats = stats || {
        totalEmployees: 0,
        activeShiftWorkers: 0,
        pendingLeaves: 0,
        monthlyPayrollTotal: 0,
        departmentDistribution: []
    };

    return (
        <div className="hr-dashboard-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>HR Intelligence</h1>
                    <p>Orchestrating {safeStats.totalEmployees} professionals across dynamic departments.</p>
                </div>
                <div className="header-actions">
                    <div className="date-pill">
                        <Calendar size={16} />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            <main className="hr-dashboard-content">
                <div className="content-wrapper">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-bg"><Users size={80} /></div>
                            <div className="stat-icon employees">
                                <Users size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-label">Total Staff</span>
                                <span className="stat-value">{safeStats.totalEmployees}</span>
                                <span className="stat-trend positive">
                                    <TrendingUp size={12} />
                                    <span>+4.2%</span>
                                </span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-bg"><Clock size={80} /></div>
                            <div className="stat-icon active-workers">
                                <Clock size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-label">On Premises</span>
                                <span className="stat-value">{safeStats.activeShiftWorkers}</span>
                                <span className="stat-trend neutral">
                                    <span>Live Sync</span>
                                </span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-bg"><AlertCircle size={80} /></div>
                            <div className="stat-icon leaves">
                                <Calendar size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-label">Pending Leaves</span>
                                <span className="stat-value">{safeStats.pendingLeaves}</span>
                                <button className="stat-action warning">Review Now</button>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-bg"><DollarSign size={80} /></div>
                            <div className="stat-icon payroll">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-label">Monthly Payroll</span>
                                <span className="stat-value">₹{(safeStats.monthlyPayrollTotal / 1000).toFixed(1)}K</span>
                                <span className="stat-trend neutral">
                                    <span>Oct Budget</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-layout">
                        <section className="dept-distribution glass">
                            <div className="section-title">
                                <PieChart size={20} color="var(--primary)" />
                                <h3>Department Allocation</h3>
                            </div>
                            <div className="dept-bars">
                                {safeStats.departmentDistribution.map((dept, index) => (
                                    <div key={index} className="dept-row">
                                        <div className="dept-info">
                                            <span className="dept-name">{dept.name}</span>
                                            <span className="dept-count">{dept.count}</span>
                                        </div>
                                        <div className="progress-bg">
                                            <div
                                                className="progress-fill"
                                                style={{ width: safeStats.totalEmployees > 0 ? `${(dept.count / safeStats.totalEmployees) * 100}%` : '0%' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="activity-feed glass">
                            <div className="section-title">
                                <Activity size={20} color="var(--primary)" />
                                <h3>Critical Actions</h3>
                            </div>
                            <div className="feed-items">
                                <div className="feed-item urgent">
                                    <div className="item-icon"><Calendar size={18} /></div>
                                    <div className="item-info">
                                        <p><strong>8 Leave Requests</strong> pending approval</p>
                                        <span>Action required for department budgets</span>
                                    </div>
                                    <button className="item-go"><ArrowUpRight size={18} /></button>
                                </div>
                                <div className="feed-item">
                                    <div className="item-icon"><DollarSign size={18} /></div>
                                    <div className="item-info">
                                        <p><strong>Payroll Cycle</strong> 90% finalized</p>
                                        <span>Ready for batch processing next Friday</span>
                                    </div>
                                    <button className="item-go"><ArrowUpRight size={18} /></button>
                                </div>
                                <div className="feed-item">
                                    <div className="item-icon"><Users size={18} /></div>
                                    <div className="item-info">
                                        <p><strong>Onboarding</strong> 2 new hires joined</p>
                                        <span>Completed for Quality & Safety team</span>
                                    </div>
                                    <button className="item-go"><ArrowUpRight size={18} /></button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .hr-dashboard-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--background);
                }

                .hr-page-header {
                    padding: 40px;
                    background: linear-gradient(135deg, var(--primary-dark) 0%, #1e1b4b 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: var(--shadow-md);
                }

                .header-content h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; }
                .header-content p { font-size: 1.1rem; color: #94a3b8; margin-top: 4px; }

                .date-pill {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px 20px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 700;
                }

                .hr-dashboard-content { flex: 1; overflow-y: auto; padding-top: 40px; }

                .content-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 40px 60px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                }

                .stat-card {
                    background: white;
                    padding: 30px;
                    border-radius: 32px;
                    box-shadow: var(--shadow-sm);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .stat-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }

                .stat-icon-bg {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    opacity: 0.03;
                    color: black;
                }

                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .stat-icon.employees { background: #ecfeff; color: #0891b2; }
                .stat-icon.leaves { background: #fff1f2; color: #e11d48; }
                .stat-icon.active-workers { background: #f0fdf4; color: #16a34a; }
                .stat-icon.payroll { background: #f5f3ff; color: #7c3aed; }

                .stat-data { display: flex; flex-direction: column; gap: 4px; }
                .stat-label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-value { font-size: 2.2rem; font-weight: 800; color: var(--text-main); }
                
                .stat-trend { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 700; margin-top: 8px; }
                .stat-trend.positive { color: #10b981; }
                .stat-trend.neutral { color: #94a3b8; }

                .stat-action {
                    margin-top: 12px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    border: none;
                    cursor: pointer;
                    width: fit-content;
                }
                .stat-action.warning { background: #fff1f2; color: #e11d48; }

                .dashboard-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 32px;
                }

                .glass {
                    background: white;
                    padding: 30px;
                    border-radius: 32px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid #f1f5f9;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 30px;
                }

                .section-title h3 { font-size: 1.3rem; font-weight: 800; color: var(--text-main); }

                .dept-bars { display: flex; flex-direction: column; gap: 24px; }
                .dept-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .dept-name { font-weight: 700; color: #475569; font-size: 1rem; }
                .dept-count { font-weight: 800; color: var(--text-main); }

                .progress-bg { height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
                .progress-fill { height: 100%; background: var(--primary); border-radius: 6px; }

                .feed-items { display: flex; flex-direction: column; gap: 16px; }
                .feed-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                    transition: all 0.2s;
                }

                .feed-item.urgent { background: #fff7ed; border-color: #ffedd5; }
                .feed-item:hover { transform: scale(1.02); }

                .item-icon {
                    width: 44px;
                    height: 44px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                .item-info { flex: 1; }
                .item-info p { font-size: 0.95rem; color: #334155; }
                .item-info span { font-size: 0.8rem; color: #64748b; font-weight: 600; }

                .item-go {
                    background: white;
                    border: 1px solid #e2e8f0;
                    width: 40px; height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .item-go:hover { background: var(--primary); color: white; border-color: var(--primary); }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 80vh;
                    gap: 20px;
                }

                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default HRDashboard;
