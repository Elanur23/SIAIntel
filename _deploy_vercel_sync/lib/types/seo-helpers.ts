/**
 * SEO HELPERS - Type-safe SEO content access
 * 
 * Helpers for accessing SEO content with strict null checking
 */

import type { Language } from '@/lib/sia-news/types'

/**
 * Safe SEO content access with fallback to English
 */
export function getSeoContent<T>(
  seoMap: Record<string, T>,
  lang: string,
  fallbackLang: string = 'en'
): T {
  const content = seoMap[lang] ?? seoMap[fallbackLang]
  
  if (!content) {
    throw new Error(`SEO content not found for lang: ${lang} or fallback: ${fallbackLang}`)
  }
  
  return content
}

/**
 * Safe language-specific content access
 */
export function getLanguageContent<T>(
  contentMap: Partial<Record<Language, T>>,
  lang: Language,
  fallback: T
): T {
  return contentMap[lang] ?? fallback
}

/**
 * Assert SEO content exists
 */
export function assertSeoContent<T>(
  content: T | undefined,
  lang: string
): asserts content is T {
  if (!content) {
    throw new Error(`SEO content missing for language: ${lang}`)
  }
}
