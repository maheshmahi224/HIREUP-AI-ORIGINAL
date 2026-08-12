import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { database } from '../db/mongo.js';

type Data = Record<string, any>;

/**
 * Normalizes a data structure by recursively sorting object keys alphabetically.
 * Ensures identical data structures produce identical JSON string representations.
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    // Exclude null/undefined values or empty strings to ensure stable normalization
    const val = sortObjectKeys(obj[key]);
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Normalizes the complete downloadable resume representation.
 * Includes all data that materially affects the final PDF:
 * - templateId
 * - personal profile details (name, email, phone, location, jobTitle, photoUrl, linkedin, github, website)
 * - professional summary
 * - work experience (company, role, dates, location, description, highlights)
 * - education (institution, degree, fieldOfStudy, dates, gpa)
 * - projects (name, description, technologies, link)
 * - skills & languages
 * - awards & certifications
 * - customization settings (language, pageFormat, fontSize, font offsets, layout, colors)
 *
 * Excludes ephemeral UI state:
 * - sidebar collapsed state
 * - zoom level
 * - open/closed panel states
 * - active workspace tab
 */
export function normalizeResumeContent(templateId: string, content: Data): Data {
  const c = content || {};
  const personal = c.personal || {};
  const customization = c.customization || {};

  const cleanPersonal = {
    name: (personal.name || '').trim(),
    jobTitle: (personal.jobTitle || '').trim(),
    email: (personal.email || '').trim().toLowerCase(),
    phone: (personal.phone || '').trim(),
    location: (personal.location || '').trim(),
    photoUrl: (personal.photoUrl || '').trim(),
    linkedin: (personal.linkedin || '').trim(),
    github: (personal.github || '').trim(),
    website: (personal.website || '').trim(),
  };

  const cleanSummary = (c.summary || '').trim();

  const cleanList = (arr: any[], mapper: (item: any) => any) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(mapper).filter(Boolean);
  };

  const cleanExperience = cleanList(c.experience, (item) => ({
    company: (item?.company || '').trim(),
    role: (item?.role || item?.title || '').trim(),
    startDate: (item?.startDate || '').trim(),
    endDate: (item?.endDate || '').trim(),
    location: (item?.location || '').trim(),
    description: (item?.description || '').trim(),
    highlights: Array.isArray(item?.highlights)
      ? item.highlights.map((h: any) => (typeof h === 'string' ? h.trim() : '')).filter(Boolean)
      : Array.isArray(item?.bullets)
      ? item.bullets.map((b: any) => (typeof b === 'string' ? b.trim() : '')).filter(Boolean)
      : [],
  }));

  const cleanEducation = cleanList(c.education, (item) => ({
    institution: (item?.institution || '').trim(),
    degree: (item?.degree || '').trim(),
    fieldOfStudy: (item?.fieldOfStudy || '').trim(),
    startDate: (item?.startDate || '').trim(),
    endDate: (item?.endDate || '').trim(),
    gpa: (item?.gpa || '').trim(),
  }));

  const cleanProjects = cleanList(c.projects, (item) => ({
    name: (item?.name || item?.title || '').trim(),
    description: (item?.description || '').trim(),
    link: (item?.link || '').trim(),
    technologies: Array.isArray(item?.technologies)
      ? item.technologies.map((t: any) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
      : [],
  }));

  const cleanSkills = Array.isArray(c.skills)
    ? c.skills.map((s: any) => (typeof s === 'string' ? s.trim() : (s?.name || s?.title || '').trim())).filter(Boolean)
    : [];

  const cleanLanguages = Array.isArray(c.languages)
    ? c.languages.map((l: any) => (typeof l === 'string' ? l.trim() : (l?.name || l?.title || '').trim())).filter(Boolean)
    : [];

  const cleanAwards = cleanList(c.awards, (item) => ({
    title: (item?.title || item?.name || '').trim(),
    issuer: (item?.issuer || '').trim(),
    date: (item?.date || '').trim(),
  }));

  const cleanCertifications = cleanList(c.certifications, (item) => ({
    name: (item?.name || item?.title || '').trim(),
    issuer: (item?.issuer || '').trim(),
    date: (item?.date || '').trim(),
  }));

  const cleanCustomization = {
    language: customization.language || 'en-GB',
    pageFormat: customization.pageFormat || 'A4',
    fontSize: Number(customization.fontSize || 9),
    nameFontSizeOffset: Number(customization.nameFontSizeOffset ?? 14),
    headingFontSizeOffset: Number(customization.headingFontSizeOffset ?? 1),
    lineSpacing: Number(customization.lineSpacing ?? 1.15),
    sectionSpacing: Number(customization.sectionSpacing ?? 12),
    primaryColor: (customization.primaryColor || '#FF2D55').trim(),
  };

  const normalized = {
    templateId: (templateId || 'classic').trim().toLowerCase(),
    personal: cleanPersonal,
    summary: cleanSummary,
    experience: cleanExperience,
    education: cleanEducation,
    projects: cleanProjects,
    skills: cleanSkills,
    languages: cleanLanguages,
    awards: cleanAwards,
    certifications: cleanCertifications,
    customization: cleanCustomization,
  };

  return sortObjectKeys(normalized);
}

/**
 * Computes a deterministic SHA-256 cryptographic content fingerprint.
 */
export function computeResumeContentHash(templateId: string, content: Data): string {
  const normalized = normalizeResumeContent(templateId, content);
  const jsonString = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(jsonString, 'utf8').digest('hex');
}

/**
 * Manages resume versioning. Records a version in `resumeVersions` collection if
 * the contentHash is new for this resume.
 */
export async function recordResumeVersion(
  userId: ObjectId,
  resumeId: ObjectId,
  templateId: string,
  content: Data
): Promise<{ versionNumber: number; contentHash: string; versionId: ObjectId }> {
  const db = await database();
  const contentHash = computeResumeContentHash(templateId, content);
  const normalized = normalizeResumeContent(templateId, content);

  // Check if this exact content state already has a version record
  const existingVersion = await db.collection('resumeVersions').findOne({
    userId,
    resumeId,
    contentHash,
  });

  if (existingVersion) {
    return {
      versionNumber: existingVersion.versionNumber,
      contentHash,
      versionId: existingVersion._id as ObjectId,
    };
  }

  // Count existing versions for auto-incrementing version number
  const count = await db.collection('resumeVersions').countDocuments({ userId, resumeId });
  const versionNumber = count + 1;
  const now = new Date();

  const result = await db.collection('resumeVersions').insertOne({
    userId,
    resumeId,
    contentHash,
    versionNumber,
    templateId,
    normalizedContent: normalized,
    createdAt: now,
  });

  return {
    versionNumber,
    contentHash,
    versionId: result.insertedId,
  };
}

/**
 * Idempotently records a verified payment entitlement for a specific (userId, resumeId, contentHash).
 * Uses unique constraint logic to prevent duplicate entitlements.
 */
export async function verifyAndCreateEntitlement(params: {
  userId: ObjectId;
  resumeId: ObjectId;
  contentHash: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<{ entitlementId: ObjectId; created: boolean }> {
  const db = await database();
  const now = new Date();

  // Find associated versionId if available
  const version = await db.collection('resumeVersions').findOne({
    userId: params.userId,
    resumeId: params.resumeId,
    contentHash: params.contentHash,
  });

  const filter = {
    userId: params.userId,
    resumeId: params.resumeId,
    contentHash: params.contentHash,
  };

  const update = {
    $set: {
      status: 'verified',
      amount: params.amount,
      currency: params.currency,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      versionId: version?._id || null,
      verifiedAt: now,
      updatedAt: now,
    },
    $setOnInsert: {
      userId: params.userId,
      resumeId: params.resumeId,
      contentHash: params.contentHash,
      createdAt: now,
    },
  };

  const result = await db.collection('paymentEntitlements').updateOne(filter, update, { upsert: true });

  const entitlement = await db.collection('paymentEntitlements').findOne(filter);

  return {
    entitlementId: entitlement!._id as ObjectId,
    created: Boolean(result.upsertedCount),
  };
}

/**
 * Verifies if a verified payment entitlement exists for (userId, resumeId, contentHash).
 */
export async function checkContentEntitlement(
  userId: ObjectId,
  resumeId: ObjectId,
  contentHash: string
): Promise<boolean> {
  const db = await database();
  const entitlement = await db.collection('paymentEntitlements').findOne({
    userId,
    resumeId,
    contentHash,
    status: 'verified',
  });
  return Boolean(entitlement);
}

/**
 * Authorizes a download request by recalculating the server-side contentHash
 * and verifying against paymentEntitlements. Logs a download audit record.
 */
export async function authorizeDownloadAndAudit(
  userId: ObjectId,
  resumeId: ObjectId,
  templateId: string,
  content: Data
): Promise<{ authorized: boolean; contentHash: string; entitlementId?: ObjectId }> {
  const contentHash = computeResumeContentHash(templateId, content);
  const db = await database();

  const entitlement = await db.collection('paymentEntitlements').findOne({
    userId,
    resumeId,
    contentHash,
    status: 'verified',
  });

  if (!entitlement) {
    return { authorized: false, contentHash };
  }

  // Audit successful download
  await db.collection('downloadAudits').insertOne({
    userId,
    resumeId,
    contentHash,
    entitlementId: entitlement._id,
    downloadedAt: new Date(),
  });

  return {
    authorized: true,
    contentHash,
    entitlementId: entitlement._id as ObjectId,
  };
}
