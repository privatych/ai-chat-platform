import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const contextSections = pgTable('project_context_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sectionType: varchar('section_type', { length: 50 }).notNull(), // about_project, about_user, technical, documents
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  extractedText: text('extracted_text'),
  files: jsonb('files'), // [{name, mimeType, data, size}]
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ContextSection = typeof contextSections.$inferSelect;
export type NewContextSection = typeof contextSections.$inferInsert;
