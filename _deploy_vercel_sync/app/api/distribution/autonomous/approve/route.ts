/**
 * Autonomous Approval API
 * Phase 3D: Approve suggestion (does NOT auto-publish)
 * 
 * POST /api/distribution/autonomous/approve
 * Marks suggestion as approved (human must still manually publish)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import { approveSuggestion } from '@/lib/distribution/autonomous/autonomous-engine'
import type { ApprovalRequest } from '@/lib/distribution/autonomous/autonomous-types'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Approval request received')
    
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
    const body: ApprovalRequest = await request.json()
    
    // Approve suggestion (does NOT publish)
    const result = await approveSuggestion(body)
    
    console.log('[API] Approval result:', result.success)
    
    return NextResponse.json({
      success: result.success,
      result
    })
  } catch (error) {
    console.error('[API] Approval error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
