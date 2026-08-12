import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${month} · ${time}`;
  } catch {
    return dateStr;
  }
}

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
            <h1>Make your next application count</h1>
            <p>Start a resume from scratch or turn your career notes into a structured first draft.</p>
          </div>

          <div className="dashboard-head-actions">
            <Link className="button" to="/ai">
              Build with AI →
            </Link>
            <Link className="button secondary" to="/builder">
              Build manually
            </Link>
          </div>
        </div>

        {/* Quick action grid */}
        <div className="dashboard-quick-grid">
          <Link
            to="/ai"
            className="card dashboard-action-card primary-border"
          >
            <span className="card-icon">✦</span>
            <div>
              <h3>Build with AI</h3>
              <p>
                Dump your career notes. Our AI organizes them cleanly without inventing credentials.
              </p>
            </div>
          </Link>

          <Link to="/builder" className="card dashboard-action-card">
            <span className="card-icon neutral">＋</span>
            <div>
              <h3>Build manually</h3>
              <p>
                Start with a structured editor and customize every section at your own pace.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Resumes */}
        <section>
          <div className="dashboard-section-head">
            <h2>Recent Resumes</h2>
            <Link to="/resumes" className="text-button">
              View all →
            </Link>
          </div>

          {resumesQuery.isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading resumes…</div>
          ) : resumes.length > 0 ? (
            <div className="resume-card-list">
              {resumes.slice(0, 4).map((r) => (
                <div key={r._id} className="resume-list-item-card">
                  <div className="resume-item-top">
                    <div className="resume-item-header-info">
                      <h3 className="resume-item-title">{r.title}</h3>
                      <div className="resume-item-template">
                        Template: <span className="template-name">{r.templateId || 'Classic'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="resume-item-meta-row">
                    <span className="resume-item-timestamp">Updated {formatDate(r.updatedAt)}</span>
                    <span className={`badge ${r.paymentState === 'paid' ? 'paid' : 'unpaid'}`}>
                      {r.paymentState === 'paid' ? '✓ Paid' : 'Preview only'}
                    </span>
                  </div>

                  <div className="resume-item-action-row">
                    <Link to={`/editor/${r._id}`} className="button secondary resume-edit-btn">
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
