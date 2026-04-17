/**
 * Autonomous Suggestions API
 * Phase 3D: Generate suggestions ON DEMAND
 * 
 * POST /api/distribution/autonomous/suggestions
 * Generates publishing suggestions (does NOT auto-publish)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import { generateSuggestions } from '@/lib/distribution/autonomous/autonomous-engine'
import type { SuggestionRequest } from '@/lib/distribution/autonomous/autonomous-types'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Autonomous suggestions request received')
    
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
    const body: SuggestionRequest = await request.json()
    
    // Generate suggestions ON DEMAND
    const response = await generateSuggestions(body)
    
    console.log('[API] Generated', response.suggestions.length, 'suggestions')
    
    return NextResponse.json({
      success: true,
      response
    })
  } catch (error) {
    console.error('[API] Suggestion generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
