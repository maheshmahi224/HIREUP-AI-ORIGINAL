import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createRazorpayOrder(amountPaise: number = 3000): Promise<RazorpayOrderResponse> {
  const keyId = env.RAZORPAY_KEY_ID || 'rzp_test_SuBwQRESP6b8SB';
  const keySecret = env.RAZORPAY_KEY_SECRET || 'mDroYpB5BAjN2hJSM3LQTDi0';

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  return await res.json() as RazorpayOrderResponse;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = env.RAZORPAY_KEY_SECRET || 'mDroYpB5BAjN2hJSM3LQTDi0';
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
  return expected === signature;
}
