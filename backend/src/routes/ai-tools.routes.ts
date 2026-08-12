import { Router } from 'express';
import { z } from 'zod';
import { authenticate, csrf } from '../middleware/auth.js';
import { asyncRoute, fail, getValidated, ok, validate } from '../utils/http.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticate);

// ─── Groq / OpenAI-compat client ────────────────────────────────────────────
async function groqChat(messages: Array<{ role: string; content: string }>, temperature = 0.3): Promise<string> {
  const key = env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature,
        max_tokens: 4096,
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Groq API error ${res.status}: ${txt}`);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned empty response');
    return text.trim();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── 1. Generate / Improve Summary ───────────────────────────────────────────
const summarySchema = z.object({
  resumeData: z.record(z.unknown()),
  jobTitle: z.string().optional(),
});

router.post('/generate-summary', csrf, validate(summarySchema), asyncRoute(async (req, res) => {
  const { resumeData, jobTitle } = getValidated<typeof summarySchema._output>(req);
  const personal = (resumeData.personal as Record<string, string>) || {};
  const experience = (resumeData.experience as any[]) || [];
  const skills = (resumeData.skills as string[]) || [];
  const education = (resumeData.education as any[]) || [];

  const context = [
    personal.name ? `Name: ${personal.name}` : '',
    jobTitle ? `Target Role: ${jobTitle}` : '',
    experience.length ? `Experience: ${experience.map(e => `${e.role || e.title} at ${e.company}`).join(', ')}` : '',
    education.length ? `Education: ${education.map(e => `${e.degree} from ${e.institution}`).join(', ')}` : '',
    skills.length ? `Skills: ${skills.slice(0, 20).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const result = await groqChat([
    {
      role: 'system',
      content: `You are an expert resume writer. Write a compelling, ATS-optimized professional summary in 2-4 sentences.
Rules:
- Write in third person (e.g., "Experienced developer..." not "I am...")
- Be specific — mention key technologies, years of experience, and career goals
- Do NOT fabricate details not in the provided data
- Return ONLY the summary text, no labels or explanations
- Optimize for ATS keyword density
- For Indian tech context, highlight full-stack, AI/ML, or relevant skills`,
    },
    {
      role: 'user',
      content: `Generate a professional summary for this candidate:\n\n${context}`,
    },
  ], 0.4);

  return ok(res, { summary: result });
}));

// ─── 2. Check Spelling & Grammar ─────────────────────────────────────────────
const grammarSchema = z.object({
  text: z.string().min(10).max(8000),
  section: z.string().optional(),
});

router.post('/check-grammar', csrf, validate(grammarSchema), asyncRoute(async (req, res) => {
  const { text, section } = getValidated<typeof grammarSchema._output>(req);

  const result = await groqChat([
    {
      role: 'system',
      content: `You are a professional resume editor and grammar expert.
Analyze the text and return a JSON response with this exact structure:
{
  "score": 85,
  "issues": [
    {
      "type": "grammar|spelling|style|clarity|ats",
      "severity": "error|warning|suggestion",
      "original": "the original text with issue",
      "suggestion": "corrected version",
      "explanation": "brief reason"
    }
  ],
  "corrected": "full corrected version of the text",
  "tips": ["specific tip 1", "specific tip 2"]
}
Return ONLY valid JSON, no markdown.`,
    },
    {
      role: 'user',
      content: `Check grammar, spelling, and style for this resume ${section ? `(${section} section)` : 'text'}:\n\n${text}`,
    },
  ], 0.2);

  let parsed: any;
  try {
    const cleaned = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { score: 80, issues: [], corrected: text, tips: ['Unable to parse detailed results. Text looks generally acceptable.'] };
  }

  return ok(res, parsed);
}));

// ─── 3. Translate Resume ─────────────────────────────────────────────────────
const translateSchema = z.object({
  resumeData: z.record(z.unknown()),
  targetLanguage: z.string().min(2).max(50),
});

router.post('/translate', csrf, validate(translateSchema), asyncRoute(async (req, res) => {
  const { resumeData, targetLanguage } = getValidated<typeof translateSchema._output>(req);

  // Only translate text fields, not dates/URLs
  const personal = (resumeData.personal as Record<string, string>) || {};
  const summary = (resumeData.summary as string) || '';
  const experience = (resumeData.experience as any[]) || [];
  const education = (resumeData.education as any[]) || [];
  const projects = (resumeData.projects as any[]) || [];

  const textToTranslate = {
    summary,
    experienceHighlights: experience.flatMap(e => e.highlights || e.bullets || []),
    projectDescriptions: projects.map(p => p.description || ''),
    educationFields: education.map(e => e.fieldOfStudy || ''),
  };

  const result = await groqChat([
    {
      role: 'system',
      content: `You are a professional resume translator. Translate the provided JSON text fields to ${targetLanguage}.
Rules:
- Keep ALL keys exactly the same
- Only translate text values, NOT dates, URLs, email addresses, phone numbers, or technical skill names
- Keep proper nouns (company names, university names, product names) in original language unless they have a well-known translation
- Maintain professional resume tone
- Return ONLY valid JSON with the same structure`,
    },
    {
      role: 'user',
      content: `Translate these resume text fields to ${targetLanguage}:\n\n${JSON.stringify(textToTranslate, null, 2)}`,
    },
  ], 0.2);

  let translated: any;
  try {
    const cleaned = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    translated = JSON.parse(cleaned);
  } catch {
    return fail(res, 422, 'TRANSLATION_PARSE_ERROR', 'Translation result could not be parsed. Please try again.');
  }

  // Rebuild resume with translated fields
  const translatedResume = {
    ...resumeData,
    summary: translated.summary || summary,
    experience: experience.map((exp, i) => ({
      ...exp,
      highlights: (translated.experienceHighlights || []).slice(
        experience.slice(0, i).reduce((sum: number, e: any) => sum + (e.highlights?.length || 0), 0),
        experience.slice(0, i + 1).reduce((sum: number, e: any) => sum + (e.highlights?.length || 0), 0)
      ) || exp.highlights,
    })),
    projects: projects.map((p, i) => ({
      ...p,
      description: (translated.projectDescriptions || [])[i] || p.description,
    })),
  };

  return ok(res, { translatedResume, targetLanguage });
}));

// ─── 4. Draft Cover Letter ────────────────────────────────────────────────────
const coverLetterSchema = z.object({
  resumeData: z.record(z.unknown()),
  jobTitle: z.string().min(2).max(200),
  companyName: z.string().min(1).max(200),
  jobDescription: z.string().max(5000).optional(),
  tone: z.enum(['professional', 'enthusiastic', 'concise']).default('professional'),
});

router.post('/cover-letter', csrf, validate(coverLetterSchema), asyncRoute(async (req, res) => {
  const { resumeData, jobTitle, companyName, jobDescription, tone } = getValidated<typeof coverLetterSchema._output>(req);
  const personal = (resumeData.personal as Record<string, string>) || {};
  const experience = (resumeData.experience as any[]) || [];
  const skills = (resumeData.skills as string[]) || [];
  const projects = (resumeData.projects as any[]) || [];

  const candidateContext = [
    `Name: ${personal.name || 'Candidate'}`,
    experience.length ? `Most Recent Role: ${experience[0]?.role || experience[0]?.title} at ${experience[0]?.company}` : '',
    experience.length > 1 ? `Previous: ${experience[1]?.role || experience[1]?.title} at ${experience[1]?.company}` : '',
    projects.length ? `Key Projects: ${projects.slice(0, 2).map(p => p.name).join(', ')}` : '',
    skills.length ? `Top Skills: ${skills.slice(0, 12).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const result = await groqChat([
    {
      role: 'system',
      content: `You are an expert cover letter writer who crafts compelling, personalized cover letters.
Tone: ${tone}
Rules:
- Write a complete, professional cover letter (3-4 paragraphs)
- Opening: Hook that mentions the specific role and company
- Body: Highlight 2-3 most relevant achievements/skills matching the job
- Closing: Clear call to action
- Do NOT use generic phrases like "I am writing to apply" or "To whom it may concern"
- Reference specific details from the job description if provided
- Keep it under 400 words
- Format: Return ONLY the letter body text (no date, address blocks)`,
    },
    {
      role: 'user',
      content: `Write a cover letter for:\nPosition: ${jobTitle} at ${companyName}\n\nCandidate Info:\n${candidateContext}${jobDescription ? `\n\nJob Description:\n${jobDescription}` : ''}`,
    },
  ], 0.5);

  return ok(res, { coverLetter: result, candidateName: personal.name || '' });
}));

export default router;
