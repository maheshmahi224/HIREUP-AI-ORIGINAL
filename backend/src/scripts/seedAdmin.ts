import bcrypt from 'bcryptjs';
import { database } from '../db/mongo.js';
import type { User } from '../types/domain.js';

async function seedAdminUser() {
  console.log('🔑 Setting up Admin User in MongoDB...');

  const db = await database();
  const email = 'maheshmahi.ai224@gmail.com';
  const passwordRaw = 'Mahesh@1234$';
  const passwordHash = await bcrypt.hash(passwordRaw, 12);
  const now = new Date();

  const existingUser = await db.collection<User>('users').findOne({ email });

  if (existingUser) {
    await db.collection<User>('users').updateOne(
      { email },
      {
        $set: {
          passwordHash,
          role: 'admin',
          updatedAt: now,
        },
      }
    );
    console.log(`✅ Admin User updated successfully: ${email} (Role: admin)`);
  } else {
    const result = await db.collection<User>('users').insertOne({
      name: 'Admin Mahesh',
      email,
      passwordHash,
      role: 'admin',
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('profiles').insertOne({
      userId: result.insertedId,
      personal: { name: 'Admin Mahesh', email },
      sections: {},
      createdAt: now,
      updatedAt: now,
    });

    console.log(`🎉 Admin User created successfully: ${email} (Role: admin)`);
  }

  process.exit(0);
}

seedAdminUser().catch((err) => {
  console.error('💥 Error seeding admin user:', err);
  process.exit(1);
});
