'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setAuth } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    async function verifyEmail() {
      try {
        const response = await apiClient.request<{
          message: string;
          token?: string;
          user?: any;
        }>('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        if (response.success && response.data) {
          setStatus('success');
          setMessage(response.data.message);

          // If token was returned, log the user in
          if (response.data.token && response.data.user) {
            setAuth(response.data.token, response.data.user);

            // Redirect to chat after 2 seconds
            setTimeout(() => {
              router.push('/chat');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage(response.error?.message || 'Ошибка при подтверждении email');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          'Не удалось подтвердить email. Попробуйте снова.'
        );
      }
    }

    verifyEmail();
  }, [token, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            {status === 'no-token' && (
              <Mail className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Подтверждение email...'}
            {status === 'success' && 'Email подтверждён!'}
            {status === 'error' && 'Ошибка подтверждения'}
            {status === 'no-token' && 'Токен не найден'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Пожалуйста, подождите...'}
            {status === 'success' && message}
            {status === 'error' && message}
            {status === 'no-token' && 'Отсутствует токен подтверждения в URL'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Перенаправление в чат через 2 секунды...
              </p>
              <Link href="/chat" className="block">
                <Button className="w-full">
                  Перейти в чат сейчас
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Link href="/login" className="block">
                <Button className="w-full">
                  Войти
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full">
                  Зарегистрироваться заново
                </Button>
              </Link>
            </div>
          )}

          {status === 'no-token' && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Проверьте ссылку из письма и попробуйте снова.
              </p>
              <Link href="/login" className="block">
                <Button className="w-full">
                  Войти
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <CardTitle className="text-2xl">Загрузка...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
