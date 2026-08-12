import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, type ExtractedData, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';

export function AiBuilder() {
  const nav = useNavigate();
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('AI Generated Resume');
  const [templateId, setTemplateId] = useState('azurill');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const extractMutation = useMutation({
    mutationFn: () =>
      api<{ extracted: ExtractedData }>('/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ rawInput: rawText }),
      }),
    onSuccess: (res) => {
      setExtracted(res.extracted);
    },
  });

  const saveResumeMutation = useMutation({
    mutationFn: () =>
      api<{ resume: Resume }>('/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          templateId,
          content: {
            personal: extracted?.personal || {},
            summary: extracted?.summary || '',
            education: extracted?.education || [],
            experience: extracted?.experience || [],
            projects: extracted?.projects || [],
            skills: extracted?.skills || [],
          },
        }),
      }),
    onSuccess: (res) => {
      nav(`/editor/${res.resume._id}`);
    },
  });

  return (
    <Shell>
      <div className="builder-start" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <p className="eyebrow">AI RESUME BUILDER</p>
        <h1>Dump everything you know about yourself.</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Paste messy notes about your education, work history, projects, and skills. Our AI extracts structured details without fabricating credentials.
        </p>

        {!extracted ? (
          <div className="card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>Your Natural Career Notes</label>
            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Example:\n"I am Mahesh Kumar, final year B.Tech CS student at DTU. Phone: 9876543210. Email: mahesh@example.com. Built a campus portal using React, Node.js and MongoDB. Worked as Frontend Intern at TechCorp for 3 months. Skills: JavaScript, TypeScript, React, Python."`}
            />

            {extractMutation.error && <div className="alert alert-danger">{extractMutation.error.message}</div>}

            <button
              className="button"
              onClick={() => extractMutation.mutate()}
              disabled={extractMutation.isPending || rawText.trim().length < 10}
            >
              {extractMutation.isPending ? 'Analyzing & Structuring Notes…' : 'Extract & Generate Resume →'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Review AI Extraction Results</h2>
              <button className="text-button" onClick={() => setExtracted(null)}>
                ← Edit notes
              </button>
            </div>

            {extracted.missingFields && extracted.missingFields.length > 0 && (
              <div className="alert alert-warning">
                <b>Missing Information Flagged:</b>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                  {extracted.missingFields.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Resume Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label>Template Choice</label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="azurill">Azurill (Vibrant)</option>
                  <option value="classic">Classic (ATS standard)</option>
                  <option value="modern">Modern (Sans-serif)</option>
                  <option value="executive">Executive (Leadership)</option>
                  <option value="professional">Professional (High density)</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <b>Extracted Personal Name:</b> {extracted.personal.name || 'Not provided'}<br />
              <b>Extracted Contact Email:</b> {extracted.personal.email || 'Not provided'}<br />
              <b>Extracted Skills ({extracted.skills.length}):</b> {extracted.skills.join(', ') || 'None'}<br />
              <b>Education Entries:</b> {extracted.education.length}<br />
              <b>Experience Entries:</b> {extracted.experience.length}<br />
              <b>Projects Found:</b> {extracted.projects.length}
            </div>

            {saveResumeMutation.error && <div className="alert alert-danger">{saveResumeMutation.error.message}</div>}

            <button
              className="button"
              onClick={() => saveResumeMutation.mutate()}
              disabled={saveResumeMutation.isPending}
            >
              {saveResumeMutation.isPending ? 'Generating Resume…' : 'Open in Live Editor →'}
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
