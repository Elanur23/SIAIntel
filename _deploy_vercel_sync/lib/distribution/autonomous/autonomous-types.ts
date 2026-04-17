/**
 * Autonomous Distribution Assistant - Type Definitions
 * Phase 3D: Human-in-the-loop suggestion system
 * 
 * CRITICAL: This is NOT automation. All actions require manual approval.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type { EditorialVariantType } from '@/lib/distribution/editorial/editorial-variant-selector'

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

/**
 * Autonomous suggestion for publishing
 */
export interface AutonomousSuggestion {
  // Identification
  id: string
  timestamp: Date
  
  // Content
  articleId?: string
  articleTitle: string
  suggestedHeadline: string
  suggestedVariant: EditorialVariantType
  suggestedBody: string
  
  // Target
  suggestedPlatform: Platform
  suggestedLocale: Language
  suggestedCategory: TrendCategory
  suggestedPublishTime: Date
  
  // Scoring
  overallScore: number // 0-100
  scores: SuggestionScore
  
  // Reasoning
  reasoning: SuggestionReasoning
  
  // Status
  status: SuggestionStatus
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
}

/**
 * Detailed scoring breakdown
 */
export interface SuggestionScore {
  // Individual scores (0-100)
  trendRelevance: number
  engagementPotential: number
  timingScore: number
  platformFit: number
  safetyScore: number
  
  // Weighted components
  weights: {
    trendRelevance: number
    engagementPotential: number
    timingScore: number
    platformFit: number
    safetyScore: number
  }
  
  // Overall
  overallScore: number
}

/**
 * Human-readable reasoning
 */
export interface SuggestionReasoning {
  // Why this content?
  contentSelection: string[]
  
  // Why this headline?
  headlineChoice: string[]
  
  // Why this variant?
  variantChoice: string[]
  
  // Why this platform?
  platformChoice: string[]
  
  // Why this time?
  timingChoice: string[]
  
  // Any risks?
  risks: string[]
  
  // Confidence level
  confidence: 'high' | 'medium' | 'low'
  confidenceScore: number // 0-100
}

/**
 * Suggestion status
 */
export type SuggestionStatus =
  | 'pending'      // Waiting for review
  | 'approved'     // Approved, ready to publish
  | 'published'    // Published
  | 'rejected'     // Rejected by human
  | 'expired'      // Time window passed

/**
 * Suggested action
 */
export interface SuggestedAction {
  type: 'publish' | 'edit' | 'reject'
  suggestion: AutonomousSuggestion
  reason?: string
}

// ============================================================================
// SCORING CONTEXT
// ============================================================================

/**
 * Context for scoring a suggestion
 */
export interface ScoringContext {
  // Content
  articleTitle: string
  articleBody: string
  category: TrendCategory
  
  // Target
  platform: Platform
  locale: Language
  
  // Timing
  currentTime: Date
  suggestedTime: Date
  
  // Trends
  trendingTerms?: string[]
  
  // Historical
  recentPublishes?: {
    platform: Platform
    timestamp: Date
  }[]
}

// ============================================================================
// SUGGESTION REQUEST
// ============================================================================

/**
 * Request for suggestions
 */
export interface SuggestionRequest {
  // Filters
  platform?: Platform
  locale?: Language
  category?: TrendCategory
  
  // Limits
  limit?: number // Max suggestions to return
  minScore?: number // Minimum overall score
  
  // Time window
  timeWindow?: {
    start: Date
    end: Date
  }
}

/**
 * Suggestion response
 */
export interface SuggestionResponse {
  suggestions: AutonomousSuggestion[]
  totalScanned: number
  totalSuggested: number
  generatedAt: Date
  
  // Metadata
  metadata: {
    averageScore: number
    highestScore: number
    lowestScore: number
  }
}

// ============================================================================
// APPROVAL FLOW
// ============================================================================

/**
 * Approval request
 */
export interface ApprovalRequest {
  suggestionId: string
  approvedBy: string
  notes?: string
}

/**
 * Rejection request
 */
export interface RejectionRequest {
  suggestionId: string
  rejectedBy: string
  reason: string
}

/**
 * Approval result
 */
export interface ApprovalResult {
  success: boolean
  suggestion: AutonomousSuggestion
  readyToPublish: boolean
  validationErrors?: string[]
}
