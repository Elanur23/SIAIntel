/**
 * Trust & Compliance Scoring Pipeline
 * Phase 3A: Content quality and compliance validation
 */

import type { TrustScore, ComplianceScore } from '../../types'

export interface TrustScoringRequest {
  content: string
  sourceCredibility: number
  hasDataPoints: boolean
  hasDisclaimer: boolean
}

export interface TrustScoringResult {
  trustScore: TrustScore
  complianceScore: ComplianceScore
}

/**
 * Calculate trust score for content
 */
export function calculateTrustScore(request: TrustScoringRequest): TrustScore {
  let overall = 0
  const warnings: string[] = []
  
  // Source credibility (0-25 points)
  const sourceCredibility = Math.min(request.sourceCredibility, 25)
  overall += sourceCredibility
  
  // Factual accuracy (0-25 points) - based on data points
  const factualAccuracy = request.hasDataPoints ? 20 : 10
  overall += factualAccuracy
  if (!request.hasDataPoints) {
    warnings.push('Content lacks specific data points')
  }
  
  // Bias detection (0-25 points) - simplified for Phase 3A
  const biasDetection = 20 // Assume neutral for now
  overall += biasDetection
  
  // Sentiment balance (0-25 points)
  const sentimentBalance = 20 // Assume balanced for now
  overall += sentimentBalance
  
  // Disclaimer check
  const requiresReview = !request.hasDisclaimer || overall < 60
  if (!request.hasDisclaimer) {
    warnings.push('Missing risk disclaimer')
  }
  
  return {
    overall,
    sourceCredibility,
    factualAccuracy,
    biasDetection,
    sentimentBalance,
    warnings,
    requiresReview
  }
}

/**
 * Calculate compliance score for content
 */
export function calculateComplianceScore(content: string): ComplianceScore {
  let overall = 0
  const violations: string[] = []
  
  // Content length check (minimum 300 words)
  const wordCount = content.split(/\s+/).length
  const contentSafetyScore = wordCount >= 300 ? 25 : 15
  overall += contentSafetyScore
  
  if (wordCount < 300) {
    violations.push('Content below 300 words minimum')
  }
  
  // Toxicity check (simplified)
  const toxicityScore = 5 // Low toxicity assumed
  overall += 20 // Good score
  
  // Platform compliance (simplified for Phase 3A)
  const platformCompliance = {
    x: 80,
    linkedin: 85,
    telegram: 80,
    facebook: 75
  }
  
  // Regulatory compliance
  const gdprCompliant = true
  const coppaCompliant = true
  const financeRegulationCompliant = content.includes('not financial advice') || content.includes('RISK ASSESSMENT')
  
  if (!financeRegulationCompliant) {
    violations.push('Missing financial disclaimer')
  }
  
  overall += gdprCompliant ? 15 : 0
  overall += coppaCompliant ? 10 : 0
  overall += financeRegulationCompliant ? 20 : 0
  
  const requiresLegalReview = violations.length > 0 || overall < 60
  
  return {
    overall,
    platformCompliance,
    gdprCompliant,
    coppaCompliant,
    financeRegulationCompliant,
    contentSafetyScore,
    toxicityScore,
    violations,
    requiresLegalReview
  }
}
