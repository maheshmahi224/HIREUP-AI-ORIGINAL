import crypto from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { database } from '../db/mongo.js';
import { env } from '../config/env.js';
import { ObjectId } from 'mongodb';

const router = Router();

/**
 * POST /api/webhook/razorpay
 *
 * Razorpay calls this endpoint after a payment event.
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
    const secret = env.RAZORPAY_WEBHOOK_SECRET;

    // If no secret configured, reject
    if (!secret) {
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    const receivedSignature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as Request & { rawBody: string }).rawBody;

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (
      !receivedSignature ||
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      )
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
    if (event.event === 'payment.captured') {
      const payment = (event.payload as {
        payment?: { entity?: { order_id?: string; id?: string; notes?: Record<string, string> } };
      }).payment?.entity;

      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (orderId) {
        try {
          const db = await database();
          const now = new Date();

          // Find the payment order to get the resumeId
          const paymentOrder = await db.collection('paymentOrders').findOne({ orderId });

          if (paymentOrder) {
            const resumeId = paymentOrder.resumeId as ObjectId;

            // Update resume payment state
            await db.collection('resumes').updateOne(
              { _id: resumeId },
              { $set: { paymentState: 'paid', updatedAt: now } }
            );

            // Log the payment
            await db.collection('payments').updateOne(
              { orderId },
              {
                $set: {
                  paymentId,
                  status: 'captured',
                  capturedAt: now,
                  updatedAt: now,
                },
                $setOnInsert: {
                  userId: paymentOrder.userId,
                  resumeId,
                  orderId,
                  amount: paymentOrder.amount,
                  currency: paymentOrder.currency,
                  createdAt: now,
                },
              },
              { upsert: true }
            );

            console.log(`[webhook] payment.captured: orderId=${orderId} resumeId=${resumeId}`);
          }
        } catch (err) {
          console.error('[webhook] DB error:', err);
          // Return 200 anyway to stop Razorpay retrying — log the error
        }
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  }
);

export default router;
