/**
 * SIA Edge Cache Strategy
 * 
 * Handles 1M+ requests/second with:
 * - ISR (Incremental Static Regeneration)
 * - Stale-While-Revalidate
 * - Edge Runtime optimization
 * - CDN integration
 */

// ============================================================================
// ISR CONFIGURATION
// ============================================================================

/**
 * ISR revalidation times by content type
 */
export const ISR_REVALIDATION = {
  // News articles: 5 minutes (breaking news updates)
  NEWS_ARTICLE: 5 * 60, // 300 seconds
  
  // Homepage: 1 minute (real-time intelligence feed)
  HOMEPAGE: 60, // 60 seconds
  
  // Category pages: 10 minutes
  CATEGORY: 10 * 60, // 600 seconds
  
  // Static pages: 1 hour
  STATIC_PAGE: 60 * 60, // 3600 seconds
  
  // Legal pages: 1 day
  LEGAL_PAGE: 24 * 60 * 60, // 86400 seconds
  
  // Audio metadata: 1 hour (rarely changes)
  AUDIO_METADATA: 60 * 60, // 3600 seconds
  
  // Author profiles: 1 day
  AUTHOR_PROFILE: 24 * 60 * 60, // 86400 seconds
} as const

/**
 * Cache tags for targeted revalidation
 */
export const CACHE_TAGS = {
  NEWS_ARTICLE: (slug: string) => `news-${slug}`,
  NEWS_LIST: (lang: string) => `news-list-${lang}`,
  CATEGORY: (category: string, lang: string) => `category-${category}-${lang}`,
  HOMEPAGE: (lang: string) => `homepage-${lang}`,
  AUDIO: (articleId: string) => `audio-${articleId}`,
  AUTHOR: (authorId: string) => `author-${authorId}`,
} as const

// ============================================================================
// STALE-WHILE-REVALIDATE HEADERS
// ============================================================================

/**
 * Generate Cache-Control headers for different content types
 */
export function getCacheHeaders(contentType: keyof typeof ISR_REVALIDATION): {
  'Cache-Control': string
  'CDN-Cache-Control': string
  'Vercel-CDN-Cache-Control': string
} {
  const revalidate = ISR_REVALIDATION[contentType]
  const staleWhileRevalidate = revalidate * 2 // Allow stale content for 2x revalidation time
  
  return {
    // Browser cache
    'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${staleWhileRevalidate}`,
    
    // CDN cache (Cloudflare, Fastly, etc.)
    'CDN-Cache-Control': `public, max-age=${revalidate}, stale-while-revalidate=${staleWhileRevalidate}`,
    
    // Vercel Edge Network
    'Vercel-CDN-Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${staleWhileRevalidate}`,
  }
}

/**
 * Generate cache headers for static assets (images, audio, etc.)
 */
export function getStaticAssetHeaders(): {
  'Cache-Control': string
  'CDN-Cache-Control': string
} {
  const oneYear = 365 * 24 * 60 * 60 // 1 year in seconds
  
  return {
    'Cache-Control': `public, max-age=${oneYear}, immutable`,
    'CDN-Cache-Control': `public, max-age=${oneYear}, immutable`,
  }
}

// ============================================================================
// EDGE RUNTIME CONFIGURATION
// ============================================================================

/**
 * Edge runtime configuration for API routes
 */
export const EDGE_RUNTIME_CONFIG = {
  runtime: 'edge',
  regions: [
    'iad1', // US East (Virginia) - Primary
    'sfo1', // US West (San Francisco)
    'lhr1', // Europe (London)
    'fra1', // Europe (Frankfurt)
    'sin1', // Asia (Singapore)
    'syd1', // Australia (Sydney)
    'gru1', // South America (São Paulo)
    'dub1', // Europe (Dublin)
  ],
} as const

/**
 * Determine optimal edge region based on user location
 */
export function getOptimalEdgeRegion(countryCode?: string): string {
  const regionMap: Record<string, string> = {
    // North America
    US: 'iad1',
    CA: 'iad1',
    MX: 'iad1',
    
    // Europe
    GB: 'lhr1',
    DE: 'fra1',
    FR: 'fra1',
    IT: 'fra1',
    ES: 'fra1',
    NL: 'fra1',
    IE: 'dub1',
    
    // Asia
    SG: 'sin1',
    JP: 'sin1',
    KR: 'sin1',
    IN: 'sin1',
    CN: 'sin1',
    
    // Australia
    AU: 'syd1',
    NZ: 'syd1',
    
    // South America
    BR: 'gru1',
    AR: 'gru1',
    CL: 'gru1',
  }
  
  return regionMap[countryCode || 'US'] || 'iad1'
}

// ============================================================================
// CDN CONFIGURATION
// ============================================================================

/**
 * CDN endpoints for different asset types
 */
export const CDN_ENDPOINTS = {
  // Audio files (TTS)
  AUDIO: process.env.NEXT_PUBLIC_CDN_AUDIO_URL || 'https://cdn.siaintel.com/audio',
  
  // Images
  IMAGES: process.env.NEXT_PUBLIC_CDN_IMAGES_URL || 'https://cdn.siaintel.com/images',
  
  // Static assets (CSS, JS)
  STATIC: process.env.NEXT_PUBLIC_CDN_STATIC_URL || 'https://cdn.siaintel.com/static',
  
  // Video content
  VIDEO: process.env.NEXT_PUBLIC_CDN_VIDEO_URL || 'https://cdn.siaintel.com/video',
} as const

/**
 * Generate CDN URL for audio file
 */
export function getAudioCDNUrl(articleId: string, language: string): string {
  return `${CDN_ENDPOINTS.AUDIO}/${language}/${articleId}.mp3`
}

/**
 * Generate CDN URL for image
 */
export function getImageCDNUrl(imagePath: string): string {
  return `${CDN_ENDPOINTS.IMAGES}/${imagePath}`
}

/**
 * Generate CDN URL for OG image
 */
export function getOGImageCDNUrl(articleId: string): string {
  return `${CDN_ENDPOINTS.IMAGES}/og/${articleId}.png`
}

// ============================================================================
// CACHE WARMING
// ============================================================================

/**
 * Warm cache for critical pages
 */
export async function warmCache(urls: string[]): Promise<void> {
  const warmingPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'SIA-Cache-Warmer/1.0',
        },
      })
      
      if (response.ok) {
        console.log(`✅ Cache warmed: ${url}`)
      } else {
        console.warn(`⚠️  Cache warming failed: ${url} (${response.status})`)
      }
    } catch (error) {
      console.error(`❌ Cache warming error: ${url}`, error)
    }
  })
  
  await Promise.all(warmingPromises)
}

/**
 * Get critical pages to warm on deployment
 */
export function getCriticalPagesToWarm(baseUrl: string): string[] {
  const languages = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar']
  
  const pages: string[] = []
  
  // Homepage for each language
  languages.forEach(lang => {
    pages.push(`${baseUrl}/${lang}`)
  })
  
  // Legal pages (shared across languages)
  pages.push(
    `${baseUrl}/legal/privacy`,
    `${baseUrl}/legal/terms`,
    `${baseUrl}/legal/cookies`,
    `${baseUrl}/legal/ai-disclosure`
  )
  
  return pages
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

/**
 * Invalidate cache for specific article
 */
export async function invalidateArticleCache(
  articleId: string,
  language: string
): Promise<void> {
  try {
    // Revalidate article page
    await fetch(`/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: [
          CACHE_TAGS.NEWS_ARTICLE(articleId),
          CACHE_TAGS.NEWS_LIST(language),
          CACHE_TAGS.HOMEPAGE(language),
        ],
      }),
    })
    
    console.log(`✅ Cache invalidated for article: ${articleId}`)
  } catch (error) {
    console.error(`❌ Cache invalidation failed for article: ${articleId}`, error)
  }
}

/**
 * Invalidate cache for category
 */
export async function invalidateCategoryCache(
  category: string,
  language: string
): Promise<void> {
  try {
    await fetch(`/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: [
          CACHE_TAGS.CATEGORY(category, language),
          CACHE_TAGS.NEWS_LIST(language),
        ],
      }),
    })
    
    console.log(`✅ Cache invalidated for category: ${category}`)
  } catch (error) {
    console.error(`❌ Cache invalidation failed for category: ${category}`, error)
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Track cache hit/miss rates
 */
export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  avgResponseTime: number
}

const cacheMetrics = new Map<string, CacheMetrics>()

/**
 * Record cache hit
 */
export function recordCacheHit(cacheKey: string, responseTime: number): void {
  const metrics = cacheMetrics.get(cacheKey) || {
    hits: 0,
    misses: 0,
    hitRate: 0,
    avgResponseTime: 0,
  }
  
  metrics.hits++
  metrics.hitRate = metrics.hits / (metrics.hits + metrics.misses)
  metrics.avgResponseTime = (metrics.avgResponseTime * (metrics.hits - 1) + responseTime) / metrics.hits
  
  cacheMetrics.set(cacheKey, metrics)
}

/**
 * Record cache miss
 */
export function recordCacheMiss(cacheKey: string): void {
  const metrics = cacheMetrics.get(cacheKey) || {
    hits: 0,
    misses: 0,
    hitRate: 0,
    avgResponseTime: 0,
  }
  
  metrics.misses++
  metrics.hitRate = metrics.hits / (metrics.hits + metrics.misses)
  
  cacheMetrics.set(cacheKey, metrics)
}

/**
 * Get cache metrics
 */
export function getCacheMetrics(cacheKey?: string): CacheMetrics | Map<string, CacheMetrics> {
  if (cacheKey) {
    return cacheMetrics.get(cacheKey) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
    }
  }
  
  return cacheMetrics
}

/** Alias for tests: returns aggregate cache stats with hitRate */
export async function getCacheStats(): Promise<{ hitRate: number; hits: number; misses: number }> {
  const map = getCacheMetrics() as Map<string, CacheMetrics>
  let hits = 0
  let misses = 0
  map.forEach((m) => {
    hits += m.hits
    misses += m.misses
  })
  const total = hits + misses
  return {
    hitRate: total > 0 ? hits / total : 0,
    hits,
    misses,
  }
}

/** Alias for stress-test: warm critical pages */
export const warmupCache = warmCache

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ISR_REVALIDATION,
  CACHE_TAGS,
  getCacheHeaders,
  getStaticAssetHeaders,
  EDGE_RUNTIME_CONFIG,
  getOptimalEdgeRegion,
  CDN_ENDPOINTS,
  getAudioCDNUrl,
  getImageCDNUrl,
  getOGImageCDNUrl,
  warmCache,
  getCriticalPagesToWarm,
  invalidateArticleCache,
  invalidateCategoryCache,
  recordCacheHit,
  recordCacheMiss,
  getCacheMetrics,
}
