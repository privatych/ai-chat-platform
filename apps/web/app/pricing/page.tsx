'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function PricingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const { language } = useUIStore();
  const t = useTranslation(language);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to create subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      text: t.unlimitedMessages,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      text: t.accessAllModels,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      text: t.prioritySupport,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      text: t.noAds,
    },
  ];

  const premiumModels = [
    { name: 'GPT-4o', icon: '🔵', provider: 'OpenAI' },
    { name: 'Claude 3.5 Sonnet', icon: '🟡', provider: 'Anthropic' },
    { name: 'Gemini 1.5 Pro', icon: '💎', provider: 'Google' },
    { name: 'Grok 2', icon: '🖤', provider: 'xAI' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#343541]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#10a37f] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">{t.loading}</span>
        </div>
      </div>
    );
  }

  const isPremium = user?.tier === 'premium';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#343541]">
      {/* Header */}
      <header className="bg-white dark:bg-[#40414f] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#565869] rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.upgradeToPremium}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'ru' ? 'Разблокируйте полный потенциал AI' : 'Unlock the Full Potential of AI'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {language === 'ru'
              ? 'Получите доступ к самым мощным AI моделям и безлимитным сообщениям'
              : 'Get access to the most powerful AI models and unlimited messages'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Pricing Card */}
          <div className="bg-white dark:bg-[#40414f] rounded-2xl border-2 border-[#10a37f] shadow-lg p-8">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {language === 'ru' ? '999 ₽' : '$9.99'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                /{language === 'ru' ? 'месяц' : 'month'}
              </span>
            </div>
            <p className="text-sm text-[#10a37f] font-medium mb-6">{t.trialDays}</p>

            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#10a37f]/10 flex items-center justify-center text-[#10a37f]">
                    {feature.icon}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10a37f]/10 text-[#10a37f] rounded-lg font-medium mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t.subscriptionActive}
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-[#10a37f] hover:bg-[#0d8c6d] text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{language === 'ru' ? 'Обработка...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>{t.subscribe}</span>
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              {t.cancelAnytime}
            </p>
          </div>

          {/* Premium Models */}
          <div className="bg-white dark:bg-[#40414f] rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              {language === 'ru' ? 'Премиум модели' : 'Premium Models'}
            </h3>

            <div className="space-y-4">
              {premiumModels.map((model, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#565869] rounded-xl"
                >
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{model.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{model.provider}</p>
                  </div>
                  <span className="ml-auto px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium rounded">
                    PRO
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-[#565869] rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ru'
                  ? 'Бесплатные модели (GPT-4o Mini, Claude 3 Haiku, Gemini Flash, DeepSeek) доступны всем пользователям с лимитом 50 сообщений в день.'
                  : 'Free models (GPT-4o Mini, Claude 3 Haiku, Gemini Flash, DeepSeek) are available to all users with a limit of 50 messages per day.'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t.securePayment}
          </p>
        </div>
      </main>
    </div>
  );
}
