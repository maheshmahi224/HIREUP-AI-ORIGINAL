export const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

let csrf = '';
export const setCsrf = (token: string) => {
  csrf = token;
};
export const getCsrf = () => csrf;

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) return undefined as unknown as T;

  const body = (await response.json().catch(() => null)) as { data?: T; error?: { message: string } } | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }

  return body?.data as T;
}

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
  csrfToken: string;
}

export interface Resume {
  _id: string;
  title: string;
  templateId: string;
  content: Record<string, unknown>;
  paymentState: 'paid' | 'unpaid';
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  personal: {
    name?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  sections: {
    education?: Array<Record<string, string>>;
    experience?: Array<Record<string, unknown>>;
    internships?: Array<Record<string, unknown>>;
    projects?: Array<Record<string, unknown>>;
    skills?: string[];
    certifications?: Array<Record<string, string>>;
    achievements?: string[];
    awards?: Array<Record<string, string>>;
    languages?: string[];
    custom?: Array<Record<string, unknown>>;
  };
}

export interface ExtractedData {
  personal: Record<string, string>;
  summary: string;
  education: Array<Record<string, string>>;
  experience: Array<Record<string, unknown>>;
  internships: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  skills: string[];
  certifications: string[];
  achievements: string[];
  awards: string[];
  languages: string[];
  missingFields: string[];
}

export interface PaymentOrderInfo {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  alreadyPaid?: boolean;
}
