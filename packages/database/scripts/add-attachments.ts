import 'dotenv/config';
import { db } from '../src';
import { sql } from 'drizzle-orm';

async function addAttachmentsColumn() {
  console.log('Adding attachments column to messages table...');

  try {
    // Try to add attachments column
    await db.execute(sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS attachments jsonb;
    `);

    console.log('✅ Successfully added/verified attachments column');
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Attachments column already exists');
      process.exit(0);
    }
    console.error('❌ Error adding attachments column:', error);
    process.exit(1);
  }
}

addAttachmentsColumn();
