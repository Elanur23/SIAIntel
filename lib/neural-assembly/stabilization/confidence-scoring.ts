import type { DecisionConfidence, ConfidenceBand } from './types'

export interface DecisionConfidenceInput {
  batchScore?: number
  criticalIssueCount?: number
  highIssueCount?: number
  semanticConsistencyScore?: number
  semanticAiConfidence?: number
  riskOverallScore?: number
  staleCount?: number
  deterministicRuleCriticalFailures?: number
  deterministicRuleHighFailures?: number
  confidence_thresholds?: {
    min_confidence_approve_all?: number
    min_confidence_partial?: number
  }
}

function toBand(score: number): ConfidenceBand {
  if (score >= 80) return 'HIGH'
  if (score >= 60) return 'MEDIUM'
  return 'LOW'
}

export function computeDecisionConfidence(input: DecisionConfidenceInput): DecisionConfidence {
  const batchScore = input.batchScore ?? 0
  const criticalIssueCount = input.criticalIssueCount ?? 0
  const highIssueCount = input.highIssueCount ?? 0
  const semanticConsistencyScore = input.semanticConsistencyScore ?? 70
  const semanticAiConfidence = input.semanticAiConfidence ?? 0.8
  const riskOverallScore = input.riskOverallScore ?? 50
  const staleCount = input.staleCount ?? 0
  const deterministicRuleCriticalFailures = input.deterministicRuleCriticalFailures ?? 0
  const deterministicRuleHighFailures = input.deterministicRuleHighFailures ?? 0

  const base =
    batchScore * 0.45 +
    semanticConsistencyScore * 0.25 +
    semanticAiConfidence * 100 * 0.15

  const penalty =
    criticalIssueCount * 12 +
    highIssueCount * 4 +
    staleCount * 3 +
    deterministicRuleCriticalFailures * 20 +
    deterministicRuleHighFailures * 8 +
    Math.max(0, riskOverallScore - 40) * 0.25

  const confidence_score = Math.max(0, Math.min(100, Math.round(base - penalty)))

  return {
    confidence_score,
    confidence_band: toBand(confidence_score),
    reasons: [
      `batchScore=${batchScore}`,
      `semanticConsistency=${semanticConsistencyScore}`,
      `risk=${riskOverallScore}`,
      `criticalIssues=${criticalIssueCount}`,
      `highIssues=${highIssueCount}`,
    ],
  }
}
