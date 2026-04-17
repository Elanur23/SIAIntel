// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
/**
 * SIA Production Guardian - Quality Enforcement Layer
 * Version 1.2 - Strict Ethical & E-E-A-T Compliance
 * 
 * Enforces the 5 core rules before content publication:
 * 1. Quality Over Quantity (Information Gain)
 * 2. Analytical Depth (3-Layer Analysis)
 * 3. Multilingual Integrity (Disclaimer Compliance)
 * 4. Data Proof (Evidence-Based Reporting)
 * 5. Error Logging (Quality Assurance)
 */

import type { GeneratedArticle, Language, ValidationIssue } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductionGuardianValidation {
  approved: boolean
  score: number // 0-100
  issues: ProductionGuardianIssue[]
  recommendations: string[]
  requiresManualReview: boolean
  draftStatus: boolean
}

export interface ProductionGuardianIssue {
  rule: 'KURAL_1' | 'KURAL_2' | 'KURAL_3' | 'KURAL_4' | 'KURAL_5' | 'KURAL_6'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  recommendation: string
}

export interface WordCountMetrics {
  count: number
  isCompliant: boolean
  targetRange: [number, number]
}

export interface InformationGainMetrics {
  score: number // 0-100
  uniqueInsights: number
  dataPoints: number
  marketSignificance: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AnalyticalDepthMetrics {
  causalityExplained: boolean
  regionalImpactSpecified: boolean
  uniqueInsightProvided: boolean
  dataSourcesCited: number
}

export interface DisclaimerComplianceMetrics {
  disclaimerPresent: boolean
  legallyCompliant: boolean
  regulatoryBodyAware: string
}

export interface DataProofMetrics {
  speculativeLanguageDetected: boolean
  dataSourcesCited: number
  specificMetricsProvided: number
  verifiableEvents: boolean
}

// ============================================================================
// KURAL 1: QUALITY OVER QUANTITY
// ============================================================================

/**
 * Validates Information Gain - ensures content provides unique value
 */
export function validateInformationGain(article: GeneratedArticle): InformationGainMetrics {
  let score = 0
  let uniqueInsights = 0
  let dataPoints = 0
  
  // Check for SIA_SENTINEL attribution (unique insight indicator)
  if (article.siaInsight.includes('SIA_SENTINEL')) {
    score += 30
    uniqueInsights++
  }
  
  // Count specific data points (percentages, volumes, etc.)
  const dataPointPatterns = [
    /\d+%/g, // Percentages
    /\d+\.\d+/g, // Decimals
    /\$\d+/g, // Dollar amounts
    /\d+\s*(BTC|ETH|USD)/gi // Crypto amounts
  ]
  
  dataPointPatterns.forEach(pattern => {
    const matches = article.fullContent.match(pattern)
    if (matches) {
      dataPoints += matches.length
      score += Math.min(matches.length * 5, 30)
    }
  })
  
  // Check for on-chain data references
  const onChainKeywords = ['on-chain', 'zincir üstü', 'blockchain', 'wallet', 'exchange']
  const hasOnChainData = onChainKeywords.some(keyword => 
    article.fullContent.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (hasOnChainData) {
    score += 20
    uniqueInsights++
  }
  
  // Check E-E-A-T score as quality indicator
  if (article.eeatScore >= 85) {
    score += 20
  } else if (article.eeatScore >= 75) {
    score += 10
  }
  
  // Determine market significance based on confidence and sentiment
  let marketSignificance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  
  if (article.metadata.confidenceScore >= 85 && Math.abs(article.sentiment.overall - 50) > 20) {
    marketSignificance = 'HIGH'
  } else if (article.metadata.confidenceScore >= 70) {
    marketSignificance = 'MEDIUM'
  }
  
  return {
    score: Math.min(score, 100),
    uniqueInsights,
    dataPoints,
    marketSignificance
  }
}

// ============================================================================
// KURAL 2: ANALYTICAL DEPTH
// ============================================================================

/**
 * Validates 3-Layer Analysis - ensures causality, regional impact, and unique insight
 */
export function validateAnalyticalDepth(article: GeneratedArticle): AnalyticalDepthMetrics {
  // Check causality explanation (causal chains present)
  const causalityExplained = article.causalChains.length > 0
  
  // Check regional impact specification
  const regionalKeywords = {
    tr: ['Türkiye', 'TRY', 'TCMB', 'KVKK'],
    en: ['United States', 'USD', 'FED', 'SEC'],
    de: ['Deutschland', 'EUR', 'BaFin', 'EZB'],
    fr: ['France', 'EUR', 'AMF', 'BCE'],
    es: ['España', 'EUR', 'CNMV', 'BCE'],
    ru: ['Россия', 'RUB', 'ЦБ РФ', 'CBR'],
    ar: ['الإمارات', 'AED', 'VARA', 'Dubai']
  }
  
  const regionalWords = regionalKeywords[article.language] || []
  const regionalImpactSpecified = regionalWords.some(word =>
    article.fullContent.includes(word)
  )
  
  // Check unique insight (SIA_SENTINEL attribution)
  const uniqueInsightProvided = article.siaInsight.includes('SIA_SENTINEL')
  
  // Count data sources cited
  const dataSourcesCited = article.metadata.sources.length
  
  return {
    causalityExplained,
    regionalImpactSpecified,
    uniqueInsightProvided,
    dataSourcesCited
  }
}

// ============================================================================
// KURAL 3: MULTILINGUAL INTEGRITY
// ============================================================================

/**
 * Validates disclaimer compliance for each language
 */
export function validateDisclaimerCompliance(article: GeneratedArticle): DisclaimerComplianceMetrics {
  const disclaimerKeywords = {
    tr: ['RİSK DEĞERLENDİRMESİ', 'finansal tavsiye değildir', 'KVKK'],
    en: ['RISK ASSESSMENT', 'not financial advice', 'OSINT'],
    de: ['RISIKOBEWERTUNG', 'keine Finanzberatung', 'BaFin'],
    fr: ['ÉVALUATION DES RISQUES', 'pas un conseil financier', 'AMF'],
    es: ['EVALUACIÓN DE RIESGOS', 'no es asesoramiento financiero', 'CNMV'],
    ru: ['ОЦЕНКА РИСКОВ', 'не финансовый совет', 'CBR'],
    ar: ['تقييم المخاطر', 'ليست نصيحة مالية', 'OSINT']
  }
  
  const keywords = disclaimerKeywords[article.language] || []
  const disclaimerPresent = keywords.some(keyword =>
    article.riskDisclaimer.includes(keyword)
  )
  
  // Check if disclaimer is context-specific (not generic)
  const hasConfidenceScore = article.riskDisclaimer.includes(article.metadata.confidenceScore.toString())
  const legallyCompliant = disclaimerPresent && hasConfidenceScore
  
  // Identify regulatory body awareness
  const regulatoryBodies = {
    tr: 'KVKK',
    en: 'SEC/FINRA',
    de: 'BaFin',
    fr: 'AMF',
    es: 'CNMV',
    ru: 'CBR',
    ar: 'VARA'
  }
  
  const regulatoryBodyAware = regulatoryBodies[article.language] || 'Unknown'
  
  return {
    disclaimerPresent,
    legallyCompliant,
    regulatoryBodyAware
  }
}

// ============================================================================
// KURAL 4: DATA PROOF
// ============================================================================

/**
 * Validates evidence-based reporting - no speculation, only data
 */
export function validateDataProof(article: GeneratedArticle): DataProofMetrics {
  // Forbidden speculative phrases
  const speculativePhrases = [
    'ay\'a gidiyor', 'to the moon', 'kesin çökecek', 'will definitely crash',
    'herkes alıyor', 'everyone is buying', 'kaçırma', 'don\'t miss out',
    'garantili kazanç', 'guaranteed profit', 'risk yok', 'no risk',
    'uzmanlar söylüyor', 'experts say'
  ]
  
  const contentLower = article.fullContent.toLowerCase()
  const speculativeLanguageDetected = speculativePhrases.some(phrase =>
    contentLower.includes(phrase.toLowerCase())
  )
  
  // Count data sources
  const dataSourcesCited = article.metadata.sources.length
  
  // Count specific metrics (percentages, volumes, prices)
  const metricPatterns = [
    /\d+%/g,
    /\d+\.\d+\s*(BTC|ETH|USD|TRY|EUR)/gi,
    /\$\d+[KMB]?/g
  ]
  
  let specificMetricsProvided = 0
  metricPatterns.forEach(pattern => {
    const matches = article.fullContent.match(pattern)
    if (matches) {
      specificMetricsProvided += matches.length
    }
  })
  
  // Check for verifiable events (dates, institutions, specific events)
  const hasVerifiableEvents = /\d{4}/.test(article.fullContent) || // Year
                              /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(article.fullContent) || // Date
                              /(FED|ECB|TCMB|SEC|BaFin|AMF|CNMV|VARA|Binance|Coinbase)/i.test(article.fullContent) // Institutions
  
  return {
    speculativeLanguageDetected,
    dataSourcesCited,
    specificMetricsProvided,
    verifiableEvents: hasVerifiableEvents
  }
}

// ============================================================================
// KURAL 5: ERROR LOGGING
// ============================================================================

/**
 * Determines if article should be marked as DRAFT
 */
export function shouldMarkAsDraft(
  article: GeneratedArticle,
  informationGain: InformationGainMetrics,
  analyticalDepth: AnalyticalDepthMetrics,
  disclaimerCompliance: DisclaimerComplianceMetrics,
  dataProof: DataProofMetrics
): boolean {
  // Draft triggers
  const triggers = [
    informationGain.score < 70,
    informationGain.marketSignificance === 'LOW',
    !analyticalDepth.causalityExplained,
    !analyticalDepth.uniqueInsightProvided,
    analyticalDepth.dataSourcesCited < 2,
    !disclaimerCompliance.disclaimerPresent,
    !disclaimerCompliance.legallyCompliant,
    dataProof.speculativeLanguageDetected,
    dataProof.dataSourcesCited < 2,
    dataProof.specificMetricsProvided < 3,
    article.eeatScore < 75,
    article.originalityScore < 70
  ]
  
  return triggers.some(trigger => trigger === true)
}

// ============================================================================
// KURAL 6: DEPTH & WORD COUNT ENFORCEMENT
// ============================================================================

/**
 * Validates Word Count per Language Node - enforces SIA Master Protocol 850-950 words
 */
export function validateWordCount(content: string, language: Language): WordCountMetrics {
  const targetRange: [number, number] = [850, 950]

  // Word count algorithm - CJK aware
  const countWords = (text: string): number => {
    if (!text) return 0
    // CJK characters match
    const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
    if (cjk > 30) return Math.round(cjk / 2) // Approximate for CJK
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const count = countWords(content)
  const isCompliant = count >= targetRange[0] && count <= targetRange[1]

  return {
    count,
    isCompliant,
    targetRange
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Comprehensive Production Guardian validation
 */
export async function validateProductionGuardian(
  article: GeneratedArticle
): Promise<ProductionGuardianValidation> {
  const issues: ProductionGuardianIssue[] = []
  const recommendations: string[] = []
  
  // KURAL 1: Information Gain
  const informationGain = validateInformationGain(article)
  
  if (informationGain.score < 70) {
    issues.push({
      rule: 'KURAL_1',
      severity: 'HIGH',
      description: `Information Gain score too low: ${informationGain.score}/100`,
      recommendation: 'Add more unique insights, on-chain data, and specific metrics'
    })
  }
  
  if (informationGain.marketSignificance === 'LOW') {
    issues.push({
      rule: 'KURAL_1',
      severity: 'CRITICAL',
      description: 'Market significance is LOW - insufficient reason to publish',
      recommendation: 'Only publish when market conditions warrant significant analysis'
    })
  }
  
  // KURAL 2: Analytical Depth
  const analyticalDepth = validateAnalyticalDepth(article)
  
  if (!analyticalDepth.causalityExplained) {
    issues.push({
      rule: 'KURAL_2',
      severity: 'HIGH',
      description: 'Causality not explained - missing "why" analysis',
      recommendation: 'Add causal chain analysis explaining root causes'
    })
  }
  
  if (!analyticalDepth.regionalImpactSpecified) {
    issues.push({
      rule: 'KURAL_2',
      severity: 'MEDIUM',
      description: 'Regional impact not specified',
      recommendation: 'Add region-specific economic/regulatory implications'
    })
  }
  
  if (!analyticalDepth.uniqueInsightProvided) {
    issues.push({
      rule: 'KURAL_2',
      severity: 'CRITICAL',
      description: 'No unique SIA_SENTINEL insight provided',
      recommendation: 'Add proprietary analysis that competitors don\'t have'
    })
  }
  
  if (analyticalDepth.dataSourcesCited < 2) {
    issues.push({
      rule: 'KURAL_2',
      severity: 'HIGH',
      description: `Insufficient data sources: ${analyticalDepth.dataSourcesCited} (minimum 2)`,
      recommendation: 'Cite at least 2 verifiable data sources'
    })
  }
  
  // KURAL 3: Disclaimer Compliance
  const disclaimerCompliance = validateDisclaimerCompliance(article)
  
  if (!disclaimerCompliance.disclaimerPresent) {
    issues.push({
      rule: 'KURAL_3',
      severity: 'CRITICAL',
      description: `Missing disclaimer in ${article.language} version`,
      recommendation: `Add ${disclaimerCompliance.regulatoryBodyAware}-compliant disclaimer`
    })
  }
  
  if (!disclaimerCompliance.legallyCompliant) {
    issues.push({
      rule: 'KURAL_3',
      severity: 'HIGH',
      description: 'Disclaimer is generic, not context-specific',
      recommendation: 'Include confidence score and specific risk factors in disclaimer'
    })
  }
  
  // KURAL 4: Data Proof
  const dataProof = validateDataProof(article)
  
  if (dataProof.speculativeLanguageDetected) {
    issues.push({
      rule: 'KURAL_4',
      severity: 'CRITICAL',
      description: 'Speculative language detected (hype, guarantees, etc.)',
      recommendation: 'Remove all speculative phrases and replace with data-driven statements'
    })
  }
  
  if (dataProof.dataSourcesCited < 2) {
    issues.push({
      rule: 'KURAL_4',
      severity: 'HIGH',
      description: `Insufficient data sources: ${dataProof.dataSourcesCited} (minimum 2)`,
      recommendation: 'Add citations to on-chain data, central banks, or verified news agencies'
    })
  }
  
  if (dataProof.specificMetricsProvided < 3) {
    issues.push({
      rule: 'KURAL_4',
      severity: 'MEDIUM',
      description: `Insufficient specific metrics: ${dataProof.specificMetricsProvided} (minimum 3)`,
      recommendation: 'Add more percentages, volumes, prices, and quantifiable data'
    })
  }
  
  if (!dataProof.verifiableEvents) {
    issues.push({
      rule: 'KURAL_4',
      severity: 'MEDIUM',
      description: 'No verifiable events referenced (dates, institutions, specific events)',
      recommendation: 'Add specific dates, institution names, or verifiable events'
    })
  }
  
  // KURAL 5: Quality Thresholds
  if (article.eeatScore < 75) {
    issues.push({
      rule: 'KURAL_5',
      severity: 'HIGH',
      description: `E-E-A-T score below threshold: ${article.eeatScore}/100 (minimum 75)`,
      recommendation: 'Improve Experience, Expertise, Authoritativeness, and Trustworthiness signals'
    })
  }
  
  if (article.originalityScore < 70) {
    issues.push({
      rule: 'KURAL_5',
      severity: 'HIGH',
      description: `Originality score below threshold: ${article.originalityScore}/100 (minimum 70)`,
      recommendation: 'Add more unique insights and proprietary analysis'
    })
  }

  // KURAL 6: Word Count Enforcement (SIA Master Protocol)
  const wordCount = validateWordCount(article.fullContent, article.language)

  if (!wordCount.isCompliant) {
    const severity = wordCount.count < 600 ? 'CRITICAL' : 'HIGH'
    issues.push({
      rule: 'KURAL_6',
      severity,
      description: `Word count mismatch: ${wordCount.count} words (SIA Target: ${wordCount.targetRange[0]}-${wordCount.targetRange[1]})`,
      recommendation: `Expand content to meet the ${wordCount.targetRange[0]}-${wordCount.targetRange[1]} word depth requirement.`
    })
  }
  
  // Determine draft status
  const draftStatus = shouldMarkAsDraft(
    article,
    informationGain,
    analyticalDepth,
    disclaimerCompliance,
    dataProof
  ) || !wordCount.isCompliant
  
  // Calculate overall score
  const score = Math.round(
    (informationGain.score * 0.25) +
    ((analyticalDepth.causalityExplained ? 25 : 0) +
     (analyticalDepth.regionalImpactSpecified ? 25 : 0) +
     (analyticalDepth.uniqueInsightProvided ? 25 : 0) +
     (analyticalDepth.dataSourcesCited >= 2 ? 25 : 0)) * 0.25 +
    ((disclaimerCompliance.disclaimerPresent ? 50 : 0) +
     (disclaimerCompliance.legallyCompliant ? 50 : 0)) * 0.20 +
    ((!dataProof.speculativeLanguageDetected ? 25 : 0) +
     (dataProof.dataSourcesCited >= 2 ? 25 : 0) +
     (dataProof.specificMetricsProvided >= 3 ? 25 : 0) +
     (dataProof.verifiableEvents ? 25 : 0)) * 0.15 +
    ((article.eeatScore >= 75 ? 50 : 0) +
     (article.originalityScore >= 70 ? 50 : 0)) * 0.15
  )
  
  // Generate recommendations
  if (issues.length === 0) {
    recommendations.push('Content meets all Production Guardian standards')
  } else {
    recommendations.push(...issues.map(issue => issue.recommendation))
  }
  
  // Determine if manual review is required
  const requiresManualReview = issues.some(issue => 
    issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
  )
  
  return {
    approved: issues.length === 0 && !draftStatus,
    score,
    issues,
    recommendations,
    requiresManualReview,
    draftStatus
  }
}

// ============================================================================
// ALERT GENERATION
// ============================================================================

export interface QualityAlert {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  articleId: string
  issue: string
  recommendation: string
  requiresManualReview: boolean
  timestamp: string
}

/**
 * Generates admin dashboard alerts for quality issues
 */
export function generateQualityAlerts(
  articleId: string,
  validation: ProductionGuardianValidation
): QualityAlert[] {
  return validation.issues.map(issue => ({
    severity: issue.severity,
    articleId,
    issue: `[${issue.rule}] ${issue.description}`,
    recommendation: issue.recommendation,
    requiresManualReview: validation.requiresManualReview,
    timestamp: new Date().toISOString()
  }))
}
