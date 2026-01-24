'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateChat, useModels } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useTranslation, getLocalizedText, getLocalizedArray } from '@/lib/i18n';

interface Model {
  id: string;
  name: string;
  provider: string;
  tier: string;
  icon: string;
  color: string;
  speed: string;
  quality: string;
  description: { en: string; ru: string };
  details: { en: string; ru: string };
  strengths: { en: string[]; ru: string[] };
  bestFor: { en: string; ru: string };
}

export default function ChatIndexPage() {
  const router = useRouter();
  const createChat = useCreateChat();
  const { data: models } = useModels();
  const { selectedModel, setSelectedModel, language, setLanguage } = useUIStore();
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const t = useTranslation(language);

  const handleNewChat = async (modelId?: string) => {
    const model = modelId || selectedModel;
    try {
      const { chat } = await createChat.mutateAsync({ model });
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const getSpeedLabel = (speed: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      'very-fast': { en: 'Very Fast', ru: 'Очень быстро' },
      'fast': { en: 'Fast', ru: 'Быстро' },
      'medium': { en: 'Medium', ru: 'Средне' },
    };
    return labels[speed]?.[language] || speed;
  };

  const getQualityLabel = (quality: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      'excellent': { en: 'Excellent', ru: 'Отлично' },
      'very-good': { en: 'Very Good', ru: 'Очень хорошо' },
      'good': { en: 'Good', ru: 'Хорошо' },
    };
    return labels[quality]?.[language] || quality;
  };

  const getSpeedColor = (speed: string) => {
    if (speed === 'very-fast') return 'text-green-500';
    if (speed === 'fast') return 'text-blue-500';
    return 'text-yellow-500';
  };

  const getQualityColor = (quality: string) => {
    if (quality === 'excellent') return 'text-purple-500';
    if (quality === 'very-good') return 'text-blue-500';
    return 'text-gray-500';
  };

  const freeModels = models?.filter((m: Model) => m.tier === 'free') || [];
  const premiumModels = models?.filter((m: Model) => m.tier === 'premium') || [];

  const ModelCard = ({ model, isExpanded }: { model: Model; isExpanded: boolean }) => (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        selectedModel === model.id
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
      }`}
      onClick={() => {
        setSelectedModel(model.id);
        setExpandedModel(isExpanded ? null : model.id);
      }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{model.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{model.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {model.provider}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            model.tier === 'premium'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {model.tier === 'premium' ? t.pro : t.free}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {getLocalizedText(model.description, language)}
        </p>

        {/* Speed & Quality indicators */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <svg className={`w-4 h-4 ${getSpeedColor(model.speed)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">{getSpeedLabel(model.speed)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className={`w-4 h-4 ${getQualityColor(model.quality)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">{getQualityLabel(model.quality)}</span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {getLocalizedText(model.details, language)}
          </p>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              {t.strengths}
            </p>
            <div className="flex flex-wrap gap-2">
              {getLocalizedArray(model.strengths, language).map((strength, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              {t.bestFor}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {getLocalizedText(model.bestFor, language)}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewChat(model.id);
            }}
            disabled={createChat.isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createChat.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t.creating}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{t.startChat}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Selected indicator */}
      {selectedModel === model.id && !isExpanded && (
        <div className="absolute top-2 right-12">
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with language toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t.chooseAssistant}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.chooseAssistantSubtitle}
            </p>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === 'ru'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              RU
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.compareHint}
        </p>

        {/* Free Models */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            {t.freeModels}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeModels.map((model: Model) => (
              <ModelCard
                key={model.id}
                model={model}
                isExpanded={expandedModel === model.id}
              />
            ))}
          </div>
        </section>

        {/* Premium Models */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
            {t.premiumModels}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumModels.map((model: Model) => (
              <ModelCard
                key={model.id}
                model={model}
                isExpanded={expandedModel === model.id}
              />
            ))}
          </div>
        </section>

        {/* Quick start button */}
        <div className="text-center pb-8">
          <button
            onClick={() => handleNewChat()}
            disabled={createChat.isPending}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {createChat.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t.creatingChat}</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t.startChatWith} {models?.find((m: Model) => m.id === selectedModel)?.name}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
