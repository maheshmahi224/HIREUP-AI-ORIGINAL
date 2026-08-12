import { Router } from 'express';
import { database } from '../db/mongo.js';
import { adminOnly, authenticate } from '../middleware/auth.js';
import { sendTicketResolvedEmail } from '../services/email.js';
import { asyncRoute, ok } from '../utils/http.js';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/metrics', asyncRoute(async (_req, res) => {
  const db = await database();
  const [users, resumes, payments, aiGenerations, downloads] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('resumes').countDocuments(),
    db.collection('payments').find({ status: 'verified' }).toArray(),
    db.collection('aiGenerations').countDocuments(),
    db.collection('resumes').countDocuments({ downloadCount: { $gt: 0 } }),
  ]);

  const revenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const conversion = resumes > 0 ? payments.length / resumes : 0;

  return ok(res, {
    users,
    resumes,
    paidResumes: payments.length,
    revenue,
    aiGenerations,
    downloads,
    conversion,
  });
}));

router.get('/users', asyncRoute(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const db = await database();
  const users = await db
    .collection('users')
    .find(q ? { $or: [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }] } : {}, {
      projection: { passwordHash: 0, otpCodeHash: 0 },
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return ok(res, { users });
}));

router.get('/resumes', asyncRoute(async (_req, res) => {
  const db = await database();
  const resumes = await db
    .collection('resumes')
    .find({}, { projection: { content: 0 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();

  return ok(res, { resumes });
}));

router.get('/payments', asyncRoute(async (_req, res) => {
  const db = await database();
  const payments = await db
    .collection('payments')
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return ok(res, { payments });
}));

router.get('/ai-analytics', asyncRoute(async (_req, res) => {
  const db = await database();
  const recentLogs = await db
    .collection('aiGenerations')
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const totalGenerations = recentLogs.length;
  const avgInputLen = totalGenerations > 0 ? Math.round(recentLogs.reduce((acc, item) => acc + (item.rawInputLength || 0), 0) / totalGenerations) : 0;
  // Estimated cost ~$0.001 per extraction call
  const estimatedCost = (totalGenerations * 0.001).toFixed(3);

  return ok(res, {
    totalGenerations,
    avgInputLen,
    estimatedCostUsd: estimatedCost,
    logs: recentLogs,
  });
}));

router.get('/support-tickets', asyncRoute(async (_req, res) => {
  const db = await database();
  const tickets = await db
    .collection('supportTickets')
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return ok(res, { tickets });
}));

router.patch('/support-tickets/:ticketId', asyncRoute(async (req, res) => {
  const { ticketId } = req.params;
  const { status, adminNotes } = req.body;

  const db = await database();
  const updateFields: Record<string, any> = { updatedAt: new Date() };
  if (status) updateFields.status = status;
  if (typeof adminNotes === 'string') updateFields.adminNotes = adminNotes;

  await db.collection('supportTickets').updateOne({ ticketId }, { $set: updateFields });
  const updated = await db.collection('supportTickets').findOne({ ticketId });

  if (updated && status === 'resolved') {
    const notes = typeof adminNotes === 'string' ? adminNotes : typeof updated.adminNotes === 'string' ? updated.adminNotes : undefined;
    sendTicketResolvedEmail(
      String(updated.userEmail),
      String(updated.userName || 'User'),
      String(ticketId),
      String(updated.subject || 'Support Request'),
      notes
    ).catch((err) => console.error('[Admin] Failed to send ticket resolution email:', err));
  }

  return ok(res, { ticket: updated });
}));

export default router;
