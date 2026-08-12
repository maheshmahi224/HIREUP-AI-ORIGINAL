import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function Resumes() {
  const queryClient = useQueryClient();

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<{ resumes: Resume[] }>('/resumes'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api(`/resumes/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const resumes = resumesQuery.data?.resumes || [];

  return (
    <Shell>
      <div className="dashboard">
        <div className="page-head">
          <div>
            <p className="eyebrow">SAVED RESUMES</p>
            <h1>Manage your resumes</h1>
            <p>Your work is saved automatically. Edit or duplicate tailored versions for different applications.</p>
          </div>
          <Link className="button mobile-full-btn" to="/builder">
            + New Resume
          </Link>
        </div>

        {resumesQuery.isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading saved resumes…</div>
        ) : resumes.length > 0 ? (
          <div className="resume-card-list">
            {resumes.map((r) => (
              <div key={r._id} className="resume-list-item-card">
                <div className="resume-item-top">
                  <div className="resume-item-header-info">
                    <h3 className="resume-item-title">{r.title}</h3>
                    <div className="resume-item-template">
                      Template: <span className="template-name">{r.templateId || 'Classic'}</span>
                    </div>
                  </div>
                  <div className="resume-item-top-actions">
                    <button
                      className="icon-action-btn"
                      title="Duplicate Resume"
                      onClick={() => duplicateMutation.mutate(r._id)}
                      disabled={duplicateMutation.isPending}
                    >
                      📋
                    </button>
                    <button
                      className="icon-action-btn danger"
                      title="Delete Resume"
                      onClick={() => {
                        if (confirm(`Delete "${r.title}"? This action cannot be undone.`)) {
                          deleteMutation.mutate(r._id);
                        }
                      }}
                    >
                      🗑️
                    </button>
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
                    Edit Resume →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', background: '#fff' }}>
            <h3>No saved resumes found</h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 24px' }}>
              Create your first resume with AI or build manually.
            </p>
            <Link className="button" to="/builder">
              Create a resume
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}

