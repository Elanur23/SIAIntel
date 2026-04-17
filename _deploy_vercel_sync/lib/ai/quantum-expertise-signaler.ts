/**
 * Quantum Expertise Signaler
 * Enhances reasoning chains with causal proof structure and historical validation
 * Part of E-E-A-T Reasoning Protocols (Level Max)
 */

import {
  getHistoricalCorrelation,
  type HistoricalCorrelation
} from '@/lib/database/eeat-protocols-db'

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReasoningChain {
  steps: ReasoningStep[]
  topic: string
  asset: string
}

export interface ReasoningStep {
  premise: string
  implication: string
  conclusion: string
}

export interface QuantumExpertiseSignal {
  originalReasoningChain: ReasoningChain
  enhancedChain: EnhancedReasoningChain
  causalProofs: CausalProof[]
  expertiseSignalScore: number // 0-100
}

export interface CausalProof {
  premise: string // "X verisi"
  effect: string // "Y'yi tetikler"
  reason: string // "çünkü Z korelasyonu"
  historicalValidation: HistoricalValidation
  language: string
}

export interface HistoricalValidation {
  correlationCoefficient: number // 0.0-1.0
  lookbackPeriod: string // e.g., "12 months"
  occurrenceCount: number // Number of historical precedents
  accuracyPercentage: number // e.g., 90 means "90% doğrudur"
  confidenceInterval: {
    lower: number
    upper: number
  }
  sources: string[]
}

export interface EnhancedReasoningChain extends ReasoningChain {
  steps: EnhancedReasoningStep[]
  causalProofCount: number
  averageHistoricalAccuracy: number
}

export interface EnhancedReasoningStep extends ReasoningStep {
  causalProof?: CausalProof
  historicalAccuracy?: number
}

// ============================================================================
// LANGUAGE TEMPLATES
// ============================================================================

export const CAUSAL_PROOF_TEMPLATES = {
  en: '{premise} triggers {effect}, because {reason} correlation is historically {accuracy}% accurate',
  tr: '{premise} {effect}\'yi tetikler, çünkü {reason} korelasyonu tarihsel olarak %{accuracy} doğrudur',
  de: '{premise} löst {effect} aus, weil {reason} Korrelation historisch {accuracy}% genau ist',
  es: '{premise} desencadena {effect}, porque la correlación {reason} es históricamente {accuracy}% precisa',
  fr: '{premise} déclenche {effect}, car la corrélation {reason} est historiquement précise à {accuracy}%',
  ar: '{premise} يؤدي إلى {effect}، لأن ارتباط {reason} دقيق تاريخياً بنسبة {accuracy}%'
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function generateQuantumExpertiseSignals(
  reasoningChains: ReasoningChain[],
  language: string
): Promise<QuantumExpertiseSignal[]> {
  const signals: QuantumExpertiseSignal[] = []
  
  for (const chain of reasoningChains) {
    const enhancedSteps: EnhancedReasoningStep[] = []
    const causalProofs: CausalProof[] = []
    
    for (const step of chain.steps) {
      const causalProof = await addCausalProof(step, chain.asset, language)
      
      const enhancedStep: EnhancedReasoningStep = {
        ...step,
        causalProof: causalProof || undefined,
        historicalAccuracy: causalProof?.historicalValidation.accuracyPercentage
      }
      
      enhancedSteps.push(enhancedStep)
      
      if (causalProof) {
        causalProofs.push(causalProof)
      }
    }
    
    const enhancedChain: EnhancedReasoningChain = {
      ...chain,
      steps: enhancedSteps,
      causalProofCount: causalProofs.length,
      averageHistoricalAccuracy:
        causalProofs.length > 0
          ? causalProofs.reduce((sum, p) => sum + p.historicalValidation.accuracyPercentage, 0) /
            causalProofs.length
          : 0
    }
    
    const signal: QuantumExpertiseSignal = {
      originalReasoningChain: chain,
      enhancedChain,
      causalProofs,
      expertiseSignalScore: calculateExpertiseSignalScore({
        originalReasoningChain: chain,
        enhancedChain,
        causalProofs,
        expertiseSignalScore: 0 // Will be calculated
      })
    }
    
    signals.push(signal)
  }
  
  return signals
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function addCausalProof(
  step: ReasoningStep,
  asset: string,
  language: string
): Promise<CausalProof | null> {
  try {
    // Try to find historical validation for this reasoning step
    const historicalValidation = await validateHistoricalCorrelation(
      step.premise,
      step.conclusion,
      asset
    )
    
    if (!historicalValidation) {
      return null
    }
    
    // Check minimum correlation threshold (0.60)
    if (historicalValidation.correlationCoefficient < 0.60) {
      return null
    }
    
    const causalProof: CausalProof = {
      premise: step.premise,
      effect: step.conclusion,
      reason: step.implication,
      historicalValidation,
      language
    }
    
    return causalProof
  } catch (error) {
    console.error('Error adding causal proof:', error)
    return null
  }
}

export async function validateHistoricalCorrelation(
  premise: string,
  effect: string,
  asset: string
): Promise<HistoricalValidation | null> {
  try {
    // Query historical correlations database
    const correlation = await getHistoricalCorrelation(premise, effect, asset)
    
    if (!correlation) {
      return null
    }
    
    // Ensure minimum 12-month lookback period
    const lookbackMonths = parseInt(correlation.lookbackPeriod.split(' ')[0])
    if (lookbackMonths < 12) {
      return null
    }
    
    const validation: HistoricalValidation = {
      correlationCoefficient: correlation.correlationCoefficient,
      lookbackPeriod: correlation.lookbackPeriod,
      occurrenceCount: correlation.occurrenceCount,
      accuracyPercentage: correlation.accuracyPercentage,
      confidenceInterval: correlation.confidenceInterval,
      sources: correlation.sources
    }
    
    return validation
  } catch (error) {
    console.error('Error validating historical correlation:', error)
    return null
  }
}

export function calculateExpertiseSignalScore(
  signal: QuantumExpertiseSignal
): number {
  const { enhancedChain, causalProofs } = signal
  
  // Weighted formula: causal chain count (30%), historical validation (40%), data specificity (30%)
  
  // 1. Causal chain count score (0-100)
  const totalSteps = enhancedChain.steps.length
  const causalChainCountScore = Math.min(100, (causalProofs.length / totalSteps) * 100)
  
  // 2. Historical validation strength score (0-100)
  const avgCorrelation =
    causalProofs.length > 0
      ? causalProofs.reduce((sum, p) => sum + p.historicalValidation.correlationCoefficient, 0) /
        causalProofs.length
      : 0
  const historicalValidationScore = avgCorrelation * 100
  
  // 3. Data specificity score (0-100)
  // Based on average occurrence count and source count
  const avgOccurrences =
    causalProofs.length > 0
      ? causalProofs.reduce((sum, p) => sum + p.historicalValidation.occurrenceCount, 0) /
        causalProofs.length
      : 0
  const avgSources =
    causalProofs.length > 0
      ? causalProofs.reduce((sum, p) => sum + p.historicalValidation.sources.length, 0) /
        causalProofs.length
      : 0
  const dataSpecificityScore = Math.min(100, (avgOccurrences / 20) * 50 + (avgSources / 3) * 50)
  
  // Calculate weighted score
  const expertiseSignalScore =
    causalChainCountScore * 0.3 +
    historicalValidationScore * 0.4 +
    dataSpecificityScore * 0.3
  
  return Math.round(expertiseSignalScore)
}

export function formatCausalProof(proof: CausalProof, language: string): string {
  const template = CAUSAL_PROOF_TEMPLATES[language as keyof typeof CAUSAL_PROOF_TEMPLATES] || CAUSAL_PROOF_TEMPLATES.en
  
  return template
    .replace('{premise}', proof.premise)
    .replace('{effect}', proof.effect)
    .replace('{reason}', proof.reason)
    .replace('{accuracy}', proof.historicalValidation.accuracyPercentage.toString())
}
