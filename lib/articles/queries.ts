/**
 * Multilingual Article Queries
 * Database operations with language fallback support
 */

import { prisma } from '@/lib/db/prisma'
import type {
  SupportedLang,
  ArticleWithTranslation,
  ArticleQueryOptions,
  Article,
} from './types'

/**
 * Get articles by language with fallback to English
 */
export async function getArticlesByLang(
  options: ArticleQueryOptions
): Promise<ArticleWithTranslation[]> {
  const {
    lang,
    category,
    featured,
    published = true,
    limit = 10,
    offset = 0,
    orderBy = 'publishedAt',
    orderDirection = 'desc',
  } = options

  console.log(`[getArticlesByLang] Query params:`, { lang, category, featured, published, limit })

  const articles = await prisma.article.findMany({
    where: {
      category: category ? category : undefined,
      featured: featured !== undefined ? featured : undefined,
      published,
    },
    include: {
      translations: {
        where: {
          lang: {
            in: lang === 'en' ? ['en'] : [lang, 'en'], // Include English as fallback
          },
        },
      },
    },
    orderBy: {
      [orderBy]: orderDirection,
    },
    take: limit,
    skip: offset,
  })

  console.log(`[getArticlesByLang] Found ${articles.length} articles from database`)
  if (articles.length > 0) {
    console.log(`[getArticlesByLang] First article translations:`, articles[0].translations.map(t => ({ lang: t.lang, title: t.title })))
  }

  // Map to ArticleWithTranslation format
  return articles
    .map((article) => {
      // Try to find translation in requested language
      let translation = article.translations.find((t) => t.lang === lang)

      // Fallback to English if not found
      if (!translation) {
        translation = article.translations.find((t) => t.lang === 'en')
        console.log(`[getArticlesByLang] Using English fallback for article ${article.id}`)
      } else {
        console.log(`[getArticlesByLang] Using ${lang} translation for article ${article.id}`)
      }

      // Skip if no translation available
      if (!translation) {
        console.log(`[getArticlesByLang] No translation found for article ${article.id}`)
        return null
      }

      return {
        id: article.id,
        category: article.category,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
        impact: article.impact,
        confidence: article.confidence,
        signal: article.signal,
        volatility: article.volatility,
        featured: article.featured,
        published: article.published,
        translation: {
          title: translation.title,
          excerpt: translation.excerpt,
          content: translation.content,
          slug: translation.slug,
          lang: translation.lang as SupportedLang,
        },
      }
    })
    .filter((article): article is ArticleWithTranslation => article !== null)
}

/**
 * Get single article by slug and language
 */
export async function getArticleBySlug(
  slug: string,
  lang: SupportedLang
): Promise<ArticleWithTranslation | null> {
  // First try to find by slug in requested language
  const translation = await prisma.articleTranslation.findUnique({
    where: {
      slug_lang: {
        slug,
        lang,
      },
    },
    include: {
      article: true,
    },
  })

  if (translation) {
    return {
      id: translation.article.id,
      category: translation.article.category,
      publishedAt: translation.article.publishedAt,
      imageUrl: translation.article.imageUrl,
      impact: translation.article.impact,
      confidence: translation.article.confidence,
      signal: translation.article.signal,
      volatility: translation.article.volatility,
      featured: translation.article.featured,
      published: translation.article.published,
      translation: {
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        slug: translation.slug,
        lang: translation.lang as SupportedLang,
      },
    }
  }

  // Fallback: Try to find by slug in English
  if (lang !== 'en') {
    const enTranslation = await prisma.articleTranslation.findUnique({
      where: {
        slug_lang: {
          slug,
          lang: 'en',
        },
      },
      include: {
        article: true,
      },
    })

    if (enTranslation) {
      return {
        id: enTranslation.article.id,
        category: enTranslation.article.category,
        publishedAt: enTranslation.article.publishedAt,
        imageUrl: enTranslation.article.imageUrl,
        impact: enTranslation.article.impact,
        confidence: enTranslation.article.confidence,
        signal: enTranslation.article.signal,
        volatility: enTranslation.article.volatility,
        featured: enTranslation.article.featured,
        published: enTranslation.article.published,
        translation: {
          title: enTranslation.title,
          excerpt: enTranslation.excerpt,
          content: enTranslation.content,
          slug: enTranslation.slug,
          lang: 'en',
        },
      }
    }
  }

  return null
}

/**
 * Get featured article by language
 */
export async function getFeaturedArticle(
  lang: SupportedLang
): Promise<ArticleWithTranslation | null> {
  console.log(`[getFeaturedArticle] Fetching for language: ${lang}`)
  
  const articles = await getArticlesByLang({
    lang,
    featured: true,
    published: true,
    limit: 1,
    orderBy: 'publishedAt',
    orderDirection: 'desc',
  })

  console.log(`[getFeaturedArticle] Found ${articles.length} articles`)
  if (articles.length > 0) {
    console.log(`[getFeaturedArticle] Returning:`, {
      id: articles[0].id,
      title: articles[0].translation.title,
      lang: articles[0].translation.lang
    })
  }

  return articles[0] || null
}

/**
 * Get article by ID with all translations
 */
export async function getArticleById(id: string): Promise<Article | null> {
  return await prisma.article.findUnique({
    where: { id },
    include: {
      translations: true,
    },
  })
}

/**
 * Check if article has translation in specific language
 */
export async function hasTranslation(
  articleId: string,
  lang: SupportedLang
): Promise<boolean> {
  const count = await prisma.articleTranslation.count({
    where: {
      articleId,
      lang,
    },
  })

  return count > 0
}

/**
 * Get available languages for an article
 */
export async function getAvailableLanguages(articleId: string): Promise<SupportedLang[]> {
  const translations = await prisma.articleTranslation.findMany({
    where: { articleId },
    select: { lang: true },
  })

  return translations.map((t) => t.lang as SupportedLang)
}

/**
 * Count articles by category and language
 */
export async function countArticles(
  lang: SupportedLang,
  category?: string
): Promise<number> {
  return await prisma.article.count({
    where: {
      category: category ? category : undefined,
      published: true,
      translations: {
        some: {
          lang,
        },
      },
    },
  })
}
