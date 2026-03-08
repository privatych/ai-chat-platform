import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull(), // 'free', 'premium'
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'grace_period', 'canceled', 'expired'
  yookassaPaymentId: varchar('yookassa_payment_id', { length: 255 }),
  yookassaSubscriptionId: varchar('yookassa_subscription_id', { length: 255 }), // NEW
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  nextPaymentDate: timestamp('next_payment_date'), // NEW
  gracePeriodEndsAt: timestamp('grace_period_ends_at'), // NEW
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'), // NEW
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
