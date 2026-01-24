import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

// Allow build to complete without DATABASE_URL (will fail at runtime if actually used)
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder';

const client = postgres(connectionString);

// Define schema inline for web app
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  tier: text('tier').notNull().default('free'),
  messagesUsedToday: integer('messages_used_today').notNull().default(0),
  messagesResetAt: timestamp('messages_reset_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  model: text('model').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  model: text('model'),
  parentMessageId: uuid('parent_message_id'),
  attachments: text('attachments'), // JSON array of attachments
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const db = drizzle(client, {
  schema: { users, chats, messages },
});
