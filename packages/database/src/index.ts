import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema/users';
export * from './schema/chats';
export * from './schema/messages';
export * from './schema/message-usage';
export * from './schema/subscriptions';
export * from './schema/projects';
export * from './schema/context-sections';
export * from './schema/usage-logs';
export * from './schema/model-pricing';
export * from './schema/admin-actions';

// Database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance with schema
export const db = drizzle(client, { schema });
