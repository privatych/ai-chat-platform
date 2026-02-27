import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as users from './schema/users';
import * as chats from './schema/chats';
import * as messages from './schema/messages';
import * as messageUsage from './schema/message-usage';
import * as subscriptions from './schema/subscriptions';
import * as projects from './schema/projects';
import * as contextSections from './schema/context-sections';
import * as usageLogs from './schema/usage-logs';
import * as modelPricing from './schema/model-pricing';
import * as adminActions from './schema/admin-actions';
import * as imageGenerations from './schema/image-generations';

const schema = {
  ...users,
  ...chats,
  ...messages,
  ...messageUsage,
  ...subscriptions,
  ...projects,
  ...contextSections,
  ...usageLogs,
  ...modelPricing,
  ...adminActions,
  ...imageGenerations,
};

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
export * from './schema/image-generations';

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance with schema
export const db = drizzle(client, { schema });
