/**
 * Generation Orchestrator
 * Phase 3A: Main coordination layer for AI generation
 */

import { isFeatureEnabled } from '../feature-flags'
import { getAIProvider } from './provider-factory'
import { rewriteForLocales } from './pipelines/locale-rewrite-pipeline'
import { generatePlatformCopies } from './pipelines/platform-copy-pipeline'
import { calculateTrustScore, calculateComplianceScore } from './pipelines/trust-scoring-pipeline'
import { applyGlossary } from './pipelines/glossary-integration'
import type { Language, Platform, DistributionRecord } from '../types'

export interface GenerationRequest {
  articleId: string
  sourceTitle: string
  sourceContent: string
  sourceLanguage: Language
  targetLanguages: Language[]
  targetPlatforms: Platform[]
  mode: 'breaking' | 'editorial'
  createdBy: string
}

export interface GenerationResult {
  success: boolean
  record?: Partial<DistributionRecord>
  error?: string
  warnings: string[]
}

/**
 * Orchestrate full content generation pipeline
 * Phase 3A: Manual generation only (no automatic/background)
 */
export async function generateDistributionContent(
  request: GenerationRequest
): Promise<GenerationResult> {
  const warnings: string[] = []
  
  // Check if AI generation is enabled
  if (!isFeatureEnabled('enableAIGeneration')) {
    return {
      success: false,
      error: 'AI generation is disabled. Enable in feature flags.',
      warnings
    }
  }
  
  // Check if provider is available
  const provider = getAIProvider()
  if (!provider) {
    return {
      success: false,
      error: 'No AI provider available. Check configuration.',
      warnings
    }
  }
  
  try {
    // Step 1: Generate localized content for all target languages
    console.log('[ORCHESTRATOR] Generating localized content...')
    const localeResult = await rewriteForLocales({
      sourceContent: request.sourceContent,
      sourceLanguage: request.sourceLanguage,
      targetLanguages: request.targetLanguages
    })
    
    if (!localeResult.success) {
      warnings.push('Some locale rewrites failed')
    }
    
    // Step 2: Apply glossary terms to each locale
    console.log('[ORCHESTRATOR] Applying glossary terms...')
    for (const [lang, content] of Object.entries(localeResult.localizedContent)) {
      const glossaryResult = await applyGlossary({
        content: content.content,
        language: lang as Language
      })
      
      content.content = glossaryResult.enhancedContent
      content.glossaryTermsUsed = glossaryResult.termsUsed
      
      if (glossaryResult.termsApplied > 0) {
        console.log(`[ORCHESTRATOR] Applied ${glossaryResult.termsApplied} glossary terms for ${lang}`)
      }
    }
    
    // Step 3: Generate platform-specific copies
    console.log('[ORCHESTRATOR] Generating platform copies...')
    const platformResult = await generatePlatformCopies({
      content: request.sourceContent,
      platforms: request.targetPlatforms,
      language: request.sourceLanguage
    })
    
    if (!platformResult.success) {
      warnings.push('Some platform copies failed')
    }
    
    // Step 4: Calculate trust and compliance scores
    console.log('[ORCHESTRATOR] Calculating scores...')
    const trustScore = calculateTrustScore({
      content: request.sourceContent,
      sourceCredibility: 75,
      hasDataPoints: request.sourceContent.includes('%') || request.sourceContent.includes('$'),
      hasDisclaimer: request.sourceContent.toLowerCase().includes('risk') || 
                     request.sourceContent.toLowerCase().includes('disclaimer')
    })
    
    const complianceScore = calculateComplianceScore(request.sourceContent)
    
    if (trustScore.requiresReview) {
      warnings.push('Content requires editorial review (low trust score)')
    }
    
    if (complianceScore.requiresLegalReview) {
      warnings.push('Content requires legal review (compliance issues)')
    }
    
    // Step 5: Create distribution record
    const record: Partial<DistributionRecord> = {
      articleId: request.articleId,
      mode: request.mode,
      status: 'draft',
      sourceTitle: request.sourceTitle,
      sourceContent: request.sourceContent,
      sourceLanguage: request.sourceLanguage,
      localizedContent: localeResult.localizedContent,
      platformVariants: platformResult.variants,
      trustScore: trustScore.overall,
      complianceScore: complianceScore.overall,
      createdBy: request.createdBy
    }
    
    console.log('[ORCHESTRATOR] Generation complete')
    
    return {
      success: true,
      record,
      warnings
    }
    
  } catch (error: any) {
    console.error('[ORCHESTRATOR] Generation failed:', error)
    
    return {
      success: false,
      error: error.message || 'Generation failed',
      warnings
    }
  }
}

/**
 * Validate generation request
 */
export function validateGenerationRequest(request: GenerationRequest): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!request.sourceTitle || request.sourceTitle.trim().length === 0) {
    issues.push('Source title is required')
  }
  
  if (!request.sourceContent || request.sourceContent.trim().length < 100) {
    issues.push('Source content must be at least 100 characters')
  }
  
  if (request.targetLanguages.length === 0) {
    issues.push('At least one target language is required')
  }
  
  if (request.targetPlatforms.length === 0) {
    issues.push('At least one target platform is required')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
