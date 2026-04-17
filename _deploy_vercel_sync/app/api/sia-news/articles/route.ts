/**
 * GET /api/sia-news/articles
 * 
 * Query articles with filters and pagination
 * 
 * Requirements: 19.2, 19.3, 19.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { queryArticles, getTotalArticleCount } from '@/lib/sia-news/database'
import type { Language, Region, ArticlesRequest, ArticlesResponse } from '@/lib/sia-news/types'

export const dynamic = 'force-dynamic'

// ============================================================================
// QUERY PARAMETER PARSING
// ============================================================================

function parseQueryParams(searchParams: URLSearchParams): {
  query: any
  page: number
  pageSize: number
  errors: string[]
} {
  const errors: string[] = []
  const query: any = {}
  
  // Language filter
  const language = searchParams.get('language')
  if (language) {
    const validLanguages = ['tr', 'en', 'de', 'fr', 'es', 'ru']
    if (!validLanguages.includes(language)) {
      errors.push(`language must be one of: ${validLanguages.join(', ')}`)
    } else {
      query.language = language as Language
    }
  }
  
  // Region filter
  const region = searchParams.get('region')
  if (region) {
    const validRegions = ['TR', 'US', 'DE', 'FR', 'ES', 'RU']
    if (!validRegions.includes(region)) {
      errors.push(`region must be one of: ${validRegions.join(', ')}`)
    } else {
      query.region = region as Region
    }
  }
  
  // Entity filter
  const entity = searchParams.get('entity')
  if (entity) {
    query.entities = [entity]
  }
  
  // Sentiment range filter
  const sentimentMin = searchParams.get('sentimentMin')
  const sentimentMax = searchParams.get('sentimentMax')
  if (sentimentMin || sentimentMax) {
    query.sentimentRange = {
      min: sentimentMin ? parseFloat(sentimentMin) : -100,
      max: sentimentMax ? parseFloat(sentimentMax) : 100
    }
    
    if (isNaN(query.sentimentRange.min) || isNaN(query.sentimentRange.max)) {
      errors.push('sentimentMin and sentimentMax must be valid numbers')
    }
    
    if (query.sentimentRange.min < -100 || query.sentimentRange.min > 100) {
      errors.push('sentimentMin must be between -100 and 100')
    }
    
    if (query.sentimentRange.max < -100 || query.sentimentRange.max > 100) {
      errors.push('sentimentMax must be between -100 and 100')
    }
    
    if (query.sentimentRange.min > query.sentimentRange.max) {
      errors.push('sentimentMin must be less than or equal to sentimentMax')
    }
  }
  
  // Date range filter
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  if (startDate || endDate) {
    query.dateRange = {
      start: startDate || '2000-01-01',
      end: endDate || new Date().toISOString()
    }
    
    // Validate date formats
    if (startDate && isNaN(Date.parse(startDate))) {
      errors.push('startDate must be a valid ISO 8601 date')
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      errors.push('endDate must be a valid ISO 8601 date')
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push('startDate must be before endDate')
    }
  }
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  
  if (isNaN(page) || page < 1) {
    errors.push('page must be a positive integer')
  }
  
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    errors.push('pageSize must be between 1 and 100')
  }
  
  return { query, page, pageSize, errors }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const { query, page, pageSize, errors } = parseQueryParams(searchParams)
    
    // Validate parameters
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: errors
        },
        { status: 400 }
      )
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize
    query.limit = pageSize
    query.offset = offset
    
    // Query articles
    const articles = await queryArticles(query)
    
    // Get total count for pagination metadata
    // Note: In production, this should be optimized with a count query
    const totalCount = await getTotalArticleCount()
    const totalPages = Math.ceil(totalCount / pageSize)
    
    // Format response
    const response: ArticlesResponse = {
      success: true,
      articles,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        filters: {
          language: query.language,
          region: query.region,
          entity: query.entities?.[0],
          sentimentRange: query.sentimentRange,
          dateRange: query.dateRange
        }
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Articles query error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
