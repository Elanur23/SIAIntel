import { NextResponse } from 'next/server'
import { generateNewsSitemap, type NewsArticleData } from '@/lib/seo/NewsArticleSchema'

/**
 * Google News Sitemap Generator
 * GET /api/seo/news-sitemap
 * 
 * Generates XML sitemap for Google News
 * Should be called periodically to update sitemap
 */
export async function GET() {
  try {
    // TODO: Fetch published articles from database
    // For now, return example structure
    
    const articles: NewsArticleData[] = [
      // Example article - replace with actual database query
      {
        headline: 'Example News Article',
        description: 'This is an example description',
        content: 'Full article content...',
        author: 'SIA_INTELLIGENCE_ENGINE',
        datePublished: new Date().toISOString(),
        url: 'https://siaintel.com/en/intelligence/example-article',
        category: 'Financial Intelligence',
        keywords: ['example', 'news'],
        language: 'en'
      }
    ]

    const sitemap = generateNewsSitemap(articles)

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    })

  } catch (error) {
    console.error('[News Sitemap] Generation error:', error)

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap generation failed</error>',
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    )
  }
}
