import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export * from './schema/users';
export * from './schema/chats';
export * from './schema/messages';
export * from './schema/subscriptions';
export * from './schema/projects';
export * from './schema/context-sections';
export * from './schema/usage-logs';
export * from './schema/model-pricing';
export * from './schema/admin-actions';
export * from './schema/message-usage';

import * as users from './schema/users';
import * as chats from './schema/chats';
import * as messages from './schema/messages';
import * as subscriptions from './schema/subscriptions';
import * as projects from './schema/projects';
import * as contextSections from './schema/context-sections';
import * as usageLogs from './schema/usage-logs';
import * as modelPricing from './schema/model-pricing';
import * as adminActions from './schema/admin-actions';
import * as messageUsage from './schema/message-usage';

const schema = {
  ...users,
  ...chats,
  ...messages,
  ...subscriptions,
  ...projects,
  ...contextSections,
  ...usageLogs,
  ...modelPricing,
  ...adminActions,
  ...messageUsage,
};

// Database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance
export const db = drizzle(client, { schema });
