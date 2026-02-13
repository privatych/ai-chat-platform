'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import { MessageLimitModal } from './MessageLimitModal';
import { apiClient } from '@/lib/api-client';

interface ChatInterfaceProps {
  chatId: string | null;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: any[];
}

export function ChatInterface({
  chatId,
  selectedModel,
  onModelChange,
  availableModels,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      setMessages([]); // Clear immediately
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const loadMessages = async () => {
    if (!chatId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.getMessages(chatId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a chat or create a new one to get started
      </div>
    );
  }

  const currentModel = availableModels.find(m => m.id === selectedModel);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">Чат</h2>
          {currentModel && (
            <p className="text-xs text-muted-foreground">
              Модель: {currentModel.name} ({currentModel.provider})
            </p>
          )}
        </div>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          availableModels={availableModels}
        />
      </div>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <MessageInput
        chatId={chatId}
        selectedModel={selectedModel}
        onMessagesUpdate={setMessages}
        onStreamingChange={setIsStreaming}
        onMessageLimitExceeded={() => setShowLimitModal(true)}
      />
      <MessageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}
