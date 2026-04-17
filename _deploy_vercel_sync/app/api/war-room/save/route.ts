import { NextRequest, NextResponse } from 'next/server'
import { generateTextEmbedding, prepareForEmbedding } from '@/lib/ai/embedding-service'
import { revalidatePath } from 'next/cache'
import {
  ARTICLE_LANGS,
  ArticleLanguage,
  getArticleFieldKey,
  getRequestLocalizedValue,
  getAvailableArticleLanguages
} from '@/lib/warroom/article-localization'
import {
  findDuplicateArticle,
  saveArticle,
  updateArticle
} from '@/lib/warroom/database'
import { resolveExpertForCategory } from '@/lib/identity/expert-resolver'
import {
  buildArticleSummary,
  buildArticleSeoPackage,
  buildArticleUrl
} from '@/lib/warroom/article-seo'
import { buildSocialMediaPackage } from '@/lib/warroom/social-media'
import { findRelatedNodes } from '@/lib/seo/semantic-auto-linker'
import { processArticleEntities } from '@/lib/seo/entity-seo-engine'
import { generateArticleKnowledgeNode } from '@/lib/seo/knowledge-graph'

const VALID_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived'])

function normalizeStatus(status?: string): string {
  if (!status || !VALID_STATUSES.has(status)) return 'published'
  return status
}

/**
 * SIA WAR ROOM SAVE API - V2.1 (EMBEDDING ENHANCED)
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

    // ── GENERATE SEMANTIC EMBEDDING (NEW) ───────────────────
    let vector: number[] | null = null
    try {
      const mainTitle = localizedTitles.en || localizedTitles.tr || ''
      const mainSummary = localizedSummaries.en || localizedSummaries.tr || ''
      const embeddingText = prepareForEmbedding(mainTitle, mainSummary)
      vector = await generateTextEmbedding(embeddingText)
    } catch (e) {
      console.warn('[SIA_SAVE] Embedding generation failed, continuing without vector:', e)
    }

    // ── DUPLICATE CHECK ──────────────────────────────────────
    const dupCheck = await findDuplicateArticle(localizedTitles);
    if (dupCheck.isDuplicate && !data.forceSave) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        matchedTitle: dupCheck.matchedTitle,
        matchedId: dupCheck.matchedId,
        error: `Bu haber zaten yayınlanmış: "${dupCheck.matchedTitle}"`
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

    const seoPayload: Record<string, unknown> = {
      generatedAt: new Date().toISOString()
    }

    const availableLanguages = getAvailableArticleLanguages(article as Record<string, unknown>, ['title', 'content'])

    for (const articleLang of availableLanguages) {
      const title = (article as any)[getArticleFieldKey('title', articleLang)]
      const content = (article as any)[getArticleFieldKey('content', articleLang)]
      if (!title || !content) continue

      seoPayload[articleLang] = buildArticleSeoPackage({
        id: article.id,
        lang: articleLang,
        title,
        content,
        imageUrl: article.imageUrl || undefined,
        category: article.category || undefined,
        author: article.authorName || expert.name,
        publishedAt: article.publishedAt.toISOString(),
      })
    }

    const socialPayload: Record<string, unknown> = {
      generatedAt: new Date().toISOString()
    }

    for (const articleLang of availableLanguages) {
      const title = (article as any)[getArticleFieldKey('title', articleLang)]
      const summary = (article as any)[getArticleFieldKey('summary', articleLang)]
      const seoEntry = (seoPayload as Record<string, any>)[articleLang]
      if (!seoEntry || !title || !summary) continue

      socialPayload[articleLang] = buildSocialMediaPackage({
        language: articleLang,
        title,
        summary,
        url: seoEntry.url,
        category: article.category || undefined,
        region: article.region || undefined,
        impact: article.marketImpact || 5
      })
    }

    // ── SEO INTELLIGENCE PIPELINE (EMBEDDING PASS) ──────────
    let seoIntelligence: Record<string, unknown> = {}
    try {
      for (const seoLang of availableLanguages) {
        const title = (article as any)[getArticleFieldKey('title', seoLang)] || ''
        const articleUrl = buildArticleUrl(seoLang, article.id, title)

        const relatedResult = await findRelatedNodes(article.id, {
          lang: seoLang,
          maxResults: 6,
          currentEmbedding: vector || undefined
        })

        const content = (article as any)[getArticleFieldKey('content', seoLang)] || ''
        const entityResult = processArticleEntities(`${title} ${content}`, articleUrl, title)
        const knowledgeNode = generateArticleKnowledgeNode({
          articleUrl,
          title,
          summary: (article as any)[getArticleFieldKey('summary', seoLang)] || '',
          category: article.category || 'GENERAL',
          publishedAt: article.publishedAt.toISOString(),
          entities: entityResult.entities.map(e => ({ name: e.name, type: e.type, sameAs: e.sameAs })),
          relatedArticleUrls: relatedResult.relatedNodes.map(n => buildArticleUrl(seoLang, n.id, n.title)),
        })

        seoIntelligence[seoLang] = {
          relatedNodes: relatedResult.relatedNodes,
          entities: entityResult.entities,
          entitySchema: entityResult.jsonLdSnippet,
          knowledgeNode,
        }
      }
      seoIntelligence.processedAt = new Date().toISOString()
    } catch (seoErr) {
      console.warn('[SEO-INTEL] ⚠️ SEO pipeline error:', seoErr)
    }

    await updateArticle(article.id, {
      ...ARTICLE_LANGS.reduce<Record<string, string | undefined>>((acc, lang) => {
        acc[getArticleFieldKey('socialSnippet', lang)] = (socialPayload as Record<string, any>)[lang]?.heroSnippet
        return acc
      }, {}),
      visualData: JSON.stringify({
        seo: seoPayload,
        social: socialPayload,
        seoIntelligence,
        embedding: vector
      })
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
