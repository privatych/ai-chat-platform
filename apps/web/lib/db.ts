import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import path from 'path';
import fs from 'fs';

// Database file path - in the data folder at project root
const dbPath = path.join(process.cwd(), 'data', 'sqlite.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Define schema inline to avoid import issues
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  tier: text('tier').notNull().default('free'),
  messagesUsedToday: integer('messages_used_today').notNull().default(0),
  messagesResetAt: text('messages_reset_at'),
  createdAt: text('created_at').notNull(),
});

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  model: text('model').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  model: text('model'),
  parentMessageId: text('parent_message_id'),
  attachments: text('attachments'), // JSON array of attachments
  createdAt: text('created_at').notNull(),
});

export const db = drizzle(sqlite);

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free',
    messages_used_today INTEGER NOT NULL DEFAULT 0,
    messages_reset_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    parent_message_id TEXT,
    attachments TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
`);

// Migration: Add attachments column if it doesn't exist
try {
  sqlite.exec('ALTER TABLE messages ADD COLUMN attachments TEXT');
} catch {
  // Column already exists, ignore
}
