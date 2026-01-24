// Context management for optimizing token usage
// Limits context window and summarizes older messages

import { Message } from './openrouter';

export interface ContextConfig {
  // Maximum number of recent messages to keep in full
  maxRecentMessages: number;
  // Maximum approximate tokens for context (rough estimate)
  maxContextTokens: number;
  // Whether to summarize older messages
  enableSummarization: boolean;
}

// Default configuration for context management
export const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxRecentMessages: 20,
  maxContextTokens: 8000,
  enableSummarization: true,
};

// Rough token estimation (approximately 4 chars per token for English)
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Estimate tokens for a message (handles both string and multimodal content)
function estimateMessageTokens(message: Message): number {
  if (typeof message.content === 'string') {
    return estimateTokens(message.content) + 4; // +4 for role overhead
  }

  // For multimodal content
  let tokens = 4; // role overhead
  for (const part of message.content) {
    if (part.type === 'text') {
      tokens += estimateTokens(part.text);
    } else if (part.type === 'image_url') {
      // Images roughly consume 85-170 tokens depending on size
      tokens += 170;
    }
  }
  return tokens;
}

// Create a summary of older messages
function createContextSummary(messages: Message[]): string {
  if (messages.length === 0) return '';

  const topics = new Set<string>();
  const keyPoints: string[] = [];

  for (const msg of messages) {
    const content = typeof msg.content === 'string'
      ? msg.content
      : msg.content.filter(p => p.type === 'text').map(p => (p as { text: string }).text).join(' ');

    // Extract first sentence or first 100 chars as key point
    const firstSentence = content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 200) {
      if (msg.role === 'user') {
        keyPoints.push(`User asked: "${firstSentence}"`);
      } else if (msg.role === 'assistant') {
        keyPoints.push(`AI discussed: ${firstSentence}`);
      }
    }

    // Limit to most recent key points
    if (keyPoints.length > 5) {
      keyPoints.shift();
    }
  }

  return `[Context from earlier in conversation - ${messages.length} messages summarized]\n` +
    keyPoints.join('\n') +
    '\n[End of context summary]';
}

// Cache for context summaries
const contextCache = new Map<string, { summary: string; messageCount: number; timestamp: number }>();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of contextCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      contextCache.delete(key);
    }
  }
}

export interface OptimizedContext {
  messages: Message[];
  originalCount: number;
  optimizedCount: number;
  estimatedTokens: number;
  wasSummarized: boolean;
  summaryIncluded: boolean;
}

/**
 * Optimize message context for API calls
 * - Keeps recent messages in full
 * - Summarizes older messages if enabled
 * - Respects token limits
 */
export function optimizeContext(
  chatId: string,
  messages: Message[],
  config: ContextConfig = DEFAULT_CONTEXT_CONFIG
): OptimizedContext {
  // Clean expired cache entries periodically
  if (Math.random() < 0.1) cleanCache();

  const result: OptimizedContext = {
    messages: [],
    originalCount: messages.length,
    optimizedCount: 0,
    estimatedTokens: 0,
    wasSummarized: false,
    summaryIncluded: false,
  };

  // If messages fit within limits, return as-is
  if (messages.length <= config.maxRecentMessages) {
    result.messages = messages;
    result.optimizedCount = messages.length;
    result.estimatedTokens = messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
    return result;
  }

  // Split into old and recent messages
  const splitIndex = messages.length - config.maxRecentMessages;
  const oldMessages = messages.slice(0, splitIndex);
  const recentMessages = messages.slice(splitIndex);

  // Check cache for summary
  const cacheKey = `${chatId}:${splitIndex}`;
  const cached = contextCache.get(cacheKey);

  let contextSummary: string;

  if (cached && cached.messageCount === oldMessages.length) {
    // Use cached summary
    contextSummary = cached.summary;
  } else if (config.enableSummarization && oldMessages.length > 0) {
    // Create new summary
    contextSummary = createContextSummary(oldMessages);
    contextCache.set(cacheKey, {
      summary: contextSummary,
      messageCount: oldMessages.length,
      timestamp: Date.now(),
    });
    result.wasSummarized = true;
  } else {
    contextSummary = '';
  }

  // Build optimized message list
  const optimizedMessages: Message[] = [];

  // Add system context summary if available
  if (contextSummary) {
    optimizedMessages.push({
      role: 'system',
      content: contextSummary,
    });
    result.summaryIncluded = true;
  }

  // Add recent messages
  optimizedMessages.push(...recentMessages);

  // Calculate token estimate
  let totalTokens = optimizedMessages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);

  // If still over token limit, trim from the oldest recent messages
  while (totalTokens > config.maxContextTokens && optimizedMessages.length > 2) {
    // Keep at least the summary (if present) and last message
    const removeIndex = result.summaryIncluded ? 1 : 0;
    const removed = optimizedMessages.splice(removeIndex, 1)[0];
    totalTokens -= estimateMessageTokens(removed);
  }

  result.messages = optimizedMessages;
  result.optimizedCount = optimizedMessages.length;
  result.estimatedTokens = totalTokens;

  return result;
}

// Clear cache for a specific chat (call when chat is deleted or reset)
export function clearContextCache(chatId: string) {
  for (const key of contextCache.keys()) {
    if (key.startsWith(`${chatId}:`)) {
      contextCache.delete(key);
    }
  }
}

// Get cache stats for debugging
export function getContextCacheStats() {
  return {
    size: contextCache.size,
    entries: Array.from(contextCache.entries()).map(([key, value]) => ({
      key,
      messageCount: value.messageCount,
      age: Date.now() - value.timestamp,
    })),
  };
}
