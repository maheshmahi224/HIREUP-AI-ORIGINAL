import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../db/mongo.js';
import { authenticate } from '../middleware/auth.js';
import type { Resume } from '../types/domain.js';
import { asyncRoute, fail } from '../utils/http.js';

const router = Router();
router.use(authenticate);

const parseId = (v: string | string[] | undefined) => (typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : undefined);

router.get('/:id/download', asyncRoute(async (req, res) => {
  const resumeId = parseId(req.params.id);
  if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  const db = await database();
  const resume = await db.collection<Resume>('resumes').findOne({
    _id: resumeId,
    userId: req.auth!.user._id,
  });

  if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  // Verify payment
  if (resume.paymentState !== 'paid') {
    return fail(res, 402, 'PAYMENT_REQUIRED', 'Resume download requires ₹30 payment.');
  }

  // Increment download counter
  await db.collection<Resume>('resumes').updateOne(
    { _id: resumeId },
    { $inc: { downloadCount: 1 }, $set: { updatedAt: new Date() } }
  );

  const content = resume.content || {};
  const personal = (content.personal as Record<string, string>) || {};
  const summary = (content.summary as string) || '';
  const education = (content.education as Array<Record<string, string>>) || [];
  const experience = (content.experience as Array<Record<string, string>>) || [];
  const projects = (content.projects as Array<Record<string, string>>) || [];
  const skills = (content.skills as string[]) || [];
  const settings = (content.documentSettings as Record<string, unknown>) || {};
  const safeNumber = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && value >= min && value <= max ? value : fallback;
  const fontSize = safeNumber(settings.fontSize, 10, 8, 13);
  const lineHeight = safeNumber(settings.lineHeight, 1.45, 1.1, 1.7);
  const marginLR = safeNumber(settings.marginLR, 20, 10, 22);
  const marginTB = safeNumber(settings.marginTB, 15, 10, 22);
  const accent = typeof settings.accentColor === 'string' && /^#[0-9a-f]{6}$/i.test(settings.accentColor) ? settings.accentColor : '#2563eb';
  const font = ['Inter', 'Arial', 'Georgia'].includes(String(settings.fontFamily)) ? String(settings.fontFamily) : 'Inter';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(resume.title || 'Resume')}</title>
  <style>
    @page { size: A4; margin: ${marginTB}mm ${marginLR}mm; }
    body {
      font-family: '${font}', Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: ${fontSize}pt;
      line-height: ${lineHeight};
    }
    .resume-header { text-align: ${settings.headerAlignment === 'left' ? 'left' : 'center'}; margin-bottom: 20px; border-bottom: 2px solid ${accent}; padding-bottom: 12px; }
    .resume-name { font-size: 22pt; font-weight: 700; margin: 0 0 4px 0; color: ${accent}; letter-spacing: -0.5px; }
    .contact-line { font-size: 9.5pt; color: #4b5563; }
    .contact-line span { margin: 0 6px; }
    .section-title { font-size: 11pt; font-weight: 700; text-transform: ${settings.sectionHeadingCapitalization === 'capitalize' ? 'capitalize' : 'uppercase'}; letter-spacing: 0.5px; border-bottom: 1px solid ${accent}; padding-bottom: 3px; margin: 16px 0 8px 0; color: ${accent}; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; font-size: 10.5pt; }
    .item-sub { font-size: 9.5pt; color: #4b5563; font-style: italic; margin-bottom: 4px; }
    .item-desc { font-size: 9.5pt; color: #374151; margin-bottom: 10px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-chip { background: #f3f4f6; color: #1f2937; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: 500; }
  </style>
</head>
<body>
  <div class="resume-header">
    <h1 class="resume-name">${escapeHtml(personal.name || 'Your Name')}</h1>
    <div class="contact-line">
      ${[personal.email, personal.phone, personal.location, personal.linkedin, personal.github].filter(Boolean).map(escapeHtml).join('<span>•</span>')}
    </div>
  </div>

  ${summary ? `<div class="section-title">Professional Summary</div><p class="item-desc">${escapeHtml(summary)}</p>` : ''}

  ${education.length ? `<div class="section-title">Education</div>` + education.map(e => `
    <div class="item-header">
      <span>${escapeHtml(e.institution || e.school || '')}</span>
      <span>${escapeHtml(e.endDate || e.year || '')}</span>
    </div>
    <div class="item-sub">${escapeHtml(e.degree || '')} ${e.fieldOfStudy ? 'in ' + escapeHtml(e.fieldOfStudy) : ''}</div>
  `).join('') : ''}

  ${experience.length ? `<div class="section-title">Experience</div>` + experience.map(exp => `
    <div class="item-header">
      <span>${escapeHtml(exp.role || exp.title || '')} — ${escapeHtml(exp.company || '')}</span>
      <span>${escapeHtml(exp.startDate || '')} ${exp.endDate ? '- ' + escapeHtml(exp.endDate) : ''}</span>
    </div>
    <div class="item-desc">${escapeHtml(exp.description || (Array.isArray(exp.highlights) ? exp.highlights.join(' ') : ''))}</div>
  `).join('') : ''}

  ${projects.length ? `<div class="section-title">Projects</div>` + projects.map(p => `
    <div class="item-header">
      <span>${escapeHtml(p.name || p.title || '')}</span>
    </div>
    <div class="item-desc">${escapeHtml(p.description || '')}</div>
  `).join('') : ''}

  ${skills.length ? `<div class="section-title">Skills & Technologies</div>
    <div class="skills-list">
      ${skills.map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('')}
    </div>` : ''}

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() { window.print(); }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.html"`);
  return res.send(html);
}));

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default router;
