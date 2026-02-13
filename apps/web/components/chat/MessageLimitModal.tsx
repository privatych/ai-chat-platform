'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MessageLimitModalProps {
  open: boolean;
  onClose: () => void;
}

export function MessageLimitModal({ open, onClose }: MessageLimitModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/subscription');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Лимит сообщений исчерпан</DialogTitle>
          <DialogDescription>
            Вы использовали все 10 бесплатных сообщений сегодня.
            Новые сообщения будут доступны завтра.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h4 className="font-semibold text-lg">Получите безлимитный доступ</h4>
            <p className="text-2xl font-bold text-primary">
              Premium подписка - 1990₽/месяц
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Неограниченные сообщения</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Все AI модели</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Без рекламы</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button onClick={handleUpgrade}>
            Получить Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
