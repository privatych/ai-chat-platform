// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'premium';
  messagesUsedToday: number;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultModel: string;
}

// Chat types
export interface Chat {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  parentMessageId: string | null;
  createdAt: Date;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Chat API types
export interface CreateChatRequest {
  model: string;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  parentMessageId?: string;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

// Model types
export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai';
  description: string;
  tier: 'free' | 'premium';
  maxTokens: number;
}
