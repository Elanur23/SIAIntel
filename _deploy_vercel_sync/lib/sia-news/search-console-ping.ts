/**
 * SIA Search Console Auto-Ping
 * 
 * Automatically notifies Google Search Console when new articles are published
 * Triggers instant indexing for faster SERP appearance
 */

import type { GeneratedArticle } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface PingResult {
  success: boolean
  url: string
  timestamp: string
  error?: string
}

export interface SitemapPingResult {
  success: boolean
  sitemapUrl: string
  timestamp: string
  articlesCount: number
  error?: string
}

// ============================================================================
// GOOGLE PING ENDPOINTS
// ============================================================================

const GOOGLE_PING_URL = 'https://www.google.com/ping'
const BING_PING_URL = 'https://www.bing.com/ping'

// ============================================================================
// AUTO-PING ON PUBLISH
// ============================================================================

/**
 * Automatically ping search engines when article is published
 */
export async function autoPingOnPublish(article: GeneratedArticle): Promise<PingResult[]> {
  const articleUrl = `https://siaintel.com/${article.language}/news/${generateSlug(article.headline)}`
  const sitemapUrl = `https://siaintel.com/sitemap.xml`
  
  console.log(`[AUTO-PING] Triggering search engine notifications for: ${articleUrl}`)
  
  const results: PingResult[] = []
  
  // Ping Google
  try {
    const googleResult = await pingGoogle(sitemapUrl)
    results.push(googleResult)
    console.log(`[AUTO-PING] Google ping: ${googleResult.success ? 'SUCCESS' : 'FAILED'}`)
  } catch (error) {
    console.error('[AUTO-PING] Google ping error:', error)
    results.push({
      success: false,
      url: articleUrl,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Ping Bing
  try {
    const bingResult = await pingBing(sitemapUrl)
    results.push(bingResult)
    console.log(`[AUTO-PING] Bing ping: ${bingResult.success ? 'SUCCESS' : 'FAILED'}`)
  } catch (error) {
    console.error('[AUTO-PING] Bing ping error:', error)
  }
  
  return results
}

/**
 * Ping Google with sitemap URL
 */
export async function pingGoogle(sitemapUrl: string): Promise<PingResult> {
  const pingUrl = `${GOOGLE_PING_URL}?sitemap=${encodeURIComponent(sitemapUrl)}`
  
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SIA-Intelligence-Bot/1.0'
      }
    })
    
    return {
      success: response.ok,
      url: sitemapUrl,
      timestamp: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (error) {
    return {
      success: false,
      url: sitemapUrl,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Ping Bing with sitemap URL
 */
export async function pingBing(sitemapUrl: string): Promise<PingResult> {
  const pingUrl = `${BING_PING_URL}?sitemap=${encodeURIComponent(sitemapUrl)}`
  
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SIA-Intelligence-Bot/1.0'
      }
    })
    
    return {
      success: response.ok,
      url: sitemapUrl,
      timestamp: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (error) {
    return {
      success: false,
      url: sitemapUrl,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// BATCH PING
// ============================================================================

/**
 * Ping search engines for multiple articles
 */
export async function batchPing(articles: GeneratedArticle[]): Promise<SitemapPingResult> {
  const sitemapUrl = `https://siaintel.com/sitemap.xml`
  
  console.log(`[BATCH-PING] Notifying search engines of ${articles.length} new articles`)
  
  try {
    await pingGoogle(sitemapUrl)
    await pingBing(sitemapUrl)
    
    return {
      success: true,
      sitemapUrl,
      timestamp: new Date().toISOString(),
      articlesCount: articles.length
    }
  } catch (error) {
    return {
      success: false,
      sitemapUrl,
      timestamp: new Date().toISOString(),
      articlesCount: articles.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}
