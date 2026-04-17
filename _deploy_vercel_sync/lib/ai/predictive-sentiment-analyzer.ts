/**
 * Predictive Sentiment Analyzer
 * Predicts next emotional breakpoint with historical pattern matching
 * Part of E-E-A-T Reasoning Protocols (Level Max)
 */

import {
  getSentimentPatterns,
  type SentimentPattern
} from '@/lib/database/eeat-protocols-db'

// ============================================================================
// INTERFACES
// ============================================================================

export interface SentimentAnalysisResult {
  fearGreedIndex: number // 0-100
  sentimentCategory: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
  divergenceDetected: boolean
  confidence: number
}

export interface PredictiveSentimentScore {
  currentScore: number // 0-100 (Fear/Greed Index)
  sentimentZone: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
  nextBreakingPoint: BreakingPointPrediction | null
  historicalContext: HistoricalContext
  riskFactors: RiskFactor[]
}

export interface BreakingPointPrediction {
  direction: 'FEAR_TO_GREED' | 'GREED_TO_FEAR' | 'NEUTRAL_TO_EXTREME'
  triggerLevel: number // e.g., 75 (Fear/Greed Index threshold)
  expectedTimeframe: string // e.g., "7-14 days"
  predictionConfidenceScore: number // 0-100
  historicalPrecedents: number // Count of similar patterns
  patternSimilarityScore: number // 0-100
}

export interface HistoricalContext {
  similarPatterns: SentimentPattern[]
  averageBreakpointDuration: number // days
  historicalAccuracy: number // percentage
}

export interface RiskFactor {
  factor: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
}

// ============================================================================
// SENTIMENT SCORE TEMPLATES
// ============================================================================

export const SENTIMENT_SCORE_TEMPLATES = {
  en: `
🎯 SIA SENTIMENT SCORE: {score}/100 ({zone} zone)

Next Emotional Breaking Point:
• Trigger Level: Fear/Greed Index {triggerLevel}+ (currently {currentScore})
• Expected Timeframe: {timeframe}
• Historical Accuracy: {accuracy}% (based on {precedents} precedents)
• Risk Factor: {riskLevel}
`,
  tr: `
🎯 SIA SENTIMENT SCORE: {score}/100 ({zone} bölgesinde)

Bir Sonraki Duygusal Kırılma Noktası:
• Tetikleyici Seviye: Fear/Greed Index {triggerLevel}+ (şu an {currentScore})
• Beklenen Zaman: {timeframe}
• Tarihsel Doğruluk: %{accuracy} (son {precedents} kırılma noktası)
• Risk Faktörü: {riskLevel}
`,
  de: `
🎯 SIA SENTIMENT SCORE: {score}/100 ({zone} Zone)

Nächster emotionaler Wendepunkt:
• Auslösestufe: Fear/Greed Index {triggerLevel}+ (aktuell {currentScore})
• Erwarteter Zeitrahmen: {timeframe}
• Historische Genauigkeit: {accuracy}% (basierend auf {precedents} Präzedenzfällen)
• Risikofaktor: {riskLevel}
`,
  es: `
🎯 SIA SENTIMENT SCORE: {score}/100 (zona {zone})

Próximo Punto de Ruptura Emocional:
• Nivel de Activación: Fear/Greed Index {triggerLevel}+ (actualmente {currentScore})
• Marco Temporal Esperado: {timeframe}
• Precisión Histórica: {accuracy}% (basado en {precedents} precedentes)
• Factor de Riesgo: {riskLevel}
`,
  fr: `
🎯 SIA SENTIMENT SCORE: {score}/100 (zone {zone})

Prochain Point de Rupture Émotionnel:
• Niveau de Déclenchement: Fear/Greed Index {triggerLevel}+ (actuellement {currentScore})
• Délai Prévu: {timeframe}
• Précision Historique: {accuracy}% (basé sur {precedents} précédents)
• Facteur de Risque: {riskLevel}
`,
  ar: `
🎯 SIA SENTIMENT SCORE: {score}/100 (منطقة {zone})

نقطة الانهيار العاطفي التالية:
• مستوى التفعيل: Fear/Greed Index {triggerLevel}+ (حالياً {currentScore})
• الإطار الزمني المتوقع: {timeframe}
• الدقة التاريخية: {accuracy}% (بناءً على {precedents} سابقة)
• عامل الخطر: {riskLevel}
`
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function generatePredictiveSentiment(
  sentimentResult: SentimentAnalysisResult,
  asset: string,
  language: string
): Promise<PredictiveSentimentScore> {
  const currentScore = sentimentResult.fearGreedIndex
  const sentimentZone = getSentimentZone(currentScore)
  
  // Find similar historical patterns
  const similarPatterns = await findSimilarPatterns(
    currentScore,
    asset,
    20 // Minimum 20 precedents required
  )
  
  // Calculate historical context
  const historicalContext = calculateHistoricalContext(similarPatterns)
  
  // Predict breakpoint if sufficient patterns found
  let nextBreakingPoint: BreakingPointPrediction | null = null
  
  if (similarPatterns.length >= 20) {
    const patternSimilarity = calculateAveragePatternSimilarity(
      sentimentResult,
      similarPatterns
    )
    
    // Only predict if pattern similarity ≥ 70
    if (patternSimilarity >= 70) {
      nextBreakingPoint = predictBreakpoint(
        similarPatterns,
        currentScore,
        patternSimilarity
      )
    }
  }
  
  // Identify risk factors
  const riskFactors = identifyRiskFactors(
    nextBreakingPoint,
    sentimentResult
  )
  
  return {
    currentScore,
    sentimentZone,
    nextBreakingPoint,
    historicalContext,
    riskFactors
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function findSimilarPatterns(
  currentSentiment: number,
  asset: string,
  minimumPrecedents: number
): Promise<SentimentPattern[]> {
  try {
    // Define sentiment range (±10 points)
    const sentimentRange = {
      min: Math.max(0, currentSentiment - 10),
      max: Math.min(100, currentSentiment + 10)
    }
    
    // Query historical patterns
    const patterns = await getSentimentPatterns(asset, sentimentRange)
    
    // Sort by similarity (closest to current sentiment first)
    const sortedPatterns = patterns.sort((a, b) => {
      const diffA = Math.abs(a.initialSentiment - currentSentiment)
      const diffB = Math.abs(b.initialSentiment - currentSentiment)
      return diffA - diffB
    })
    
    return sortedPatterns
  } catch (error) {
    console.error('Error finding similar patterns:', error)
    return []
  }
}

export function calculatePatternSimilarity(
  currentState: SentimentAnalysisResult,
  historicalPattern: SentimentPattern
): number {
  // Calculate similarity based on sentiment proximity
  const sentimentDiff = Math.abs(currentState.fearGreedIndex - historicalPattern.initialSentiment)
  const sentimentSimilarity = Math.max(0, 100 - sentimentDiff * 2)
  
  return sentimentSimilarity
}

function calculateAveragePatternSimilarity(
  currentState: SentimentAnalysisResult,
  patterns: SentimentPattern[]
): number {
  if (patterns.length === 0) return 0
  
  const totalSimilarity = patterns.reduce((sum, pattern) => {
    return sum + calculatePatternSimilarity(currentState, pattern)
  }, 0)
  
  return totalSimilarity / patterns.length
}

export function predictBreakpoint(
  patterns: SentimentPattern[],
  currentSentiment: number,
  patternSimilarity: number
): BreakingPointPrediction | null {
  if (patterns.length === 0) return null
  
  // Determine direction based on current sentiment zone
  let direction: 'FEAR_TO_GREED' | 'GREED_TO_FEAR' | 'NEUTRAL_TO_EXTREME'
  
  if (currentSentiment < 40) {
    direction = 'FEAR_TO_GREED'
  } else if (currentSentiment > 60) {
    direction = 'GREED_TO_FEAR'
  } else {
    direction = 'NEUTRAL_TO_EXTREME'
  }
  
  // Calculate average breakpoint characteristics
  const avgDuration = patterns.reduce((sum, p) => sum + p.duration, 0) / patterns.length
  const avgBreakpointSentiment = patterns.reduce((sum, p) => sum + p.breakpointSentiment, 0) / patterns.length
  
  // Determine trigger level
  const triggerLevel = Math.round(avgBreakpointSentiment)
  
  // Determine expected timeframe
  const minDays = Math.max(7, Math.floor(avgDuration * 0.8))
  const maxDays = Math.ceil(avgDuration * 1.2)
  const expectedTimeframe = `${minDays}-${maxDays} days`
  
  // Calculate prediction confidence based on pattern similarity and precedent count
  const precedentBonus = Math.min(20, patterns.length - 20) // Bonus for >20 precedents
  const predictionConfidenceScore = Math.min(100, Math.round(patternSimilarity * 0.7 + precedentBonus))
  
  // Skip prediction if confidence < 60
  if (predictionConfidenceScore < 60) {
    return null
  }
  
  return {
    direction,
    triggerLevel,
    expectedTimeframe,
    predictionConfidenceScore,
    historicalPrecedents: patterns.length,
    patternSimilarityScore: Math.round(patternSimilarity)
  }
}

export function identifyRiskFactors(
  prediction: BreakingPointPrediction | null,
  currentState: SentimentAnalysisResult
): RiskFactor[] {
  const riskFactors: RiskFactor[] = []
  
  // Risk factor: Low prediction confidence
  if (prediction && prediction.predictionConfidenceScore < 70) {
    riskFactors.push({
      factor: 'Low Prediction Confidence',
      impact: 'HIGH',
      description: `Prediction confidence is ${prediction.predictionConfidenceScore}%, indicating moderate uncertainty in breakpoint timing`
    })
  }
  
  // Risk factor: Extreme sentiment zones
  if (currentState.fearGreedIndex < 20 || currentState.fearGreedIndex > 80) {
    riskFactors.push({
      factor: 'Extreme Sentiment Zone',
      impact: 'HIGH',
      description: 'Market is in extreme sentiment territory, increasing volatility and unpredictability'
    })
  }
  
  // Risk factor: Divergence detected
  if (currentState.divergenceDetected) {
    riskFactors.push({
      factor: 'Sentiment Divergence',
      impact: 'MEDIUM',
      description: 'Divergence between sentiment indicators and price action detected, suggesting potential reversal'
    })
  }
  
  // Risk factor: Insufficient historical precedents
  if (prediction && prediction.historicalPrecedents < 25) {
    riskFactors.push({
      factor: 'Limited Historical Data',
      impact: 'MEDIUM',
      description: `Only ${prediction.historicalPrecedents} historical precedents available, reducing prediction reliability`
    })
  }
  
  // Default risk factor if no prediction
  if (!prediction) {
    riskFactors.push({
      factor: 'Insufficient Pattern Match',
      impact: 'LOW',
      description: 'Current market conditions do not match historical patterns strongly enough for breakpoint prediction'
    })
  }
  
  return riskFactors
}

export function calculatePredictionConfidence(
  patterns: SentimentPattern[],
  patternSimilarity: number
): number {
  // Base confidence from pattern similarity (70% weight)
  const similarityScore = patternSimilarity * 0.7
  
  // Bonus from precedent count (30% weight)
  const precedentBonus = Math.min(30, (patterns.length - 20) * 1.5)
  
  return Math.min(100, Math.round(similarityScore + precedentBonus))
}

export function formatSentimentScoreSection(
  score: PredictiveSentimentScore,
  language: string
): string {
  const template = SENTIMENT_SCORE_TEMPLATES[language as keyof typeof SENTIMENT_SCORE_TEMPLATES] || SENTIMENT_SCORE_TEMPLATES.en
  
  if (!score.nextBreakingPoint) {
    // No prediction available
    return `🎯 SIA SENTIMENT SCORE: ${score.currentScore}/100 (${score.sentimentZone} zone)\n\nNo breakpoint prediction available due to insufficient pattern matching.`
  }
  
  const riskLevel = score.riskFactors.length > 0 ? score.riskFactors[0].impact : 'MEDIUM'
  
  return template
    .replace('{score}', score.currentScore.toString())
    .replace('{zone}', score.sentimentZone)
    .replace('{triggerLevel}', score.nextBreakingPoint.triggerLevel.toString())
    .replace('{currentScore}', score.currentScore.toString())
    .replace('{timeframe}', score.nextBreakingPoint.expectedTimeframe)
    .replace('{accuracy}', score.historicalContext.historicalAccuracy.toString())
    .replace('{precedents}', score.nextBreakingPoint.historicalPrecedents.toString())
    .replace('{riskLevel}', riskLevel)
}

function calculateHistoricalContext(
  patterns: SentimentPattern[]
): HistoricalContext {
  if (patterns.length === 0) {
    return {
      similarPatterns: [],
      averageBreakpointDuration: 0,
      historicalAccuracy: 0
    }
  }
  
  const avgDuration = patterns.reduce((sum, p) => sum + p.duration, 0) / patterns.length
  
  // Historical accuracy based on pattern consistency
  // Higher consistency = higher accuracy
  const durations = patterns.map(p => p.duration)
  const avgDeviation = durations.reduce((sum, d) => sum + Math.abs(d - avgDuration), 0) / durations.length
  const consistency = Math.max(0, 100 - (avgDeviation / avgDuration) * 100)
  const historicalAccuracy = Math.round(consistency)
  
  return {
    similarPatterns: patterns.slice(0, 10), // Return top 10 most similar
    averageBreakpointDuration: Math.round(avgDuration),
    historicalAccuracy
  }
}

function getSentimentZone(score: number): 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED' {
  if (score < 20) return 'EXTREME_FEAR'
  if (score < 40) return 'FEAR'
  if (score < 60) return 'NEUTRAL'
  if (score < 80) return 'GREED'
  return 'EXTREME_GREED'
}
