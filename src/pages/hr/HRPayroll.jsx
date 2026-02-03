import React, { useState, useEffect } from 'react';
import { Download, FileText, IndianRupee, PieChart, TrendingUp, Users, Loader2, Calendar, Filter, ArrowUpRight, ShieldCheck, Wallet, Pencil, X, Save } from 'lucide-react';
import mockService from '../../services/mockService';

const HRPayroll = () => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Manual Overrides State: { [userId]: days }
    const [manualDays, setManualDays] = useState({});

    // Edit Salary Modal State
    const [editModal, setEditModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [salaryData, setSalaryData] = useState({
        daysWorked: 26,
        basic: 0,
        hra: 0,
        conveyance: 0,
        otherEarnings: 0,
        pf: 0,
        esi: 0,
        advance: 0,
        tds: 0,
        otherDeductions: 0
    });
    const [isSaving, setIsSaving] = useState(false);

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

    const handleDayChange = (userId, value) => {
        setManualDays(prev => ({
            ...prev,
            [userId]: value
        }));
    };

    const handleDownloadPayslip = async (userId) => {
        try {
            const days = manualDays[userId] || '';
            await mockService.downloadPayslip(userId, selectedMonth, days);
        } catch (e) {
            alert('Failed to download payslip');
        }
    };

    const handleExportReport = async () => {
        try {
            await mockService.downloadPayrollReport(selectedMonth, manualDays);
        } catch (e) {
            alert('Export failed');
        }
    };

    const calculateDynamicPayout = (emp) => {
        const days = manualDays[emp.id] ? parseFloat(manualDays[emp.id]) : null;
        if (days === null) return emp.earnings;
        return Math.round((emp.earnings / 26) * days);
    };

    // Edit Salary Functions
    const handleEditSalary = async (emp) => {
        setEditingEmployee(emp);
        setEditModal(true);
        
        // Try to fetch existing payroll record
        try {
            const record = await mockService.getPayrollRecord(emp.id, selectedMonth);
            if (record) {
                setSalaryData({
                    daysWorked: record.daysWorked || 26,
                    basic: record.basic || 0,
                    hra: record.hra || 0,
                    conveyance: record.conveyance || 0,
                    otherEarnings: record.otherEarnings || 0,
                    pf: record.pf || 0,
                    esi: record.esi || 0,
                    advance: record.advance || 0,
                    tds: record.tds || 0,
                    otherDeductions: record.otherDeductions || 0
                });
            } else {
                // Auto-calculate from employee's monthly salary (50/30/10/10 split)
                const monthlySalary = emp.earnings || 0;
                const days = manualDays[emp.id] || 26;
                const ratio = days / 26;
                setSalaryData({
                    daysWorked: days,
                    basic: Math.round(monthlySalary * 0.5 * ratio),
                    hra: Math.round(monthlySalary * 0.3 * ratio),
                    conveyance: Math.round(monthlySalary * 0.1 * ratio),
                    otherEarnings: Math.round(monthlySalary * 0.1 * ratio),
                    pf: Math.round(monthlySalary * 0.5 * ratio * 0.12),
                    esi: 0,
                    advance: 0,
                    tds: 0,
                    otherDeductions: 0
                });
            }
        } catch (e) {
            console.error('Failed to fetch payroll record', e);
        }
    };

    const handleSalaryChange = (field, value) => {
        setSalaryData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const grossEarnings = salaryData.basic + salaryData.hra + salaryData.conveyance + salaryData.otherEarnings;
    const totalDeductions = salaryData.pf + salaryData.esi + salaryData.advance + salaryData.tds + salaryData.otherDeductions;
    const netPayable = grossEarnings - totalDeductions;

    const handleSaveSalary = async () => {
        if (!editingEmployee) return;
        setIsSaving(true);
        try {
            await mockService.savePayrollRecord({
                userId: editingEmployee.id,
                month: selectedMonth,
                ...salaryData
            });
            setEditModal(false);
            setEditingEmployee(null);
            fetchPayroll(); // Refresh data
            alert('Salary record saved successfully!');
        } catch (e) {
            console.error('Failed to save payroll record', e);
            alert('Failed to save salary record');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !summary) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Generating Financial Intelligence...</p>
            </div>
        );
    }

    const employees = summary?.employees || [];
    const dynamicTotalPayroll = employees.reduce((sum, emp) => sum + calculateDynamicPayout(emp), 0);

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
                            <option value="2026-02" style={{ color: 'black' }}>February 2026</option>
                            <option value="2026-01" style={{ color: 'black' }}>January 2026</option>
                            <option value="2025-12" style={{ color: 'black' }}>December 2025</option>
                            <option value="2025-11" style={{ color: 'black' }}>November 2025</option>
                        </select>
                    </div>
                    <button onClick={handleExportReport} style={{ background: 'white', color: '#44337a', border: 'none', padding: '0 24px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <Download size={18} />
                        <span>Export Salary Sheet</span>
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
                            <div style={{ fontSize: '2.8rem', fontWeight: 800 }}>₹{dynamicTotalPayroll.toLocaleString()}</div>
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
                                ₹{employees.length > 0 ? Math.round(dynamicTotalPayroll / employees.length).toLocaleString() : 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Per professional</div>
                        </div>
                    </div>

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
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', width: '80px' }}>Days</th>
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Total Payout</th>
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Actions</th>
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
                                                <input 
                                                    type="number"
                                                    placeholder="26"
                                                    value={manualDays[item.id] !== undefined ? manualDays[item.id] : 26}
                                                    onChange={(e) => handleDayChange(item.id, e.target.value)}
                                                    style={{ width: '50px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{calculateDynamicPayout(item).toLocaleString()}</span>
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => handleEditSalary(item)} 
                                                        style={{ background: '#6200ea', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }} 
                                                        title="Edit Salary"
                                                    >
                                                        <Pencil size={14} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownloadPayslip(item.id)} 
                                                        style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }} 
                                                        title="Generate Payslip"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {/* Edit Salary Modal */}
            {editModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Edit Salary Details</h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{editingEmployee?.name} • {selectedMonth}</p>
                            </div>
                            <button onClick={() => setEditModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        {/* Days Worked */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Days Worked</label>
                            <input 
                                type="number" 
                                value={salaryData.daysWorked} 
                                onChange={(e) => handleSalaryChange('daysWorked', e.target.value)}
                                style={{ width: '100px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}
                            />
                        </div>

                        {/* Earnings Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                                EARNINGS
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {[
                                    { label: 'Basic Salary', field: 'basic' },
                                    { label: 'HRA', field: 'hra' },
                                    { label: 'Conveyance', field: 'conveyance' },
                                    { label: 'Other Allowances', field: 'otherEarnings' }
                                ].map(item => (
                                    <div key={item.field}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>{item.label}</label>
                                        <input 
                                            type="number" 
                                            value={salaryData[item.field]} 
                                            onChange={(e) => handleSalaryChange(item.field, e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, color: '#16a34a' }}>Gross Earnings</span>
                                <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.1rem' }}>₹{grossEarnings.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Deductions Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                                DEDUCTIONS
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {[
                                    { label: 'Provident Fund (PF)', field: 'pf' },
                                    { label: 'ESI', field: 'esi' },
                                    { label: 'Advance Recovery', field: 'advance' },
                                    { label: 'TDS', field: 'tds' },
                                    { label: 'Other Deductions', field: 'otherDeductions' }
                                ].map(item => (
                                    <div key={item.field}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>{item.label}</label>
                                        <input 
                                            type="number" 
                                            value={salaryData[item.field]} 
                                            onChange={(e) => handleSalaryChange(item.field, e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, color: '#dc2626' }}>Total Deductions</span>
                                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.1rem' }}>₹{totalDeductions.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Net Payable */}
                        <div style={{ background: 'linear-gradient(135deg, #6200ea 0%, #44337a 100%)', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>NET PAYABLE</span>
                            <span style={{ fontWeight: 800, color: 'white', fontSize: '1.8rem' }}>₹{netPayable.toLocaleString()}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditModal(false)} style={{ padding: '14px 28px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                            <button 
                                onClick={handleSaveSalary} 
                                disabled={isSaving}
                                style={{ padding: '14px 28px', background: '#6200ea', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1 }}
                            >
                                <Save size={18} />
                                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPayroll;

