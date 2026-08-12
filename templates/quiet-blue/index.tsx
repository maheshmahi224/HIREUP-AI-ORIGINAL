import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

export function QuietBlueTemplate({ data, customization: c }: TemplateProps) {
  const info: any = data.personalInfo || data.personal || {};
  const accent = c.accentColor && c.accentColor !== '#2563EB' ? c.accentColor : '#0EA5E9';
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
    <section style={{ marginBottom: gap + 5 }}>
      <div
        style={{
          color: '#0F172A',
          fontWeight: 800,
          fontSize: '9.5pt',
          textAlign: 'center',
          borderBottom: `1.5px solid ${accent}`,
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
  const contactItems = [info.email, info.phone, info.location, info.linkedin, info.github, info.website].filter(Boolean);

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
      <header style={{ textAlign: 'left', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: `${(baseFontSize * 2).toFixed(1)}pt`, fontWeight: 800, color: '#0F172A' }}>
          {info.fullName || info.name || 'Charlotte Taylor'}
          {(info.headline || info.jobTitle) && (
            <span style={{ fontSize: `${(baseFontSize * 1.1).toFixed(1)}pt`, fontWeight: 400, fontStyle: 'italic', color: '#64748B', marginLeft: 10 }}>
              {info.headline || info.jobTitle}
            </span>
          )}
        </h1>
        {contactItems.length > 0 && (
          <div style={{ marginTop: 4, fontSize: '8pt', color: '#64748B', display: 'flex', gap: '4px 12px', flexWrap: 'wrap' }}>
            {contactItems.map((item, idx) => (
              <span key={idx}>{item}</span>
            ))}
          </div>
        )}
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
                  <strong style={{ color: '#0F172A' }}>{exp.role || exp.title}</strong>
                  {(exp.company || exp.employer) && <span style={{ color: '#475569', marginLeft: 4 }}>, {exp.company || exp.employer}</span>}
                </div>
                <div style={{ fontSize: '8pt', color: '#64748B' }}>
                  {formatDate(exp.startDate, exp.endDate)} {exp.location && `| ${exp.location}`}
                </div>
              </div>
              {(exp.highlights || exp.bullets || []).map((b: string, bIdx: number) => (
                <div key={bIdx} style={{ color: '#334155' }}>- {b}</div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {(data.education || []).length > 0 && (
        <Section title="Education">
          {(data.education || []).map((edu: any, idx) => (
            <div key={edu.id || idx} style={{ marginBottom: gap + 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>{edu.degree}</strong>
                  {(edu.institution || edu.school) && <span style={{ color: '#475569', marginLeft: 4 }}>, {edu.institution || edu.school}</span>}
                </div>
                <div style={{ fontSize: '8pt', color: '#64748B' }}>
                  {formatDate(edu.startDate, edu.endDate || edu.year)} {edu.location && `| ${edu.location}`}
                </div>
              </div>
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
    </div>
  );
}

export default QuietBlueTemplate;
