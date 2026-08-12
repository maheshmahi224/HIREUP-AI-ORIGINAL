import React from "react";
import type { TemplateProps } from "../shared/types.js";
import { PAGE_W, PAGE_H } from "../shared/types.js";

export function ClassicTemplate({ data, customization }: TemplateProps) {
  const c = customization;

  const font = c.fontFamily ? `"${c.fontFamily}", system-ui, -apple-system, sans-serif` : '"Source Sans Pro", sans-serif';
  const nameFont = c.nameFont && c.nameFont !== 'Same as body font' ? `"${c.nameFont}", serif` : font;
  
  const baseFs = c.fontSize || 9;
  const fs = `${baseFs}pt`;
  const nameFontSize = `${baseFs + (c.nameFontSizeOffset ?? 14)}pt`;
  const titleFontSize = `${baseFs + (c.titleFontSizeOffset ?? 6.5)}pt`;
  const headingSize = `${baseFs + (c.headingFontSizeOffset ?? 1)}pt`;
  const entryHeaderSize = `${baseFs + (c.entryHeaderFontSizeOffset ?? 0)}pt`;

  const lineHeight = c.lineHeight || 1.1;
  const padding = `${c.marginTB || 10}mm ${c.marginLR || 10}mm`;
  const spaceEntries = `${(c.spaceEntries || 4) * 2}px`;
  const headingTransform = c.sectionHeadingCapitalization === "uppercase" ? "uppercase" : "capitalize";

  const isMultiColor = c.colorType === 'multi';
  const isImageBg = c.colorType === 'image';
  const textColor = isMultiColor ? (c.colorText || '#111827') : isImageBg ? '#FFFFFF' : '#000000';
  const bgColor = isMultiColor ? (c.colorBackground || '#FFFFFF') : isImageBg ? '#1E293B' : '#FFFFFF';
  const accent = c.accentColor || '#2563EB';

  const applyAccent = c.applyAccentTo || {};
  const headingColor = applyAccent.headings ? accent : textColor;
  const nameColor = applyAccent.name ? accent : textColor;
  const titleColor = applyAccent.jobTitle ? accent : textColor;
  const datesColor = applyAccent.dates ? accent : textColor;
  const subtitleColor = applyAccent.entrySubtitle ? accent : textColor;

  const s: Record<string, React.CSSProperties> = {
    page: { 
      fontFamily: font, fontSize: fs, color: textColor, background: isImageBg && c.backgroundImage ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url(${c.backgroundImage}) center/cover` : bgColor, 
      width: PAGE_W, minHeight: PAGE_H, padding, boxSizing: "border-box", 
      lineHeight: lineHeight 
    },
    header: { textAlign: c.headerAlignment || "center", marginBottom: spaceEntries },
    name: { fontFamily: nameFont, fontSize: nameFontSize, fontWeight: c.nameBold ? 700 : 600, color: nameColor, margin: 0, letterSpacing: "-0.5px" },
    headline: { fontSize: titleFontSize, color: titleColor, marginTop: 4, fontWeight: 600, fontStyle: c.professionalTitleStyle === "italic" ? "italic" : "normal" },
    contactRow: { display: "flex", flexWrap: "wrap", justifyContent: c.headerAlignment === "left" ? "flex-start" : "center", gap: "6px 16px", marginTop: 8, fontSize: `${baseFs - 0.5}pt` },
    section: { marginBottom: `${(c.spaceEntries || 4) * 3}px` },
    sectionTitle: { 
      fontSize: headingSize, fontWeight: 700, textTransform: headingTransform, 
      color: headingColor, borderBottom: `1.5px solid ${applyAccent.headingsLine ? accent : textColor}`, 
      paddingBottom: 2, marginBottom: 8, fontFamily: c.sectionHeadingFont === 'name' ? nameFont : font
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: entryHeaderSize },
    bold: { fontWeight: 700 },
    subtitle: { fontStyle: "italic", color: subtitleColor },
    date: { color: datesColor },
    content: { marginTop: 4 },
    bulletList: { margin: "4px 0 0 16px", padding: 0 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }
  };

  const getSeparator = () => (
    <span style={{ margin: "0 6px", opacity: 0.5 }}>
      {c.headerDetailsArrangement === "bullet" ? "•" : c.headerDetailsArrangement === "bar" ? "/" : "|"}
    </span>
  );

  const renderContact = (icon: string, text: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {c.linkIcon && <span>{icon}</span>}
      {text}
    </span>
  );

  const info = data.personalInfo || data.personal || {};
  const nameStr = info.fullName || info.name || '';
  const headlineStr = info.headline || info.jobTitle || '';

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.name}>{nameStr}</h1>
        {headlineStr && <div style={s.headline}>{headlineStr}</div>}
        <div style={s.contactRow}>
          {info.location && renderContact("📍", info.location)}
          {info.email && <>{getSeparator()}{renderContact("✉", info.email)}</>}
          {info.phone && <>{getSeparator()}{renderContact("📞", info.phone)}</>}
          {info.linkedin && <>{getSeparator()}{renderContact("in", info.linkedin)}</>}
        </div>
      </header>

      {data.summary && (!c.summaryInHeader) && (
        <section style={s.section}>
          {c.showSummaryHeading && <div style={s.sectionTitle}>Summary</div>}
          <div style={s.content}>{data.summary}</div>
        </section>
      )}

      {(data.experience ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Professional Experience</div>
          {data.experience!.map((exp, i) => (
            <div key={exp.id || i} style={{ marginBottom: i === data.experience!.length - 1 ? 0 : spaceEntries }}>
              <div style={s.row}>
                <span style={s.bold}>{c.workOrder === "employer_title" ? exp.company : exp.role}</span>
                <span>{exp.startDate} – {exp.endDate || "Present"}</span>
              </div>
              <div style={s.row}>
                <span style={s.italic}>{c.workOrder === "employer_title" ? exp.role : exp.company}</span>
                {exp.location && <span>{exp.location}</span>}
              </div>
              <div style={s.content}>
                {exp.description && <div>{exp.description}</div>}
                {(exp.bullets ?? []).length > 0 && (
                  <ul style={s.bulletList}>
                    {exp.bullets!.map((b: string, bi: number) => <li key={bi}>{b}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {(data.education ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Education</div>
          {data.education!.map((edu, i) => (
            <div key={edu.id || i} style={{ marginBottom: i === data.education!.length - 1 ? 0 : spaceEntries }}>
              <div style={s.row}>
                <span style={s.bold}>{c.educationOrder === "degree_school" ? edu.degree : edu.institution}</span>
                <span>{edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate || edu.year}</span>
              </div>
              <div style={s.row}>
                <span style={s.italic}>{c.educationOrder === "degree_school" ? edu.institution : edu.degree}</span>
              </div>
              {(edu.grade || edu.gpa) && <div style={{ ...s.content, fontStyle: 'italic' }}>Grade: {edu.grade || edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {(data.skills ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Skills</div>
          <div style={s.content}>
            {Array.isArray(data.skills) ? (
              typeof data.skills[0] === 'string' ? (
                <div>{data.skills.join(', ')}</div>
              ) : (
                data.skills.map((skill: any, idx: number) => (
                  <div key={skill.category || idx} style={{ marginBottom: 4 }}>
                    <span style={s.bold}>{skill.category}: </span>
                    <span>{Array.isArray(skill.items) ? skill.items.join(", ") : skill.name}</span>
                  </div>
                ))
              )
            ) : null}
          </div>
        </section>
      )}

      {(data.certifications ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Certificates</div>
          <div style={s.grid}>
            {data.certifications!.map((cert: any, idx: number) => (
              <div key={cert.id || idx}>
                • {cert.name || cert.title} {cert.date && `(${cert.date})`}
              </div>
            ))}
          </div>
        </section>
      )}

      {(data.languages ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Languages</div>
          <div style={s.grid}>
            {Array.isArray(data.languages) ? (
              data.languages.map((lang: any, idx: number) => (
                <div key={typeof lang === 'string' ? lang : (lang.name || idx)}>
                  • {typeof lang === 'string' ? lang : `${lang.name || lang.language} ${lang.proficiency ? `(${lang.proficiency})` : ''}`}
                </div>
              ))
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

export default ClassicTemplate;
