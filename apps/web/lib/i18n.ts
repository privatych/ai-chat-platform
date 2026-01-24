export type Language = 'en' | 'ru';

export const translations = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',

    // Auth
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    signingIn: 'Signing in...',
    signingUp: 'Creating account...',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    name: 'Name',
    nameOptional: 'Name (optional)',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',
    passwordMinLength: 'At least 6 characters',
    confirmPasswordPlaceholder: 'Confirm your password',
    namePlaceholder: 'Your name',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    passwordsNoMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',

    // Platform
    platformName: 'AI Chat Platform',
    platformDescription: 'Chat with multiple AI models in one place',
    signInToAccount: 'Sign in to your account',
    createAccount: 'Create your account',

    // Chat
    newChat: '+ New Chat',
    loadingChats: 'Loading chats...',
    noChats: 'No chats yet',
    loadingChat: 'Loading chat...',
    typeMessage: 'Type your message...',
    sendHint: 'Press Enter to send, Shift+Enter for new line',
    startConversation: 'Start a conversation by typing a message below',

    // Models page
    chooseAssistant: 'Choose Your AI Assistant',
    chooseAssistantSubtitle: 'Each model has unique strengths. Pick the one that fits your task.',
    freeModels: 'Free Models',
    premiumModels: 'Premium Models',
    startChat: 'Start Chat',
    startChatWith: 'Start Chat with',
    speed: 'Speed',
    quality: 'Quality',
    bestFor: 'Best for',
    strengths: 'Strengths',
    veryFast: 'Very Fast',
    fast: 'Fast',
    medium: 'Medium',
    excellent: 'Excellent',
    veryGood: 'Very Good',
    good: 'Good',
    pro: 'PRO',
    free: 'FREE',
    recommended: 'Recommended',
    compareHint: 'Click on a model to see details and start chatting',
    creating: 'Creating...',
    creatingChat: 'Creating chat...',

    // Settings
    settings: 'Settings',
    profile: 'Profile',
    appearance: 'Appearance',
    account: 'Account',
    subscription: 'Subscription',
    premiumPlan: 'Premium plan',
    freePlan: 'Free plan',
    messagesToday: 'Messages Today',
    unlimited: 'Unlimited',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',

    // Sidebar
    theme: 'Theme',

    // Chat actions
    rename: 'Rename',
    deleteChat: 'Delete chat',
    confirmDelete: 'Are you sure you want to delete this chat?',
    chatDeleted: 'Chat deleted',
    chatRenamed: 'Chat renamed',
    enterNewName: 'Enter new name',

    // File upload
    attachFile: 'Attach file',
    uploadImage: 'Upload image',
    uploading: 'Uploading...',
    fileTooBig: 'File is too large (max 10MB)',
    invalidFileType: 'Invalid file type',

    // Premium / Subscription
    premiumRequired: 'Premium Required',
    premiumModelMessage: 'This model is available only for premium subscribers.',
    upgradeToPremium: 'Upgrade to Premium',
    upgradeNow: 'Upgrade Now',
    monthlyPrice: '$9.99/month',
    premiumFeatures: 'Premium Features',
    unlimitedMessages: 'Unlimited messages',
    accessAllModels: 'Access to all AI models',
    prioritySupport: 'Priority support',
    noAds: 'No advertisements',
    cancelAnytime: 'Cancel anytime',
    currentPlan: 'Current Plan',
    freeTier: 'Free',
    premiumTier: 'Premium',
    subscribe: 'Subscribe',
    manageSubscription: 'Manage Subscription',
    subscriptionActive: 'Your premium subscription is active',
    trialDays: '7 days free trial',
    paymentMethods: 'Payment Methods',
    securePayment: 'Secure payment via YooKassa',

    // Context / Memory
    contextMemory: 'Context Memory',
    contextSize: 'Context Size',
    contextSizeSmall: 'Small',
    contextSizeMedium: 'Medium',
    contextSizeLarge: 'Large',
    contextSizeSmallDesc: '10 messages, saves tokens',
    contextSizeMediumDesc: '20 messages, balanced',
    contextSizeLargeDesc: '40 messages, best memory',
    contextSizeNote: 'Larger context uses more tokens but remembers more of the conversation',
  },
  ru: {
    // Common
    loading: 'Загрузка...',
    error: 'Ошибка',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',

    // Auth
    signIn: 'Войти',
    signUp: 'Регистрация',
    signOut: 'Выйти',
    signingIn: 'Вход...',
    signingUp: 'Создание аккаунта...',
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    name: 'Имя',
    nameOptional: 'Имя (необязательно)',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Введите пароль',
    passwordMinLength: 'Минимум 6 символов',
    confirmPasswordPlaceholder: 'Подтвердите пароль',
    namePlaceholder: 'Ваше имя',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    passwordsNoMatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен быть минимум 6 символов',

    // Platform
    platformName: 'AI Chat Platform',
    platformDescription: 'Общайтесь с разными AI моделями в одном месте',
    signInToAccount: 'Войдите в аккаунт',
    createAccount: 'Создайте аккаунт',

    // Chat
    newChat: '+ Новый чат',
    loadingChats: 'Загрузка чатов...',
    noChats: 'Пока нет чатов',
    loadingChat: 'Загрузка чата...',
    typeMessage: 'Введите сообщение...',
    sendHint: 'Enter для отправки, Shift+Enter для новой строки',
    startConversation: 'Начните разговор, введя сообщение ниже',

    // Models page
    chooseAssistant: 'Выберите AI-ассистента',
    chooseAssistantSubtitle: 'Каждая модель имеет свои преимущества. Выберите подходящую для вашей задачи.',
    freeModels: 'Бесплатные модели',
    premiumModels: 'Премиум модели',
    startChat: 'Начать чат',
    startChatWith: 'Начать чат с',
    speed: 'Скорость',
    quality: 'Качество',
    bestFor: 'Лучше всего для',
    strengths: 'Сильные стороны',
    veryFast: 'Очень быстро',
    fast: 'Быстро',
    medium: 'Средне',
    excellent: 'Отлично',
    veryGood: 'Очень хорошо',
    good: 'Хорошо',
    pro: 'PRO',
    free: 'FREE',
    recommended: 'Рекомендуем',
    compareHint: 'Нажмите на модель, чтобы увидеть детали и начать чат',
    creating: 'Создание...',
    creatingChat: 'Создание чата...',

    // Settings
    settings: 'Настройки',
    profile: 'Профиль',
    appearance: 'Оформление',
    account: 'Аккаунт',
    subscription: 'Подписка',
    premiumPlan: 'Премиум план',
    freePlan: 'Бесплатный план',
    messagesToday: 'Сообщений сегодня',
    unlimited: 'Безлимит',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
    language: 'Язык',

    // Sidebar
    theme: 'Тема',

    // Chat actions
    rename: 'Переименовать',
    deleteChat: 'Удалить чат',
    confirmDelete: 'Вы уверены, что хотите удалить этот чат?',
    chatDeleted: 'Чат удалён',
    chatRenamed: 'Чат переименован',
    enterNewName: 'Введите новое название',

    // File upload
    attachFile: 'Прикрепить файл',
    uploadImage: 'Загрузить изображение',
    uploading: 'Загрузка...',
    fileTooBig: 'Файл слишком большой (макс. 10МБ)',
    invalidFileType: 'Неподдерживаемый тип файла',

    // Premium / Subscription
    premiumRequired: 'Требуется Premium',
    premiumModelMessage: 'Эта модель доступна только для премиум подписчиков.',
    upgradeToPremium: 'Перейти на Premium',
    upgradeNow: 'Обновить сейчас',
    monthlyPrice: '999 ₽/месяц',
    premiumFeatures: 'Преимущества Premium',
    unlimitedMessages: 'Безлимитные сообщения',
    accessAllModels: 'Доступ ко всем AI моделям',
    prioritySupport: 'Приоритетная поддержка',
    noAds: 'Без рекламы',
    cancelAnytime: 'Отмена в любое время',
    currentPlan: 'Текущий план',
    freeTier: 'Бесплатный',
    premiumTier: 'Премиум',
    subscribe: 'Подписаться',
    manageSubscription: 'Управление подпиской',
    subscriptionActive: 'Ваша премиум подписка активна',
    trialDays: '7 дней бесплатно',
    paymentMethods: 'Способы оплаты',
    securePayment: 'Безопасная оплата через ЮKassa',

    // Context / Memory
    contextMemory: 'Память контекста',
    contextSize: 'Размер контекста',
    contextSizeSmall: 'Маленький',
    contextSizeMedium: 'Средний',
    contextSizeLarge: 'Большой',
    contextSizeSmallDesc: '10 сообщений, экономит токены',
    contextSizeMediumDesc: '20 сообщений, баланс',
    contextSizeLargeDesc: '40 сообщений, лучшая память',
    contextSizeNote: 'Больший контекст использует больше токенов, но лучше запоминает разговор',
  },
};

export function useTranslation(language: Language) {
  return translations[language];
}

// Helper to get localized text from model descriptions
export function getLocalizedText(
  obj: { en: string; ru: string } | string | undefined,
  language: Language
): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[language] || obj.en || '';
}

export function getLocalizedArray(
  obj: { en: string[]; ru: string[] } | string[] | undefined,
  language: Language
): string[] {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return obj[language] || obj.en || [];
}
