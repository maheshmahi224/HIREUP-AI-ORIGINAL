import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setCsrf, type Session } from '../api/client.js';
import { BrandLogo } from './BrandLogo.js';

export function Shell({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  const nav = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => api<Session>('/auth/session'),
    retry: false,
  });

  useEffect(() => {
    if (session.data?.csrfToken) {
      setCsrf(session.data.csrfToken);
    }
  }, [session.data]);

  if (session.isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--color-text-secondary)', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <BrandLogo size="lg" showText={false} />
          <p style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!session.data) {
    return <Navigate to="/login" replace />;
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setCsrf('');
    queryClient.clear();
    nav('/');
  };

  const isCurrent = (path: string) => (location.pathname === path ? 'active' : '');

  if (fullBleed) {
    return <>{children}</>;
  }

  return (
    <div className="shell">
      {/* Mobile Top App Bar */}
      <div className="mobile-top-bar">
        <BrandLogo to="/dashboard" size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
            {session.data.user.name[0]?.toUpperCase() || 'U'}
          </span>
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Slide-Out Drawer Menu for Mobile */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div>
                <strong style={{ fontSize: '15px', color: '#0F172A' }}>{session.data.user.name}</strong>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{session.data.user.email}</p>
              </div>
              <button type="button" className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            <nav className="mobile-drawer-nav">
              <Link className={isCurrent('/dashboard')} to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                📊 Overview
              </Link>
              <Link className={isCurrent('/ai')} to="/ai" onClick={() => setMobileMenuOpen(false)}>
                ⚡ Build with AI
              </Link>
              <Link className={isCurrent('/builder')} to="/builder" onClick={() => setMobileMenuOpen(false)}>
                ✏️ Build manually
              </Link>
              <Link className={isCurrent('/resumes')} to="/resumes" onClick={() => setMobileMenuOpen(false)}>
                📄 My Resumes
              </Link>
              <Link className={isCurrent('/profile')} to="/profile" onClick={() => setMobileMenuOpen(false)}>
                👤 Master Profile
              </Link>
              <Link className={isCurrent('/support')} to="/support" onClick={() => setMobileMenuOpen(false)}>
                💬 Support & Help
              </Link>
            </nav>
            <button
              type="button"
              className="text-button"
              style={{ color: '#EF4444', width: '100%', textAlign: 'left', marginTop: '20px', fontWeight: 700, padding: '10px 14px' }}
              onClick={logout}
            >
              🚪 Log out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div style={{ marginBottom: '24px', paddingLeft: '8px' }}>
          <BrandLogo to="/dashboard" size="md" />
        </div>

        <nav>
          <Link className={isCurrent('/dashboard')} to="/dashboard">
            Overview
          </Link>
          <Link className={isCurrent('/ai')} to="/ai">
            Build with AI
          </Link>
          <Link className={isCurrent('/builder')} to="/builder">
            Build manually
          </Link>
          <Link className={isCurrent('/resumes')} to="/resumes">
            My resumes
          </Link>
          <Link className={isCurrent('/profile')} to="/profile">
            Master profile
          </Link>
          <Link className={isCurrent('/support')} to="/support">
            Support & Help 💬
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="text-button" style={{ color: 'var(--color-danger)', width: '100%', textAlign: 'left' }} onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      {/* Main Workspace View */}
      <section className="workspace">
        <header className="desktop-header">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Authenticated Workspace</span>
            <h3 style={{ margin: 0, fontSize: '15px' }}>{session.data.user.name}</h3>
          </div>
          <span className="avatar">{session.data.user.name[0]?.toUpperCase() || 'U'}</span>
        </header>

        <main style={{ flex: 1 }}>{children}</main>
      </section>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-tab-bar">
        <Link className={`tab-item ${isCurrent('/dashboard')}`} to="/dashboard">
          <span className="tab-icon">📊</span>
          <span className="tab-label">Home</span>
        </Link>
        <Link className={`tab-item ${isCurrent('/ai')}`} to="/ai">
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Build AI</span>
        </Link>
        <Link className={`tab-item ${isCurrent('/resumes')}`} to="/resumes">
          <span className="tab-icon">📄</span>
          <span className="tab-label">Resumes</span>
        </Link>
        <Link className={`tab-item ${isCurrent('/support')}`} to="/support">
          <span className="tab-icon">💬</span>
          <span className="tab-label">Support</span>
        </Link>
      </nav>
    </div>
  );
}
