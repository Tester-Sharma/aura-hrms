import React, { useState, useEffect } from 'react';
import { Download, Clock, LogOut, ChevronRight, Loader2, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import mockService from '../services/mockService';

/**
 * @api GET /api/worker/profile
 * @description Fetches the worker's profile and job details.
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   designation: string,
 *   hourlyRate: number,
 *   shift: string
 * }>}
 */
const Profile = ({ user: initialUser, onLogout, isDesktop }) => {
  const [user, setUser] = useState(initialUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!initialUser) setIsLoading(true);
      try {
        const profileData = await mockService.getProfile();
        setUser(prev => ({ ...prev, ...profileData }));
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [initialUser]);

  const handleDownloadPayslip = async () => {
    setIsDownloading(true);
    try {
      await mockService.downloadPayslip();
      alert('PDF Payslip downloaded successfully!');
    } catch (error) {
      alert("Failed to generate payslip");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="profile-container">
      {!isDesktop && (
        <header className="page-header">
          <h2>My Profile</h2>
        </header>
      )}

      <main className="profile-content-main">
        <div className="content-wrapper">
          {isDesktop && (
            <div className="desktop-page-header">
              <h1>Account Settings</h1>
              <p>Manage your profile, employment details, and preferences.</p>
            </div>
          )}

          <div className="profile-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Profile Header */}
              <div className="profile-card">
                <div className="avatar-wrapper">
                  <div className="avatar">
                    <span className="avatar-initials">{user?.name?.[0]}</span>
                  </div>
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user?.name}</h3>
                  <span className="user-id">#{user?.id}</span>
                  <span className="user-designation">{user?.designation}</span>
                </div>

                {user?.type === 'Worker' ? (
                  <div className="rate-badge">
                    <span className="rate-label">Hourly Rate</span>
                    <span className="rate-value">₹{user?.hourlyRate || '15.00'}</span>
                  </div>
                ) : (
                  <div className="rate-badge employee">
                    <span className="rate-label">Monthly Base</span>
                    <span className="rate-value">₹{(user?.monthlySalary || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Salary Breakdown (Only for Employees) */}
              {user?.salaryBreakdown && (
                <div className="salary-card glass">
                  <div className="card-header">
                    <Wallet size={20} className="icon-primary" />
                    <h3>Salary Structure</h3>
                  </div>
                  <div className="salary-list">
                    <div className="salary-row">
                      <span>Basic Pay</span>
                      <span className="val">₹{user.salaryBreakdown.basic.toLocaleString()}</span>
                    </div>
                    <div className="salary-row">
                      <span>HRA</span>
                      <span className="val">₹{user.salaryBreakdown.hra.toLocaleString()}</span>
                    </div>
                    <div className="salary-row">
                      <span>Special Allowance</span>
                      <span className="val">₹{user.salaryBreakdown.specialAllowance.toLocaleString()}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="salary-row deduction">
                      <span>PF Deduction</span>
                      <span className="val">-₹{user.salaryBreakdown.pf.toLocaleString()}</span>
                    </div>
                    <div className="salary-row deduction">
                      <span>Prof. Tax</span>
                      <span className="val">-₹{user.salaryBreakdown.pt.toLocaleString()}</span>
                    </div>
                    <div className="total-row">
                      <span>Net Payable</span>
                      <span className="val highlight">₹{user.salaryBreakdown.netPayable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Menu) */}
            <div className="menu-list">
              <button className="menu-item glass" onClick={handleDownloadPayslip} disabled={isDownloading}>
                <div className="menu-left">
                  <div className="icon-box pdf">
                    {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                  </div>
                  <div className="menu-text">
                    <span className="menu-title">Download Payslip</span>
                    <span className="menu-subtitle">November 2023</span>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </button>

              <div className="menu-group">
                <button
                  className={`menu-item glass ${showShiftDetails ? 'expanded' : ''}`}
                  onClick={() => setShowShiftDetails(!showShiftDetails)}
                >
                  <div className="menu-left">
                    <div className="icon-box shift">
                      <Clock size={20} />
                    </div>
                    <div className="menu-text">
                      <span className="menu-title">Shift Details</span>
                      <span className="menu-subtitle">View your working hours</span>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    color="#94a3b8"
                    style={{ transform: showShiftDetails ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>
                {showShiftDetails && (
                  <div className="expandable-content fadeIn">
                    <div className="shift-row">
                      <span>Start Time:</span>
                      <span className="val">{user?.shift?.split(' - ')[0] || '09:00 AM'}</span>
                    </div>
                    <div className="shift-row">
                      <span>End Time:</span>
                      <span className="val">{user?.shift?.split(' - ')[1] || '05:00 PM'}</span>
                    </div>
                    <div className="shift-row">
                      <span>Weekly Off:</span>
                      <span className="val">Sunday</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="logout-section">
                <button className="logout-button" onClick={() => setShowLogoutModal(true)}>
                  <LogOut size={20} />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isLoading && (
        <div className="loading-overlay">
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content fadeIn">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to end your session?</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-logout"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--background);
          position: relative;
        }

        .profile-content-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

        .content-wrapper {
          padding: ${isDesktop ? '40px' : '24px'};
          display: flex;
          flex-direction: column;
          gap: 30px;
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

        .profile-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
          ${isDesktop ? 'display: grid; grid-template-columns: 350px 1fr; align-items: start;' : ''}
        }
        
        .left-column { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 0; }

        .profile-card {
          background: white;
          border-radius: 30px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: var(--shadow-md);
          border: 1px solid #f1f5f9;
        }
        
        .salary-card {
          background: white;
          padding: 24px;
          border-radius: 24px;
          box-shadow: var(--shadow-sm);
          border: 1px solid #f1f5f9;
        }
        
        .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; color: var(--primary-dark); }
        .card-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
        .icon-primary { color: var(--primary); }
        
        .salary-list { display: flex; flex-direction: column; gap: 12px; }
        .salary-row { display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 600; color: #64748b; }
        .salary-row .val { color: var(--text-main); font-weight: 700; }
        .salary-row.deduction .val { color: #ef4444; }
        
        .divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
        
        .total-row { display: flex; justify-content: space-between; margin-top: 4px; padding-top: 8px; border-top: 2px dashed #e2e8f0; font-size: 1.1rem; font-weight: 800; }
        .total-row .val.highlight { color: var(--primary); }

        .avatar-wrapper {
          width: 100px;
          height: 100px;
          background: var(--background);
          border-radius: 35px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
          transform: rotate(-10deg);
        }

        .avatar {
          width: 80px;
          height: 80px;
          background: var(--primary);
          border-radius: 25px;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: rotate(10deg);
        }

        .avatar-initials { color: white; font-size: 2.2rem; font-weight: 800; }
        .user-name { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
        .user-id { font-size: 0.9rem; font-weight: 700; color: var(--primary); background: var(--background); padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }
        .user-designation { font-size: 1rem; font-weight: 600; color: var(--text-muted); }

        .rate-badge {
          margin-top: 24px;
          background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
          padding: 12px 24px;
          border-radius: 16px;
          border: 1px solid #f5d0fe;
        }
        
        .rate-badge.employee {
           background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
           border-color: #a7f3d0;
        }

        .rate-label { font-size: 0.75rem; font-weight: 800; color: #a21caf; text-transform: uppercase; }
        .rate-badge.employee .rate-label { color: #059669; }
        .rate-value { font-size: 1.2rem; font-weight: 800; color: #a21caf; }
         .rate-badge.employee .rate-value { color: #059669; }

        .menu-list { display: flex; flex-direction: column; gap: 16px; }

        .menu-item {
          background: white;
          border: none;
          padding: 20px;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }

        .menu-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .icon-box.pdf { background-color: #ecfeff; color: #0891b2; }
        .icon-box.shift { background-color: #f5f3ff; color: #7c3aed; }

        .menu-title { font-weight: 800; color: var(--text-main); font-size: 1.1rem; }
        .menu-subtitle { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

        .expandable-content {
          background: #f8fafc;
          padding: 24px;
          border-radius: 24px;
          margin-top: -12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid #f1f5f9;
        }

        .shift-row { display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 600; color: #64748b; }
        .shift-row .val { color: var(--text-main); font-weight: 800; }

        .logout-section { margin-top: 24px; }

        .logout-button {
          width: 100%;
          padding: 20px;
          background: #fff1f2;
          border: 1px solid #fecaca;
          color: var(--danger);
          border-radius: 24px;
          font-weight: 800;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover { background: #fee2e2; transform: scale(1.02); }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content { background: white; padding: 40px; border-radius: 32px; width: 380px; text-align: center; box-shadow: var(--shadow-lg); }
        .modal-content h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
        .modal-actions { display: flex; gap: 16px; margin-top: 32px; }
        .btn-cancel, .btn-logout { flex: 1; padding: 16px; border-radius: 16px; font-weight: 800; cursor: pointer; border: none; font-size: 1rem; }
        .btn-cancel { background: #f1f5f9; color: #64748b; }
        .btn-logout { background: var(--danger); color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }

        .fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Profile;
