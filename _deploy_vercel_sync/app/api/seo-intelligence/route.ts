/**
 * SIA SEO INTELLIGENCE API
 * 
 * Endpoint: POST /api/seo-intelligence
 * 
 * Actions:
 * - related-nodes: Find semantically related articles
 * - extract-entities: Extract entities from article text
 * - knowledge-graph: Generate site-level knowledge graph
 * - full-process: Run all three (called after article save)
 */

import { NextRequest, NextResponse } from 'next/server'
import { findRelatedNodes } from '@/lib/seo/semantic-auto-linker'
import { processArticleEntities } from '@/lib/seo/entity-seo-engine'
import { generateSiteKnowledgeGraph, generateArticleKnowledgeNode, type ArticleSummaryForGraph } from '@/lib/seo/knowledge-graph'
import { prisma } from '@/lib/warroom/database'
import { buildArticleSlug, buildArticleUrl } from '@/lib/warroom/article-seo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, articleId, lang = 'en' } = body

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter' }, { status: 400 })
    }

    // ── ACTION: RELATED NODES ──
    if (action === 'related-nodes') {
      if (!articleId) {
        return NextResponse.json({ success: false, error: 'Missing articleId' }, { status: 400 })
      }
      const result = await findRelatedNodes(articleId, { lang, maxResults: 6 })
      return NextResponse.json({ success: true, ...result })
    }

    // ── ACTION: EXTRACT ENTITIES ──
    if (action === 'extract-entities') {
      if (!articleId) {
        return NextResponse.json({ success: false, error: 'Missing articleId' }, { status: 400 })
      }
      const article = await prisma.warRoomArticle.findUnique({ where: { id: articleId } })
      if (!article) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 })
      }
      const isTr = lang === 'tr'
      const title = (isTr ? article.titleTr : article.titleEn) || ''
      const content = (isTr ? article.contentTr : article.contentEn) || ''
      const url = buildArticleUrl(lang, article.id, title)

      const result = processArticleEntities(`${title} ${content}`, url, title)
      return NextResponse.json({ success: true, ...result })
    }

    // ── ACTION: SITE KNOWLEDGE GRAPH ──
    if (action === 'knowledge-graph') {
      const recent = await prisma.warRoomArticle.findMany({
        where: { status: { in: ['published', 'scheduled'] } },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        select: { id: true, titleEn: true, titleTr: true, category: true, publishedAt: true },
      })
      const isTr = lang === 'tr'
      const articles: ArticleSummaryForGraph[] = recent.map(a => {
        const title = (isTr ? a.titleTr : a.titleEn) || 'Report'
        return {
          id: a.id,
          slug: buildArticleSlug(a.id, title),
          title,
          category: a.category || 'GENERAL',
          publishedAt: a.publishedAt.toISOString(),
          url: buildArticleUrl(lang, a.id, title),
        }
      })
      const graph = generateSiteKnowledgeGraph({ lang }, articles)
      return NextResponse.json({ success: true, graph })
    }

    // ── ACTION: FULL PROCESS (post-save pipeline) ──
    if (action === 'full-process') {
      if (!articleId) {
        return NextResponse.json({ success: false, error: 'Missing articleId' }, { status: 400 })
      }
      const article = await prisma.warRoomArticle.findUnique({ where: { id: articleId } })
      if (!article) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 })
      }

      const isTr = lang === 'tr'
      const title = (isTr ? article.titleTr : article.titleEn) || ''
      const content = (isTr ? article.contentTr : article.contentEn) || ''
      const url = buildArticleUrl(lang, article.id, title)

      // 1. Related nodes
      const relatedResult = await findRelatedNodes(articleId, { lang, maxResults: 6 })

      // 2. Entity extraction
      const entityResult = processArticleEntities(`${title} ${content}`, url, title)

      // 3. Article knowledge node
      const knowledgeNode = generateArticleKnowledgeNode({
        articleUrl: url,
        title,
        summary: (isTr ? article.summaryTr : article.summaryEn) || '',
        category: article.category || 'GENERAL',
        publishedAt: article.publishedAt.toISOString(),
        entities: entityResult.entities.map(e => ({
          name: e.name,
          type: e.type,
          sameAs: e.sameAs,
        })),
        relatedArticleUrls: relatedResult.relatedNodes.map(n =>
          buildArticleUrl(lang, n.id, n.title)
        ),
      })

      // 4. Store SEO intelligence in visualData
      const existingVisualData = (() => {
        try { return article.visualData ? JSON.parse(article.visualData) : {} } catch { return {} }
      })()

      const seoIntelligence = {
        ...existingVisualData,
        seoIntelligence: {
          relatedNodes: relatedResult.relatedNodes,
          entities: entityResult.entities,
          entitySchema: entityResult.jsonLdSnippet,
          knowledgeNode,
          processedAt: new Date().toISOString(),
        },
      }

      await prisma.warRoomArticle.update({
        where: { id: articleId },
        data: { visualData: JSON.stringify(seoIntelligence) },
      })

      console.log(`[SEO-INTEL] Processed article ${articleId}: ${relatedResult.relatedNodes.length} related nodes, ${entityResult.entities.length} entities`)

      return NextResponse.json({
        success: true,
        articleId,
        relatedNodes: relatedResult.relatedNodes.length,
        entities: entityResult.entities.length,
        processingTimeMs: relatedResult.processingTimeMs,
      })
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })

  } catch (error: any) {
    console.error('[SEO-INTEL] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
