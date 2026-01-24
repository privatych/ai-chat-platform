import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ru';
type ContextSize = 'small' | 'medium' | 'large';

interface UIState {
  sidebarOpen: boolean;
  selectedModel: string;
  theme: Theme;
  language: Language;
  contextSize: ContextSize;
  toggleSidebar: () => void;
  setSelectedModel: (model: string) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setContextSize: (size: ContextSize) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      selectedModel: 'gpt-4o-mini',
      theme: 'system',
      language: 'ru',
      contextSize: 'medium',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setContextSize: (contextSize) => set({ contextSize }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        selectedModel: state.selectedModel,
        language: state.language,
        contextSize: state.contextSize,
      }),
    }
  )
);
