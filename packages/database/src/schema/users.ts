import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).notNull().default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'admin', 'premiumuser', 'user'
  isBlocked: boolean('is_blocked').default(false),
  blockedReason: text('blocked_reason'),
  blockedAt: timestamp('blocked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
