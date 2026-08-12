import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';

export function Dashboard() {
  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<{ resumes: Resume[] }>('/resumes'),
  });

  const resumes = resumesQuery.data?.resumes || [];

  return (
    <Shell>
      <div className="dashboard">
        <div className="page-head">
          <div>
            <p className="eyebrow">YOUR CAREER WORKSPACE</p>
            <h1>Make your next application count.</h1>
            <p>Start a resume from scratch or turn your career notes into a structured first draft.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link className="button secondary" to="/builder">
              Build manually
            </Link>
            <Link className="button" to="/ai">
              Build with AI →
            </Link>
          </div>
        </div>

        {/* Quick action grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '36px 0 48px' }}>
          <Link
            to="/ai"
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderColor: 'var(--color-primary-light)' }}
          >
            <span style={{ fontSize: '24px', color: 'var(--color-primary)' }}>✦</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Build with AI</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Dump your career notes. Our AI organizes them cleanly without inventing credentials.
              </p>
            </div>
          </Link>

          <Link to="/builder" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '24px', color: 'var(--color-text)' }}>＋</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Build manually</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Start with a structured editor and customize every section at your own pace.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Resumes */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Recent Resumes</h2>
            <Link to="/resumes" className="text-button">
              View all
            </Link>
          </div>

          {resumesQuery.isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading resumes…</div>
          ) : resumes.length > 0 ? (
            <div className="resume-grid">
              {resumes.slice(0, 4).map((r) => (
                <div key={r._id} className="resume-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3>{r.title}</h3>
                      <span className={`badge ${r.paymentState === 'paid' ? 'paid' : 'unpaid'}`}>
                        {r.paymentState === 'paid' ? 'Unlocked' : 'Preview only'}
                      </span>
                    </div>
                    <p style={{ marginTop: '8px' }}>Updated {new Date(r.updatedAt).toLocaleDateString()}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {r.templateId || 'Classic'}
                    </span>
                    <Link to={`/editor/${r._id}`} className="text-button" style={{ padding: 0 }}>
                      Open Editor →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px',
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <h3 style={{ margin: '0 0 8px' }}>Your first resume starts here</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 24px', fontSize: '14px' }}>
                Create a reusable foundation for every job application.
              </p>
              <Link className="button" to="/builder">
                Create a resume
              </Link>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
