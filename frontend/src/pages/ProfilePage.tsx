import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ProfileData } from '../api/client.js';
import { Shell } from '../components/Shell.js';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile: ProfileData }>('/profile'),
  });

  const [personal, setPersonal] = useState({
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  });

  const [skills, setSkills] = useState<string>('');
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    if (profileQuery.data?.profile) {
      const p = profileQuery.data.profile.personal || {};
      const sec = profileQuery.data.profile.sections || {};
      setPersonal({
        name: p.name || '',
        jobTitle: p.jobTitle || '',
        email: p.email || '',
        phone: p.phone || '',
        location: p.location || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        website: p.website || '',
      });
      setSkills(Array.isArray(sec.skills) ? sec.skills.join(', ') : '');
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          personal,
          sections: {
            skills: skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => setSaveStatus('error'),
  });

  return (
    <Shell>
      <div className="dashboard" style={{ maxWidth: '800px' }}>
        <div className="page-head">
          <div>
            <p className="eyebrow">REUSABLE CAREER PROFILE</p>
            <h1>Keep your details in one place.</h1>
            <p>Enter your core profile once. It will auto-populate your future resumes and AI workflows.</p>
          </div>
          <button
            className="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Master Profile'}
          </button>
        </div>

        {saveStatus === 'saved' && <div className="alert alert-success">Master Profile saved successfully!</div>}
        {saveStatus === 'error' && <div className="alert alert-danger">Failed to save profile. Please try again.</div>}

        {profileQuery.isLoading ? (
          <p>Loading profile…</p>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Personal & Contact Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Full Name</label>
                  <input
                    value={personal.name}
                    onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                    placeholder="e.g. Mahesh Kumar"
                  />
                </div>
                <div>
                  <label>Target Job Title</label>
                  <input
                    value={personal.jobTitle}
                    onChange={(e) => setPersonal({ ...personal, jobTitle: e.target.value })}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label>Email Address</label>
                  <input
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    placeholder="mahesh@example.com"
                  />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label>Location</label>
                  <input
                    value={personal.location}
                    onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
                    placeholder="e.g. Bengaluru, India"
                  />
                </div>
                <div>
                  <label>LinkedIn URL</label>
                  <input
                    value={personal.linkedin}
                    onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label>GitHub URL</label>
                  <input
                    value={personal.github}
                    onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
                    placeholder="github.com/username"
                  />
                </div>
                <div>
                  <label>Portfolio / Website</label>
                  <input
                    value={personal.website}
                    onChange={(e) => setPersonal({ ...personal, website: e.target.value })}
                    placeholder="yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Core Skills & Technologies</h3>
              <div>
                <label>Skills (Comma-separated)</label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, MongoDB, Figma, Python"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
