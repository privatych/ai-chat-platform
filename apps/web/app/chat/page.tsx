'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Brain } from 'lucide-react';
import { AI_MODELS } from '@ai-chat/shared';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth, hasHydrated } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadChats();
  }, [isAuthenticated, hasHydrated, router]);

  const loadChats = async () => {
    const response = await apiClient.getChats();
    if (response.success && response.data) {
      setChats(response.data);
    }
  };

  const createNewChat = async () => {
    const response = await apiClient.createChat(
      'Новый чат',
      selectedModel,
      selectedProjectId || undefined
    );
    if (response.success && response.data) {
      setChats([response.data, ...chats]);
      setCurrentChatId(response.data.id);
      toast.success('Чат создан');
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    const response = await apiClient.renameChat(chatId, newTitle);
    if (response.success && response.data) {
      setChats(chats.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      toast.success('Чат переименован');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const response = await apiClient.deleteChat(chatId);
    if (response.success) {
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      toast.success('Чат удалён');
    } else {
      console.error('[Delete Chat] Failed:', response.error);
      toast.error('Не удалось удалить чат');
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const availableModels = user?.subscriptionTier === 'premium'
    ? [...AI_MODELS.free, ...AI_MODELS.premium]
    : [...AI_MODELS.free];

  // Show loading while hydrating from localStorage
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Chat Platform</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <UserMenu onLogout={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Chat Interface */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          selectedProjectId={selectedProjectId}
          onSelectChat={setCurrentChatId}
          onNewChat={createNewChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onProjectChange={setSelectedProjectId}
        />
        <ChatInterface
          chatId={currentChatId}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableModels={availableModels}
        />
      </div>
    </div>
  );
}
