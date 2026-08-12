import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';

export function Builder() {
  const nav = useNavigate();
  const [title, setTitle] = useState('Untitled Resume');
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('classic');
  const [summary, setSummary] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      api<{ resume: Resume }>('/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          templateId,
          content: {
            personal: { name },
            summary,
            education: [],
            experience: [],
            projects: [],
            skills: [],
          },
        }),
      }),
    onSuccess: (res) => {
      nav(`/editor/${res.resume._id}`);
    },
  });

  return (
    <Shell>
      <div className="builder-start" style={{ maxWidth: '640px', margin: '40px auto' }}>
        <p className="eyebrow">BUILD MANUALLY</p>
        <h1>Start with the essentials.</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Create a clean structured resume draft and open the live A4 editor.
        </p>

        <div className="card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label>Resume Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer Internship 2026" />
          </div>

          <div>
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
          </div>

          <div>
            <label>Template Choice</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="classic">Classic (Traditional & ATS Friendly)</option>
              <option value="modern">Modern (Clean Sans-serif & Accents)</option>
              <option value="executive">Executive (Senior & Leadership)</option>
              <option value="azurill">Azurill (Vibrant Color Accents)</option>
              <option value="professional">Professional (High Density)</option>
            </select>
          </div>

          <div>
            <label>Professional Summary</label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview of your background, achievements, and career goals."
            />
          </div>

          {createMutation.error && <div className="alert alert-danger">{createMutation.error.message}</div>}

          <button
            className="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !title.trim()}
          >
            {createMutation.isPending ? 'Creating draft…' : 'Continue to Editor →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}
