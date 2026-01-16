import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Calendar, User } from 'lucide-react';

const BottomNav = ({ isDesktop }) => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <History size={24} />
        <span>History</span>
      </NavLink>
      <NavLink to="/leave" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>Leave</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>

      <style jsx>{`
        .bottom-nav {
          height: 70px;
          background: white;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: ${isDesktop ? 'center' : 'space-around'};
          align-items: center;
          position: ${isDesktop ? 'fixed' : 'absolute'};
          bottom: 0;
          width: 100%;
          border-bottom-left-radius: ${isDesktop ? '0' : '30px'};
          border-bottom-right-radius: ${isDesktop ? '0' : '30px'};
          gap: ${isDesktop ? '60px' : '0'};
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: ${isDesktop ? 'row' : 'column'};
          align-items: center;
          gap: ${isDesktop ? '10px' : '4px'};
          color: #999;
          text-decoration: none;
          font-size: ${isDesktop ? '1rem' : '0.7rem'};
          transition: all 0.2s;
          padding: ${isDesktop ? '8px 16px' : '0'};
          border-radius: ${isDesktop ? '12px' : '0'};
        }

        .nav-item:hover {
          color: var(--primary);
          background-color: ${isDesktop ? '#f3f3f3' : 'transparent'};
        }

        .nav-item.active {
          color: var(--primary);
        }

        .nav-item span {
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
};

export default BottomNav;
