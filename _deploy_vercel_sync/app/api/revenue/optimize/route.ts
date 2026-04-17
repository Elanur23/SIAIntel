import { NextRequest, NextResponse } from 'next/server'
import { siaRevenueMaximizer } from '@/lib/revenue/SiaRevenueMaximizer'

/**
 * SIA Revenue Optimization API
 * POST /api/revenue/optimize
 * 
 * Actions:
 * - generate-report: Generate full optimization report
 * - update-placement: Update ad placement metrics
 * - update-language: Update language CPM data
 * - report-bot: Report bot detection
 * - get-logs: Get optimization logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log('[SIA_REVENUE_API] Action:', action)

    switch (action) {
      case 'generate-report': {
        const report = siaRevenueMaximizer.generateOptimizationReport()
        
        return NextResponse.json({
          success: true,
          data: report,
          metadata: {
            timestamp: new Date().toISOString(),
            protocols: report.protocols.length,
          }
        })
      }

      case 'update-placement': {
        if (!data || !data.placementId) {
          return NextResponse.json(
            { success: false, error: 'Missing placement data' },
            { status: 400 }
          )
        }

        siaRevenueMaximizer.updateAdPlacement({
          ...data,
          lastUpdated: new Date(),
        })

        return NextResponse.json({
          success: true,
          message: 'Placement metrics updated',
          placementId: data.placementId,
        })
      }

      case 'update-language': {
        if (!data || !data.languageCode) {
          return NextResponse.json(
            { success: false, error: 'Missing language data' },
            { status: 400 }
          )
        }

        siaRevenueMaximizer.updateLanguageCPM(data.languageCode, data)

        return NextResponse.json({
          success: true,
          message: 'Language CPM updated',
          languageCode: data.languageCode,
        })
      }

      case 'report-bot': {
        if (!data || !data.placementId) {
          return NextResponse.json(
            { success: false, error: 'Missing bot detection data' },
            { status: 400 }
          )
        }

        siaRevenueMaximizer.reportBotDetection({
          ...data,
          timestamp: new Date(),
        })

        return NextResponse.json({
          success: true,
          message: 'Bot detection reported',
          action: data.action,
        })
      }

      case 'get-logs': {
        const limit = data?.limit || 10
        const logs = siaRevenueMaximizer.getOptimizationLogs(limit)

        return NextResponse.json({
          success: true,
          data: logs,
          count: logs.length,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[SIA_REVENUE_API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Revenue optimization failed',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/revenue/optimize
 * Health check and status
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'SIA_REVENUE_MAXIMIZER',
    version: '3.0.26',
    protocols: [
      'AD_PLACEMENT_MONITOR',
      'GLOBAL_CPM_ARBITRAGE',
      'BEHAVIORAL_INJECTION',
      'BOT_FRAUD_SHIELD'
    ],
    features: {
      realTimeOptimization: true,
      botDetection: true,
      multiLanguageCPM: true,
      behavioralAnalysis: true,
    }
  })
}
