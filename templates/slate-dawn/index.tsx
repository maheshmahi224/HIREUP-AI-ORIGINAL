import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

export function SlateDawnTemplate({ data, customization: c }: TemplateProps) {
  const info: any = data.personalInfo || data.personal || {};
  const font = `${c.fontFamily || 'Inter'}, Arial, sans-serif`;
  const baseFontSize = Math.max(8, Math.min(11, c.fontSize || 9));
  const gap = Math.max(3, Math.min(8, c.spaceEntries || 4));

  const formatDate = (start?: string, end?: string) => {
    if (!start && !end) return '';
    if (start && !end) return start;
    if (!start && end) return end;
    return `${start} – ${end}`;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginBottom: gap + 6 }}>
      <div
        style={{
          color: '#1E293B',
          fontWeight: 800,
          fontSize: '9.5pt',
          textTransform: 'uppercase',
          borderBottom: '1.5px solid #0F172A',
          paddingBottom: 2,
          marginBottom: 6,
          letterSpacing: '0.03em',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );

  const summary = data.summary || data.profile;

  return (
    <div
      style={{
        width: PAGE_W,
        minHeight: PAGE_H,
        boxSizing: 'border-box',
        padding: `${Math.max(8, c.marginTB)}mm ${Math.max(8, c.marginLR)}mm`,
        fontFamily: font,
        fontSize: `${baseFontSize}pt`,
        lineHeight: Math.min(1.35, c.lineHeight || 1.25),
        color: '#1E293B',
        background: '#FFFFFF',
      }}
    >
      {/* Header Banner */}
      <header style={{ marginBottom: 14, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #1E293B' }}>
        <h1 style={{ margin: 0, fontSize: `${(baseFontSize * 1.9).toFixed(1)}pt`, fontWeight: 800, color: '#0F172A' }}>
          {info.fullName || info.name || 'Giulia Rinaldi'}
        </h1>
        {(info.headline || info.jobTitle) && (
          <div style={{ fontSize: `${(baseFontSize * 1.1).toFixed(1)}pt`, color: '#475569', fontWeight: 600, marginTop: 2 }}>
            {info.headline || info.jobTitle}
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: '8pt', color: '#64748B', display: 'flex', gap: '4px 12px', flexWrap: 'wrap' }}>
          {info.email && <span>✉ {info.email}</span>}
          {info.phone && <span>📞 {info.phone}</span>}
          {info.location && <span>📍 {info.location}</span>}
          {info.linkedin && <span>💼 {info.linkedin}</span>}
        </div>
      </header>

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left Main Column */}
        <div>
          {summary && (
            <Section title="Summary">
              <div style={{ color: '#334155', lineHeight: 1.4 }}>{summary}</div>
            </Section>
          )}

          {(data.experience || []).length > 0 && (
            <Section title="Professional Experience">
              {(data.experience || []).map((exp: any, idx) => (
                <div key={exp.id || idx} style={{ marginBottom: gap + 4 }}>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>{exp.role || exp.title}</div>
                  <div style={{ fontSize: '8pt', color: '#64748B', fontStyle: 'italic' }}>
                    {exp.company || exp.employer} | {formatDate(exp.startDate, exp.endDate)}
                  </div>
                  {exp.description && <div style={{ marginTop: 2, color: '#334155' }}>{exp.description}</div>}
                  {(exp.highlights || exp.bullets || []).map((b: string, bIdx: number) => (
                    <div key={bIdx} style={{ color: '#334155' }}>- {b}</div>
                  ))}
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div>
          {(data.education || []).length > 0 && (
            <Section title="Education">
              {(data.education || []).map((edu: any, idx) => (
                <div key={edu.id || idx} style={{ marginBottom: gap + 3 }}>
                  <strong style={{ color: '#0F172A', display: 'block' }}>{edu.degree}</strong>
                  <div style={{ fontSize: '8pt', color: '#64748B' }}>
                    {edu.institution || edu.school}
                  </div>
                  <div style={{ fontSize: '8pt', color: '#94A3B8' }}>
                    {formatDate(edu.startDate, edu.endDate || edu.year)}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {Array.isArray(data.skills) && data.skills.length > 0 && (
            <Section title="Skills">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(data.skills as any[]).map((s, idx) => (
                  <div key={idx}>• {typeof s === 'string' ? s : s.name || s.category}</div>
                ))}
              </div>
            </Section>
          )}

          {(data.certifications || []).length > 0 && (
            <Section title="Certificates">
              {(data.certifications || []).map((cert: any, idx) => (
                <div key={idx} style={{ marginBottom: 3 }}>• {cert.name || cert.title}</div>
              ))}
            </Section>
          )}

          {Array.isArray(data.languages) && data.languages.length > 0 && (
            <Section title="Languages">
              {(data.languages as any[]).map((l, idx) => (
                <div key={idx}>• {typeof l === 'string' ? l : l.name || l.language}</div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlateDawnTemplate;
