/**
 * AI Test Service
 * Phase 3A.5: Test execution and result management
 */

import { getAIProvider } from '../ai/provider-factory'
import { rewriteForLocales } from '../ai/pipelines/locale-rewrite-pipeline'
import { generatePlatformCopies } from '../ai/pipelines/platform-copy-pipeline'
import { calculateTrustScore, calculateComplianceScore } from '../ai/pipelines/trust-scoring-pipeline'
import { applyGlossary } from '../ai/pipelines/glossary-integration'
import {
  saveTestResult,
  getTestResult,
  getTestResults,
  deleteTestResult,
  getTestStats
} from '../database'
import type {
  Language,
  Platform,
  DistributionMode,
  AITestResult,
  RegenerationMode
} from '../types'

export interface TestExecutionRequest {
  // Source
  articleId: string
  sourceTitle: string
  sourceContent: string
  sourceLanguage: Language
  
  // Test parameters
  targetLocale: Language
  targetPlatform: Platform
  generationMode: DistributionMode
  regenerationMode?: RegenerationMode
  
  // Metadata
  createdBy: string
}

export interface TestExecutionResult {
  success: boolean
  testResult?: AITestResult
  error?: string
  warnings: string[]
}

/**
 * Execute AI generation test
 * Phase 3A.5: Manual test execution only (no automation)
 */
export async function executeTest(
  request: TestExecutionRequest
): Promise<TestExecutionResult> {
  const warnings: string[] = []
  const startTime = Date.now()
  
  try {
    // Check if AI provider is available
    const provider = getAIProvider()
    if (!provider) {
      return {
        success: false,
        error: 'AI provider not available. Enable in feature flags.',
        warnings
      }
    }
    
    console.log('[AI_TEST_SERVICE] Starting test execution...')
    console.log(`[AI_TEST_SERVICE] Source: ${request.sourceLanguage} -> Target: ${request.targetLocale}`)
    console.log(`[AI_TEST_SERVICE] Platform: ${request.targetPlatform}`)
    
    // Step 1: Generate localized content
    console.log('[AI_TEST_SERVICE] Generating localized content...')
    const localeResult = await rewriteForLocales({
      sourceContent: request.sourceContent,
      sourceLanguage: request.sourceLanguage,
      targetLanguages: [request.targetLocale]
    })
    
    if (!localeResult.success || !localeResult.localizedContent[request.targetLocale]) {
      return {
        success: false,
        error: `Locale generation failed for ${request.targetLocale}`,
        warnings
      }
    }
    
    const localizedContent = localeResult.localizedContent[request.targetLocale]
    
    // Step 2: Apply glossary terms
    console.log('[AI_TEST_SERVICE] Applying glossary terms...')
    const glossaryResult = await applyGlossary({
      content: localizedContent.content,
      language: request.targetLocale
    })
    
    localizedContent.content = glossaryResult.enhancedContent
    localizedContent.glossaryTermsUsed = glossaryResult.termsUsed
    
    if (glossaryResult.termsApplied > 0) {
      console.log(`[AI_TEST_SERVICE] Applied ${glossaryResult.termsApplied} glossary terms`)
    }
    
    // Step 3: Generate platform-specific copy
    console.log('[AI_TEST_SERVICE] Generating platform copy...')
    const platformResult = await generatePlatformCopies({
      content: localizedContent.content,
      platforms: [request.targetPlatform],
      language: request.targetLocale
    })
    
    if (!platformResult.success || !platformResult.variants[request.targetPlatform]) {
      return {
        success: false,
        error: `Platform generation failed for ${request.targetPlatform}`,
        warnings
      }
    }
    
    const platformContent = platformResult.variants[request.targetPlatform]!
    
    // Step 4: Calculate trust and compliance scores
    console.log('[AI_TEST_SERVICE] Calculating scores...')
    const trustScore = calculateTrustScore({
      content: request.sourceContent,
      sourceCredibility: 75,
      hasDataPoints: request.sourceContent.includes('%') || request.sourceContent.includes('$'),
      hasDisclaimer: request.sourceContent.toLowerCase().includes('risk') || 
                     request.sourceContent.toLowerCase().includes('disclaimer')
    })
    
    const complianceScore = calculateComplianceScore(localizedContent.content)
    
    if (trustScore.requiresReview) {
      warnings.push('Content requires editorial review (low trust score)')
    }
    
    if (complianceScore.requiresLegalReview) {
      warnings.push('Content requires legal review (compliance issues)')
    }
    
    // Step 5: Get AI metadata
    const generationTime = Date.now() - startTime
    const aiMetadata = {
      provider: provider.getProviderName() as 'gemini' | 'openai',
      model: provider.getModelName(),
      promptVersion: '1.0.0',
      temperature: 0.3,
      maxTokens: 2048,
      generationTime
    }
    
    // Step 6: Assemble test result
    const testResult: Omit<AITestResult, 'id' | 'createdAt'> = {
      articleId: request.articleId,
      sourceTitle: request.sourceTitle,
      sourceContent: request.sourceContent,
      sourceLanguage: request.sourceLanguage,
      targetLocale: request.targetLocale,
      targetPlatform: request.targetPlatform,
      generationMode: request.generationMode,
      regenerationMode: request.regenerationMode,
      masterContent: request.sourceContent,
      localizedContent,
      platformContent,
      glossaryTermsUsed: glossaryResult.termsUsed,
      trustScore,
      complianceScore,
      aiMetadata,
      createdBy: request.createdBy
    }
    
    // Step 7: Save test result
    const savedResult = await saveTestResult(testResult)
    
    console.log('[AI_TEST_SERVICE] Test execution complete')
    console.log(`[AI_TEST_SERVICE] Test ID: ${savedResult.id}`)
    console.log(`[AI_TEST_SERVICE] Trust Score: ${trustScore.overall}/100`)
    console.log(`[AI_TEST_SERVICE] Compliance Score: ${complianceScore.overall}/100`)
    
    return {
      success: true,
      testResult: savedResult,
      warnings
    }
    
  } catch (error: any) {
    console.error('[AI_TEST_SERVICE] Test execution failed:', error)
    
    return {
      success: false,
      error: error.message || 'Test execution failed',
      warnings
    }
  }
}

/**
 * Get test result by ID
 */
export async function getTest(testId: string): Promise<AITestResult | null> {
  return getTestResult(testId)
}

/**
 * List test results with filters
 */
export async function listTests(filters?: {
  articleId?: string
  targetLocale?: Language
  targetPlatform?: Platform
  limit?: number
}): Promise<AITestResult[]> {
  return getTestResults(filters)
}

/**
 * Delete test result
 */
export async function deleteTest(testId: string): Promise<boolean> {
  return deleteTestResult(testId)
}

/**
 * Get test statistics
 */
export async function getTestStatistics() {
  return getTestStats()
}

/**
 * Validate test execution request
 */
export function validateTestRequest(request: TestExecutionRequest): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!request.articleId || request.articleId.trim().length === 0) {
    issues.push('Article ID is required')
  }
  
  if (!request.sourceTitle || request.sourceTitle.trim().length === 0) {
    issues.push('Source title is required')
  }
  
  if (!request.sourceContent || request.sourceContent.trim().length < 100) {
    issues.push('Source content must be at least 100 characters')
  }
  
  if (!request.targetLocale) {
    issues.push('Target locale is required')
  }
  
  if (!request.targetPlatform) {
    issues.push('Target platform is required')
  }
  
  if (!request.createdBy || request.createdBy.trim().length === 0) {
    issues.push('Creator ID is required')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
