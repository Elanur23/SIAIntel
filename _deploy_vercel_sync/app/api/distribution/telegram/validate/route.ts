/**
 * Telegram Validation API
 * Phase 3C Step 1: Pre-publish validation endpoint
 * 
 * POST /api/distribution/telegram/validate
 * Validates a publish request without executing it
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePublishRequest } from '@/lib/distribution/publishing/telegram-publish-service'
import type { TelegramPublishRequest } from '@/lib/distribution/publishing/telegram-publish-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Telegram validation request received')
    
    // Parse request body
    const body = await request.json()
    
    const publishRequest: TelegramPublishRequest = {
      payload: body.payload,
      context: body.context,
      mode: body.mode || 'sandbox',
      metadata: body.metadata
    }
    
    // Validate
    const validation = await validatePublishRequest(publishRequest)
    
    console.log('[API] Validation result:', {
      canPublish: validation.canPublish,
      errors: validation.errors.length,
      warnings: validation.warnings.length
    })
    
    return NextResponse.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('[API] Validation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
