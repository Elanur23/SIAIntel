import { NextRequest, NextResponse } from 'next/server'
import { 
  generateAdSenseCompliantContent, 
  validateAntiSpam,
  type ContentGenerationRequest 
} from '@/lib/ai/adsense-compliant-writer'

/**
 * AdSense-Compliant Content Generation API
 * POST /api/ai/adsense-content
 * 
 * Generates E-E-A-T optimized content that passes Google AdSense policies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentGenerationRequest
    
    // Validate required fields
    if (!body.rawNews) {
      return NextResponse.json(
        { error: 'rawNews is required' },
        { status: 400 }
      )
    }
    
    console.log('[AdSense Content] Generating content for:', body.asset || 'Unknown')
    
    // Generate content with 3-layer structure
    const content = await generateAdSenseCompliantContent(body)
    
    // Validate anti-spam compliance
    const validation = validateAntiSpam(content)
    
    if (!validation.isValid) {
      console.warn('[AdSense Content] Validation issues:', validation.issues)
      return NextResponse.json(
        {
          success: false,
          error: 'Content failed AdSense compliance validation',
          issues: validation.issues,
          content // Return content anyway for review
        },
        { status: 200 } // Still 200 so client can review
      )
    }
    
    console.log('[AdSense Content] ✓ Content generated successfully')
    console.log('[AdSense Content] E-E-A-T Score:', content.metadata.eeatScore)
    console.log('[AdSense Content] Originality:', content.metadata.originalityScore)
    console.log('[AdSense Content] Technical Depth:', content.metadata.technicalDepth)
    
    return NextResponse.json({
      success: true,
      content,
      validation: {
        isValid: true,
        eeatScore: content.metadata.eeatScore,
        originalityScore: content.metadata.originalityScore,
        technicalDepth: content.metadata.technicalDepth
      },
      metadata: {
        timestamp: new Date().toISOString(),
        language: body.language || 'en',
        asset: body.asset || 'BTC'
      }
    })
    
  } catch (error) {
    console.error('[AdSense Content] Generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Content generation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/adsense-content
 * Returns content generation guidelines and status
 */
export async function GET() {
  return NextResponse.json({
    service: 'AdSense-Compliant Content Generator',
    version: '1.0.0',
    status: 'operational',
    features: {
      layer1: 'Journalistic Summary (5W1H)',
      layer2: 'SIA Insight (Unique Value with On-Chain Data)',
      layer3: 'Dynamic Risk Disclaimer',
      antiSpam: 'Google AdSense Policy Compliance',
      eeat: 'Experience, Expertise, Authoritativeness, Trustworthiness'
    },
    supportedLanguages: ['en', 'tr', 'de', 'es', 'fr', 'ar'],
    qualityMetrics: {
      minWordCount: 300,
      minEEATScore: 60,
      minOriginalityScore: 70,
      technicalDepth: ['high', 'medium', 'low']
    },
    usage: {
      endpoint: 'POST /api/ai/adsense-content',
      requiredFields: ['rawNews'],
      optionalFields: ['asset', 'language', 'includeOnChainData', 'confidenceScore']
    }
  })
}
