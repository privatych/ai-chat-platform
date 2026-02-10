import { pgTable, uuid, varchar, integer, decimal, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'chat_message', 'image_generation', 'file_upload'
  model: varchar('model', { length: 100 }).notNull(), // 'gpt-4-turbo', 'claude-3-opus', etc.
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  tokensTotal: integer('tokens_total').notNull(),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).notNull(), // Precise cost in USD
  metadata: jsonb('metadata'), // Additional data (chatId, projectId, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('idx_usage_logs_user_created').on(table.userId, table.createdAt),
  createdIdx: index('idx_usage_logs_created').on(table.createdAt),
  eventTypeIdx: index('idx_usage_logs_event_type').on(table.eventType),
  modelIdx: index('idx_usage_logs_model').on(table.model),
}));

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
