/**
 * Telegram Status API
 * Phase 3C Step 1: Configuration status endpoint
 * 
 * GET /api/distribution/telegram/status
 * Returns configuration and feature flag status
 */

import { NextResponse } from 'next/server'
import { getTelegramConfigStatus } from '@/lib/distribution/publishing/telegram-real-adapter'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'

export async function GET() {
  try {
    const configStatus = getTelegramConfigStatus()
    
    const featureFlags = {
      enableTelegramSandboxPublish: isFeatureEnabled('enableTelegramSandboxPublish'),
      enableTelegramProductionPublish: isFeatureEnabled('enableTelegramProductionPublish')
    }
    
    return NextResponse.json({
      success: true,
      configStatus,
      featureFlags
    })
  } catch (error) {
    console.error('[API] Status check error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
