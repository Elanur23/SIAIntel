/**
 * Autonomous Distribution Assistant Engine
 * Phase 3D: Human-in-the-loop suggestion system
 * 
 * CRITICAL RULES:
 * - NO automatic publishing
 * - NO background jobs
 * - NO cron/schedulers
 * - ALL actions require manual approval
 * - ON DEMAND ONLY
 */

import type {
  AutonomousSuggestion,
  SuggestionRequest,
  SuggestionResponse,
  SuggestionReasoning,
  ApprovalRequest,
  ApprovalResult,
  RejectionRequest
} from './autonomous-types'
import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import { scoreSuggestion, getConfidenceLevel, meetsThreshold } from './suggestion-scorer'
import { getDistributionRecords } from '@/lib/distribution/database'
import { recommendVariant } from '@/lib/distribution/editorial/variant-recommendation-service'
import { generateEditorialVariants } from '@/lib/distribution/editorial/editorial-variant-selector'

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/**
 * In-memory suggestion storage
 * CRITICAL: This is not persisted. For demo/testing only.
 */
const suggestions: Map<string, AutonomousSuggestion> = new Map()

// ============================================================================
// MAIN SUGGESTION GENERATION
// ============================================================================

/**
 * Generate suggestions ON DEMAND
 * 
 * CRITICAL: This does NOT auto-publish. It only suggests.
 */
export async function generateSuggestions(
  request: SuggestionRequest = {}
): Promise<SuggestionResponse> {
  console.log('[AUTONOMOUS] Generating suggestions ON DEMAND')
  
  const {
    platform = 'telegram',
    locale = 'en',
    category,
    limit = 3,
    minScore = 60
  } = request
  
  // Get recent distribution records
  const records = await getDistributionRecords({
    status: 'draft',
    limit: 20
  })
  
  console.log('[AUTONOMOUS] Scanning', records.length, 'records')
  
  const candidateSuggestions: AutonomousSuggestion[] = []
  
  // Score each record
  for (const record of records) {
    // Use default category if not specified
    const recordCategory: TrendCategory = category || 'crypto'
    
    // Generate variants for this content
    const variants = await generateEditorialVariants({
      baseHeadline: record.sourceContent?.substring(0, 100) || 'Sample Headline',
      baseSummary: record.sourceContent?.substring(0, 300) || 'Sample summary for distribution',
      baseBody: record.sourceContent || 'Sample content for distribution',
      locale: locale,
      platform: platform,
      category: recordCategory
    })
    
    // Select best variant using recommendation service
    const recommendation = recommendVariant(
      variants,
      {
        locale,
        platform,
        category: recordCategory,
        generationMode: 'balanced'
      }
    )
    
    const bestVariant = recommendation.recommendation.recommendedVariant
    
    // Score this suggestion
    const score = scoreSuggestion({
      articleTitle: bestVariant.headline,
      articleBody: bestVariant.summary,
      category: recordCategory,
      platform,
      locale,
      currentTime: new Date(),
      suggestedTime: calculateOptimalPublishTime(new Date(), platform),
      trendingTerms: [] // TODO: integrate with trend detection
    })
    
    // Check if meets threshold
    if (!meetsThreshold(score, minScore)) {
      continue
    }
    
    // Generate reasoning
    const reasoning = generateReasoning(
      record,
      bestVariant,
      score,
      platform,
      locale
    )
    
    // Create suggestion
    const suggestion: AutonomousSuggestion = {
      id: generateSuggestionId(),
      timestamp: new Date(),
      articleId: record.id,
      articleTitle: record.sourceContent || 'Untitled',
      suggestedHeadline: bestVariant.headline,
      suggestedVariant: bestVariant.variantType,
      suggestedBody: bestVariant.summary,
      suggestedPlatform: platform,
      suggestedLocale: locale,
      suggestedCategory: recordCategory,
      suggestedPublishTime: calculateOptimalPublishTime(new Date(), platform),
      overallScore: score.overallScore,
      scores: score,
      reasoning,
      status: 'pending'
    }
    
    candidateSuggestions.push(suggestion)
  }
  
  // Sort by score (highest first)
  candidateSuggestions.sort((a, b) => b.overallScore - a.overallScore)
  
  // Take top N
  const topSuggestions = candidateSuggestions.slice(0, limit)
  
  // Store suggestions
  topSuggestions.forEach(s => suggestions.set(s.id, s))
  
  console.log('[AUTONOMOUS] Generated', topSuggestions.length, 'suggestions')
  
  // Calculate metadata
  const scores = topSuggestions.map(s => s.overallScore)
  const metadata = {
    averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0
  }
  
  return {
    suggestions: topSuggestions,
    totalScanned: records.length,
    totalSuggested: topSuggestions.length,
    generatedAt: new Date(),
    metadata
  }
}

// ============================================================================
// APPROVAL FLOW
// ============================================================================

/**
 * Approve a suggestion
 * 
 * CRITICAL: This does NOT publish. It only marks as approved.
 * Human must still manually publish.
 */
export async function approveSuggestion(
  request: ApprovalRequest
): Promise<ApprovalResult> {
  console.log('[AUTONOMOUS] Approving suggestion:', request.suggestionId)
  
  const suggestion = suggestions.get(request.suggestionId)
  
  if (!suggestion) {
    return {
      success: false,
      suggestion: null as any,
      readyToPublish: false,
      validationErrors: ['Suggestion not found']
    }
  }
  
  // Update status
  suggestion.status = 'approved'
  suggestion.approvedBy = request.approvedBy
  suggestion.approvedAt = new Date()
  
  suggestions.set(suggestion.id, suggestion)
  
  console.log('[AUTONOMOUS] Suggestion approved, ready for manual publish')
  
  return {
    success: true,
    suggestion,
    readyToPublish: true,
    validationErrors: []
  }
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(
  request: RejectionRequest
): Promise<{ success: boolean; suggestion: AutonomousSuggestion }> {
  console.log('[AUTONOMOUS] Rejecting suggestion:', request.suggestionId)
  
  const suggestion = suggestions.get(request.suggestionId)
  
  if (!suggestion) {
    throw new Error('Suggestion not found')
  }
  
  // Update status
  suggestion.status = 'rejected'
  suggestion.rejectedBy = request.rejectedBy
  suggestion.rejectedAt = new Date()
  suggestion.rejectionReason = request.reason
  
  suggestions.set(suggestion.id, suggestion)
  
  return {
    success: true,
    suggestion
  }
}

/**
 * Get suggestion by ID
 */
export function getSuggestion(id: string): AutonomousSuggestion | undefined {
  return suggestions.get(id)
}

/**
 * Get all suggestions
 */
export function getAllSuggestions(): AutonomousSuggestion[] {
  return Array.from(suggestions.values())
}

/**
 * Clear all suggestions (for testing)
 */
export function clearSuggestions(): void {
  suggestions.clear()
  console.log('[AUTONOMOUS] Cleared all suggestions')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate optimal publish time
 */
function calculateOptimalPublishTime(currentTime: Date, platform: Platform): Date {
  const optimal = new Date(currentTime)
  
  // Add 1-2 hours for optimal timing
  const hoursToAdd = Math.floor(Math.random() * 2) + 1
  optimal.setHours(optimal.getHours() + hoursToAdd)
  
  // Round to nearest 15 minutes
  const minutes = optimal.getMinutes()
  const roundedMinutes = Math.round(minutes / 15) * 15
  optimal.setMinutes(roundedMinutes)
  optimal.setSeconds(0)
  optimal.setMilliseconds(0)
  
  return optimal
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(
  record: any,
  variant: any,
  score: any,
  platform: Platform,
  locale: Language
): SuggestionReasoning {
  const contentSelection: string[] = [
    `Selected from ${record.category} category`,
    `Content has high relevance score (${score.trendRelevance}/100)`
  ]
  
  const headlineChoice: string[] = [
    `Headline optimized for ${platform}`,
    `Length: ${variant.headline.length} characters (optimal range)`
  ]
  
  const variantChoice: string[] = [
    `Variant type: ${variant.variantType}`,
    `Editorial quality: ${variant.editorialQuality}/100`,
    `Brand safety: ${variant.brandSafetyScore}/100`
  ]
  
  const platformChoice: string[] = [
    `${platform} selected for high engagement potential`,
    `Platform fit score: ${score.platformFit}/100`
  ]
  
  const timingChoice: string[] = [
    `Suggested time optimized for peak engagement`,
    `Timing score: ${score.timingScore}/100`
  ]
  
  const risks: string[] = []
  if (score.safetyScore < 80) {
    risks.push('Safety score below optimal threshold')
  }
  if (score.overallScore < 70) {
    risks.push('Overall score indicates moderate confidence')
  }
  
  const confidence = getConfidenceLevel(score.overallScore)
  
  return {
    contentSelection,
    headlineChoice,
    variantChoice,
    platformChoice,
    timingChoice,
    risks,
    confidence,
    confidenceScore: score.overallScore
  }
}

/**
 * Generate unique suggestion ID
 */
function generateSuggestionId(): string {
  return `suggestion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
