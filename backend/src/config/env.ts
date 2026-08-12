import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8787), MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().default('hireupai'), FRONTEND_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url().optional(), SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  GOOGLE_CLIENT_ID: z.string().optional(), GOOGLE_CLIENT_SECRET: z.string().optional(), GOOGLE_REDIRECT_URI: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(), EMAIL_FROM: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(), LLM_API_KEY: z.string().optional(), LLM_BASE_URL: z.string().url().optional(), LLM_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(), GROQ_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(), RAZORPAY_KEY_SECRET: z.string().optional(), RAZORPAY_WEBHOOK_SECRET: z.string().optional()
});
export const env = schema.parse(process.env);
