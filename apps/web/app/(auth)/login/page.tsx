'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogin } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { language, setLanguage } = useUIStore();
  const t = useTranslation(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login.mutateAsync({ email, password });
      router.push('/chat');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#343541] py-12 px-4 sm:px-6 lg:px-8">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1 bg-white dark:bg-[#40414f] border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-gray-100 dark:bg-[#565869] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ru')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === 'ru'
                ? 'bg-gray-100 dark:bg-[#565869] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            RU
          </button>
        </div>
      </div>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#10a37f] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.platformName}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t.signInToAccount}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-[#40414f] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {login.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {login.error.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full"
                placeholder={t.passwordPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 px-4 bg-[#10a37f] hover:bg-[#0d8c6d] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.signingIn}
                </span>
              ) : (
                t.signIn
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.noAccount}{' '}
              <Link href="/register" className="font-medium text-[#10a37f] hover:text-[#0d8c6d] transition-colors">
                {t.signUp}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Powered by OpenRouter AI
        </p>
      </div>
    </div>
  );
}
