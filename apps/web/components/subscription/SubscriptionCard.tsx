'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { CancelDialog } from './CancelDialog';

interface SubscriptionCardProps {
  status: any;
  onUpdate: () => void;
}

export function SubscriptionCard({ status, onUpdate }: SubscriptionCardProps) {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isPremium = status?.tier === 'premium';
  const isGracePeriod = status?.status === 'grace_period';

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const response = await apiClient.request('/api/subscription/create-payment', {
        method: 'POST',
      });

      if (response.success && response.data?.confirmationUrl) {
        window.location.href = response.data.confirmationUrl;
      }
    } catch (error: any) {
      alert(error.message || 'Не удалось создать платёж');
    } finally {
      setUpgrading(false);
    }
  }

  if (isPremium) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Premium подписка</CardTitle>
              <Badge variant={isGracePeriod ? 'destructive' : 'default'}>
                {isGracePeriod ? 'Проблема с оплатой' : 'Активна'}
              </Badge>
            </div>
            <CardDescription>
              Безлимитный доступ ко всем возможностям
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isGracePeriod && status.gracePeriodEndsAt && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">⚠️ Проблема с оплатой!</h3>
                <p className="text-sm">
                  Premium истекает {new Date(status.gracePeriodEndsAt).toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm mt-2">
                  Проверьте способ оплаты или обновите карту
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Статус:</span>
                <span>Активна до {new Date(status.currentPeriodEnd).toLocaleDateString('ru-RU')}</span>
              </div>

              {status.nextPaymentDate && status.autoRenew && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Следующее списание:</span>
                  <span>{new Date(status.nextPaymentDate).toLocaleDateString('ru-RU')} - 1990₽</span>
                </div>
              )}

              {!status.autoRenew && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Автопродление:</span>
                  <span className="text-destructive">Отменено</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Ваши преимущества:</h4>
              <ul className="space-y-1 text-sm">
                <li>✓ Безлимитные сообщения</li>
                <li>✓ Доступ ко всем AI моделям</li>
                <li>✓ Приоритетная поддержка</li>
                <li>✓ Без рекламы</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter>
            {status.autoRenew && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                Отменить автопродление
              </Button>
            )}
          </CardFooter>
        </Card>

        <CancelDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          currentPeriodEnd={status.currentPeriodEnd}
          onSuccess={onUpdate}
        />
      </>
    );
  }

  // Free tier
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Бесплатная подписка</CardTitle>
          <Badge variant="secondary">Free</Badge>
        </div>
        <CardDescription>
          Ограниченный доступ
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {status?.messagesUsedToday || 0} / {status?.messagesLimit || 10}
          </div>
          <p className="text-sm text-muted-foreground">
            Сообщений использовано сегодня
          </p>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Premium преимущества:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Безлимитные сообщения</li>
            <li>✓ Доступ ко всем моделям</li>
            <li>✓ Приоритетная поддержка</li>
            <li>✓ Без рекламы</li>
          </ul>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">1990₽</span>
            <span className="text-muted-foreground">/месяц</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Автопродление, отмена в любой момент
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="w-full"
          size="lg"
        >
          {upgrading ? 'Загрузка...' : 'Перейти на Premium'}
        </Button>
      </CardFooter>
    </Card>
  );
}
