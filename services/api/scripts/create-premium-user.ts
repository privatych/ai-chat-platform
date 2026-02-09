import 'dotenv/config';
import { db, users } from '@ai-chat/database';
import bcrypt from 'bcrypt';

async function createPremiumUser() {
  const email = 'premium@test.com';
  const password = 'Premium123!';
  const fullName = 'Premium User';

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Set expiry date to 1 year from now
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  try {
    // Create premium user
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: expiryDate,
      })
      .returning();

    console.log('✅ Premium user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Subscription tier:', user.subscriptionTier);
    console.log('Expires at:', user.subscriptionExpiresAt);
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

createPremiumUser();
