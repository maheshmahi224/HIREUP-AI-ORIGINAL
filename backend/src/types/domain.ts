import type { ObjectId } from 'mongodb';
export type Role = 'user' | 'admin';
export interface User { _id?: ObjectId; email: string; name: string; passwordHash?: string; googleId?: string; role: Role; emailVerifiedAt?: Date; createdAt: Date; updatedAt: Date; }
export interface Session { _id?: ObjectId; userId: ObjectId; tokenHash: string; csrfHash: string; expiresAt: Date; createdAt: Date; lastSeenAt: Date; }
export interface Profile { _id?: ObjectId; userId: ObjectId; personal: Record<string, unknown>; sections: Record<string, unknown[]>; updatedAt: Date; createdAt: Date; }
export interface Resume { _id?: ObjectId; userId: ObjectId; title: string; templateId: string; content: Record<string, unknown>; sourceProfileUpdatedAt?: Date; paymentState: 'unpaid'|'paid'; downloadCount: number; createdAt: Date; updatedAt: Date; }
