// Project related types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Context section types
export type ContextSectionType = 'about_project' | 'about_user' | 'technical' | 'documents';

export interface ContextSection {
  id: string;
  projectId: string;
  sectionType: ContextSectionType;
  title: string;
  content: string | null;
  orderIndex: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Chat related types
export interface Chat {
  id: string;
  userId: string;
  title: string;
  model: string;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  systemPrompt: string | null;
  temperature: number | null;
  useProjectContext: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Message related types
export interface MessageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64
  size?: number;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  createdAt: Date | string;
}

// User related types
export type SubscriptionTier = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// AI Model types
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsFiles: boolean;
}
