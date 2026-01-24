'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser, useLogout } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

type Theme = 'light' | 'dark' | 'system';

type ContextSize = 'small' | 'medium' | 'large';

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const { theme, setTheme, language, setLanguage, contextSize, setContextSize } = useUIStore();
  const t = useTranslation(language);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

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

  if (!user) {
    return null;
  }

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: t.light,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: t.dark,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: t.system,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#343541]">
      {/* Header */}
      <header className="bg-white dark:bg-[#40414f] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#565869] rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings}</h1>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#565869] rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-white dark:bg-[#40414f] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === 'ru'
                  ? 'bg-white dark:bg-[#40414f] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              RU
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <section className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t.profile}</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#10a37f] flex items-center justify-center text-white text-xl font-medium">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.name || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.subscription}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.tier === 'premium' ? t.premiumPlan : t.freePlan}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.tier !== 'premium' && (
                    <Link
                      href="/pricing"
                      className="px-3 py-1 bg-[#10a37f] text-white text-xs font-medium rounded-full hover:bg-[#0d8c6d] transition-colors"
                    >
                      {language === 'ru' ? 'Улучшить' : 'Upgrade'}
                    </Link>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.tier === 'premium'
                      ? 'bg-[#10a37f] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {user.tier === 'premium' ? 'PRO' : 'FREE'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.messagesToday}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.tier === 'premium' ? t.unlimited : `${user.messagesUsedToday} / 50`}
                  </p>
                </div>
                {user.tier !== 'premium' && (
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10a37f] rounded-full"
                      style={{ width: `${Math.min((user.messagesUsedToday / 50) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t.appearance}</h2>

            <div className="grid grid-cols-3 gap-3">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                    theme === themeOption.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className={theme === themeOption.value ? 'text-[#10a37f]' : 'text-gray-500 dark:text-gray-400'}>
                    {themeOption.icon}
                  </span>
                  <span className={`text-sm font-medium ${
                    theme === themeOption.value ? 'text-[#10a37f]' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {themeOption.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t.language}</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-colors ${
                  language === 'en'
                    ? 'border-[#10a37f] bg-[#10a37f]/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className={`font-medium ${
                  language === 'en' ? 'text-[#10a37f]' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  English
                </span>
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-colors ${
                  language === 'ru'
                    ? 'border-[#10a37f] bg-[#10a37f]/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className={`font-medium ${
                  language === 'ru' ? 'text-[#10a37f]' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Русский
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Context Memory Section */}
        <section className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t.contextMemory}</h2>

            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'small' as ContextSize, label: t.contextSizeSmall, desc: t.contextSizeSmallDesc },
                { value: 'medium' as ContextSize, label: t.contextSizeMedium, desc: t.contextSizeMediumDesc },
                { value: 'large' as ContextSize, label: t.contextSizeLarge, desc: t.contextSizeLargeDesc },
              ]).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setContextSize(option.value)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-lg border transition-colors ${
                    contextSize === option.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className={`font-medium ${
                    contextSize === option.value ? 'text-[#10a37f]' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {option.desc}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {t.contextSizeNote}
            </p>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t.account}</h2>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
            >
              {t.signOut}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
