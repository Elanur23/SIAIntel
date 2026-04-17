/**
 * POST /api/sia-news/index-google
 * 
 * Manually trigger Google Indexing API notification for an article
 * 
 * This endpoint allows manual triggering of Google indexing for:
 * - Newly published articles
 * - Updated articles
 * - Batch indexing of multiple articles
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  indexNewArticle,
  indexUpdatedArticle,
  indexArticlesBatch,
  validateConfiguration,
  getStats,
  checkRateLimit
} from '@/lib/sia-news/google-indexing-api'

// ============================================================================
// POST - Trigger Google Indexing
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const configValidation = validateConfiguration()
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Indexing API not configured',
          details: configValidation.errors
        },
        { status: 500 }
      )
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: 'Maximum 200 requests per minute'
        },
        { status: 429 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    // Batch indexing
    if (body.articles && Array.isArray(body.articles)) {
      const result = await indexArticlesBatch(body.articles)
      
      return NextResponse.json({
        success: true,
        type: 'batch',
        data: result,
        metadata: {
          timestamp: new Date().toISOString()
        }
      })
    }
    
    // Single article indexing
    if (!body.articleId || !body.slug || !body.language) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: 'articleId, slug, and language are required'
        },
        { status: 400 }
      )
    }
    
    const action = body.action || 'new' // 'new' or 'update'
    
    const result = action === 'update'
      ? await indexUpdatedArticle(body.articleId, body.slug, body.language)
      : await indexNewArticle(body.articleId, body.slug, body.language)
    
    return NextResponse.json({
      success: result.success,
      type: 'single',
      data: result,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('[Google Indexing API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger Google indexing',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get Indexing Statistics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const stats = getStats()
    
    return NextResponse.json({
      success: true,
      stats,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('[Google Indexing Stats] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve indexing statistics'
      },
      { status: 500 }
    )
  }
}
