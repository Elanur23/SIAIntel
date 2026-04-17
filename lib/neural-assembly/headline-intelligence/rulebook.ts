import type {
  HeadlineRuleDefinition,
  HeadlineRuleFamily
} from '../core-types'

const HEADLINE_RULEBOOK: ReadonlyArray<HeadlineRuleDefinition> = [
  {
    ruleId: 'THESIS_DRIFT',
    normalizedReasonCode: 'HEADLINE_THESIS_DRIFT',
    severity: 'HIGH',
    description: 'Headline diverges from article thesis framing or polarity.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Restore headline language to match the core thesis and polarity.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  },
  {
    ruleId: 'EVIDENCE_MISMATCH',
    normalizedReasonCode: 'HEADLINE_EVIDENCE_MISMATCH',
    severity: 'HIGH',
    description: 'Headline claim is not supported by evidence in lead/body anchors.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Align claim wording with evidence-backed statements.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  },
  {
    ruleId: 'UNSUPPORTED_CERTAINTY',
    normalizedReasonCode: 'HEADLINE_UNSUPPORTED_CERTAINTY',
    severity: 'HIGH',
    description: 'Headline uses certainty language without supporting evidence or attribution.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Reduce certainty and add explicit attribution.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  },
  {
    ruleId: 'EMOTIONAL_INFLATION',
    normalizedReasonCode: 'HEADLINE_EMOTIONAL_INFLATION',
    severity: 'MEDIUM',
    description: 'Headline overstates emotional tone beyond article evidence.',
    defaultControlAction: 'CORRECT',
    correctionHint: 'Neutralize emotional adjectives and keep factual framing.',
    escalationClass: 'NONE'
  },
  {
    ruleId: 'PANIC_FRAMING',
    normalizedReasonCode: 'HEADLINE_PANIC_FRAMING',
    severity: 'HIGH',
    description: 'Headline framing can trigger public panic without proportional evidence.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Remove panic language and retain measured risk wording.',
    escalationClass: 'PUBLIC_PANIC_REVIEW'
  },
  {
    ruleId: 'CURIOSITY_GAP',
    normalizedReasonCode: 'HEADLINE_CURIOSITY_GAP',
    severity: 'MEDIUM',
    description: 'Headline withholds key facts to induce deceptive curiosity.',
    defaultControlAction: 'CORRECT',
    correctionHint: 'Include core fact in headline and remove teaser-only framing.',
    escalationClass: 'NONE'
  },
  {
    ruleId: 'CLICKBAIT_TEMPLATE',
    normalizedReasonCode: 'HEADLINE_CLICKBAIT_TEMPLATE',
    severity: 'HIGH',
    description: 'Headline matches known clickbait template patterns.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Replace clickbait structure with descriptive factual title.',
    escalationClass: 'HIGH_TRAFFIC_HIGH_RISK_REVIEW'
  },
  {
    ruleId: 'TITLE_BODY_MISMATCH',
    normalizedReasonCode: 'TITLE_BODY_MISMATCH',
    severity: 'HIGH',
    description: 'Headline materially diverges from body text evidence.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Align title entities and claims with body anchors.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  },
  {
    ruleId: 'TITLE_LEDE_MISMATCH',
    normalizedReasonCode: 'TITLE_LEDE_MISMATCH',
    severity: 'MEDIUM',
    description: 'Headline materially diverges from article lede.',
    defaultControlAction: 'CORRECT',
    correctionHint: 'Make title and lede communicate the same core claim.',
    escalationClass: 'NONE'
  },
  {
    ruleId: 'MISLEADING_NUMBER_OR_DATE',
    normalizedReasonCode: 'HEADLINE_MISLEADING_NUMBER_OR_DATE',
    severity: 'HIGH',
    description: 'Headline number/date fact does not align with article evidence.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Correct or remove unsupported number/date facts.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  },
  {
    ruleId: 'PSEUDO_AUTHORITY_LANGUAGE',
    normalizedReasonCode: 'HEADLINE_PSEUDO_AUTHORITY_LANGUAGE',
    severity: 'MEDIUM',
    description: 'Headline implies authority without verifiable attribution.',
    defaultControlAction: 'CORRECT',
    correctionHint: 'Add clear attribution or remove implied authority language.',
    escalationClass: 'NONE'
  },
  {
    ruleId: 'LEGAL_RISK_LANGUAGE',
    normalizedReasonCode: 'HEADLINE_LEGAL_RISK_LANGUAGE',
    severity: 'HIGH',
    description: 'Headline contains potentially defamatory or legally risky framing.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Use neutral legal-safe phrasing and attribution.',
    escalationClass: 'LEGAL_REVIEW'
  },
  {
    ruleId: 'MARKET_MOVING_RISK',
    normalizedReasonCode: 'HEADLINE_MARKET_MOVING_RISK',
    severity: 'HIGH',
    description: 'Headline framing can move markets without adequate evidence posture.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Remove deterministic market claims and add uncertainty context.',
    escalationClass: 'MARKET_RISK_REVIEW'
  },
  {
    ruleId: 'REGULATORY_MISSTATEMENT',
    normalizedReasonCode: 'HEADLINE_REGULATORY_MISSTATEMENT',
    severity: 'HIGH',
    description: 'Headline appears to misstate policy/regulatory/legal status.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Align regulatory language with verified source facts.',
    escalationClass: 'REGULATORY_REVIEW'
  },
  {
    ruleId: 'MULTILINGUAL_DRIFT',
    normalizedReasonCode: 'HEADLINE_MULTILINGUAL_DRIFT',
    severity: 'HIGH',
    description: 'Localized headline drifts from approved source-anchor meaning.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Re-anchor localized title to source headline invariants.',
    escalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
  },
  {
    ruleId: 'LOCAL_LANGUAGE_EXAGGERATION',
    normalizedReasonCode: 'HEADLINE_LOCAL_LANGUAGE_EXAGGERATION',
    severity: 'MEDIUM',
    description: 'Localized title amplifies certainty/emotion beyond source anchor.',
    defaultControlAction: 'CORRECT',
    correctionHint: 'Reduce local exaggeration and match source confidence level.',
    escalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
  },
  {
    ruleId: 'TITLE_SURFACE_INCONSISTENCY',
    normalizedReasonCode: 'HEADLINE_TITLE_SURFACE_INCONSISTENCY',
    severity: 'HIGH',
    description: 'Editorial/canonical/SEO/OG/social/homepage titles materially conflict.',
    defaultControlAction: 'REVIEW',
    correctionHint: 'Synchronize title surfaces around one thesis-safe canonical meaning.',
    escalationClass: 'SENIOR_EDITOR_REVIEW'
  }
]

export function getHeadlineRulebook(): ReadonlyArray<HeadlineRuleDefinition> {
  return HEADLINE_RULEBOOK
}

export function getHeadlineRuleDefinition(ruleId: HeadlineRuleFamily): HeadlineRuleDefinition {
  const rule = HEADLINE_RULEBOOK.find(candidate => candidate.ruleId === ruleId)
  if (!rule) {
    throw new Error(`HEADLINE_RULE_DEFINITION_MISSING: ${ruleId}`)
  }
  return rule
}
