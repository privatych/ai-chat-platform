import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().optional(),
  subscriptionTier: z.enum(['free', 'premium']),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Chat types
export const ChatSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  model: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Chat = z.infer<typeof ChatSchema>;

// Message types
export const MessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  tokensUsed: z.number().optional(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
