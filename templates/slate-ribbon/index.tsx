import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

/**
 * Slate Ribbon Template — Elegant Georgia Serif with shaded grey section banners.
 * As seen in the Anna Field Junior Project Manager design.
 */
export function SlateRibbonTemplate({ data, customization: c }: TemplateProps) {
  const info: any = data.personalInfo || data.personal || {};
  const accent = c.accentColor && c.accentColor !== '#2563EB' ? c.accentColor : '#1E293B';
  const font = `${c.fontFamily || 'Georgia'}, 'Times New Roman', serif`;
  const baseFontSize = Math.max(8, Math.min(11, c.fontSize || 9));
  const gap = Math.max(3, Math.min(8, c.spaceEntries || 4));

  const formatDate = (start?: string, end?: string) => {
    if (!start && !end) return '';
    if (start && !end) return start;
    if (!start && end) return end;
    return `${start} – ${end}`;
  };

  const SectionBanner = ({ title }: { title: string }) => (
    <div
      style={{
        background: '#F1F5F9',
        color: '#0F172A',
        fontWeight: 700,
        fontSize: '10pt',
        textAlign: 'center',
        padding: '4px 12px',
        borderRadius: 4,
        marginTop: gap + 4,
        marginBottom: gap + 4,
        letterSpacing: '0.02em',
      }}
    >
      {title}
    </div>
  );

  const summary = data.summary || data.profile;
  const skillsRaw = Array.isArray(data.skills) ? data.skills : [];
  const languagesRaw = Array.isArray(data.languages) ? data.languages : [];

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
      <header style={{ marginBottom: 12 }}>
        <h1
          style={{
            margin: 0,
            fontSize: `${(baseFontSize * 2.1).toFixed(1)}pt`,
            fontWeight: 800,
            color: '#0F172A',
          }}
        >
          {info.fullName || info.name || 'Anna Field'}
        </h1>

        {(info.headline || info.jobTitle) && (
          <div
            style={{
              fontSize: `${(baseFontSize * 1.25).toFixed(1)}pt`,
              color: '#334155',
              marginTop: 2,
              marginBottom: 10,
            }}
          >
            {info.headline || info.jobTitle}
          </div>
        )}

        {/* 2-Column Contact Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 20px',
            fontSize: '8.5pt',
            color: '#475569',
          }}
        >
          {(info.location || info.address) && (
            <div>📍 {info.location || info.address}</div>
          )}
          {info.email && <div>✉ {info.email}</div>}
          {info.phone && <div>📞 {info.phone}</div>}
          {info.linkedin && <div>💼 {info.linkedin}</div>}
          {info.github && <div>💻 {info.github}</div>}
          {info.website && <div>🌐 {info.website}</div>}
        </div>
      </header>

      {/* SUMMARY */}
      {summary && (
        <section>
          <SectionBanner title="Summary" />
          <div style={{ lineHeight: 1.4, color: '#334155' }}>{summary}</div>
        </section>
      )}

      {/* PROFESSIONAL EXPERIENCE */}
      {(data.experience || []).length > 0 && (
        <section>
          <SectionBanner title="Professional Experience" />
          {(data.experience || []).map((exp: any, idx) => {
            const dateStr = formatDate(exp.startDate, exp.endDate);
            const bullets = exp.highlights || exp.bullets || [];
            return (
              <div key={exp.id || idx} style={{ marginBottom: gap + 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: `${(baseFontSize * 1.05).toFixed(1)}pt`, color: '#0F172A' }}>
                      {exp.role || exp.title || exp.company}
                    </strong>
                    {(exp.company || exp.employer) && exp.role && (
                      <span style={{ color: '#475569', marginLeft: 4 }}>, {exp.company || exp.employer}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '8.5pt', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {dateStr}
                    {exp.location && <div>{exp.location}</div>}
                  </div>
                </div>

                {exp.description && (
                  <div style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, marginTop: 2, color: '#334155' }}>
                    {exp.description}
                  </div>
                )}

                {bullets.length > 0 && (
                  <div style={{ marginTop: 3 }}>
                    {bullets.map((b: string, bIdx: number) => (
                      <div key={bIdx} style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, color: '#334155' }}>
                        • {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* EDUCATION */}
      {(data.education || []).length > 0 && (
        <section>
          <SectionBanner title="Education" />
          {(data.education || []).map((edu: any, idx) => {
            const dateStr = formatDate(edu.startDate, edu.endDate || edu.year);
            return (
              <div key={edu.id || idx} style={{ marginBottom: gap + 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: `${(baseFontSize * 1.05).toFixed(1)}pt`, color: '#0F172A' }}>
                      {edu.degree || edu.qualification}
                    </strong>
                    {(edu.institution || edu.school) && (
                      <span style={{ color: '#475569', marginLeft: 4 }}>, {edu.institution || edu.school}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '8.5pt', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {dateStr}
                    {edu.location && <div>{edu.location}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* SKILLS */}
      {skillsRaw.length > 0 && (
        <section>
          <SectionBanner title="Skills" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {typeof skillsRaw[0] === 'string' ? (
              (skillsRaw as string[]).map((skill, idx) => (
                <div key={idx}>• {skill}</div>
              ))
            ) : (
              (skillsRaw as any[]).map((group, idx) => (
                <div key={idx}>
                  <strong>{group.category || group.name}:</strong>{' '}
                  {Array.isArray(group.items) ? group.items.join(', ') : group.value}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* LANGUAGES */}
      {languagesRaw.length > 0 && (
        <section>
          <SectionBanner title="Languages" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {languagesRaw.map((lang: any, idx: number) => (
              <div key={idx}>• {typeof lang === 'string' ? lang : lang.name || lang.language}</div>
            ))}
          </div>
        </section>
      )}

      {/* CERTIFICATES */}
      {(data.certifications || []).length > 0 && (
        <section>
          <SectionBanner title="Certificates" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {(data.certifications || []).map((cert: any, idx) => (
              <div key={idx}>• {cert.name || cert.title}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SlateRibbonTemplate;
