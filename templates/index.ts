import React from 'react';
import AzurillTemplate from './azurill/index.js';
import { ClassicTemplate } from './classic/index.js';
import { ExecutiveTemplate } from './executive/index.js';
import { ModernTemplate } from './modern/index.js';
import { ProfessionalTemplate } from './professional/index.js';
import { AmagaTemplate } from './amaga/index.js';
import { KaffleTemplate } from './kaffle/index.js';
import { SlateRibbonTemplate } from './slate-ribbon/index.js';
import { QuietBlueTemplate } from './quiet-blue/index.js';
import { SlateDawnTemplate } from './slate-dawn/index.js';
import { SageLineTemplate } from './sage-line/index.js';
import { CorporatePanelTemplate } from './corporate-panel/index.js';
import { SteadyFormTemplate } from './steady-form/index.js';
import { LeavesTemplate } from './leaves/index.js';
import type { HireUpCustomization, ResumeData } from './shared/types.js';

export * from './shared/types.js';
export {
  AzurillTemplate,
  ClassicTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  ProfessionalTemplate,
  AmagaTemplate,
  KaffleTemplate,
  SlateRibbonTemplate,
  QuietBlueTemplate,
  SlateDawnTemplate,
  SageLineTemplate,
  CorporatePanelTemplate,
  SteadyFormTemplate,
  LeavesTemplate,
};

export const defaultCustomization: HireUpCustomization = {
  templateId: 'kaffle',
  showPhoto: false,
  sectionOrder: ['summary', 'education', 'experience', 'projects', 'skills'],
  language: 'en-GB',
  dateFormat: 'DD/MM/YYYY',
  pageFormat: 'A4',
  columns: 'one',
  fontSize: 9,
  nameFontSizeOffset: 14,
  titleFontSizeOffset: 6.5,
  headingFontSizeOffset: 1,
  entryHeaderFontSizeOffset: 0,
  lineHeight: 1.1,
  marginLR: 10,
  marginTB: 10,
  spaceEntries: 4,
  entryStructure: 'full',
  dateLocationPosition: 'right',
  titleSize: 'M',
  subtitleStyle: 'bold',
  subtitlePlacement: 'same',
  indentBody: false,
  listStyle: 'bullet',
  showPageNumbers: false,
  showFooterEmail: false,
  showFooterName: false,
  fontCategory: 'sans',
  fontFamily: 'Source Sans Pro',
  colorArea: 'full',
  colorType: 'single',
  colorsMode: 'basic',
  colorScheme: 'default',
  accentColor: '#2563EB',
  colorText: '#111827',
  colorBackground: '#FFFFFF',
  applyAccentTo: {
    name: true,
    jobTitle: true,
    headings: true,
    headingsLine: true,
    headerIcons: false,
    dotsBars: false,
    dates: false,
    entrySubtitle: false,
    linkIcons: false,
  },
  sectionHeadingCapitalization: 'capitalize',
  sectionHeadingSize: 'm',
  sectionIconStyle: 'none',
  sectionHeadingFont: 'body',
  photoPosition: 'center',
  photoShape: 'circle',
  photoSize: 'medium',
  linkUnderline: false,
  linkBlue: true,
  linkIcon: false,
  headerAlignment: 'center',
  headerDetailsArrangement: 'pipe',
  nameSize: 'l',
  nameBold: true,
  nameFont: 'Same as body font',
  professionalTitleSize: 'm',
  professionalTitlePosition: 'below',
  professionalTitleStyle: 'normal',
  skillsLayout: 'bubble',
  skillsShowLevel: false,
  skillsRowSpacing: 'tight',
  skillsStartWithBullets: false,
  skillsSubinfoStyle: 'colon',
  languagesLayout: 'compact',
  languagesSubinfoStyle: 'colon',
  summaryInHeader: false,
  showSummaryHeading: true,
  educationOrder: 'degree_school',
  workOrder: 'title_employer',
  groupPromotions: false,
  spacing: 'normal',
};

export const TEMPLATES_META = [
  { id: 'kaffle', name: 'Kaffle', description: 'ATS-friendly centered layout with dark navy accent headers, right-aligned dates, and multi-column skills.', component: KaffleTemplate },
  { id: 'slate-ribbon', name: 'Slate Ribbon', description: 'Georgia Serif layout with shaded grey section banners and 2-column contact header.', component: SlateRibbonTemplate },
  { id: 'quiet-blue', name: 'Quiet Blue', description: 'Elegant layout with sky-blue divider lines and clean serif typography.', component: QuietBlueTemplate },
  { id: 'slate-dawn', name: 'Slate Dawn', description: 'Modern 2-column editorial split layout with dark slate section headers.', component: SlateDawnTemplate },
  { id: 'sage-line', name: 'Sage Line', description: 'Fresh layout featuring sage-green title fonts and underline section accents.', component: SageLineTemplate },
  { id: 'corporate-panel', name: 'Corporate Panel', description: 'Double-line corporate headers with shaded title banners and dot proficiency meters.', component: CorporatePanelTemplate },
  { id: 'steady-form', name: 'Steady Form', description: 'Compact grid layout with round circular avatar photo and pill section headers.', component: SteadyFormTemplate },
  { id: 'leaves', name: 'Leaves', description: 'Botanical dark-green left margin sidebar with clean modern typography.', component: LeavesTemplate },
  { id: 'classic', name: 'Classic', description: 'Timeless, elegant, and traditional layout suited for all roles.', component: ClassicTemplate },
  { id: 'modern', name: 'Modern', description: 'Clean sans-serif structure with distinct section accents.', component: ModernTemplate },
  { id: 'executive', name: 'Executive', description: 'Sophisticated layout designed for experienced leaders.', component: ExecutiveTemplate },
  { id: 'azurill', name: 'Azurill', description: 'Modern vibrant design with subtle color highlights and clear hierarchy.', component: AzurillTemplate },
  { id: 'professional', name: 'Professional', description: 'Dense, highly structured layout for maximum content density.', component: ProfessionalTemplate },
  { id: 'amaga', name: 'AMAGA', description: 'Compact editorial layout with clear dividers, date columns, and language labels.', component: AmagaTemplate },
];

export function ResumeRenderer({ templateId, data, customization }: { templateId?: string; data: ResumeData; customization?: Partial<HireUpCustomization> }) {
  const custom = { ...defaultCustomization, ...customization, templateId: templateId || defaultCustomization.templateId };
  const matched = TEMPLATES_META.find(t => t.id === (templateId || 'kaffle')) || TEMPLATES_META[0];
  const Component = matched.component;
  return React.createElement(Component, { data, customization: custom });
}
