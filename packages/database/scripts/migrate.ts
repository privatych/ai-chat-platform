import { db } from '../src';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found at:', migrationsDir);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sorts alphabetically (001, 002, etc.)

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  console.log(`Found ${files.length} migration files`);
  console.log('---');

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    try {
      await db.execute(sql.raw(migrationSQL));
      console.log(`✓ ${file} completed successfully`);
    } catch (error: any) {
      // Check if error is "relation already exists" which is safe to ignore
      if (error.message?.includes('already exists')) {
        console.log(`⊘ ${file} - objects already exist (skipping)`);
      } else {
        console.error(`✗ ${file} - FAILED`);
        console.error('Error:', error.message);
        throw error; // Re-throw to stop execution
      }
    }
  }

  console.log('---');
  console.log('All migrations completed successfully');
}

runMigrations()
  .then(() => {
    console.log('Migration process finished');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration process failed:', err);
    process.exit(1);
  });
