import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store';

// API base URL - change this to your actual server URL
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth hooks
export function useLogin() {
  const { setUser, saveToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return fetchAPI<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await saveToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRegister() {
  const { setUser, saveToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      return fetchAPI<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await saveToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useCurrentUser() {
  const { token, setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await fetchAPI<{ user: any }>('/auth/me', { token });
      setUser(data.user);
      return data.user;
    },
    enabled: !!token,
    retry: false,
  });
}

// Chat hooks
export function useChats() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const data = await fetchAPI<{ chats: any[] }>('/chats', { token: token! });
      return data.chats;
    },
    enabled: !!token,
  });
}

export function useChat(chatId: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const data = await fetchAPI<{ chat: any; messages: any[] }>(
        `/chats/${chatId}`,
        { token: token! }
      );
      return data;
    },
    enabled: !!chatId && !!token,
  });
}

export function useCreateChat() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { model: string; title?: string }) => {
      return fetchAPI<{ chat: any }>('/chats', {
        method: 'POST',
        body: JSON.stringify(data),
        token: token!,
      });
    },
    onSuccess: () => {
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
    staleTime: 60 * 60 * 1000,
  });
}

// Send message (non-streaming for mobile simplicity)
export function useSendMessage(chatId: string) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Read the stream and collect full response
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
