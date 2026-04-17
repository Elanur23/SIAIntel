/**
 * Headless Publishing Pipeline for SIA_NEWS_v1.0
 * 
 * Autonomous publishing system that publishes articles directly to the database
 * without manual intervention. Includes webhook notifications, real-time updates,
 * and scheduled publication support.
 * 
 * Requirements: 19.1, 19.5, 20.3
 */

import {
  GeneratedArticle,
  PublicationRequest,
  PublicationResult,
  WebhookPayload,
  ArticleRecord,
  ConsensusResult,
  Language,
  Region
} from './types'

import {
  createArticle,
  updateIndexes,
  createVersion,
  storeValidationLog,
  storePerformanceMetrics
} from './database'

import {
  generateStructuredData,
  generateSlug,
  validateStructuredData,
  type StructuredDataSchema
} from './structured-data-generator'

import {
  addToBuffer,
  type BufferedArticle
} from '@/lib/content/content-buffer-system'

import {
  indexNewArticle,
  generatePriorityIndexingPayload,
  updateStats as updateIndexingStats,
  type PriorityIndexingMetadata
} from './google-indexing-api'

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

interface WebhookRegistration {
  id: string
  url: string
  events: ('ARTICLE_PUBLISHED' | 'ARTICLE_UPDATED' | 'ARTICLE_REJECTED')[]
  secret: string
  active: boolean
  createdAt: string
}

interface ScheduledPublication {
  id: string
  article: GeneratedArticle
  validationResult: ConsensusResult
  scheduledTime: string
  status: 'PENDING' | 'PUBLISHED' | 'FAILED'
  createdAt: string
}

// In-memory storage for webhooks and scheduled publications
const webhooks = new Map<string, WebhookRegistration>()
const scheduledPublications = new Map<string, ScheduledPublication>()

// Dashboard metrics (in-memory for real-time updates)
let dashboardMetrics = {
  totalPublished: 0,
  publishedToday: 0,
  failedToday: 0,
  avgPublishingTime: 0,
  lastPublishedAt: '',
  byLanguage: {} as Record<string, number>,
  byRegion: {} as Record<string, number>,
  webhooksTriggered: 0,
  scheduledCount: 0
}

// Structured data storage (in-memory for quick access)
const structuredDataCache = new Map<string, StructuredDataSchema>()

// ============================================================================
// CORE PUBLISHING FUNCTIONS
// ============================================================================

/**
 * Publish an article directly to the database (headless publishing)
 * 
 * This is the main entry point for autonomous publishing. It:
 * 1. Stores the article in the database
 * 2. Updates all indexes
 * 3. Creates version history
 * 4. Triggers webhooks
 * 5. Updates dashboard metrics
 * 6. Optionally adds to content buffer for scheduled publishing
 * 
 * @param request - Publication request with article and validation result
 * @returns Publication result with success status and metadata
 */
export async function publishArticle(
  request: PublicationRequest
): Promise<PublicationResult> {
  const startTime = Date.now()
  
  try {
    const { article, validationResult, publishImmediately, scheduledTime, useBuffer } = request
    
    // If using content buffer system, add to buffer instead of immediate publish
    if (useBuffer && !publishImmediately) {
      const bufferedArticle = addToBuffer(article)
      
      return {
        success: true,
        articleId: article.id,
        publishedAt: '', // Not published yet, in buffer
        webhooksTriggered: 0,
        indexesUpdated: [],
        error: undefined,
        buffered: true,
        bufferId: bufferedArticle.bufferId
      }
    }
    
    // If scheduled for later, add to schedule queue
    if (!publishImmediately && scheduledTime) {
      const scheduleId = await schedulePublication(article, validationResult, scheduledTime)
      
      return {
        success: true,
        articleId: article.id,
        publishedAt: scheduledTime,
        webhooksTriggered: 0,
        indexesUpdated: [],
        error: undefined
      }
    }
    
    // Generate structured data (JSON-LD schema)
    const slug = generateSlug(article.headline)
    const structuredData = generateStructuredData(article, slug)
    
    // Validate structured data
    const schemaValidation = validateStructuredData(structuredData)
    if (!schemaValidation.isValid) {
      console.warn(`[Publishing] Schema validation warnings for ${article.id}:`, schemaValidation.errors)
    }
    
    // Cache structured data for quick retrieval
    structuredDataCache.set(article.id, structuredData)
    
    // Store article in database
    const articleId = await storeArticle(article, validationResult, structuredData, slug)
    
    // Update indexes for efficient querying
    const indexesUpdated = await updateArticleIndexes(article)
    
    // Create version history entry
    await createVersionHistory(article)
    
    // Trigger webhook notifications
    const webhooksTriggered = await triggerWebhooks({
      event: 'ARTICLE_PUBLISHED',
      articleId: article.id,
      language: article.language,
      region: article.region,
      timestamp: new Date().toISOString(),
      metadata: {
        eeatScore: article.eeatScore,
        sentiment: article.sentiment.overall,
        entities: article.entities.map(e => e.primaryName)
      }
    })
    
    // Notify external systems (if configured)
    await notifyExternalSystems(article, 'PUBLISHED')
    
    // Notify Google Indexing API for instant indexing
    await notifyGoogleIndexing(article, slug, structuredData)
    
    // Update real-time dashboard metrics
    await updateDashboardMetrics(article, 'PUBLISHED')
    
    // Store performance metrics
    const processingTime = Date.now() - startTime
    await storePerformanceMetrics({
      component: 'publishing-pipeline',
      operation: 'publishArticle',
      duration: processingTime,
      success: true,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      articleId,
      publishedAt: new Date().toISOString(),
      webhooksTriggered,
      indexesUpdated,
      error: undefined
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Store failure metrics
    await storePerformanceMetrics({
      component: 'publishing-pipeline',
      operation: 'publishArticle',
      duration: processingTime,
      success: false,
      timestamp: new Date().toISOString()
    })
    
    // Update dashboard with failure
    dashboardMetrics.failedToday++
    
    return {
      success: false,
      articleId: request.article.id,
      publishedAt: '',
      webhooksTriggered: 0,
      indexesUpdated: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Store article in database with unique ID and timestamp
 * 
 * Converts GeneratedArticle to ArticleRecord format and stores in database.
 * Generates unique ID if not present and sets publication timestamp.
 * 
 * @param article - Generated article to store
 * @param validationResult - Validation result from multi-agent system
 * @param structuredData - JSON-LD structured data schema
 * @param slug - URL-friendly slug
 * @returns Article ID
 */
export async function storeArticle(
  article: GeneratedArticle,
  validationResult: ConsensusResult,
  structuredData?: StructuredDataSchema,
  slug?: string
): Promise<string> {
  // Generate unique ID if not present
  const articleId = article.id || generateUniqueId()
  
  // Create article record
  const record: ArticleRecord = {
    id: articleId,
    language: article.language,
    region: article.region,
    
    // Content
    headline: article.headline,
    summary: article.summary,
    siaInsight: article.siaInsight,
    riskDisclaimer: article.riskDisclaimer,
    fullContent: article.fullContent,
    
    // Structured data
    entities: article.entities.map(e => e.primaryName),
    causalChains: article.causalChains.map(c => c.id),
    technicalGlossary: article.technicalGlossary.map(g => g.term),
    
    // Scores and metrics
    sentiment: article.sentiment.overall,
    eeatScore: article.eeatScore,
    originalityScore: article.originalityScore,
    technicalDepth: article.technicalDepth,
    confidenceScore: article.metadata.confidenceScore,
    
    // Metadata
    generatedAt: article.metadata.generatedAt,
    publishedAt: new Date().toISOString(),
    sources: article.metadata.sources,
    wordCount: article.metadata.wordCount,
    readingTime: article.metadata.readingTime,
    
    // Validation
    validationResult: JSON.stringify(validationResult),
    adSenseCompliant: article.adSenseCompliant,
    
    // Version control
    version: 1,
    previousVersionId: undefined
  }
  
  // Store in database
  await createArticle(record)
  
  // Store validation logs
  await storeValidationLog(articleId, validationResult.validationResults)
  
  // Store structured data if provided
  if (structuredData) {
    // Store in cache for quick retrieval
    structuredDataCache.set(articleId, structuredData)
    
    // In production, this would also be stored in database
    // For now, we keep it in memory cache
  }
  
  return articleId
}

/**
 * Update indexes for efficient article querying
 * 
 * Updates multi-dimensional indexes:
 * - Language index
 * - Region index
 * - Entity index
 * - Sentiment index
 * - Date index
 * 
 * @param article - Article to index
 * @returns Array of updated index names
 */
export async function updateArticleIndexes(article: GeneratedArticle): Promise<string[]> {
  const record: ArticleRecord = {
    id: article.id,
    language: article.language,
    region: article.region,
    headline: article.headline,
    summary: article.summary,
    siaInsight: article.siaInsight,
    riskDisclaimer: article.riskDisclaimer,
    fullContent: article.fullContent,
    entities: article.entities.map(e => e.primaryName),
    causalChains: article.causalChains.map(c => c.id),
    technicalGlossary: article.technicalGlossary.map(g => g.term),
    sentiment: article.sentiment.overall,
    eeatScore: article.eeatScore,
    originalityScore: article.originalityScore,
    technicalDepth: article.technicalDepth,
    confidenceScore: article.metadata.confidenceScore,
    generatedAt: article.metadata.generatedAt,
    publishedAt: new Date().toISOString(),
    sources: article.metadata.sources,
    wordCount: article.metadata.wordCount,
    readingTime: article.metadata.readingTime,
    validationResult: '',
    adSenseCompliant: article.adSenseCompliant,
    version: 1
  }
  
  await updateIndexes(record)
  
  return [
    'language',
    'region',
    'entity',
    'sentiment',
    'date'
  ]
}

/**
 * Create version history entry for article tracking
 * 
 * Maintains version history for all article changes. Each version
 * is stored as a separate record with a link to the previous version.
 * 
 * @param article - Article to version
 */
export async function createVersionHistory(article: GeneratedArticle): Promise<void> {
  // Version history is handled by the database layer
  // This function is a placeholder for future enhancements
  // such as storing version metadata, change logs, etc.
  
  // For now, we just ensure the article has version information
  // The database layer will handle version linking when updates occur
}

// ============================================================================
// WEBHOOK NOTIFICATIONS
// ============================================================================

/**
 * Trigger webhook notifications for external systems
 * 
 * Sends HTTP POST requests to all registered webhooks that are
 * subscribed to the event type. Includes article metadata and
 * authentication via webhook secret.
 * 
 * @param payload - Webhook payload with event data
 * @returns Number of webhooks successfully triggered
 */
export async function triggerWebhooks(payload: WebhookPayload): Promise<number> {
  let successCount = 0
  
  // Get all active webhooks subscribed to this event
  const relevantWebhooks = Array.from(webhooks.values()).filter(
    webhook => webhook.active && webhook.events.includes(payload.event)
  )
  
  // Trigger webhooks in parallel
  const results = await Promise.allSettled(
    relevantWebhooks.map(webhook => sendWebhook(webhook, payload))
  )
  
  // Count successful triggers
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      successCount++
    }
  })
  
  // Update metrics
  dashboardMetrics.webhooksTriggered += successCount
  
  return successCount
}

/**
 * Send webhook HTTP request
 * 
 * @param webhook - Webhook registration
 * @param payload - Webhook payload
 * @returns Success status
 */
async function sendWebhook(
  webhook: WebhookRegistration,
  payload: WebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        'X-Webhook-Event': payload.event
      },
      body: JSON.stringify(payload)
    })
    
    return response.ok
  } catch (error) {
    console.error(`Webhook ${webhook.id} failed:`, error)
    return false
  }
}

/**
 * Register a new webhook
 * 
 * @param url - Webhook URL
 * @param events - Events to subscribe to
 * @param secret - Webhook secret for authentication
 * @returns Webhook ID
 */
export function registerWebhook(
  url: string,
  events: ('ARTICLE_PUBLISHED' | 'ARTICLE_UPDATED' | 'ARTICLE_REJECTED')[],
  secret: string
): string {
  const id = generateUniqueId()
  
  webhooks.set(id, {
    id,
    url,
    events,
    secret,
    active: true,
    createdAt: new Date().toISOString()
  })
  
  return id
}

/**
 * Unregister a webhook
 * 
 * @param webhookId - Webhook ID
 */
export function unregisterWebhook(webhookId: string): void {
  webhooks.delete(webhookId)
}

/**
 * Get all registered webhooks
 * 
 * @returns Array of webhook registrations
 */
export function getWebhooks(): WebhookRegistration[] {
  return Array.from(webhooks.values())
}

// ============================================================================
// EXTERNAL SYSTEM NOTIFICATIONS
// ============================================================================

/**
 * Notify external systems of article publication
 * 
 * This function can be extended to integrate with:
 * - Content delivery networks (CDN)
 * - Search engines (for indexing)
 * - Social media platforms
 * - Email notification services
 * - Analytics platforms
 * 
 * @param article - Published article
 * @param status - Publication status
 */
export async function notifyExternalSystems(
  article: GeneratedArticle,
  status: 'PUBLISHED' | 'UPDATED' | 'REJECTED'
): Promise<void> {
  // Placeholder for external system integrations
  // In production, this would trigger:
  // - CDN cache invalidation
  // - Search engine ping
  // - Social media auto-posting
  // - Email notifications to subscribers
  // - Analytics event tracking
  
  console.log(`External systems notified: ${article.id} - ${status}`)
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

/**
 * Update real-time dashboard metrics
 * 
 * Maintains real-time statistics for monitoring dashboard:
 * - Total published articles
 * - Articles published today
 * - Failed publications today
 * - Average publishing time
 * - Breakdown by language and region
 * 
 * @param article - Published article
 * @param status - Publication status
 */
export async function updateDashboardMetrics(
  article: GeneratedArticle,
  status: 'PUBLISHED' | 'FAILED'
): Promise<void> {
  if (status === 'PUBLISHED') {
    dashboardMetrics.totalPublished++
    dashboardMetrics.publishedToday++
    dashboardMetrics.lastPublishedAt = new Date().toISOString()
    
    // Update language breakdown
    const lang = article.language
    dashboardMetrics.byLanguage[lang] = (dashboardMetrics.byLanguage[lang] || 0) + 1
    
    // Update region breakdown
    const region = article.region
    dashboardMetrics.byRegion[region] = (dashboardMetrics.byRegion[region] || 0) + 1
  } else {
    dashboardMetrics.failedToday++
  }
}

/**
 * Get current dashboard metrics
 * 
 * @returns Dashboard metrics object
 */
export function getDashboardMetrics() {
  return { ...dashboardMetrics }
}

/**
 * Reset daily metrics (should be called at midnight)
 */
export function resetDailyMetrics(): void {
  dashboardMetrics.publishedToday = 0
  dashboardMetrics.failedToday = 0
}

// ============================================================================
// SCHEDULED PUBLICATION
// ============================================================================

/**
 * Schedule an article for delayed publication
 * 
 * Adds article to scheduled publication queue. The article will be
 * automatically published at the specified time by the scheduler.
 * 
 * @param article - Article to schedule
 * @param validationResult - Validation result
 * @param scheduledTime - ISO 8601 timestamp for publication
 * @returns Schedule ID
 */
export async function schedulePublication(
  article: GeneratedArticle,
  validationResult: ConsensusResult,
  scheduledTime: string
): Promise<string> {
  const id = generateUniqueId()
  
  scheduledPublications.set(id, {
    id,
    article,
    validationResult,
    scheduledTime,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  })
  
  dashboardMetrics.scheduledCount++
  
  return id
}

/**
 * Process scheduled publications (should be called periodically)
 * 
 * Checks for scheduled publications that are due and publishes them.
 * This function should be called by a scheduler (e.g., cron job) every minute.
 * 
 * @returns Number of articles published
 */
export async function processScheduledPublications(): Promise<number> {
  const now = new Date().getTime()
  let publishedCount = 0
  
  for (const [id, scheduled] of scheduledPublications.entries()) {
    if (scheduled.status !== 'PENDING') continue
    
    const scheduledTime = new Date(scheduled.scheduledTime).getTime()
    
    // Check if it's time to publish
    if (scheduledTime <= now) {
      try {
        // Publish the article
        const result = await publishArticle({
          article: scheduled.article,
          validationResult: scheduled.validationResult,
          publishImmediately: true
        })
        
        if (result.success) {
          scheduled.status = 'PUBLISHED'
          publishedCount++
          dashboardMetrics.scheduledCount--
        } else {
          scheduled.status = 'FAILED'
          dashboardMetrics.scheduledCount--
        }
        
      } catch (error) {
        console.error(`Failed to publish scheduled article ${id}:`, error)
        scheduled.status = 'FAILED'
        dashboardMetrics.scheduledCount--
      }
    }
  }
  
  // Clean up published/failed entries older than 24 hours
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  for (const [id, scheduled] of scheduledPublications.entries()) {
    if (scheduled.status !== 'PENDING') {
      const createdTime = new Date(scheduled.createdAt).getTime()
      if (createdTime < oneDayAgo) {
        scheduledPublications.delete(id)
      }
    }
  }
  
  return publishedCount
}

/**
 * Get all scheduled publications
 * 
 * @returns Array of scheduled publications
 */
export function getScheduledPublications(): ScheduledPublication[] {
  return Array.from(scheduledPublications.values())
}

/**
 * Cancel a scheduled publication
 * 
 * @param scheduleId - Schedule ID
 * @returns Success status
 */
export function cancelScheduledPublication(scheduleId: string): boolean {
  const scheduled = scheduledPublications.get(scheduleId)
  if (scheduled && scheduled.status === 'PENDING') {
    scheduledPublications.delete(scheduleId)
    dashboardMetrics.scheduledCount--
    return true
  }
  return false
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for articles, webhooks, schedules
 * 
 * @returns Unique ID string
 */
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate publication request
 * 
 * @param request - Publication request
 * @returns Validation result
 */
export function validatePublicationRequest(request: PublicationRequest): {
  valid: boolean
  errors: string[]
} {
  const errors: string[]= []
  
  if (!request.article) {
    errors.push('Article is required')
  }
  
  if (!request.validationResult) {
    errors.push('Validation result is required')
  }
  
  if (!request.article.id) {
    errors.push('Article ID is required')
  }
  
  if (!request.article.language) {
    errors.push('Article language is required')
  }
  
  if (!request.article.region) {
    errors.push('Article region is required')
  }
  
  if (request.scheduledTime && !request.publishImmediately) {
    const scheduledTime = new Date(request.scheduledTime).getTime()
    const now = Date.now()
    if (scheduledTime < now) {
      errors.push('Scheduled time must be in the future')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get publication statistics
 * 
 * @returns Publication statistics
 */
export async function getPublicationStats(): Promise<{
  totalPublished: number
  publishedToday: number
  failedToday: number
  scheduledCount: number
  webhooksRegistered: number
  byLanguage: Record<string, number>
  byRegion: Record<string, number>
}> {
  return {
    totalPublished: dashboardMetrics.totalPublished,
    publishedToday: dashboardMetrics.publishedToday,
    failedToday: dashboardMetrics.failedToday,
    scheduledCount: dashboardMetrics.scheduledCount,
    webhooksRegistered: webhooks.size,
    byLanguage: { ...dashboardMetrics.byLanguage },
    byRegion: { ...dashboardMetrics.byRegion }
  }
}

// ============================================================================
// STRUCTURED DATA RETRIEVAL
// ============================================================================

/**
 * Get structured data for an article
 * 
 * @param articleId - Article ID
 * @returns Structured data schema or undefined if not found
 */
export function getStructuredData(articleId: string): StructuredDataSchema | undefined {
  return structuredDataCache.get(articleId)
}

/**
 * Get all structured data schemas
 * 
 * @returns Map of article IDs to structured data schemas
 */
export function getAllStructuredData(): Map<string, StructuredDataSchema> {
  return new Map(structuredDataCache)
}

// ============================================================================
// GOOGLE INDEXING API INTEGRATION
// ============================================================================

/**
 * Notify Google Indexing API about new article for instant indexing
 * 
 * This triggers priority indexing with authority signals:
 * - 21 regulatory entities approved
 * - Voice search compatible
 * - E-E-A-T optimized
 * - Structured data present
 * - FinancialAnalysis schema type
 * 
 * @param article - Published article
 * @param slug - Article URL slug
 * @param structuredData - Structured data schema
 */
async function notifyGoogleIndexing(
  article: GeneratedArticle,
  slug: string,
  structuredData?: StructuredDataSchema
): Promise<void> {
  try {
    // Extract regulatory entities from structured data
    const regulatoryEntities = structuredData?.mentions
      ?.filter(m => m['@type'] === 'Organization')
      .map(m => m.name) || []
    
    // Determine schema types
    const schemaTypes = Array.isArray(structuredData?.['@type']) 
      ? structuredData['@type'] 
      : structuredData?.['@type'] 
        ? [structuredData['@type']] 
        : ['NewsArticle']
    
    // Determine indexing priority based on quality
    const instantIndexingPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 
      article.eeatScore >= 85 && regulatoryEntities.length >= 21 ? 'CRITICAL' :
      article.eeatScore >= 75 ? 'HIGH' : 'MEDIUM'
    
    // Prepare priority indexing metadata
    const metadata: PriorityIndexingMetadata = {
      eeatScore: article.eeatScore,
      regulatoryEntities,
      hasStructuredData: !!structuredData,
      hasVoiceSearchOptimization: !!structuredData?.speakable,
      hasFeaturedSnippetOptimization: !!structuredData?.hasPart && structuredData.hasPart.length > 0,
      contentType: article.technicalDepth === 'HIGH' ? 'ANALYSIS' : 'NEWS',
      region: article.region,
      language: article.language,
      schemaType: schemaTypes,
      adPlacementOptimized: !!article.metadata.adPlacement,
      instantIndexingPriority
    }
    
    // Generate priority indexing payload (for logging)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
    const articleUrl = `${baseUrl}/${article.language}/news/${slug}`
    generatePriorityIndexingPayload(articleUrl, metadata)
    
    // Notify Google Indexing API
    const indexingResponse = await indexNewArticle(article.id, slug, article.language)
    
    // Update statistics
    updateIndexingStats(indexingResponse)
    
    if (indexingResponse.success) {
      console.log(`✅ [Google Indexing] Successfully notified Google about ${article.id}`)
      console.log(`⚡ [Google Indexing] Response time: ${indexingResponse.metadata.responseTime}ms`)
      console.log(`🎯 [Google Indexing] Priority: ${instantIndexingPriority}`)
      console.log(`🏛️  [Google Indexing] Regulatory Entities: ${regulatoryEntities.length}/21`)
    } else {
      console.error(`❌ [Google Indexing] Failed to notify Google about ${article.id}:`, indexingResponse.error)
    }
    
  } catch (error) {
    // Don't fail publication if indexing fails
    console.error('❌ [Google Indexing] Error notifying Google:', error)
  }
}
