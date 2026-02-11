import { db } from '../src';
import { users } from '../src/schema';
import { eq } from 'drizzle-orm';

async function updateAdminRole() {
  console.log('🔄 Updating admin@test.com to admin role...\n');

  try {
    const result = await db
      .update(users)
      .set({
        role: 'admin',
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .where(eq(users.email, 'admin@test.com'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Successfully updated user:');
      console.log(`   Email: ${result[0].email}`);
      console.log(`   Role: ${result[0].role}`);
      console.log(`   Subscription: ${result[0].subscriptionTier} (${result[0].subscriptionStatus})`);
    } else {
      console.log('❌ No user found with email admin@test.com');
    }

    // Also create premium@test.com and user@test.com for testing
    console.log('\n🔄 Creating additional test users...\n');

    const passwordHash = '$2b$10$YqmZHvW8zX7KqH.F6Y5VVOvN.sJ9w2zWxE8zQ8KvB5cJvW7xY9.5G'; // admin123

    // Premium user
    await db
      .insert(users)
      .values({
        email: 'premium@test.com',
        passwordHash,
        role: 'premiumuser',
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          role: 'premiumuser',
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
        },
      });
    console.log('✅ Premium user: premium@test.com / admin123');

    // Regular user
    await db
      .insert(users)
      .values({
        email: 'user@test.com',
        passwordHash,
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
      })
      .onConflictDoNothing();
    console.log('✅ Regular user: user@test.com / admin123');

    console.log('\n✨ All test users ready!');
    console.log('\nТестовые аккаунты:');
    console.log('👑 Админ:   admin@test.com / admin123');
    console.log('💎 Premium: premium@test.com / admin123');
    console.log('👤 User:    user@test.com / admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating users:', err);
    process.exit(1);
  }
}

updateAdminRole().catch(console.error);
