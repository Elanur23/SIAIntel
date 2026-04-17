/**
 * POST /api/sia-news/generate
 * 
 * Generate multilingual news article from raw news input
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { processRawEvent } from '@/lib/sia-news/raw-data-ingestion'
import { verifySource } from '@/lib/sia-news/source-verification'
import { identifyCausalRelationships } from '@/lib/sia-news/causal-analysis'
import { mapEntities } from '@/lib/sia-news/entity-mapping'
import { rewriteForRegion } from '@/lib/sia-news/contextual-rewriting'
import { generateArticle } from '@/lib/sia-news/content-generation'
import { validateArticle } from '@/lib/sia-news/multi-agent-validation'
import { publishArticle, getStructuredData } from '@/lib/sia-news/publishing-pipeline'
import { storePerformanceMetrics } from '@/lib/sia-news/database'
import {
  logRequest,
  logError,
  trackPerformance,
  sendAlert
} from '@/lib/sia-news/monitoring'
import type { Language, Region, GenerateRequest, GenerateResponse } from '@/lib/sia-news/types'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimits = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const RATE_LIMIT_MAX = 100 // 100 requests per hour

function checkRateLimit(apiKey: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimits.get(apiKey)
  
  // No entry or expired - create new
  if (!entry || entry.resetTime < now) {
    rateLimits.set(apiKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true }
  }
  
  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  rateLimits.set(apiKey, entry)
  
  return { allowed: true }
}

// ============================================================================
// API KEY VALIDATION
// ============================================================================

function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false
  
  // For MVP, accept any non-empty API key
  // In production, validate against database
  return apiKey.length > 0
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!body.rawNews || typeof body.rawNews !== 'string') {
    errors.push('rawNews is required and must be a string')
  }
  
  if (!body.asset || typeof body.asset !== 'string') {
    errors.push('asset is required and must be a string')
  }
  
  if (!body.language || typeof body.language !== 'string') {
    errors.push('language is required and must be a string')
  }
  
  const validLanguages = ['tr', 'en', 'de', 'fr', 'es', 'ru']
  if (body.language && !validLanguages.includes(body.language)) {
    errors.push(`language must be one of: ${validLanguages.join(', ')}`)
  }
  
  if (body.region) {
    const validRegions = ['TR', 'US', 'DE', 'FR', 'ES', 'RU']
    if (!validRegions.includes(body.region)) {
      errors.push(`region must be one of: ${validRegions.join(', ')}`)
    }
  }
  
  if (body.confidenceScore !== undefined) {
    if (typeof body.confidenceScore !== 'number' || body.confidenceScore < 0 || body.confidenceScore > 100) {
      errors.push('confidenceScore must be a number between 0 and 100')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. API key validation
    const apiKey = request.headers.get('x-api-key')
    
    // Log request
    logRequest(
      '/api/sia-news/generate',
      'POST',
      { hasApiKey: !!apiKey },
      apiKey || undefined
    )
    
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing API key',
          details: 'Provide a valid API key in the x-api-key header'
        },
        { status: 401 }
      )
    }
    
    // 2. Rate limiting
    const rateLimitResult = checkRateLimit(apiKey!)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: `Maximum ${RATE_LIMIT_MAX} requests per hour`,
          resetTime: new Date(rateLimitResult.resetTime!).toISOString()
        },
        { status: 429 }
      )
    }
    
    // 3. Parse and validate request body
    const body: GenerateRequest = await request.json()
    
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: validation.errors
        },
        { status: 400 }
      )
    }
    
    // 4. Full generation pipeline orchestration
    console.log(`[SIA News] Starting generation for ${body.asset} in ${body.language}`)
    
    // Step 1: Process raw event
    const normalizedEvent = await trackPerformance(
      'data-ingestion',
      'processRawEvent',
      async () => {
        const rawEvent = {
          source: 'API',
          eventType: 'NEWS_ALERT' as const,
          timestamp: new Date().toISOString(),
          data: {
            asset: body.asset,
            rawNews: body.rawNews
          },
          rawPayload: JSON.stringify(body)
        }
        return await processRawEvent(rawEvent)
      }
    )
    
    // Step 2: Verify source
    const verifiedData = await trackPerformance(
      'source-verification',
      'verifySource',
      async () => await verifySource(normalizedEvent)
    )
    
    if (!verifiedData) {
      await sendAlert(
        'MEDIUM',
        'source-verification',
        'Source verification failed for API request',
        { asset: body.asset, language: body.language }
      )
      
      return NextResponse.json(
        {
          success: false,
          error: 'Source verification failed',
          details: 'The provided news source could not be verified'
        },
        { status: 400 }
      )
    }
    
    // Step 3: Identify causal relationships
    const causalChains = await trackPerformance(
      'causal-analysis',
      'identifyCausalRelationships',
      async () => await identifyCausalRelationships(verifiedData)
    )
    
    // Step 4: Map entities
    const entityResult = await trackPerformance(
      'entity-mapping',
      'mapEntities',
      async () => await mapEntities(verifiedData, causalChains)
    )
    
    // Step 5: Regional content adaptation
    const region = body.region || mapLanguageToRegion(body.language)
    
    // Build base content from verified data
    const baseContent = `${verifiedData.extractedData.entityReferences.join(', ')} - ${JSON.stringify(verifiedData.extractedData.numericalValues)}`
    
    const regionalContent = await trackPerformance(
      'contextual-rewriting',
      'rewriteForRegion',
      async () => await rewriteForRegion(
        baseContent,
        entityResult.entities,
        causalChains,
        region,
        body.language
      )
    )
    
    // Step 6: Generate article
    const article = await trackPerformance(
      'content-generation',
      'generateArticle',
      async () => await generateArticle({
        verifiedData,
        causalChains,
        entities: entityResult.entities,
        regionalContent,
        language: body.language,
        asset: body.asset,
        confidenceScore: body.confidenceScore || 75
      })
    )
    
    // Step 7: Multi-agent validation
    const validationResult = await trackPerformance(
      'validation',
      'validateArticle',
      async () => await validateArticle(article, verifiedData, causalChains)
    )
    
    // Check if validation failed
    if (!validationResult.approved) {
      await sendAlert(
        'HIGH',
        'validation',
        'Article failed multi-agent validation',
        {
          articleId: article.id,
          consensusScore: validationResult.consensusScore,
          criticalIssues: validationResult.criticalIssues.length
        }
      )
    }
    
    // Step 8: Publish if approved and requested
    let publicationResult
    if (validationResult.approved && body.publishImmediately !== false) {
      publicationResult = await trackPerformance(
        'publishing',
        'publishArticle',
        async () => await publishArticle({
          article,
          validationResult,
          publishImmediately: true
        })
      )
    }
    
    // 5. Store performance metrics
    const processingTime = Date.now() - startTime
    await storePerformanceMetrics({
      component: 'api-generate',
      operation: 'POST /api/sia-news/generate',
      duration: processingTime,
      success: true,
      timestamp: new Date().toISOString()
    })
    
    // 6. Get structured data if published
    const structuredData = publicationResult?.success ? getStructuredData(article.id) : undefined
    
    // 7. Return success response
    const response: GenerateResponse = {
      success: true,
      articleId: article.id,
      article,
      validationResult,
      processingTime
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime,
        published: publicationResult?.success || false,
        schemaGenerated: !!structuredData,
        schemaUrl: structuredData ? `/api/sia-news/schema?articleId=${article.id}` : undefined
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Generation error:', error)
    
    // Log error with full context
    logError(
      'api-generate',
      'POST /api/sia-news/generate',
      error as Error,
      { timestamp: new Date().toISOString() }
    )
    
    // Send critical alert
    await sendAlert(
      'CRITICAL',
      'api-generate',
      'Content generation pipeline failed',
      {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    )
    
    // Store failure metrics
    const processingTime = Date.now() - startTime
    await storePerformanceMetrics({
      component: 'api-generate',
      operation: 'POST /api/sia-news/generate',
      duration: processingTime,
      success: false,
      timestamp: new Date().toISOString()
    })
    
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapLanguageToRegion(language: Language): Region {
  const mapping: Record<Language, Region> = {
    tr: 'TR',
    en: 'US',
    de: 'DE',
    fr: 'FR',
    es: 'ES',
    ru: 'RU',
    ar: 'AE',
    jp: 'JP',
    zh: 'CN'
  }
  return mapping[language]
}
