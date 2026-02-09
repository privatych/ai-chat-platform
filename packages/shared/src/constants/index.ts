// Rate limits
export const RATE_LIMITS = {
  free: {
    messagesPerDay: 50,
    chatsPerHour: 10,
    maxTokensPerMessage: 4000,
  },
  premium: {
    messagesPerDay: 1000,
    chatsPerHour: 100,
    maxTokensPerMessage: 32000,
  },
} as const;

// Available AI models
export const AI_MODELS = {
  free: [
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', supportsVision: false, supportsFiles: false },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', supportsVision: true, supportsFiles: true },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', supportsVision: false, supportsFiles: false },
  ],
  premium: [
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', supportsVision: true, supportsFiles: false },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', supportsVision: true, supportsFiles: true },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', supportsVision: true, supportsFiles: true },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', supportsVision: false, supportsFiles: false },
  ],
} as const;

// Subscription pricing
export const SUBSCRIPTION_PLANS = {
  free: {
    price: 0,
    currency: 'RUB',
    name: 'Free',
  },
  premium: {
    price: 990,
    currency: 'RUB',
    name: 'Premium',
  },
} as const;
