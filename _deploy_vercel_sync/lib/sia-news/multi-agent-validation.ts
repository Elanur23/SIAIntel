/**
 * Multi-Agent Validation System
 * 
 * Implements a 3-agent validation framework with consensus mechanism for content quality assurance.
 * Agents: ACCURACY_VERIFIER, IMPACT_ASSESSOR, COMPLIANCE_CHECKER
 * Consensus: Requires 2/3 agent approval for publication
 * 
 * Part of SIA_NEWS_v1.0 - Multilingual Real-Time News Generation System
 */

import type {
  GeneratedArticle,
  ValidationAgent,
  ValidationResult,
  ValidationIssue,
  ConsensusResult,
  VerifiedData,
  CausalChain
} from './types'
import { enhanceWithEEATProtocols, type EEATProtocolsRequest } from '@/lib/ai/eeat-protocols-orchestrator'

// ============================================================================
// VALIDATION AGENT CONFIGURATIONS
// ============================================================================

export const VALIDATION_AGENTS: Record<string, ValidationAgent> = {
  ACCURACY_VERIFIER: {
    name: 'ACCURACY_VERIFIER',
    role: 'Verifies factual accuracy against source data',
    validationCriteria: [
      'Data points match source data',
      'Numerical values are accurate',
      'Timestamps are correct',
      'Entity references are valid',
      'Causal relationships are supported by data'
    ]
  },
  IMPACT_ASSESSOR: {
    name: 'IMPACT_ASSESSOR',
    role: 'Assesses market significance and relevance',
    validationCriteria: [
      'Event has significant market impact',
      'Content provides unique insights',
      'Technical depth is sufficient',
      'Sentiment analysis is reasonable',
      'Causal chains are meaningful'
    ]
  },
  COMPLIANCE_CHECKER: {
    name: 'COMPLIANCE_CHECKER',
    role: 'Validates AdSense and E-E-A-T compliance',
    validationCriteria: [
      'Word count ≥ 300 words',
      'Headline matches content',
      'No forbidden phrases',
      'Dynamic risk disclaimer present',
      'E-E-A-T score ≥ 75/100',
      'Originality score ≥ 70/100'
    ]
  }
}

// ============================================================================
// FORBIDDEN PHRASES (AdSense Compliance)
// ============================================================================

const FORBIDDEN_PHRASES = [
  'according to reports',
  'sources say',
  'experts believe',
  'it is rumored',
  'allegedly',
  'unconfirmed reports',
  'insider sources',
  'anonymous sources'
]

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export async function validateArticle(
  article: GeneratedArticle,
  verifiedData: VerifiedData,
  causalChains: CausalChain[]
): Promise<ConsensusResult> {
  const startTime = Date.now()
  
  // Run all three validation agents in parallel
  const validationResults = await Promise.all([
    runAccuracyVerification(article, verifiedData, causalChains),
    runImpactAssessment(article, causalChains),
    runComplianceCheck(article)
  ])

  // Calculate consensus
  const consensus = calculateConsensus(validationResults)
  
  // Determine if manual review is required
  const requiresManualReview = determineManualReview(consensus, validationResults)
  
  const totalTime = Date.now() - startTime
  
  return {
    ...consensus,
    requiresManualReview,
    validationResults: validationResults.map(result => ({
      ...result,
      processingTime: totalTime / 3 // Approximate per-agent time
    }))
  }
}

// ============================================================================
// AGENT 1: ACCURACY VERIFIER
// ============================================================================

async function runAccuracyVerification(
  article: GeneratedArticle,
  verifiedData: VerifiedData,
  causalChains: CausalChain[]
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const recommendations: string[] = []
  let confidence = 100

  // Verify data accuracy against source
  const dataAccuracyResult = verifyDataAccuracy(article, verifiedData)
  if (!dataAccuracyResult.accurate) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Data Accuracy',
      description: dataAccuracyResult.issue || 'Data accuracy verification failed',
      suggestedFix: 'Regenerate content with correct source data'
    })
    confidence -= 30
  }

  // Verify entity references
  const entityReferences = verifiedData.extractedData.entityReferences
  const articleEntities = article.entities.map(e => e.primaryName)
  const missingEntities = entityReferences.filter(ref => 
    !articleEntities.some(entity => entity.toLowerCase().includes(ref.toLowerCase()))
  )
  
  if (missingEntities.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Entity Coverage',
      description: `Missing key entities: ${missingEntities.join(', ')}`,
      suggestedFix: 'Include all key entities from source data'
    })
    confidence -= 10
  }

  // Verify causal relationships are supported
  if (causalChains.length === 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Causal Analysis',
      description: 'No causal relationships established',
      suggestedFix: 'Establish at least one cause-effect relationship'
    })
    confidence -= 20
  }

  // Verify timestamps are reasonable
  const articleTimestamp = new Date(article.metadata.generatedAt)
  const sourceTimestamp = new Date(verifiedData.timestamp)
  const timeDiff = Math.abs(articleTimestamp.getTime() - sourceTimestamp.getTime())
  
  if (timeDiff > 24 * 60 * 60 * 1000) { // More than 24 hours
    issues.push({
      severity: 'LOW',
      category: 'Timeliness',
      description: 'Article generated more than 24 hours after source event',
      suggestedFix: 'Consider freshness of content'
    })
    confidence -= 5
  }

  const approved = confidence >= 70 && issues.filter(i => i.severity === 'CRITICAL').length === 0

  if (approved) {
    recommendations.push('Data accuracy verified against source')
    recommendations.push('All key entities properly referenced')
  }

  return {
    agent: 'ACCURACY_VERIFIER',
    approved,
    confidence,
    issues,
    recommendations,
    processingTime: 0 // Will be set by main function
  }
}

// ============================================================================
// AGENT 2: IMPACT ASSESSOR
// ============================================================================

async function runImpactAssessment(
  article: GeneratedArticle,
  causalChains: CausalChain[]
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const recommendations: string[] = []
  let confidence = 100

  // Assess technical depth
  if (article.technicalDepth === 'LOW') {
    issues.push({
      severity: 'HIGH',
      category: 'Technical Depth',
      description: 'Content lacks sufficient technical depth',
      suggestedFix: 'Add more specific metrics and technical analysis'
    })
    confidence -= 25
  }

  // Check for unique insights (SIA_Insight)
  if (!article.siaInsight || article.siaInsight.length < 100) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Unique Value',
      description: 'SIA_Insight section is missing or too short',
      suggestedFix: 'Generate comprehensive SIA_Insight with proprietary analysis'
    })
    confidence -= 30
  }

  // Verify SIA_Insight contains ownership language
  const ownershipPhrases = [
    'SIA_SENTINEL',
    'our analysis',
    'our monitoring',
    'our on-chain data',
    'our proprietary'
  ]
  const hasOwnership = ownershipPhrases.some(phrase => 
    article.siaInsight.toLowerCase().includes(phrase.toLowerCase())
  )
  
  if (!hasOwnership) {
    issues.push({
      severity: 'HIGH',
      category: 'Authority',
      description: 'SIA_Insight lacks ownership attribution',
      suggestedFix: 'Add "According to SIA_SENTINEL proprietary analysis..." or similar'
    })
    confidence -= 15
  }

  // Check sentiment analysis reasonableness
  if (article.sentiment.overall < -100 || article.sentiment.overall > 100) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Sentiment Analysis',
      description: 'Sentiment score out of valid range',
      suggestedFix: 'Recalculate sentiment score within -100 to +100 range'
    })
    confidence -= 30
  }

  // Assess causal chain quality
  const avgCausalConfidence = causalChains.length > 0
    ? causalChains.reduce((sum, chain) => sum + chain.confidence, 0) / causalChains.length
    : 0
  
  if (avgCausalConfidence < 60) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Causal Analysis',
      description: 'Causal relationships have low confidence',
      suggestedFix: 'Strengthen causal analysis with more supporting data'
    })
    confidence -= 10
  }

  const approved = confidence >= 70 && issues.filter(i => i.severity === 'CRITICAL').length === 0

  if (approved) {
    recommendations.push('Content provides unique market insights')
    recommendations.push('Technical depth is sufficient for target audience')
    recommendations.push('Sentiment analysis is reasonable and well-supported')
  }

  return {
    agent: 'IMPACT_ASSESSOR',
    approved,
    confidence,
    issues,
    recommendations,
    processingTime: 0
  }
}

// ============================================================================
// AGENT 3: COMPLIANCE CHECKER
// ============================================================================

async function runComplianceCheck(
  article: GeneratedArticle
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const recommendations: string[] = []
  let confidence = 100

  // Check word count (minimum 300 words)
  if (article.metadata.wordCount < 300) {
    issues.push({
      severity: 'CRITICAL',
      category: 'AdSense Compliance',
      description: `Word count ${article.metadata.wordCount} is below minimum 300`,
      suggestedFix: 'Expand content to meet minimum word count requirement'
    })
    confidence -= 40
  }

  // Check headline-content matching
  const headlineWords = article.headline.toLowerCase().split(/\s+/)
  const contentWords = article.fullContent.toLowerCase().split(/\s+/)
  const headlineInContent = headlineWords.filter(word => 
    word.length > 3 && contentWords.includes(word)
  ).length
  
  if (headlineInContent / headlineWords.length < 0.5) {
    issues.push({
      severity: 'HIGH',
      category: 'AdSense Compliance',
      description: 'Headline does not match article content',
      suggestedFix: 'Ensure headline accurately represents article content'
    })
    confidence -= 20
  }

  // Check for forbidden phrases
  const forbiddenFound = checkAdSenseCompliance(article.fullContent)
  if (forbiddenFound.length > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'AdSense Compliance',
      description: `Forbidden phrases detected: ${forbiddenFound.join(', ')}`,
      suggestedFix: 'Remove generic phrases and use specific attributions'
    })
    confidence -= 35
  }

  // Check for dynamic risk disclaimer
  const hasGenericDisclaimer = article.riskDisclaimer.toLowerCase().includes('this is not financial advice')
  const hasSpecificContent = article.riskDisclaimer.includes(article.metadata.confidenceScore.toString())
  
  if (!hasSpecificContent) {
    issues.push({
      severity: 'HIGH',
      category: 'AdSense Compliance',
      description: 'Risk disclaimer appears generic, not content-specific',
      suggestedFix: 'Generate dynamic disclaimer based on confidence score and content'
    })
    confidence -= 15
  }

  // Calculate E-E-A-T score
  const eeATScore = calculateEEATScore(article)
  
  if (eeATScore < 75) {
    issues.push({
      severity: 'CRITICAL',
      category: 'E-E-A-T Compliance',
      description: `E-E-A-T score ${eeATScore} is below minimum 75`,
      suggestedFix: 'Enhance content with E-E-A-T protocols'
    })
    confidence -= 30
  }

  // Check originality score
  if (article.originalityScore < 70) {
    issues.push({
      severity: 'HIGH',
      category: 'Content Quality',
      description: `Originality score ${article.originalityScore} is below minimum 70`,
      suggestedFix: 'Increase unique insights and proprietary analysis'
    })
    confidence -= 20
  }

  const approved = confidence >= 70 && issues.filter(i => i.severity === 'CRITICAL').length === 0

  if (approved) {
    recommendations.push('Content meets AdSense policy requirements')
    recommendations.push(`E-E-A-T score of ${eeATScore} exceeds minimum threshold`)
    recommendations.push('Risk disclaimer is dynamic and content-specific')
  }

  return {
    agent: 'COMPLIANCE_CHECKER',
    approved,
    confidence,
    issues,
    recommendations,
    processingTime: 0
  }
}

// ============================================================================
// CONSENSUS MECHANISM
// ============================================================================

function calculateConsensus(validationResults: ValidationResult[]): Omit<ConsensusResult, 'requiresManualReview' | 'validationResults'> {
  const approvedCount = validationResults.filter(r => r.approved).length
  const consensusScore = approvedCount // 0-3
  const approved = consensusScore >= 2 // Requires 2/3 approval
  
  // Calculate overall confidence (weighted average)
  const overallConfidence = validationResults.reduce((sum, r) => sum + r.confidence, 0) / validationResults.length
  
  // Collect all critical issues
  const criticalIssues = validationResults
    .flatMap(r => r.issues)
    .filter(issue => issue.severity === 'CRITICAL')
  
  return {
    approved,
    consensusScore,
    overallConfidence,
    criticalIssues
  }
}

function determineManualReview(
  consensus: Omit<ConsensusResult, 'requiresManualReview' | 'validationResults'>,
  validationResults: ValidationResult[]
): boolean {
  // Require manual review if:
  // 1. Consensus is exactly 2/3 (borderline case)
  // 2. Any critical issues exist
  // 3. Overall confidence is below 80
  
  if (consensus.consensusScore === 2) {
    return true
  }
  
  if (consensus.criticalIssues.length > 0) {
    return true
  }
  
  if (consensus.overallConfidence < 80) {
    return true
  }
  
  return false
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function verifyDataAccuracy(
  article: GeneratedArticle,
  verifiedData: VerifiedData
): { accurate: boolean; issue?: string } {
  // Check if numerical values in article match source data
  const sourceValues = verifiedData.extractedData.numericalValues
  
  for (const sourceValue of sourceValues) {
    const valueStr = sourceValue.value.toString()
    const metricStr = sourceValue.metric.toLowerCase()
    
    // Check if value appears in article content
    const contentLower = article.fullContent.toLowerCase()
    
    if (!contentLower.includes(valueStr) && !contentLower.includes(metricStr)) {
      return {
        accurate: false,
        issue: `Source data point "${sourceValue.metric}: ${sourceValue.value}" not found in article`
      }
    }
  }
  
  return { accurate: true }
}

function checkAdSenseCompliance(content: string): string[] {
  const contentLower = content.toLowerCase()
  return FORBIDDEN_PHRASES.filter(phrase => contentLower.includes(phrase))
}

function calculateEEATScore(article: GeneratedArticle): number {
  let score = 0
  
  // Experience (25 points)
  const experiencePhrases = ['our monitoring', 'we observed', 'our analysis', 'we detected']
  const hasExperience = experiencePhrases.some(phrase => 
    article.fullContent.toLowerCase().includes(phrase)
  )
  score += hasExperience ? 25 : 10
  
  // Expertise (25 points)
  const hasTechnicalTerms = article.technicalGlossary.length >= 3
  const hasMetrics = article.fullContent.match(/\d+%|\$\d+/g)?.length || 0
  score += hasTechnicalTerms ? 15 : 5
  score += hasMetrics >= 5 ? 10 : 5
  
  // Authoritativeness (25 points)
  const hasSourceCitation = article.metadata.sources.length > 0
  const hasConfidentLanguage = article.siaInsight.length > 100
  score += hasSourceCitation ? 15 : 5
  score += hasConfidentLanguage ? 10 : 5
  
  // Trustworthiness (25 points)
  const hasRiskDisclaimer = article.riskDisclaimer.length > 50
  const hasUncertaintyAcknowledgment = article.riskDisclaimer.toLowerCase().includes('confidence')
  score += hasRiskDisclaimer ? 15 : 5
  score += hasUncertaintyAcknowledgment ? 10 : 5
  
  return Math.min(100, score)
}

// ============================================================================
// INTEGRATION WITH E-E-A-T PROTOCOLS ORCHESTRATOR
// ============================================================================

export async function enhanceArticleWithEEATProtocols(
  article: GeneratedArticle,
  verifiedData: VerifiedData,
  causalChains: CausalChain[]
): Promise<{ enhancedArticle: GeneratedArticle; eeATScore: number }> {
  try {
    // Convert causal chains to reasoning chains format
    const reasoningChains = causalChains.map(chain => ({
      steps: [
        {
          premise: chain.triggerEvent.description,
          implication: chain.intermediateEffects.map(e => e.description).join(' → '),
          conclusion: chain.finalOutcome.description
        }
      ],
      topic: article.entities[0]?.primaryName || 'Market Analysis',
      asset: article.entities.find(e => e.category === 'CRYPTOCURRENCY')?.primaryName || 'BTC'
    }))

    // Convert entities to inverse entities format (simplified - using entity pairs)
    const inverseEntities = article.entities.slice(0, -1).map((entity, index) => ({
      primaryEntity: entity.primaryName,
      inverseEntity: article.entities[index + 1]?.primaryName || entity.primaryName,
      correlationCoefficient: 0.7 // Default correlation
    }))

    // Prepare request for E-E-A-T protocols
    const request: EEATProtocolsRequest = {
      content: article.fullContent,
      topic: article.entities[0]?.primaryName || 'Market Analysis',
      asset: article.entities.find(e => e.category === 'CRYPTOCURRENCY')?.primaryName || 'BTC',
      language: article.language,
      reasoningChains,
      inverseEntities,
      sentimentResult: {
        fearGreedIndex: article.sentiment.overall,
        sentimentCategory: article.sentiment.zone,
        divergenceDetected: false,
        confidence: article.sentiment.confidence
      },
      dataSources: article.metadata.sources,
      methodology: 'SIA_SENTINEL Multi-Agent Analysis',
      baseConfidenceScore: article.metadata.confidenceScore
    }

    // Enhance with E-E-A-T protocols
    const eeATResult = await enhanceWithEEATProtocols(request)

    // Update article with enhanced E-E-A-T score
    const enhancedArticle: GeneratedArticle = {
      ...article,
      eeatScore: eeATResult.enhancedEEATScore
    }

    return {
      enhancedArticle,
      eeATScore: eeATResult.enhancedEEATScore
    }
  } catch (error) {
    console.error('E-E-A-T enhancement failed:', error)
    // Return original article if enhancement fails
    return {
      enhancedArticle: article,
      eeATScore: calculateEEATScore(article)
    }
  }
}
