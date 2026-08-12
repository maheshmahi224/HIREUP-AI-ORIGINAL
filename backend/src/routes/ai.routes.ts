import { Router } from 'express';
import { database } from '../db/mongo.js';
import { authenticate, csrf } from '../middleware/auth.js';
import { extractResumeDataWithAI } from '../services/ai.js';
import { asyncRoute, fail, ok } from '../utils/http.js';
import { z } from 'zod';
import { validate, getValidated } from '../utils/http.js';

const router = Router();
router.use(authenticate);

const extractSchema = z.object({
  rawInput: z.string().trim().min(10, 'Input must be at least 10 characters long').max(10000, 'Input exceeds maximum length'),
});

router.post('/extract', csrf, validate(extractSchema), asyncRoute(async (req, res) => {
  const { rawInput } = getValidated<typeof extractSchema._output>(req);
  const userId = req.auth!.user._id;

  const db = await database();
  
  // Rate limit AI generations (e.g. max 10 per hour per user)
  const oneHourAgo = new Date(Date.now() - 3600000);
  const recentCount = await db.collection('aiGenerations').countDocuments({
    userId,
    createdAt: { $gt: oneHourAgo },
  });

  if (recentCount >= 20) {
    return fail(res, 429, 'AI_RATE_LIMIT', 'AI extraction rate limit exceeded. Please wait a bit before trying again.');
  }

  const extracted = await extractResumeDataWithAI(rawInput);

  // Store usage telemetry safely without blocking response
  try {
    await db.collection('aiGenerations').insertOne({
      userId,
      rawInputLength: rawInput.length,
      missingFieldsCount: extracted.missingFields.length,
      extractedSections: Object.keys(extracted).filter(k => k !== 'missingFields'),
      createdAt: new Date(),
    });
  } catch (telemetryErr) {
    console.error('[AI Router] Telemetry write warning:', telemetryErr);
  }

  return ok(res, { extracted });
}));

export default router;
