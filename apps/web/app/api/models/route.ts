import { NextResponse } from 'next/server';

const AI_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'free',
    icon: '🟢',
    color: '#10a37f',
    speed: 'fast',
    quality: 'good',
    description: {
      en: 'Fast and affordable, great for most tasks',
      ru: 'Быстрая и доступная, отлично подходит для большинства задач',
    },
    details: {
      en: 'Best for everyday tasks like writing, summarizing, and answering questions. Very fast responses with good quality. Great balance of speed and capability.',
      ru: 'Лучший выбор для повседневных задач: написание текстов, резюмирование, ответы на вопросы. Очень быстрые ответы с хорошим качеством. Отличный баланс скорости и возможностей.',
    },
    strengths: {
      en: ['Fast responses', 'Cost-effective', 'Good for simple tasks', 'Reliable'],
      ru: ['Быстрые ответы', 'Экономичная', 'Хороша для простых задач', 'Надёжная'],
    },
    bestFor: {
      en: 'Quick questions, simple writing, everyday tasks',
      ru: 'Быстрые вопросы, простые тексты, повседневные задачи',
    },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'premium',
    icon: '🔵',
    color: '#10a37f',
    speed: 'medium',
    quality: 'excellent',
    description: {
      en: 'Most capable OpenAI model',
      ru: 'Самая мощная модель OpenAI',
    },
    details: {
      en: 'OpenAI\'s flagship model with exceptional reasoning, creativity, and knowledge. Handles complex tasks, coding, analysis, and creative writing with high accuracy.',
      ru: 'Флагманская модель OpenAI с исключительным мышлением, креативностью и знаниями. Справляется со сложными задачами, кодированием, анализом и творческим письмом.',
    },
    strengths: {
      en: ['Advanced reasoning', 'Complex coding', 'Creative writing', 'Analysis'],
      ru: ['Продвинутое мышление', 'Сложный код', 'Творческое письмо', 'Анализ'],
    },
    bestFor: {
      en: 'Complex problems, professional coding, detailed analysis',
      ru: 'Сложные задачи, профессиональный код, детальный анализ',
    },
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    tier: 'free',
    icon: '🟠',
    color: '#d4a373',
    speed: 'very-fast',
    quality: 'good',
    description: {
      en: 'Fast and concise responses',
      ru: 'Быстрые и лаконичные ответы',
    },
    details: {
      en: 'Anthropic\'s fastest model, optimized for speed while maintaining quality. Great for quick interactions, simple coding tasks, and conversational AI.',
      ru: 'Самая быстрая модель Anthropic, оптимизированная для скорости при сохранении качества. Отлично подходит для быстрого общения, простых задач и диалогов.',
    },
    strengths: {
      en: ['Extremely fast', 'Concise answers', 'Good coding', 'Natural conversation'],
      ru: ['Очень быстрая', 'Краткие ответы', 'Хороший код', 'Естественный диалог'],
    },
    bestFor: {
      en: 'Quick chats, simple code, fast answers',
      ru: 'Быстрые чаты, простой код, мгновенные ответы',
    },
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'premium',
    icon: '🟡',
    color: '#d4a373',
    speed: 'medium',
    quality: 'excellent',
    description: {
      en: 'Balanced performance and capability',
      ru: 'Баланс производительности и возможностей',
    },
    details: {
      en: 'Anthropic\'s most balanced model. Excels at nuanced conversations, careful reasoning, and ethical considerations. Known for thoughtful, well-structured responses.',
      ru: 'Самая сбалансированная модель Anthropic. Превосходна в тонких беседах, тщательном анализе и этических вопросах. Известна продуманными ответами.',
    },
    strengths: {
      en: ['Nuanced thinking', 'Ethical reasoning', 'Long context', 'Coding excellence'],
      ru: ['Тонкое мышление', 'Этичность', 'Длинный контекст', 'Отличный код'],
    },
    bestFor: {
      en: 'Thoughtful analysis, ethical questions, long documents',
      ru: 'Глубокий анализ, этические вопросы, длинные документы',
    },
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    tier: 'free',
    icon: '⚡',
    color: '#4285f4',
    speed: 'very-fast',
    quality: 'good',
    description: {
      en: "Google's fast multimodal model",
      ru: 'Быстрая мультимодальная модель Google',
    },
    details: {
      en: 'Google\'s speed-optimized model with multimodal capabilities. Can understand images, process long documents, and provide quick responses.',
      ru: 'Модель Google, оптимизированная для скорости с мультимодальными возможностями. Понимает изображения, обрабатывает длинные документы.',
    },
    strengths: {
      en: ['Multimodal', 'Very long context', 'Fast', 'Image understanding'],
      ru: ['Мультимодальная', 'Очень длинный контекст', 'Быстрая', 'Понимает картинки'],
    },
    bestFor: {
      en: 'Images, long documents, quick analysis',
      ru: 'Изображения, длинные документы, быстрый анализ',
    },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    tier: 'premium',
    icon: '💎',
    color: '#4285f4',
    speed: 'medium',
    quality: 'excellent',
    description: {
      en: "Google's most capable model",
      ru: 'Самая мощная модель Google',
    },
    details: {
      en: 'Google\'s flagship with 1M+ token context window. Exceptional at processing entire codebases, long documents, and complex multimodal tasks.',
      ru: 'Флагман Google с контекстом 1M+ токенов. Исключительна в обработке целых кодовых баз, длинных документов и сложных мультимодальных задач.',
    },
    strengths: {
      en: ['Massive context', 'Code analysis', 'Multimodal', 'Research tasks'],
      ru: ['Огромный контекст', 'Анализ кода', 'Мультимодальная', 'Исследования'],
    },
    bestFor: {
      en: 'Large codebases, research, long-form content',
      ru: 'Большие проекты, исследования, длинный контент',
    },
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    tier: 'free',
    icon: '🔮',
    color: '#8b5cf6',
    speed: 'fast',
    quality: 'very-good',
    description: {
      en: 'Powerful open-source alternative',
      ru: 'Мощная open-source альтернатива',
    },
    details: {
      en: 'Open-source model with impressive coding and reasoning abilities. Particularly strong in mathematics, logic, and programming tasks. Great value for technical work.',
      ru: 'Open-source модель с впечатляющими способностями к коду и рассуждениям. Особенно сильна в математике, логике и программировании.',
    },
    strengths: {
      en: ['Excellent coding', 'Math & logic', 'Open-source', 'Cost-effective'],
      ru: ['Отличный код', 'Математика и логика', 'Open-source', 'Выгодная'],
    },
    bestFor: {
      en: 'Coding, math problems, technical tasks',
      ru: 'Программирование, математика, технические задачи',
    },
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xai',
    tier: 'premium',
    icon: '🖤',
    color: '#000000',
    speed: 'medium',
    quality: 'excellent',
    description: {
      en: "xAI's conversational model",
      ru: 'Разговорная модель xAI',
    },
    details: {
      en: 'xAI\'s model known for witty, engaging conversations and real-time knowledge. Has a unique personality and can discuss current events with a fresh perspective.',
      ru: 'Модель xAI, известная остроумными беседами и актуальными знаниями. Имеет уникальную личность и свежий взгляд на события.',
    },
    strengths: {
      en: ['Real-time knowledge', 'Witty responses', 'Current events', 'Engaging chat'],
      ru: ['Актуальные знания', 'Остроумие', 'Текущие события', 'Живой диалог'],
    },
    bestFor: {
      en: 'Current events, entertaining chats, unique perspectives',
      ru: 'Новости, развлекательные беседы, уникальный взгляд',
    },
  },
];

// GET /api/models - List available AI models
export async function GET() {
  return NextResponse.json({ models: AI_MODELS });
}
