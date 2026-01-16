import React, { useState, useEffect } from 'react';
import { Download, FileText, IndianRupee, PieChart, TrendingUp, Users, Loader2, Calendar, Filter, ArrowUpRight, ShieldCheck, Wallet } from 'lucide-react';
import mockService from '../../services/mockService';

const HRPayroll = () => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('2023-11');

    useEffect(() => {
        fetchPayroll();
    }, [selectedMonth]);

    const fetchPayroll = async () => {
        setIsLoading(true);
        try {
            const data = await mockService.getPayrollSummary(selectedMonth);
            setSummary(data);
        } catch (error) {
            console.error("Failed to fetch payroll summary", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !summary) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Generating Financial Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="payroll-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>Financial Engine</h1>
                    <p>Precise payroll processing and fiscal resource monitoring.</p>
                </div>
                <div className="header-actions">
                    <div className="dropdown-pill glass">
                        <Calendar size={18} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="2023-11">November 2023</option>
                            <option value="2023-10">October 2023</option>
                            <option value="2023-09">September 2023</option>
                        </select>
                    </div>
                    <button className="export-action-btn">
                        <Download size={18} />
                        <span>Export Fiscal Report</span>
                    </button>
                </div>
            </header>

            <main className="payroll-content">
                <div className="content-wrapper">
                    <div className="summary-cards">
                        <div className="summary-card main">
                            <div className="card-bg-icon"><Wallet size={120} /></div>
                            <div className="card-top">
                                <span className="card-label">Net Disbursement</span>
                                <div className="trend-pill positive">
                                    <TrendingUp size={12} />
                                    <span>2.4%</span>
                                </div>
                            </div>
                            <div className="card-val">₹{summary?.netPayable.toLocaleString()}</div>
                            <p className="card-footer-text">Calculated for {summary?.breakdown.length} active professionals</p>
                        </div>

                        <div className="summary-card glass">
                            <span className="card-label">Gross Liabilities</span>
                            <div className="card-val-sm">₹{summary?.totalGross.toLocaleString()}</div>
                            <div className="card-mini-footer">Total pre-deduction cost</div>
                        </div>

                        <div className="summary-card glass warning">
                            <span className="card-label">Fiscal Deductions</span>
                            <div className="card-val-sm">₹{summary?.totalDeductions.toLocaleString()}</div>
                            <div className="card-mini-footer">Tax & benefits retained</div>
                        </div>
                    </div>

                    <div className="payroll-layout">
                        <section className="breakdown-grid glass">
                            <div className="section-header">
                                <div className="header-icon"><Users size={20} /></div>
                                <h3>Professional Payout Breakdown</h3>
                            </div>
                            <div className="table-scroll">
                                <table className="aura-table">
                                    <thead>
                                        <tr>
                                            <th>Professional</th>
                                            <th>Efficiency</th>
                                            <th>Overtime</th>
                                            <th>Total Payout</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary?.breakdown.map((item) => (
                                            <tr key={item.id} className="fadeIn">
                                                <td>
                                                    <div className="prof-cell">
                                                        <span className="prof-name">{item.name}</span>
                                                        <span className="prof-id">#{item.id}</span>
                                                    </div>
                                                </td>
                                                <td><span className="hours-chip">{item.workedHours}h Logged</span></td>
                                                <td><span className="ot-chip">{item.otHours}h OT</span></td>
                                                <td><span className="total-pay">₹{item.totalPay.toLocaleString()}</span></td>
                                                <td>
                                                    <button className="view-detail-btn"><FileText size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="insights-panel">
                            <div className="panel-card glass primary">
                                <div className="section-header">
                                    <PieChart size={20} color="var(--primary)" />
                                    <h3>Fiscal Insights</h3>
                                </div>
                                <div className="insights-list">
                                    <div className="insight-row">
                                        <span className="insight-lbl">Peak Dept Cost</span>
                                        <span className="insight-val">Assembly</span>
                                    </div>
                                    <div className="insight-row">
                                        <span className="insight-lbl">Avg. Disbursement</span>
                                        <span className="insight-val">₹32,450</span>
                                    </div>
                                    <div className="insight-row success">
                                        <span className="insight-lbl">Compliance Status</span>
                                        <div className="status-badge-success">
                                            <ShieldCheck size={14} />
                                            <span>Certified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="authorize-payout-btn">
                                <IndianRupee size={20} />
                                <span>Authorize Batch Disbursement</span>
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .payroll-container {
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

                .header-actions { display: flex; gap: 16px; }

                .dropdown-pill {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .dropdown-pill select {
                    background: transparent;
                    border: none;
                    color: white;
                    font-weight: 700;
                    padding: 12px 0;
                    outline: none;
                    cursor: pointer;
                }

                .export-action-btn {
                    background: white;
                    color: var(--primary-dark);
                    border: none;
                    padding: 0 24px;
                    border-radius: 16px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .export-action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }

                .payroll-content { flex: 1; overflow-y: auto; padding-top: 40px; }

                .content-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 40px 60px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .summary-cards { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px; }

                .summary-card {
                    background: white;
                    padding: 30px;
                    border-radius: 32px;
                    box-shadow: var(--shadow-sm);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .summary-card.main {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    border: none;
                }

                .card-bg-icon {
                    position: absolute;
                    bottom: -20px; right: -20px;
                    opacity: 0.1;
                }

                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .card-label { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .main .card-label { color: rgba(255,255,255,0.7); }

                .card-val { font-size: 2.8rem; font-weight: 800; }
                .card-val-sm { font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin: 8px 0; }
                .warning .card-val-sm { color: #e11d48; }

                .trend-pill {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .card-footer-text { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-top: 10px; font-weight: 600; }
                .card-mini-footer { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

                .payroll-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; }

                .glass { background: white; padding: 32px; border-radius: 32px; box-shadow: var(--shadow-sm); border: 1px solid #f1f5f9; }

                .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .header-icon { width: 40px; height: 40px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); border: 1px solid #f1f5f9; }
                .section-header h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }

                .table-scroll { overflow-x: auto; }
                .aura-table { width: 100%; border-collapse: collapse; text-align: left; }
                .aura-table th { padding: 16px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; }
                .aura-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; }

                .prof-cell { display: flex; flex-direction: column; }
                .prof-name { font-weight: 800; color: var(--text-main); font-size: 0.95rem; }
                .prof-id { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

                .hours-chip { background: #f8fafc; color: #64748b; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; }
                .ot-chip { background: #fff7ed; color: #ea580c; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; }
                .total-pay { font-weight: 800; color: var(--primary); font-size: 1rem; }

                .view-detail-btn { background: white; border: 1px solid #f1f5f9; color: #94a3b8; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .view-detail-btn:hover { background: #f8fafc; color: var(--primary); border-color: var(--primary); }

                .insights-panel { display: flex; flex-direction: column; gap: 24px; }
                .insights-list { display: flex; flex-direction: column; gap: 16px; }
                .insight-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
                .insight-lbl { font-size: 0.9rem; font-weight: 700; color: #64748b; }
                .insight-val { font-weight: 800; color: var(--text-main); }

                .status-badge-success { background: #f0fdf4; color: #16a34a; padding: 6px 14px; border-radius: 12px; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 800; }

                .authorize-payout-btn {
                    height: 70px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    font-weight: 800;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
                }

                .authorize-payout-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.3); background: #059669; }

                .loading-container { padding: 100px; text-align: center; color: #94a3b8; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .fadeIn { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default HRPayroll;
