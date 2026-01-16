import React, { useState, useEffect } from 'react';
import { Send, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import mockService from '../services/mockService';

/**
 * @api POST /api/worker/apply-leave
 * @description Submits a leave request.
 * @param {object} leaveData - { type: string, fromDate: string, toDate: string, reason: string }
 * @returns {Promise<{ success: boolean, requestId: string }>}
 */
const LeaveApplication = ({ isDesktop }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveStats, setLeaveStats] = useState({ totalBalance: 0, used: 0, pending: 0 });
  const [formData, setFormData] = useState({
    type: 'Casual',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await mockService.getLeaveStats();
        setLeaveStats(stats);
      } catch (error) {
        console.error("Failed to fetch leave stats");
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await mockService.applyLeave(formData);
      alert(`Leave request submitted! ID: ${response.requestId}`);
      setFormData({ type: 'Casual', fromDate: '', toDate: '', reason: '' });
      setActiveTab('status');
      // Refresh stats in a real app
    } catch (error) {
      alert("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="leave-container">
      {!isDesktop && (
        <header className="page-header">
          <h2>Request Leave</h2>
        </header>
      )}

      <main className="leave-content">
        <div className="content-wrapper">
          {isDesktop && (
            <div className="desktop-page-header">
              <h1>Request Leave</h1>
              <p>Apply for sick leaves or casual time off with ease.</p>
            </div>
          )}

          {/* Leave Stats Strip */}
          <div className="stats-strip">
            <div className="mini-stat-card">
              <div className="icon-bg blue"><Calendar size={18} /></div>
              <div>
                <span className="stat-val">{leaveStats.totalBalance}</span>
                <span className="stat-lbl">Balance</span>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="icon-bg amber"><Clock size={18} /></div>
              <div>
                <span className="stat-val">{leaveStats.pending}</span>
                <span className="stat-lbl">Pending</span>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="icon-bg green"><AlertCircle size={18} /></div>
              <div>
                <span className="stat-val">{leaveStats.used}</span>
                <span className="stat-lbl">Used</span>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              New Request
            </button>
            <button
              className={`tab ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              Status
            </button>
          </div>

          <div className="tab-container-inner">
            {activeTab === 'new' ? (
              <form className="leave-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Casual</option>
                    <option>Sick</option>
                    <option>Unpaid</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    rows="4"
                    placeholder="Explain the reason for leave..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            ) : (
              <div className="status-list">
                <div className="status-card">
                  <div className="card-info">
                    <span className="leave-type">Sick Leave</span>
                    <span className="leave-date">Oct 12, 2023</span>
                  </div>
                  <div className="status-badge pending">Pending</div>
                </div>
                <p className="no-more">No other requests found.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .leave-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--background);
        }

        .leave-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .content-wrapper {
          padding: ${isDesktop ? '40px' : '24px'};
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
          width: 100%;
          max-width: 1200px;
          margin: ${!isDesktop ? 'auto' : '0 auto'};
        }

        .desktop-page-header h1 {
            font-size: 2.5rem;
            color: var(--primary-dark);
            font-weight: 800;
        }

        .page-header {
          padding: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .page-header h2 { font-weight: 800; font-size: 1.4rem; }
        
        .stats-strip {
             display: grid;
             grid-template-columns: repeat(3, 1fr);
             gap: 12px;
        }
        
        .mini-stat-card {
            background: white;
            padding: 16px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: var(--shadow-sm);
            border: 1px solid #f1f5f9;
        }
        
        .icon-bg {
            width: 40px; height: 40px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
        }
        
        .icon-bg.blue { background: #eff6ff; color: #3b82f6; }
        .icon-bg.amber { background: #fffbeb; color: #f59e0b; }
        .icon-bg.green { background: #f0fdf4; color: #10b981; }
        
        .stat-val { display: block; font-size: 1.2rem; font-weight: 800; color: var(--text-main); line-height: 1; }
        .stat-lbl { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }

        .tabs {
          display: flex;
          background: white;
          padding: 8px;
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 20px;
        }

        .tab {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background-color: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(98, 0, 234, 0.2);
        }

        .tab-container-inner { flex: 1; display: flex; flex-direction: column; }

        .leave-form {
          background: white;
          padding: 24px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--shadow-md);
          ${isDesktop ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' : ''}
        }

        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .flex-1 { flex: 1; }
        .form-row { display: flex; gap: 16px; ${!isDesktop ? 'flex-direction: column;' : ''} }

        label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.05em; }

        select, input, textarea {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        select:focus, input:focus, textarea:focus {
          border-color: var(--primary);
          background-color: white;
          box-shadow: 0 0 0 4px rgba(98, 0, 234, 0.1);
        }

        .submit-button {
          margin-top: 10px;
          padding: 18px;
          border-radius: 16px;
          border: none;
          background: var(--primary);
          color: white;
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 8px 16px rgba(98, 0, 234, 0.2);
          transition: all 0.2s;
          ${isDesktop ? 'width: fit-content; min-width: 200px;' : ''}
        }

        .submit-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 20px rgba(98, 0, 234, 0.3); }

        .status-list { display: flex; flex-direction: column; gap: 16px; }

        .status-card {
          background: white;
          padding: 20px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }

        .card-info { display: flex; gap: 32px; align-items: center; flex: 1; }
        .leave-type { font-weight: 800; color: var(--text-main); font-size: 1.1rem; width: 140px; }
        .leave-date { font-weight: 700; color: var(--text-muted); font-size: 0.9rem; font-family: 'JetBrains Mono', monospace; width: 120px; }
        .status-badge { padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; min-width: 100px; text-align: center; }
        .status-badge.pending { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LeaveApplication;
