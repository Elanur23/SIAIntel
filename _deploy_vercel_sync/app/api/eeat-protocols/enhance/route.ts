/**
 * E-E-A-T Protocols Enhancement API Endpoint
 * POST /api/eeat-protocols/enhance
 * 
 * Enhances content with E-E-A-T Reasoning Protocols for ≥95/100 E-E-A-T scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhanceWithEEATProtocols, type EEATProtocolsRequest } from '@/lib/ai/eeat-protocols-orchestrator'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute

function checkRateLimit(clientId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(clientId)
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true }
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: entry.resetTime }
  }
  
  entry.count++
  return { allowed: true }
}

// ============================================================================
// API KEY VALIDATION
// ============================================================================

function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false
  
  // In production, validate against database or environment variable
  const validApiKeys = process.env.EEAT_API_KEYS?.split(',') || []
  
  // For development, allow a default key
  if (process.env.NODE_ENV === 'development' && apiKey === 'dev-key-eeat-protocols') {
    return true
  }
  
  return validApiKeys.includes(apiKey)
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

function validateRequest(body: any): ValidationResult {
  const errors: string[] = []
  
  // Required fields
  if (!body.content || typeof body.content !== 'string') {
    errors.push('content is required and must be a string')
  }
  
  if (!body.language || !['en', 'tr', 'de', 'es', 'fr', 'ar'].includes(body.language)) {
    errors.push('language is required and must be one of: en, tr, de, es, fr, ar')
  }
  
  if (!body.reasoningChains || !Array.isArray(body.reasoningChains)) {
    errors.push('reasoningChains is required and must be an array')
  }
  
  if (!body.inverseEntities || !Array.isArray(body.inverseEntities)) {
    errors.push('inverseEntities is required and must be an array')
  }
  
  if (!body.sentimentResult || typeof body.sentimentResult !== 'object') {
    errors.push('sentimentResult is required and must be an object')
  }
  
  // Optional fields validation
  if (body.baseConfidenceScore !== undefined) {
    if (typeof body.baseConfidenceScore !== 'number' || body.baseConfidenceScore < 0 || body.baseConfidenceScore > 100) {
      errors.push('baseConfidenceScore must be a number between 0 and 100')
    }
  }
  
  if (body.enabledProtocols !== undefined) {
    if (!Array.isArray(body.enabledProtocols)) {
      errors.push('enabledProtocols must be an array')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. API Key Validation
    const apiKey = request.headers.get('x-api-key')
    
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing API key',
          message: 'Please provide a valid API key in the x-api-key header'
        },
        { status: 401 }
      )
    }
    
    // 2. Rate Limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const clientId = `${clientIp}-${apiKey}`
    
    const rateLimitResult = checkRateLimit(clientId)
    
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime || Date.now()
      const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute. Try again in ${resetInSeconds} seconds.`,
          resetTime: new Date(resetTime).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString()
          }
        }
      )
    }
    
    // 3. Parse and Validate Request Body
    let body: any
    
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      )
    }
    
    const validation = validateRequest(body)
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Request validation errors',
          errors: validation.errors
        },
        { status: 400 }
      )
    }
    
    // 4. Prepare E-E-A-T Protocols Request
    const eeATRequest: EEATProtocolsRequest = {
      content: body.content,
      topic: body.topic || body.content.substring(0, 100),
      asset: body.asset || 'BTC',
      language: body.language,
      reasoningChains: body.reasoningChains,
      inverseEntities: body.inverseEntities,
      sentimentResult: body.sentimentResult,
      dataSources: body.dataSources || ['Glassnode', 'CryptoQuant', 'Bloomberg'],
      methodology: body.methodology || 'Multi-modal reasoning with Google Search grounding',
      baseConfidenceScore: body.baseConfidenceScore || 75,
      enabledProtocols: body.enabledProtocols,
      targetEntityCount: body.targetEntityCount,
      minimumHistoricalPrecedents: body.minimumHistoricalPrecedents,
      targetEEATScore: body.targetEEATScore
    }
    
    // 5. Execute E-E-A-T Protocols Enhancement
    const result = await enhanceWithEEATProtocols(eeATRequest)
    
    // 6. Calculate Processing Time
    const processingTime = Date.now() - startTime
    
    // 7. Return Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          enhancedEEATScore: result.enhancedEEATScore,
          protocolBonuses: result.protocolBonuses,
          quantumExpertise: {
            signalCount: result.quantumExpertise.length,
            averageScore: result.quantumExpertise.length > 0
              ? result.quantumExpertise.reduce((sum, s) => sum + s.expertiseSignalScore, 0) / result.quantumExpertise.length
              : 0,
            causalProofs: result.quantumExpertise.flatMap(s => s.causalProofs)
          },
          transparencyLayers: {
            layerCount: result.transparencyLayers.layers.length,
            trustScore: result.transparencyLayers.trustTransparencyScore,
            citationDensity: result.transparencyLayers.citationDensity,
            sourceBreakdown: result.transparencyLayers.sourceBreakdown
          },
          semanticEntityMap: {
            entityCount: result.semanticEntityMap.entityCount,
            clusteringScore: result.semanticEntityMap.entityClusteringScore,
            categories: result.semanticEntityMap.categories.map(c => ({
              name: c.name,
              entityCount: c.entities.length
            })),
            topEntities: result.semanticEntityMap.entities
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .slice(0, 10)
              .map(e => ({
                name: e.name,
                category: e.category,
                relevanceScore: e.relevanceScore
              }))
          },
          predictiveSentiment: {
            currentScore: result.predictiveSentiment.currentScore,
            sentimentZone: result.predictiveSentiment.sentimentZone,
            hasBreakpointPrediction: result.predictiveSentiment.nextBreakingPoint !== null,
            breakpointPrediction: result.predictiveSentiment.nextBreakingPoint,
            riskFactorCount: result.predictiveSentiment.riskFactors.length
          },
          authorityManifesto: {
            wordCount: result.authorityManifesto.wordCount,
            score: result.authorityManifesto.authorityManifestoScore,
            uniquenessScore: result.authorityManifesto.uniquenessScore,
            content: result.authorityManifesto.content
          },
          eeATVerification: {
            wordCount: result.eeATVerification.wordCount,
            completenessScore: result.eeATVerification.verificationCompletenessScore,
            sourceCount: result.eeATVerification.components.dataSources.totalCount,
            content: result.eeATVerification.content
          },
          performanceMetrics: result.performanceMetrics,
          errors: result.errors
        },
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        status: 200,
        headers: {
          'X-EEAT-Score': result.enhancedEEATScore.toString(),
          'X-Protocol-Bonuses': result.protocolBonuses.totalBonus.toString(),
          'X-Processing-Time': processingTime.toString(),
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('E-E-A-T Protocols API error:', error)
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process E-E-A-T protocols enhancement',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET HANDLER - API Documentation
// ============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'E-E-A-T Protocols Enhancement API',
    version: '1.0.0',
    description: 'Enhances content with 6 E-E-A-T reasoning protocols for ≥95/100 E-E-A-T scores',
    endpoint: '/api/eeat-protocols/enhance',
    method: 'POST',
    rateLimit: {
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
      description: `${RATE_LIMIT_MAX_REQUESTS} requests per minute per API key`
    },
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      description: 'Provide your API key in the x-api-key header'
    },
    requestBody: {
      required: ['content', 'language', 'reasoningChains', 'inverseEntities', 'sentimentResult'],
      optional: [
        'topic',
        'asset',
        'dataSources',
        'methodology',
        'baseConfidenceScore',
        'enabledProtocols',
        'targetEntityCount',
        'minimumHistoricalPrecedents',
        'targetEEATScore'
      ]
    },
    protocols: [
      {
        name: 'Quantum Expertise Signaler',
        description: 'Adds causal proof structure with historical validation',
        bonus: '+3-5 points'
      },
      {
        name: 'Transparency Layer Generator',
        description: 'Creates systematic source attribution',
        bonus: '+2-5 points'
      },
      {
        name: 'Semantic Entity Mapper',
        description: 'Expands entity linking to 20+ entities',
        bonus: '+2-5 points'
      },
      {
        name: 'Predictive Sentiment Analyzer',
        description: 'Predicts emotional breakpoints with historical patterns',
        bonus: 'N/A (informational)'
      },
      {
        name: 'Authority Manifesto Generator',
        description: 'Creates compelling authority statements',
        bonus: '+3-5 points'
      },
      {
        name: 'E-E-A-T Verification Generator',
        description: 'Comprehensive verification with methodology transparency',
        bonus: 'N/A (trust signal)'
      }
    ],
    targetScore: '≥95/100 E-E-A-T score',
    performanceBudget: '<4 seconds total processing time',
    documentation: 'https://docs.siaintel.com/eeat-protocols'
  })
}
