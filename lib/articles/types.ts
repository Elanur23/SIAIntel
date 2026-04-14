/**
 * Multilingual Article System Types
 * 9-language support with normalized structure
 */

import type { Article as PrismaArticle, ArticleTranslation as PrismaArticleTranslation } from '@prisma/client'

export type SupportedLang = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export const SUPPORTED_LANGUAGES: SupportedLang[] = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'ru',
  'ar',
  'jp',
  'zh',
]

export const LANGUAGE_NAMES: Record<SupportedLang, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية',
  jp: '日本語',
  zh: '中文',
}

export const RTL_LANGUAGES: SupportedLang[] = ['ar']

// Use Prisma-generated types
export type ArticleTranslation = PrismaArticleTranslation

export type Article = PrismaArticle & {
  translations?: ArticleTranslation[]
}

export interface ArticleWithTranslation {
  id: string
  category: string
  publishedAt: Date
  imageUrl: string | null
  impact: number | null
  confidence: number | null
  signal: string | null
  volatility: string | null
  featured: boolean
  published: boolean
  translation: {
    title: string
    excerpt: string
    content: string
    slug: string
    lang: SupportedLang
  }
}

export interface CreateArticleInput {
  category: string
  imageUrl?: string
  impact?: number
  confidence?: number
  signal?: string
  volatility?: string
  featured?: boolean
  published?: boolean
  translations: Partial<Record<SupportedLang, {
    title: string
    excerpt: string
    content: string
    slug: string
  }>>
}

export interface UpdateArticleInput {
  category?: string
  imageUrl?: string
  impact?: number
  confidence?: number
  signal?: string
  volatility?: string
  featured?: boolean
  published?: boolean
  translations?: Partial<Record<SupportedLang, {
    title?: string
    excerpt?: string
    content?: string
    slug?: string
  }>>
}

export interface ArticleQueryOptions {
  lang: SupportedLang
  category?: string
  featured?: boolean
  published?: boolean
  limit?: number
  offset?: number
  orderBy?: 'publishedAt' | 'createdAt' | 'updatedAt'
  orderDirection?: 'asc' | 'desc'
}
