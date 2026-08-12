import { Router } from 'express';
import type { Request, Response } from 'express';
import { database } from '../db/mongo.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { asyncRoute, ok } from '../utils/http.js';
import { ObjectId } from 'mongodb';

const router = Router();

// Simple ticket ID generator (e.g. TICK-92841)
function generateTicketId() {
  return `TICK-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * POST /api/support/chat
 * Groq Llama 3.3 70B Powered Support Assistant
 * Interacts with orders, resume details, and captures support tickets for Admin Panel.
 */
router.post(
  '/chat',
  asyncRoute(async (req: Request, res: Response) => {
    const { message, history = [], email: inputEmail, name: inputName } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const userId = (req as any).user?.id || (req as any).user?._id;
    const userEmail = (req as any).user?.email || inputEmail || 'guest@hireup.ai';
    const userName = (req as any).user?.name || inputName || 'User';

    const db = await database();
    const now = new Date();

    // Fetch user's orders & resumes for context
    let userOrders: any[] = [];
    let userResumes: any[] = [];

    try {
      if (userId) {
        [userOrders, userResumes] = await Promise.all([
          db.collection('paymentOrders').find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).limit(5).toArray(),
          db.collection('resumes').find({ userId: new ObjectId(userId) }, { projection: { title: 1, templateId: 1, paymentState: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(5).toArray(),
        ]);
      }
    } catch {
      // Non-blocking context fetch
    }

    // Build context summary for AI
    const ordersSummary = userOrders.length
      ? userOrders.map((o) => `Order ID: ${o.orderId}, ResumeId: ${o.resumeId}, Amount: ₹${o.amount / 100}, Status: ${o.status}`).join('\n')
      : 'No recent orders found.';

    const resumesSummary = userResumes.length
      ? userResumes.map((r) => `Resume: "${r.title}", ID: ${r._id}, Template: ${r.templateId}, Payment: ${r.paymentState}`).join('\n')
      : 'No resumes created yet.';

    const systemPrompt = `You are HireUp AI's official 24/7 Smart Customer Support Assistant.
Your goal is to provide warm, clear, and accurate help for the HireUp AI Resume Builder platform.

USER CONTEXT:
Name: ${userName}
Email: ${userEmail}

USER'S RECENT ORDERS:
${ordersSummary}

USER'S RECENT RESUMES:
${resumesSummary}

PLATFORM KNOWLEDGE BASE:
1. Pricing: Standard high-res A4 PDF export is ₹30 per resume. Payment is processed securely via Razorpay.
2. PDF Download Flow: Once ₹30 payment is completed and verified, click "Download PDF" in the Editor toolbar for instant 300 DPI A4 PDF export.
3. AI Extraction: Upload any existing PDF/DOCX or raw text in Dashboard -> AI Import. Powered by Groq Llama 3.3 70B & Gemini 1.5 Flash.
4. Support Policy: If payment succeeded but download is locked, or if a user requests a refund or reports a bug, assure them that an official Support Ticket is being logged directly with our Admin Support Team.

CRITICAL INSTRUCTIONS:
- If the user asks about order status, inspect USER'S RECENT ORDERS above and answer precisely.
- If the user reports an issue (e.g. payment failed, download locked, refund request, bug, complaint, or human agent request), include the exact token "[CREATE_TICKET: Brief Subject Here]" anywhere in your response so our system automatically logs a ticket for Admin review!
- Keep responses friendly, helpful, concise (2-4 sentences max), and professional.`;

    const groqKey = env.GROQ_API_KEY;
    let aiResponseText = '';
    let ticketCreated: any = null;

    if (groqKey) {
      try {
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((h: any) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
          { role: 'user', content: message },
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.4,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          aiResponseText = json.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('[Support AI] Groq API call error:', err);
      }
    }

    // Heuristic Fallback if AI key missing or failed
    if (!aiResponseText) {
      const lower = message.toLowerCase();
      if (lower.includes('payment') || lower.includes('paid') || lower.includes('order') || lower.includes('price')) {
        aiResponseText = `PDF exports are ₹30 per resume via Razorpay. ${ordersSummary !== 'No recent orders found.' ? `Your latest order status: ${ordersSummary}` : 'No recent payment orders found under your account.'}`;
      } else if (lower.includes('refund') || lower.includes('issue') || lower.includes('bug') || lower.includes('lock') || lower.includes('help')) {
        aiResponseText = `I have logged your request directly with our Admin Support Team. [CREATE_TICKET: Support Issue Reported] An admin will review your case shortly!`;
      } else {
        aiResponseText = `Hello ${userName}! How can I help you with your resume, payment orders, or PDF downloads today?`;
      }
    }

    // Check if AI requested creating a ticket or if message contains issue keywords
    const ticketMatch = aiResponseText.match(/\[CREATE_TICKET:\s*(.*?)\]/i);
    const isIssueKeyword = /refund|failed|error|bug|broken|not working|locked|human|admin/i.test(message);

    if (ticketMatch || isIssueKeyword) {
      const subject = ticketMatch?.[1] || 'User Support Issue';
      // Clean up token from display text
      aiResponseText = aiResponseText.replace(/\[CREATE_TICKET:\s*.*?\]/gi, '').trim();

      const ticketId = generateTicketId();
      const ticketDoc = {
        ticketId,
        userId: userId ? new ObjectId(userId) : null,
        userEmail,
        userName,
        subject,
        message,
        aiResponse: aiResponseText,
        status: 'open',
        adminNotes: '',
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('supportTickets').insertOne(ticketDoc);
      ticketCreated = { ticketId, subject, status: 'open' };

      console.log(`[Support] Ticket created: ${ticketId} for ${userEmail}`);
    }

    return ok(res, {
      response: aiResponseText,
      ticketCreated,
      orders: userOrders,
    });
  })
);

/**
 * GET /api/support/tickets
 * Get user's submitted support tickets
 */
router.get(
  '/tickets',
  asyncRoute(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const userEmail = (req as any).user?.email;

    const db = await database();
    const filter = userId
      ? { $or: [{ userId: new ObjectId(userId) }, { userEmail }] }
      : userEmail
      ? { userEmail }
      : { ticketId: 'none' };

    const tickets = await db
      .collection('supportTickets')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return ok(res, { tickets });
  })
);

/**
 * POST /api/support/tickets
 * Manual support ticket submission
 */
router.post(
  '/tickets',
  asyncRoute(async (req: Request, res: Response) => {
    const { subject, message, email: inputEmail, name: inputName } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required' });
      return;
    }

    const userId = (req as any).user?.id || (req as any).user?._id;
    const userEmail = (req as any).user?.email || inputEmail || 'guest@hireup.ai';
    const userName = (req as any).user?.name || inputName || 'User';

    const db = await database();
    const now = new Date();
    const ticketId = generateTicketId();

    const ticketDoc = {
      ticketId,
      userId: userId ? new ObjectId(userId) : null,
      userEmail,
      userName,
      subject,
      message,
      aiResponse: 'Ticket submitted directly by user.',
      status: 'open',
      adminNotes: '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('supportTickets').insertOne(ticketDoc);

    return ok(res, { ticket: ticketDoc });
  })
);

export default router;
