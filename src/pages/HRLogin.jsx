import React, { useState } from 'react';
import { ShieldCheck, Loader2, Building2, Lock, User } from 'lucide-react';
import mockService from '../services/mockService';

const HRLogin = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({ id: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userData = await mockService.login(credentials);
            if (userData.role !== 'hr') {
                throw new Error('Access Denied: Corporate HR credentials required');
            }
            onLoginSuccess(userData);
        } catch (err) {
            setError(err.message || 'Invalid HR credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="hr-login-container">
            <div className="login-grid">
                {/* Left Panel - Branding */}
                <div className="brand-panel">
                    <div className="brand-content">
                        <div className="brand-logo">
                            <Building2 size={64} strokeWidth={1.5} />
                        </div>
                        <h1>Aura HRMS</h1>
                        <p className="brand-tagline">Corporate Intelligence Suite</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <ShieldCheck size={20} />
                                <span>Secure Access Control</span>
                            </div>
                            <div className="feature-item">
                                <Building2 size={20} />
                                <span>Enterprise-Grade Platform</span>
                            </div>
                            <div className="feature-item">
                                <User size={20} />
                                <span>HR Management Tools</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="login-panel">
                    <div className="login-form-wrapper">
                        <div className="form-header">
                            <h2>HR Portal Access</h2>
                            <p>Authenticate with your corporate credentials</p>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="hr-id">
                                    <User size={16} />
                                    <span>HR Identifier</span>
                                </label>
                                <input
                                    id="hr-id"
                                    type="text"
                                    placeholder="H-101"
                                    value={credentials.id}
                                    onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="hr-password">
                                    <Lock size={16} />
                                    <span>Access Key</span>
                                </label>
                                <input
                                    id="hr-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <ShieldCheck size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={20} />
                                        <span>Authorize Access</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>Restricted to authorized HR personnel only</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .hr-login-container {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          position: relative;
          overflow: hidden;
        }

        .hr-login-container::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          border-radius: 50%;
        }

        .login-grid {
          display: grid;
          grid-template-columns: 500px 550px;
          max-width: 1200px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 1;
        }

        .brand-panel {
          background: linear-gradient(135deg, var(--primary-dark) 0%, #1e1b4b 100%);
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          border-radius: 50%;
        }

        .brand-content {
          position: relative;
          z-index: 1;
        }

        .brand-logo {
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 32px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand-panel h1 {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .brand-tagline {
          font-size: 1.25rem;
          color: #cbd5e1;
          margin-bottom: 48px;
          font-weight: 500;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          padding: 12px 0;
        }

        .feature-item svg {
          opacity: 0.8;
        }

        .login-panel {
          padding: 60px 50px;
          display: flex;
          align-items: center;
          background: white;
        }

        .login-form-wrapper {
          width: 100%;
        }

        .form-header {
          margin-bottom: 40px;
        }

        .form-header h2 {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-dark);
          margin-bottom: 8px;
        }

        .form-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group label svg {
          color: var(--primary);
        }

        .form-group input {
          padding: 16px 20px;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          outline: none;
          transition: all 0.2s;
        }

        .form-group input:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #e11d48;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .submit-btn {
          margin-top: 12px;
          padding: 18px 24px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          font-weight: 800;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
          transition: all 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .login-footer p {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default HRLogin;
