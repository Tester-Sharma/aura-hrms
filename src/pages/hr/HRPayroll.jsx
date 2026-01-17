import React, { useState, useEffect } from 'react';
import { Download, FileText, IndianRupee, PieChart, TrendingUp, Users, Loader2, Calendar, Filter, ArrowUpRight, ShieldCheck, Wallet } from 'lucide-react';
import mockService from '../../services/mockService';

const HRPayroll = () => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Generating Financial Intelligence...</p>
            </div>
        );
    }

    const employees = summary?.employees || [];
    const totalPayroll = summary?.totalPayroll || 0;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
            <header style={{ padding: '40px', background: 'linear-gradient(135deg, #44337a 0%, #1e1b4b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Financial Engine</h1>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '4px' }}>Precise payroll processing and fiscal resource monitoring.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Calendar size={18} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 700, padding: '12px 0', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="2026-01" style={{ color: 'black' }}>January 2026</option>
                            <option value="2025-12" style={{ color: 'black' }}>December 2025</option>
                            <option value="2025-11" style={{ color: 'black' }}>November 2025</option>
                        </select>
                    </div>
                    <button style={{ background: 'white', color: '#44337a', border: 'none', padding: '0 24px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <Download size={18} />
                        <span>Export Fiscal Report</span>
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingTop: '40px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 60px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #6200ea 0%, #44337a 100%)', color: 'white', padding: '30px', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.1 }}>
                                <Wallet size={120} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Total Disbursement</span>
                                <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <TrendingUp size={12} />
                                    <span>Live</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '2.8rem', fontWeight: 800 }}>₹{totalPayroll.toLocaleString()}</div>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px', fontWeight: 600 }}>Calculated for {employees.length} active professionals</p>
                        </div>

                        <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total Employees</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>{employees.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Active payroll recipients</div>
                        </div>

                        <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Avg Compensation</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
                                ₹{employees.length > 0 ? Math.round(totalPayroll / employees.length).toLocaleString() : 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Per professional</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
                        <section style={{ background: 'white', padding: '32px', borderRadius: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid #f1f5f9' }}>
                                    <Users size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Professional Payout Breakdown</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Professional</th>
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Department</th>
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Type</th>
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Total Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((item) => (
                                            <tr key={item.id}>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{item.id}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ background: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{item.department || 'N/A'}</span>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ background: item.role === 'worker' ? '#fff7ed' : '#f0f9ff', color: item.role === 'worker' ? '#ea580c' : '#0284c7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        {item.type || (item.role === 'worker' ? 'Hourly' : 'Salaried')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{item.earnings.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '32px', borderRadius: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <PieChart size={20} color="var(--primary)" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Fiscal Insights</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Total Professionals</span>
                                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{employees.length}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color:'#64748b' }}>Avg. Disbursement</span>
                                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>₹{employees.length > 0 ? Math.round(totalPayroll / employees.length).toLocaleString() : 0}</span>
                                   </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Compliance Status</span>
                                        <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                                            <ShieldCheck size={14} />
                                            <span>Certified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button style={{ height: '70px', background: '#10b981', color: 'white', border: 'none', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)' }}>
                                <IndianRupee size={20} />
                                <span>Authorize Batch Disbursement</span>
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HRPayroll;
