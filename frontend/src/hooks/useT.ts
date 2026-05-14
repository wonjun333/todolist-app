import { useCallback } from 'react';
import { useLangStore } from '../stores/langStore';
import { translations } from '../i18n/translations';

export function useT() {
  const lang = useLangStore((s) => s.lang);

  const t = useCallback((key: string): string => {
    const parts = key.split('.');
    let value: unknown = translations[lang];
    for (const part of parts) {
      if (value && typeof value === 'object' && !Array.isArray(value) && part in (value as object)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        let fallback: unknown = translations['ko'];
        for (const p of parts) {
          if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && p in (fallback as object)) {
            fallback = (fallback as Record<string, unknown>)[p];
          } else return key;
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof value === 'string' ? value : key;
  }, [lang]);

  const ta = useCallback((key: string): string[] => {
    const parts = key.split('.');
    let value: unknown = translations[lang];
    for (const part of parts) {
      if (value && typeof value === 'object' && part in (value as object)) {
        value = (value as Record<string, unknown>)[part];
      } else return [];
    }
    return Array.isArray(value) ? value as string[] : [];
  }, [lang]);

  return { t, ta, lang };
}
