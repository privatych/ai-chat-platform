'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#343541]">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#10a37f] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}
