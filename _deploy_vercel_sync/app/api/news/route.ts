import { NextRequest, NextResponse } from 'next/server'
import { getArticles, getArticlesByCategory } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'

export const dynamic = 'force-dynamic' // Disable static caching for real-time news

export async function GET(request: NextRequest) {
  try {
    const categoryParam = request.nextUrl.searchParams.get('category')
    const articles = categoryParam
      ? await getArticlesByCategory(categoryParam.split(',').map(c => c.trim().toUpperCase()))
      : await getArticles('published')

    // Sort by newest first
    const sorted = [...articles].sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const formatted = sorted.map((a: any) => ({
      id: a.id,
      slug: buildArticleSlug(a.id, a.titleEn || a.titleTr || a.id),
      // All 9 language titles
      titleEn: a.titleEn, titleTr: a.titleTr, titleDe: a.titleDe, titleFr: a.titleFr,
      titleEs: a.titleEs, titleRu: a.titleRu, titleAr: a.titleAr, titleJp: a.titleJp, titleZh: a.titleZh,
      // All 9 language summaries
      summaryEn: a.summaryEn, summaryTr: a.summaryTr, summaryDe: a.summaryDe, summaryFr: a.summaryFr,
      summaryEs: a.summaryEs, summaryRu: a.summaryRu, summaryAr: a.summaryAr, summaryJp: a.summaryJp, summaryZh: a.summaryZh,
      // Content previews (truncated)
      contentEn: a.contentEn ? a.contentEn.substring(0, 800) : undefined,
      contentTr: a.contentTr ? a.contentTr.substring(0, 800) : undefined,
      category: a.category,
      sentiment: a.sentiment,
      impact: a.marketImpact,
      confidence: a.confidence,
      publishedAt: a.publishedAt,
      image: a.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop'
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
