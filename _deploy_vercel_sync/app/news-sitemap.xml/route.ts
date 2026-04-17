/**
 * Google News Sitemap - /news-sitemap.xml
 * Serves dynamic news articles for Google Discover & News indexing
 * Format: https://support.google.com/news/publisher-center/answer/9606710
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { getArticleFieldKey } from '@/lib/warroom/article-localization'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
const LOCALES = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const

function escapeXml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  try {
    const now = new Date()
    const articles = await prisma.warRoomArticle.findMany({
      where: { status: 'published', publishedAt: { lte: now } },
      select: { id: true, titleEn: true, titleTr: true, updatedAt: true, publishedAt: true, category: true },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    })

    const entries: string[] = []
    for (const art of articles) {
      for (const lang of LOCALES) {
        const titleKey = getArticleFieldKey('title', lang)
        const title = (art as any)[titleKey] || art.titleEn || art.titleTr || art.id
        const slug = buildArticleSlug(art.id, title)
        const url = `${BASE_URL}/${lang}/news/${slug}`
        const pubDate = art.publishedAt.toISOString()
        const modDate = (art.updatedAt || art.publishedAt).toISOString()

        entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>SIA Intelligence</news:name>
        <news:language>${lang === 'jp' ? 'ja' : lang === 'zh' ? 'zh-cn' : lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
      ${art.category ? `<news:keywords>${escapeXml(art.category)}</news:keywords>` : ''}
    </news:news>
    <lastmod>${modDate}</lastmod>
  </url>`)
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('\n')}
</urlset>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[news-sitemap] Error:', err)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>',
      { status: 500, headers: { 'Content-Type': 'application/xml' } }
    )
  }
}
