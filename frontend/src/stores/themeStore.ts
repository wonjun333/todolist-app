import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
}));
