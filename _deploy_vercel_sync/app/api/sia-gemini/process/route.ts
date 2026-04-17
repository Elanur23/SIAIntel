import { NextRequest, NextResponse } from 'next/server'

const API_DISABLED = false

export async function POST(_request: NextRequest) {
  if (API_DISABLED) {
    return NextResponse.json(
      { success: false, error: 'AI API devre dışı (Gemini/Groq kaldırıldı)' },
      { status: 503 }
    )
  }

  const { processIncomingIntel, processBatchIntel } = await import('@/lib/services/SiaIntelligenceProcessor')
  try {
    const body = await _request.json()
    const { input, batch } = body

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    console.log('[SIA_GEMINI_API] Processing request:', batch ? 'batch' : 'single')

    // Process batch or single input
    if (batch && Array.isArray(input)) {
      const results = await processBatchIntel(input)
      
      return NextResponse.json({
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          processed: results.length,
          total: input.length,
          filtered: input.length - results.length
        }
      })
    } else if (input) {
      const result = await processIncomingIntel(input)
      
      return NextResponse.json({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          confidence: (result as any).data?.confidence ?? (result as any).confidence,
          riskLevel: (result as any).data?.riskLevel ?? (result as any).riskLevel
        }
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          details: 'Expected "input" field with intelligence data'
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[SIA_GEMINI_API] Processing error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Intelligence processing failed',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sia-gemini/process
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: API_DISABLED ? 'disabled' : 'operational',
    service: 'SIA_GEMINI_INTELLIGENCE_PROCESSOR',
    version: '2.1',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-pro-002',
    features: [
      'DARK_POOL_ANALYSIS',
      'SENTINEL_EWS',
      'LEGAL_SHIELD_AUTO',
      'MULTI_LINGUAL_LOCALIZATION',
      'CONFIDENCE_SCORING',
      'RISK_QUANTIFICATION',
      'ANTI_MANIPULATION_FILTER',
      'SOURCE_DIVERSITY_INDEX',
      'TEMPORAL_DECAY',
      'CORRELATION_ENGINE'
    ]
  })
}
