import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

export function CorporatePanelTemplate({ data, customization: c }: TemplateProps) {
  const info: any = data.personalInfo || data.personal || {};
  const font = `${c.fontFamily || 'Georgia'}, serif`;
  const baseFontSize = Math.max(8, Math.min(11, c.fontSize || 9));
  const gap = Math.max(3, Math.min(8, c.spaceEntries || 4));

  const formatDate = (start?: string, end?: string) => {
    if (!start && !end) return '';
    if (start && !end) return start;
    if (!start && end) return end;
    return `${start} – ${end}`;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginBottom: gap + 5 }}>
      <div
        style={{
          background: '#F1F5F9',
          color: '#0F172A',
          fontWeight: 800,
          fontSize: '9.5pt',
          textAlign: 'center',
          textTransform: 'uppercase',
          padding: '3px 0',
          marginBottom: 6,
          letterSpacing: '0.04em',
          borderTop: '1px solid #CBD5E1',
          borderBottom: '1px solid #CBD5E1',
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
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: `${(baseFontSize * 2.1).toFixed(1)}pt`, fontWeight: 800, color: '#0F172A' }}>
          {info.fullName || info.name || 'Ananya Rao'}
        </h1>
        {(info.headline || info.jobTitle) && (
          <div style={{ fontSize: `${(baseFontSize * 1.15).toFixed(1)}pt`, fontStyle: 'italic', color: '#475569', marginTop: 2 }}>
            {info.headline || info.jobTitle}
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: '8pt', color: '#64748B', display: 'flex', justifyContent: 'center', gap: '4px 12px', flexWrap: 'wrap' }}>
          {info.location && <span>📍 {info.location}</span>}
          {info.email && <span>✉ {info.email}</span>}
          {info.phone && <span>📞 {info.phone}</span>}
        </div>
      </header>

      {summary && (
        <Section title="Summary">
          <div style={{ color: '#334155', lineHeight: 1.4 }}>{summary}</div>
        </Section>
      )}

      {(data.experience || []).length > 0 && (
        <Section title="Professional Experience">
          {(data.experience || []).map((exp: any, idx) => (
            <div key={exp.id || idx} style={{ marginBottom: gap + 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>{exp.company || exp.employer}</strong>
                  {(exp.role || exp.title) && <div style={{ fontStyle: 'italic', color: '#475569' }}>{exp.role || exp.title}</div>}
                </div>
                <div style={{ fontSize: '8pt', color: '#64748B', textAlign: 'right' }}>
                  {formatDate(exp.startDate, exp.endDate)}
                  {exp.location && <div>{exp.location}</div>}
                </div>
              </div>
              {(exp.highlights || exp.bullets || []).map((b: string, bIdx: number) => (
                <div key={bIdx} style={{ color: '#334155' }}>• {b}</div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {Array.isArray(data.skills) && data.skills.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {(data.skills as any[]).map((s, idx) => (
              <div key={idx}>- {typeof s === 'string' ? s : s.name || s.category}</div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(data.languages) && data.languages.length > 0 && (
        <Section title="Languages">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {(data.languages as any[]).map((l, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{typeof l === 'string' ? l : l.name || l.language}</span>
                <span style={{ color: '#0F172A' }}>•••••</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(data.education || []).length > 0 && (
        <Section title="Education">
          {(data.education || []).map((edu: any, idx) => (
            <div key={edu.id || idx} style={{ marginBottom: gap + 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>{edu.degree}</strong>
                  {(edu.institution || edu.school) && <div style={{ color: '#475569' }}>{edu.institution || edu.school}</div>}
                </div>
                <div style={{ fontSize: '8pt', color: '#64748B', textAlign: 'right' }}>
                  {formatDate(edu.startDate, edu.endDate || edu.year)}
                </div>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export default CorporatePanelTemplate;
