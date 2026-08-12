import crypto from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { database } from '../db/mongo.js';
import { env } from '../config/env.js';
import { ObjectId } from 'mongodb';
import { verifyAndCreateEntitlement } from '../services/entitlement.js';

const router = Router();

/**
 * POST /api/webhook/razorpay
 *
 * Razorpay calls this endpoint after a payment event.
 * Target URL: https://hireup-ai-original-backend-nine.vercel.app/api/webhook/razorpay
 * Must be registered BEFORE express.json() so we get the raw body
 * for HMAC signature verification.
 */
router.post(
  '/razorpay',
  // Parse raw body for signature verification
  (req: Request, res: Response, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { data += chunk; });
    req.on('end', () => {
      (req as Request & { rawBody: string }).rawBody = data;
      next();
    });
  },
  async (req: Request, res: Response) => {
    const secret = env.RAZORPAY_WEBHOOK_SECRET || 'hireupai_webhook_secret_2024';

    const receivedSignature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = (req as Request & { rawBody: string }).rawBody || '';

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(receivedSignature, 'utf8');

    if (
      !receivedSignature ||
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    let event: { event: string; payload: Record<string, unknown> };
    try {
      event = JSON.parse(rawBody);
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    // Handle payment captured event
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = (event.payload as {
        payment?: { entity?: { order_id?: string; id?: string; notes?: Record<string, string> } };
        order?: { entity?: { id?: string } };
      }).payment?.entity || (event.payload as any).order?.entity;

      const orderId = payment?.order_id || payment?.id;
      const paymentId = payment?.id;

      if (orderId) {
        try {
          const db = await database();
          const now = new Date();

          // Find the payment order to get the resumeId
          const paymentOrder = await db.collection('paymentOrders').findOne({ orderId });

          if (paymentOrder) {
            const resumeId = paymentOrder.resumeId as ObjectId;
            const userId = paymentOrder.userId as ObjectId;
            const contentHash = paymentOrder.contentHash;

            if (contentHash) {
              await verifyAndCreateEntitlement({
                userId,
                resumeId,
                contentHash,
                amount: paymentOrder.amount || 3000,
                currency: paymentOrder.currency || 'INR',
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId || orderId,
              });
            }

            console.log(`[webhook] payment.captured: orderId=${orderId} resumeId=${resumeId} contentHash=${contentHash}`);
          }
        } catch (err) {
          console.error('[webhook] DB error:', err);
        }
      }
    }

    // Always return 200 to acknowledge receipt to Razorpay
    res.status(200).json({ received: true });
  }
);

export default router;
