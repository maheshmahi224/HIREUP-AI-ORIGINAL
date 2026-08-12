import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

/**
 * Kaffle Template — ATS-friendly, dense, professional layout
 * Styled exactly after Sunkoju Maheshwara Chary's high-impact resume design:
 * - Centered bold header with sub-headline & pipe-separated contact line
 * - Dark navy section headers with solid bottom accent lines
 * - Right-aligned dates & locations
 * - Multi-column categorized skills layout & bulleted highlights
 * - Clean project tech-stack highlights
 */
export function KaffleTemplate({ data, customization: c }: TemplateProps) {
  const info: any = data.personalInfo || data.personal || {};
  const accent = c.accentColor && c.accentColor !== '#2563EB' ? c.accentColor : '#0F2942';
  const text = c.colorsMode === 'advanced' ? c.colorText || '#1E293B' : '#1E293B';
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
          color: accent,
          fontWeight: 800,
          fontSize: '9.5pt',
          textTransform: 'uppercase',
          borderBottom: `1.5px solid ${accent}`,
          paddingBottom: 2,
          marginBottom: 6,
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );

  const summary = data.summary || data.profile;
  const contactItems = [
    info.email,
    info.phone,
    info.location || info.address,
    info.linkedin,
    info.github,
    info.website,
  ].filter(Boolean);

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
        lineHeight: Math.min(1.35, c.lineHeight || 1.2),
        color: text,
        background: '#FFFFFF',
      }}
    >
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1
          style={{
            margin: 0,
            color: accent,
            fontSize: `${(baseFontSize * 1.8).toFixed(1)}pt`,
            letterSpacing: '0.04em',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {info.fullName || info.name || 'Sunkoju Maheshwara Chary'}
        </h1>

        {(info.headline || info.jobTitle) && (
          <div
            style={{
              fontSize: `${(baseFontSize * 1.1).toFixed(1)}pt`,
              fontStyle: 'italic',
              color: '#2B547E',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginTop: 2,
            }}
          >
            {info.headline || info.jobTitle}
          </div>
        )}

        {contactItems.length > 0 && (
          <div
            style={{
              marginTop: 6,
              fontSize: '8pt',
              color: '#475569',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2px 8px',
            }}
          >
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: '#94A3B8' }}>|</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {info.dob && (
          <div style={{ marginTop: 2, fontSize: '8pt', color: '#475569' }}>
            {info.dob}
          </div>
        )}
      </header>

      {/* PROFILE */}
      {summary && (
        <Section title="PROFILE">
          <div style={{ fontSize: `${baseFontSize}pt`, lineHeight: 1.38, color: text }}>
            {summary}
          </div>
        </Section>
      )}

      {/* PROFESSIONAL EXPERIENCE */}
      {(data.experience || []).length > 0 && (
        <Section title="PROFESSIONAL EXPERIENCE">
          {(data.experience || []).map((exp: any, idx) => {
            const dateStr = formatDate(exp.startDate, exp.endDate);
            const bullets = exp.highlights || exp.bullets || [];
            return (
              <div key={exp.id || idx} style={{ marginBottom: gap + 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: `${(baseFontSize * 1.05).toFixed(1)}pt`, color: '#0F172A', textTransform: 'uppercase' }}>
                      {exp.company || exp.employer}
                    </strong>
                    {exp.link && (
                      <span style={{ fontSize: '8pt', color: accent, marginLeft: 4 }}>🔗</span>
                    )}
                    {(exp.role || exp.title) && (
                      <span style={{ fontStyle: 'italic', color: '#334155', marginLeft: 6 }}>
                        , {exp.role || exp.title}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '8pt', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {dateStr}
                    {exp.location && <span style={{ textTransform: 'uppercase' }}> | {exp.location}</span>}
                  </div>
                </div>

                {exp.description && (
                  <div style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, marginTop: 2, color: '#334155' }}>
                    {exp.description}
                  </div>
                )}

                {bullets.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    {bullets.map((b: string, bIdx: number) => (
                      <div key={bIdx} style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, color: text }}>
                        • {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* EDUCATION */}
      {(data.education || []).length > 0 && (
        <Section title="EDUCATION">
          {(data.education || []).map((edu: any, idx) => {
            const dateStr = formatDate(edu.startDate, edu.endDate || edu.year);
            const bullets = edu.bullets || [];
            return (
              <div key={edu.id || idx} style={{ marginBottom: gap + 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: `${(baseFontSize * 1.05).toFixed(1)}pt`, color: '#0F172A' }}>
                      {edu.degree || edu.qualification}
                    </strong>
                    {(edu.institution || edu.school) && (
                      <span style={{ fontStyle: 'italic', color: '#334155', marginLeft: 6 }}>
                        , {edu.institution || edu.school}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '8pt', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {dateStr}
                    {edu.location && <span style={{ textTransform: 'uppercase' }}> | {edu.location}</span>}
                  </div>
                </div>

                {edu.fieldOfStudy && (
                  <div style={{ fontSize: `${(baseFontSize * 0.92).toFixed(1)}pt`, fontStyle: 'italic', color: '#475569', marginTop: 1 }}>
                    {edu.fieldOfStudy}
                  </div>
                )}

                {edu.description && (
                  <div style={{ fontSize: `${(baseFontSize * 0.92).toFixed(1)}pt`, fontStyle: 'italic', color: '#334155', marginTop: 1 }}>
                    {edu.description}
                  </div>
                )}

                {bullets.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    {bullets.map((b: string, bIdx: number) => (
                      <div key={bIdx} style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, color: text }}>
                        • {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* SKILLS */}
      {skillsRaw.length > 0 && (
        <Section title="SKILLS">
          {typeof skillsRaw[0] === 'string' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
              {(skillsRaw as string[]).map((skill, idx) => (
                <div key={idx} style={{ fontSize: `${baseFontSize}pt` }}>
                  • {skill}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 16px' }}>
              {(skillsRaw as any[]).map((group, idx) => (
                <div key={group.id || idx}>
                  <strong style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, color: '#0F172A', display: 'block' }}>
                    {group.category || group.name}
                  </strong>
                  {Array.isArray(group.items) ? (
                    <div style={{ fontSize: `${(baseFontSize * 0.9).toFixed(1)}pt`, fontStyle: 'italic', color: '#334155', marginTop: 2 }}>
                      {group.items.map((item: string, iIdx: number) => (
                        <div key={iIdx}>• {item}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: `${(baseFontSize * 0.9).toFixed(1)}pt`, fontStyle: 'italic', color: '#334155', marginTop: 2 }}>
                      {group.value || group.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* LANGUAGES */}
      {languagesRaw.length > 0 && (
        <Section title="LANGUAGES">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
            {languagesRaw.map((lang: any, idx: number) => {
              const langName = typeof lang === 'string' ? lang : lang.name || lang.language;
              return (
                <div key={idx} style={{ fontSize: `${baseFontSize}pt`, fontWeight: 700, textTransform: 'uppercase' }}>
                  • {langName}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* AWARDS */}
      {((data.awards || []).length > 0 || (data.achievements || []).length > 0) && (
        <Section title="AWARDS">
          {(data.awards || []).map((award: any, idx) => (
            <div key={award.id || idx} style={{ marginBottom: gap + 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ fontSize: `${(baseFontSize * 1.02).toFixed(1)}pt`, color: '#0F172A', textTransform: 'uppercase' }}>
                    {award.title || award.name}
                  </strong>
                  {award.link && (
                    <span style={{ fontSize: '8pt', color: accent, marginLeft: 4 }}>🔗</span>
                  )}
                  {award.issuer && (
                    <span style={{ fontStyle: 'italic', color: '#475569', marginLeft: 6 }}>
                      , {award.issuer}
                    </span>
                  )}
                </div>
                {award.date && (
                  <div style={{ fontSize: '8.5pt', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {award.date}
                  </div>
                )}
              </div>
              {award.description && (
                <div style={{ fontSize: `${(baseFontSize * 0.92).toFixed(1)}pt`, color: '#334155', marginTop: 1 }}>
                  {award.description}
                </div>
              )}
            </div>
          ))}
          {(data.achievements || []).map((ach, idx) => (
            <div key={`ach-${idx}`} style={{ fontSize: `${baseFontSize}pt`, color: text }}>
              • {ach}
            </div>
          ))}
        </Section>
      )}

      {/* PROJECTS */}
      {(data.projects || []).length > 0 && (
        <Section title="PROJECTS">
          {(data.projects || []).map((proj: any, idx) => {
            const dateStr = formatDate(proj.startDate, proj.endDate);
            const techList = Array.isArray(proj.technologies)
              ? proj.technologies.join(', ')
              : typeof proj.technologies === 'string'
              ? proj.technologies
              : '';

            return (
              <div key={proj.id || idx} style={{ marginBottom: gap + 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: `${(baseFontSize * 1.05).toFixed(1)}pt`, fontStyle: 'italic', color: '#0F172A' }}>
                      {proj.name || proj.title}
                    </strong>
                    {proj.link && (
                      <span style={{ fontSize: '8pt', color: accent, marginLeft: 4 }}>🔗</span>
                    )}
                    {proj.subtitle && (
                      <span style={{ fontStyle: 'italic', color: '#475569', marginLeft: 6 }}>
                        , {proj.subtitle}
                      </span>
                    )}
                  </div>
                  {dateStr && (
                    <div style={{ fontSize: '8.5pt', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </div>
                  )}
                </div>

                {proj.tagline && (
                  <div style={{ fontSize: `${(baseFontSize * 0.92).toFixed(1)}pt`, fontStyle: 'italic', color: '#475569', marginTop: 1 }}>
                    {proj.tagline}
                  </div>
                )}

                {proj.description && (
                  <div style={{ fontSize: `${(baseFontSize * 0.95).toFixed(1)}pt`, color: '#334155', marginTop: 2, lineHeight: 1.35 }}>
                    {proj.description}
                  </div>
                )}

                {techList && (
                  <div style={{ fontSize: `${(baseFontSize * 0.9).toFixed(1)}pt`, marginTop: 2, color: '#1E293B' }}>
                    <strong>Tech Stack:</strong> {techList}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* CERTIFICATIONS */}
      {(data.certifications || []).length > 0 && (
        <Section title="CERTIFICATIONS">
          {(data.certifications || []).map((cert: any, idx) => (
            <div key={cert.id || idx} style={{ marginBottom: gap + 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <strong style={{ fontSize: `${(baseFontSize * 1.02).toFixed(1)}pt`, color: '#0F172A' }}>
                    {cert.name || cert.title}
                  </strong>
                  {cert.issuer && (
                    <span style={{ fontStyle: 'italic', color: '#475569', marginLeft: 6 }}>
                      , {cert.issuer}
                    </span>
                  )}
                </div>
                {cert.date && (
                  <div style={{ fontSize: '8.5pt', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {cert.date}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export default KaffleTemplate;
