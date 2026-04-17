/**
 * Telegram Publish API
 * Phase 3C Step 1: Real publishing endpoint
 * 
 * POST /api/distribution/telegram/publish
 * Publishes to Telegram with full validation
 * 
 * CRITICAL: This performs REAL publishing.
 * All safety checks are enforced.
 */

import { NextRequest, NextResponse } from 'next/server'
import { publishWithValidation } from '@/lib/distribution/publishing/telegram-publish-service'
import type { TelegramPublishRequest } from '@/lib/distribution/publishing/telegram-publish-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Telegram publish request received')
    
    // Parse request body
    const body: TelegramPublishRequest = await request.json()
    
    // Validate and publish
    const response = await publishWithValidation(body)
    
    console.log('[API] Publish response:', {
      success: response.success,
      mode: response.mode,
      messageId: response.publishResult?.messageId
    })
    
    // Return appropriate status code
    const statusCode = response.success ? 200 : 400
    
    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('[API] Publish error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Publish failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
