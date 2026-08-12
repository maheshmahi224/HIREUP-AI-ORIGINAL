import { Db, MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client: MongoClient | undefined;
let db: Db | undefined;
export async function database() {
  if (db) return db;
  client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  await client.connect(); db = client.db(env.MONGODB_DB);
  await ensureIndexes(db); return db;
}
async function ensureIndexes(database: Db) {
  try {
    await database.collection('resumeVersions').deleteMany({ contentHash: { $exists: false } });
    await database.collection('resumeVersions').deleteMany({ contentHash: null });
  } catch {}

  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('profiles').createIndex({ userId: 1 }, { unique: true }),
    database.collection('resumes').createIndex({ userId: 1, updatedAt: -1 }),
    database.collection('resumeVersions').createIndex({ userId: 1, resumeId: 1, contentHash: 1 }, { unique: true }),
    database.collection('paymentEntitlements').createIndex({ userId: 1, resumeId: 1, contentHash: 1 }, { unique: true }),
    database.collection('downloadAudits').createIndex({ userId: 1, resumeId: 1, downloadedAt: -1 }),
    database.collection('payments').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
    database.collection('payments').createIndex({ paymentId: 1 }, { unique: true, sparse: true }),
    database.collection('otpSessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection('aiGenerations').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('adminLogs').createIndex({ createdAt: -1 })
  ]);
}
