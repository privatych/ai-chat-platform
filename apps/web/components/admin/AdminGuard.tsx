'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      // Show 403 error or redirect to home
      router.push('/?error=forbidden');
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, user, hasHydrated, router]);

  // Show loading while hydrating or checking
  if (!hasHydrated || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role
  return <>{children}</>;
}
