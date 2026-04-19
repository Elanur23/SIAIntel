import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  ARTICLE_LANGS,
  ArticleLanguage,
  getArticleFieldKey,
  getRequestLocalizedValue,
} from '@/lib/warroom/article-localization'
import {
  findDuplicateArticle,
  saveArticle,
} from '@/lib/warroom/database'

const VALID_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived'])

function normalizeStatus(status?: string): string {
  if (!status || !VALID_STATUSES.has(status)) return 'published'
  return status
}

// Simple expert resolver fallback
function resolveExpertForCategory(category?: string) {
  return {
    name: 'SIA Intelligence Unit',
    title: 'Senior Market Analyst',
    bio: 'Expert analysis from SIA Intelligence'
  }
}

// Simple summary builder
function buildArticleSummary(content: string, title?: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  return sentences.slice(0, 2).join('. ').trim() + '.'
}

/**
 * SIA WAR ROOM SAVE API - Persistence Enabled
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const status = normalizeStatus(data.status)

    const requestedPublishAt = data.publishedAt ? new Date(data.publishedAt) : undefined
    const publishAt = requestedPublishAt && !Number.isNaN(requestedPublishAt.getTime())
      ? requestedPublishAt
      : new Date()

    const localizedTitles = Object.fromEntries(
      ARTICLE_LANGS.map((lang) => [lang, getRequestLocalizedValue(data, 'title', lang)])
    ) as Partial<Record<ArticleLanguage, string>>

    const localizedSummaries = Object.fromEntries(
      ARTICLE_LANGS.map((lang) => {
        const content = getRequestLocalizedValue(data, 'content', lang)
        const title = localizedTitles[lang]
        const summary = getRequestLocalizedValue(data, 'summary', lang) ||
                       (content ? buildArticleSummary(content, title) : undefined)
        return [lang, summary]
      })
    ) as Partial<Record<ArticleLanguage, string>>

    // ── DUPLICATE CHECK ──────────────────────────────────────
    const dupCheck = await findDuplicateArticle(localizedTitles);
    if (dupCheck.isDuplicate && !data.forceSave) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        matchedTitle: dupCheck.matchedTitle,
        matchedId: dupCheck.matchedId,
        error: `Article already published: "${dupCheck.matchedTitle}"`
      }, { status: 409 });
    }

    const expert = resolveExpertForCategory(data.category)
    const localizedArticleData = ARTICLE_LANGS.reduce<Record<string, string | undefined>>((acc, lang) => {
      acc[getArticleFieldKey('title', lang)] = localizedTitles[lang]
      acc[getArticleFieldKey('summary', lang)] = localizedSummaries[lang]
      acc[getArticleFieldKey('siaInsight', lang)] = getRequestLocalizedValue(data, 'siaInsight', lang)
      acc[getArticleFieldKey('riskShield', lang)] = getRequestLocalizedValue(data, 'riskShield', lang)
      acc[getArticleFieldKey('content', lang)] = getRequestLocalizedValue(data, 'content', lang)
      acc[getArticleFieldKey('socialSnippet', lang)] = getRequestLocalizedValue(data, 'socialSnippet', lang)
      return acc
    }, {})

    const article = await saveArticle({
      source: data.source,
      publishedAt: status === 'scheduled' ? publishAt : undefined,
      sentiment: data.sentiment,
      confidence: data.confidence,
      marketImpact: data.marketImpact,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop',
      region: data.region || 'GLOBAL',
      category: data.category || 'MARKET',
      authorName: expert.name,
      authorRole: expert.title,
      authorBio: expert.bio,
      status,
      ...localizedArticleData,
    })

    // CACHE PURGE
    try {
      revalidatePath('/');
      revalidatePath('/en');
      revalidatePath('/tr');
    } catch (e) {
      console.warn('[WAR_ROOM_SAVE] Cache revalidation failed:', (e as Error).message)
    }

    return NextResponse.json({ success: true, id: article.id, status })
  } catch (error: any) {
    console.error('[WAR_ROOM_SAVE] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
