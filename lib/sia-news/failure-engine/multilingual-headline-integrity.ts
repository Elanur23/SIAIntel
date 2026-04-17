export interface MultilingualHeadlineVariant {
  language: string
  headline_intensity_score: number
  certainty_language_detected: boolean
  clickbait_detected: boolean
  emotional_language_detected: boolean
  thesis_alignment_passed: boolean
  confidence_signal_present: boolean
  discover_safety_passed: boolean
  has_core_entity_preservation: boolean
  has_numeric_consistency: boolean
}

export interface MultilingualHeadlineInput {
  base_language: string
  expected_languages: string[]
  sensitive_topic: boolean
  variants: MultilingualHeadlineVariant[]
}

export interface MultilingualHeadlineResult {
  decision:
    | 'MULTILINGUAL_HEADLINE_PASS'
    | 'MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED'
    | 'MULTILINGUAL_HEADLINE_REVIEW_REQUIRED'
    | 'MULTILINGUAL_HEADLINE_BLOCK'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  risk_reasons: string[]
  publish_allowed: boolean
  reasoning: string
}

export function runMultilingualHeadlineIntegrityEngine(
  input: MultilingualHeadlineInput
): MultilingualHeadlineResult {
  const riskReasons: string[] = []

  const hasClickbait = input.variants.some((variant) => variant.clickbait_detected)
  const hasCertainty = input.variants.some((variant) => variant.certainty_language_detected)
  const hasAlignmentFailure = input.variants.some((variant) => !variant.thesis_alignment_passed)

  if (hasAlignmentFailure && hasCertainty) {
    riskReasons.push('THESIS_ALIGNMENT_AND_CERTAINTY_FAILURE')
    return {
      decision: 'MULTILINGUAL_HEADLINE_BLOCK',
      severity: 'CRITICAL',
      risk_reasons: riskReasons,
      publish_allowed: false,
      reasoning: 'Critical multilingual headline integrity failure.',
    }
  }

  if (hasCertainty) {
    riskReasons.push('UNSUPPORTED_CERTAINTY_DETECTED')
    return {
      decision: 'MULTILINGUAL_HEADLINE_REVIEW_REQUIRED',
      severity: 'HIGH',
      risk_reasons: riskReasons,
      publish_allowed: false,
      reasoning: 'Certainty language requires human review.',
    }
  }

  if (hasClickbait || hasAlignmentFailure) {
    riskReasons.push('SURFACE_DRIFT_DETECTED')
    return {
      decision: 'MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED',
      severity: 'MEDIUM',
      risk_reasons: riskReasons,
      publish_allowed: false,
      reasoning: 'Headline requires correction for consistency.',
    }
  }

  return {
    decision: 'MULTILINGUAL_HEADLINE_PASS',
    severity: 'LOW',
    risk_reasons: [],
    publish_allowed: true,
    reasoning: 'Headline integrity checks passed.',
  }
}
