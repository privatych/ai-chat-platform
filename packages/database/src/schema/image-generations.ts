import { pgTable, uuid, varchar, text, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const imageGenerations = pgTable('image_generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  model: varchar('model', { length: 100 }).notNull(),
  prompt: text('prompt').notNull(),
  negativePrompt: text('negative_prompt'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  imageUrl: text('image_url').notNull(),
  cost: decimal('cost', { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
