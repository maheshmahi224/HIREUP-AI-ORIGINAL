import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { database } from '../db/mongo.js';
import { authenticate, csrf } from '../middleware/auth.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';
import type { Resume } from '../types/domain.js';
import { asyncRoute, fail, getValidated, ok, validate } from '../utils/http.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticate);

const parseId = (v: string | string[] | undefined) => (typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : undefined);

const createOrderSchema = z.object({
  resumeId: z.string().min(1),
});

const verifyOrderSchema = z.object({
  resumeId: z.string().min(1),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().default(''),
});

router.post('/create-order', csrf, validate(createOrderSchema), asyncRoute(async (req, res) => {
  const { resumeId: rawId } = getValidated<typeof createOrderSchema._output>(req);
  const resumeId = parseId(rawId);
  if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  const db = await database();
  const resume = await db.collection<Resume>('resumes').findOne({
    _id: resumeId,
    userId: req.auth!.user._id,
  });

  if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
  if (resume.paymentState === 'paid') {
    return ok(res, { alreadyPaid: true, message: 'Payment already unlocked for this resume.' });
  }

  const order = await createRazorpayOrder(3000); // ₹30 = 3000 paise

  await db.collection('paymentOrders').insertOne({
    userId: req.auth!.user._id,
    resumeId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: 'created',
    createdAt: new Date(),
  });

  return ok(res, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  });
}));

router.post('/verify', csrf, validate(verifyOrderSchema), asyncRoute(async (req, res) => {
  const { resumeId: rawId, orderId, paymentId, signature } = getValidated<typeof verifyOrderSchema._output>(req);
  const resumeId = parseId(rawId);
  if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  const db = await database();
  const resume = await db.collection<Resume>('resumes').findOne({
    _id: resumeId,
    userId: req.auth!.user._id,
  });

  if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  if (resume.paymentState === 'paid') {
    return ok(res, { verified: true, paymentState: 'paid' });
  }

  const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
  if (!isValid) {
    return fail(res, 400, 'PAYMENT_VERIFICATION_FAILED', 'Invalid payment signature');
  }

  const now = new Date();

  // Store payment log
  await db.collection('payments').updateOne(
    { orderId },
    {
      $set: {
        userId: req.auth!.user._id,
        resumeId,
        orderId,
        paymentId,
        amount: 3000,
        currency: 'INR',
        status: 'verified',
        verifiedAt: now,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  // Update resume payment status
  await db.collection<Resume>('resumes').updateOne(
    { _id: resumeId, userId: req.auth!.user._id },
    { $set: { paymentState: 'paid', updatedAt: now } }
  );

  return ok(res, { verified: true, paymentState: 'paid' });
}));

router.get('/status/:resumeId', asyncRoute(async (req, res) => {
  const resumeId = parseId(req.params.resumeId);
  if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

  const db = await database();
  const resume = await db.collection<Resume>('resumes').findOne({
    _id: resumeId,
    userId: req.auth!.user._id,
  });

  if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
  return ok(res, { paymentState: resume.paymentState });
}));

export default router;
