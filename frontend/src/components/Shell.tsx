import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setCsrf, type Session } from '../api/client.js';

export function Shell({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  const nav = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

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
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--color-text-secondary)' }}>
        Loading your workspace…
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
      <aside>
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

      <section className="workspace">
        <header>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Authenticated Workspace</span>
            <h3 style={{ margin: 0, fontSize: '15px' }}>{session.data.user.name}</h3>
          </div>
          <span className="avatar">{session.data.user.name[0]?.toUpperCase() || 'U'}</span>
        </header>

        <main style={{ flex: 1 }}>{children}</main>
      </section>
    </div>
  );
}
