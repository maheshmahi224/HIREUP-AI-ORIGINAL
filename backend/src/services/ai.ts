import { env } from '../config/env.js';

export interface ExtractedResumeData {
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    location?: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    highlights: string[];
  }>;
  internships: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  skills: string[];
  certifications: string[];
  achievements: string[];
  awards: string[];
  languages: string[];
  missingFields: string[];
}

// =============================================================================
// PREDEFINED SYSTEM PROMPT — HireUp AI Resume Intelligence Engine
// =============================================================================
const SYSTEM_PROMPT = `You are HireUp AI, an elite resume intelligence engine designed for Indian tech students and professionals.
Your job is to parse raw, unstructured career notes and output a perfectly structured JSON resume — ready for a professional ATS-optimized resume.

## YOUR CORE PRINCIPLES:
1. EXTRACT ONLY — Never fabricate, hallucinate, or embellish ANY data. Only extract what's clearly stated.
2. INFER SAFELY — You may infer role seniority (e.g., "intern" → internship), dates if clear from context, and split combined entries.
3. DETECT MISSING FIELDS — If a critical field is absent (email, phone, dates, location), flag it in "missingFields".
4. CLEAN & NORMALIZE — Format dates as "MM/YYYY" or "YYYY". Capitalize names and institutions properly.
5. SMART SKILLS — For Indian tech context, recognize abbreviations: MERN, MEAN, DSA, CP, OOP, OS, DBMS, ML/DL, Gen AI, LLM.
6. SEPARATE EXPERIENCE & INTERNSHIPS — Full-time jobs go in "experience", internships/traineeships in "internships".

## OUTPUT FORMAT — Return ONLY valid JSON, nothing else:
{
  "personal": {
    "name": "Full Name",
    "email": "email@domain.com",
    "phone": "+91-XXXXXXXXXX",
    "location": "City, State, Country",
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username",
    "website": "https://portfolio.com"
  },
  "summary": "2-3 line professional summary written in third person, highlighting role, key skills, and career goals. Write this if enough info is available.",
  "education": [
    {
      "institution": "Institution Name",
      "degree": "B.Tech / B.E. / M.Tech / BCA / MCA / B.Sc / MBA etc.",
      "fieldOfStudy": "Computer Science / Electronics / etc.",
      "startDate": "08/2021",
      "endDate": "05/2025",
      "gpa": "8.5 / 10",
      "location": "City, State"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "10/2024",
      "endDate": "Present",
      "location": "City / Remote",
      "highlights": [
        "Built X feature using Y technology, resulting in Z outcome",
        "Led team of N engineers to deliver X on time"
      ]
    }
  ],
  "internships": [
    {
      "company": "Company Name",
      "role": "Intern Title",
      "startDate": "06/2023",
      "endDate": "08/2023",
      "highlights": [
        "Developed X feature using Y, improving Z by N%"
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Clear 1-2 sentence description of what it does and its impact.",
      "technologies": ["React", "Node.js", "MongoDB"],
      "link": "https://github.com/user/project"
    }
  ],
  "skills": ["React", "TypeScript", "Node.js", "Python", "MongoDB", "Git"],
  "certifications": ["AWS Certified Cloud Practitioner", "Google Data Analytics"],
  "achievements": ["AIR 1234 in GATE 2024", "Winner - HackIndia 2023"],
  "awards": ["Dean's List 2022", "Best Project Award"],
  "languages": ["English", "Hindi", "Telugu"],
  "missingFields": ["Phone number not provided", "Graduation year missing for B.Tech"]
}

## CRITICAL RULES:
- Return ONLY the JSON object. No markdown, no code fences, no explanations.
- If a section has no data, use an empty array [] or empty string "".
- For skills, extract ALL technical skills mentioned: languages, frameworks, tools, platforms, databases, cloud, etc.
- For projects, write a descriptive 1-2 sentence description if the user only gave the project name — based only on what's implied.
- Always generate a "summary" if enough information is available (name, field, skills, and at least one experience/project).
- Phone numbers should be normalized to +91-XXXXXXXXXX format for Indian numbers.`;

// =============================================================================
// GEMINI API INTEGRATION (Primary)
// =============================================================================
async function extractWithGemini(rawInput: string): Promise<ExtractedResumeData> {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n---\n\nHere is the user's raw career notes to parse:\n\n${rawInput}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Gemini] API error:', res.status, errBody);
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('[Gemini] Empty response:', JSON.stringify(data));
      throw new Error('Gemini returned empty response');
    }

    // Strip potential markdown fences if model wraps JSON anyway
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as ExtractedResumeData;
    return sanitizeExtractedData(parsed);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// =============================================================================
// OPENAI-COMPATIBLE FALLBACK (featherless.ai / openai)
// =============================================================================
async function extractWithOpenAICompat(rawInput: string): Promise<ExtractedResumeData> {
  const apiKey = env.LLM_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OpenAI-compatible API key');

  const baseUrl = (env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.LLM_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawInput },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[OpenAI-compat] API error:', errText);
      throw new Error(`LLM API error: ${res.status}`);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('LLM returned empty response');

    const parsed = JSON.parse(content) as ExtractedResumeData;
    return sanitizeExtractedData(parsed);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// =============================================================================
// MAIN ENTRY POINT — tries Gemini first, then OpenAI-compat, then heuristic
// =============================================================================
export async function extractResumeDataWithAI(rawInput: string): Promise<ExtractedResumeData> {
  // 1. Try Gemini (primary)
  if (env.GEMINI_API_KEY) {
    try {
      console.log('[AI] Using Gemini 1.5 Flash for extraction');
      return await extractWithGemini(rawInput);
    } catch (err) {
      console.error('[AI] Gemini failed, trying fallback:', err);
    }
  }

  // 2. Try OpenAI-compatible (secondary)
  if (env.LLM_API_KEY || env.OPENAI_API_KEY) {
    try {
      console.log('[AI] Using OpenAI-compat for extraction');
      return await extractWithOpenAICompat(rawInput);
    } catch (err) {
      console.error('[AI] OpenAI-compat failed, using heuristic fallback:', err);
    }
  }

  // 3. Heuristic fallback (always works, zero cost)
  console.log('[AI] No API keys configured, using heuristic fallback');
  return heuristicFallbackExtraction(rawInput);
}

// =============================================================================
// SANITIZE — ensure all fields are correctly typed
// =============================================================================
function sanitizeExtractedData(data: Partial<ExtractedResumeData>): ExtractedResumeData {
  return {
    personal: {
      name: data.personal?.name || '',
      email: data.personal?.email || '',
      phone: data.personal?.phone || '',
      location: data.personal?.location || '',
      linkedin: data.personal?.linkedin || '',
      github: data.personal?.github || '',
      website: data.personal?.website || '',
    },
    summary: data.summary || '',
    education: Array.isArray(data.education) ? data.education : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    internships: Array.isArray(data.internships) ? data.internships : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications.map(c => (typeof c === 'string' ? c : (c as any).name || '')) : [],
    achievements: Array.isArray(data.achievements) ? data.achievements.map(a => (typeof a === 'string' ? a : (a as any).title || '')) : [],
    awards: Array.isArray(data.awards) ? data.awards.map(a => (typeof a === 'string' ? a : (a as any).title || '')) : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
  };
}

// =============================================================================
// HEURISTIC FALLBACK — regex-based, zero cost, works without any API
// =============================================================================
function heuristicFallbackExtraction(text: string): ExtractedResumeData {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?91[-.\s]?)?[6-9]\d{9}/);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

  const missing: string[] = [];
  if (!emailMatch) missing.push('Contact email address missing');
  if (!phoneMatch) missing.push('Phone number missing');

  const techSkills = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'C', 'SQL',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Figma', 'HTML', 'CSS', 'Git', 'GitHub',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'FastAPI', 'Django', 'Flask',
    'Express', 'Next.js', 'Vue', 'Angular', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'MERN', 'MEAN', 'REST', 'GraphQL', 'Linux', 'Bash', 'Spring Boot', 'Rust', 'Go'];
  const foundSkills = techSkills.filter(s => new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i').test(text));

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l => !l.includes('@') && !l.match(/\d{10}/) && l.length < 50 && l.match(/^[A-Z][a-z]+ /));

  return {
    personal: {
      name: nameLine || '',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0] || '',
      location: '',
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
      github: githubMatch ? `https://${githubMatch[0]}` : '',
      website: '',
    },
    summary: '',
    education: [],
    experience: [],
    internships: [],
    projects: [],
    skills: foundSkills,
    certifications: [],
    achievements: [],
    awards: [],
    languages: [],
    missingFields: [...missing, 'AI extraction unavailable — using basic parsing. Add API key for full extraction.'],
  };
}
