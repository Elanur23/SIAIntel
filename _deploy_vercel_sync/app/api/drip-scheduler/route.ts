/**
 * DRIP Scheduler API
 * 
 * Endpoints for Daily Rate Increase Protocol
 * 
 * GET /api/drip-scheduler - Get statistics and schedule
 * POST /api/drip-scheduler - Control scheduler (start/stop)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DripScheduler,
  calculateDailyLimit,
  calculateGrowthTrajectory,
  generateDripSchedule,
  getDripStatistics,
  calculateTotalArticles,
  DEFAULT_DRIP_CONFIG,
  type DripConfig
} from '@/lib/content/sia-drip-scheduler'

export const dynamic = 'force-dynamic'

// ============================================================================
// SCHEDULER INSTANCE
// ============================================================================

let schedulerInstance: DripScheduler | null = null

// ============================================================================
// GET - Statistics and Schedule
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'stats') {
      const dayNumber = parseInt(searchParams.get('day') || '1')
      const stats = getDripStatistics(dayNumber)
      
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'schedule') {
      const dayNumber = parseInt(searchParams.get('day') || '1')
      const schedule = generateDripSchedule(dayNumber)
      
      return NextResponse.json({
        success: true,
        data: schedule,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'trajectory') {
      const startDay = parseInt(searchParams.get('startDay') || '1')
      const numDays = parseInt(searchParams.get('numDays') || '30')
      const trajectory = calculateGrowthTrajectory(startDay, numDays)
      
      return NextResponse.json({
        success: true,
        data: trajectory,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'state') {
      if (!schedulerInstance) {
        return NextResponse.json({
          success: true,
          data: {
            isRunning: false,
            message: 'Scheduler not initialized'
          }
        })
      }
      
      const state = schedulerInstance.getState()
      const currentSchedule = schedulerInstance.getCurrentSchedule()
      
      return NextResponse.json({
        success: true,
        data: {
          state,
          currentSchedule
        },
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter',
      validActions: ['stats', 'schedule', 'trajectory', 'state']
    }, { status: 400 })
    
  } catch (error) {
    console.error('[DRIP Scheduler] GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve DRIP data',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// ============================================================================
// POST - Control Scheduler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config, startDay } = body
    
    // Action: Start scheduler
    if (action === 'start') {
      if (schedulerInstance && schedulerInstance.getState().isRunning) {
        return NextResponse.json({
          success: false,
          error: 'Scheduler is already running'
        }, { status: 400 })
      }
      
      // Create new scheduler instance with custom config if provided
      const dripConfig: DripConfig = config || DEFAULT_DRIP_CONFIG
      schedulerInstance = new DripScheduler(dripConfig)
      
      const day = startDay || 1
      schedulerInstance.start(day)
      
      const state = schedulerInstance.getState()
      
      return NextResponse.json({
        success: true,
        message: 'DRIP scheduler started',
        data: {
          state,
          dailyLimit: calculateDailyLimit(day, dripConfig),
          interval: (24 * 60) / calculateDailyLimit(day, dripConfig)
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Action: Stop scheduler
    if (action === 'stop') {
      if (!schedulerInstance) {
        return NextResponse.json({
          success: false,
          error: 'Scheduler is not running'
        }, { status: 400 })
      }
      
      const finalState = schedulerInstance.getState()
      schedulerInstance.stop()
      schedulerInstance = null
      
      return NextResponse.json({
        success: true,
        message: 'DRIP scheduler stopped',
        data: {
          finalState
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Action: Get current state
    if (action === 'status') {
      if (!schedulerInstance) {
        return NextResponse.json({
          success: true,
          data: {
            isRunning: false,
            message: 'Scheduler not initialized'
          }
        })
      }
      
      const state = schedulerInstance.getState()
      
      return NextResponse.json({
        success: true,
        data: { state },
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      validActions: ['start', 'stop', 'status']
    }, { status: 400 })
    
  } catch (error) {
    console.error('[DRIP Scheduler] POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'DRIP scheduler operation failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
