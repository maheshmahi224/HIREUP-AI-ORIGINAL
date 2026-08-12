// ============================================================
// HireUp AI — Shared HTML Template Types
// (Used by ALL live-preview templates in the frontend)
// ============================================================

export interface PersonalInfo {
  name?: string;
  fullName?: string;
  jobTitle?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photoUrl?: string;
  avatar?: string;
}

export interface EducationEntry {
  id?: string;
  institution?: string;
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  year?: string;
  gpa?: string;
  grade?: string;
  location?: string;
  bullets?: string[];
}

export interface ExperienceEntry {
  id?: string;
  company?: string;
  employer?: string;
  role?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  highlights?: string[];
  bullets?: string[];
  description?: string;
}

export interface SkillCategoryItem {
  id?: string;
  category?: string;
  items?: string[];
  name?: string;
}

export interface CertificationItem {
  id?: string;
  name?: string;
  title?: string;
  issuer?: string;
  date?: string;
}

export interface LanguageItem {
  id?: string;
  name?: string;
  language?: string;
  proficiency?: string;
  level?: string;
}

export interface ResumeData {
  personalInfo?: PersonalInfo;
  personal?: PersonalInfo;
  summary?: string;
  profile?: string;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  internships?: ExperienceEntry[];
  projects?: Array<{
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    link?: string;
  }>;
  skills?: any; // Allows string[] or SkillCategoryItem[]
  certifications?: CertificationItem[];
  achievements?: string[];
  awards?: Array<{ id?: string; title?: string; issuer?: string; date?: string }>;
  languages?: any; // Allows string[] or LanguageItem[]
  customSections?: Array<{ id?: string; title?: string; items?: string[] }>;
}

export type TemplateData = ResumeData;

export interface HireUpCustomization {
  // ── Core ──────────────────────────────────────────────
  templateId: string;
  showPhoto: boolean;
  sectionOrder: string[];

  // ── Language & Region ─────────────────────────────────
  language: string;
  dateFormat: string;
  pageFormat: 'A4' | 'Letter';

  // ── Layout ────────────────────────────────────────────
  columns: 'one' | 'two' | 'mix';

  // ── Spacing & Typography ──────────────────────────────
  fontSize: number; // pt 8–14 (Base Font Size)
  nameFontSizeOffset: number; // pt (+14pt default)
  titleFontSizeOffset: number; // pt (+6.5pt default)
  headingFontSizeOffset: number; // pt (+1pt default)
  entryHeaderFontSizeOffset: number; // pt (+0pt default)
  lineHeight: number; // 0.8–2.0
  marginLR: number; // mm 5–25
  marginTB: number; // mm 5–25
  spaceEntries: number; // arbitrary 0–10

  // ── Entry Layout ──────────────────────────────────────
  entryStructure: 'full' | 'columns';
  dateLocationPosition: 'right' | 'below';
  titleSize: 'S' | 'M' | 'L';
  subtitleStyle: 'normal' | 'bold' | 'italic';
  subtitlePlacement: 'same' | 'next';
  indentBody: boolean;
  listStyle: 'bullet' | '-' | 'hyphen';

  // ── Footer ────────────────────────────────────────────
  showPageNumbers: boolean;
  showFooterEmail: boolean;
  showFooterName: boolean;

  // ── Font ──────────────────────────────────────────────
  fontCategory: 'serif' | 'sans' | 'mono';
  fontFamily: string;

  // ── Colors ────────────────────────────────────────────
  colorArea: 'full' | 'header' | 'border';
  colorType: 'single' | 'multi' | 'image';
  colorsMode: 'basic' | 'advanced';
  colorScheme: string; // legacy
  accentColor: string;
  colorText: string;
  colorBackground: string;
  backgroundImage?: string;
  applyAccentTo: {
    name: boolean;
    jobTitle: boolean;
    headings: boolean;
    headingsLine: boolean;
    headerIcons: boolean;
    dotsBars: boolean;
    dates: boolean;
    entrySubtitle: boolean;
    linkIcons: boolean;
  };

  // ── Section Headings ──────────────────────────────────
  sectionHeadingCapitalization: 'capitalize' | 'uppercase';
  sectionHeadingSize: 's' | 'm' | 'l' | 'xl';
  sectionIconStyle: 'none' | 'outline' | 'filled';
  sectionHeadingFont: 'body' | 'name';

  // ── Photo ─────────────────────────────────────────────
  photoPosition: 'left' | 'center' | 'right';
  photoShape: 'circle' | 'square' | 'rounded';
  photoSize: 'small' | 'medium' | 'large';

  // ── Link Styling ──────────────────────────────────────
  linkUnderline: boolean;
  linkBlue: boolean;
  linkIcon: boolean;

  // ── Header Layout ─────────────────────────────────────
  headerAlignment: 'left' | 'center';
  headerDetailsArrangement: 'icon' | 'bullet' | 'pipe' | 'bar';

  // ── Name ──────────────────────────────────────────────
  nameSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  nameBold: boolean;
  nameFont: string;

  // ── Professional Title ────────────────────────────────
  professionalTitleSize: 's' | 'm' | 'l';
  professionalTitlePosition: 'same' | 'below';
  professionalTitleStyle: 'normal' | 'italic';

  // ── Skills ────────────────────────────────────────────
  skillsLayout: 'grid' | 'rows' | 'compact' | 'bubble';
  skillsShowLevel: boolean;
  skillsRowSpacing: 'tight' | 'spacious';
  skillsStartWithBullets: boolean;
  skillsSubinfoStyle: 'colon' | 'dash' | 'bracket';

  // ── Languages ─────────────────────────────────────────
  languagesLayout: 'grid' | 'rows' | 'compact' | 'bubble';
  languagesSubinfoStyle: 'colon' | 'dash' | 'bracket';

  // ── Summary ───────────────────────────────────────────
  summaryInHeader: boolean;
  showSummaryHeading: boolean;

  // ── Education ─────────────────────────────────────────
  educationOrder: 'degree_school' | 'school_degree';

  // ── Work Experience ───────────────────────────────────
  workOrder: 'title_employer' | 'employer_title';
  groupPromotions: boolean;

  // ── Legacy aliases ────────────────────────────────────
  spacing: 'compact' | 'normal' | 'relaxed';
  pageMargin?: 'narrow' | 'normal' | 'wide';
}

export interface TemplateProps {
  data: ResumeData;
  customization: HireUpCustomization;
  isExport?: boolean;
}

export const PAGE_W = 794;
export const PAGE_H = 1123;
