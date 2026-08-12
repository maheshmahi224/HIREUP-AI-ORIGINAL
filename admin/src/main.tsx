import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import './styles.css';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8787/api';
let csrf = '';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(base + path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(init.headers ?? {}),
    },
  });

  const b = (await r.json().catch(() => null)) as { data?: T; error?: { message: string } } | null;
  if (!r.ok) throw new Error(b?.error?.message ?? 'Request failed');
  return b?.data as T;
}

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => api<{ user: { name: string; role: string }; csrfToken: string }>('/auth/session'),
    retry: false,
  });

  if (session.isLoading) return <p style={{ padding: '48px', textAlign: 'center' }}>Checking access…</p>;
  if (!session.data) return <Navigate to="/login" replace />;

  csrf = session.data.csrfToken;
  if (session.data.user.role !== 'admin') {
    return (
      <main style={{ padding: '64px', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>This area is restricted to verified administrators.</p>
      </main>
    );
  }

  const isCurrent = (path: string) => (location.pathname === path ? 'active' : '');

  return (
    <div className="layout">
      <aside>
        <Link className="brand" to="/">
          hireup<span>ai</span>
          <small>ADMIN</small>
        </Link>
        <nav>
          <Link className={isCurrent('/')} to="/">
            Overview
          </Link>
          <Link className={isCurrent('/users')} to="/users">
            Users
          </Link>
          <Link className={isCurrent('/resumes')} to="/resumes">
            Resumes
          </Link>
          <Link className={isCurrent('/payments')} to="/payments">
            Payments
          </Link>
          <Link className={isCurrent('/ai-analytics')} to="/ai-analytics">
            AI Telemetry
          </Link>
        </nav>
      </aside>

      <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header>
          <div>
            <b>Administrator Operations Dashboard</b>
            <p>Server-enforced access controls</p>
          </div>
          <span className="avatar">{session.data.user.name[0]?.toUpperCase() || 'A'}</span>
        </header>

        <div style={{ flex: 1 }}>{children}</div>
      </section>
    </div>
  );
}

function Login() {
  const nav = useNavigate();
  return (
    <main className="login">
      <div>
        <Link className="brand" to="/" style={{ marginBottom: '16px' }}>
          hireup<span>ai</span>
          <small>ADMIN</small>
        </Link>
        <p className="eyebrow">RESTRICTED AREA</p>
        <h1>Admin Sign In</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 24px' }}>
          Use an administrator account. Authorization is verified by the backend API.
        </p>

        <a className="button" style={{ width: '100%', textDecoration: 'none' }} href={`${base}/auth/google`}>
          Continue with Google Admin Auth
        </a>
        <button
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          onClick={() => nav('/')}
        >
          Return to login
        </button>
      </div>
    </main>
  );
}

function Dashboard() {
  const q = useQuery({
    queryKey: ['metrics'],
    queryFn: () =>
      api<{
        users: number;
        resumes: number;
        paidResumes: number;
        revenue: number;
        aiGenerations: number;
        downloads: number;
        conversion: number;
      }>('/admin/metrics'),
  });

  const m = q.data;

  return (
    <Layout>
      <main className="content">
        <p className="eyebrow">BUSINESS HEALTH</p>
        <h1>Platform Telemetry</h1>

        <div className="metrics">
          {[
            ['Total Registered Users', m?.users],
            ['Total Resumes Created', m?.resumes],
            ['Paid Resumes (₹30)', m?.paidResumes],
            ['Total Revenue', m ? `₹${(m.revenue / 100).toFixed(0)}` : undefined],
            ['AI Generations', m?.aiGenerations],
            ['PDF Downloads', m?.downloads],
            ['Conversion Rate', m ? `${(m.conversion * 100).toFixed(1)}%` : undefined],
          ].map(([k, v]) => (
            <article key={String(k)}>
              <p>{k}</p>
              <b>{v ?? '—'}</b>
            </article>
          ))}
        </div>

        <section className="notice">
          <h2>Data Security & Security Compliance</h2>
          <p>
            Metrics are calculated only from protected backend database records. Password hashes, OTPs, session tokens, and OAuth credentials are strictly excluded from output.
          </p>
        </section>
      </main>
    </Layout>
  );
}

function Table({ kind }: { kind: 'users' | 'resumes' | 'payments' }) {
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: [kind, search],
    queryFn: () => api<Record<string, unknown[]>>(`/admin/${kind}${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  });

  const rows = (q.data?.[kind] as Array<Record<string, unknown>>) || [];

  return (
    <Layout>
      <main className="content">
        <p className="eyebrow">OPERATIONS</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, textTransform: 'capitalize' }}>{kind}</h1>
          {kind === 'users' && (
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '280px' }}
            />
          )}
        </div>

        {q.isLoading ? (
          <p>Loading data…</p>
        ) : (
          <div className="table">
            <div className="table-header">
              <b>{kind === 'users' ? 'User Record' : kind === 'resumes' ? 'Resume Document' : 'Payment Transaction'}</b>
              <span>Timestamp</span>
            </div>

            {rows.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No records found.</p>
            ) : (
              rows.map((r) => (
                <article key={String(r._id)}>
                  <div>
                    <b>
                      {String(r.name || r.title || r.paymentId || r.orderId || r.email || 'Record')}
                    </b>
                    <p>
                      {String(r.email || r.templateId || r.status || r.role || '—')}
                      {r.paymentState ? ` • ${r.paymentState}` : ''}
                      {r.amount ? ` • ₹${Number(r.amount) / 100}` : ''}
                    </p>
                  </div>
                  <time>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : '—'}</time>
                </article>
              ))
            )}
          </div>
        )}
      </main>
    </Layout>
  );
}

function AiAnalytics() {
  const q = useQuery({
    queryKey: ['ai-analytics'],
    queryFn: () =>
      api<{
        totalGenerations: number;
        avgInputLen: number;
        estimatedCostUsd: string;
        logs: Array<Record<string, unknown>>;
      }>('/admin/ai-analytics'),
  });

  const d = q.data;

  return (
    <Layout>
      <main className="content">
        <p className="eyebrow">AI LOGS & COSTS</p>
        <h1>AI Usage Telemetry</h1>

        <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <article>
            <p>Total AI Extractions</p>
            <b>{d?.totalGenerations ?? 0}</b>
          </article>
          <article>
            <p>Average Input Length (chars)</p>
            <b>{d?.avgInputLen ?? 0}</b>
          </article>
          <article>
            <p>Estimated OpenAI API Cost</p>
            <b>${d?.estimatedCostUsd ?? '0.000'}</b>
          </article>
        </div>

        <div className="table" style={{ marginTop: '24px' }}>
          <div className="table-header">
            <b>AI Generation Log</b>
            <span>Date</span>
          </div>
          {q.isLoading ? (
            <p style={{ padding: '24px', textAlign: 'center' }}>Loading AI logs…</p>
          ) : !d?.logs?.length ? (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No AI generations logged yet.</p>
          ) : (
            d.logs.map((log) => (
              <article key={String(log._id)}>
                <div>
                  <b>User ID: {String(log.userId)}</b>
                  <p>
                    Input Length: {String(log.rawInputLength)} chars • Missing fields flagged: {String(log.missingFieldsCount)}
                  </p>
                </div>
                <time>{log.createdAt ? new Date(String(log.createdAt)).toLocaleString() : '—'}</time>
              </article>
            ))
          )}
        </div>
      </main>
    </Layout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Table kind="users" />} />
      <Route path="/resumes" element={<Table kind="resumes" />} />
      <Route path="/payments" element={<Table kind="payments" />} />
      <Route path="/ai-analytics" element={<AiAnalytics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
