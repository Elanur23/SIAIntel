/**
 * Trend Relevance Service
 * Phase 3A.7: Semantic relevance filter for trend signals
 * 
 * Evaluates whether trending terms are genuinely relevant to article content.
 * Rejects weak or irrelevant trends to maintain editorial quality.
 * 
 * CRITICAL: This is NOT a keyword stuffing system.
 * Only accepts trends that are semantically relevant to the content.
 */

import type {
  TrendTerm,
  TrendSnapshot,
  TrendCategory,
  RelevanceContext,
  TrendRelevanceResult,
  TermRelevance,
  RelevanceConfig,
  ContentAnalysis,
  SemanticSimilarity,
  QualityAssessment,
  TrendValidation
} from './trend-types'
import { DEFAULT_RELEVANCE_CONFIG } from './trend-types'

// ============================================================================
// MAIN RELEVANCE EVALUATION
// ============================================================================

/**
 * Evaluate trend relevance for article content
 * 
 * @param trends - Trending terms to evaluate
 * @param context - Article content and metadata
 * @param config - Relevance scoring configuration
 * @returns Relevance evaluation result with accepted/rejected terms
 */
export function evaluateTrendRelevance(
  trends: TrendTerm[],
  context: RelevanceContext,
  config: RelevanceConfig = DEFAULT_RELEVANCE_CONFIG
): TrendRelevanceResult {
  console.log('[TREND_RELEVANCE] Evaluating', trends.length, 'trends for relevance')
  
  // Analyze article content
  const contentAnalysis = analyzeContent(context)
  
  // Evaluate each trend term
  const termRelevances: TermRelevance[] = trends.map(trend => 
    evaluateTermRelevance(trend, context, contentAnalysis, config)
  )
  
  // Separate accepted and rejected terms
  const acceptedTerms = termRelevances
    .filter(tr => tr.accepted)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, config.maxAcceptedTerms) // Limit to max accepted
  
  const rejectedTerms = termRelevances
    .filter(tr => !tr.accepted)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  // Calculate overall scores
  const overallRelevance = acceptedTerms.length > 0
    ? acceptedTerms.reduce((sum, tr) => sum + tr.relevanceScore, 0) / acceptedTerms.length
    : 0
  
  const overallConfidence = acceptedTerms.length > 0
    ? acceptedTerms.reduce((sum, tr) => sum + tr.confidence, 0) / acceptedTerms.length
    : 0
  
  // Generate recommendations
  const recommendedTrendTerms = acceptedTerms.map(tr => tr.term)
  
  // Generate reasoning
  const reasoning = generateReasoning(acceptedTerms, rejectedTerms, contentAnalysis)
  
  // Quality assessment
  const qualityAssessment = assessQuality(acceptedTerms, context, config)
  
  // Validate result
  const validation = validateResult(acceptedTerms, rejectedTerms, config)
  
  return {
    overallRelevance,
    overallConfidence,
    acceptedTerms,
    rejectedTerms,
    recommendedTrendTerms,
    reasoning,
    passesQualityGate: qualityAssessment.maintainsEditorialIntegrity && validation.isValid,
    qualityWarnings: [...qualityAssessment.warnings, ...validation.warnings],
    evaluatedAt: new Date(),
    context
  }
}

// ============================================================================
// TERM RELEVANCE EVALUATION
// ============================================================================

/**
 * Evaluate relevance of a single trend term
 */
function evaluateTermRelevance(
  trend: TrendTerm,
  context: RelevanceContext,
  contentAnalysis: ContentAnalysis,
  config: RelevanceConfig
): TermRelevance {
  const term = trend.normalizedTerm
  
  // Check for exact matches
  const exactMatch = checkExactMatch(term, context, config)
  if (exactMatch.score > 0) {
    return {
      term: trend.term,
      relevanceScore: exactMatch.score,
      confidence: exactMatch.confidence,
      reasoning: exactMatch.reasoning,
      semanticMatch: 'exact',
      accepted: exactMatch.score >= config.minRelevanceScore && 
                exactMatch.confidence >= config.minConfidence
    }
  }
  
  // Check for semantic similarity
  const semanticMatch = checkSemanticMatch(term, contentAnalysis)
  if (semanticMatch.similarity > 0.7) {
    const score = Math.round(semanticMatch.similarity * 100)
    const confidence = Math.round(semanticMatch.similarity * 90)
    
    return {
      term: trend.term,
      relevanceScore: score,
      confidence,
      reasoning: `Semantically related to content (${semanticMatch.matchType})`,
      semanticMatch: semanticMatch.matchType,
      accepted: score >= config.minRelevanceScore && 
                confidence >= config.minConfidence &&
                (!config.rejectWeakMatches || semanticMatch.matchType !== 'weak')
    }
  }
  
  // Check for contextual relevance
  const contextualMatch = checkContextualMatch(term, context, contentAnalysis)
  if (contextualMatch.score > 0) {
    return {
      term: trend.term,
      relevanceScore: contextualMatch.score,
      confidence: contextualMatch.confidence,
      reasoning: contextualMatch.reasoning,
      semanticMatch: 'contextual',
      accepted: contextualMatch.score >= config.minRelevanceScore && 
                contextualMatch.confidence >= config.minConfidence &&
                !config.rejectWeakMatches
    }
  }
  
  // No match found - reject
  return {
    term: trend.term,
    relevanceScore: 0,
    confidence: 0,
    reasoning: 'No semantic or contextual relevance to article content',
    semanticMatch: 'none',
    accepted: false
  }
}

// ============================================================================
// MATCHING ALGORITHMS
// ============================================================================

/**
 * Check for exact term matches in content
 */
function checkExactMatch(
  term: string,
  context: RelevanceContext,
  config: RelevanceConfig
): { score: number; confidence: number; reasoning: string } {
  const termLower = term.toLowerCase()
  const titleLower = context.articleTitle.toLowerCase()
  const bodyLower = context.articleBody.toLowerCase()
  const summaryLower = context.articleSummary?.toLowerCase() || ''
  
  let score = 0
  let matches: string[] = []
  
  // Check title (highest weight)
  if (titleLower.includes(termLower)) {
    score += 40 * config.titleWeight
    matches.push('title')
  }
  
  // Check summary (medium weight)
  if (summaryLower && summaryLower.includes(termLower)) {
    score += 30 * config.summaryWeight
    matches.push('summary')
  }
  
  // Check body (base weight)
  if (bodyLower.includes(termLower)) {
    score += 20 * config.bodyWeight
    matches.push('body')
  }
  
  // Check existing hashtags/keywords
  if (context.existingHashtags?.some(tag => tag.toLowerCase() === termLower)) {
    score += 10
    matches.push('existing hashtags')
  }
  
  if (score === 0) {
    return { score: 0, confidence: 0, reasoning: '' }
  }
  
  // Cap at 100
  score = Math.min(100, score)
  
  return {
    score,
    confidence: 95, // High confidence for exact matches
    reasoning: `Exact match found in: ${matches.join(', ')}`
  }
}

/**
 * Check for semantic similarity using simple heuristics
 * (In production, this would use embeddings or NLP models)
 */
function checkSemanticMatch(
  term: string,
  contentAnalysis: ContentAnalysis
): SemanticSimilarity {
  const termLower = term.toLowerCase()
  
  // Check against extracted entities
  for (const entity of contentAnalysis.entities) {
    const similarity = calculateStringSimilarity(termLower, entity.toLowerCase())
    if (similarity > 0.7) {
      return {
        term1: term,
        term2: entity,
        similarity,
        matchType: similarity > 0.9 ? 'exact' : 'related'
      }
    }
  }
  
  // Check against keywords
  for (const keyword of contentAnalysis.keywords) {
    const similarity = calculateStringSimilarity(termLower, keyword.toLowerCase())
    if (similarity > 0.7) {
      return {
        term1: term,
        term2: keyword,
        similarity,
        matchType: 'related'
      }
    }
  }
  
  // Check against topics
  for (const topic of contentAnalysis.topics) {
    const similarity = calculateStringSimilarity(termLower, topic.toLowerCase())
    if (similarity > 0.6) {
      return {
        term1: term,
        term2: topic,
        similarity,
        matchType: 'contextual'
      }
    }
  }
  
  return {
    term1: term,
    term2: '',
    similarity: 0,
    matchType: 'none'
  }
}

/**
 * Check for contextual relevance based on category and semantic fingerprint
 */
function checkContextualMatch(
  term: string,
  context: RelevanceContext,
  contentAnalysis: ContentAnalysis
): { score: number; confidence: number; reasoning: string } {
  const termLower = term.toLowerCase()
  
  // Check if term appears in semantic fingerprint
  const fingerprintMatch = contentAnalysis.semanticFingerprint.some(fp => 
    fp.toLowerCase().includes(termLower) || termLower.includes(fp.toLowerCase())
  )
  
  if (fingerprintMatch) {
    return {
      score: 50,
      confidence: 60,
      reasoning: 'Contextually relevant based on semantic fingerprint'
    }
  }
  
  // Check category alignment
  if (context.category && contentAnalysis.detectedCategory === context.category) {
    const categoryTerms = getCategoryTerms(context.category)
    if (categoryTerms.some(ct => ct.toLowerCase() === termLower)) {
      return {
        score: 40,
        confidence: 50,
        reasoning: `Relevant to ${context.category} category`
      }
    }
  }
  
  return { score: 0, confidence: 0, reasoning: '' }
}

// ============================================================================
// CONTENT ANALYSIS
// ============================================================================

/**
 * Analyze article content to extract semantic features
 */
function analyzeContent(context: RelevanceContext): ContentAnalysis {
  const allText = [
    context.articleTitle,
    context.articleSummary || '',
    context.articleBody
  ].join(' ')
  
  // Extract entities (simple word extraction)
  const entities = extractEntities(allText)
  
  // Extract keywords (high-frequency meaningful words)
  const keywords = extractKeywords(allText)
  
  // Extract topics (broader themes)
  const topics = extractTopics(allText, context.category)
  
  // Create semantic fingerprint
  const semanticFingerprint = [...new Set([...entities, ...keywords, ...topics])]
  
  // Detect category
  const detectedCategory = detectCategory(allText, context.category)
  
  return {
    entities,
    keywords,
    topics,
    semanticFingerprint,
    detectedCategory: detectedCategory.category,
    categoryConfidence: detectedCategory.confidence
  }
}

/**
 * Extract named entities from text (simplified)
 */
function extractEntities(text: string): string[] {
  // Simple capitalized word extraction
  const words = text.split(/\s+/)
  const entities = words
    .filter(word => /^[A-Z][a-z]+/.test(word) && word.length > 3)
    .map(word => word.toLowerCase())
  
  return [...new Set(entities)].slice(0, 20)
}

/**
 * Extract keywords from text (simplified)
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'])
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
  
  // Count frequency
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  // Get top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

/**
 * Extract topics from text based on category
 */
function extractTopics(text: string, category?: TrendCategory): string[] {
  const textLower = text.toLowerCase()
  const topics: string[] = []
  
  // Category-specific topic detection
  if (category === 'crypto' || textLower.includes('bitcoin') || textLower.includes('crypto')) {
    topics.push('cryptocurrency', 'blockchain', 'digital assets')
  }
  
  if (category === 'economy' || textLower.includes('economy') || textLower.includes('gdp')) {
    topics.push('economic policy', 'macroeconomics', 'fiscal policy')
  }
  
  if (category === 'finance' || textLower.includes('market') || textLower.includes('stock')) {
    topics.push('financial markets', 'investment', 'trading')
  }
  
  if (category === 'ai' || textLower.includes('artificial intelligence') || textLower.includes(' ai ')) {
    topics.push('artificial intelligence', 'machine learning', 'technology')
  }
  
  return topics
}

/**
 * Detect content category
 */
function detectCategory(text: string, providedCategory?: TrendCategory): { category?: TrendCategory; confidence: number } {
  if (providedCategory) {
    return { category: providedCategory, confidence: 100 }
  }
  
  const textLower = text.toLowerCase()
  
  // Simple keyword-based detection
  if (textLower.includes('bitcoin') || textLower.includes('crypto') || textLower.includes('blockchain')) {
    return { category: 'crypto', confidence: 80 }
  }
  
  if (textLower.includes('economy') || textLower.includes('gdp') || textLower.includes('inflation')) {
    return { category: 'economy', confidence: 80 }
  }
  
  if (textLower.includes('stock') || textLower.includes('market') || textLower.includes('trading')) {
    return { category: 'finance', confidence: 80 }
  }
  
  if (textLower.includes('artificial intelligence') || textLower.includes(' ai ') || textLower.includes('machine learning')) {
    return { category: 'ai', confidence: 80 }
  }
  
  return { confidence: 0 }
}

// ============================================================================
// QUALITY ASSESSMENT
// ============================================================================

/**
 * Assess editorial quality of accepted trends
 */
function assessQuality(
  acceptedTerms: TermRelevance[],
  context: RelevanceContext,
  config: RelevanceConfig
): QualityAssessment {
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Check for keyword stuffing
  const avoidKeywordStuffing = acceptedTerms.length <= config.maxAcceptedTerms
  if (!avoidKeywordStuffing) {
    warnings.push(`Too many trend terms accepted (${acceptedTerms.length}/${config.maxAcceptedTerms})`)
  }
  
  // Check for weak matches
  const hasWeakMatches = acceptedTerms.some(tr => tr.semanticMatch === 'weak')
  if (hasWeakMatches && config.rejectWeakMatches) {
    warnings.push('Weak semantic matches detected - consider rejecting')
  }
  
  // Check relevance scores
  const lowScoreTerms = acceptedTerms.filter(tr => tr.relevanceScore < 70)
  if (lowScoreTerms.length > 0) {
    warnings.push(`${lowScoreTerms.length} terms have low relevance scores (<70)`)
    recommendations.push('Consider increasing minimum relevance threshold')
  }
  
  // Check confidence scores
  const lowConfidenceTerms = acceptedTerms.filter(tr => tr.confidence < 75)
  if (lowConfidenceTerms.length > 0) {
    warnings.push(`${lowConfidenceTerms.length} terms have low confidence (<75)`)
  }
  
  return {
    maintainsEditorialIntegrity: warnings.length === 0,
    avoidKeywordStuffing,
    preservesTrustScore: !hasWeakMatches,
    noMisleadingContent: true, // Would require deeper analysis
    appropriateForCategory: true, // Would require category validation
    warnings,
    recommendations
  }
}

/**
 * Validate relevance result
 */
function validateResult(
  acceptedTerms: TermRelevance[],
  rejectedTerms: TermRelevance[],
  config: RelevanceConfig
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check if any terms were evaluated
  if (acceptedTerms.length === 0 && rejectedTerms.length === 0) {
    errors.push('No trends were evaluated')
  }
  
  // Check for excessive acceptance
  if (acceptedTerms.length > config.maxAcceptedTerms) {
    errors.push(`Too many terms accepted: ${acceptedTerms.length} > ${config.maxAcceptedTerms}`)
  }
  
  // Check for low-quality acceptances
  const veryLowScoreTerms = acceptedTerms.filter(tr => tr.relevanceScore < config.minRelevanceScore)
  if (veryLowScoreTerms.length > 0) {
    errors.push(`${veryLowScoreTerms.length} accepted terms below minimum relevance score`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// REASONING GENERATION
// ============================================================================

/**
 * Generate human-readable reasoning for relevance evaluation
 */
function generateReasoning(
  acceptedTerms: TermRelevance[],
  rejectedTerms: TermRelevance[],
  contentAnalysis: ContentAnalysis
): string[] {
  const reasoning: string[] = []
  
  if (acceptedTerms.length > 0) {
    reasoning.push(`Accepted ${acceptedTerms.length} trend term(s) with strong semantic relevance`)
    
    const exactMatches = acceptedTerms.filter(tr => tr.semanticMatch === 'exact')
    if (exactMatches.length > 0) {
      reasoning.push(`${exactMatches.length} term(s) found as exact matches in content`)
    }
    
    const relatedMatches = acceptedTerms.filter(tr => tr.semanticMatch === 'related')
    if (relatedMatches.length > 0) {
      reasoning.push(`${relatedMatches.length} term(s) semantically related to content`)
    }
  }
  
  if (rejectedTerms.length > 0) {
    reasoning.push(`Rejected ${rejectedTerms.length} trend term(s) with insufficient relevance`)
    
    const noMatch = rejectedTerms.filter(tr => tr.semanticMatch === 'none')
    if (noMatch.length > 0) {
      reasoning.push(`${noMatch.length} term(s) had no semantic connection to content`)
    }
  }
  
  if (contentAnalysis.detectedCategory) {
    reasoning.push(`Content category detected: ${contentAnalysis.detectedCategory}`)
  }
  
  reasoning.push(`Content analysis identified ${contentAnalysis.entities.length} entities and ${contentAnalysis.keywords.length} keywords`)
  
  return reasoning
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Get category-specific terms
 */
function getCategoryTerms(category: string): string[] {
  const categoryTerms: Record<string, string[]> = {
    crypto: ['bitcoin', 'ethereum', 'blockchain', 'cryptocurrency', 'defi', 'nft', 'crypto', 'btc', 'eth'],
    economy: ['gdp', 'inflation', 'recession', 'employment', 'economic', 'fiscal', 'monetary', 'policy'],
    finance: ['stock', 'market', 'trading', 'investment', 'portfolio', 'equity', 'bond', 'fund'],
    ai: ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ai', 'ml', 'algorithm'],
    technology: ['tech', 'software', 'hardware', 'innovation', 'digital', 'technology'],
    markets: ['market', 'trading', 'price', 'volume', 'trend', 'analysis']
  }
  
  return categoryTerms[category] || []
}
