/**
 * SIA WAR ROOM - Database Layer V2
 * Persistent storage for multi-language articles based on SIA Protocol
 */

import { cache } from 'react'
import { prisma } from '@/lib/db/prisma'
import { ARTICLE_LANGS, getArticleFieldKey, type ArticleLanguage } from '@/lib/warroom/article-localization'

export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived'

// Re-export prisma for backward compatibility
export { prisma }

export interface SaveArticleData {
  id?: string
  source?: string
  publishedAt?: Date

  sentiment?: string
  confidence?: number
  marketImpact?: number
  category?: string
  region?: string

  titleTr?: string
  summaryTr?: string
  contentTr?: string
  siaInsightTr?: string
  riskShieldTr?: string
  socialSnippetTr?: string

  titleEn?: string
  summaryEn?: string
  contentEn?: string
  siaInsightEn?: string
  riskShieldEn?: string
  socialSnippetEn?: string

  titleDe?: string
  summaryDe?: string
  contentDe?: string
  siaInsightDe?: string
  riskShieldDe?: string
  socialSnippetDe?: string

  titleEs?: string
  summaryEs?: string
  contentEs?: string
  siaInsightEs?: string
  riskShieldEs?: string
  socialSnippetEs?: string

  titleFr?: string
  summaryFr?: string
  contentFr?: string
  siaInsightFr?: string
  riskShieldFr?: string
  socialSnippetFr?: string

  titleRu?: string
  summaryRu?: string
  contentRu?: string
  siaInsightRu?: string
  riskShieldRu?: string
  socialSnippetRu?: string

  titleAr?: string
  summaryAr?: string
  contentAr?: string
  siaInsightAr?: string
  riskShieldAr?: string
  socialSnippetAr?: string

  titleJp?: string
  summaryJp?: string
  contentJp?: string
  siaInsightJp?: string
  riskShieldJp?: string
  socialSnippetJp?: string

  titleZh?: string
  summaryZh?: string
  contentZh?: string
  siaInsightZh?: string
  riskShieldZh?: string
  socialSnippetZh?: string

  imageUrl?: string
  visualData?: string

  authorName?: string
  authorRole?: string
  authorBio?: string

  status?: ArticleStatus | string
}

export async function saveArticle(data: SaveArticleData) {
  return await prisma.warRoomArticle.create({
    data: {
      source: data.source || 'MANUAL',
      publishedAt: data.publishedAt || new Date(),
      sentiment: data.sentiment,
      confidence: data.confidence || 90,
      marketImpact: data.marketImpact || 5,
      category: data.category || 'GENERAL',
      region: data.region || 'GLOBAL',

      titleTr: data.titleTr,
      summaryTr: data.summaryTr,
      contentTr: data.contentTr,
      siaInsightTr: data.siaInsightTr,
      riskShieldTr: data.riskShieldTr,
      socialSnippetTr: data.socialSnippetTr,

      titleEn: data.titleEn,
      summaryEn: data.summaryEn,
      contentEn: data.contentEn,
      siaInsightEn: data.siaInsightEn,
      riskShieldEn: data.riskShieldEn,
      socialSnippetEn: data.socialSnippetEn,

      titleDe: data.titleDe,
      summaryDe: data.summaryDe,
      contentDe: data.contentDe,
      siaInsightDe: data.siaInsightDe,
      riskShieldDe: data.riskShieldDe,
      socialSnippetDe: data.socialSnippetDe,

      titleEs: data.titleEs,
      summaryEs: data.summaryEs,
      contentEs: data.contentEs,
      siaInsightEs: data.siaInsightEs,
      riskShieldEs: data.riskShieldEs,
      socialSnippetEs: data.socialSnippetEs,

      titleFr: data.titleFr,
      summaryFr: data.summaryFr,
      contentFr: data.contentFr,
      siaInsightFr: data.siaInsightFr,
      riskShieldFr: data.riskShieldFr,
      socialSnippetFr: data.socialSnippetFr,

      titleRu: data.titleRu,
      summaryRu: data.summaryRu,
      contentRu: data.contentRu,
      siaInsightRu: data.siaInsightRu,
      riskShieldRu: data.riskShieldRu,
      socialSnippetRu: data.socialSnippetRu,

      titleAr: data.titleAr,
      summaryAr: data.summaryAr,
      contentAr: data.contentAr,
      siaInsightAr: data.siaInsightAr,
      riskShieldAr: data.riskShieldAr,
      socialSnippetAr: data.socialSnippetAr,

      titleJp: data.titleJp,
      summaryJp: data.summaryJp,
      contentJp: data.contentJp,
      siaInsightJp: data.siaInsightJp,
      riskShieldJp: data.riskShieldJp,
      socialSnippetJp: data.socialSnippetJp,

      titleZh: data.titleZh,
      summaryZh: data.summaryZh,
      contentZh: data.contentZh,
      siaInsightZh: data.siaInsightZh,
      riskShieldZh: data.riskShieldZh,
      socialSnippetZh: data.socialSnippetZh,

      imageUrl: data.imageUrl,
      visualData: data.visualData,

      authorName: data.authorName,
      authorRole: data.authorRole,
      authorBio: data.authorBio,

      status: data.status || 'published'
    }
  })
}

export async function updateArticle(id: string, data: Partial<SaveArticleData>) {
  return await prisma.warRoomArticle.update({
    where: { id },
    data: {
      ...data,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined
    }
  })
}

export const getCachedArticles = cache(async (status?: string) => {
  try {
    const now = new Date()
    return await prisma.warRoomArticle.findMany({
      where: status === 'published'
        ? {
            OR: [
              { status: 'published', publishedAt: { lte: now } },
              { status: 'scheduled', publishedAt: { lte: now } },
            ],
          }
        : status
          ? { status }
          : {
              OR: [
                { status: 'published', publishedAt: { lte: now } },
                { status: 'scheduled', publishedAt: { lte: now } },
              ],
            },
      orderBy: { publishedAt: 'desc' },
    })
  } catch (error) {
    console.error('[DATABASE] getCachedArticles failed:', error)
    // Return empty array instead of crashing the page
    return []
  }
})

export async function getArticles(status?: string) {
  const now = new Date()

  return await prisma.warRoomArticle.findMany({
    where: status === 'published'
      ? {
          OR: [
            {
              status: 'published',
              publishedAt: {
                lte: now
              }
            },
            {
              status: 'scheduled',
              publishedAt: {
                lte: now
              }
            }
          ]
        }
      : status
        ? { status }
        : {
            OR: [
              {
                status: 'published',
                publishedAt: {
                  lte: now
                }
              },
              {
                status: 'scheduled',
                publishedAt: {
                  lte: now
                }
              }
            ]
          },
    orderBy: { publishedAt: 'desc' }
  })
}

export async function getArticleById(id: string) {
  return await prisma.warRoomArticle.findUnique({
    where: { id }
  })
}

export async function getArticleBySlug(slug: string) {
  const articleId = slug.split('--').pop() || slug
  return prisma.warRoomArticle.findFirst({
    where: {
      id: articleId,
      OR: [
        {
          status: 'published',
          publishedAt: {
            lte: new Date()
          }
        },
        {
          status: 'scheduled',
          publishedAt: {
            lte: new Date()
          }
        }
      ]
    }
  })
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  CRYPTO: ['CRYPTO', 'CRYPTO_BLOCKCHAIN'],
  STOCKS: ['STOCKS', 'TECH_STOCKS', 'MARKET', 'EMERGING_MARKETS'],
  ECONOMY: ['ECONOMY', 'MACRO_ECONOMY', 'COMMODITIES'],
  MACRO: ['MACRO', 'MACRO_ECONOMY', 'COMMODITIES'],
  AI: ['AI', 'TECH_STOCKS'],
}

function expandCategories(cats: string[]): string[] {
  const expanded = new Set<string>()
  for (const c of cats) {
    const aliases = CATEGORY_ALIASES[c]
    if (aliases) aliases.forEach(a => expanded.add(a))
    else expanded.add(c)
  }
  return Array.from(expanded)
}

export async function getArticlesByCategory(category: string | string[], limit = 30) {
  const now = new Date()
  const cats = expandCategories(Array.isArray(category) ? category : [category])

  return prisma.warRoomArticle.findMany({
    where: {
      category: { in: cats },
      OR: [
        { status: 'published', publishedAt: { lte: now } },
        { status: 'scheduled', publishedAt: { lte: now } }
      ]
    },
    orderBy: { publishedAt: 'desc' },
    take: limit
  })
}

export async function deleteArticle(id: string) {
  return await prisma.warRoomArticle.delete({
    where: { id }
  })
}

/**
 * Get all published article titles (EN + TR) for duplicate detection.
 * Returns normalized lowercase titles.
 */
export async function getPublishedTitles(): Promise<string[]> {
  const articles = await prisma.warRoomArticle.findMany({
    where: {
      status: { in: ['published', 'scheduled'] },
    },
    select: Object.fromEntries(ARTICLE_LANGS.map((lang) => [getArticleFieldKey('title', lang), true])),
  });

  const titles: string[] = [];
  for (const a of articles) {
    for (const lang of ARTICLE_LANGS) {
      const value = (a as any)[getArticleFieldKey('title', lang)]
      if (value) titles.push(value.toLowerCase().trim())
    }
  }
  return titles;
}

/**
 * Check if a headline (or very similar one) already exists in DB.
 * Returns the matching title if found, null otherwise.
 */
export async function findDuplicateArticle(
  titles: Partial<Record<ArticleLanguage, string>>
): Promise<{ isDuplicate: boolean; matchedTitle?: string; matchedId?: string }> {
  const candidates = await prisma.warRoomArticle.findMany({
    where: {
      status: { in: ['published', 'scheduled'] },
    },
    select: {
      id: true,
      ...Object.fromEntries(ARTICLE_LANGS.map((lang) => [getArticleFieldKey('title', lang), true])),
    },
    orderBy: { publishedAt: 'desc' },
    take: 200,
  });

  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  const inputTitles = ARTICLE_LANGS
    .map((lang) => titles[lang])
    .filter(Boolean)
    .map((title) => normalize(title as string));

  for (const article of candidates) {
    const dbTitles = ARTICLE_LANGS
      .map((lang) => (article as Record<string, string | null>)[getArticleFieldKey('title', lang)])
      .filter(Boolean)
      .map((title) => normalize(title as string));

    for (const input of inputTitles) {
      const inputWords = new Set(input.split(' ').filter(w => w.length > 3));
      for (const db of dbTitles) {
        // Exact match
        if (input === db) {
          const matchedTitle = ARTICLE_LANGS
            .map((lang) => (article as Record<string, string | null>)[getArticleFieldKey('title', lang)])
            .find(Boolean) || ''
          return { isDuplicate: true, matchedTitle, matchedId: article.id };
        }
        // High similarity (>70% word overlap)
        const dbWords = new Set(db.split(' ').filter(w => w.length > 3));
        if (inputWords.size === 0 || dbWords.size === 0) continue;
        const intersection = [...inputWords].filter(w => dbWords.has(w));
        const similarity = intersection.length / Math.max(inputWords.size, dbWords.size);
        if (similarity > 0.7) {
          const matchedTitle = ARTICLE_LANGS
            .map((lang) => (article as Record<string, string | null>)[getArticleFieldKey('title', lang)])
            .find(Boolean) || ''
          return { isDuplicate: true, matchedTitle, matchedId: article.id };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/** Delete all articles (wipe); returns count deleted */
export async function deleteAllArticles(): Promise<{ count: number }> {
  const result = await prisma.warRoomArticle.deleteMany({})
  return { count: result.count }
}
