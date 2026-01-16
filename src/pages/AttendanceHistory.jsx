import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import mockService from '../services/mockService';

const AttendanceHistory = ({ isDesktop }) => {
  const [selectedMonth, setSelectedMonth] = useState('2023-10');
  const [attendanceData, setAttendanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await mockService.getAttendanceHistory(selectedMonth);
        setAttendanceData(data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [selectedMonth]);

  return (
    <div className="history-container">
      {!isDesktop && (
        <header className="page-header">
          <h2>My Activity</h2>
        </header>
      )}

      <main className="history-content">
        <div className="content-wrapper">
          {isDesktop && (
            <div className="desktop-page-header">
              <h1>Attendance History</h1>
              <p>Detailed log of your working hours and overtime stats.</p>
            </div>
          )}

          <div className="control-bar glass">
            <div className="dropdown-wrapper">
              <Calendar size={18} color="var(--primary)" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-select"
              >
                <option value="2023-11">November 2023</option>
                <option value="2023-10">October 2023</option>
                <option value="2023-09">September 2023</option>
              </select>
            </div>
          </div>

          {!isLoading && attendanceData?.stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="sc-val">{attendanceData.stats.totalDays}</span>
                <span className="sc-lbl">Total Days</span>
              </div>
              <div className="stat-card">
                <span className="sc-val">{attendanceData.stats.workedHours}h</span>
                <span className="sc-lbl">Worked</span>
              </div>
              <div className="stat-card">
                <span className="sc-val highlight">{attendanceData.stats.otHours}h</span>
                <span className="sc-lbl">Overtime</span>
              </div>
              <div className="stat-card warning">
                <span className="sc-val">{attendanceData.stats.pendingHours}h</span>
                <span className="sc-lbl">Pending</span>
              </div>
            </div>
          )}

          <div className="history-table-wrapper glass">
            {isLoading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p>Syncing logs...</p>
              </div>
            ) : attendanceData?.history?.length > 0 ? (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Total</th>
                    <th>OT</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.history.map((item, index) => (
                    <tr key={index} className="fadeIn">
                      <td className="date-cell">{item.date}</td>
                      <td>
                        <span className={`status-pill ${item.status.toLowerCase()}`}>
                          {item.status === 'Present' && <CheckCircle size={12} />}
                          {item.status === 'Leave' && <XCircle size={12} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="time-cell">{item.in}</td>
                      <td className="time-cell">{item.out}</td>
                      <td className="time-cell"><b>{item.total > 0 ? item.total + 'h' : '-'}</b></td>
                      <td className="ot-cell">{item.ot > 0 ? '+' + item.ot + 'h' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <Calendar size={48} opacity={0.2} />
                <p>No records found for this month.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .history-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--background);
        }

        .history-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

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

        .desktop-page-header h1 { font-size: 2.5rem; color: var(--primary-dark); font-weight: 800; }

        .page-header {
          padding: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .page-header h2 { font-weight: 800; font-size: 1.4rem; }

        .control-bar {
          padding: 16px;
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          border: 1px solid #f1f5f9;
        }

        .dropdown-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .month-select {
          border: none;
          background: none;
          color: var(--text-main);
          font-size: 1rem;
          font-weight: 700;
          outline: none;
          flex: 1;
          cursor: pointer;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }
        
        .stat-card {
            background: white;
            padding: 16px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-sm);
            border: 1px solid #f1f5f9;
        }
        
        .sc-val { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
        .sc-val.highlight { color: var(--primary); }
        .warning .sc-val { color: #f59e0b; }
        
        .sc-lbl { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 4px; }

        .history-table-wrapper {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          border: 1px solid #f1f5f9;
        }
        
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
        
        .attendance-table th {
            padding: 16px;
            background: #f8fafc;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .attendance-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            color: var(--text-main);
            font-size: 0.95rem;
        }
        
        .attendance-table tr:hover td { background: #fcfdfe; }
        
        .date-cell { font-weight: 700; }
        .time-cell { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; }
        .ot-cell { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--primary); }
        
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 800;
            text-transform: uppercase;
        }
        
        .status-pill.present { background: #f0fdf4; color: #166534; }
        .status-pill.leave { background: #fffbeb; color: #b45309; }

        .loading-state, .no-data {
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
          text-align: center;
        }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AttendanceHistory;
