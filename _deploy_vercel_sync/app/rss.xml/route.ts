import { prisma } from '@/lib/warroom/database'

/**
 * SIA MULTILINGUAL RSS FEED GENERATOR
 * Purpose: Instant discovery by Google Discover, Feedly, and News Aggregators.
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  // Fetch latest 20 published articles
  const articles = await prisma.warRoomArticle.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 20
  })

  const rssItems = articles.map(article => {
    // We use English as the primary RSS metadata, but links are language-specific
    const title = article.titleEn || article.titleTr || 'SIA Intelligence Report'
    const description = article.summaryEn || article.summaryTr || ''
    const date = article.publishedAt.toUTCString()
    const url = `${baseUrl}/en/news/${article.id}` // Primary link
    const image = article.imageUrl || ''

    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="false">${article.id}</guid>
      <pubDate>${date}</date>
      <description><![CDATA[${description}]]></description>
      <category>${article.category || 'Intelligence'}</category>
      ${image ? `<media:content url="${image}" medium="image" width="1200" />` : ''}
      <dc:creator>SIA Intelligence Unit</dc:creator>
    </item>`
  }).join('')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>SIA Intelligence | Global AI & Market Signals</title>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <link>${baseUrl}</link>
    <description>Premium AI, macro, and crypto intelligence reports.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-US</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>SIA Intelligence</title>
      <link>${baseUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300'
    }
  })
}
