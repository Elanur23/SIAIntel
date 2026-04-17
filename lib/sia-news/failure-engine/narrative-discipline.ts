import type { NarrativeInput, NarrativeResult } from './types'

export function runNarrativeDisciplineEngine(input: NarrativeInput): NarrativeResult {
  const reasons: string[] = []

  if (!input.thesis_supported || !input.headline_alignment_passed) {
    reasons.push('THESIS_OR_ALIGNMENT_FAILURE')
  }

  if (input.certainty_language_detected || input.sensationalism_detected) {
    reasons.push('NARRATIVE_RISK_LANGUAGE_DETECTED')
  }

  if (input.evidence_support_score < 50 || input.claim_stack_count > 12) {
    reasons.push('EVIDENCE_SUPPORT_WEAK')
  }

  if (reasons.includes('THESIS_OR_ALIGNMENT_FAILURE') && reasons.includes('EVIDENCE_SUPPORT_WEAK')) {
    return {
      narrative_decision: 'NARRATIVE_BLOCK',
      narrative_severity: 'CRITICAL',
      narrative_risk_reasons: reasons,
      publish_allowed: false,
      reasoning: 'Narrative discipline block due to thesis and evidence failure.',
    }
  }

  if (reasons.length >= 2) {
    return {
      narrative_decision: 'NARRATIVE_REVIEW_REQUIRED',
      narrative_severity: 'HIGH',
      narrative_risk_reasons: reasons,
      publish_allowed: false,
      reasoning: 'Narrative discipline requires human review.',
    }
  }

  if (reasons.length === 1) {
    return {
      narrative_decision: 'NARRATIVE_CORRECTION_REQUIRED',
      narrative_severity: 'MEDIUM',
      narrative_risk_reasons: reasons,
      publish_allowed: false,
      reasoning: 'Narrative correction required before publish.',
    }
  }

  return {
    narrative_decision: 'NARRATIVE_PASS',
    narrative_severity: 'LOW',
    narrative_risk_reasons: [],
    publish_allowed: true,
    reasoning: 'Narrative discipline checks passed.',
  }
}
