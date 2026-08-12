import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { database } from '../db/mongo.js';
import { authenticate, csrf } from '../middleware/auth.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';
import {
  computeResumeContentHash,
  recordResumeVersion,
  verifyAndCreateEntitlement,
  checkContentEntitlement,
  authorizeDownloadAndAudit,
} from '../services/entitlement.js';
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

const checkEntitlementSchema = z.object({
  resumeId: z.string().min(1),
});

/**
 * POST /api/payments/create-order
 * Recalculates server-side contentHash and verifies if current content state is already paid.
 */
router.post(
  '/create-order',
  csrf,
  validate(createOrderSchema),
  asyncRoute(async (req, res) => {
    const { resumeId: rawId } = getValidated<typeof createOrderSchema._output>(req);
    const resumeId = parseId(rawId);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const db = await database();
    const resume = await db.collection<Resume>('resumes').findOne({
      _id: resumeId,
      userId: req.auth!.user._id,
    });

    if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    // Calculate server-side contentHash for current downloadable state
    const versionRecord = await recordResumeVersion(
      req.auth!.user._id,
      resumeId,
      resume.templateId,
      resume.content
    );
    const contentHash = versionRecord.contentHash;

    // Check if matching verified entitlement already exists
    const isAlreadyPaid = await checkContentEntitlement(req.auth!.user._id, resumeId, contentHash);
    if (isAlreadyPaid) {
      return ok(res, {
        alreadyPaid: true,
        contentHash,
        message: 'Current resume state is already paid and unlocked.',
      });
    }

    const order = await createRazorpayOrder(3000); // ₹30 = 3000 paise

    await db.collection('paymentOrders').insertOne({
      userId: req.auth!.user._id,
      resumeId,
      contentHash,
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
      contentHash,
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_SuBwQRESP6b8SB',
    });
  })
);

/**
 * POST /api/payments/verify
 * Verifies Razorpay signature and creates immutable entitlement tied to (userId, resumeId, contentHash).
 */
router.post(
  '/verify',
  csrf,
  validate(verifyOrderSchema),
  asyncRoute(async (req, res) => {
    const { resumeId: rawId, orderId, paymentId, signature } = getValidated<typeof verifyOrderSchema._output>(req);
    const resumeId = parseId(rawId);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const db = await database();
    const resume = await db.collection<Resume>('resumes').findOne({
      _id: resumeId,
      userId: req.auth!.user._id,
    });

    if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    // Find the order document to retrieve the bound contentHash
    const orderDoc = await db.collection('paymentOrders').findOne({ orderId });
    const contentHash = orderDoc?.contentHash || computeResumeContentHash(resume.templateId, resume.content);

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValid) {
      return fail(res, 400, 'PAYMENT_VERIFICATION_FAILED', 'Invalid payment signature');
    }

    // Create immutable payment entitlement
    const entitlement = await verifyAndCreateEntitlement({
      userId: req.auth!.user._id,
      resumeId,
      contentHash,
      amount: 3000,
      currency: 'INR',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    });

    // Update payment order status
    await db.collection('paymentOrders').updateOne(
      { orderId },
      { $set: { status: 'verified', updatedAt: new Date() } }
    );

    return ok(res, {
      verified: true,
      contentHash,
      entitlementId: entitlement.entitlementId,
    });
  })
);

/**
 * POST /api/payments/check-entitlement
 * Checks if current server-side resume state has a verified payment entitlement.
 */
router.post(
  '/check-entitlement',
  validate(checkEntitlementSchema),
  asyncRoute(async (req, res) => {
    const { resumeId: rawId } = getValidated<typeof checkEntitlementSchema._output>(req);
    const resumeId = parseId(rawId);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const db = await database();
    const resume = await db.collection<Resume>('resumes').findOne({
      _id: resumeId,
      userId: req.auth!.user._id,
    });

    if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const contentHash = computeResumeContentHash(resume.templateId, resume.content);
    const isPaid = await checkContentEntitlement(req.auth!.user._id, resumeId, contentHash);

    return ok(res, {
      resumeId,
      contentHash,
      isCurrentStatePaid: isPaid,
    });
  })
);

/**
 * POST /api/payments/authorize-download
 * Server-side authorization check before PDF download. Returns 402 if unpaid.
 */
router.post(
  '/authorize-download',
  csrf,
  validate(checkEntitlementSchema),
  asyncRoute(async (req, res) => {
    const { resumeId: rawId } = getValidated<typeof checkEntitlementSchema._output>(req);
    const resumeId = parseId(rawId);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const db = await database();
    const resume = await db.collection<Resume>('resumes').findOne({
      _id: resumeId,
      userId: req.auth!.user._id,
    });

    if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const result = await authorizeDownloadAndAudit(
      req.auth!.user._id,
      resumeId,
      resume.templateId,
      resume.content
    );

    if (!result.authorized) {
      return fail(
        res,
        402,
        'PAYMENT_REQUIRED',
        'Download required: This resume content state has not been purchased yet.'
      );
    }

    return ok(res, {
      authorized: true,
      contentHash: result.contentHash,
    });
  })
);

export default router;
