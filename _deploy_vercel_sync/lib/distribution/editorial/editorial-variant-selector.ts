/**
 * Editorial Variant Selector
 * Phase 3A.7 Step 3: Generate and evaluate multiple editorial variants
 * 
 * Generates at least 3 editorial variants:
 * - safe_factual: Conservative, fact-focused, minimal risk
 * - attention_optimized: Balanced engagement with editorial quality
 * - high_authority_institutional: Maximum credibility and authority
 * 
 * Each variant is scored across multiple dimensions to enable
 * intelligent selection based on context.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type { NarrativeAngle } from './narrative-framing-service'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Editorial variant type
 */
export type EditorialVariantType = 
  | 'safe_factual'                    // Conservative, fact-focused
  | 'attention_optimized'             // Balanced engagement
  | 'high_authority_institutional'    // Maximum credibility

/**
 * Editorial variant
 */
export interface EditorialVariant {
  // Variant metadata
  variantType: EditorialVariantType
  variantName: string
  variantDescription: string
  
  // Content
  headline: string
  summary: string
  hook: string // Opening sentence
  narrativeAngle: NarrativeAngle
  
  // Scores (0-100)
  trendRelevanceScore: number
  platformFitScore: number
  localeFitScore: number
  trustComplianceScore: number
  brandSafetyScore: number
  confidenceScore: number
  
  // Composite scores
  overallScore: number
  engagementPotential: number
  editorialQuality: number
  
  // Analysis
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  
  // Metadata
  generatedAt: Date
}

/**
 * Variant generation context
 */
export interface VariantGenerationContext {
  // Source content
  baseHeadline: string
  baseSummary: string
  baseBody: string
  
  // Context
  locale: Language
  platform: Platform
  category: TrendCategory
  
  // Optional metadata
  trendTerms?: string[]
  narrativeAngle?: NarrativeAngle
  hasMarketData?: boolean
  hasPolicyContent?: boolean
  sentiment?: 'positive' | 'negative' | 'neutral'
}

/**
 * Variant generation result
 */
export interface VariantGenerationResult {
  // Generated variants
  variants: EditorialVariant[]
  
  // Analysis
  variantComparison: VariantComparison
  
  // Metadata
  generatedAt: Date
  context: VariantGenerationContext
}

/**
 * Variant comparison
 */
export interface VariantComparison {
  highestOverallScore: EditorialVariantType
  highestEngagement: EditorialVariantType
  highestQuality: EditorialVariantType
  safestOption: EditorialVariantType
  
  scoreRanges: {
    overall: { min: number; max: number; avg: number }
    engagement: { min: number; max: number; avg: number }
    quality: { min: number; max: number; avg: number }
    safety: { min: number; max: number; avg: number }
  }
}

// ============================================================================
// MAIN VARIANT GENERATION
// ============================================================================

/**
 * Generate multiple editorial variants for evaluation
 */
export function generateEditorialVariants(
  context: VariantGenerationContext
): VariantGenerationResult {
  console.log('[VARIANT_SELECTOR] Generating variants for', context.locale, context.platform, context.category)
  
  // Generate each variant type
  const variants: EditorialVariant[] = [
    generateSafeFactualVariant(context),
    generateAttentionOptimizedVariant(context),
    generateHighAuthorityVariant(context)
  ]
  
  // Compare variants
  const variantComparison = compareVariants(variants)
  
  return {
    variants,
    variantComparison,
    generatedAt: new Date(),
    context
  }
}

// ============================================================================
// VARIANT GENERATORS
// ============================================================================

/**
 * Generate safe_factual variant
 * Conservative, fact-focused, minimal risk
 */
function generateSafeFactualVariant(
  context: VariantGenerationContext
): EditorialVariant {
  // Conservative headline - remove any sensational elements
  const headline = createSafeHeadline(context.baseHeadline, context)
  
  // Factual summary - straightforward, no embellishment
  const summary = createFactualSummary(context.baseSummary, context)
  
  // Direct hook - clear and informative
  const hook = createDirectHook(summary, context)
  
  // Conservative narrative angle
  const narrativeAngle = selectConservativeAngle(context)
  
  // Score this variant
  const scores = scoreVariant({
    headline,
    summary,
    hook,
    narrativeAngle,
    variantType: 'safe_factual',
    context
  })
  
  return {
    variantType: 'safe_factual',
    variantName: 'Safe & Factual',
    variantDescription: 'Conservative, fact-focused approach with minimal risk. Prioritizes accuracy and compliance over engagement.',
    headline,
    summary,
    hook,
    narrativeAngle,
    ...scores,
    strengths: [
      'Highest brand safety score',
      'Maximum trust and compliance',
      'Minimal regulatory risk',
      'Clear and factual'
    ],
    weaknesses: [
      'Lower engagement potential',
      'May lack curiosity factor',
      'Less competitive on social platforms'
    ],
    risks: [
      'May be overlooked in crowded feeds',
      'Lower click-through rates possible'
    ],
    generatedAt: new Date()
  }
}

/**
 * Generate attention_optimized variant
 * Balanced engagement with editorial quality
 */
function generateAttentionOptimizedVariant(
  context: VariantGenerationContext
): EditorialVariant {
  // Optimized headline - engaging but not clickbait
  const headline = createOptimizedHeadline(context.baseHeadline, context)
  
  // Engaging summary - curiosity without manipulation
  const summary = createEngagingSummary(context.baseSummary, context)
  
  // Strong hook - captures attention appropriately
  const hook = createStrongHook(summary, context)
  
  // Balanced narrative angle
  const narrativeAngle = selectBalancedAngle(context)
  
  // Score this variant
  const scores = scoreVariant({
    headline,
    summary,
    hook,
    narrativeAngle,
    variantType: 'attention_optimized',
    context
  })
  
  return {
    variantType: 'attention_optimized',
    variantName: 'Attention Optimized',
    variantDescription: 'Balanced approach optimizing engagement while maintaining editorial standards. Best for competitive platforms.',
    headline,
    summary,
    hook,
    narrativeAngle,
    ...scores,
    strengths: [
      'Higher engagement potential',
      'Good platform fit',
      'Balanced risk/reward',
      'Competitive in feeds'
    ],
    weaknesses: [
      'Slightly higher brand safety risk',
      'Requires careful monitoring',
      'May need locale adjustment'
    ],
    risks: [
      'Could approach clickbait territory if not monitored',
      'May not suit all locales equally'
    ],
    generatedAt: new Date()
  }
}

/**
 * Generate high_authority_institutional variant
 * Maximum credibility and authority
 */
function generateHighAuthorityVariant(
  context: VariantGenerationContext
): EditorialVariant {
  // Authoritative headline - professional and credible
  const headline = createAuthoritativeHeadline(context.baseHeadline, context)
  
  // Professional summary - institutional tone
  const summary = createProfessionalSummary(context.baseSummary, context)
  
  // Expert hook - demonstrates authority
  const hook = createExpertHook(summary, context)
  
  // Authority-focused narrative angle
  const narrativeAngle = selectAuthorityAngle(context)
  
  // Score this variant
  const scores = scoreVariant({
    headline,
    summary,
    hook,
    narrativeAngle,
    variantType: 'high_authority_institutional',
    context
  })
  
  return {
    variantType: 'high_authority_institutional',
    variantName: 'High Authority',
    variantDescription: 'Maximum credibility and institutional appeal. Best for professional audiences and LinkedIn.',
    headline,
    summary,
    hook,
    narrativeAngle,
    ...scores,
    strengths: [
      'Highest editorial quality',
      'Maximum institutional credibility',
      'Best for professional platforms',
      'Strong E-E-A-T signals'
    ],
    weaknesses: [
      'Lower engagement on casual platforms',
      'May be too formal for some audiences',
      'Less viral potential'
    ],
    risks: [
      'May not perform well on X/Twitter',
      'Could be perceived as dry'
    ],
    generatedAt: new Date()
  }
}

// ============================================================================
// HEADLINE CREATORS
// ============================================================================

/**
 * Create safe, factual headline
 */
function createSafeHeadline(baseHeadline: string, context: VariantGenerationContext): string {
  let headline = baseHeadline.trim()
  
  // Remove any sensational words
  headline = headline
    .replace(/shocking|unbelievable|incredible|amazing/gi, '')
    .replace(/!/g, '')
    .replace(/\?{2,}/g, '?')
    .trim()
  
  // Ensure it's factual and direct
  if (context.hasMarketData) {
    // Keep numbers and facts prominent
    headline = headline.replace(/surges?|plunges?/gi, 'moves')
  }
  
  return headline
}

/**
 * Create optimized headline for engagement
 */
function createOptimizedHeadline(baseHeadline: string, context: VariantGenerationContext): string {
  let headline = baseHeadline.trim()
  
  // Keep strong verbs but remove excessive sensationalism
  headline = headline
    .replace(/shocking|unbelievable/gi, '')
    .replace(/!{2,}/g, '!')
    .trim()
  
  // Add specificity if available
  if (context.hasMarketData && !headline.match(/\d+%/)) {
    // Would add percentage if available from context
  }
  
  return headline
}

/**
 * Create authoritative headline
 */
function createAuthoritativeHeadline(baseHeadline: string, context: VariantGenerationContext): string {
  let headline = baseHeadline.trim()
  
  // Remove all exclamation marks and casual language
  headline = headline
    .replace(/!/g, '')
    .replace(/\?/g, '')
    .trim()
  
  // Use professional language
  headline = headline
    .replace(/surges?/gi, 'rises')
    .replace(/plunges?/gi, 'declines')
    .replace(/crashes?/gi, 'falls')
  
  return headline
}

// ============================================================================
// SUMMARY CREATORS
// ============================================================================

/**
 * Create factual summary
 */
function createFactualSummary(baseSummary: string, context: VariantGenerationContext): string {
  let summary = baseSummary.trim()
  
  // Ensure it's straightforward and factual
  summary = summary
    .replace(/shocking|unbelievable|incredible/gi, '')
    .replace(/!/g, '.')
    .trim()
  
  return summary
}

/**
 * Create engaging summary
 */
function createEngagingSummary(baseSummary: string, context: VariantGenerationContext): string {
  let summary = baseSummary.trim()
  
  // Keep it engaging but not manipulative
  summary = summary
    .replace(/shocking|unbelievable/gi, '')
    .trim()
  
  return summary
}

/**
 * Create professional summary
 */
function createProfessionalSummary(baseSummary: string, context: VariantGenerationContext): string {
  let summary = baseSummary.trim()
  
  // Professional, institutional tone
  summary = summary
    .replace(/!/g, '.')
    .replace(/\?/g, '.')
    .trim()
  
  return summary
}

// ============================================================================
// HOOK CREATORS
// ============================================================================

/**
 * Create direct hook
 */
function createDirectHook(summary: string, context: VariantGenerationContext): string {
  // Extract first sentence or create from summary
  const sentences = summary.split(/[.!?]/)
  return sentences[0].trim() + '.'
}

/**
 * Create strong hook
 */
function createStrongHook(summary: string, context: VariantGenerationContext): string {
  // Similar to direct but with slightly more emphasis
  const sentences = summary.split(/[.!?]/)
  return sentences[0].trim() + '.'
}

/**
 * Create expert hook
 */
function createExpertHook(summary: string, context: VariantGenerationContext): string {
  // Professional, authoritative opening
  const sentences = summary.split(/[.!?]/)
  return sentences[0].trim() + '.'
}

// ============================================================================
// NARRATIVE ANGLE SELECTION
// ============================================================================

/**
 * Select conservative narrative angle
 */
function selectConservativeAngle(context: VariantGenerationContext): NarrativeAngle {
  // Prefer safe, factual angles
  if (context.category === 'crypto' || context.category === 'finance') {
    return 'risk_assessment'
  }
  if (context.category === 'economy') {
    return 'policy_impact'
  }
  if (context.category === 'ai') {
    return 'expert_perspective'
  }
  return 'technical_analysis'
}

/**
 * Select balanced narrative angle
 */
function selectBalancedAngle(context: VariantGenerationContext): NarrativeAngle {
  // Balance engagement and credibility
  if (context.category === 'crypto') {
    return 'market_reaction'
  }
  if (context.category === 'economy' || context.category === 'finance') {
    return 'why_it_matters_now'
  }
  if (context.category === 'ai') {
    return 'hidden_implication'
  }
  return 'investor_attention'
}

/**
 * Select authority-focused narrative angle
 */
function selectAuthorityAngle(context: VariantGenerationContext): NarrativeAngle {
  // Maximize credibility and authority
  if (context.category === 'crypto' || context.category === 'finance') {
    return 'institutional_significance'
  }
  if (context.category === 'economy') {
    return 'policy_impact'
  }
  return 'expert_perspective'
}

// ============================================================================
// VARIANT SCORING
// ============================================================================

interface VariantScoringInput {
  headline: string
  summary: string
  hook: string
  narrativeAngle: NarrativeAngle
  variantType: EditorialVariantType
  context: VariantGenerationContext
}

interface VariantScores {
  trendRelevanceScore: number
  platformFitScore: number
  localeFitScore: number
  trustComplianceScore: number
  brandSafetyScore: number
  confidenceScore: number
  overallScore: number
  engagementPotential: number
  editorialQuality: number
}

/**
 * Score a variant across all dimensions
 */
function scoreVariant(input: VariantScoringInput): VariantScores {
  const { headline, summary, hook, narrativeAngle, variantType, context } = input
  
  // Calculate individual scores
  const trendRelevanceScore = scoreTrendRelevance(variantType, context)
  const platformFitScore = scorePlatformFit(variantType, context.platform)
  const localeFitScore = scoreLocaleFit(variantType, context.locale)
  const trustComplianceScore = scoreTrustCompliance(variantType, headline, summary)
  const brandSafetyScore = scoreBrandSafety(variantType, headline, summary, hook)
  const confidenceScore = scoreConfidence(variantType, context)
  
  // Calculate composite scores
  const engagementPotential = calculateEngagementPotential(variantType, platformFitScore, trendRelevanceScore)
  const editorialQuality = calculateEditorialQuality(variantType, trustComplianceScore, brandSafetyScore)
  
  // Calculate overall score (weighted average)
  const overallScore = calculateOverallScore({
    trendRelevanceScore,
    platformFitScore,
    localeFitScore,
    trustComplianceScore,
    brandSafetyScore,
    confidenceScore
  })
  
  return {
    trendRelevanceScore,
    platformFitScore,
    localeFitScore,
    trustComplianceScore,
    brandSafetyScore,
    confidenceScore,
    overallScore,
    engagementPotential,
    editorialQuality
  }
}

/**
 * Score trend relevance
 */
function scoreTrendRelevance(variantType: EditorialVariantType, context: VariantGenerationContext): number {
  let score = 70 // Base score
  
  if (variantType === 'attention_optimized') {
    score += 15 // Better trend integration
  } else if (variantType === 'safe_factual') {
    score += 5 // Conservative trend usage
  } else {
    score += 10 // Moderate trend usage
  }
  
  return Math.min(100, score)
}

/**
 * Score platform fit
 */
function scorePlatformFit(variantType: EditorialVariantType, platform: Platform): number {
  const platformPreferences: Record<Platform, Record<EditorialVariantType, number>> = {
    x: {
      safe_factual: 60,
      attention_optimized: 85,
      high_authority_institutional: 65
    },
    linkedin: {
      safe_factual: 75,
      attention_optimized: 70,
      high_authority_institutional: 95
    },
    telegram: {
      safe_factual: 80,
      attention_optimized: 75,
      high_authority_institutional: 70
    },
    facebook: {
      safe_factual: 70,
      attention_optimized: 80,
      high_authority_institutional: 65
    },
    discord: {
      safe_factual: 75,
      attention_optimized: 80,
      high_authority_institutional: 70
    },
    instagram: {
      safe_factual: 65,
      attention_optimized: 85,
      high_authority_institutional: 60
    },
    tiktok: {
      safe_factual: 55,
      attention_optimized: 90,
      high_authority_institutional: 50
    }
  }
  
  return platformPreferences[platform][variantType]
}

/**
 * Score locale fit
 */
function scoreLocaleFit(variantType: EditorialVariantType, locale: Language): number {
  const localePreferences: Record<Language, Record<EditorialVariantType, number>> = {
    en: {
      safe_factual: 70,
      attention_optimized: 80,
      high_authority_institutional: 85
    },
    tr: {
      safe_factual: 85,
      attention_optimized: 70,
      high_authority_institutional: 80
    },
    de: {
      safe_factual: 90,
      attention_optimized: 65,
      high_authority_institutional: 85
    },
    fr: {
      safe_factual: 80,
      attention_optimized: 70,
      high_authority_institutional: 85
    },
    es: {
      safe_factual: 75,
      attention_optimized: 80,
      high_authority_institutional: 75
    },
    ru: {
      safe_factual: 80,
      attention_optimized: 75,
      high_authority_institutional: 80
    },
    ar: {
      safe_factual: 85,
      attention_optimized: 70,
      high_authority_institutional: 85
    },
    jp: {
      safe_factual: 90,
      attention_optimized: 65,
      high_authority_institutional: 85
    },
    zh: {
      safe_factual: 85,
      attention_optimized: 70,
      high_authority_institutional: 85
    }
  }
  
  return localePreferences[locale][variantType]
}

/**
 * Score trust and compliance
 */
function scoreTrustCompliance(variantType: EditorialVariantType, headline: string, summary: string): number {
  let score = 70 // Base score
  
  if (variantType === 'safe_factual') {
    score = 95 // Highest trust
  } else if (variantType === 'high_authority_institutional') {
    score = 90 // Very high trust
  } else {
    score = 75 // Good trust
  }
  
  // Deduct for risky patterns
  const content = headline + ' ' + summary
  if (/guaranteed|can't lose|must buy/i.test(content)) {
    score -= 30
  }
  if (/shocking|unbelievable/i.test(content)) {
    score -= 15
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Score brand safety
 */
function scoreBrandSafety(variantType: EditorialVariantType, headline: string, summary: string, hook: string): number {
  let score = 70 // Base score
  
  if (variantType === 'safe_factual') {
    score = 95 // Highest safety
  } else if (variantType === 'high_authority_institutional') {
    score = 90 // Very high safety
  } else {
    score = 80 // Good safety
  }
  
  // Check for safety issues
  const content = (headline + ' ' + summary + ' ' + hook).toLowerCase()
  
  if (content.includes('shocking') || content.includes('unbelievable')) {
    score -= 15
  }
  if (content.includes('must') || content.includes('guaranteed')) {
    score -= 20
  }
  if ((content.match(/!/g) || []).length > 1) {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Score confidence
 */
function scoreConfidence(variantType: EditorialVariantType, context: VariantGenerationContext): number {
  let score = 75 // Base score
  
  // Variant-specific confidence
  if (variantType === 'safe_factual') {
    score = 90 // High confidence in safety
  } else if (variantType === 'high_authority_institutional') {
    score = 85 // High confidence in quality
  } else {
    score = 80 // Good confidence
  }
  
  // Adjust based on context
  if (context.hasMarketData) score += 5
  if (context.hasPolicyContent) score += 5
  
  return Math.min(100, score)
}

/**
 * Calculate engagement potential
 */
function calculateEngagementPotential(
  variantType: EditorialVariantType,
  platformFitScore: number,
  trendRelevanceScore: number
): number {
  let base = 60
  
  if (variantType === 'attention_optimized') {
    base = 85
  } else if (variantType === 'safe_factual') {
    base = 60
  } else {
    base = 70
  }
  
  // Weight platform fit and trend relevance
  return Math.round((base * 0.5) + (platformFitScore * 0.3) + (trendRelevanceScore * 0.2))
}

/**
 * Calculate editorial quality
 */
function calculateEditorialQuality(
  variantType: EditorialVariantType,
  trustComplianceScore: number,
  brandSafetyScore: number
): number {
  let base = 70
  
  if (variantType === 'high_authority_institutional') {
    base = 90
  } else if (variantType === 'safe_factual') {
    base = 85
  } else {
    base = 75
  }
  
  // Weight trust and safety
  return Math.round((base * 0.4) + (trustComplianceScore * 0.3) + (brandSafetyScore * 0.3))
}

/**
 * Calculate overall score
 */
function calculateOverallScore(scores: {
  trendRelevanceScore: number
  platformFitScore: number
  localeFitScore: number
  trustComplianceScore: number
  brandSafetyScore: number
  confidenceScore: number
}): number {
  // Weighted average - trust and safety weighted higher
  return Math.round(
    scores.trendRelevanceScore * 0.10 +
    scores.platformFitScore * 0.15 +
    scores.localeFitScore * 0.15 +
    scores.trustComplianceScore * 0.25 +
    scores.brandSafetyScore * 0.25 +
    scores.confidenceScore * 0.10
  )
}

// ============================================================================
// VARIANT COMPARISON
// ============================================================================

/**
 * Compare variants and identify best options
 */
function compareVariants(variants: EditorialVariant[]): VariantComparison {
  // Find highest scores
  const sortedByOverall = [...variants].sort((a, b) => b.overallScore - a.overallScore)
  const sortedByEngagement = [...variants].sort((a, b) => b.engagementPotential - a.engagementPotential)
  const sortedByQuality = [...variants].sort((a, b) => b.editorialQuality - a.editorialQuality)
  const sortedBySafety = [...variants].sort((a, b) => b.brandSafetyScore - a.brandSafetyScore)
  
  // Calculate ranges
  const overallScores = variants.map(v => v.overallScore)
  const engagementScores = variants.map(v => v.engagementPotential)
  const qualityScores = variants.map(v => v.editorialQuality)
  const safetyScores = variants.map(v => v.brandSafetyScore)
  
  return {
    highestOverallScore: sortedByOverall[0].variantType,
    highestEngagement: sortedByEngagement[0].variantType,
    highestQuality: sortedByQuality[0].variantType,
    safestOption: sortedBySafety[0].variantType,
    scoreRanges: {
      overall: {
        min: Math.min(...overallScores),
        max: Math.max(...overallScores),
        avg: Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
      },
      engagement: {
        min: Math.min(...engagementScores),
        max: Math.max(...engagementScores),
        avg: Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
      },
      quality: {
        min: Math.min(...qualityScores),
        max: Math.max(...qualityScores),
        avg: Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      },
      safety: {
        min: Math.min(...safetyScores),
        max: Math.max(...safetyScores),
        avg: Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length)
      }
    }
  }
}
