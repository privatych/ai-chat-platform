import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'premium';
  messagesUsedToday: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  loadToken: () => Promise<void>;
  saveToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await SecureStore.deleteItemAsync('auth-token');
    set({ user: null, token: null });
  },
  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth-token');
      set({ token, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  saveToken: async (token: string) => {
    await SecureStore.setItemAsync('auth-token', token);
    set({ token });
  },
}));

interface UIState {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedModel: 'gpt-4o-mini',
  setSelectedModel: (selectedModel) => set({ selectedModel }),
}));
