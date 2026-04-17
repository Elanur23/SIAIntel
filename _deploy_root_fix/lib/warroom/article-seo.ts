/**
 * SIA MASTER SEO ENGINE - v5.1 (STANDARDIZED URL & AUTHORITY)
 * FEATURES: DYNAMIC OPENGRAPH | TWITTER CARDS | ENTITY-BASED KEYWORDS | AI DISCLOSURE
 */
import {
  generateNextMetadata,
  generateSlugFromHeadline,
  generateStructuredData,
  getCurrentISOTimestamp,
  type NewsArticleData,
  type AIDisclosure,
} from '@/lib/seo/NewsArticleSchema'

// TEK MERKEZİ URL KAYNAĞI (Standardization)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

export type SupportedArticleLanguage = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ru' | 'ar' | 'jp' | 'zh'

/**
 * Metni Google'ın en sevdiği temiz hale getirir.
 */
export function cleanArticleBody(content: string): string {
  return (content || '')
    .replace(/^\[STATISTICAL_PROBABILITY_ANALYSIS[\s\S]*?\]\s*/i, '')
    .replace(/\[OFFICIAL_DISCLAIMER\][\s\S]*$/i, '')
    .replace(/\[SYSTEM_LOG\]:.*$/gim, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Her haber için 160 karakterlik "Mıknatıs" özet üretir.
 */
export function buildArticleSummary(content: string, fallbackTitle?: string): string {
  const cleaned = cleanArticleBody(content)
  const summary = cleaned.split('. ').slice(0, 2).join('. ') || fallbackTitle || cleaned
  return summary.slice(0, 155).trim() + '...'
}

export function buildArticleUrl(lang: string, id: string, title: string): string {
  const slug = generateSlugFromHeadline(title) || 'intelligence-report'
  return `${SITE_URL}/${lang}/news/${slug}--${id}`
}

/** Uygulama içi navigasyon için göreli path (localhost/production uyumlu) */
export function buildArticlePath(lang: string, id: string, title: string): string {
  const slug = generateSlugFromHeadline(title) || 'intelligence-report'
  return `/${lang}/news/${slug}--${id}`
}

export function buildArticleSlug(id: string, title: string): string {
  const slug = generateSlugFromHeadline(title) || 'intelligence-report'
  return `${slug}--${id}`
}

/**
 * Google'ın "Otorite" olarak tanıdığı SIA Yazar/Organizasyon Şeması
 */
function buildAIDisclosure(isVerified: boolean = true): AIDisclosure {
  return {
    model: 'Gemini 1.5 Pro (SIA_V14_CORE)',
    infrastructure: 'SIA Intelligence Terminal',
    dataSource: 'Multi-Node OSINT & Real-time Market Data',
    editorialReview: true,
    humanOversight: isVerified,
  }
}

export function buildArticleSeoPackage(params: {
  id: string
  lang: string
  title: string
  content: string
  imageUrl?: string
  category?: string
  author?: string
  publishedAt?: string
}) {
  const summary = buildArticleSummary(params.content, params.title)
  const url = buildArticleUrl(params.lang, params.id, params.title)

  const articleData: NewsArticleData = {
    headline: params.title,
    description: summary,
    content: cleanArticleBody(params.content),
    author: params.author || 'SIA Intelligence Unit',
    datePublished: params.publishedAt || getCurrentISOTimestamp(),
    dateModified: getCurrentISOTimestamp(),
    url,
    imageUrl: params.imageUrl || `${SITE_URL}/og-image.jpg`,
    category: params.category || 'Financial Intelligence',
    keywords: [params.category || 'Finance', 'SIAINTEL', 'Market Analysis', 'Intelligence'],
    language: params.lang as any,
    sources: [
      {
        name: 'SIA SENTINEL',
        url: SITE_URL,
        type: 'news_wire',
        accessDate: getCurrentISOTimestamp(),
      },
    ],
    aiDisclosure: buildAIDisclosure(),
    editorialProcess: 'Verified through SIA Multi-Agent Validation System.',
    correctionPolicy: `${SITE_URL}/${params.lang}/editorial-policy`,
  }

  return {
    summary,
    url,
    metadata: generateNextMetadata(articleData),
    structuredData: generateStructuredData(articleData),
  }
}
