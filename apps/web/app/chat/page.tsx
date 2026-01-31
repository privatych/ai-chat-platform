'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AI_MODELS } from '@ai-chat/shared';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadChats();
  }, [isAuthenticated, router]);

  const loadChats = async () => {
    const response = await apiClient.getChats();
    if (response.success && response.data) {
      setChats(response.data);
    }
  };

  const createNewChat = async () => {
    const response = await apiClient.createChat('New Chat', selectedModel);
    if (response.success && response.data) {
      setChats([response.data, ...chats]);
      setCurrentChatId(response.data.id);
    }
  };

  const availableModels = user?.subscriptionTier === 'premium'
    ? [...AI_MODELS.free, ...AI_MODELS.premium]
    : [...AI_MODELS.free];

  return (
    <div className="flex h-screen">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
      />
      <ChatInterface
        chatId={currentChatId}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
      />
    </div>
  );
}
