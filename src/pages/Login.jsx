import React, { useState } from 'react';
import { Factory, Loader2 } from 'lucide-react';
import mockService from '../services/mockService';
import bannerImage from '../components/banner.jpg';

const Login = ({ onLoginSuccess }) => {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await mockService.login({ id: workerId, password: password });
      onLoginSuccess(userData);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-background">
        <div className="blob shadow-1"></div>
        <div className="blob shadow-2"></div>
      </div>

      {/* Left Side - Login Form */}
      <div className="login-sidebar">
        <div className="login-content">
          <div className="logo-container">
            <div className="logo-circle">
              <Factory size={40} color="white" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="portal-heading">Worker Portal</h1>
          <p className="portal-subheading">Sign in to continue</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Worker ID</label>
              <input
                type="text"
                id="workerId"
                placeholder="e.g. W-1024"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-password-wrapper">
              <a href="#" className="forgot-password-link">Forgot Password?</a>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Banner */}
      <div className="banner-section">
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <h2>Aura HRMS</h2>
          <p>Enterprise Edition</p>
          <div className="banner-tagline">Precision in Payroll, Harmony in Attendance.</div>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          background-color: var(--primary-dark);
          height: 100%;
          width: 100%;
          display: grid;
          grid-template-columns: 400px 1fr;
          color: white;
          overflow: hidden;
          position: relative;
        }

        .login-background {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1;
            pointer-events: none;
        }

        .blob {
            position: absolute;
            width: 300px;
            height: 300px;
            background: var(--primary);
            filter: blur(80px);
            opacity: 0.3;
            border-radius: 50%;
        }

        .shadow-1 { top: -100px; right: -100px; background: #818cf8; }
        .shadow-2 { bottom: -100px; left: -100px; background: #6366f1; }

        /* Left Sidebar - Login Form */
        .login-sidebar {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 30px;
          z-index: 2;
          height: 100vh;
        }

        .login-content {
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeIn 0.6s ease-out;
        }

        .logo-container { margin-bottom: 20px; }

        .logo-circle {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .portal-heading {
          font-size: 1.8rem;
          margin-bottom: 6px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .portal-subheading {
            font-size: 0.85rem;
            color: #cbd5e1;
            margin-bottom: 32px;
            text-align: center;
            opacity: 0.8;
        }

        /* Right Side - Banner */
        .banner-section {
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url(${bannerImage});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 2;
          position: relative;
          height: 100%;
        }

        .banner-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.6) 100%);
            z-index: 1;
        }

        .banner-content {
          text-align: center;
          max-width: 600px;
          padding: 60px;
          position: relative;
          z-index: 2;
        }

        .banner-content h2 {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
          color: white;
          text-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .banner-content p {
          font-size: 1.2rem;
          color: #e2e8f0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 24px;
        }

        .banner-tagline {
          font-size: 1.1rem;
          color: #cbd5e1;
          font-weight: 500;
          line-height: 1.6;
          font-style: italic;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

        .input-group input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          backdrop-filter: blur(5px);
        }

        .input-group input:focus {
          border-color: rgba(255, 255, 255, 0.5);
          background-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
        }

        .forgot-password-wrapper {
          width: 100%;
          text-align: right;
          margin-top: 8px;
        }

        .forgot-password-link {
          color: #cbd5e1;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-password-link:hover {
          color: white;
          text-decoration: underline;
        }

        .login-button {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: white;
          color: var(--primary-dark);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .login-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
        .login-button:active:not(:disabled) { transform: translateY(0); }
        .login-button:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Mobile Responsive Layout */
        @media (max-width: 768px) {
          .login-screen {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            grid-template-rows: none;
            height: 100vh;
            overflow: hidden;
          }

          .login-sidebar {
            order: 2 !important;
            border-right: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            height: auto;
            min-height: 0;
            padding: 30px 24px;
            overflow: hidden;
          }

          .banner-section {
            order: 1 !important;
            height: 180px;
            min-height: 180px;
            flex-shrink: 0;
          }

          .banner-content {
            padding: 24px;
          }

          .banner-content h2 {
            font-size: 2rem;
            margin-bottom: 8px;
          }

          .banner-content p {
            font-size: 0.8rem;
            margin-bottom: 8px;
          }

          .banner-tagline {
            font-size: 0.85rem;
          }

          .login-content {
            padding: 0;
            max-width: 100%;
          }

          .logo-container {
            margin-bottom: 16px;
          }

          .logo-circle {
            width: 60px;
            height: 60px;
          }

          .portal-heading {
            font-size: 1.5rem;
            margin-bottom: 4px;
          }

          .portal-subheading {
            font-size: 0.8rem;
            margin-bottom: 24px;
          }

          .login-form {
            gap: 14px;
          }

          .input-group input {
            padding: 12px 14px;
          }

          .login-button {
            padding: 14px;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
