'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';

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

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a chat or create a new one to get started
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat</h2>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          availableModels={availableModels}
        />
      </div>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <MessageInput
        chatId={chatId}
        onMessagesUpdate={setMessages}
        onStreamingChange={setIsStreaming}
      />
    </div>
  );
}
