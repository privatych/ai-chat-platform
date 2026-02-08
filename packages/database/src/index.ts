import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export * from './schema/users';
export * from './schema/chats';
export * from './schema/messages';
export * from './schema/subscriptions';
export * from './schema/projects';
export * from './schema/context-sections';

// Database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance
export const db = drizzle(client);
