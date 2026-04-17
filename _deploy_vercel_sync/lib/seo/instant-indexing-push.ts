/**
 * SIA Instant Indexing Push System
 * 
 * Automatically notifies search engines when content is published:
 * - Google Indexing API (URL_UPDATED)
 * - Bing Webmaster API (URL submission)
 * 
 * Target: <5 minutes indexing time (vs 48 hours standard)
 */

import { google } from 'googleapis'

// ============================================================================
// TYPES
// ============================================================================

export interface IndexingResult {
  success: boolean
  provider: 'google' | 'bing'
  url: string
  status: string
  timestamp: string
  error?: string
}

export interface BatchIndexingResult {
  total: number
  successful: number
  failed: number
  results: IndexingResult[]
}

// ============================================================================
// GOOGLE INDEXING API
// ============================================================================

/**
 * Push URL to Google Indexing API
 * Requires: Service Account with Indexing API enabled
 */
export async function pushToGoogleIndexing(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<IndexingResult> {
  try {
    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    
    const authClient = await auth.getClient()
    const indexing = google.indexing({ version: 'v3', auth: authClient as any })
    
    // Submit URL
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type,
      },
    })
    
    console.log(`✅ Google Indexing API: ${url} - ${type}`)
    
    return {
      success: true,
      provider: 'google',
      url,
      status: response.status.toString(),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ Google Indexing API error:`, error)
    
    return {
      success: false,
      provider: 'google',
      url,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    }
  }
}

/**
 * Get indexing status from Google
 */
export async function getGoogleIndexingStatus(url: string): Promise<{
  indexed: boolean
  lastCrawled?: string
  coverageState?: string
}> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    
    const authClient = await auth.getClient()
    const indexing = google.indexing({ version: 'v3', auth: authClient as any })
    
    const response = await indexing.urlNotifications.getMetadata({
      url,
    })
    
    return {
      indexed: true,
      lastCrawled: response.data.latestUpdate?.notifyTime || undefined,
      coverageState: response.data.latestUpdate?.type || undefined,
    }
  } catch (error) {
    return {
      indexed: false,
    }
  }
}

// ============================================================================
// BING WEBMASTER API
// ============================================================================

/**
 * Push URL to Bing Webmaster API
 * Requires: Bing Webmaster API Key
 */
export async function pushToBingIndexing(url: string): Promise<IndexingResult> {
  try {
    const apiKey = process.env.BING_WEBMASTER_API_KEY
    
    if (!apiKey) {
      throw new Error('Bing Webmaster API key not configured')
    }
    
    const siteUrl = process.env.SITE_URL || 'https://siaintel.com'
    
    // Submit URL to Bing
    const response = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl,
          url,
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`)
    }
    
    console.log(`✅ Bing Webmaster API: ${url}`)
    
    return {
      success: true,
      provider: 'bing',
      url,
      status: response.status.toString(),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ Bing Webmaster API error:`, error)
    
    return {
      success: false,
      provider: 'bing',
      url,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    }
  }
}

// ============================================================================
// BATCH INDEXING
// ============================================================================

/**
 * Push multiple URLs to search engines
 */
export async function batchPushToIndexing(
  urls: string[],
  options: {
    includeGoogle?: boolean
    includeBing?: boolean
    delayBetweenRequests?: number
  } = {}
): Promise<BatchIndexingResult> {
  const {
    includeGoogle = true,
    includeBing = true,
    delayBetweenRequests = 1000, // 1 second delay
  } = options
  
  const results: IndexingResult[] = []
  
  for (const url of urls) {
    // Push to Google
    if (includeGoogle) {
      const googleResult = await pushToGoogleIndexing(url)
      results.push(googleResult)
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
    }
    
    // Push to Bing
    if (includeBing) {
      const bingResult = await pushToBingIndexing(url)
      results.push(bingResult)
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
    }
  }
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}

// ============================================================================
// SITEMAP PING
// ============================================================================

/**
 * Ping search engines with sitemap URL
 */
export async function pingSitemap(sitemapUrl: string): Promise<{
  google: boolean
  bing: boolean
}> {
  const results = {
    google: false,
    bing: false,
  }
  
  // Ping Google
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    const googleResponse = await fetch(googlePingUrl)
    results.google = googleResponse.ok
    
    if (results.google) {
      console.log(`✅ Google sitemap ping: ${sitemapUrl}`)
    }
  } catch (error) {
    console.error(`❌ Google sitemap ping error:`, error)
  }
  
  // Ping Bing
  try {
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    const bingResponse = await fetch(bingPingUrl)
    results.bing = bingResponse.ok
    
    if (results.bing) {
      console.log(`✅ Bing sitemap ping: ${sitemapUrl}`)
    }
  } catch (error) {
    console.error(`❌ Bing sitemap ping error:`, error)
  }
  
  return results
}

// ============================================================================
// AUTO-PUSH ON PUBLISH
// ============================================================================

/**
 * Automatically push URL when article is published
 * Call this function in your publishing pipeline
 */
export async function autoPushOnPublish(
  articleUrl: string,
  options: {
    notifyGoogle?: boolean
    notifyBing?: boolean
    pingSitemap?: boolean
  } = {}
): Promise<{
  google?: IndexingResult
  bing?: IndexingResult
  sitemap?: { google: boolean; bing: boolean }
}> {
  const {
    notifyGoogle = true,
    notifyBing = true,
    pingSitemap: shouldPingSitemap = true,
  } = options
  
  const results: {
    google?: IndexingResult
    bing?: IndexingResult
    sitemap?: { google: boolean; bing: boolean }
  } = {}
  
  console.log(`🚀 Auto-push indexing for: ${articleUrl}`)
  
  // Push to Google
  if (notifyGoogle) {
    results.google = await pushToGoogleIndexing(articleUrl, 'URL_UPDATED')
  }
  
  // Push to Bing
  if (notifyBing) {
    results.bing = await pushToBingIndexing(articleUrl)
  }
  
  // Ping sitemap
  if (shouldPingSitemap) {
    const sitemapUrl = `${process.env.SITE_URL || 'https://siaintel.com'}/sitemap.xml`
    results.sitemap = await pingSitemap(sitemapUrl)
  }
  
  return results
}

// ============================================================================
// INDEXING MONITOR
// ============================================================================

/**
 * Monitor indexing status for URLs
 */
export interface IndexingMonitor {
  url: string
  submitted: string
  indexed: boolean
  timeTaken?: number // minutes
  lastChecked: string
}

const indexingMonitorStore = new Map<string, IndexingMonitor>()

/**
 * Track URL submission
 */
export function trackSubmission(url: string): void {
  indexingMonitorStore.set(url, {
    url,
    submitted: new Date().toISOString(),
    indexed: false,
    lastChecked: new Date().toISOString(),
  })
}

/**
 * Check indexing status
 */
export async function checkIndexingStatus(url: string): Promise<IndexingMonitor | null> {
  const monitor = indexingMonitorStore.get(url)
  
  if (!monitor) return null
  
  // Check Google indexing status
  const status = await getGoogleIndexingStatus(url)
  
  if (status.indexed && !monitor.indexed) {
    const submittedTime = new Date(monitor.submitted).getTime()
    const indexedTime = Date.now()
    const timeTaken = Math.round((indexedTime - submittedTime) / 60000) // minutes
    
    monitor.indexed = true
    monitor.timeTaken = timeTaken
    
    console.log(`✅ URL indexed in ${timeTaken} minutes: ${url}`)
  }
  
  monitor.lastChecked = new Date().toISOString()
  indexingMonitorStore.set(url, monitor)
  
  return monitor
}

/**
 * Get indexing statistics
 */
export function getIndexingStats(): {
  total: number
  indexed: number
  pending: number
  averageTime: number
} {
  const monitors = Array.from(indexingMonitorStore.values())
  
  const indexed = monitors.filter(m => m.indexed)
  const pending = monitors.filter(m => !m.indexed)
  
  const averageTime = indexed.length > 0
    ? indexed.reduce((sum, m) => sum + (m.timeTaken || 0), 0) / indexed.length
    : 0
  
  return {
    total: monitors.length,
    indexed: indexed.length,
    pending: pending.length,
    averageTime: Math.round(averageTime),
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  pushToGoogleIndexing,
  pushToBingIndexing,
  batchPushToIndexing,
  pingSitemap,
  autoPushOnPublish,
  getGoogleIndexingStatus,
  trackSubmission,
  checkIndexingStatus,
  getIndexingStats,
}
