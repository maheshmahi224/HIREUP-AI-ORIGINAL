import React from "react";
import type { TemplateProps } from "../shared/types.js";
import { PAGE_W, PAGE_H } from "../shared/types.js";

export function ModernTemplate({ data, customization }: TemplateProps) {
  const c = customization;

  const font = c.fontFamily ? `"${c.fontFamily}", system-ui, sans-serif` : '"Inter", system-ui, sans-serif';
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
  const textColor = isMultiColor ? (c.colorText || '#1F2937') : isImageBg ? '#FFFFFF' : '#111827';
  const bgColor = isMultiColor ? (c.colorBackground || '#FFFFFF') : isImageBg ? '#0F172A' : '#FFFFFF';
  const accent = c.accentColor || '#2563EB';

  const applyAccent = c.applyAccentTo || {};
  const headingColor = applyAccent.headings ? accent : textColor;
  const nameColor = applyAccent.name ? accent : textColor;
  const titleColor = applyAccent.jobTitle ? accent : textColor;
  const datesColor = applyAccent.dates ? accent : textColor;
  const subtitleColor = applyAccent.entrySubtitle ? accent : textColor;

  const s: Record<string, React.CSSProperties> = {
    page: { 
      fontFamily: font, fontSize: fs, color: textColor, background: isImageBg && c.backgroundImage ? `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url(${c.backgroundImage}) center/cover` : bgColor, 
      width: PAGE_W, minHeight: PAGE_H, padding, boxSizing: "border-box", 
      lineHeight: lineHeight 
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${accent}`, paddingBottom: 14, marginBottom: spaceEntries },
    name: { fontSize: "24pt", fontWeight: 700, color: nameColor, margin: 0, letterSpacing: "-0.5px" },
    headline: { fontSize: "11pt", marginTop: 4, fontWeight: 600, color: accent },
    contactRow: { display: "flex", flexDirection: "column", gap: "2px", fontSize: "9pt", color: "#4b5563", textAlign: "right" },
    section: { marginBottom: `${(c.spaceEntries || 4) * 3}px` },
    sectionTitle: { 
      fontSize: headingSize, fontWeight: 700, textTransform: headingTransform, 
      color: headingColor, borderBottom: `1px solid #e5e7eb`, 
      paddingBottom: 3, marginBottom: 8 
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    bold: { fontWeight: 600 },
    italic: { color: "#4b5563" },
    content: { marginTop: 4 },
    bulletList: { margin: "4px 0 0 16px", padding: 0 }
  };

  const info = data.personalInfo || data.personal || {};
  const nameStr = info.fullName || info.name || '';
  const headlineStr = info.headline || info.jobTitle || '';

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.name}>{nameStr}</h1>
          {headlineStr && <div style={s.headline}>{headlineStr}</div>}
        </div>
        <div style={s.contactRow}>
          {info.email && <span>✉ {info.email}</span>}
          {info.phone && <span>📞 {info.phone}</span>}
          {info.location && <span>📍 {info.location}</span>}
          {info.linkedin && <span>in {info.linkedin}</span>}
        </div>
      </header>

      {data.summary && (
        <section style={s.section}>
          <div style={s.sectionTitle}>About</div>
          <div style={s.content}>{data.summary}</div>
        </section>
      )}

      {(data.experience ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Experience</div>
          {data.experience!.map((exp, i) => (
            <div key={exp.id || i} style={{ marginBottom: i === data.experience!.length - 1 ? 0 : spaceEntries }}>
              <div style={s.row}>
                <span style={s.bold}>{c.workOrder === "employer_title" ? exp.company : exp.role}</span>
                <span style={{ fontSize: "8.5pt", color: "#6b7280" }}>{exp.startDate} – {exp.endDate || "Present"}</span>
              </div>
              <div style={s.row}>
                <span style={s.italic}>{c.workOrder === "employer_title" ? exp.role : exp.company}</span>
                {exp.location && <span style={{ fontSize: "8.5pt", color: "#6b7280" }}>{exp.location}</span>}
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
                <span style={{ fontSize: "8.5pt", color: "#6b7280" }}>{edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate || edu.year}</span>
              </div>
              <div style={s.row}>
                <span style={s.italic}>{c.educationOrder === "degree_school" ? edu.institution : edu.degree}</span>
              </div>
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
                <div>{data.skills.join(' • ')}</div>
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
    </div>
  );
}

export default ModernTemplate;
