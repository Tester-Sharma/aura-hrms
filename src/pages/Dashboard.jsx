import React, { useState, useEffect } from 'react';
import { Bell, Clock, Info, Play, Square, Activity, History as HistoryIcon, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import mockService from '../services/mockService';

const Dashboard = ({ user, onLogout, isDesktop }) => {
  const [activeView, setActiveView] = useState('clock'); // 'clock' or 'notice'
  const [clockMode, setClockMode] = useState('analog'); // 'analog' or 'digital'
  const [time, setTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);
  const [stats, setStats] = useState({ workedHours: 0, overtime: 0, leaveBalance: 0, estimatedEarnings: 0 });
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
      try {
        const data = await mockService.getDashboardData();
        setStats(data.stats);
        setNotices(data.notices);
        
        // Sync punch status from backend source of truth
        if (data.status) {
            setIsPunchedIn(data.status.isPunchedIn);
            if (data.status.lastPunchTime && data.status.isPunchedIn) {
                setPunchTime(new Date(data.status.lastPunchTime));
            }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

  // Fetch Initial Data
  useEffect(() => {
    fetchData();
  }, []);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notice Board Auto-toggle (50s)
  useEffect(() => {
    let timeout;
    if (activeView === 'clock') {
      timeout = setTimeout(() => {
        setActiveView('notice');
      }, 50000);
    }
    return () => clearTimeout(timeout);
  }, [activeView]);

  const toggleClockMode = () => {
    setClockMode(prev => prev === 'analog' ? 'digital' : 'analog');
  };

  const handlePunchIn = async () => {
    try {
      await mockService.punchIn();
      setIsPunchedIn(true);
      setPunchTime(new Date());
      // Refresh stats to show updated "Worked Hours" if applicable (or at least confirm connectivity)
      fetchData(); 
    } catch (error) {
      alert(`Punch In failed: ${error.message}`);
    }
  };

  const handlePunchOut = async () => {
    try {
      await mockService.punchOut();
      setIsPunchedIn(false);
      // Refresh stats to show updated "Worked Hours" immediately
      fetchData();
    } catch (error) {
      alert(`Punch Out failed: ${error.message}`);
    }
  };

  const renderAnalogClock = () => {
    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    return (
      <div className="analog-clock" onClick={toggleClockMode} aria-label={`Current time ${format(time, 'hh:mm a')}. Analog view. Tap to switch to digital.`}>
        <svg viewBox="0 0 100 100" className="clock-svg">
          <circle cx="50" cy="50" r="45" className="clock-face" />
          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="50" y1="10" x2="50" y2="15"
              transform={`rotate(${i * 30} 50 50)`}
              className="clock-marker"
            />
          ))}
          {/* Hands */}
          <line
            x1="50" y1="50" x2="50" y2="25"
            transform={`rotate(${(hours % 12) * 30 + minutes * 0.5} 50 50)`}
            className="hand hour-hand"
          />
          <line
            x1="50" y1="50" x2="50" y2="15"
            transform={`rotate(${minutes * 6 + seconds * 0.1} 50 50)`}
            className="hand minute-hand"
          />
          <line
            x1="50" y1="50" x2="50" y2="10"
            transform={`rotate(${seconds * 6} 50 50)`}
            className="hand second-hand"
          />
          <circle cx="50" cy="50" r="2" className="clock-center" />
        </svg>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Header - Only on Mobile */}
      {!isDesktop && (
        <header className="dashboard-header">
          <span className="welcome-text">Hello, {user?.name?.split(' ')[0]}</span>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
        </header>
      )}

      <main className="dashboard-content">
        <div className="content-wrapper">
          {isDesktop && (
            <div className="desktop-welcome">
              <h1>Dashboard</h1>
              <p>Welcome back, {user?.name}. Here's what's happening today.</p>
            </div>
          )}
          {/* Hero Card: Clock or Notice Board */}
          <section className="hero-card">
            {activeView === 'clock' ? (
              <div className={`clock-container fadeIn`}>
                {clockMode === 'analog' ? renderAnalogClock() : (
                  <div className="digital-clock" onClick={toggleClockMode} role="timer">
                    {format(time, 'hh:mm:ss a')}
                  </div>
                )}
                <p className="clock-hint">Tap to switch view</p>
              </div>
            ) : (
              <div className="notice-board fadeIn" aria-live="polite">
                <div className="notice-header">
                  <h3>Factory Updates</h3>
                  <button
                    className="recall-button"
                    onClick={() => setActiveView('clock')}
                    aria-label="Return to Clock View"
                  >
                    <Clock size={16} />
                  </button>
                </div>
                <ul className="notice-list">
                  {notices.map(notice => (
                    <li key={notice.id}><Info size={14} /> {notice.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Punch Controls */}
          <section className="punch-controls">
            <button
              className={`punch-button in ${isPunchedIn ? 'disabled' : ''}`}
              onClick={handlePunchIn}
              disabled={isPunchedIn}
            >
              <div className="btn-glow"></div>
              <Play size={18} fill="currentColor" />
              Punch In
            </button>
            <button
              className={`punch-button out ${!isPunchedIn ? 'disabled' : ''}`}
              onClick={handlePunchOut}
              disabled={!isPunchedIn}
            >
              <Square size={18} fill="currentColor" />
              Punch Out
            </button>
          </section>

          {/* Today's Highlight */}
          <section className="today-highlight glass fadeIn">
            <div className="highlight-item">
                <span className="hl-label">Today's Wages</span>
                <span className="hl-value">₹{(stats.todayEarnings || 0).toLocaleString()}</span>
            </div>
            <div className="divider-v"></div>
            <div className="highlight-item">
                <span className="hl-label">Today's Hours</span>
                <span className="hl-value">{(stats.todayWorked || 0)} Hrs</span>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-bg"><Activity size={18} /></div>
              <span className="stat-label">Total Worked</span>
              <span className="stat-value">{stats.workedHours} Hrs</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon-bg"><Clock size={18} /></div>
              <span className="stat-label">Total Overtime</span>
              <span className="stat-value">{stats.overtime} Hrs</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon-bg"><Bell size={18} /></div>
              <span className="stat-label">Leave Bal</span>
              <span className="stat-value">{stats.leaveBalance} Days</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon-bg"><LogOut size={18} /></div>
              <span className="stat-label">Total Earnings</span>
              <span className="stat-value">₹{stats.estimatedEarnings.toLocaleString()}</span>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          color: var(--primary);
          background-color: var(--background);
        }

        .dashboard-header {
          height: 70px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          color: white;
          box-shadow: var(--shadow-md);
        }

        .welcome-text {
          font-weight: 700;
          font-size: 1.2rem;
        }

        .icon-button {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          backdrop-filter: blur(4px);
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background-color: var(--action);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--action);
        }

        .dashboard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .content-wrapper {
          padding: ${isDesktop ? '40px' : '24px'};
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          max-width: 1200px;
          margin: ${!isDesktop ? 'auto' : '0 auto'};
        }

        .desktop-welcome h1 {
            font-size: 2.5rem;
            color: var(--primary-dark);
            font-weight: 800;
            margin-bottom: 8px;
        }

        .desktop-welcome p {
            color: var(--text-muted);
            font-size: 1.1rem;
        }

        .hero-card {
          height: ${isDesktop ? '380px' : '280px'};
          background: white;
          border-radius: 24px;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          border: 1px solid rgba(255,255,255,0.8);
        }

        .today-highlight {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 24px;
          background: white;
          border-radius: 24px;
          box-shadow: var(--shadow-sm);
          border: 1px solid #f1f5f9;
        }

        .highlight-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .hl-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .hl-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
        }

        .divider-v {
          width: 1px;
          height: 40px;
          background: #e2e8f0;
        }

        .clock-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #ffffff 0%, #f8f9fe 100%);
        }

        .analog-clock { width: 180px; height: 180px; }
        .clock-face { fill: none; stroke: var(--primary); stroke-width: 1.5; }
        .clock-marker { stroke: var(--primary-light); stroke-width: 2; }
        .hour-hand { stroke: var(--primary-dark); stroke-width: 4; }
        .minute-hand { stroke: var(--primary); stroke-width: 3; }
        .second-hand { stroke: var(--action); stroke-width: 1.5; }

        .digital-clock {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary-dark);
          text-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .notice-board {
          padding: 24px;
          height: 100%;
          background: white;
        }

        .notice-header h3 { font-weight: 800; font-size: 1.3rem; }

        .punch-controls { display: flex; gap: 16px; }

        .punch-button {
          flex: 1;
          padding: 18px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .punch-button.in {
          background: var(--primary);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(98, 0, 234, 0.25);
        }

        .punch-button.in:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(98, 0, 234, 0.35);
        }

        .punch-button.out {
          background-color: white;
          color: var(--danger);
          border: 2px solid #fee2e2;
        }

        .punch-button.out:hover:not(:disabled) {
          background-color: #fff1f2;
          border-color: var(--danger);
        }

        .punch-button.disabled {
          opacity: 0.5;
          filter: grayscale(0.8);
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: ${isDesktop ? 'repeat(4, 1fr)' : '1fr 1fr'};
          gap: 16px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          border: 1px solid #f1f5f9;
          transition: transform 0.2s;
        }

        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .stat-icon-bg {
          width: 36px;
          height: 36px;
          background: var(--background);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.3rem; font-weight: 800; color: var(--text-main); }

        .fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div >
  );
};

export default Dashboard;
