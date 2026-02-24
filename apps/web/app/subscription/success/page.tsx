'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to subscription page after 5 seconds
    const timer = setTimeout(() => {
      router.push('/subscription');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Оплата прошла успешно!</CardTitle>
          <CardDescription>
            Ваша Premium подписка активируется в течение нескольких минут
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2">✅ Платёж обработан</p>
            <p className="mb-2">⏳ Активация подписки...</p>
            <p className="text-muted-foreground">
              Обычно это занимает до 2 минут. Вы можете обновить страницу подписки.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/subscription')}
              className="flex-1"
            >
              Перейти к подписке
            </Button>
            <Button
              onClick={() => router.push('/chat')}
              variant="outline"
              className="flex-1"
            >
              Начать чат
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
