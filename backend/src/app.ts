import { createRequire } from 'node:module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import { env } from './config/env.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import aiRoutes from './routes/ai.routes.js';
import aiToolsRoutes from './routes/ai-tools.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import supportRoutes from './routes/support.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import { errorHandler, ok } from './utils/http.js';

const require = createRequire(import.meta.url);
const helmet = require('helmet') as (options?: Record<string, unknown>) => RequestHandler;
const { rateLimit } = require('express-rate-limit') as {
  rateLimit: (options?: Record<string, unknown>) => RequestHandler;
};

export const app = express();

// Always include known production origins as hard fallbacks
// so CORS works even if Vercel env vars are misconfigured
const ALLOWED_ORIGINS: string[] = [
  'https://hireup-ai-original-frontend.vercel.app',
  'https://hireup-ai-original-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];
if (env.FRONTEND_ORIGIN && !ALLOWED_ORIGINS.includes(env.FRONTEND_ORIGIN)) {
  ALLOWED_ORIGINS.push(env.FRONTEND_ORIGIN);
}
if (env.ADMIN_ORIGIN && !ALLOWED_ORIGINS.includes(env.ADMIN_ORIGIN)) {
  ALLOWED_ORIGINS.push(env.ADMIN_ORIGIN);
}

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Explicit OPTIONS handler so Vercel serverless does not drop preflight
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 204,
}));
// Webhook route MUST be before express.json() — raw body needed for HMAC verification
app.use('/api/webhook', webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api', rateLimit({ windowMs: 15 * 60000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => ok(res, { status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRoutes);

app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-tools', aiToolsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
