/**
 * GOOGLE INDEXING API SERVICE - SELECTIVE & CONTROLLED
 * CRITICAL: Only triggers for breaking news and exclusive content
 */

import { google } from 'googleapis'

interface IndexingRequest {
  url: string
  type: 'URL_UPDATED' | 'URL_DELETED'
}

interface IndexingResult {
  success: boolean
  url: string
  message: string
  timestamp: string
}

// Rate limiting: max 200 requests per day (Google default quota)
const DAILY_LIMIT = 200
const requestLog: { date: string; count: number }[] = []

/**
 * Check if article qualifies for priority indexing
 */
export function shouldTriggerIndexing(article: {
  category?: string
  tags?: string[]
  priority?: string
}): boolean {
  // STRICT CONTROL: Only breaking news or exclusive content
  
  // Check category
  if (article.category?.toLowerCase() === 'breaking') {
    return true
  }
  
  // Check tags
  const priorityTags = ['exclusive', 'leak', 'urgent', 'breaking']
  if (article.tags && article.tags.some(tag => 
    priorityTags.includes(tag.toLowerCase())
  )) {
    return true
  }
  
  // Check priority flag
  if (article.priority === 'high' || article.priority === 'urgent') {
    return true
  }
  
  return false
}

/**
 * Check rate limit
 */
function checkRateLimit(): boolean {
  const today = new Date().toISOString().split('T')[0]
  
  // Clean old entries
  const recentLog = requestLog.filter(entry => entry.date === today)
  
  if (recentLog.length === 0) {
    requestLog.push({ date: today, count: 0 })
    return true
  }
  
  const todayCount = recentLog[0].count
  return todayCount < DAILY_LIMIT
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(): void {
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = requestLog.find(entry => entry.date === today)
  
  if (todayEntry) {
    todayEntry.count++
  } else {
    requestLog.push({ date: today, count: 1 })
  }
}

/**
 * Get authenticated Google Indexing API client
 */
async function getIndexingClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  
  if (!serviceAccountEmail || !serviceAccountKey) {
    throw new Error('Google service account credentials not configured')
  }
  
  // Parse private key (handle escaped newlines)
  const privateKey = serviceAccountKey.replace(/\\n/g, '\n')
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })
  
  const authClient = await auth.getClient()
  
  return google.indexing({
    version: 'v3',
    auth: authClient as any,
  })
}

/**
 * Notify Google of URL update
 */
export async function notifyGoogleIndexing(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<IndexingResult> {
  const timestamp = new Date().toISOString()
  
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      console.warn('[Indexing Service] Daily rate limit reached')
      return {
        success: false,
        url,
        message: 'Daily rate limit reached (10 requests/day)',
        timestamp
      }
    }
    
    // Get client
    const indexing = await getIndexingClient()
    
    // Make request
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type,
      },
    })
    
    // Increment counter
    incrementRateLimit()
    
    console.log('[Indexing Service] Successfully notified Google:', {
      url,
      type,
      response: response.data
    })
    
    return {
      success: true,
      url,
      message: 'Successfully notified Google Indexing API',
      timestamp
    }
    
  } catch (error: any) {
    console.error('[Indexing Service] Failed to notify Google:', error)
    
    return {
      success: false,
      url,
      message: error.message || 'Failed to notify Google Indexing API',
      timestamp
    }
  }
}

/**
 * Get indexing status for URL
 */
export async function getIndexingStatus(url: string): Promise<any> {
  try {
    const indexing = await getIndexingClient()
    
    const response = await indexing.urlNotifications.getMetadata({
      url,
    })
    
    return {
      success: true,
      data: response.data
    }
    
  } catch (error: any) {
    console.error('[Indexing Service] Failed to get status:', error)
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): { used: number; limit: number; remaining: number } {
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = requestLog.find(entry => entry.date === today)
  const used = todayEntry?.count || 0
  
  return {
    used,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - used
  }
}
