/**
 * Trend Signal Types
 * Phase 3A.7: Trend-aware editorial intelligence
 * 
 * Defines trend signal structures and relevance scoring types
 */

import type { Language, Platform } from '@/lib/distribution/types'

// ============================================================================
// TREND SIGNAL TYPES
// ============================================================================

/**
 * Trend signal source
 */
export type TrendSource = 
  | 'google_trends'
  | 'twitter_trending'
  | 'reddit_trending'
  | 'news_aggregator'
  | 'manual'
  | 'ai_detected'

/**
 * Content category for trend context
 */
export type TrendCategory = 
  | 'crypto'
  | 'economy'
  | 'finance'
  | 'ai'
  | 'technology'
  | 'markets'
  | 'breaking'
  | 'general'

/**
 * Trend signal strength
 */
export type TrendStrength = 'weak' | 'moderate' | 'strong' | 'viral'

/**
 * Individual trend term
 */
export interface TrendTerm {
  term: string
  normalizedTerm: string // lowercase, trimmed
  volume?: number // search volume or mention count
  velocity?: number // rate of change
  source: TrendSource
  category?: TrendCategory
  timestamp: Date
}

/**
 * Trend snapshot - collection of trending terms at a point in time
 */
export interface TrendSnapshot {
  id: string
  timestamp: Date
  locale: Language
  platform?: Platform
  category?: TrendCategory
  trends: TrendTerm[]
  metadata: {
    source: TrendSource
    confidence: number // 0-100
    expiresAt?: Date
  }
}

// ============================================================================
// RELEVANCE SCORING TYPES
// ============================================================================

/**
 * Context for relevance evaluation
 */
export interface RelevanceContext {
  // Article content
  articleTitle: string
  articleBody: string
  articleSummary?: string
  
  // Context
  locale: Language
  platform?: Platform
  category?: TrendCategory
  
  // Existing content metadata
  existingHashtags?: string[]
  existingKeywords?: string[]
}

/**
 * Individual term relevance score
 */
export interface TermRelevance {
  term: string
  relevanceScore: number // 0-100
  confidence: number // 0-100
  reasoning: string
  semanticMatch: 'exact' | 'related' | 'contextual' | 'weak' | 'none'
  accepted: boolean
}

/**
 * Trend relevance evaluation result
 */
export interface TrendRelevanceResult {
  // Overall scores
  overallRelevance: number // 0-100
  overallConfidence: number // 0-100
  
  // Term analysis
  acceptedTerms: TermRelevance[]
  rejectedTerms: TermRelevance[]
  
  // Recommendations
  recommendedTrendTerms: string[] // Terms safe to use
  reasoning: string[] // Human-readable explanations
  
  // Quality gates
  passesQualityGate: boolean
  qualityWarnings: string[]
  
  // Metadata
  evaluatedAt: Date
  context: RelevanceContext
}

/**
 * Relevance scoring configuration
 */
export interface RelevanceConfig {
  // Thresholds
  minRelevanceScore: number // Minimum score to accept (default: 60)
  minConfidence: number // Minimum confidence to accept (default: 70)
  
  // Quality gates
  maxAcceptedTerms: number // Maximum terms to accept (default: 5)
  rejectWeakMatches: boolean // Reject weak semantic matches (default: true)
  
  // Context weights
  titleWeight: number // Weight for title matches (default: 2.0)
  bodyWeight: number // Weight for body matches (default: 1.0)
  summaryWeight: number // Weight for summary matches (default: 1.5)
  
  // Safety
  preventKeywordStuffing: boolean // Prevent excessive trend injection (default: true)
  maintainEditorialQuality: boolean // Maintain trust/compliance (default: true)
}

/**
 * Default relevance configuration
 */
export const DEFAULT_RELEVANCE_CONFIG: RelevanceConfig = {
  minRelevanceScore: 60,
  minConfidence: 70,
  maxAcceptedTerms: 5,
  rejectWeakMatches: true,
  titleWeight: 2.0,
  bodyWeight: 1.0,
  summaryWeight: 1.5,
  preventKeywordStuffing: true,
  maintainEditorialQuality: true
}

// ============================================================================
// SEMANTIC MATCHING TYPES
// ============================================================================

/**
 * Semantic similarity result
 */
export interface SemanticSimilarity {
  term1: string
  term2: string
  similarity: number // 0-1
  matchType: 'exact' | 'related' | 'contextual' | 'weak' | 'none'
}

/**
 * Content analysis result
 */
export interface ContentAnalysis {
  // Extracted entities
  entities: string[]
  keywords: string[]
  topics: string[]
  
  // Semantic fingerprint
  semanticFingerprint: string[]
  
  // Category detection
  detectedCategory?: TrendCategory
  categoryConfidence: number
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Trend validation result
 */
export interface TrendValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Quality assessment
 */
export interface QualityAssessment {
  // Editorial quality
  maintainsEditorialIntegrity: boolean
  avoidKeywordStuffing: boolean
  preservesTrustScore: boolean
  
  // Compliance
  noMisleadingContent: boolean
  appropriateForCategory: boolean
  
  // Warnings
  warnings: string[]
  recommendations: string[]
}
