import React from "react";
import type { TemplateProps } from "../shared/types.js";
import { PAGE_W, PAGE_H } from "../shared/types.js";

export function ProfessionalTemplate({ data, customization }: TemplateProps) {
  const c = customization;

  const font = `${c.fontFamily || "Calibri"}, system-ui, sans-serif`;
  const fs = `${c.fontSize || 9.5}pt`;
  const lineHeight = c.lineHeight || 1.35;

  const padding = `${c.marginTB || 12}mm ${c.marginLR || 16}mm`;
  const spaceEntries = `${(c.spaceEntries || 3) * 2}px`;

  const textColor = c.colorsMode === "advanced" ? c.colorText || "#111827" : "#111827";
  const bgColor = c.colorsMode === "advanced" ? c.colorBackground || "#ffffff" : "#ffffff";
  const accent = c.accentColor || "#0f172a";

  const s: Record<string, React.CSSProperties> = {
    page: { 
      fontFamily: font, fontSize: fs, color: textColor, background: bgColor, 
      width: PAGE_W, minHeight: PAGE_H, padding, boxSizing: "border-box", 
      lineHeight: lineHeight 
    },
    header: { borderBottom: `2px solid ${accent}`, paddingBottom: 8, marginBottom: spaceEntries },
    name: { fontSize: "22pt", fontWeight: 700, color: accent, margin: 0, letterSpacing: "-0.5px" },
    headline: { fontSize: "10.5pt", marginTop: 2, fontWeight: 600, color: "#4b5563" },
    contactRow: { display: "flex", gap: "12px", marginTop: 6, fontSize: "9pt", color: "#4b5563" },
    section: { marginBottom: `${(c.spaceEntries || 3) * 3}px` },
    sectionTitle: { 
      fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", 
      color: accent, borderBottom: `1px solid ${accent}`, 
      paddingBottom: 2, marginBottom: 6, letterSpacing: "0.05em" 
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    bold: { fontWeight: 700 },
    italic: { fontStyle: "italic" },
    content: { marginTop: 2 },
    bulletList: { margin: "2px 0 0 14px", padding: 0 }
  };

  const info = data.personalInfo || data.personal || {};
  const nameStr = info.fullName || info.name || '';
  const headlineStr = info.headline || info.jobTitle || '';

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.name}>{nameStr}</h1>
        {headlineStr && <div style={s.headline}>{headlineStr}</div>}
        <div style={s.contactRow}>
          {info.email && <span>Email: {info.email}</span>}
          {info.phone && <span>Mobile: {info.phone}</span>}
          {info.location && <span>Location: {info.location}</span>}
          {info.linkedin && <span>LinkedIn: {info.linkedin}</span>}
        </div>
      </header>

      {data.summary && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Summary</div>
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
                  <div key={skill.category || idx} style={{ marginBottom: 2 }}>
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

export default ProfessionalTemplate;
