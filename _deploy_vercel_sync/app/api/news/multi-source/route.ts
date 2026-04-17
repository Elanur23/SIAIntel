// app/api/news/multi-source/route.ts
// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
import { NextRequest, NextResponse } from 'next/server'
import { fetchNewsFromMultipleSources, fetchFromRSSFeeds } from '@/lib/news-service'

export const dynamic = 'force-dynamic'

/**
 * Çoklu kaynaklardan haber çekme endpoint'i
 * GET /api/news/multi-source?keyword=everything&method=rss
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || 'everything'
    const method = searchParams.get('method') || 'rss' // 'api' veya 'rss'

    console.log(`📰 Çoklu kaynak haber çekiliyor: ${keyword} (${method})`)

    let news
    if (method === 'api') {
      // News API kullan (API key gerekli)
      news = await fetchNewsFromMultipleSources(keyword)
    } else {
      // RSS Feed kullan (ücretsiz, limit yok)
      news = await fetchFromRSSFeeds()
    }

    return NextResponse.json({
      success: true,
      count: news.length,
      sources: news.map(n => n.source),
      data: news,
      metadata: {
        keyword,
        method,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Multi-source fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news from multiple sources',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
