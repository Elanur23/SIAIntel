import { create } from 'zustand'

export type Language = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar' | 'ru' | 'jp' | 'zh'

interface LanguageStore {
  currentLanguage: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: 'en',
  setLanguage: (lang) => set({ currentLanguage: lang }),
}))

export const languageFlags: Record<Language, string> = {
  en: '🇺🇸',
  tr: '🇹🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  ar: '🇦🇪',
  ru: '🇷🇺',
  jp: '🇯🇵',
  zh: '🇨🇳',
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  ru: 'Русский',
  jp: '日本語',
  zh: '中文',
}
