/**
 * SIA News Batch Indexing API
 * 
 * Handles batch indexing of multiple articles to Google.
 * Supports both custom format and SIA_INSTANT_INDEX_PAYLOAD format.
 * 
 * POST /api/sia-news/batch-index
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createBatchIndexingJob,
  processBatchPayload,
  generateBatchPayload,
  getBatchJobStatus,
  getAllBatchJobs,
  getBatchStatistics,
  cancelBatchJob,
  type BatchIndexingPayload,
  type BatchArticle
} from '@/lib/sia-news/batch-indexing'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST - Create Batch Indexing Job
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is SIA_INSTANT_INDEX_PAYLOAD format
    if (body.update_request) {
      return await handleSIAPayload(body as BatchIndexingPayload)
    }
    
    // Otherwise, handle custom format
    return await handleCustomFormat(body)
    
  } catch (error) {
    console.error('[Batch Indexing API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Batch indexing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle SIA_INSTANT_INDEX_PAYLOAD format
 */
async function handleSIAPayload(payload: BatchIndexingPayload) {
  console.log('[Batch Indexing API] Processing SIA_INSTANT_INDEX_PAYLOAD')
  
  try {
    const result = await processBatchPayload(payload)
    
    return NextResponse.json({
      success: true,
      batchId: payload.update_request.batch_id,
      timestamp: payload.update_request.timestamp,
      priority: payload.update_request.priority,
      totalUrls: payload.update_request.urls.length,
      result: {
        totalRequests: result.totalRequests,
        successful: result.successful,
        failed: result.failed,
        processingTime: result.processingTime
      },
      message: `Successfully notified Google about ${result.successful}/${result.totalRequests} URLs`
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        batchId: payload.update_request.batch_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle custom format
 */
async function handleCustomFormat(body: any) {
  console.log('[Batch Indexing API] Processing custom format')
  
  // Validate request body
  if (!body.articles || !Array.isArray(body.articles)) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid articles array' },
      { status: 400 }
    )
  }
  
  const articles: BatchArticle[] = body.articles
  const priority = body.priority || 'HIGH'
  
  // Create batch indexing job
  const jobId = createBatchIndexingJob(articles, priority)
  
  return NextResponse.json({
    success: true,
    jobId,
    articlesCount: articles.length,
    priority,
    status: 'PENDING',
    message: 'Batch indexing job created. Processing will start shortly.',
    checkStatusUrl: `/api/sia-news/batch-index?jobId=${jobId}`
  })
}

// ============================================================================
// GET - Get Job Status or Statistics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const action = searchParams.get('action')
    
    // Get specific job status
    if (jobId) {
      const job = getBatchJobStatus(jobId)
      
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        job: {
          jobId: job.jobId,
          batchId: job.batchId,
          articlesCount: job.articles.length,
          priority: job.priority,
          status: job.status,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          result: job.results ? {
            totalRequests: job.results.totalRequests,
            successful: job.results.successful,
            failed: job.results.failed,
            processingTime: job.results.processingTime
          } : undefined,
          error: job.error
        }
      })
    }
    
    // Get all jobs
    if (action === 'list') {
      const jobs = getAllBatchJobs()
      
      return NextResponse.json({
        success: true,
        totalJobs: jobs.length,
        jobs: jobs.map(job => ({
          jobId: job.jobId,
          batchId: job.batchId,
          articlesCount: job.articles.length,
          priority: job.priority,
          status: job.status,
          createdAt: job.createdAt
        }))
      })
    }
    
    // Get statistics
    if (action === 'stats') {
      const stats = getBatchStatistics()
      
      return NextResponse.json({
        success: true,
        statistics: stats
      })
    }
    
    // Default: return statistics
    const stats = getBatchStatistics()
    
    return NextResponse.json({
      success: true,
      statistics: stats
    })
    
  } catch (error) {
    console.error('[Batch Indexing API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get batch indexing information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Cancel Job
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }
    
    // Cancel job (only works for PENDING jobs)
    const cancelled = cancelBatchJob(jobId)
    
    if (!cancelled) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job not found or cannot be cancelled (already processing or completed)' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Job ${jobId} cancelled successfully`
    })
    
  } catch (error) {
    console.error('[Batch Indexing API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
