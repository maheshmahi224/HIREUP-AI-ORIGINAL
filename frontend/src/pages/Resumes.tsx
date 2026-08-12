import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';

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
            <h1>Manage your resumes.</h1>
            <p>Your work is saved automatically. Edit or duplicate tailored versions for different applications.</p>
          </div>
          <Link className="button" to="/builder">
            + New Resume
          </Link>
        </div>

        {resumesQuery.isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading saved resumes…</div>
        ) : resumes.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {resumes.map((r) => (
              <div key={r._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{r.title}</h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <span>Updated {new Date(r.updatedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>Template: {r.templateId}</span>
                    <span>•</span>
                    <span className={`badge ${r.paymentState === 'paid' ? 'paid' : 'unpaid'}`}>
                      {r.paymentState === 'paid' ? 'Paid' : 'Preview only'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Link to={`/editor/${r._id}`} className="button secondary" style={{ height: '36px', padding: '0 12px', fontSize: '13px' }}>
                    Edit
                  </Link>
                  <button
                    className="text-button"
                    style={{ fontSize: '13px' }}
                    onClick={() => duplicateMutation.mutate(r._id)}
                    disabled={duplicateMutation.isPending}
                  >
                    Duplicate
                  </button>
                  <button
                    className="text-button"
                    style={{ color: 'var(--color-danger)', fontSize: '13px' }}
                    onClick={() => {
                      if (confirm(`Delete "${r.title}"? This action cannot be undone.`)) {
                        deleteMutation.mutate(r._id);
                      }
                    }}
                  >
                    Delete
                  </button>
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
