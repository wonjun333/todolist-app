import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useThemeStore } from '../../stores/themeStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  return <>{children}</>;
}
