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
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash', provider: 'Google' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
  ],
  premium: [
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro', provider: 'Google' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
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
