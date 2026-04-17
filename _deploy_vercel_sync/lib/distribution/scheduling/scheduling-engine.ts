/**
 * Scheduling Intelligence Engine
 * Phase 3A.6: Recommendation system (no execution)
 */

import type { Language, Platform, AITestResult, TrustScore, ComplianceScore } from '../types'
import { getTimezoneForLocale, getCurrentLocaleTime, formatLocaleTime } from './timezone-map'
import { getTimeWindows, isInTimeWindow, getNextTimeWindow, PLATFORM_RULES, type ContentCategory } from './time-window-rules'

export interface SchedulingRecommendation {
  recommendedTime: Date
  confidence: number // 0-100
  reasoning: string[]
  locale: Language
  platform: Platform
  category?: ContentCategory
  timezone: string
  riskAdjustment: {
    trustScoreImpact: number
    complianceScoreImpact: number
    finalAdjustment: number
  }
}

export interface SchedulingRequest {
  locale: Language
  platform: Platform
  category?: ContentCategory
  trustScore?: TrustScore
  complianceScore?: ComplianceScore
  isBreakingNews?: boolean
  currentTime?: Date
}

/**
 * Calculate scheduling recommendation
 * Phase 3A.6: Recommendation only (no execution)
 */
export function calculateSchedulingRecommendation(
  request: SchedulingRequest
): SchedulingRecommendation {
  const reasoning: string[] = []
  let confidence = 70 // Base confidence
  
  // Get timezone info
  const timezoneInfo = getTimezoneForLocale(request.locale)
  const currentTime = request.currentTime || new Date()
  const localeTime = getCurrentLocaleTime(request.locale)
  const currentHour = localeTime.getHours()
  
  reasoning.push(`Locale: ${request.locale.toUpperCase()} (${timezoneInfo.timezone})`)
  reasoning.push(`Platform: ${request.platform.toUpperCase()}`)
  
  // Get time windows for platform and category
  const windows = getTimeWindows(request.platform, request.category)
  const platformRules = PLATFORM_RULES[request.platform]
  
  if (request.category) {
    reasoning.push(`Category: ${request.category}`)
  }
  
  // Check if currently in optimal window
  const currentWindowCheck = isInTimeWindow(currentHour, windows)
  
  let recommendedTime: Date
  
  if (currentWindowCheck.inWindow && currentWindowCheck.window) {
    // Currently in optimal window
    recommendedTime = new Date(localeTime)
    confidence += currentWindowCheck.window.weight * 0.2
    reasoning.push(`✓ Current time is in optimal window: ${currentWindowCheck.window.reason}`)
    reasoning.push(`Window weight: ${currentWindowCheck.window.weight}/100`)
  } else {
    // Find next optimal window
    const nextWindow = getNextTimeWindow(currentHour, windows)
    
    if (nextWindow) {
      recommendedTime = new Date(localeTime)
      recommendedTime.setHours(nextWindow.startHour, 0, 0, 0)
      
      // If next window is earlier in day, it's tomorrow
      if (nextWindow.startHour <= currentHour) {
        recommendedTime.setDate(recommendedTime.getDate() + 1)
      }
      
      confidence += nextWindow.weight * 0.15
      reasoning.push(`→ Next optimal window: ${nextWindow.reason}`)
      reasoning.push(`Window weight: ${nextWindow.weight}/100`)
    } else {
      // Fallback to next hour
      recommendedTime = new Date(localeTime)
      recommendedTime.setHours(currentHour + 1, 0, 0, 0)
      reasoning.push(`⚠ No optimal window found, recommending next hour`)
      confidence -= 20
    }
  }
  
  // Breaking news boost
  if (request.isBreakingNews && platformRules.breakingNewsBoost) {
    confidence += 15
    reasoning.push(`⚡ Breaking news boost applied (+15 confidence)`)
    // For breaking news, recommend immediate if not in window
    if (!currentWindowCheck.inWindow) {
      recommendedTime = new Date(localeTime)
      reasoning.push(`⚡ Breaking news: immediate publish recommended`)
    }
  }
  
  // Platform frequency adjustment
  if (platformRules.frequency === 'high') {
    confidence += 5
    reasoning.push(`Platform supports high frequency posting (+5 confidence)`)
  } else if (platformRules.frequency === 'low') {
    confidence -= 5
    reasoning.push(`Platform prefers lower frequency (-5 confidence)`)
  }
  
  // Risk-aware adjustment
  const riskAdjustment = calculateRiskAdjustment(
    request.trustScore,
    request.complianceScore,
    reasoning
  )
  
  confidence += riskAdjustment.finalAdjustment
  
  // Clamp confidence to 0-100
  confidence = Math.max(0, Math.min(100, confidence))
  
  return {
    recommendedTime,
    confidence: Math.round(confidence),
    reasoning,
    locale: request.locale,
    platform: request.platform,
    category: request.category,
    timezone: timezoneInfo.timezone,
    riskAdjustment
  }
}

/**
 * Calculate risk-based adjustments
 */
function calculateRiskAdjustment(
  trustScore?: TrustScore,
  complianceScore?: ComplianceScore,
  reasoning?: string[]
): {
  trustScoreImpact: number
  complianceScoreImpact: number
  finalAdjustment: number
} {
  let trustScoreImpact = 0
  let complianceScoreImpact = 0
  
  // Trust score impact
  if (trustScore) {
    if (trustScore.overall >= 80) {
      trustScoreImpact = 10
      reasoning?.push(`✓ High trust score (${trustScore.overall}/100) increases confidence (+10)`)
    } else if (trustScore.overall < 60) {
      trustScoreImpact = -15
      reasoning?.push(`⚠ Low trust score (${trustScore.overall}/100) decreases confidence (-15)`)
    }
    
    if (trustScore.requiresReview) {
      trustScoreImpact -= 10
      reasoning?.push(`⚠ Content requires review, reducing confidence (-10)`)
    }
  }
  
  // Compliance score impact
  if (complianceScore) {
    if (complianceScore.overall >= 80) {
      complianceScoreImpact = 10
      reasoning?.push(`✓ High compliance score (${complianceScore.overall}/100) increases confidence (+10)`)
    } else if (complianceScore.overall < 60) {
      complianceScoreImpact = -20
      reasoning?.push(`❌ Low compliance score (${complianceScore.overall}/100) strongly decreases confidence (-20)`)
    }
    
    if (complianceScore.requiresLegalReview) {
      complianceScoreImpact -= 15
      reasoning?.push(`❌ Content requires legal review, strongly reducing confidence (-15)`)
    }
    
    if (complianceScore.violations.length > 0) {
      complianceScoreImpact -= 10
      reasoning?.push(`❌ Compliance violations detected (-10)`)
    }
  }
  
  const finalAdjustment = trustScoreImpact + complianceScoreImpact
  
  return {
    trustScoreImpact,
    complianceScoreImpact,
    finalAdjustment
  }
}

/**
 * Generate recommendations for multiple locale/platform combinations
 */
export function generateBulkRecommendations(
  testResult: AITestResult
): SchedulingRecommendation[] {
  const recommendations: SchedulingRecommendation[] = []
  
  // Generate recommendation for the test result's locale and platform
  const recommendation = calculateSchedulingRecommendation({
    locale: testResult.targetLocale,
    platform: testResult.targetPlatform,
    trustScore: testResult.trustScore,
    complianceScore: testResult.complianceScore,
    isBreakingNews: testResult.generationMode === 'breaking'
  })
  
  recommendations.push(recommendation)
  
  return recommendations
}

/**
 * Format recommendation for display
 */
export function formatRecommendation(rec: SchedulingRecommendation): string {
  const timeStr = formatLocaleTime(rec.recommendedTime, rec.locale)
  const confidenceStr = `${rec.confidence}%`
  
  let output = `SCHEDULING RECOMMENDATION\n`
  output += `========================\n\n`
  output += `Recommended Time: ${timeStr}\n`
  output += `Confidence: ${confidenceStr}\n`
  output += `Locale: ${rec.locale.toUpperCase()}\n`
  output += `Platform: ${rec.platform.toUpperCase()}\n`
  output += `Timezone: ${rec.timezone}\n\n`
  output += `Reasoning:\n`
  rec.reasoning.forEach((reason, idx) => {
    output += `${idx + 1}. ${reason}\n`
  })
  
  return output
}
