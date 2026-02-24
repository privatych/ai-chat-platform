'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { Crown, Sparkles } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (hasHydrated && isAuthenticated) {
      loadStatus();
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function loadStatus() {
    try {
      const response = await apiClient.request('/api/subscription/status');
      if (response.success) {
        setStatus(response.data);

        // Update user data in store if tier changed
        if (response.data.tier) {
          updateUser({
            subscriptionTier: response.data.tier,
            subscriptionExpiresAt: response.data.currentPeriodEnd || null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!hasHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const isPremium = status?.tier === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            {isPremium ? (
              <Crown className="h-8 w-8 text-primary" />
            ) : (
              <Sparkles className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3">
            {isPremium ? 'Premium подписка' : 'Управление подпиской'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPremium
              ? 'Вы используете все возможности платформы'
              : 'Получите доступ ко всем возможностям AI Chat Platform'
            }
          </p>
        </div>

        {/* Subscription Card */}
        <SubscriptionCard status={status} onUpdate={loadStatus} />

        {/* Features Comparison */}
        {!isPremium && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold text-lg mb-4">Бесплатный план</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 10 сообщений в день</li>
                <li>✓ Базовые модели</li>
                <li>✓ Стандартная поддержка</li>
                <li className="line-through">Продвинутые модели</li>
                <li className="line-through">Безлимитные сообщения</li>
                <li className="line-through">Приоритетная поддержка</li>
              </ul>
            </div>

            <div className="p-6 rounded-lg border-2 border-primary bg-primary/5 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-4">Premium</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Безлимитные сообщения</li>
                <li>✓ Все модели GPT-4, Claude, Gemini</li>
                <li>✓ Приоритетная поддержка</li>
                <li>✓ Ранний доступ к новым функциям</li>
                <li>✓ История чатов без ограничений</li>
                <li>✓ Экспорт диалогов</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
