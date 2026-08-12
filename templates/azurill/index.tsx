import React from "react";
import type { TemplateProps } from "../shared/types";
import { PAGE_W, PAGE_H } from "../shared/types";

export default function AzurillTemplate({ data, customization: c, isExport }: TemplateProps) {
  // Extract customization properties with robust fallbacks
  const primaryColor = c.accentColor || "#7C3AED";
  const fontFamily = c.fontFamily || "Inter";
  const fontSizeBase = c.fontSize || 9;
  const lineHeight = c.lineHeight || 1.35;

  const font = `${fontFamily}, system-ui, sans-serif`;
  const nameFont = c.nameFont === "Creative" ? `"Playfair Display", serif` : font;

  // Layout sizing
  const padding = `${c.marginTB || 15}mm ${c.marginLR || 15}mm`;
  const spaceEntries = `${(c.spaceEntries || 4) * 2}px`;
  const gapSpacing = `${(c.spaceEntries || 4) * 3}px`;

  // Scale levels
  const headingScales: Record<string, string> = { s: "11pt", m: "12pt", l: "13pt", xl: "15pt" };
  const headingSize = headingScales[c.sectionHeadingSize] || "12pt";
  const headingTransform = c.sectionHeadingCapitalization === "uppercase" ? "uppercase" : "capitalize";

  const nameScales: Record<string, number> = { xs: 20, s: 24, m: 28, l: 32, xl: 36 };
  const nameFontSize = nameScales[c.nameSize] || 28;
  const titleScales: Record<string, number> = { s: 11, m: 13, l: 15 };
  const titleFontSize = titleScales[c.professionalTitleSize] || 13;

  // Custom colors mode
  const textColor = c.colorsMode === "advanced" ? c.colorText || "#1f2937" : "#1f2937";
  const bgColor = c.colorsMode === "advanced" ? c.colorBackground || "#ffffff" : "#ffffff";
  const applyAccent = c.applyAccentTo || {};

  const headingColor = applyAccent.headings ? primaryColor : textColor;
  const nameColor = applyAccent.name ? primaryColor : "#111827";

  const s: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: font,
      fontSize: `${fontSizeBase}pt`,
      lineHeight: lineHeight,
      color: textColor,
      backgroundColor: bgColor,
      width: PAGE_W,
      minHeight: PAGE_H,
      padding: padding,
      display: "flex",
      flexDirection: "column",
      rowGap: gapSpacing,
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginBottom: spaceEntries,
    },
    photo: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      objectFit: "cover",
      border: `2.5px solid ${primaryColor}`,
      marginBottom: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
    },
    headerName: {
      fontFamily: nameFont,
      fontSize: `${nameFontSize}pt`,
      fontWeight: c.nameBold ? 700 : 400,
      color: nameColor,
      margin: 0,
      letterSpacing: "-0.5px",
    },
    headerHeadline: {
      fontSize: `${titleFontSize}pt`,
      color: applyAccent.jobTitle ? primaryColor : "#4b5563",
      fontWeight: 500,
      marginTop: "4px",
      fontStyle: c.professionalTitleStyle === "italic" ? "italic" : "normal",
    },
    contactRow: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "8px 16px",
      marginTop: "12px",
    },
    contactItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: `${fontSizeBase * 0.9}pt`,
      color: "#4b5563",
      textDecoration: "none",
    },
    contentRow: {
      display: "flex",
      flexDirection: "row",
      gap: "24px",
      flex: 1,
    },
    sidebar: {
      width: "30%",
      display: "flex",
      flexDirection: "column",
      gap: gapSpacing,
    },
    main: {
      width: "70%",
      display: "flex",
      flexDirection: "column",
      gap: gapSpacing,
    },
    sectionTitle: {
      color: headingColor,
      fontSize: headingSize,
      fontWeight: 700,
      textTransform: headingTransform,
      borderBottom: applyAccent.headingsLine ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}40`,
      paddingBottom: "4px",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    timeline: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: spaceEntries,
    },
    timelineLine: {
      position: "absolute",
      top: "10px",
      bottom: "8px",
      left: "7px",
      width: "2px",
      backgroundColor: primaryColor,
      opacity: 0.25,
      zIndex: 0,
    },
    timelineItem: {
      display: "flex",
      flexDirection: "row",
      gap: "12px",
      position: "relative",
      zIndex: 1,
    },
    timelineDotContainer: {
      width: "16px",
      display: "flex",
      justifyContent: "center",
      flexShrink: 0,
    },
    timelineDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      border: `2px solid ${primaryColor}`,
      backgroundColor: bgColor,
      marginTop: "6px",
    },
    timelineContent: {
      flex: 1,
    },
    itemTitleRow: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "2px",
    },
    itemTitle: {
      fontWeight: 700,
      color: "#111827",
    },
    itemSubtitle: {
      fontStyle: "italic",
      color: applyAccent.entrySubtitle ? primaryColor : "#4b5563",
    },
    itemDate: {
      fontSize: `${fontSizeBase * 0.9}pt`,
      color: applyAccent.dates ? primaryColor : "#6b7280",
      fontWeight: 500,
      whiteSpace: "nowrap",
    },
    bulletList: {
      margin: "4px 0 0 0",
      paddingLeft: "16px",
      listStyleType: c.listStyle === "hyphen" ? "'- '" : "disc",
    },
    sidebarItem: {
      marginBottom: "8px",
    },
    sidebarLabel: {
      fontWeight: 700,
      color: "#111827",
      fontSize: `${fontSizeBase * 0.95}pt`,
    },
    sidebarValue: {
      color: "#4b5563",
      fontSize: `${fontSizeBase * 0.9}pt`,
      lineHeight: 1.4,
    },
  };

  const renderContactItem = (icon: React.ReactNode, text: string, link?: string) => {
    if (link) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" style={s.contactItem}>
          {icon}
          <span>{text}</span>
        </a>
      );
    }
    return (
      <div style={s.contactItem}>
        {icon}
        <span>{text}</span>
      </div>
    );
  };

  const renderExperience = () => {
    if (!data.experience?.length) return null;
    return (
      <div key="experience">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>💼</span>}
          Experience
        </h2>
        <div style={s.timeline}>
          <div style={s.timelineLine} />
          {data.experience.map((exp) => (
            <div key={exp.id} style={s.timelineItem}>
              <div style={s.timelineDotContainer}>
                <div style={s.timelineDot} />
              </div>
              <div style={s.timelineContent}>
                <div style={s.itemTitleRow}>
                  <div>
                    <span style={s.itemTitle}>{c.workOrder === "employer_title" ? exp.company : exp.role}</span>
                    <span style={s.itemSubtitle}> — {c.workOrder === "employer_title" ? exp.role : exp.company}</span>
                  </div>
                  <div style={s.itemDate}>{exp.startDate} – {exp.endDate || "Present"}</div>
                </div>
                {exp.location && (
                  <div style={{ fontSize: `${fontSizeBase * 0.85}pt`, color: "#6b7280", marginBottom: "4px" }}>
                    📍 {exp.location}
                  </div>
                )}
                {(exp.bullets ?? []).length > 0 && (
                  <ul style={s.bulletList}>
                    {exp.bullets!.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    if (!data.education?.length) return null;
    return (
      <div key="education">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>🎓</span>}
          Education
        </h2>
        <div style={s.timeline}>
          <div style={s.timelineLine} />
          {data.education.map((edu) => (
            <div key={edu.id} style={s.timelineItem}>
              <div style={s.timelineDotContainer}>
                <div style={s.timelineDot} />
              </div>
              <div style={s.timelineContent}>
                <div style={s.itemTitleRow}>
                  <div>
                    <span style={s.itemTitle}>{c.educationOrder === "degree_school" ? edu.degree : edu.institution}</span>
                    <span style={s.itemSubtitle}> — {c.educationOrder === "degree_school" ? edu.institution : edu.degree}</span>
                  </div>
                  <div style={s.itemDate}>{edu.startDate} – {edu.endDate}</div>
                </div>
                {edu.grade && (
                  <div style={{ fontSize: `${fontSizeBase * 0.9}pt`, color: "#4b5563", fontStyle: "italic", marginTop: "2px" }}>
                    Grade: {edu.grade}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (!data.projects?.length) return null;
    return (
      <div key="projects">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>🚀</span>}
          Projects
        </h2>
        <div style={s.timeline}>
          <div style={s.timelineLine} />
          {data.projects.map((proj) => (
            <div key={proj.id} style={s.timelineItem}>
              <div style={s.timelineDotContainer}>
                <div style={s.timelineDot} />
              </div>
              <div style={s.timelineContent}>
                <div style={s.itemTitleRow}>
                  <span style={s.itemTitle}>{proj.name}</span>
                  <div style={s.itemDate}>{proj.startDate} – {proj.endDate}</div>
                </div>
                {proj.description && <div style={{ marginTop: "4px", fontSize: `${fontSizeBase * 0.95}pt` }}>{proj.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!data.summary) return null;
    return (
      <div key="summary">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>👤</span>}
          Profile
        </h2>
        <div style={{ lineHeight: s.page.lineHeight }}>{data.summary}</div>
      </div>
    );
  };

  const renderCertifications = () => {
    if (!data.certifications?.length) return null;
    return (
      <div key="certifications">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>📜</span>}
          Certifications
        </h2>
        <div style={s.timeline}>
          <div style={s.timelineLine} />
          {data.certifications.map((cert) => (
            <div key={cert.id} style={s.timelineItem}>
              <div style={s.timelineDotContainer}>
                <div style={s.timelineDot} />
              </div>
              <div style={s.timelineContent}>
                <div style={s.itemTitleRow}>
                  <div>
                    <span style={s.itemTitle}>{cert.name}</span>
                    <span style={s.itemSubtitle}> — {cert.issuer}</span>
                  </div>
                  <div style={s.itemDate}>{cert.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSkills = () => {
    if (!data.skills?.length) return null;
    return (
      <div key="skills">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>🧠</span>}
          Skills
        </h2>
        {Array.isArray(data.skills) ? (
          typeof data.skills[0] === 'string' ? (
            <div style={s.sidebarValue}>{(data.skills as string[]).join(', ')}</div>
          ) : (
            (data.skills as any[]).map((skill: any, idx: number) => (
              <div key={skill.category || idx} style={s.sidebarItem}>
                <div style={s.sidebarLabel}>{skill.category || 'Skills'}</div>
                <div style={s.sidebarValue}>{Array.isArray(skill.items) ? skill.items.join(', ') : skill.name}</div>
              </div>
            ))
          )
        ) : null}
      </div>
    );
  };

  const renderLanguages = () => {
    if (!data.languages?.length) return null;
    return (
      <div key="languages">
        <h2 style={s.sectionTitle}>
          {applyAccent.headerIcons && <span style={{ color: primaryColor }}>🌍</span>}
          Languages
        </h2>
        {Array.isArray(data.languages) ? (
          data.languages.map((lang: any, idx: number) => (
            <div key={typeof lang === 'string' ? lang : (lang.name || idx)} style={s.sidebarItem}>
              <div style={s.sidebarLabel}>{typeof lang === 'string' ? lang : (lang.name || lang.language)}</div>
              {typeof lang !== 'string' && lang.proficiency && <div style={s.sidebarValue}>{lang.proficiency}</div>}
            </div>
          ))
        ) : null}
      </div>
    );
  };

  const mainSections = {
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    projects: renderProjects,
    certifications: renderCertifications,
  };

  const sidebarSections = {
    skills: renderSkills,
    languages: renderLanguages,
  };

  // Reorder sections based on selection order
  const orderedMain = c.sectionOrder.filter(id => Object.keys(mainSections).includes(id));
  const orderedSidebar = c.sectionOrder.filter(id => Object.keys(sidebarSections).includes(id));

  // Custom icons
  const mailIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const phoneIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  const mapIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  const globeIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );

  const linkedinIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );

  const githubIcon = (
    <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );

  const info = data.personalInfo || data.personal || {};
  const nameStr = info.fullName || info.name || '';
  const headlineStr = info.headline || info.jobTitle || '';
  const avatarUrl = info.avatar || info.photoUrl;

  return (
    <div style={s.page}>
      {/* Centered Header */}
      <div style={s.header}>
        {c.showPhoto && avatarUrl && (
          <img 
            src={avatarUrl} 
            alt={nameStr} 
            style={s.photo} 
          />
        )}
        <div>
          <h1 style={s.headerName}>{nameStr}</h1>
          {headlineStr && (
            <div style={s.headerHeadline}>{headlineStr}</div>
          )}
        </div>
        <div style={s.contactRow}>
          {info.email && renderContactItem(mailIcon, info.email, `mailto:${info.email}`)}
          {info.phone && renderContactItem(phoneIcon, info.phone, `tel:${info.phone}`)}
          {info.location && renderContactItem(mapIcon, info.location)}
          {info.website && renderContactItem(globeIcon, info.website, info.website)}
          {info.linkedin && renderContactItem(linkedinIcon, info.linkedin, info.linkedin)}
          {info.github && renderContactItem(githubIcon, info.github, info.github)}
        </div>
      </div>

      {/* Two-Column split body */}
      <div style={s.contentRow}>
        <div style={s.sidebar}>
          {orderedSidebar.map(id => {
            const RenderFn = sidebarSections[id as keyof typeof sidebarSections];
            return RenderFn ? <RenderFn key={id} /> : null;
          })}
        </div>
        
        <div style={s.main}>
          {orderedMain.map(id => {
            const RenderFn = mainSections[id as keyof typeof mainSections];
            return RenderFn ? <RenderFn key={id} /> : null;
          })}
        </div>
      </div>
    </div>
  );
}
