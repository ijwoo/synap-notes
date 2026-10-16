import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        apply(theme);
        set({ theme });
      },
      toggle: () => {
        const t: Theme = get().theme === 'dark' ? 'light' : 'dark';
        apply(t);
        set({ theme: t });
      },
    }),
    {
      name: 'synap-theme',
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.theme);
      },
    },
  ),
);
