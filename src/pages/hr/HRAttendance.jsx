import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Clock, MoreVertical, X, CheckCircle, XCircle, AlertTriangle, ChevronRight, Download, Plus, Save, Edit } from 'lucide-react';
import mockService from '../../services/mockService';

const HRAttendance = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Manual Entry Modal
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualData, setManualData] = useState({
        userId: '', date: new Date().toISOString().split('T')[0], status: 'Present', inTime: '', outTime: ''
    });
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [attendanceHistory, setAttendanceHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await mockService.getAttendanceToday();
                setEmployees(data);
                // Pre-select first employee for manual entry
                if (data.length > 0) setManualData(prev => ({ ...prev, userId: data[0].id }));
            } catch (error) {
                console.error("Failed to load attendance:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleViewDetails = async (employee) => {
        setSelectedEmployee(employee);
        setShowDetailModal(true);
        fetchHistory(employee.id, selectedMonth);
    };

    const fetchHistory = async (empId, month) => {
        setHistoryLoading(true);
        try {
            const data = await mockService.getEmployeeAttendanceHistory(empId, month);
            setAttendanceHistory(data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        try {
            await mockService.markManualAttendance(manualData);
            alert("Attendance Updated Successfully");
            setShowManualModal(false);
            // Refresh data
            const data = await mockService.getAttendanceToday();
            setEmployees(data);
        } catch (e) {
            alert("Failed to update attendance");
        }
    };

    const handleDownloadSheet = async () => {
        try {
            await mockService.downloadAttendanceSheet(selectedMonth);
        } catch (e) {
            alert("Download Failed");
        }
    };

    useEffect(() => {
        if (selectedEmployee && showDetailModal) {
            fetchHistory(selectedEmployee.id, selectedMonth);
        }
    }, [selectedMonth]);

    const filteredEmployees = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="hr-attendance-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>Attendance Monitoring</h1>
                    <p>Track workforce presence and anomalies in real-time.</p>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={() => setShowManualModal(true)}>
                        <Edit size={18} />
                        <span>Manual Entry</span>
                    </button>
                    <button className="primary-btn" onClick={handleDownloadSheet}>
                        <Download size={18} />
                        <span>Download Sheet</span>
                    </button>
                </div>
            </header>

            <main className="attendance-content">
                <div className="content-wrapper">
                    <div className="controls-row">
                        <div className="search-barrier glass">
                            <Search size={20} color="#94a3b8" />
                            <input
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                         <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="month-select"
                        >
                            <option value="2026-01">January 2026</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                    </div>

                    <div className="cards-grid">
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : filteredEmployees.map(emp => (
                            <div key={emp.id} className="att-card glass fadeIn">
                                <div className="card-top">
                                    <div className={`avatar-small ${emp.role === 'worker' ? 'worker' : 'emp'}`}>
                                        {(emp.name || 'U')[0]}
                                    </div>
                                    <div className="emp-ident">
                                        <span className="name">{emp.name}</span>
                                        <span className="dept">{emp.department || 'N/A'}</span>
                                    </div>
                                    <button className="more-btn" onClick={() => handleViewDetails(emp)}>
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                                <div className="card-stats">
                                    <div className="stat-item">
                                        <span className="lbl">Shift</span>
                                        <span className="val">{emp.shift?.split(' - ')[0] || '09:00'}</span>
                                    </div>
                                    <div className="div-line"></div>
                                    <div className="stat-item">
                                        <span className="lbl">Status</span>
                                        <span className={`val ${emp.status === 'Present' ? 'status-active' : 'status-absent'}`}>
                                            {emp.status || 'Absent'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Manual Entry Modal */}
            {showManualModal && (
                <div className="modal-overlay">
                    <div className="modal-content fadeIn">
                        <div className="modal-header">
                            <h2>Manual Attendance Entry</h2>
                            <button className="close-btn" onClick={() => setShowManualModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Employee</label>
                                <select 
                                    value={manualData.userId} 
                                    onChange={e => setManualData({...manualData, userId: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                >
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                                </select>
                            </div>
                            <div className="form-group grid-2">
                                <div>
                                    <label>Date</label>
                                    <input type="date" value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} />
                                </div>
                                <div>
                                    <label>Status</label>
                                    <select value={manualData.status} onChange={e => setManualData({...manualData, status: e.target.value})}>
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Leave">Leave</option>
                                        <option value="Half Day">Half Day</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group grid-2">
                                <div>
                                    <label>In Time</label>
                                    <input type="time" value={manualData.inTime} onChange={e => setManualData({...manualData, inTime: e.target.value})} />
                                </div>
                                <div>
                                    <label>Out Time</label>
                                    <input type="time" value={manualData.outTime} onChange={e => setManualData({...manualData, outTime: e.target.value})} />
                                </div>
                            </div>
                            <button className="primary-btn full" onClick={handleManualSubmit}>
                                <Save size={18} />
                                <span>Save Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed History Modal */}
            {showDetailModal && selectedEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content large fadeIn">
                        <div className="modal-header">
                            <div className="header-left">
                                <h2>{selectedEmployee.name}</h2>
                                <span className="id-badge">#{selectedEmployee.id}</span>
                            </div>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
                        </div>

                        <div className="modal-controls">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-picker"
                            >
                                <option value="2026-01">January 2026</option>
                                <option value="2025-12">December 2025</option>
                                <option value="2025-11">November 2025</option>
                            </select>
                        </div>

                        <div className="history-table-container">
                            {historyLoading ? (
                                <div className="loading-ph">Loading logs...</div>
                            ) : attendanceHistory?.history ? (
                                <table className="detail-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>In</th>
                                            <th>Out</th>
                                            <th>Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceHistory.history.map((log, idx) => (
                                            <tr key={idx}>
                                                <td className="w-date">{log.date}</td>
                                                <td>
                                                    <span className={`status-pill ${log.status.toLowerCase()}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="mono">{log.in}</td>
                                                <td className="mono">{log.out}</td>
                                                <td className="mono bold">{log.total}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="no-data">No records found</div>
                            )}
                        </div>

                        {attendanceHistory?.stats && (
                            <div className="modal-footer-stats">
                                <div className="f-stat">
                                    <span>Total Days</span>
                                    <b>{attendanceHistory.stats.totalDays}</b>
                                </div>
                                <div className="f-stat">
                                    <span>Worked</span>
                                    <b>{attendanceHistory.stats.workedHours}h</b>
                                </div>
                                <div className="f-stat">
                                    <span>Shortfall</span>
                                    <b className="warn">{attendanceHistory.stats.pendingHours}h</b>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .hr-attendance-container { flex: 1; display: flex; flex-direction: column; background-color: var(--background); }
                .hr-page-header { padding: 40px; background: linear-gradient(135deg, var(--primary-dark) 0%, #312e81 100%); color: white; box-shadow: var(--shadow-md); display: flex; justify-content: space-between; align-items: center; }
                .header-content h1 { font-size: 2.5rem; font-weight: 800; }
                .header-actions { display: flex; gap: 16px; }
                .primary-btn { background: white; color: var(--primary-dark); border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; display: flex; alignItems: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
                .primary-btn:hover { background: #f8fafc; transform: translateY(-2px); }
                .primary-btn.full { width: 100%; background: var(--primary); color: white; justify-content: center; }
                .secondary-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 12px; font-weight: 800; display: flex; alignItems: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
                .secondary-btn:hover { background: rgba(255,255,255,0.2); }

                .attendance-content { flex: 1; overflow-y: auto; padding-top: 40px; }
                .content-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 40px 60px; display: flex; flex-direction: column; gap: 32px; }
                .controls-row { display: flex; justify-content: space-between; align-items: center; }
                
                .search-barrier { background: white; padding: 0 20px; border-radius: 16px; display: flex; align-items: center; gap: 14px; border: 1px solid #f1f5f9; width: 100%; max-width: 500px; }
                .search-barrier input { border: none; height: 50px; outline: none; width: 100%; font-size: 1rem; }
                .month-select { padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9; font-weight: 700; color: var(--text-main); height: 50px; }
                
                .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                
                .att-card { background: white; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: var(--shadow-sm); transition: transform 0.2s; }
                .att-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
                
                .card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .avatar-small { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 1.1rem; }
                .avatar-small.worker { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .avatar-small.emp { background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); }
                
                .emp-ident { flex: 1; display: flex; flex-direction: column; }
                .name { font-weight: 800; color: var(--text-main); font-size: 1.05rem; }
                .dept { font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
                
                .more-btn { background: #f8fafc; border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
                .more-btn:hover { background: #e2e8f0; color: var(--primary); }
                
                .card-stats { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 12px 16px; border-radius: 12px; }
                .stat-item { display: flex; flex-direction: column; gap: 2px; }
                .lbl { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .val { font-weight: 800; color: var(--text-main); font-size: 0.95rem; }
                .status-active { color: #16a34a; }
                .status-absent { color: #ef4444; }
                .div-line { width: 1px; height: 24px; background: #e2e8f0; }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
                .modal-content { background: white; border-radius: 24px; padding: 0; width: 700px; max-width: 90%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
                
                .modal-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
                .header-left { display: flex; align-items: center; gap: 12px; }
                .header-left h2 { font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); }
                .id-badge { background: white; padding: 4px 10px; border-radius: 8px; font-weight: 700; color: #64748b; border: 1px solid #e2e8f0; font-size: 0.8rem; }
                .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }
                
                /* Form Styles */
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-weight: 700; color: #64748b; font-size: 0.9rem; }
                .form-group input, .form-group select { padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; font-size: 1rem; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

                .modal-controls { padding: 16px 24px; display: flex; justify-content: flex-end; }
                .month-picker { padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-weight: 600; color: var(--text-main); outline: none; }
                
                .history-table-container { flex: 1; overflow-y: auto; padding: 0 24px; }
                .detail-table { width: 100%; border-collapse: collapse; }
                .detail-table th { text-align: left; padding: 12px; font-size: 0.75rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; }
                .detail-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: var(--text-main); }
                .w-date { font-weight: 700; width: 120px; }
                .mono { font-family: 'JetBrains Mono', monospace; }
                .bold { font-weight: 700; }
                
                .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
                .status-pill.present { background: #f0fdf4; color: #16a34a; }
                .status-pill.leave { background: #fff1f2; color: #e11d48; }

                .modal-footer-stats { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; gap: 32px; justify-content: flex-end; }
                .f-stat { display: flex; flex-direction: column; align-items: flex-end; }
                .f-stat span { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .f-stat b { font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
                .f-stat b.warn { color: #f59e0b; }

                .fadeIn { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default HRAttendance;
