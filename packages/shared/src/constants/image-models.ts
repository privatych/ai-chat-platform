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

// Free tier models - fast and affordable via OpenRouter
export const FREE_IMAGE_MODELS: ImageModel[] = [
  {
    id: 'black-forest-labs/flux.2-klein-4b',
    name: 'FLUX.2 Klein 4B',
    provider: 'Black Forest Labs',
    cost: 0.01,
    speed: 'ultra-fast',
    category: 'general',
    description: 'Самая быстрая модель FLUX.2, отличное соотношение скорости и качества',
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    cost: 0.005,
    speed: 'fast',
    category: 'general',
    description: 'Быстрая генерация от Google, поддержка текста и редактирование',
  },
  {
    id: 'sourceful/riverflow-v2-fast',
    name: 'Riverflow V2 Fast',
    provider: 'Sourceful',
    cost: 0.008,
    speed: 'fast',
    category: 'general',
    description: 'Быстрая модель для продакшен-деплоев',
  },
];

// Premium tier models - highest quality via OpenRouter
export const PREMIUM_IMAGE_MODELS: ImageModel[] = [
  // Flagship FLUX models
  {
    id: 'black-forest-labs/flux.2-max',
    name: 'FLUX.2 Max',
    provider: 'Black Forest Labs',
    cost: 0.07,
    speed: 'slow',
    category: 'flagship',
    description: 'Топовая модель FLUX - максимальное качество и детализация',
    badge: 'Best Quality',
  },
  {
    id: 'black-forest-labs/flux.2-pro',
    name: 'FLUX.2 Pro',
    provider: 'Black Forest Labs',
    cost: 0.03,
    speed: 'medium',
    category: 'flagship',
    description: 'Профессиональное качество с отличной скоростью',
    badge: 'Recommended',
  },
  {
    id: 'black-forest-labs/flux.2-flex',
    name: 'FLUX.2 Flex',
    provider: 'Black Forest Labs',
    cost: 0.025,
    speed: 'medium',
    category: 'flagship',
    description: 'Отлично работает с текстом, типографикой и мелкими деталями',
  },
  // OpenAI
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenAI',
    cost: 0.08,
    speed: 'medium',
    category: 'flagship',
    description: 'Новейшая модель OpenAI с превосходным пониманием инструкций',
    badge: 'Premium',
  },
  // Sourceful Pro
  {
    id: 'sourceful/riverflow-v2-pro',
    name: 'Riverflow V2 Pro',
    provider: 'Sourceful',
    cost: 0.02,
    speed: 'medium',
    category: 'photorealistic',
    description: 'SOTA производительность для генерации и редактирования',
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
    dailyLimit: 30,
    maxResolution: 2048,
    allowedModels: [
      ...FREE_IMAGE_MODELS.map(m => m.id),
      ...PREMIUM_IMAGE_MODELS.map(m => m.id),
    ],
    features: ['text-to-image', 'editing'],
  },
};
