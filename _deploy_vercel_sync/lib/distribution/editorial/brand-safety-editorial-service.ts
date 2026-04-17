/**
 * Brand Safety Editorial Service
 * Phase 3A.7 Step 2: Editorial quality and brand safety validation
 * 
 * Detects and prevents:
 * - Excessive sensationalism
 * - Manipulative tone
 * - Forced trend injection
 * - Credibility loss
 * - Risky financial phrasing
 * 
 * Ensures content maintains editorial integrity and brand safety.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Brand safety check context
 */
export interface BrandSafetyContext {
  // Content
  headline: string
  hook: string
  body: string
  
  // Metadata
  locale: Language
  platform: Platform
  category: TrendCategory
  
  // Optional
  trendTerms?: string[]
  hasDisclaimer?: boolean
}

/**
 * Brand safety result
 */
export interface BrandSafetyResult {
  // Overall safety
  safetyScore: number // 0-100 (higher is safer)
  isSafe: boolean // true if passes minimum threshold
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  
  // Issue detection
  issues: BrandSafetyIssue[]
  warnings: string[]
  
  // Recommendations
  recommendations: string[]
  suggestedCorrections: Array<{
    issue: string
    original: string
    suggested: string
  }>
  
  // Detailed scores
  sensationalismScore: number // 0-100 (lower is better)
  manipulationScore: number // 0-100 (lower is better)
  credibilityScore: number // 0-100 (higher is better)
  complianceScore: number // 0-100 (higher is better)
  
  // Reasoning
  reasoning: string[]
  
  // Metadata
  evaluatedAt: Date
  context: BrandSafetyContext
}

/**
 * Brand safety issue
 */
export interface BrandSafetyIssue {
  type: BrandSafetyIssueType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: 'headline' | 'hook' | 'body' | 'overall'
  evidence: string
}

/**
 * Brand safety issue types
 */
export type BrandSafetyIssueType =
  | 'excessive_sensationalism'
  | 'manipulative_tone'
  | 'forced_trends'
  | 'credibility_loss'
  | 'risky_financial_advice'
  | 'misleading_claims'
  | 'clickbait'
  | 'unsubstantiated_claims'
  | 'regulatory_risk'
  | 'tone_mismatch'

// ============================================================================
// MAIN SAFETY CHECK
// ============================================================================

/**
 * Perform comprehensive brand safety check
 */
export function checkBrandSafety(
  context: BrandSafetyContext
): BrandSafetyResult {
  console.log('[BRAND_SAFETY] Checking safety for', context.platform, context.category)
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`
  
  // Detect issues
  const issues: BrandSafetyIssue[] = []
  
  // Check sensationalism
  const sensationalismIssues = detectSensationalism(context)
  issues.push(...sensationalismIssues)
  
  // Check manipulation
  const manipulationIssues = detectManipulation(context)
  issues.push(...manipulationIssues)
  
  // Check credibility
  const credibilityIssues = detectCredibilityLoss(context)
  issues.push(...credibilityIssues)
  
  // Check financial advice risks
  const financialIssues = detectFinancialRisks(context)
  issues.push(...financialIssues)
  
  // Check forced trends
  const trendIssues = detectForcedTrends(context)
  issues.push(...trendIssues)
  
  // Check regulatory compliance
  const complianceIssues = detectComplianceRisks(context)
  issues.push(...complianceIssues)
  
  // Calculate detailed scores
  const sensationalismScore = calculateSensationalismScore(context, sensationalismIssues)
  const manipulationScore = calculateManipulationScore(context, manipulationIssues)
  const credibilityScore = calculateCredibilityScore(context, credibilityIssues)
  const complianceScore = calculateComplianceScore(context, complianceIssues)
  
  // Calculate overall safety score
  const safetyScore = calculateOverallSafetyScore(
    sensationalismScore,
    manipulationScore,
    credibilityScore,
    complianceScore
  )
  
  // Determine risk level
  const riskLevel = determineRiskLevel(safetyScore, issues)
  
  // Check if safe (threshold: 60)
  const isSafe = safetyScore >= 60 && riskLevel !== 'critical'
  
  // Generate warnings
  const warnings = generateWarnings(issues, safetyScore)
  
  // Generate recommendations
  const recommendations = generateRecommendations(issues, context)
  
  // Generate suggested corrections
  const suggestedCorrections = generateCorrections(issues, context)
  
  // Generate reasoning
  const reasoning = generateReasoning(safetyScore, issues, context)
  
  return {
    safetyScore,
    isSafe,
    riskLevel,
    issues,
    warnings,
    recommendations,
    suggestedCorrections,
    sensationalismScore,
    manipulationScore,
    credibilityScore,
    complianceScore,
    reasoning,
    evaluatedAt: new Date(),
    context
  }
}

// ============================================================================
// ISSUE DETECTION
// ============================================================================

/**
 * Detect excessive sensationalism
 */
function detectSensationalism(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  const sensationalWords = [
    'shocking', 'unbelievable', 'incredible', 'mind-blowing',
    'jaw-dropping', 'stunning', 'explosive', 'devastating',
    'catastrophic', 'revolutionary', 'game-changing', 'unprecedented'
  ]
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`.toLowerCase()
  
  // Check headline
  sensationalWords.forEach(word => {
    if (context.headline.toLowerCase().includes(word)) {
      issues.push({
        type: 'excessive_sensationalism',
        severity: 'high',
        description: `Sensational word "${word}" in headline`,
        location: 'headline',
        evidence: context.headline
      })
    }
  })
  
  // Check for excessive exclamation marks
  const exclamationCount = (context.headline.match(/!/g) || []).length
  if (exclamationCount > 1) {
    issues.push({
      type: 'excessive_sensationalism',
      severity: 'medium',
      description: 'Excessive exclamation marks',
      location: 'headline',
      evidence: context.headline
    })
  }
  
  // Check for all caps words
  const capsWords = context.headline.match(/\b[A-Z]{4,}\b/g)
  if (capsWords && capsWords.length > 0) {
    issues.push({
      type: 'excessive_sensationalism',
      severity: 'medium',
      description: 'All-caps words detected',
      location: 'headline',
      evidence: capsWords.join(', ')
    })
  }
  
  return issues
}

/**
 * Detect manipulative tone
 */
function detectManipulation(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  const manipulativePatterns = [
    { pattern: /you (must|need to|have to|should) act now/i, desc: 'Urgency manipulation' },
    { pattern: /don't miss (out|this)/i, desc: 'FOMO manipulation' },
    { pattern: /limited time/i, desc: 'Artificial scarcity' },
    { pattern: /everyone is/i, desc: 'Bandwagon manipulation' },
    { pattern: /secret (that|to)/i, desc: 'False exclusivity' },
    { pattern: /they don't want you to know/i, desc: 'Conspiracy framing' },
    { pattern: /guaranteed (profit|return|gains)/i, desc: 'False guarantees' }
  ]
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`
  
  manipulativePatterns.forEach(({ pattern, desc }) => {
    if (pattern.test(allContent)) {
      const location = pattern.test(context.headline) ? 'headline' :
                       pattern.test(context.hook) ? 'hook' : 'body'
      
      issues.push({
        type: 'manipulative_tone',
        severity: 'high',
        description: desc,
        location,
        evidence: allContent.match(pattern)?.[0] || ''
      })
    }
  })
  
  return issues
}

/**
 * Detect credibility loss
 */
function detectCredibilityLoss(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`
  
  // Check for unsubstantiated claims
  const unsubstantiatedPatterns = [
    /experts say/i,
    /sources claim/i,
    /reports suggest/i,
    /rumor has it/i,
    /word on the street/i
  ]
  
  unsubstantiatedPatterns.forEach(pattern => {
    if (pattern.test(allContent)) {
      issues.push({
        type: 'unsubstantiated_claims',
        severity: 'medium',
        description: 'Vague attribution without specific sources',
        location: 'body',
        evidence: allContent.match(pattern)?.[0] || ''
      })
    }
  })
  
  // Check for absolute claims without evidence
  const absolutePatterns = [
    /will definitely/i,
    /absolutely will/i,
    /certainly going to/i,
    /without a doubt/i
  ]
  
  absolutePatterns.forEach(pattern => {
    if (pattern.test(allContent)) {
      issues.push({
        type: 'credibility_loss',
        severity: 'high',
        description: 'Absolute claims without supporting evidence',
        location: 'body',
        evidence: allContent.match(pattern)?.[0] || ''
      })
    }
  })
  
  return issues
}

/**
 * Detect risky financial advice
 */
function detectFinancialRisks(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  // Only check for finance-related categories
  if (!['crypto', 'finance', 'markets', 'economy'].includes(context.category)) {
    return issues
  }
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`
  
  const riskyPatterns = [
    { pattern: /you should (buy|sell|invest)/i, desc: 'Direct investment advice', severity: 'critical' as const },
    { pattern: /guaranteed (profit|return|gains)/i, desc: 'Guaranteed returns claim', severity: 'critical' as const },
    { pattern: /can't lose/i, desc: 'No-risk claim', severity: 'critical' as const },
    { pattern: /get rich/i, desc: 'Get-rich-quick framing', severity: 'high' as const },
    { pattern: /easy money/i, desc: 'Easy money claim', severity: 'high' as const },
    { pattern: /insider (tip|information)/i, desc: 'Insider trading implication', severity: 'critical' as const }
  ]
  
  riskyPatterns.forEach(({ pattern, desc, severity }) => {
    if (pattern.test(allContent)) {
      issues.push({
        type: 'risky_financial_advice',
        severity,
        description: desc,
        location: 'body',
        evidence: allContent.match(pattern)?.[0] || ''
      })
    }
  })
  
  // Check for missing disclaimer
  if (!context.hasDisclaimer && context.category === 'crypto') {
    const hasInvestmentLanguage = /invest|trading|buy|sell|portfolio/i.test(allContent)
    if (hasInvestmentLanguage) {
      issues.push({
        type: 'regulatory_risk',
        severity: 'high',
        description: 'Investment-related content without disclaimer',
        location: 'overall',
        evidence: 'Missing risk disclaimer'
      })
    }
  }
  
  return issues
}

/**
 * Detect forced trend injection
 */
function detectForcedTrends(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  if (!context.trendTerms || context.trendTerms.length === 0) {
    return issues
  }
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`.toLowerCase()
  
  // Check if trend terms appear naturally or seem forced
  context.trendTerms.forEach(term => {
    const termLower = term.toLowerCase()
    
    // Check if term appears in content
    if (!allContent.includes(termLower)) {
      // Term not in content - likely forced in hashtags
      issues.push({
        type: 'forced_trends',
        severity: 'medium',
        description: `Trend term "${term}" not present in content`,
        location: 'overall',
        evidence: term
      })
    }
  })
  
  // Check for excessive hashtag stuffing
  if (context.trendTerms.length > 5) {
    issues.push({
      type: 'forced_trends',
      severity: 'medium',
      description: 'Excessive trend terms (>5)',
      location: 'overall',
      evidence: `${context.trendTerms.length} trend terms`
    })
  }
  
  return issues
}

/**
 * Detect regulatory compliance risks
 */
function detectComplianceRisks(context: BrandSafetyContext): BrandSafetyIssue[] {
  const issues: BrandSafetyIssue[] = []
  
  const allContent = `${context.headline} ${context.hook} ${context.body}`
  
  // Check for medical/health claims (if applicable)
  const healthClaims = /cure|treat|prevent|diagnose/i
  if (healthClaims.test(allContent)) {
    issues.push({
      type: 'regulatory_risk',
      severity: 'high',
      description: 'Medical/health claims detected',
      location: 'body',
      evidence: allContent.match(healthClaims)?.[0] || ''
    })
  }
  
  // Check for misleading price predictions
  if (context.category === 'crypto' || context.category === 'finance') {
    const pricePredictions = /will (reach|hit|go to) \$[\d,]+/i
    if (pricePredictions.test(allContent)) {
      issues.push({
        type: 'misleading_claims',
        severity: 'high',
        description: 'Specific price prediction without qualification',
        location: 'body',
        evidence: allContent.match(pricePredictions)?.[0] || ''
      })
    }
  }
  
  return issues
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Calculate sensationalism score (0-100, lower is better)
 */
function calculateSensationalismScore(
  context: BrandSafetyContext,
  issues: BrandSafetyIssue[]
): number {
  let score = 0
  
  issues.forEach(issue => {
    if (issue.severity === 'critical') score += 40
    else if (issue.severity === 'high') score += 25
    else if (issue.severity === 'medium') score += 15
    else score += 5
  })
  
  return Math.min(100, score)
}

/**
 * Calculate manipulation score (0-100, lower is better)
 */
function calculateManipulationScore(
  context: BrandSafetyContext,
  issues: BrandSafetyIssue[]
): number {
  let score = 0
  
  issues.forEach(issue => {
    if (issue.severity === 'critical') score += 40
    else if (issue.severity === 'high') score += 30
    else if (issue.severity === 'medium') score += 15
    else score += 5
  })
  
  return Math.min(100, score)
}

/**
 * Calculate credibility score (0-100, higher is better)
 */
function calculateCredibilityScore(
  context: BrandSafetyContext,
  issues: BrandSafetyIssue[]
): number {
  let score = 100
  
  issues.forEach(issue => {
    if (issue.severity === 'critical') score -= 40
    else if (issue.severity === 'high') score -= 25
    else if (issue.severity === 'medium') score -= 15
    else score -= 5
  })
  
  return Math.max(0, score)
}

/**
 * Calculate compliance score (0-100, higher is better)
 */
function calculateComplianceScore(
  context: BrandSafetyContext,
  issues: BrandSafetyIssue[]
): number {
  let score = 100
  
  issues.forEach(issue => {
    if (issue.severity === 'critical') score -= 50
    else if (issue.severity === 'high') score -= 30
    else if (issue.severity === 'medium') score -= 15
    else score -= 5
  })
  
  return Math.max(0, score)
}

/**
 * Calculate overall safety score
 */
function calculateOverallSafetyScore(
  sensationalismScore: number,
  manipulationScore: number,
  credibilityScore: number,
  complianceScore: number
): number {
  // Invert sensationalism and manipulation (lower is better)
  const invertedSensationalism = 100 - sensationalismScore
  const invertedManipulation = 100 - manipulationScore
  
  // Weighted average
  const score = (
    invertedSensationalism * 0.25 +
    invertedManipulation * 0.25 +
    credibilityScore * 0.25 +
    complianceScore * 0.25
  )
  
  return Math.round(score)
}

/**
 * Determine risk level
 */
function determineRiskLevel(
  safetyScore: number,
  issues: BrandSafetyIssue[]
): 'low' | 'medium' | 'high' | 'critical' {
  // Check for critical issues
  const hasCriticalIssue = issues.some(issue => issue.severity === 'critical')
  if (hasCriticalIssue) return 'critical'
  
  // Score-based determination
  if (safetyScore >= 80) return 'low'
  if (safetyScore >= 60) return 'medium'
  if (safetyScore >= 40) return 'high'
  return 'critical'
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Generate warnings
 */
function generateWarnings(issues: BrandSafetyIssue[], safetyScore: number): string[] {
  const warnings: string[] = []
  
  if (safetyScore < 60) {
    warnings.push('Content fails brand safety threshold - review required')
  }
  
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  if (criticalIssues.length > 0) {
    warnings.push(`${criticalIssues.length} critical issue(s) detected - do not publish`)
  }
  
  const highIssues = issues.filter(i => i.severity === 'high')
  if (highIssues.length > 0) {
    warnings.push(`${highIssues.length} high-severity issue(s) require correction`)
  }
  
  return warnings
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  issues: BrandSafetyIssue[],
  context: BrandSafetyContext
): string[] {
  const recommendations: string[] = []
  
  const issueTypes = new Set(issues.map(i => i.type))
  
  if (issueTypes.has('excessive_sensationalism')) {
    recommendations.push('Remove sensational language and use factual tone')
  }
  
  if (issueTypes.has('manipulative_tone')) {
    recommendations.push('Eliminate manipulative patterns and urgency tactics')
  }
  
  if (issueTypes.has('risky_financial_advice')) {
    recommendations.push('Remove direct investment advice and add proper disclaimers')
  }
  
  if (issueTypes.has('forced_trends')) {
    recommendations.push('Only use trend terms that naturally fit the content')
  }
  
  if (issueTypes.has('unsubstantiated_claims')) {
    recommendations.push('Add specific sources and citations for claims')
  }
  
  if (issueTypes.has('regulatory_risk')) {
    recommendations.push('Add required disclaimers and qualify predictions')
  }
  
  return recommendations
}

/**
 * Generate suggested corrections
 */
function generateCorrections(
  issues: BrandSafetyIssue[],
  context: BrandSafetyContext
): Array<{ issue: string; original: string; suggested: string }> {
  const corrections: Array<{ issue: string; original: string; suggested: string }> = []
  
  issues.forEach(issue => {
    if (issue.type === 'excessive_sensationalism' && issue.evidence) {
      corrections.push({
        issue: issue.description,
        original: issue.evidence,
        suggested: 'Use neutral, factual language'
      })
    }
    
    if (issue.type === 'risky_financial_advice' && issue.evidence) {
      corrections.push({
        issue: issue.description,
        original: issue.evidence,
        suggested: 'Rephrase as analysis, not advice. Add disclaimer.'
      })
    }
  })
  
  return corrections
}

/**
 * Generate reasoning
 */
function generateReasoning(
  safetyScore: number,
  issues: BrandSafetyIssue[],
  context: BrandSafetyContext
): string[] {
  const reasoning: string[] = []
  
  reasoning.push(`Overall safety score: ${safetyScore}/100`)
  reasoning.push(`Detected ${issues.length} issue(s) across ${new Set(issues.map(i => i.type)).size} categories`)
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length
  
  if (criticalCount > 0) reasoning.push(`${criticalCount} critical issue(s)`)
  if (highCount > 0) reasoning.push(`${highCount} high-severity issue(s)`)
  if (mediumCount > 0) reasoning.push(`${mediumCount} medium-severity issue(s)`)
  
  if (safetyScore >= 80) {
    reasoning.push('Content meets high editorial standards')
  } else if (safetyScore >= 60) {
    reasoning.push('Content meets minimum safety threshold with minor issues')
  } else {
    reasoning.push('Content requires significant revision before publication')
  }
  
  return reasoning
}
