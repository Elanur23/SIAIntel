/**
 * SIA Batch Indexing System
 * 
 * Handles batch indexing of multiple articles across all 7 languages.
 * Optimized for high-volume publishing with rate limiting and priority queuing.
 * 
 * Features:
 * - Batch URL notifications (up to 100 URLs per batch)
 * - Priority queuing (CRITICAL > HIGH > MEDIUM)
 * - Rate limiting (200 requests/minute)
 * - Automatic retry on failure
 * - Real-time progress tracking
 */

import {
  notifyGoogleBatch,
  generatePriorityIndexingPayload,
  checkRateLimit,
  updateStats,
  type BatchIndexingRequest,
  type BatchIndexingResponse,
  type PriorityIndexingMetadata
} from './google-indexing-api'

import { getStructuredData } from './publishing-pipeline'
import type { GeneratedArticle, Language, Region } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface BatchIndexingPayload {
  update_request: {
    timestamp: string
    batch_id: string
    urls: string[]
    priority: 'HIGH_PRIORITY_FINANCIAL_NEWS' | 'STANDARD_NEWS' | 'ARCHIVE_UPDATE'
    notify_google_bot: boolean
  }
}

export interface BatchArticle {
  id: string
  slug: string
  language: Language
  region: Region
  eeatScore: number
  regulatoryEntities: string[]
  hasStructuredData: boolean
  hasVoiceSearchOptimization: boolean
  hasFeaturedSnippetOptimization: boolean
  adPlacementOptimized: boolean
}

export interface BatchIndexingJob {
  jobId: string
  batchId: string
  articles: BatchArticle[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  startedAt?: string
  completedAt?: string
  results?: BatchIndexingResponse
  error?: string
}

// ============================================================================
// BATCH QUEUE MANAGEMENT
// ============================================================================

const batchQueue = new Map<string, BatchIndexingJob>()
let isProcessing = false

/**
 * Create a batch indexing job
 * 
 * @param articles - Array of articles to index
 * @param priority - Job priority (CRITICAL/HIGH/MEDIUM)
 * @returns Job ID
 */
export function createBatchIndexingJob(
  articles: BatchArticle[],
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH'
): string {
  const jobId = generateJobId()
  const batchId = generateBatchId()
  
  const job: BatchIndexingJob = {
    jobId,
    batchId,
    articles,
    priority,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
  
  batchQueue.set(jobId, job)
  
  console.log(`[Batch Indexing] Created job ${jobId} with ${articles.length} articles (Priority: ${priority})`)
  
  // Start processing if not already running
  if (!isProcessing) {
    processQueue()
  }
  
  return jobId
}

/**
 * Process batch indexing queue
 * 
 * Processes jobs in priority order:
 * 1. CRITICAL (E-E-A-T ≥85 + 21 entities)
 * 2. HIGH (E-E-A-T ≥75)
 * 3. MEDIUM (E-E-A-T <75)
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return
  
  isProcessing = true
  
  try {
    while (batchQueue.size > 0) {
      // Get next job by priority
      const job = getNextJob()
      
      if (!job) break
      
      // Update job status
      job.status = 'PROCESSING'
      job.startedAt = new Date().toISOString()
      
      console.log(`[Batch Indexing] Processing job ${job.jobId} (${job.articles.length} articles)`)
      
      try {
        // Process batch
        const result = await processBatchJob(job)
        
        // Update job with results
        job.status = 'COMPLETED'
        job.completedAt = new Date().toISOString()
        job.results = result
        
        console.log(`[Batch Indexing] Completed job ${job.jobId}: ${result.successful}/${result.totalRequests} successful`)
        
      } catch (error) {
        // Update job with error
        job.status = 'FAILED'
        job.completedAt = new Date().toISOString()
        job.error = error instanceof Error ? error.message : 'Unknown error'
        
        console.error(`[Batch Indexing] Failed job ${job.jobId}:`, error)
      }
      
      // Remove completed/failed jobs after 1 hour
      setTimeout(() => {
        batchQueue.delete(job.jobId)
      }, 60 * 60 * 1000)
      
      // Rate limiting: wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } finally {
    isProcessing = false
  }
}

/**
 * Get next job from queue by priority
 */
function getNextJob(): BatchIndexingJob | undefined {
  const pendingJobs = Array.from(batchQueue.values())
    .filter(job => job.status === 'PENDING')
  
  if (pendingJobs.length === 0) return undefined
  
  // Sort by priority (CRITICAL > HIGH > MEDIUM)
  pendingJobs.sort((a, b) => {
    const priorityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
  
  return pendingJobs[0]
}

/**
 * Process a single batch job
 */
async function processBatchJob(job: BatchIndexingJob): Promise<BatchIndexingResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  
  // Build URLs from articles
  const urls = job.articles.map(article => 
    `${baseUrl}/${article.language}/news/${article.slug}`
  )
  
  // Log batch payload
  logBatchPayload(job, urls)
  
  // Check rate limit
  if (!checkRateLimit('batch')) {
    throw new Error('Rate limit exceeded. Please wait before sending more requests.')
  }
  
  // Send batch request to Google
  const result = await notifyGoogleBatch({
    urls,
    type: 'URL_UPDATED'
  })
  
  // Update statistics
  result.results.forEach(r => updateStats(r))
  
  return result
}

/**
 * Log batch payload for monitoring
 */
function logBatchPayload(job: BatchIndexingJob, urls: string[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[BATCH_INDEXING] Job ${job.batchId}: ${urls.length} URLs | Priority: ${job.priority}`)
  }
}

// ============================================================================
// BATCH PAYLOAD GENERATION
// ============================================================================

/**
 * Generate SIA batch indexing payload (compatible with user's format)
 * 
 * @param articles - Array of articles to index
 * @param priority - Batch priority
 * @returns Batch indexing payload
 */
export function generateBatchPayload(
  articles: BatchArticle[],
  priority: 'HIGH_PRIORITY_FINANCIAL_NEWS' | 'STANDARD_NEWS' | 'ARCHIVE_UPDATE' = 'HIGH_PRIORITY_FINANCIAL_NEWS'
): BatchIndexingPayload {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  
  const urls = articles.map(article => 
    `${baseUrl}/${article.language}/news/${article.slug}`
  )
  
  return {
    update_request: {
      timestamp: new Date().toISOString(),
      batch_id: generateBatchId(),
      urls,
      priority,
      notify_google_bot: true
    }
  }
}

/**
 * Process batch payload (user's format)
 * 
 * @param payload - Batch indexing payload
 * @returns Batch indexing response
 */
export async function processBatchPayload(
  payload: BatchIndexingPayload
): Promise<BatchIndexingResponse> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 SIA_INSTANT_INDEX_PAYLOAD - PROCESSING')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📦 Batch ID:', payload.update_request.batch_id)
  console.log('⏰ Timestamp:', payload.update_request.timestamp)
  console.log('🎯 Priority:', payload.update_request.priority)
  console.log('📊 Total URLs:', payload.update_request.urls.length)
  console.log('🤖 Notify Google Bot:', payload.update_request.notify_google_bot ? 'YES' : 'NO')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 URLS TO INDEX:')
  
  payload.update_request.urls.forEach((url, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${url}`)
  })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Check rate limit
  if (!checkRateLimit('batch')) {
    throw new Error('Rate limit exceeded. Please wait before sending more requests.')
  }
  
  // Send batch request to Google
  const result = await notifyGoogleBatch({
    urls: payload.update_request.urls,
    type: 'URL_UPDATED'
  })
  
  console.log('✅ Batch processing completed:')
  console.log(`   • Total: ${result.totalRequests}`)
  console.log(`   • Successful: ${result.successful}`)
  console.log(`   • Failed: ${result.failed}`)
  console.log(`   • Processing Time: ${result.processingTime}ms`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Update statistics
  result.results.forEach(r => updateStats(r))
  
  return result
}

// ============================================================================
// MULTILINGUAL BATCH INDEXING
// ============================================================================

/**
 * Index all language versions of an article
 * 
 * @param articleId - Base article ID
 * @param slug - Article slug (same across languages)
 * @param languages - Languages to index
 * @returns Batch indexing response
 */
export async function indexMultilingualArticle(
  articleId: string,
  slug: string,
  languages: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar']
): Promise<BatchIndexingResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  
  const urls = languages.map(lang => `${baseUrl}/${lang}/news/${slug}`)
  
  console.log(`[Batch Indexing] Indexing multilingual article: ${articleId}`)
  console.log(`[Batch Indexing] Languages: ${languages.join(', ')}`)
  
  return await notifyGoogleBatch({
    urls,
    type: 'URL_UPDATED'
  })
}

/**
 * Index all articles published today
 * 
 * @returns Batch indexing response
 */
export async function indexTodaysArticles(): Promise<BatchIndexingResponse> {
  // This would fetch articles from database
  // For now, return empty response
  console.log('[Batch Indexing] Indexing today\'s articles...')
  
  return {
    totalRequests: 0,
    successful: 0,
    failed: 0,
    results: [],
    processingTime: 0
  }
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

/**
 * Get batch indexing job status
 * 
 * @param jobId - Job ID
 * @returns Job status or undefined if not found
 */
export function getBatchJobStatus(jobId: string): BatchIndexingJob | undefined {
  return batchQueue.get(jobId)
}

/**
 * Get all batch indexing jobs
 * 
 * @returns Array of all jobs
 */
export function getAllBatchJobs(): BatchIndexingJob[] {
  return Array.from(batchQueue.values())
}

/**
 * Cancel a pending batch job
 * 
 * @param jobId - Job ID
 * @returns Success status
 */
export function cancelBatchJob(jobId: string): boolean {
  const job = batchQueue.get(jobId)
  
  if (!job || job.status !== 'PENDING') {
    return false
  }
  
  batchQueue.delete(jobId)
  console.log(`[Batch Indexing] Cancelled job ${jobId}`)
  
  return true
}

/**
 * Get batch indexing statistics
 * 
 * @returns Statistics object
 */
export function getBatchStatistics(): {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  totalArticlesIndexed: number
  successRate: number
} {
  const jobs = Array.from(batchQueue.values())
  
  const totalJobs = jobs.length
  const pendingJobs = jobs.filter(j => j.status === 'PENDING').length
  const processingJobs = jobs.filter(j => j.status === 'PROCESSING').length
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length
  const failedJobs = jobs.filter(j => j.status === 'FAILED').length
  
  const totalArticlesIndexed = jobs
    .filter(j => j.status === 'COMPLETED')
    .reduce((sum, j) => sum + (j.results?.successful || 0), 0)
  
  const totalAttempted = jobs
    .filter(j => j.status === 'COMPLETED')
    .reduce((sum, j) => sum + (j.results?.totalRequests || 0), 0)
  
  const successRate = totalAttempted > 0 
    ? (totalArticlesIndexed / totalAttempted) * 100 
    : 0
  
  return {
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    totalArticlesIndexed,
    successRate
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function generateBatchId(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `SIA_GLOBAL_BATCH_${date}_${random}`
}

