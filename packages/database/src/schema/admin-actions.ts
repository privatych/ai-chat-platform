import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminActions = pgTable('admin_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(), // 'USER_ROLE_CHANGED', 'USER_BLOCKED', etc.
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  details: jsonb('details'), // { from: 'user', to: 'premiumuser' }
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  adminIdx: index('idx_admin_actions_admin').on(table.adminId, table.createdAt),
  targetIdx: index('idx_admin_actions_target').on(table.targetUserId, table.createdAt),
}));

export type AdminAction = typeof adminActions.$inferSelect;
export type NewAdminAction = typeof adminActions.$inferInsert;
