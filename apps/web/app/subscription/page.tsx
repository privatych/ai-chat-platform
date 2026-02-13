'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
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

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Подписка</h1>
      <SubscriptionCard status={status} onUpdate={loadStatus} />
    </div>
  );
}
