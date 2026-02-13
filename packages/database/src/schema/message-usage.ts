import { pgTable, uuid, date, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const messageUsage = pgTable('message_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(), // YYYY-MM-DD format
  messageCount: integer('message_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('idx_message_usage_user_date').on(table.userId, table.date),
  dateIdx: index('idx_message_usage_date').on(table.date),
  uniqueUserDate: unique('unique_user_date').on(table.userId, table.date),
}));

export type MessageUsage = typeof messageUsage.$inferSelect;
export type NewMessageUsage = typeof messageUsage.$inferInsert;
