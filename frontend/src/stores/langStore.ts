import { create } from 'zustand';
import type { LangCode } from '../i18n/translations';

interface LangState {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'ko',
  setLang: (lang) => set({ lang }),
}));
