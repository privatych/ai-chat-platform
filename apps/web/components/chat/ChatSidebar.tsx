'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';

interface ChatSidebarProps {
  chats: any[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentChatId === chat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="truncate">{chat.title}</div>
              <div className="text-xs opacity-70 truncate">{chat.model}</div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
