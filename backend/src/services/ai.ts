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

const SYSTEM_PROMPT = `You are a precision AI resume parser for HireUp.AI.
Analyze the user's messy text input and extract structured resume fields into valid JSON.

NON-NEGOTIABLE RULES:
1. ONLY extract information that is explicitly stated or strongly implied by the input text.
2. DO NOT invent, hallucinate, or extrapolate company names, dates, degrees, gpa, metrics, skills, or achievements.
3. If information for a standard resume section (like dates, metrics, phone number, location, or project descriptions) is missing from the input, record what is missing in the "missingFields" string array (e.g., "Missing graduation year for B.Tech degree", "Missing phone number").
4. Return ONLY valid JSON matching this exact structure:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
  "summary": "",
  "education": [ { "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "gpa": "", "location": "" } ],
  "experience": [ { "company": "", "role": "", "startDate": "", "endDate": "", "location": "", "highlights": [""] } ],
  "internships": [ { "company": "", "role": "", "startDate": "", "endDate": "", "highlights": [""] } ],
  "projects": [ { "name": "", "description": "", "technologies": [""] } ],
  "skills": [""],
  "certifications": [""],
  "achievements": [""],
  "awards": [""],
  "languages": [""],
  "missingFields": [""]
}`;

export async function extractResumeDataWithAI(rawInput: string): Promise<ExtractedResumeData> {
  if (!env.OPENAI_API_KEY) {
    return heuristicFallbackExtraction(rawInput);
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawInput },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI API Error:', errText);
      return heuristicFallbackExtraction(rawInput);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return heuristicFallbackExtraction(rawInput);
    }

    const parsed = JSON.parse(content) as ExtractedResumeData;
    return sanitizeExtractedData(parsed);
  } catch (err) {
    console.error('Extraction error:', err);
    return heuristicFallbackExtraction(rawInput);
  }
}

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
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    awards: Array.isArray(data.awards) ? data.awards : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
  };
}

function heuristicFallbackExtraction(text: string): ExtractedResumeData {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

  const missing: string[] = [];
  if (!emailMatch) missing.push('Contact email address missing');
  if (!phoneMatch) missing.push('Phone number missing');
  if (!linkedinMatch && !githubMatch) missing.push('Social / GitHub profiles missing');

  const knownSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB', 'Figma', 'HTML', 'CSS', 'Git', 'AWS', 'Docker'];
  const extractedSkills = knownSkills.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(text));

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const possibleName = lines[0] && !lines[0].includes('@') && lines[0].length < 40 ? lines[0] : '';

  return {
    personal: {
      name: possibleName,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
      github: githubMatch ? `https://${githubMatch[0]}` : '',
      website: '',
    },
    summary: text.length > 0 ? (text.length > 200 ? text.slice(0, 200) + '...' : text) : '',
    education: [],
    experience: [],
    internships: [],
    projects: [],
    skills: extractedSkills,
    certifications: [],
    achievements: [],
    awards: [],
    languages: [],
    missingFields: missing,
  };
}
