'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store';

const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth hooks
export function useCurrentUser() {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const data = await fetchAPI<{ user: any }>('/auth/me');
      setUser(data.user);
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const { setUser, setToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return fetchAPI<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRegister() {
  const { setUser, setToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      return fetchAPI<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return fetchAPI('/auth/me', { method: 'DELETE' });
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Chat hooks
export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const data = await fetchAPI<{ chats: any[] }>('/chats');
      return data.chats;
    },
  });
}

export function useChat(chatId: string) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const data = await fetchAPI<{ chat: any; messages: any[] }>(
        `/chats/${chatId}`
      );
      return data;
    },
    enabled: !!chatId,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { model: string; title?: string }) => {
      return fetchAPI<{ chat: any }>('/chats', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      return fetchAPI(`/chats/${chatId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useUpdateChat(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title?: string; model?: string }) => {
      return fetchAPI<{ chat: any }>(`/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// Models hook
export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const data = await fetchAPI<{ models: any[] }>('/models');
      return data.models;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Streaming message hook
export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      attachments,
      contextSize,
      onChunk,
    }: {
      content: string;
      attachments?: Array<{ url: string; filename: string; type: string; size: number }>;
      contextSize?: 'small' | 'medium' | 'large';
      onChunk?: (chunk: string) => void;
    }) => {
      const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments, contextSize }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'Failed to send message');
        error.premiumRequired = errorData.premiumRequired;
        error.limitReached = errorData.limitReached;
        throw error;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.chunk) {
                  fullResponse += parsed.chunk;
                  onChunk?.(parsed.chunk);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      return fullResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
