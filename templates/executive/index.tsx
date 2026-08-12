import React from "react";
import type { TemplateProps } from "../shared/types.js";
import { PAGE_W, PAGE_H } from "../shared/types.js";

export function ExecutiveTemplate({ data, customization }: TemplateProps) {
  const c = customization;

  const font = `${c.fontFamily || "Garamond"}, serif`;
  const fs = `${c.fontSize || 10.5}pt`;
  const lineHeight = c.lineHeight || 1.45;

  const padding = `${c.marginTB || 18}mm ${c.marginLR || 22}mm`;
  const spaceEntries = `${(c.spaceEntries || 4) * 2}px`;

  const headingScales: Record<string, string> = { s: "12pt", m: "13pt", l: "15pt", xl: "17pt" };
  const headingSize = headingScales[c.sectionHeadingSize] || "13pt";
  const headingTransform = c.sectionHeadingCapitalization === "uppercase" ? "uppercase" : "capitalize";

  const textColor = c.colorsMode === "advanced" ? c.colorText || "#1a1a1a" : "#1a1a1a";
  const bgColor = c.colorsMode === "advanced" ? c.colorBackground || "#fff" : "#fff";
  const accent = c.accentColor || "#1e3a8a";

  const applyAccent = c.applyAccentTo || {};
  const headingColor = applyAccent.headings ? accent : textColor;
  const nameColor = applyAccent.name ? accent : textColor;

  const s: Record<string, React.CSSProperties> = {
    page: { 
      fontFamily: font, fontSize: fs, color: textColor, background: bgColor, 
      width: PAGE_W, minHeight: PAGE_H, padding, boxSizing: "border-box", 
      lineHeight: lineHeight 
    },
    header: { borderBottom: `2px solid ${accent}`, paddingBottom: 12, marginBottom: spaceEntries },
    name: { fontSize: "26pt", fontWeight: 700, color: nameColor, margin: 0, letterSpacing: "-0.5px" },
    headline: { fontSize: "13pt", marginTop: 4, fontWeight: 600, color: accent },
    contactRow: { display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 8, fontSize: "9.5pt", color: "#4b5563" },
    section: { marginBottom: `${(c.spaceEntries || 4) * 3}px` },
    sectionTitle: { 
      fontSize: headingSize, fontWeight: 700, textTransform: headingTransform, 
      color: headingColor, letterSpacing: "0.05em", borderBottom: `1px solid ${(c as any).border || '#cbd5e1'}`, 
      paddingBottom: 3, marginBottom: 10 
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    bold: { fontWeight: 700 },
    italic: { fontStyle: "italic" },
    content: { marginTop: 4 },
    bulletList: { margin: "4px 0 0 16px", padding: 0 }
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
          {info.location && <span>📍 {info.location}</span>}
          {info.email && <span>✉ {info.email}</span>}
          {info.phone && <span>📞 {info.phone}</span>}
          {info.linkedin && <span>in {info.linkedin}</span>}
        </div>
      </header>

      {data.summary && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Executive Summary</div>
          <div style={s.content}>{data.summary}</div>
        </section>
      )}

      {(data.experience ?? []).length > 0 && (
        <section style={s.section}>
          <div style={s.sectionTitle}>Leadership & Experience</div>
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
          <div style={s.sectionTitle}>Education & Credentials</div>
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
          <div style={s.sectionTitle}>Core Competencies</div>
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

export default ExecutiveTemplate;
