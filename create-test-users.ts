import { db } from './packages/database/src';
import { users } from './packages/database/src/schema';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  console.log('🔄 Creating test users...\n');

  // Admin user
  try {
    await db.insert(users).values({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        role: 'admin',
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      }
    });
    console.log('✅ Admin user created: admin@test.com / admin123');
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  }

  // Premium user
  try {
    await db.insert(users).values({
      email: 'premium@test.com',
      passwordHash,
      role: 'premiumuser',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        role: 'premiumuser',
        subscriptionTier: 'premium',
      }
    });
    console.log('✅ Premium user created: premium@test.com / admin123');
  } catch (err) {
    console.error('❌ Error creating premium user:', err);
  }

  // Regular user
  try {
    await db.insert(users).values({
      email: 'user@test.com',
      passwordHash,
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
    }).onConflictDoNothing();
    console.log('✅ Regular user created: user@test.com / admin123');
  } catch (err) {
    console.error('❌ Error creating regular user:', err);
  }

  console.log('\n✨ Test users created successfully!');
  process.exit(0);
}

createTestUsers().catch(console.error);
