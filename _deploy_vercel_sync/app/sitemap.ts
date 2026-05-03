import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import {
  type PublicRouteLocale,
  PUBLIC_ROUTE_LOCALES,
} from '@/lib/i18n/route-locales'

const prisma = new PrismaClient()
const BASE_URL = 'https://siaintel.com'

const CATEGORY_ROUTES = ['/ai', '/crypto', '/stocks', '/economy']

// Helper to determine canonical route locale for an article
function getCanonicalRouteLocale(translations: Array<{ lang: string; slug: string; title: string; content: string }>): PublicRouteLocale {
  // Check for direct language availability
  const hasEn = translations.some(t => t.lang === 'en' && t.slug && t.title && t.content)
  if (hasEn) return 'en'
  
  // Map article languages to route locales
  const langToRouteLocale: Record<string, PublicRouteLocale> = {
    'en': 'en',
    'tr': 'tr',
    'de': 'de',
    'fr': 'fr',
    'es': 'es',
    'ru': 'ru',
    'ar': 'en', // Arabic articles use English route
    'jp': 'ja',
    'zh': 'zh',
  }
  
  // Find first available translation
  for (const translation of translations) {
    if (translation.slug && translation.title && translation.content) {
      return langToRouteLocale[translation.lang] || 'en'
    }
  }
  
  return 'en'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Static Pages (9 languages)
  const staticRoutes = ['', '/about', '/contact', '/intelligence', '/experts', '/privacy-policy', '/terms'].flatMap((route) =>
    PUBLIC_ROUTE_LOCALES.map((lang) => ({
      url: `${BASE_URL}/${lang}${route}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  )

  // 2. Category Pages (9 languages × 4 categories)
  const categoryRoutes = CATEGORY_ROUTES.flatMap((route) =>
    PUBLIC_ROUTE_LOCALES.map((lang) => ({
      url: `${BASE_URL}/${lang}${route}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    }))
  )

  // 3. Dynamic News Pages - Use CANONICAL URLs from normalized Article model
  const articles = await prisma.article.findMany({
    where: {
      published: true,
      publishedAt: { lte: now },
    },
    include: {
      translations: {
        select: {
          lang: true,
          slug: true,
          title: true,
          content: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 500, // Google sitemap limit
  })

  const articleRoutes = articles.map((article) => {
    // Determine canonical route locale
    const canonicalRouteLocale = getCanonicalRouteLocale(article.translations)
    
    // Get canonical translation for the canonical locale
    const canonicalLang = canonicalRouteLocale === 'ja' ? 'jp' : canonicalRouteLocale
    const canonicalTranslation = article.translations.find(t => t.lang === canonicalLang) ||
                                  article.translations.find(t => t.lang === 'en') ||
                                  article.translations[0]
    
    if (!canonicalTranslation) return null
    
    const canonicalSlug = canonicalTranslation.slug || article.id
    
    // Calculate priority based on article age
    const ageMs = now.getTime() - new Date(article.publishedAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const priority = ageDays < 1 ? 0.9 : ageDays < 7 ? 0.8 : 0.7

    return {
      url: `${BASE_URL}/${canonicalRouteLocale}/news/${canonicalSlug}`,
      lastModified: article.updatedAt || article.publishedAt,
      changeFrequency: ageDays < 7 ? 'daily' as const : 'weekly' as const,
      priority,
    }
  }).filter((route): route is NonNullable<typeof route> => route !== null)

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes]
}
