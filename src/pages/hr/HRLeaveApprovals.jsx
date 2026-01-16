import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, User, Info, Loader2, ArrowRight, CornerDownRight, Search, Filter } from 'lucide-react';
import mockService from '../../services/mockService';

const HRLeaveApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await mockService.getPendingLeaves();
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch leave requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        setActionId(id);
        try {
            const result = await mockService.updateLeaveStatus(id, status);
            if (result.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            alert("Action failed: " + status);
        } finally {
            setActionId(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Retrieving Leave Ledger...</p>
            </div>
        );
    }

    return (
        <div className="leave-approvals-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>Leave Management</h1>
                    <p>Review and authorize time-off requests with structured precision.</p>
                </div>
                {requests.length > 0 && (
                    <div className="status-indicator">
                        <span className="pulse"></span>
                        <span>{requests.length} Requests Pending</span>
                    </div>
                )}
            </header>

            <main className="leave-approvals-content">
                <div className="content-wrapper">
                    <div className="directory-controls">
                        <div className="search-barrier glass">
                            <Search size={20} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Filter by name or request ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="filter-trigger glass">
                            <Filter size={18} />
                            <span>Status: Pending</span>
                        </button>
                    </div>

                    <div className="table-wrapper glass">
                        <table className="aura-table">
                            <thead>
                                <tr>
                                    <th>Professional</th>
                                    <th>Ref ID</th>
                                    <th>Leave Type</th>
                                    <th className="text-center">Absence Period</th>
                                    <th>Reason</th>
                                    <th className="text-center">Authorize</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="fadeIn">
                                            <td>
                                                <div className="prof-cell">
                                                    <div className="avatar-mini">{req.employeeName[0]}</div>
                                                    <span className="prof-name">{req.employeeName}</span>
                                                </div>
                                            </td>
                                            <td><span className="id-tag">#{req.id}</span></td>
                                            <td><span className="type-badge">{req.type}</span></td>
                                            <td className="text-center">
                                                <div className="date-range-cell">
                                                    <span className="date-val">{req.fromDate}</span>
                                                    <ArrowRight size={14} className="date-sep" />
                                                    <span className="date-val">{req.toDate}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reason-popover" title={req.reason}>
                                                    {req.reason.length > 30 ? req.reason.substring(0, 30) + '...' : req.reason}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-cluster-center">
                                                    <button
                                                        className="action-icon decline"
                                                        onClick={() => handleAction(req.id, 'Rejected')}
                                                        disabled={actionId === req.id}
                                                        title="Decline"
                                                    >
                                                        {actionId === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                                                    </button>
                                                    <button
                                                        className="action-icon approve"
                                                        onClick={() => handleAction(req.id, 'Approved')}
                                                        disabled={actionId === req.id}
                                                        title="Approve"
                                                    >
                                                        {actionId === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="empty-table-state">
                                                <div className="icon-badge success">
                                                    <CheckCircle2 size={40} />
                                                </div>
                                                <p>The leave ledger is currently clear.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .leave-approvals-container {
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

                .status-indicator {
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                    padding: 10px 20px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 700;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .pulse {
                    width: 8px; height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .leave-approvals-content { flex: 1; overflow-y: auto; padding-top: 40px; }

                .content-wrapper {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 40px 60px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .directory-controls {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                }

                .search-barrier {
                    flex: 1;
                    background: white;
                    padding: 0 20px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid #f1f5f9;
                }

                .search-barrier input {
                    border: none;
                    height: 56px;
                    outline: none;
                    width: 100%;
                    font-size: 1rem;
                    color: var(--text-main);
                    background: transparent;
                }

                .filter-trigger {
                    background: white;
                    padding: 0 24px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 700;
                    color: #475569;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid #f1f5f9;
                    cursor: pointer;
                }

                .table-wrapper {
                    background: white;
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid #f1f5f9;
                }

                .aura-table { width: 100%; border-collapse: collapse; text-align: left; }
                .aura-table th {
                    background: #f8fafc;
                    padding: 20px 24px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid #f1f5f9;
                }

                .aura-table td { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                .aura-table tr:hover td { background: #fcfdfe; }

                .prof-cell { display: flex; align-items: center; gap: 12px; }
                .avatar-mini {
                    width: 32px; height: 32px;
                    background: #f1f5f9;
                    color: var(--primary);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.9rem;
                    border: 1px solid #e2e8f0;
                }
                .prof-name { font-weight: 700; color: var(--text-main); }

                .id-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #94a3b8; font-weight: 600; min-width: 80px; display: inline-block; }
                
                .type-badge {
                    background: #f5f3ff;
                    color: var(--primary);
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid #ddd6fe;
                    min-width: 100px;
                    display: inline-block;
                    text-align: center;
                }

                .date-range-cell { 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 12px; 
                    font-family: 'JetBrains Mono', monospace;
                }
                
                .date-val { font-weight: 700; color: #475569; font-size: 0.9rem; width: 100px; }
                .date-sep { color: #cbd5e1; }

                .reason-popover { color: #64748b; font-size: 0.9rem; font-weight: 500; }

                .action-cluster-center { display: flex; justify-content: center; gap: 12px; }
                
                .action-icon {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-icon.decline { background: #fff1f2; color: #e11d48; border: 1px solid #fecaca; }
                .action-icon.decline:hover { background: #fee2e2; transform: scale(1.1); }
                
                .action-icon.approve { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
                .action-icon.approve:hover { background: #dcfce7; transform: scale(1.1); }

                .text-center { text-align: center; }

                .empty-table-state {
                    padding: 100px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    color: #94a3b8;
                }

                .loading-container { padding: 100px; text-align: center; color: #94a3b8; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .fadeIn { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default HRLeaveApprovals;
