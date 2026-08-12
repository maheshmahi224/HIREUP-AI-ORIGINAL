import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, apiBase, setCsrf, type Session } from '../api/client.js';

export function Auth({ signup = false }: { signup?: boolean }) {
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionStatus, setTransitionStatus] = useState('Authenticating session...');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'otp') {
        if (!code.trim()) {
          await api('/auth/otp/request', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
          setInfo('Verification code sent to your email.');
          setCode(' '); // Prompt for code
          setLoading(false);
          return;
        }

        const res = await api<Session>('/auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code: code.trim() }),
        });
        if (res?.csrfToken) setCsrf(res.csrfToken);
      } else {
        const res = await api<Session>(signup ? '/auth/register' : '/auth/login', {
          method: 'POST',
          body: JSON.stringify(signup ? { name, email, password } : { email, password }),
        });
        if (res?.csrfToken) setCsrf(res.csrfToken);
      }

      // Trigger cool transition popup
      setShowTransition(true);
      setTransitionProgress(15);
      setTransitionStatus('Authentication verified! 🔒');

      setTimeout(() => {
        setTransitionProgress(55);
        setTransitionStatus('Preparing your Dashboard workspace... ⚡');
      }, 400);

      setTimeout(() => {
        setTransitionProgress(90);
        setTransitionStatus('Loading career profile & templates... ☕');
      }, 900);

      await queryClient.invalidateQueries({ queryKey: ['session'] });

      setTimeout(() => {
        setTransitionProgress(100);
        setTransitionStatus('Welcome! Launching Dashboard... 🚀');
        setTimeout(() => {
          nav('/dashboard');
        }, 300);
      }, 1400);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setShowTransition(false);
      setLoading(false);
    }
  };

  const googleUrl = `${apiBase}/auth/google`;

  return (
    <div className="auth-page-container">
      <div className="auth-layout-grid">
        {/* Left Side: Coffee Cup GIF & Brand Showcase */}
        <div className="auth-left-card">
          <div className="auth-left-header">
            <Link className="auth-left-brand" to="/">
              HireUp<span>.AI</span>
            </Link>
          </div>

          <div className="auth-gif-wrapper">
            <img
              src="/coffee-cup.gif"
              alt="Big dreams. Better resume."
              className="auth-coffee-gif"
            />
          </div>

          <div className="auth-left-footer">
            <h3>Big dreams. Better resume.</h3>
            <p>Fuel your job search with AI-crafted, recruiter-tested resumes. Pay only &#8377;30 on PDF download.</p>
            <div className="auth-feature-tags">
              <span className="auth-tag">☕ ₹30 per download</span>
              <span className="auth-tag">⚡ Instant AI Extract</span>
              <span className="auth-tag">🎨 1-Click Styles</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="auth-right-form">
          <Link className="brand" to="/" style={{ marginBottom: '20px', display: 'inline-block' }}>
            hireup<span>ai</span>
          </Link>

          <p className="eyebrow">{signup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p>
          <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>{signup ? 'Start building for free' : 'Log in to HireUp'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>
            Save your career profile and craft recruiter-ready resumes in minutes.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {signup && mode === 'password' && (
              <div>
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Mahesh Kumar" />
              </div>
            )}

            <div>
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            {mode === 'password' ? (
              <div>
                <label>Password</label>
                <input
                  type="password"
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 12 characters"
                />
              </div>
            ) : code.trim() ? (
              <div>
                <label>6-Digit Verification Code</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={code.trim()}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="123456"
                />
              </div>
            ) : null}

            <button className="button" type="submit" disabled={loading} style={{ marginTop: '6px' }}>
              {loading
                ? 'Processing…'
                : mode === 'otp'
                ? code.trim()
                  ? 'Verify and continue'
                  : 'Send email code'
                : signup
                ? 'Create account'
                : 'Log in'}
            </button>

            <button
              type="button"
              className="text-button"
              style={{ fontSize: '12px', margin: '0 auto' }}
              onClick={() => {
                setMode(mode === 'otp' ? 'password' : 'otp');
                setCode('');
                setError('');
              }}
            >
              {mode === 'otp' ? 'Use password instead' : 'Log in with email code (OTP)'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>OR</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
            </div>

            <a
              href={googleUrl}
              className="button secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </a>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
              {signup ? 'Already have an account?' : 'New to HireUp AI?'}{' '}
              <Link to={signup ? '/login' : '/signup'} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {signup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Dashboard Launching Popup Modal */}
      {showTransition && (
        <div className="dashboard-launch-backdrop">
          <div className="dashboard-launch-card">
            <div className="launch-coffee-ring">
              <img src="/coffee-cup.gif" alt="Brewing Dashboard" className="launch-coffee-gif" />
            </div>
            <h3 className="launch-title">Entering Workspace</h3>
            <p className="launch-status">{transitionStatus}</p>
            <div className="launch-progress-bar">
              <div className="launch-progress-fill" style={{ width: `${transitionProgress}%` }} />
            </div>
            <div className="launch-badge">☕ HireUp AI Dashboard</div>
          </div>
        </div>
      )}
    </div>
  );
}
