import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../db/mongo.js';
import { authenticate, csrf } from '../middleware/auth.js';
import type { Resume } from '../types/domain.js';
import { resumePatchSchema, resumeSchema } from '../validators/schemas.js';
import { asyncRoute, fail, getValidated, ok, validate } from '../utils/http.js';
import { computeResumeContentHash, recordResumeVersion, checkContentEntitlement } from '../services/entitlement.js';

const router = Router();
router.use(authenticate);

const id = (v: string | string[]) => (typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : undefined);

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const resumes = await (await database())
      .collection<Resume>('resumes')
      .find({ userId: req.auth!.user._id }, { projection: { content: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    return ok(res, { resumes });
  })
);

router.post(
  '/',
  csrf,
  validate(resumeSchema),
  asyncRoute(async (req, res) => {
    const input = getValidated<typeof resumeSchema._output>(req);
    const now = new Date();
    const doc: Resume = {
      userId: req.auth!.user._id,
      ...input,
      paymentState: 'unpaid',
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const db = await database();
    const result = await db.collection<Resume>('resumes').insertOne(doc);
    const createdId = result.insertedId;

    // Record initial version
    await recordResumeVersion(req.auth!.user._id, createdId, doc.templateId, doc.content);

    return ok(res, { resume: { ...doc, _id: createdId } }, 201);
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const resumeId = id(req.params.id);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
    const db = await database();
    const resume = await db.collection<Resume>('resumes').findOne({ _id: resumeId, userId: req.auth!.user._id });
    if (!resume) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const contentHash = computeResumeContentHash(resume.templateId, resume.content);
    const isPaidState = await checkContentEntitlement(req.auth!.user._id, resumeId, contentHash);

    return ok(res, {
      resume: {
        ...resume,
        currentContentHash: contentHash,
        isCurrentStatePaid: isPaidState,
      },
    });
  })
);

router.patch(
  '/:id',
  csrf,
  validate(resumePatchSchema),
  asyncRoute(async (req, res) => {
    const resumeId = id(req.params.id);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
    const patch = getValidated<typeof resumePatchSchema._output>(req);
    const db = await database();

    const current = await db.collection<Resume>('resumes').findOne({ _id: resumeId, userId: req.auth!.user._id });
    if (!current) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const updatedTemplateId = patch.templateId || current.templateId;
    const updatedContent = patch.content || current.content;

    // Record new version if changed
    const versionRecord = await recordResumeVersion(req.auth!.user._id, resumeId, updatedTemplateId, updatedContent);

    await db.collection<Resume>('resumes').updateOne(
      { _id: resumeId, userId: req.auth!.user._id },
      { $set: { ...patch, updatedAt: new Date() } }
    );

    const resume = await db.collection<Resume>('resumes').findOne({ _id: resumeId, userId: req.auth!.user._id });
    const isPaidState = await checkContentEntitlement(req.auth!.user._id, resumeId, versionRecord.contentHash);

    return ok(res, {
      resume: {
        ...resume!,
        currentContentHash: versionRecord.contentHash,
        versionNumber: versionRecord.versionNumber,
        isCurrentStatePaid: isPaidState,
      },
    });
  })
);

router.post(
  '/:id/duplicate',
  csrf,
  asyncRoute(async (req, res) => {
    const resumeId = id(req.params.id);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
    const db = await database();
    const source = await db.collection<Resume>('resumes').findOne({ _id: resumeId, userId: req.auth!.user._id });
    if (!source) return fail(res, 404, 'NOT_FOUND', 'Resume not found');

    const { _id, ...copy } = source;
    const now = new Date();
    const result = await db.collection<Resume>('resumes').insertOne({
      ...copy,
      title: `${source.title} (copy)`,
      paymentState: 'unpaid',
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const newId = result.insertedId;
    await recordResumeVersion(req.auth!.user._id, newId, copy.templateId, copy.content);

    return ok(res, { resume: { ...copy, _id: newId } }, 201);
  })
);

router.delete(
  '/:id',
  csrf,
  asyncRoute(async (req, res) => {
    const resumeId = id(req.params.id);
    if (!resumeId) return fail(res, 404, 'NOT_FOUND', 'Resume not found');
    const result = await (await database()).collection<Resume>('resumes').deleteOne({ _id: resumeId, userId: req.auth!.user._id });
    return result.deletedCount ? res.status(204).end() : fail(res, 404, 'NOT_FOUND', 'Resume not found');
  })
);

export default router;
