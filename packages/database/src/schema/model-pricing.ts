import { pgTable, uuid, varchar, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';

export const modelPricing = pgTable('model_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: varchar('model_id', { length: 100 }).notNull().unique(),
  pricePerInputToken: decimal('price_per_input_token', { precision: 12, scale: 10 }).notNull(),
  pricePerOutputToken: decimal('price_per_output_token', { precision: 12, scale: 10 }).notNull(),
  isActive: boolean('is_active').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type ModelPricing = typeof modelPricing.$inferSelect;
export type NewModelPricing = typeof modelPricing.$inferInsert;
