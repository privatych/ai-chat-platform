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

export const FREE_IMAGE_MODELS: ImageModel[] = [
  {
    id: 'flux-2-klein',
    name: 'FLUX.2 Klein',
    provider: 'Black Forest Labs',
    cost: 0.014,
    speed: 'fast',
    category: 'general',
    description: 'Быстрая генерация, хорошее качество',
  },
  {
    id: 'flux-1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'Black Forest Labs',
    cost: 0.003,
    speed: 'ultra-fast',
    category: 'general',
    description: 'Сверхбыстрая генерация',
  },
  {
    id: 'sdxl-turbo',
    name: 'Stable Diffusion XL Turbo',
    provider: 'Stability AI',
    cost: 0.004,
    speed: 'fast',
    category: 'general',
    description: 'Универсальная модель',
  },
  {
    id: 'playground-v2.5',
    name: 'Playground v2.5',
    provider: 'Playground AI',
    cost: 0.004,
    speed: 'medium',
    category: 'artistic',
    description: 'Креативные и художественные стили',
  },
];

export const PREMIUM_IMAGE_MODELS: ImageModel[] = [
  // Flagship
  {
    id: 'flux-2-pro',
    name: 'FLUX.2 Pro',
    provider: 'Black Forest Labs',
    cost: 0.03,
    speed: 'medium',
    category: 'flagship',
    description: 'Максимальное качество',
    badge: 'Best Quality',
  },
  {
    id: 'flux-2-max',
    name: 'FLUX.2 Max',
    provider: 'Black Forest Labs',
    cost: 0.07,
    speed: 'slow',
    category: 'flagship',
    description: 'Топовая модель для профессионалов',
    badge: 'Premium',
  },
  {
    id: 'flux-1-dev',
    name: 'FLUX.1 Dev',
    provider: 'Black Forest Labs',
    cost: 0.014,
    speed: 'fast',
    category: 'flagship',
    description: 'Высокое качество, быстрая',
  },
  {
    id: 'sd-3.5-large-turbo',
    name: 'SD 3.5 Large Turbo',
    provider: 'Stability AI',
    cost: 0.012,
    speed: 'fast',
    category: 'flagship',
    description: 'Продвинутая генерация',
  },
  // Photorealistic
  {
    id: 'realvisxl-v4',
    name: 'RealVisXL v4.0',
    provider: 'Community',
    cost: 0.005,
    speed: 'medium',
    category: 'photorealistic',
    description: 'Фотореалистичные изображения',
  },
  {
    id: 'dreamshaper-xl',
    name: 'DreamShaper XL',
    provider: 'Community',
    cost: 0.006,
    speed: 'medium',
    category: 'photorealistic',
    description: 'Реалистичные портреты и сцены',
  },
  {
    id: 'juggernaut-xl',
    name: 'Juggernaut XL',
    provider: 'Community',
    cost: 0.006,
    speed: 'medium',
    category: 'photorealistic',
    description: 'Кинематографическое качество',
  },
  // Anime/Illustration
  {
    id: 'anything-v5',
    name: 'Anything v5',
    provider: 'Community',
    cost: 0.004,
    speed: 'fast',
    category: 'anime',
    description: 'Аниме и иллюстрации',
  },
  {
    id: 'novelai-diffusion',
    name: 'NovelAI Diffusion',
    provider: 'NovelAI',
    cost: 0.008,
    speed: 'medium',
    category: 'anime',
    description: 'Высококачественное аниме',
  },
  {
    id: 'pastel-mix',
    name: 'Pastel Mix',
    provider: 'Community',
    cost: 0.004,
    speed: 'fast',
    category: 'anime',
    description: 'Мягкий аниме-арт',
  },
  // Artistic
  {
    id: 'sdxl-base',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    cost: 0.008,
    speed: 'medium',
    category: 'artistic',
    description: 'Универсальная продвинутая модель',
  },
  {
    id: 'openjourney-v4',
    name: 'OpenJourney v4',
    provider: 'Community',
    cost: 0.005,
    speed: 'medium',
    category: 'artistic',
    description: 'Стиль Midjourney',
  },
  {
    id: 'architecture-xl',
    name: 'ArchitectureXL',
    provider: 'Community',
    cost: 0.006,
    speed: 'medium',
    category: 'artistic',
    description: 'Архитектура и дизайн продуктов',
  },
  {
    id: 'food-photography',
    name: 'Food Photography',
    provider: 'Community',
    cost: 0.005,
    speed: 'medium',
    category: 'artistic',
    description: 'Фудфотография',
  },
  {
    id: 'landscape-xl',
    name: 'Landscape XL',
    provider: 'Community',
    cost: 0.005,
    speed: 'medium',
    category: 'artistic',
    description: 'Природные пейзажи',
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
    features: ['text-to-image', 'img2img', 'inpainting'],
  },
};
