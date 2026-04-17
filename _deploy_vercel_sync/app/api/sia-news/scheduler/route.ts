/**
 * API Endpoint: Autonomous Scheduler Control
 * 
 * Provides control interface for the autonomous scheduler:
 * - Start/stop scheduler
 * - Get scheduler status and statistics
 * - Configure scheduler settings
 * - Manage manual review queue
 * 
 * POST /api/sia-news/scheduler - Control scheduler (start/stop/configure)
 * GET /api/sia-news/scheduler - Get scheduler status
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  getSchedulerConfig,
  updateSchedulerConfig,
  getSchedulerStats,
  getSchedulerHealth,
  getManualReviewQueue,
  approveManualReview,
  rejectManualReview,
  clearManualReviewQueue
} from '@/lib/sia-news/autonomous-scheduler'

import {
  startContinuousMonitoring,
  stopContinuousMonitoring,
  isMonitoringRunning,
  getMonitoringStats,
  updateMonitoringConfig,
  getUptimeStats
} from '@/lib/sia-news/monitoring'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET - Get Scheduler Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          scheduler: {
            isRunning: isSchedulerRunning(),
            config: getSchedulerConfig(),
            stats: getSchedulerStats()
          },
          monitoring: {
            isRunning: isMonitoringRunning(),
            stats: getMonitoringStats()
          },
          uptime: getUptimeStats()
        })
        
      case 'health':
        const health = await getSchedulerHealth()
        return NextResponse.json({
          success: true,
          health
        })
        
      case 'manual-review':
        const queue = getManualReviewQueue()
        return NextResponse.json({
          success: true,
          queue,
          count: queue.length
        })
        
      default:
        // Default: return full status
        const fullHealth = await getSchedulerHealth()
        return NextResponse.json({
          success: true,
          scheduler: {
            isRunning: isSchedulerRunning(),
            config: getSchedulerConfig(),
            stats: getSchedulerStats()
          },
          monitoring: {
            isRunning: isMonitoringRunning(),
            stats: getMonitoringStats()
          },
          health: fullHealth,
          uptime: getUptimeStats(),
          manualReviewQueue: {
            count: getManualReviewQueue().length
          }
        })
    }
    
  } catch (error) {
    console.error('Scheduler status error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Control Scheduler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config, articleId } = body
    
    switch (action) {
      case 'start':
        if (isSchedulerRunning()) {
          return NextResponse.json({
            success: false,
            error: 'Scheduler is already running'
          }, { status: 400 })
        }
        
        startScheduler(config)
        
        // Also start monitoring if not running
        if (!isMonitoringRunning()) {
          startContinuousMonitoring()
        }
        
        return NextResponse.json({
          success: true,
          message: 'Scheduler started successfully',
          scheduler: {
            isRunning: isSchedulerRunning(),
            config: getSchedulerConfig(),
            stats: getSchedulerStats()
          }
        })
        
      case 'stop':
        if (!isSchedulerRunning()) {
          return NextResponse.json({
            success: false,
            error: 'Scheduler is not running'
          }, { status: 400 })
        }
        
        await stopScheduler()
        
        // Also stop monitoring
        if (isMonitoringRunning()) {
          stopContinuousMonitoring()
        }
        
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped successfully',
          stats: getSchedulerStats()
        })
        
      case 'configure':
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'Configuration is required'
          }, { status: 400 })
        }
        
        updateSchedulerConfig(config)
        
        return NextResponse.json({
          success: true,
          message: 'Configuration updated successfully',
          config: getSchedulerConfig()
        })
        
      case 'configure-monitoring':
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'Configuration is required'
          }, { status: 400 })
        }
        
        updateMonitoringConfig(config)
        
        return NextResponse.json({
          success: true,
          message: 'Monitoring configuration updated successfully',
          stats: getMonitoringStats()
        })
        
      case 'approve-review':
        if (!articleId) {
          return NextResponse.json({
            success: false,
            error: 'Article ID is required'
          }, { status: 400 })
        }
        
        const approved = await approveManualReview(articleId)
        
        if (!approved) {
          return NextResponse.json({
            success: false,
            error: 'Article not found in manual review queue'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          message: 'Article approved and published',
          articleId
        })
        
      case 'reject-review':
        if (!articleId) {
          return NextResponse.json({
            success: false,
            error: 'Article ID is required'
          }, { status: 400 })
        }
        
        const rejected = rejectManualReview(articleId)
        
        if (!rejected) {
          return NextResponse.json({
            success: false,
            error: 'Article not found in manual review queue'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          message: 'Article rejected',
          articleId
        })
        
      case 'clear-review-queue':
        clearManualReviewQueue()
        
        return NextResponse.json({
          success: true,
          message: 'Manual review queue cleared'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          validActions: [
            'start',
            'stop',
            'configure',
            'configure-monitoring',
            'approve-review',
            'reject-review',
            'clear-review-queue'
          ]
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Scheduler control error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Scheduler control failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
