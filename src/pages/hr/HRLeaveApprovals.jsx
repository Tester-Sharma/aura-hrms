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
            
            if (result && result.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
                alert(`Leave request ${status.toLowerCase()} successfully!`);
            } else {
                alert(`Failed to ${status.toLowerCase()} leave request`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Action failed: ${error.message || 'Unknown error'}`);
        } finally {
            setActionId(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        (req.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.id?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Retrieving Leave Ledger...</p>
            </div>
        );
    }

    return (
        <div className="leave-approvals-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
            <header className="hr-page-header" style={{ padding: '40px', background: 'linear-gradient(135deg, #44337a 0%, #1e1b4b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
                <div className="header-content">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Leave Management</h1>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '4px' }}>Review and authorize time-off requests with structured precision.</p>
                </div>
                {requests.length > 0 && (
                    <div className="status-indicator" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                        <span>{requests.length} Requests Pending</span>
                    </div>
                )}
            </header>

            <main className="leave-approvals-content" style={{ flex: 1, overflowY: 'auto', paddingTop: '40px' }}>
                <div className="content-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="directory-controls" style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                        <div className="search-barrier glass" style={{ flex: 1, background: 'white', padding: '0 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                            <Search size={20} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Filter by name or request ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ border: 'none', height: '56px', outline: 'none', width: '100%', fontSize: '1rem', background: 'transparent' }}
                            />
                        </div>
                        <button className="filter-trigger glass" style={{ background: 'white', padding: '0 24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: '#475569', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                            <Filter size={18} />
                            <span>Status: Pending</span>
                        </button>
                    </div>

                    <div className="table-wrapper glass" style={{ background: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid #f1f5f9' }}>
                        <table className="aura-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Professional</th>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Ref ID</th>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Leave Type</th>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Absence Period</th>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Reason</th>
                                    <th style={{ background: '#f8fafc', padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Authorize</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', background: '#f1f5f9', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                                                        {(req.user?.name || 'U')[0]}
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{req.user?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>#{req.id}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ background: '#f5f3ff', color: 'var(--primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #ddd6fe' }}>{req.type}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontFamily: 'monospace' }}>
                                                    <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                                        {new Date(req.fromDate).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                                                    <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                                        {new Date(req.toDate).toLocaleDateString('en-GB')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div title={req.reason} style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {(req.reason || '').length > 30 ? (req.reason || '').substring(0, 30) + '...' : (req.reason || 'No reason provided')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                                    <button
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecaca' }}
                                                        onClick={() => handleAction(req.id, 'Rejected')}
                                                        disabled={actionId === req.id}
                                                        title="Decline"
                                                    >
                                                        {actionId === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                                                    </button>
                                                    <button
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}
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
                                        <td colSpan="6" style={{ padding: '100px 0', textAlign: 'center'}}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#94a3b8' }}>
                                                <CheckCircle2 size={40} />
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
        </div>
    );
};

export default HRLeaveApprovals;
