export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  cost: number;
  speed: 'ultra-fast' | 'fast' | 'medium' | 'slow';
  category: 'general' | 'flagship' | 'photorealistic' | 'anime' | 'artistic';
  description: string;
  badge?: string;
}

// Free tier models - supported by OpenRouter
export const FREE_IMAGE_MODELS: ImageModel[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    cost: 0.0000025,
    speed: 'fast',
    category: 'general',
    description: 'Быстрая генерация от Google с хорошим качеством',
    badge: 'Recommended',
  },
];

// Premium tier models - highest quality via OpenRouter
export const PREMIUM_IMAGE_MODELS: ImageModel[] = [
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
    cost: 0.000012,
    speed: 'medium',
    category: 'flagship',
    description: 'Топовая модель Google с максимальным качеством и поддержкой 2K/4K',
    badge: 'Best Quality',
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenAI',
    cost: 0.000002,
    speed: 'fast',
    category: 'flagship',
    description: 'Быстрая модель OpenAI с отличным пониманием инструкций',
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenAI',
    cost: 0.00001,
    speed: 'medium',
    category: 'flagship',
    description: 'Топовая модель OpenAI для профессиональной генерации',
    badge: 'Premium',
  },
];

export const IMAGE_MODELS = {
  free: FREE_IMAGE_MODELS,
  premium: PREMIUM_IMAGE_MODELS,
};

export const IMAGE_LIMITS = {
  free: {
    dailyLimit: 10,
    maxResolution: 1024,
    allowedModels: FREE_IMAGE_MODELS.map(m => m.id),
    features: ['text-to-image'],
  },
  premium: {
    dailyLimit: 100,
    maxResolution: 2048,
    allowedModels: [
      ...FREE_IMAGE_MODELS.map(m => m.id),
      ...PREMIUM_IMAGE_MODELS.map(m => m.id),
    ],
    features: ['text-to-image', 'high-resolution'],
  },
};
