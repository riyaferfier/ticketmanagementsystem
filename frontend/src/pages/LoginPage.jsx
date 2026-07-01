import React, { useState } from 'react';
import { Ticket, Lock, Mail, AlertCircle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { loginApi } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);

    // Criteria 2: Email and password are mandatory
    if (!email.trim() || !password.trim()) {
      setError('Email and password are mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(email.trim(), password);
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      // Criteria 3 & 4: Invalid credentials error & 5 attempt lockout
      if (err.locked) {
        setIsLocked(true);
        setError(err.message || 'Account locked due to 5 failed login attempts.');
        setAttemptsLeft(0);
      } else {
        setError(err.message || 'Invalid email or password.');
        if (err.attemptsLeft !== undefined) {
          setAttemptsLeft(err.attemptsLeft);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
    setIsLocked(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>
      <div className="glass-panel animate-scale-up" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }} data-testid="login-container">
        
        {/* Decorative Top Banner */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'var(--grad-primary)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: 'var(--glow-primary)'
          }}>
            <Ticket size={32} color="#6366f1" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }} data-testid="login-title">
            Welcome to TicketSuite
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Enterprise Support & Ticket Resolution Hub
          </p>
        </div>

        {error && (
          <div className={`alert ${isLocked ? 'alert-error' : 'alert-error'} animate-fade-in`} data-testid="login-error-banner">
            {isLocked ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }} data-testid="login-error-text">{error}</p>
              {attemptsLeft !== null && !isLocked && (
                <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Warning: Account will lock after {attemptsLeft} more failed attempt{attemptsLeft !== 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address <span style={{ color: '#f43f5e' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="text"
                className="form-input"
                placeholder="e.g. customer@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                data-testid="login-email-input"
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password <span style={{ color: '#f43f5e' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                data-testid="login-password-input"
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 600 }}
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Fill Section for Playwright Testing */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
            <Sparkles size={14} color="#a855f7" />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
              Quick Demo Accounts (Password: password123)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('customer@test.com')}
              style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22d3ee' }}
              data-testid="demo-customer-btn"
            >
              Customer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('agent@test.com')}
              style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc' }}
              data-testid="demo-agent-btn"
            >
              Support Agent
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('admin@test.com')}
              style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
              data-testid="demo-admin-btn"
            >
              Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
