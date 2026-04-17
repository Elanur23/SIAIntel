/**
 * Autonomous Rejection API
 * Phase 3D: Reject suggestion
 * 
 * POST /api/distribution/autonomous/reject
 * Marks suggestion as rejected
 */

import { NextRequest, NextResponse } from 'next/server'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import { rejectSuggestion } from '@/lib/distribution/autonomous/autonomous-engine'
import type { RejectionRequest } from '@/lib/distribution/autonomous/autonomous-types'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Rejection request received')
    
    // Check feature flag
    if (!isFeatureEnabled('enableAutonomousAssistant')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Autonomous assistant is not enabled'
        },
        { status: 403 }
      )
    }
    
    // Parse request
    const body: RejectionRequest = await request.json()
    
    // Reject suggestion
    const result = await rejectSuggestion(body)
    
    console.log('[API] Rejection result:', result.success)
    
    return NextResponse.json({
      success: result.success,
      result
    })
  } catch (error) {
    console.error('[API] Rejection error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
