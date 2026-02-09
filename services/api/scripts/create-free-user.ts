import 'dotenv/config';
import { db, users } from '@ai-chat/database';
import bcrypt from 'bcrypt';

async function createFreeUser() {
  const email = 'free@test.com';
  const password = 'Free123!';
  const fullName = 'Free User';

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Create free user
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
      })
      .returning();

    console.log('✅ Free user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Subscription tier:', user.subscriptionTier);
    console.log('');
    console.log('You can now login at http://localhost:3000/login');

    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('❌ User with this email already exists');
      console.log('');
      console.log('Credentials (if previously created):');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('❌ Error creating user:', error);
    }
    process.exit(1);
  }
}

createFreeUser();
