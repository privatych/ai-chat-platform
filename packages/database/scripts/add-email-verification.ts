import { db } from '../src/client';
import { sql } from 'drizzle-orm';

async function addEmailVerificationFields() {
  console.log('Adding email verification fields to users table...');

  try {
    // Add email_verified column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('✓ Added email_verified column');

    // Add verification_token column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)
    `);
    console.log('✓ Added verification_token column');

    // Add verification_expires column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP
    `);
    console.log('✓ Added verification_expires column');

    // Create index on verification_token
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_verification_token
      ON users(verification_token)
    `);
    console.log('✓ Created index on verification_token');

    // Mark existing users as verified (backward compatibility)
    const result = await db.execute(sql`
      UPDATE users
      SET email_verified = TRUE
      WHERE email_verified = FALSE
    `);
    console.log(`✓ Marked ${result.rowCount || 0} existing users as verified`);

    console.log('\n✅ Email verification fields added successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

addEmailVerificationFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
