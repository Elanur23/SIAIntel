/**
 * Suggestion Scorer
 * Phase 3D: Scoring logic for autonomous suggestions
 * 
 * Scores suggestions based on:
 * - Trend relevance
 * - Engagement potential
 * - Timing
 * - Platform fit
 * - Safety
 */

import type { SuggestionScore, ScoringContext } from './autonomous-types'
import type { Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

const DEFAULT_WEIGHTS = {
  trendRelevance: 0.25,
  engagementPotential: 0.25,
  timingScore: 0.20,
  platformFit: 0.15,
  safetyScore: 0.15
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score a suggestion
 */
export function scoreSuggestion(context: ScoringContext): SuggestionScore {
  // Calculate individual scores
  const trendRelevance = calculateTrendRelevance(context)
  const engagementPotential = calculateEngagementPotential(context)
  const timingScore = calculateTimingScore(context)
  const platformFit = calculatePlatformFit(context)
  const safetyScore = calculateSafetyScore(context)
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    trendRelevance * DEFAULT_WEIGHTS.trendRelevance +
    engagementPotential * DEFAULT_WEIGHTS.engagementPotential +
    timingScore * DEFAULT_WEIGHTS.timingScore +
    platformFit * DEFAULT_WEIGHTS.platformFit +
    safetyScore * DEFAULT_WEIGHTS.safetyScore
  )
  
  return {
    trendRelevance,
    engagementPotential,
    timingScore,
    platformFit,
    safetyScore,
    weights: DEFAULT_WEIGHTS,
    overallScore
  }
}

// ============================================================================
// INDIVIDUAL SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate trend relevance score (0-100)
 */
function calculateTrendRelevance(context: ScoringContext): number {
  let score = 50 // Base score
  
  const { articleTitle, articleBody, trendingTerms, category } = context
  const content = `${articleTitle} ${articleBody}`.toLowerCase()
  
  // Check trending terms
  if (trendingTerms && trendingTerms.length > 0) {
    const matchCount = trendingTerms.filter(term => 
      content.includes(term.toLowerCase())
    ).length
    
    const matchRate = matchCount / trendingTerms.length
    score += matchRate * 30 // Up to +30 points
  }
  
  // Category bonus
  const highValueCategories: TrendCategory[] = ['crypto', 'ai', 'finance']
  if (highValueCategories.includes(category)) {
    score += 10
  }
  
  // Recency bonus (newer content scores higher)
  score += 10
  
  return Math.min(100, Math.round(score))
}

/**
 * Calculate engagement potential (0-100)
 */
function calculateEngagementPotential(context: ScoringContext): number {
  let score = 60 // Base score
  
  const { articleTitle, category, platform } = context
  
  // Title length (optimal: 60-100 chars)
  const titleLength = articleTitle.length
  if (titleLength >= 60 && titleLength <= 100) {
    score += 15
  } else if (titleLength >= 40 && titleLength <= 120) {
    score += 10
  }
  
  // Category engagement
  const highEngagementCategories: TrendCategory[] = ['crypto', 'breaking', 'ai']
  if (highEngagementCategories.includes(category)) {
    score += 15
  }
  
  // Platform-specific engagement
  if (platform === 'telegram') {
    score += 10 // Telegram has high engagement
  }
  
  return Math.min(100, Math.round(score))
}

/**
 * Calculate timing score (0-100)
 */
function calculateTimingScore(context: ScoringContext): number {
  const { currentTime, suggestedTime, recentPublishes, platform } = context
  
  let score = 70 // Base score
  
  // Time difference (optimal: within next 2 hours)
  const timeDiff = suggestedTime.getTime() - currentTime.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  
  if (hoursDiff >= 0 && hoursDiff <= 2) {
    score += 20 // Optimal timing
  } else if (hoursDiff > 2 && hoursDiff <= 6) {
    score += 10 // Good timing
  } else if (hoursDiff < 0) {
    score -= 30 // Past time (bad)
  }
  
  // Check recent publishes (avoid spam)
  if (recentPublishes) {
    const recentOnPlatform = recentPublishes.filter(p => 
      p.platform === platform &&
      (currentTime.getTime() - p.timestamp.getTime()) < 3600000 // Last hour
    )
    
    if (recentOnPlatform.length > 0) {
      score -= 20 // Recently published on this platform
    }
  }
  
  // Time of day bonus (peak hours)
  const hour = suggestedTime.getHours()
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
    score += 10 // Peak engagement hours
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate platform fit (0-100)
 */
function calculatePlatformFit(context: ScoringContext): number {
  const { platform, category, articleBody } = context
  
  let score = 70 // Base score
  
  // Platform-category fit
  if (platform === 'telegram') {
    // Telegram is good for all categories
    score += 15
    
    // Especially good for crypto and breaking
    if (category === 'crypto' || category === 'breaking') {
      score += 10
    }
  }
  
  // Content length fit
  const bodyLength = articleBody.length
  if (platform === 'telegram') {
    // Telegram supports longer content
    if (bodyLength >= 300 && bodyLength <= 2000) {
      score += 5
    }
  }
  
  return Math.min(100, Math.round(score))
}

/**
 * Calculate safety score (0-100)
 */
function calculateSafetyScore(context: ScoringContext): number {
  let score = 80 // Base score (assume safe)
  
  const { articleTitle, articleBody } = context
  const content = `${articleTitle} ${articleBody}`.toLowerCase()
  
  // Check for risky patterns
  const riskyPatterns = [
    /guaranteed profit/i,
    /get rich/i,
    /can't lose/i,
    /insider/i,
    /you must/i,
    /act now/i
  ]
  
  riskyPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      score -= 15
    }
  })
  
  // Check for sensational words
  const sensationalWords = ['shocking', 'unbelievable', 'explosive', 'devastating']
  sensationalWords.forEach(word => {
    if (content.includes(word)) {
      score -= 5
    }
  })
  
  // Minimum safety score
  return Math.max(40, Math.round(score))
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine confidence level from score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

/**
 * Check if suggestion meets minimum threshold
 */
export function meetsThreshold(score: SuggestionScore, minScore: number = 60): boolean {
  return score.overallScore >= minScore
}
