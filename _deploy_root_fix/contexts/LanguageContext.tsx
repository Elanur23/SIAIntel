'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDictionary, Locale, Dictionary } from '@/lib/i18n/dictionaries'

interface LanguageContextType {
  currentLang: Locale
  setLanguage: (lang: Locale) => void
  t: (key: string) => string
  dict: Dictionary
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children, initialLang = 'en' }: { children: ReactNode, initialLang?: Locale }) {
  const [currentLang, setCurrentLang] = useState<Locale>(initialLang)
  const [dict, setDict] = useState<Dictionary>(getDictionary(initialLang))
  const isRTL = currentLang === 'ar'

  useEffect(() => {
    setDict(getDictionary(currentLang))
    // Update cookie for Next.js middleware/server components
    document.cookie = `NEXT_LOCALE=${String(currentLang)}; path=/; max-age=31536000`

    // Apply RTL to HTML tag
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = String(currentLang)
    }
  }, [currentLang, isRTL])

  const setLanguage = (lang: Locale) => {
    setCurrentLang(lang)
  }

  // Improved t function that can access nested objects using dot notation (e.g., 'nav.home')
  const t = (path: string): string => {
    const keys = path.split('.')
    let result: any = dict

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        // Fallback to English if key missing in current dict
        const enDict = getDictionary('en')
        let enResult: any = enDict
        for (const enKey of keys) {
          if (enResult && typeof enResult === 'object' && enKey in enResult) {
            enResult = enResult[enKey]
          } else {
            return path // Return the path itself if not found anywhere
          }
        }
        return typeof enResult === 'string' ? enResult : path
      }
    }

    return typeof result === 'string' ? result : path
  }

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t, dict, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

// Server-side translation helper for pages that can't use hooks
export function getT(lang: string) {
  const dict = getDictionary(lang as Locale)
  return (path: string): string => {
    const keys = path.split('.')
    let result: any = dict

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return path
      }
    }

    return typeof result === 'string' ? result : path
  }
}
