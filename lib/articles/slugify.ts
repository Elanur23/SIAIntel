/**
 * Multi-language Slugify Utility
 * Handles Turkish, Arabic, Japanese, Chinese, and other languages
 */

import type { SupportedLang } from './types'

/**
 * Turkish character map
 */
const TURKISH_MAP: Record<string, string> = {
  ğ: 'g',
  Ğ: 'G',
  ü: 'u',
  Ü: 'U',
  ş: 's',
  Ş: 'S',
  ı: 'i',
  İ: 'I',
  ö: 'o',
  Ö: 'O',
  ç: 'c',
  Ç: 'C',
}

/**
 * Basic Arabic transliteration map
 */
const ARABIC_MAP: Record<string, string> = {
  ا: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
}

/**
 * Slugify text based on language
 */
export function slugify(text: string, lang: SupportedLang): string {
  let slug = text.toLowerCase().trim()

  // Language-specific transformations
  switch (lang) {
    case 'tr':
      // Turkish character replacement
      Object.entries(TURKISH_MAP).forEach(([char, replacement]) => {
        slug = slug.replace(new RegExp(char, 'g'), replacement)
      })
      break

    case 'ar':
      // Arabic transliteration
      Object.entries(ARABIC_MAP).forEach(([char, replacement]) => {
        slug = slug.replace(new RegExp(char, 'g'), replacement)
      })
      // Remove Arabic diacritics
      slug = slug.replace(/[\u064B-\u065F]/g, '')
      break

    case 'jp':
      // Japanese: Keep as-is for now (could add romaji conversion)
      // For production, consider using a library like 'kuroshiro'
      break

    case 'zh':
      // Chinese: Keep as-is for now (could add pinyin conversion)
      // For production, consider using a library like 'pinyin'
      break

    default:
      // Default handling for other languages
      break
  }

  // Common transformations for all languages
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen

  // Ensure slug is not empty
  if (!slug) {
    slug = 'article'
  }

  return slug
}

/**
 * Generate unique slug by appending ID
 */
export function generateUniqueSlug(title: string, lang: SupportedLang, id: string): string {
  const baseSlug = slugify(title, lang)
  const shortId = id.slice(0, 8)
  return `${baseSlug}-${shortId}`
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
