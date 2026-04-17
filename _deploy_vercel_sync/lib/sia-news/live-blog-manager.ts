/**
 * SIA Live Blog Manager
 * 
 * Real-time LiveBlogPosting schema management for Google's "LIVE" badge
 * 
 * Features:
 * - LiveBlogPosting schema generation
 * - Real-time update injection
 * - Coverage time tracking
 * - Live badge trigger logic
 * - WebSocket integration ready
 */

import type { GeneratedArticle, Language } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface LiveBlogUpdate {
  id: string
  headline: string
  articleBody: string
  datePublished: string
  author?: string
  image?: {
    url: string
    caption?: string
  }
  position: number // Update order (1 = most recent)
}

export interface LiveBlogPosting {
  '@context': 'https://schema.org'
  '@type': 'LiveBlogPosting'
  '@id': string
  headline: string
  description: string
  coverageStartTime: string
  coverageEndTime?: string
  datePublished: string
  dateModified: string
  author: AuthorSchema
  publisher: PublisherSchema
  mainEntityOfPage: MainEntitySchema
  image?: ImageSchema
  liveBlogUpdate: Record<string, unknown>[]
  isAccessibleForFree: boolean
  inLanguage: string
  about?: AboutSchema[]
  mentions?: MentionSchema[]
}

interface AuthorSchema {
  '@type': 'Organization'
  name: string
  url?: string
}

interface PublisherSchema {
  '@type': 'Organization'
  name: string
  url: string
  logo: {
    '@type': 'ImageObject'
    url: string
    width: number
    height: number
  }
}

interface MainEntitySchema {
  '@type': 'WebPage'
  '@id': string
  url: string
}

interface ImageSchema {
  '@type': 'ImageObject'
  url: string
  width: number
  height: number
}

interface AboutSchema {
  '@type': string
  name: string
}

interface MentionSchema {
  '@type': string
  name: string
}

// ============================================================================
// LIVE BLOG STATUS
// ============================================================================

export type LiveBlogStatus = 'active' | 'paused' | 'ended'

export interface LiveBlogMetadata {
  articleId: string
  status: LiveBlogStatus
  coverageStartTime: string
  coverageEndTime?: string
  updateCount: number
  lastUpdateTime: string
  isLive: boolean
}

// ============================================================================
// IN-MEMORY LIVE BLOG STORAGE
// ============================================================================

class LiveBlogStore {
  private liveBlogs: Map<string, LiveBlogMetadata> = new Map()
  private updates: Map<string, LiveBlogUpdate[]> = new Map()

  /**
   * Start a live blog coverage
   */
  startLiveBlog(articleId: string): LiveBlogMetadata {
    const metadata: LiveBlogMetadata = {
      articleId,
      status: 'active',
      coverageStartTime: new Date().toISOString(),
      updateCount: 0,
      lastUpdateTime: new Date().toISOString(),
      isLive: true
    }

    this.liveBlogs.set(articleId, metadata)
    this.updates.set(articleId, [])

    console.log(`[LiveBlog] Started coverage for article: ${articleId}`)
    return metadata
  }

  /**
   * Add update to live blog
   */
  addUpdate(articleId: string, update: Omit<LiveBlogUpdate, 'id' | 'position'>): LiveBlogUpdate {
    const updates = this.updates.get(articleId) || []
    const metadata = this.liveBlogs.get(articleId)

    if (!metadata) {
      throw new Error(`Live blog not found: ${articleId}`)
    }

    const newUpdate: LiveBlogUpdate = {
      ...update,
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: updates.length + 1
    }

    // Add to beginning (most recent first)
    updates.unshift(newUpdate)
    this.updates.set(articleId, updates)

    // Update metadata
    metadata.updateCount = updates.length
    metadata.lastUpdateTime = new Date().toISOString()
    this.liveBlogs.set(articleId, metadata)

    console.log(`[LiveBlog] Added update #${metadata.updateCount} to article: ${articleId}`)
    return newUpdate
  }

  /**
   * End live blog coverage
   */
  endLiveBlog(articleId: string): void {
    const metadata = this.liveBlogs.get(articleId)
    if (!metadata) {
      throw new Error(`Live blog not found: ${articleId}`)
    }

    metadata.status = 'ended'
    metadata.coverageEndTime = new Date().toISOString()
    metadata.isLive = false
    this.liveBlogs.set(articleId, metadata)

    console.log(`[LiveBlog] Ended coverage for article: ${articleId}`)
  }

  /**
   * Pause live blog coverage
   */
  pauseLiveBlog(articleId: string): void {
    const metadata = this.liveBlogs.get(articleId)
    if (!metadata) {
      throw new Error(`Live blog not found: ${articleId}`)
    }

    metadata.status = 'paused'
    metadata.isLive = false
    this.liveBlogs.set(articleId, metadata)

    console.log(`[LiveBlog] Paused coverage for article: ${articleId}`)
  }

  /**
   * Resume live blog coverage
   */
  resumeLiveBlog(articleId: string): void {
    const metadata = this.liveBlogs.get(articleId)
    if (!metadata) {
      throw new Error(`Live blog not found: ${articleId}`)
    }

    if (metadata.status === 'ended') {
      throw new Error('Cannot resume ended live blog')
    }

    metadata.status = 'active'
    metadata.isLive = true
    this.liveBlogs.set(articleId, metadata)

    console.log(`[LiveBlog] Resumed coverage for article: ${articleId}`)
  }

  /**
   * Get live blog metadata
   */
  getMetadata(articleId: string): LiveBlogMetadata | undefined {
    return this.liveBlogs.get(articleId)
  }

  /**
   * Get all updates for a live blog
   */
  getUpdates(articleId: string): LiveBlogUpdate[] {
    return this.updates.get(articleId) || []
  }

  /**
   * Get all active live blogs
   */
  getActiveLiveBlogs(): LiveBlogMetadata[] {
    return Array.from(this.liveBlogs.values()).filter(
      metadata => metadata.status === 'active'
    )
  }

  /**
   * Check if article is live
   */
  isLive(articleId: string): boolean {
    const metadata = this.liveBlogs.get(articleId)
    return metadata?.isLive || false
  }

  /**
   * Delete live blog (cleanup)
   */
  deleteLiveBlog(articleId: string): void {
    this.liveBlogs.delete(articleId)
    this.updates.delete(articleId)
    console.log(`[LiveBlog] Deleted live blog: ${articleId}`)
  }
}

// Singleton instance
export const liveBlogStore = new LiveBlogStore()

// ============================================================================
// LIVE BLOG SCHEMA GENERATION
// ============================================================================

/**
 * Generate LiveBlogPosting schema
 */
export function generateLiveBlogSchema(
  article: GeneratedArticle,
  slug: string,
  updates: LiveBlogUpdate[],
  metadata: LiveBlogMetadata
): LiveBlogPosting {
  const baseUrl = 'https://siaintel.com'
  const articleUrl = `${baseUrl}/${article.language}/news/${slug}`

  const schema: LiveBlogPosting = {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    '@id': articleUrl,
    headline: article.headline,
    description: article.summary,
    coverageStartTime: metadata.coverageStartTime,
    ...(metadata.coverageEndTime && { coverageEndTime: metadata.coverageEndTime }),
    datePublished: article.metadata.generatedAt,
    dateModified: metadata.lastUpdateTime,
    author: {
      '@type': 'Organization',
      name: getAuthorName(article.language),
      url: `${baseUrl}/about`
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIAINTEL',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 600,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
      url: articleUrl
    },
    liveBlogUpdate: updates.map((update, index) => ({
      '@type': 'BlogPosting',
      id: update.id || `update-${index}`,
      position: update.position ?? (updates.length - index),
      headline: update.headline,
      articleBody: update.articleBody,
      datePublished: update.datePublished,
      ...(update.author && {
        author: {
          '@type': 'Person',
          name: update.author
        }
      }),
      ...(update.image && {
        image: {
          '@type': 'ImageObject',
          url: update.image.url,
          ...(update.image.caption && { caption: update.image.caption })
        }
      })
    })),
    isAccessibleForFree: true,
    inLanguage: article.language,
    ...(article.entities.length > 0 && {
      about: article.entities.slice(0, 3).map(entity => ({
        '@type': 'Thing',
        name: entity.primaryName
      }))
    })
  }

  return schema
}

/**
 * Get author name by language
 */
function getAuthorName(language: Language): string {
  const names: Record<Language, string> = {
    tr: 'SIA Canlı Analiz',
    en: 'SIA Live Analysis',
    de: 'SIA Live-Analyse',
    fr: 'SIA Analyse en Direct',
    es: 'SIA Análisis en Vivo',
    ru: 'SIA Живой Анализ',
    ar: 'تحليل SIA المباشر',
    jp: 'SIAライブ分析',
    zh: 'SIA实时分析'
  }
  return names[language]
}

// ============================================================================
// LIVE BLOG MANAGER CLASS
// ============================================================================

export class LiveBlogManager {
  /**
   * Start live coverage for an article
   */
  static startCoverage(articleId: string): LiveBlogMetadata {
    return liveBlogStore.startLiveBlog(articleId)
  }

  /**
   * Add update to live blog
   */
  static addUpdate(
    articleId: string,
    headline: string,
    content: string,
    author?: string,
    imageUrl?: string,
    imageCaption?: string
  ): LiveBlogUpdate {
    return liveBlogStore.addUpdate(articleId, {
      headline,
      articleBody: content,
      datePublished: new Date().toISOString(),
      author,
      ...(imageUrl && {
        image: {
          url: imageUrl,
          caption: imageCaption
        }
      })
    })
  }

  /**
   * End live coverage
   */
  static endCoverage(articleId: string): void {
    liveBlogStore.endLiveBlog(articleId)
  }

  /**
   * Pause live coverage
   */
  static pauseCoverage(articleId: string): void {
    liveBlogStore.pauseLiveBlog(articleId)
  }

  /**
   * Resume live coverage
   */
  static resumeCoverage(articleId: string): void {
    liveBlogStore.resumeLiveBlog(articleId)
  }

  /**
   * Get live blog status
   */
  static getStatus(articleId: string): LiveBlogMetadata | undefined {
    return liveBlogStore.getMetadata(articleId)
  }

  /**
   * Get all updates
   */
  static getUpdates(articleId: string): LiveBlogUpdate[] {
    return liveBlogStore.getUpdates(articleId)
  }

  /**
   * Check if article is live
   */
  static isLive(articleId: string): boolean {
    return liveBlogStore.isLive(articleId)
  }

  /**
   * Get all active live blogs
   */
  static getActiveLiveBlogs(): LiveBlogMetadata[] {
    return liveBlogStore.getActiveLiveBlogs()
  }

  /**
   * Generate complete LiveBlogPosting schema
   */
  static generateSchema(
    article: GeneratedArticle,
    slug: string
  ): LiveBlogPosting | null {
    const metadata = liveBlogStore.getMetadata(article.id)
    if (!metadata) {
      return null
    }

    const updates = liveBlogStore.getUpdates(article.id)
    return generateLiveBlogSchema(article, slug, updates, metadata)
  }

  /**
   * Auto-generate update from breaking news
   */
  static async autoGenerateUpdate(
    articleId: string,
    breakingNews: string,
    language: Language = 'en'
  ): Promise<LiveBlogUpdate> {
    // Extract headline (first sentence)
    const sentences = breakingNews.split(/[.!?]+/)
    const headline = sentences[0].trim()
    const content = breakingNews

    const timestamp = new Date().toISOString()
    const timeLabel = formatTimeLabel(timestamp, language)

    return this.addUpdate(
      articleId,
      `${timeLabel}: ${headline}`,
      content,
      getAuthorName(language)
    )
  }

  /**
   * Cleanup old ended live blogs (older than 24 hours)
   */
  static cleanupOldLiveBlogs(): number {
    const activeLiveBlogs = liveBlogStore.getActiveLiveBlogs()
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    let cleaned = 0

    activeLiveBlogs.forEach(metadata => {
      if (metadata.status === 'ended' && metadata.coverageEndTime) {
        const endTime = new Date(metadata.coverageEndTime).getTime()
        if (endTime < oneDayAgo) {
          liveBlogStore.deleteLiveBlog(metadata.articleId)
          cleaned++
        }
      }
    })

    console.log(`[LiveBlog] Cleaned up ${cleaned} old live blogs`)
    return cleaned
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format time label for updates
 */
function formatTimeLabel(isoString: string, language: Language): string {
  const date = new Date(isoString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  const labels: Record<Language, string> = {
    tr: `${hours}:${minutes}`,
    en: `${hours}:${minutes}`,
    de: `${hours}:${minutes}`,
    fr: `${hours}:${minutes}`,
    es: `${hours}:${minutes}`,
    ru: `${hours}:${minutes}`,
    ar: `${hours}:${minutes}`,
    jp: `${hours}:${minutes}`,
    zh: `${hours}:${minutes}`
  }

  return labels[language]
}

/**
 * Validate LiveBlogPosting schema
 */
export interface LiveBlogValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number
}

export function validateLiveBlogSchema(schema: LiveBlogPosting): LiveBlogValidation {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100

  // Required fields
  if (!schema['@type'] || schema['@type'] !== 'LiveBlogPosting') {
    errors.push('Schema type must be LiveBlogPosting')
    score -= 30
  }

  if (!schema.coverageStartTime) {
    errors.push('coverageStartTime is required')
    score -= 20
  }

  if (!schema.liveBlogUpdate || schema.liveBlogUpdate.length === 0) {
    errors.push('At least one liveBlogUpdate is required')
    score -= 20
  }

  if (!schema.headline || schema.headline.length < 10) {
    errors.push('Headline must be at least 10 characters')
    score -= 10
  }

  // Warnings
  if (schema.liveBlogUpdate && schema.liveBlogUpdate.length < 3) {
    warnings.push('Recommended: At least 3 updates for better visibility')
    score -= 5
  }

  if (!schema.coverageEndTime && schema.liveBlogUpdate.length > 0) {
    const lastUpdate = schema.liveBlogUpdate[0]
    const lastUpdateTime = new Date(lastUpdate.datePublished as string).getTime()
    const now = Date.now()
    const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60)

    if (hoursSinceUpdate > 2) {
      warnings.push('No updates in 2+ hours - consider ending coverage')
      score -= 5
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score)
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default LiveBlogManager
