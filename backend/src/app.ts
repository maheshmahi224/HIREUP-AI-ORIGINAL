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
import paymentRoutes from './routes/payment.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import { errorHandler, ok } from './utils/http.js';

const require = createRequire(import.meta.url);
const helmet = require('helmet') as (options?: Record<string, unknown>) => RequestHandler;
const { rateLimit } = require('express-rate-limit') as {
  rateLimit: (options?: Record<string, unknown>) => RequestHandler;
};

export const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: [env.FRONTEND_ORIGIN, env.ADMIN_ORIGIN].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api', rateLimit({ windowMs: 15 * 60000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => ok(res, { status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRoutes);

app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
