'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd: string;
  onSuccess: () => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  currentPeriodEnd,
  onSuccess
}: CancelDialogProps) {
  const [canceling, setCanceling] = useState(false);

  async function handleCancel() {
    setCanceling(true);
    try {
      const response = await apiClient.request('/api/subscription/cancel', {
        method: 'POST',
      });

      if (response.success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      alert(error.message || 'Не удалось отменить подписку');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отменить автопродление?</DialogTitle>
          <DialogDescription>
            Premium подписка продолжит работать до{' '}
            {new Date(currentPeriodEnd).toLocaleDateString('ru-RU')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            После отмены автопродления вы сможете пользоваться Premium до конца оплаченного периода.
            Затем подписка автоматически понизится до Free (10 сообщений в день).
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={canceling}
          >
            Оставить Premium
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={canceling}
          >
            {canceling ? 'Отмена...' : 'Отменить автопродление'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
