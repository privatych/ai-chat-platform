import type { AIModel } from '../types';

// Freemium limits
export const FREE_TIER_LIMITS = {
  messagesPerDay: 50,
  chatHistoryDays: 7,
} as const;

export const PREMIUM_TIER_LIMITS = {
  messagesPerDay: Infinity,
  chatHistoryDays: Infinity,
} as const;

// Available AI models
export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and affordable, great for most tasks',
    tier: 'free',
    maxTokens: 16384,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model',
    tier: 'premium',
    maxTokens: 128000,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast and concise responses',
    tier: 'free',
    maxTokens: 200000,
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Balanced performance and capability',
    tier: 'premium',
    maxTokens: 200000,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Google\'s fast multimodal model',
    tier: 'free',
    maxTokens: 1000000,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Google\'s most capable model',
    tier: 'premium',
    maxTokens: 2000000,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'Powerful open-source alternative',
    tier: 'free',
    maxTokens: 64000,
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xai',
    description: 'xAI\'s conversational model',
    tier: 'premium',
    maxTokens: 131072,
  },
];

// Model provider colors for UI
export const PROVIDER_COLORS = {
  openai: '#10a37f',
  anthropic: '#d4a373',
  google: '#4285f4',
  deepseek: '#8b5cf6',
  xai: '#000000',
} as const;

// API endpoints
export const API_ROUTES = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
  },
  chats: {
    list: '/api/chats',
    create: '/api/chats',
    get: (id: string) => `/api/chats/${id}`,
    update: (id: string) => `/api/chats/${id}`,
    delete: (id: string) => `/api/chats/${id}`,
    messages: (id: string) => `/api/chats/${id}/messages`,
  },
  models: {
    list: '/api/models',
  },
  subscription: {
    status: '/api/subscription',
    subscribe: '/api/subscription',
  },
} as const;
