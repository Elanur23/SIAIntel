/**
 * Telegram Test API
 * Phase 3C Step 1: Connection test endpoint
 * 
 * POST /api/distribution/telegram/test
 * Sends a test message to verify configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { testTelegramConnection } from '@/lib/distribution/publishing/telegram-real-adapter'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import type { TelegramPublishMode } from '@/lib/distribution/publishing/telegram-real-adapter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mode: TelegramPublishMode = body.mode || 'sandbox'
    
    console.log('[API] Testing Telegram connection in', mode, 'mode')
    
    // Check feature flag
    const featureFlagEnabled = mode === 'sandbox'
      ? isFeatureEnabled('enableTelegramSandboxPublish')
      : isFeatureEnabled('enableTelegramProductionPublish')
    
    if (!featureFlagEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: `Feature flag for ${mode} mode is not enabled`
        },
        { status: 403 }
      )
    }
    
    // Test connection
    const result = await testTelegramConnection(mode)
    
    console.log('[API] Test result:', {
      success: result.success,
      mode: result.mode,
      messageId: result.messageId
    })
    
    return NextResponse.json({
      success: result.success,
      result,
      mode
    })
  } catch (error) {
    console.error('[API] Test error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
