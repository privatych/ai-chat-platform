import { db } from '../src';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../migrations/001_add_projects.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: 001_add_projects.sql');

  await db.execute(sql.raw(migrationSQL));

  console.log('Migration completed successfully');
}

runMigration().catch(console.error);
