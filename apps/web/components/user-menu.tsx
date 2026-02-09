'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User,
  LogOut,
  Settings,
  Crown,
  Calendar,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { RATE_LIMITS } from '@ai-chat/shared';
import { toast } from 'sonner';

interface UsageStats {
  messagesUsedToday: number;
  tokensUsedToday: number;
}

interface UserMenuProps {
  onLogout: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuthStore();
  const [usageStats, setUsageStats] = useState<UsageStats>({
    messagesUsedToday: 0,
    tokensUsedToday: 0,
  });

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    const response = await apiClient.getUsageStats();
    if (response.success && response.data) {
      setUsageStats(response.data);
    }
  };

  if (!user) return null;

  const tier = user.subscriptionTier as 'free' | 'premium';
  const limits = RATE_LIMITS[tier];

  const messagesPercentage = (usageStats.messagesUsedToday / limits.messagesPerDay) * 100;
  const tokensPercentage = (usageStats.tokensUsedToday / limits.maxTokensPerMessage) * 100;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Бессрочно';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPremium = tier === 'premium';

  const handleSettings = () => {
    toast.info('Настройки скоро будут доступны');
  };

  const handleUpgradeToPremium = () => {
    toast.info('Страница оплаты скоро будет доступна');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{user.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>

            {/* Subscription Badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              isPremium
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                : 'bg-secondary'
            }`}>
              {isPremium && <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
              <div className="flex-1">
                <p className="text-xs font-medium">
                  {isPremium ? 'Premium' : 'Free Plan'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {isPremium
                      ? `До ${formatDate(user.subscriptionExpiresAt)}`
                      : 'Базовый доступ'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Usage Stats */}
        <div className="px-2 py-3 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Сообщения сегодня</span>
              </div>
              <span className="text-muted-foreground">
                {usageStats.messagesUsedToday} / {limits.messagesPerDay}
              </span>
            </div>
            <Progress value={messagesPercentage} className="h-1.5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Лимит токенов</span>
              </div>
              <span className="text-muted-foreground">
                {limits.maxTokensPerMessage.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Макс. токенов на запрос
            </div>
          </div>

          {!isPremium && (
            <Button className="w-full" size="sm" variant="default" onClick={handleUpgradeToPremium}>
              <Crown className="mr-2 h-4 w-4" />
              Перейти на Premium
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Настройки</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
