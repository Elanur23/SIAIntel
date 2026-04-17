/**
 * Content Buffer Management API - V5.8
 * Fixed: Zero-shortening policy for multilingual feed.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  addToBuffer,
  getBufferStats,
  generateHourlyMix,
  generatePublishingSchedule,
  selectArticlesForPublishing,
  scheduleArticles,
  publishScheduledArticles,
  ContentAutoScheduler,
} from '@/lib/content/content-buffer-system'
import { getArticles } from '@/lib/warroom/database'
import { getLocalizedArticleValue } from '@/lib/warroom/article-localization'
import { buildArticlePath } from '@/lib/warroom/article-seo'

export const dynamic = 'force-dynamic';

function cleanRadarContent(content: string): string {
  return (content || '')
    .replace(/^\[STATISTICAL_PROBABILITY_ANALYSIS[\s\S]*?\]\s*/i, '')
    .replace(/\[OFFICIAL_DISCLAIMER\][\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const lang = searchParams.get('lang')?.toLowerCase() || 'en'

    if (action === 'feed') {
      let dbArticles: any[] = []
      try {
        const allDbArticles = await getArticles('published')
        dbArticles = allDbArticles.map((a: any) => {
          const title = getLocalizedArticleValue(a, 'title', lang) || 'Untitled'
          const rawContent = getLocalizedArticleValue(a, 'content', lang) || ''
          const summary = getLocalizedArticleValue(a, 'summary', lang) || ''
          const cleaned = cleanRadarContent(rawContent)

          return {
            id: a.id,
            _uid: `db-${a.id}`,
            title,
            summary: summary,
            executive_summary: summary || cleaned.substring(0, 600),
            full_content: rawContent, // NO SHORTENING
            category: a.category || 'MARKET',
            sentiment: a.sentiment || 'NEUTRAL',
            impact: a.marketImpact || 7,
            time: 'LIVE',
            published_at: a.publishedAt,
            image: a.imageUrl,
            article_url: buildArticlePath(lang, a.id, title),
            word_count: countWords(cleaned)
          }
        })
      } catch (dbErr) {
        console.warn('[CONTENT_BUFFER] DB fetch failed:', (dbErr as Error).message)
      }

      const stats = getBufferStats()
      const bufferArticles = (stats.articles || [])
        .filter((a: any) => a.language === lang)
        .map((a: any) => ({
          id: a.id,
          _uid: `buf-${a.id}`,
          title: a.headline,
          summary: a.summary,
          full_content: a.fullContent || a.summary, // NO SHORTENING
          category: a.displayCategory || 'CRYPTO',
          sentiment: a.sentiment?.zone === 'GREED' ? 'BULLISH' : 'NEUTRAL',
          impact: a.metadata?.impact || 8,
          time: 'LIVE',
          published_at: new Date().toISOString(),
          source: a.metadata?.sources?.[0] || 'SIA_LIVE'
        }))

      const combined = [...dbArticles, ...bufferArticles].sort((a, b) => (b.impact || 0) - (a.impact || 0))

      return NextResponse.json({ success: true, data: combined.slice(0, 30) })
    }

    return NextResponse.json({ success: false, error: 'Invalid Action' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, article } = body
    if (action === 'add' && article) {
      addToBuffer(article)
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false, error: 'Invalid Post Action' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
