/**
 * Variant Recommendation Service
 * Phase 3A.7 Step 3: Intelligent variant selection and recommendation
 * 
 * Selects the best editorial variant based on:
 * - Locale preferences
 * - Platform characteristics
 * - Category requirements
 * - Generation mode
 * 
 * Provides human-readable reasoning and prevents sensationalism over-rewarding.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type {
  EditorialVariant,
  EditorialVariantType,
  VariantGenerationResult
} from './editorial-variant-selector'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generation mode
 */
export type GenerationMode = 
  | 'conservative'      // Prioritize safety and compliance
  | 'balanced'          // Balance engagement and quality
  | 'engagement'        // Prioritize engagement (with safety limits)
  | 'institutional'     // Maximum credibility and authority

/**
 * Recommendation context
 */
export interface RecommendationContext {
  // Target
  locale: Language
  platform: Platform
  category: TrendCategory
  
  // Mode
  generationMode: GenerationMode
  
  // Constraints
  minBrandSafetyScore?: number // Default: 70
  minTrustScore?: number // Default: 70
  maxSensationalismRisk?: number // Default: 30
  
  // Preferences
  prioritizeEngagement?: boolean
  prioritizeQuality?: boolean
  allowRiskyVariants?: boolean
}

/**
 * Variant recommendation
 */
export interface VariantRecommendation {
  // Selected variant
  recommendedVariant: EditorialVariant
  alternativeVariants: EditorialVariant[]
  
  // Reasoning
  selectionReasoning: string[]
  rejectionReasons: Record<EditorialVariantType, string[]>
  risksAndTradeoffs: string[]
  
  // Confidence
  recommendationConfidence: number // 0-100
  
  // Warnings
  warnings: string[]
  
  // Metadata
  recommendedAt: Date
  context: RecommendationContext
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  recommendation: VariantRecommendation
  allVariants: EditorialVariant[]
  variantScores: Record<EditorialVariantType, number>
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

/**
 * Recommend best variant for given context
 */
export function recommendVariant(
  variantResult: VariantGenerationResult,
  context: RecommendationContext
): RecommendationResult {
  console.log('[VARIANT_RECOMMENDATION] Recommending variant for', context.locale, context.platform, context.generationMode)
  
  // Apply constraints and filters
  const eligibleVariants = filterEligibleVariants(variantResult.variants, context)
  
  if (eligibleVariants.length === 0) {
    throw new Error('No variants meet safety and quality thresholds')
  }
  
  // Score variants for this context
  const variantScores = scoreVariantsForContext(eligibleVariants, context)
  
  // Select best variant
  const recommendedVariant = selectBestVariant(eligibleVariants, variantScores, context)
  
  // Get alternatives
  const alternativeVariants = eligibleVariants
    .filter(v => v.variantType !== recommendedVariant.variantType)
    .sort((a, b) => variantScores[b.variantType] - variantScores[a.variantType])
  
  // Generate reasoning
  const selectionReasoning = generateSelectionReasoning(recommendedVariant, context, variantScores)
  const rejectionReasons = generateRejectionReasons(variantResult.variants, eligibleVariants, recommendedVariant, context)
  const risksAndTradeoffs = identifyRisksAndTradeoffs(recommendedVariant, context)
  
  // Calculate recommendation confidence
  const recommendationConfidence = calculateRecommendationConfidence(
    recommendedVariant,
    alternativeVariants,
    variantScores,
    context
  )
  
  // Generate warnings
  const warnings = generateWarnings(recommendedVariant, context)
  
  const recommendation: VariantRecommendation = {
    recommendedVariant,
    alternativeVariants,
    selectionReasoning,
    rejectionReasons,
    risksAndTradeoffs,
    recommendationConfidence,
    warnings,
    recommendedAt: new Date(),
    context
  }
  
  return {
    recommendation,
    allVariants: variantResult.variants,
    variantScores
  }
}

// ============================================================================
// VARIANT FILTERING
// ============================================================================

/**
 * Filter variants that meet safety and quality thresholds
 */
function filterEligibleVariants(
  variants: EditorialVariant[],
  context: RecommendationContext
): EditorialVariant[] {
  const minBrandSafety = context.minBrandSafetyScore ?? 70
  const minTrust = context.minTrustScore ?? 70
  const maxSensationalism = context.maxSensationalismRisk ?? 30
  
  return variants.filter(variant => {
    // Brand safety threshold
    if (variant.brandSafetyScore < minBrandSafety) {
      return false
    }
    
    // Trust threshold
    if (variant.trustComplianceScore < minTrust) {
      return false
    }
    
    // Sensationalism check (inverse of brand safety)
    const sensationalismRisk = 100 - variant.brandSafetyScore
    if (sensationalismRisk > maxSensationalism) {
      return false
    }
    
    // Risky variants check
    if (!context.allowRiskyVariants && variant.risks.length > 2) {
      return false
    }
    
    return true
  })
}

// ============================================================================
// CONTEXT-BASED SCORING
// ============================================================================

/**
 * Score variants specifically for the given context
 */
function scoreVariantsForContext(
  variants: EditorialVariant[],
  context: RecommendationContext
): Record<EditorialVariantType, number> {
  const scores: Record<string, number> = {}
  
  variants.forEach(variant => {
    let score = variant.overallScore // Start with base score
    
    // Apply generation mode adjustments
    score += applyGenerationModeBonus(variant, context.generationMode)
    
    // Apply locale fit bonus
    score += applyLocaleFitBonus(variant, context.locale)
    
    // Apply platform fit bonus
    score += applyPlatformFitBonus(variant, context.platform)
    
    // Apply category fit bonus
    score += applyCategoryFitBonus(variant, context.category)
    
    // Apply preference bonuses
    if (context.prioritizeEngagement) {
      score += variant.engagementPotential * 0.2
    }
    if (context.prioritizeQuality) {
      score += variant.editorialQuality * 0.2
    }
    
    // Penalize sensationalism (CRITICAL: prevents over-rewarding)
    score -= applySensationalismPenalty(variant)
    
    scores[variant.variantType] = Math.round(score)
  })
  
  return scores as Record<EditorialVariantType, number>
}

/**
 * Apply generation mode bonus
 */
function applyGenerationModeBonus(variant: EditorialVariant, mode: GenerationMode): number {
  const bonuses: Record<GenerationMode, Record<EditorialVariantType, number>> = {
    conservative: {
      safe_factual: 20,
      attention_optimized: 0,
      high_authority_institutional: 15
    },
    balanced: {
      safe_factual: 5,
      attention_optimized: 15,
      high_authority_institutional: 10
    },
    engagement: {
      safe_factual: -5,
      attention_optimized: 20,
      high_authority_institutional: 0
    },
    institutional: {
      safe_factual: 10,
      attention_optimized: 0,
      high_authority_institutional: 25
    }
  }
  
  return bonuses[mode][variant.variantType]
}

/**
 * Apply locale fit bonus
 */
function applyLocaleFitBonus(variant: EditorialVariant, locale: Language): number {
  // Conservative locales prefer safe variants
  const conservativeLocales: Language[] = ['de', 'jp', 'ar', 'tr']
  
  if (conservativeLocales.includes(locale)) {
    if (variant.variantType === 'safe_factual') return 10
    if (variant.variantType === 'high_authority_institutional') return 8
    if (variant.variantType === 'attention_optimized') return -5
  }
  
  // English locale is more balanced
  if (locale === 'en') {
    if (variant.variantType === 'attention_optimized') return 5
    if (variant.variantType === 'high_authority_institutional') return 5
  }
  
  return 0
}

/**
 * Apply platform fit bonus
 */
function applyPlatformFitBonus(variant: EditorialVariant, platform: Platform): number {
  const platformBonuses: Record<Platform, Record<EditorialVariantType, number>> = {
    x: {
      safe_factual: -5,
      attention_optimized: 15,
      high_authority_institutional: 0
    },
    linkedin: {
      safe_factual: 5,
      attention_optimized: 0,
      high_authority_institutional: 20
    },
    telegram: {
      safe_factual: 10,
      attention_optimized: 5,
      high_authority_institutional: 5
    },
    facebook: {
      safe_factual: 5,
      attention_optimized: 10,
      high_authority_institutional: 0
    },
    discord: {
      safe_factual: 5,
      attention_optimized: 10,
      high_authority_institutional: 5
    },
    instagram: {
      safe_factual: -5,
      attention_optimized: 15,
      high_authority_institutional: -5
    },
    tiktok: {
      safe_factual: -10,
      attention_optimized: 20,
      high_authority_institutional: -10
    }
  }
  
  return platformBonuses[platform][variant.variantType]
}

/**
 * Apply category fit bonus
 */
function applyCategoryFitBonus(variant: EditorialVariant, category: TrendCategory): number {
  // Finance and economy prefer authority
  if (category === 'finance' || category === 'economy') {
    if (variant.variantType === 'high_authority_institutional') return 10
    if (variant.variantType === 'safe_factual') return 5
  }
  
  // Crypto can be more engaging
  if (category === 'crypto') {
    if (variant.variantType === 'attention_optimized') return 8
  }
  
  // AI prefers authority
  if (category === 'ai') {
    if (variant.variantType === 'high_authority_institutional') return 10
  }
  
  return 0
}

/**
 * Apply sensationalism penalty (CRITICAL: prevents over-rewarding)
 */
function applySensationalismPenalty(variant: EditorialVariant): number {
  let penalty = 0
  
  // Penalize low brand safety
  if (variant.brandSafetyScore < 80) {
    penalty += (80 - variant.brandSafetyScore) * 0.5
  }
  
  // Penalize low trust
  if (variant.trustComplianceScore < 80) {
    penalty += (80 - variant.trustComplianceScore) * 0.3
  }
  
  // Penalize high risk count
  penalty += variant.risks.length * 5
  
  return penalty
}

// ============================================================================
// VARIANT SELECTION
// ============================================================================

/**
 * Select best variant based on scores and context
 */
export function selectBestVariant(
  variants: EditorialVariant[],
  scores: Record<EditorialVariantType, number>,
  context: RecommendationContext
): EditorialVariant {
  // Sort by context-adjusted score
  const sorted = [...variants].sort((a, b) => 
    scores[b.variantType] - scores[a.variantType]
  )
  
  // Return highest scoring variant
  return sorted[0]
}

// ============================================================================
// REASONING GENERATION
// ============================================================================

/**
 * Generate selection reasoning
 */
function generateSelectionReasoning(
  variant: EditorialVariant,
  context: RecommendationContext,
  scores: Record<EditorialVariantType, number>
): string[] {
  const reasoning: string[] = []
  
  reasoning.push(`Selected "${variant.variantName}" variant with context score of ${scores[variant.variantType]}/100`)
  reasoning.push(`Generation mode: ${context.generationMode}`)
  reasoning.push(`Target: ${context.locale} locale, ${context.platform} platform, ${context.category} category`)
  
  // Explain why this variant fits
  if (context.generationMode === 'conservative' && variant.variantType === 'safe_factual') {
    reasoning.push('Conservative mode prioritizes safety and compliance - perfect match')
  } else if (context.generationMode === 'institutional' && variant.variantType === 'high_authority_institutional') {
    reasoning.push('Institutional mode prioritizes credibility and authority - perfect match')
  } else if (context.generationMode === 'engagement' && variant.variantType === 'attention_optimized') {
    reasoning.push('Engagement mode prioritizes platform performance while maintaining quality')
  } else if (context.generationMode === 'balanced') {
    reasoning.push('Balanced mode selected variant with best overall score across all dimensions')
  }
  
  // Highlight key strengths
  reasoning.push(`Key strengths: ${variant.strengths.slice(0, 2).join(', ')}`)
  
  // Mention scores
  reasoning.push(`Brand safety: ${variant.brandSafetyScore}/100, Trust: ${variant.trustComplianceScore}/100, Engagement: ${variant.engagementPotential}/100`)
  
  return reasoning
}

/**
 * Generate rejection reasons for non-selected variants
 */
function generateRejectionReasons(
  allVariants: EditorialVariant[],
  eligibleVariants: EditorialVariant[],
  selectedVariant: EditorialVariant,
  context: RecommendationContext
): Record<EditorialVariantType, string[]> {
  const reasons: Record<string, string[]> = {}
  
  allVariants.forEach(variant => {
    if (variant.variantType === selectedVariant.variantType) {
      return // Skip selected variant
    }
    
    const variantReasons: string[] = []
    
    // Check if filtered out
    const wasFiltered = !eligibleVariants.some(v => v.variantType === variant.variantType)
    if (wasFiltered) {
      if (variant.brandSafetyScore < (context.minBrandSafetyScore ?? 70)) {
        variantReasons.push(`Brand safety score (${variant.brandSafetyScore}) below threshold`)
      }
      if (variant.trustComplianceScore < (context.minTrustScore ?? 70)) {
        variantReasons.push(`Trust score (${variant.trustComplianceScore}) below threshold`)
      }
      if (!context.allowRiskyVariants && variant.risks.length > 2) {
        variantReasons.push('Too many identified risks')
      }
    } else {
      // Not selected but was eligible
      if (variant.variantType === 'safe_factual' && context.generationMode === 'engagement') {
        variantReasons.push('Lower engagement potential than selected variant')
      } else if (variant.variantType === 'attention_optimized' && context.generationMode === 'conservative') {
        variantReasons.push('Higher risk profile than conservative mode allows')
      } else if (variant.variantType === 'high_authority_institutional' && context.platform === 'x') {
        variantReasons.push('May be too formal for X/Twitter platform')
      } else {
        variantReasons.push('Lower context-adjusted score than selected variant')
      }
      
      // Mention weaknesses
      if (variant.weaknesses.length > 0) {
        variantReasons.push(`Weaknesses: ${variant.weaknesses[0]}`)
      }
    }
    
    reasons[variant.variantType] = variantReasons
  })
  
  return reasons as Record<EditorialVariantType, string[]>
}

/**
 * Identify risks and tradeoffs
 */
function identifyRisksAndTradeoffs(
  variant: EditorialVariant,
  context: RecommendationContext
): string[] {
  const risksAndTradeoffs: string[] = []
  
  // Include variant's identified risks
  variant.risks.forEach(risk => {
    risksAndTradeoffs.push(`Risk: ${risk}`)
  })
  
  // Identify tradeoffs based on variant type
  if (variant.variantType === 'safe_factual') {
    risksAndTradeoffs.push('Tradeoff: Lower engagement potential for higher safety')
  } else if (variant.variantType === 'attention_optimized') {
    risksAndTradeoffs.push('Tradeoff: Higher engagement potential with slightly elevated risk')
  } else if (variant.variantType === 'high_authority_institutional') {
    risksAndTradeoffs.push('Tradeoff: Maximum credibility but may be too formal for casual platforms')
  }
  
  // Platform-specific tradeoffs
  if (context.platform === 'x' && variant.variantType !== 'attention_optimized') {
    risksAndTradeoffs.push('Platform tradeoff: May not be optimal for X/Twitter\'s fast-paced environment')
  }
  if (context.platform === 'linkedin' && variant.variantType === 'attention_optimized') {
    risksAndTradeoffs.push('Platform tradeoff: May be too casual for LinkedIn\'s professional audience')
  }
  
  return risksAndTradeoffs
}

// ============================================================================
// CONFIDENCE AND WARNINGS
// ============================================================================

/**
 * Calculate recommendation confidence
 */
function calculateRecommendationConfidence(
  selectedVariant: EditorialVariant,
  alternatives: EditorialVariant[],
  scores: Record<EditorialVariantType, number>,
  context: RecommendationContext
): number {
  let confidence = 70 // Base confidence
  
  // Higher confidence if selected variant has high scores
  if (selectedVariant.overallScore >= 85) confidence += 15
  else if (selectedVariant.overallScore >= 75) confidence += 10
  else if (selectedVariant.overallScore >= 65) confidence += 5
  
  // Higher confidence if clear winner
  if (alternatives.length > 0) {
    const selectedScore = scores[selectedVariant.variantType]
    const nextBestScore = Math.max(...alternatives.map(v => scores[v.variantType]))
    const scoreDiff = selectedScore - nextBestScore
    
    if (scoreDiff >= 20) confidence += 15
    else if (scoreDiff >= 10) confidence += 10
    else if (scoreDiff >= 5) confidence += 5
    else confidence -= 5 // Close call
  }
  
  // Lower confidence if risks present
  confidence -= selectedVariant.risks.length * 3
  
  // Lower confidence if warnings present
  confidence -= selectedVariant.weaknesses.length * 2
  
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Generate warnings
 */
function generateWarnings(
  variant: EditorialVariant,
  context: RecommendationContext
): string[] {
  const warnings: string[] = []
  
  // Brand safety warnings
  if (variant.brandSafetyScore < 80) {
    warnings.push('Brand safety score below 80 - review content carefully')
  }
  
  // Trust warnings
  if (variant.trustComplianceScore < 80) {
    warnings.push('Trust score below 80 - ensure compliance review')
  }
  
  // Engagement warnings
  if (variant.engagementPotential < 60 && context.prioritizeEngagement) {
    warnings.push('Low engagement potential - may not perform well on competitive platforms')
  }
  
  // Platform mismatch warnings
  if (context.platform === 'x' && variant.variantType === 'high_authority_institutional') {
    warnings.push('Formal variant on casual platform - monitor performance')
  }
  if (context.platform === 'linkedin' && variant.variantType === 'attention_optimized') {
    warnings.push('Engagement-focused variant on professional platform - ensure tone is appropriate')
  }
  
  // Risk warnings
  if (variant.risks.length > 0) {
    warnings.push(`${variant.risks.length} risk(s) identified - review before publishing`)
  }
  
  return warnings
}
