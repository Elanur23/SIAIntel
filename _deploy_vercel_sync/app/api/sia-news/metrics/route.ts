/**
 * GET /api/sia-news/metrics
 * 
 * Real-time metrics for SIA News system monitoring
 * 
 * Requirements: 20.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getRealtimeMetrics
} from '@/lib/sia-news/monitoring'

export const dynamic = 'force-dynamic'

import { 
  getArticleStats as getDbArticleStats,
  getTotalArticleCount,
  queryArticles
} from '@/lib/sia-news/database'
import type { MetricsResponse } from '@/lib/sia-news/types'

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get time range from query params (default: 24h)
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '24h'
    
    // Validate time range
    const validRanges = ['1h', '24h', '7d', '30d']
    if (!validRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time range',
          details: `timeRange must be one of: ${validRanges.join(', ')}`
        },
        { status: 400 }
      )
    }
    
    // Calculate time window
    const now = Date.now()
    const timeWindows: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    const startTime = new Date(now - timeWindows[timeRange]).toISOString()
    const endTime = new Date(now).toISOString()
    
    // Fetch metrics
    const realtimeMetrics = await getRealtimeMetrics()
    const dbStats = await getDbArticleStats({ start: startTime, end: endTime })
    
    // Get articles for detailed breakdown
    const articles = await queryArticles({ 
      dateRange: { start: startTime, end: endTime },
      limit: 1000
    })
    
    // Calculate language breakdown
    const languageStats = new Map<string, {
      count: number
      totalEEAT: number
      totalSentiment: number
      published: number
    }>()
    
    articles.forEach(article => {
      const stats = languageStats.get(article.language) || {
        count: 0,
        totalEEAT: 0,
        totalSentiment: 0,
        published: 0
      }
      stats.count++
      stats.totalEEAT += article.eeatScore
      stats.totalSentiment += article.sentiment
      if (article.publishedAt) stats.published++
      languageStats.set(article.language, stats)
    })
    
    const byLanguage = Array.from(languageStats.entries()).map(([language, stats]) => ({
      language,
      count: stats.count,
      avgEEATScore: stats.count > 0 ? stats.totalEEAT / stats.count : 0,
      avgSentiment: stats.count > 0 ? stats.totalSentiment / stats.count : 0,
      successRate: stats.count > 0 ? (stats.published / stats.count) * 100 : 0
    }))
    
    // Calculate region breakdown
    const regionStats = new Map<string, {
      count: number
      totalEEAT: number
      totalSentiment: number
      published: number
    }>()
    
    articles.forEach(article => {
      const stats = regionStats.get(article.region) || {
        count: 0,
        totalEEAT: 0,
        totalSentiment: 0,
        published: 0
      }
      stats.count++
      stats.totalEEAT += article.eeatScore
      stats.totalSentiment += article.sentiment
      if (article.publishedAt) stats.published++
      regionStats.set(article.region, stats)
    })
    
    const byRegion = Array.from(regionStats.entries()).map(([region, stats]) => ({
      region,
      count: stats.count,
      avgEEATScore: stats.count > 0 ? stats.totalEEAT / stats.count : 0,
      avgSentiment: stats.count > 0 ? stats.totalSentiment / stats.count : 0,
      successRate: stats.count > 0 ? (stats.published / stats.count) * 100 : 0
    }))
    
    // Calculate derived metrics
    const totalArticles = articles.length
    const publishedArticles = articles.filter(a => a.publishedAt).length
    const successRate = totalArticles > 0 
      ? (publishedArticles / totalArticles) * 100 
      : 0
    
    const articlesPerHour = totalArticles > 0
      ? totalArticles / (timeWindows[timeRange] / (60 * 60 * 1000))
      : 0
    
    // Build response
    const response: MetricsResponse = {
      success: true,
      timeRange,
      timestamp: new Date().toISOString(),
      
      // Real-time metrics
      realtime: {
        articlesGenerated: totalArticles,
        successRate: Math.round(successRate * 10) / 10,
        avgProcessingTime: Math.round(realtimeMetrics.performance.avgDuration),
        articlesPerHour: Math.round(articlesPerHour * 10) / 10
      },
      
      // Quality metrics
      quality: {
        avgEEATScore: Math.round(dbStats.avgEEATScore * 10) / 10,
        avgSentiment: Math.round(dbStats.avgSentiment * 10) / 10,
        avgOriginality: Math.round(dbStats.avgOriginalityScore * 10) / 10
      },
      
      // Language breakdown
      byLanguage,
      
      // Region breakdown
      byRegion,
      
      // Performance breakdown (mock data for now)
      performance: {
        dataIngestion: 2000,
        sourceVerification: 1500,
        causalAnalysis: 2500,
        entityMapping: 1800,
        contentGeneration: 4000,
        validation: 3000,
        publishing: 2000
      },
      
      // System health
      systemHealth: realtimeMetrics.system
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        timeRange,
        startTime,
        endTime
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Metrics query error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch metrics',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
