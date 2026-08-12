import React from 'react';
import type { TemplateProps } from '../shared/types.js';
import { PAGE_H, PAGE_W } from '../shared/types.js';

/** A compact, ATS-friendly one-page template with dense editorial hierarchy. */
export function AmagaTemplate({ data, customization: c }: TemplateProps) {
  const info = data.personalInfo || data.personal || {};
  const accent = c.accentColor || '#183b4d';
  const text = c.colorsMode === 'advanced' ? c.colorText || '#17212b' : '#17212b';
  const font = `${c.fontFamily || 'Arial'}, Arial, sans-serif`;
  const compact = Math.max(8, Math.min(11, c.fontSize || 9));
  const gap = Math.max(3, Math.min(8, c.spaceEntries || 4));
  const date = (start?: string, end?: string) => [start, end || 'Present'].filter(Boolean).join(' – ');
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section style={{ marginBottom: gap + 4 }}><div style={{ color: text, fontWeight: 800, fontSize: '8.8pt', textTransform: c.sectionHeadingCapitalization === 'capitalize' ? 'capitalize' : 'uppercase', borderBottom: `1.25px solid ${accent}`, paddingBottom: 2, marginBottom: 4, letterSpacing: '.02em' }}>{title}</div>{children}</section>;
  const Row = ({ main, sub, dates, location, body }: { main: React.ReactNode; sub?: React.ReactNode; dates?: string; location?: string; body?: React.ReactNode }) => <div style={{ marginBottom: gap }}><div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'baseline' }}><strong>{main}</strong>{dates && <span style={{ whiteSpace: 'nowrap', fontSize: '7.7pt' }}>{dates}{location ? `  |  ${location}` : ''}</span>}</div>{sub && <div style={{ fontStyle: 'italic', fontSize: '8.1pt' }}>{sub}</div>}{body && <div style={{ marginTop: 1 }}>{body}</div>}</div>;
  const summary = data.summary || data.profile;
  const contact = [info.email, info.phone, info.location, info.website, info.linkedin, info.github].filter(Boolean);
  const skills = Array.isArray(data.skills) ? data.skills : [];
  return <div style={{ width: PAGE_W, minHeight: PAGE_H, boxSizing: 'border-box', padding: `${Math.max(10, c.marginTB)}mm ${Math.max(10, c.marginLR)}mm`, fontFamily: font, fontSize: `${compact}pt`, lineHeight: Math.min(1.38, c.lineHeight || 1.25), color: text, background: c.colorsMode === 'advanced' ? c.colorBackground || '#fff' : '#fff' }}>
    <header style={{ textAlign: c.headerAlignment, marginBottom: 8 }}><h1 style={{ margin: 0, color: accent, fontSize: '18pt', letterSpacing: '.015em', fontWeight: 800 }}>{info.fullName || info.name}</h1>{(info.headline || info.jobTitle) && <div style={{ fontSize: '10.2pt', fontStyle: 'italic', color: '#40535e', letterSpacing: '.02em' }}>{info.headline || info.jobTitle}</div>}{contact.length > 0 && <div style={{ marginTop: 7, fontSize: '7.3pt', display: 'flex', flexWrap: 'wrap', justifyContent: c.headerAlignment === 'center' ? 'center' : 'flex-start', gap: '2px 8px' }}>{contact.map((detail, index) => <span key={index}>{detail}</span>)}</div>}</header>
    {summary && <Section title="Profile"><div>{summary}</div></Section>}
    {(data.education || []).length > 0 && <Section title="Education">{data.education!.map((entry, index) => <Row key={entry.id || index} main={c.educationOrder === 'school_degree' ? entry.institution || entry.school : entry.degree} sub={c.educationOrder === 'school_degree' ? entry.degree : [entry.institution || entry.school, entry.fieldOfStudy].filter(Boolean).join(', ')} dates={date(entry.startDate, entry.endDate || entry.year)} location={entry.location} body={entry.bullets?.map((bullet, i) => <div key={i}>• {bullet}</div>)}/>)}</Section>}
    {(data.projects || []).length > 0 && <Section title="Projects">{data.projects!.map((project, index) => <Row key={project.id || index} main={project.name || project.title} dates={date(project.startDate, project.endDate)} sub={project.technologies?.length ? `Tech Stack: ${project.technologies.join(', ')}` : undefined} body={project.description}/>)}</Section>}
    {(data.awards || data.achievements || []).length > 0 && <Section title="Awards">{(data.awards || []).map((award, index) => <Row key={award.id || index} main={award.title} sub={award.issuer} dates={award.date}/>)}{(data.achievements || []).map((achievement, index) => <div key={`achievement-${index}`}>{achievement}</div>)}</Section>}
    {(data.experience || []).length > 0 && <Section title="Professional experience">{data.experience!.map((entry, index) => <Row key={entry.id || index} main={c.workOrder === 'employer_title' ? entry.company || entry.employer : entry.role || entry.title} sub={c.workOrder === 'employer_title' ? entry.role || entry.title : entry.company || entry.employer} dates={date(entry.startDate, entry.endDate)} location={entry.location} body={<>{entry.description && <div>{entry.description}</div>}{(entry.bullets || entry.highlights || []).map((bullet, i) => <div key={i}>• {bullet}</div>)}</>}/>)}</Section>}
    {skills.length > 0 && <Section title="Skills"><div style={{ display: 'grid', gap: 3 }}>{typeof skills[0] === 'string' ? <div>{skills.join('  |  ')}</div> : skills.map((skill: any, index: number) => <div key={skill.id || index}><strong>{skill.category || skill.name}:</strong> {Array.isArray(skill.items) ? skill.items.join(', ') : ''}</div>)}</div></Section>}
    {(data.languages || []).length > 0 && <Section title="Languages"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{data.languages.map((language: any, index: number) => <span key={index} style={{ padding: '3px 8px', borderRadius: 3, color: '#fff', background: accent, fontSize: '7.6pt', fontWeight: 700 }}>{typeof language === 'string' ? language : language.name || language.language}</span>)}</div></Section>}
    {(data.certifications || []).length > 0 && <Section title="Certifications">{data.certifications!.map((cert, index) => <Row key={cert.id || index} main={cert.name || cert.title} sub={cert.issuer} dates={cert.date}/>)}</Section>}
  </div>;
}
export default AmagaTemplate;
