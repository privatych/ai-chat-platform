'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PlusCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { ContextEditor } from '@/components/projects/ContextEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChatSidebarProps {
  chats: any[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onDeleteChat: (chatId: string) => Promise<void>;
  onProjectChange?: (projectId: string | null) => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onProjectChange,
}: ChatSidebarProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleRenameClick = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChat(chat);
    setDeleteDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (selectedChat && newTitle.trim()) {
      await onRenameChat(selectedChat.id, newTitle.trim());
      setRenameDialogOpen(false);
      setSelectedChat(null);
      setNewTitle('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedChat) {
      await onDeleteChat(selectedChat.id);
      setDeleteDialogOpen(false);
      setSelectedChat(null);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (onProjectChange) {
      onProjectChange(projectId);
    }
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Group chats by projectId
  const groupedChats = chats.reduce((groups: Record<string, any[]>, chat) => {
    const key = chat.projectId || 'no-project';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(chat);
    return groups;
  }, {});

  return (
    <>
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        {/* Project Selector */}
        <div className="p-4 border-b space-y-2">
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectChange={handleProjectChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsContextDialogOpen(true)}
            disabled={!selectedProjectId}
          >
            <Settings className="mr-2 h-4 w-4" />
            Редактировать контекст
          </Button>
        </div>

        <div className="p-4 border-b">
          <Button onClick={onNewChat} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Новый чат
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {Object.entries(groupedChats).map(([groupId, groupChats]) => {
              const isCollapsed = collapsedGroups.has(groupId);
              const isNoProject = groupId === 'no-project';
              const groupName = isNoProject ? 'Без проекта' : (groupChats[0]?.project?.name || 'Проект');

              return (
                <div key={groupId} className="space-y-1">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(groupId)}
                    className="w-full flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <FolderOpen className="h-3 w-3" />
                    <span className="truncate flex-1 text-left">{groupName}</span>
                    <span className="text-xs">{groupChats.length}</span>
                  </button>

                  {/* Group Chats */}
                  {!isCollapsed && (
                    <div className="space-y-1 pl-2">
                      {groupChats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                            currentChatId === chat.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <button
                            onClick={() => onSelectChat(chat.id)}
                            className="flex-1 text-left truncate"
                          >
                            <div className="truncate font-medium">{chat.title}</div>
                            <div className="text-xs opacity-70 truncate">{chat.model}</div>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handleRenameClick(chat, e)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Переименовать
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(chat, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать чат</DialogTitle>
            <DialogDescription>
              Введите новое название для чата
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название чата"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleRenameSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Чат "{selectedChat?.title}" и все сообщения в нём будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Context Editor Dialog */}
      <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Контекст проекта</DialogTitle>
            <DialogDescription>
              Управление информацией для AI в этом проекте
            </DialogDescription>
          </DialogHeader>
          <ContextEditor projectId={selectedProjectId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
