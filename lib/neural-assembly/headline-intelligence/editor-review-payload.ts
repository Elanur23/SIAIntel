import type {
  HeadlineAssessmentConfidence,
  HeadlineAssessmentRecord,
  HeadlineAssessmentSeverity,
  HeadlineControlAction,
  HeadlineCorrectionRecommendation,
  HeadlineEditorActionType,
  HeadlineEditorCorrectionSuggestion,
  HeadlineEditorEscalationSummary,
  HeadlineEditorFieldPriority,
  HeadlineEditorInternalDebug,
  HeadlineEditorMultilingualSummary,
  HeadlineEditorProvenanceSummary,
  HeadlineEditorReviewActionDefinition,
  HeadlineEditorReviewPayloadV1,
  HeadlineEditorTitleSurfaceSummary,
  HeadlineEditorTopReason,
  HeadlineEditorUrgency,
  HeadlineEscalationClass,
  HeadlineEvidenceRef,
  HeadlineEvidenceRefType,
  HeadlineGateResult,
  HeadlineOverallDecision,
  HeadlineRuleFamily,
  HeadlineRuleHit,
  HeadlineRoutingAction,
  Language
} from '../core-types'

const EDITOR_REVIEW_CONTRACT_VERSION = '1.0.0'

const RULE_TRANSLATIONS: Record<HeadlineRuleFamily, {
  policyLabel: string
  whyItMatters: string
}> = {
  THESIS_DRIFT: {
    policyLabel: 'Headline thesis drift',
    whyItMatters: 'Readers can be misled when the headline reframes the article thesis or polarity.'
  },
  EVIDENCE_MISMATCH: {
    policyLabel: 'Evidence mismatch in headline claim',
    whyItMatters: 'Unsupported headline claims weaken trust and can cause factual disputes.'
  },
  UNSUPPORTED_CERTAINTY: {
    policyLabel: 'Unsupported certainty language',
    whyItMatters: 'Deterministic wording without evidence can overstate conclusions and trigger risk.'
  },
  EMOTIONAL_INFLATION: {
    policyLabel: 'Emotional inflation',
    whyItMatters: 'Inflated tone can distort neutral reporting and degrade editorial credibility.'
  },
  PANIC_FRAMING: {
    policyLabel: 'Panic framing risk',
    whyItMatters: 'Panic language can create disproportionate audience reaction in sensitive topics.'
  },
  CURIOSITY_GAP: {
    policyLabel: 'Curiosity-gap packaging',
    whyItMatters: 'Teaser framing can hide core facts and create misleading expectation.'
  },
  CLICKBAIT_TEMPLATE: {
    policyLabel: 'Clickbait template pattern',
    whyItMatters: 'Template clickbait can violate trust and platform safety expectations.'
  },
  TITLE_BODY_MISMATCH: {
    policyLabel: 'Title-body mismatch',
    whyItMatters: 'Headline/body divergence can materially misstate what the article establishes.'
  },
  TITLE_LEDE_MISMATCH: {
    policyLabel: 'Title-lede mismatch',
    whyItMatters: 'When title and lede diverge, editors lose a reliable evidence anchor for fast review.'
  },
  MISLEADING_NUMBER_OR_DATE: {
    policyLabel: 'Misleading number/date framing',
    whyItMatters: 'Incorrect numeric or date framing can invert interpretation and market/legal posture.'
  },
  PSEUDO_AUTHORITY_LANGUAGE: {
    policyLabel: 'Pseudo-authority wording',
    whyItMatters: 'Implied authority without attribution can create unjustified confidence.'
  },
  LEGAL_RISK_LANGUAGE: {
    policyLabel: 'Legal-risk wording',
    whyItMatters: 'Potentially defamatory framing requires legal-safe phrasing and escalation controls.'
  },
  MARKET_MOVING_RISK: {
    policyLabel: 'Market-moving certainty risk',
    whyItMatters: 'Deterministic market claims can cause outsized impact and require strict review.'
  },
  REGULATORY_MISSTATEMENT: {
    policyLabel: 'Regulatory misstatement risk',
    whyItMatters: 'Incorrect legal/regulatory status can trigger compliance and trust failures.'
  },
  MULTILINGUAL_DRIFT: {
    policyLabel: 'Cross-language drift',
    whyItMatters: 'Localized headlines must preserve source meaning to avoid editorial inconsistency.'
  },
  LOCAL_LANGUAGE_EXAGGERATION: {
    policyLabel: 'Local-language exaggeration',
    whyItMatters: 'Certainty or emotion amplification in one locale can create uneven risk posture.'
  },
  TITLE_SURFACE_INCONSISTENCY: {
    policyLabel: 'Title-surface inconsistency',
    whyItMatters: 'Editorial, SEO, OG, social, and homepage surfaces must not contradict each other.'
  }
}

const ESCALATION_INSTRUCTIONS: Record<HeadlineEscalationClass, string> = {
  NONE: 'No escalation required. Resolve with standard editorial flow.',
  LEGAL_REVIEW: 'Escalate to legal review before publish. Keep neutral and attributed wording.',
  MARKET_RISK_REVIEW: 'Escalate to market-risk review before publish. Remove deterministic market claims.',
  REGULATORY_REVIEW: 'Escalate to regulatory/policy review before publish. Verify legal status language.',
  PUBLIC_PANIC_REVIEW: 'Escalate to senior crisis editor before publish. Remove panic-amplifying framing.',
  MULTILINGUAL_EDITOR_REVIEW: 'Escalate to multilingual editor. Re-anchor localized headlines to source meaning.',
  SENIOR_EDITOR_REVIEW: 'Escalate to senior editor for final review before publish.',
  HIGH_TRAFFIC_HIGH_RISK_REVIEW: 'Escalate to high-traffic risk review desk before publish.'
}

const FIELD_PRIORITY: HeadlineEditorFieldPriority = {
  mandatoryEditorFields: [
    'reviewHeader.batchId',
    'reviewHeader.traceId',
    'reviewHeader.calibrationBand',
    'decisionSummary.oneLineRecommendation',
    'decisionSummary.overallDecision',
    'decisionSummary.urgency',
    'topReasons',
    'topReasons[].offendingSurface',
    'topReasons[].offendingTextSnippet',
    'topReasons[].suggestedFix',
    'escalationSummary.escalationClass'
  ],
  optionalEditorFields: [
    'correctionSuggestions',
    'titleSurfaceSummary',
    'multilingualSummary',
    'provenanceSummary.evidenceRefs',
    'decisionSummary.recommendedAction'
  ],
  internalDebugFields: [
    'internalDebug.rawRuleIds',
    'internalDebug.rawReasonCodes',
    'internalDebug.rawEvidenceByRule',
    'internalDebug.rawCalibration',
    'internalDebug.rawDriftRecords',
    'internalDebug.rawPayloadPointers'
  ]
}

const REVIEW_ACTION_MODEL: ReadonlyArray<HeadlineEditorReviewActionDefinition> = [
  {
    action: 'APPROVE_AS_IS',
    label: 'Approve as-is',
    description: 'No headline intervention required.',
    minimumFields: [
      'decisionSummary.oneLineRecommendation',
      'decisionSummary.overallDecision',
      'topReasons'
    ]
  },
  {
    action: 'ACCEPT_SUGGESTED_FIX',
    label: 'Accept suggested fix',
    description: 'Apply structured correction recommendation without manual rewrite.',
    minimumFields: [
      'topReasons[].suggestedFix',
      'correctionSuggestions',
      'provenanceSummary.evidenceRefs'
    ]
  },
  {
    action: 'MANUAL_REVISION',
    label: 'Manual revision',
    description: 'Editor rewrites headline while preserving source thesis and evidence.',
    minimumFields: [
      'topReasons[].shortExplanation',
      'topReasons[].whyItMatters',
      'provenanceSummary.evidenceRefs'
    ]
  },
  {
    action: 'REQUEST_REWRITE',
    label: 'Request rewrite',
    description: 'Send back for rewrite due to multiple unresolved issues.',
    minimumFields: [
      'decisionSummary.urgency',
      'topReasons',
      'titleSurfaceSummary'
    ]
  },
  {
    action: 'ESCALATE_SENIOR_EDITOR',
    label: 'Escalate to senior editor',
    description: 'Senior editorial arbitration required before publish.',
    minimumFields: [
      'escalationSummary',
      'decisionSummary.holdFromPublish',
      'topReasons'
    ]
  },
  {
    action: 'ESCALATE_LEGAL_REVIEW',
    label: 'Escalate legal review',
    description: 'Legal review is required due to legal-risk language.',
    minimumFields: [
      'escalationSummary.escalationClass',
      'topReasons',
      'provenanceSummary.evidenceRefs'
    ]
  },
  {
    action: 'ESCALATE_MARKET_REVIEW',
    label: 'Escalate market-risk review',
    description: 'Market-risk review is required due to market-moving certainty claims.',
    minimumFields: [
      'escalationSummary.escalationClass',
      'topReasons',
      'decisionSummary.holdFromPublish'
    ]
  },
  {
    action: 'HOLD_FROM_PUBLISH',
    label: 'Hold from publish',
    description: 'Do not publish until remediation or escalation resolution is complete.',
    minimumFields: [
      'decisionSummary.holdFromPublish',
      'decisionSummary.urgency',
      'escalationSummary'
    ]
  }
]

const RAW_PAYLOAD_POINTERS = [
  'gate_payload.headline_assessment_v1',
  'gate_payload.headline_intelligence_v1',
  'gate_payload.reason_code_digest.headline_intelligence_reason_codes',
  'decision_trace_payload.headline_intelligence_v1'
]

const EVIDENCE_LABELS: Record<HeadlineEvidenceRefType, string> = {
  DECISION_DNA_CLAIM_DIGEST: 'Decision DNA claim digest',
  MANIFEST_HASH: 'Manifest hash',
  ARTICLE_THESIS_MARKER: 'Article thesis marker',
  LEDE_ANCHOR: 'Lede anchor',
  BODY_ANCHOR: 'Body anchor',
  LANGUAGE_EDITION_METADATA: 'Language edition metadata',
  TITLE_SURFACE_SOURCE_MAPPING: 'Title surface source mapping',
  TRACE_SIGNAL: 'Trace signal'
}

const ESCALATION_SEVERITY_WEIGHT: Record<HeadlineEscalationClass, number> = {
  NONE: 0,
  MULTILINGUAL_EDITOR_REVIEW: 1,
  SENIOR_EDITOR_REVIEW: 2,
  PUBLIC_PANIC_REVIEW: 3,
  REGULATORY_REVIEW: 4,
  MARKET_RISK_REVIEW: 5,
  LEGAL_REVIEW: 6,
  HIGH_TRAFFIC_HIGH_RISK_REVIEW: 7
}

function severityRank(value: HeadlineAssessmentSeverity): number {
  if (value === 'HIGH') {
    return 3
  }

  if (value === 'MEDIUM') {
    return 2
  }

  return 1
}

function toSnippet(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length === 0) {
    return null
  }

  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact
}

function summarizeEvidenceRef(ref: HeadlineEvidenceRef): string {
  const label = EVIDENCE_LABELS[ref.refType] || ref.refType
  const compactRef = toSnippet(ref.ref) || 'n/a'
  const compactContext = toSnippet(ref.context || '')

  if (compactContext) {
    return `${label}: ${compactRef} (${compactContext})`
  }

  return `${label}: ${compactRef}`
}

function summarizeEvidenceRefs(evidenceRefs: HeadlineEvidenceRef[]): string[] {
  if (evidenceRefs.length === 0) {
    return ['No structured evidence reference captured; use trace and reason code for manual verification.']
  }

  return evidenceRefs.slice(0, 3).map(summarizeEvidenceRef)
}

function resolvePriority(severity: HeadlineAssessmentSeverity): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (severity === 'HIGH') {
    return 'HIGH'
  }

  if (severity === 'MEDIUM') {
    return 'MEDIUM'
  }

  return 'LOW'
}

function dedupeEvidenceRefs(evidenceRefs: HeadlineEvidenceRef[]): HeadlineEvidenceRef[] {
  const seen = new Set<string>()
  const deduped: HeadlineEvidenceRef[] = []

  for (const ref of evidenceRefs) {
    const key = `${ref.refType}:${ref.ref}:${ref.context || ''}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(ref)
  }

  return deduped
}

function resolveFallbackOverallDecision(routingAction: HeadlineRoutingAction): HeadlineOverallDecision {
  if (routingAction === 'CORRECTION_REQUIRED') {
    return 'HEADLINE_CORRECTION_REQUIRED'
  }

  if (routingAction === 'NONE') {
    return 'HEADLINE_PASS'
  }

  return 'HEADLINE_REVIEW_REQUIRED'
}

function resolveHoldFromPublish(
  overallDecision: HeadlineOverallDecision,
  routingAction: HeadlineRoutingAction,
  failClosed: boolean
): boolean {
  if (overallDecision === 'HEADLINE_BLOCK' || overallDecision === 'HEADLINE_REVIEW_REQUIRED') {
    return true
  }

  if (routingAction === 'SUPERVISOR_REVIEW_REQUIRED' || routingAction === 'TERMINAL_REJECT') {
    return true
  }

  return Boolean(failClosed)
}

function resolveUrgency(
  overallDecision: HeadlineOverallDecision,
  severity: HeadlineAssessmentSeverity,
  escalationClass: HeadlineEscalationClass,
  routingAction: HeadlineRoutingAction
): HeadlineEditorUrgency {
  if (
    overallDecision === 'HEADLINE_BLOCK' ||
    escalationClass === 'LEGAL_REVIEW' ||
    escalationClass === 'MARKET_RISK_REVIEW' ||
    escalationClass === 'PUBLIC_PANIC_REVIEW' ||
    escalationClass === 'REGULATORY_REVIEW'
  ) {
    return 'CRITICAL'
  }

  if (
    severity === 'HIGH' ||
    routingAction === 'SUPERVISOR_REVIEW_REQUIRED' ||
    routingAction === 'TERMINAL_REJECT'
  ) {
    return 'HIGH'
  }

  if (severity === 'MEDIUM' || routingAction === 'HUMAN_REVIEW_REQUIRED') {
    return 'MEDIUM'
  }

  return 'LOW'
}

function resolveRecommendedAction(
  overallDecision: HeadlineOverallDecision,
  routingAction: HeadlineRoutingAction,
  escalationClass: HeadlineEscalationClass,
  correctionRecommendations: HeadlineCorrectionRecommendation[],
  holdFromPublish: boolean
): HeadlineEditorActionType {
  if (!holdFromPublish && overallDecision === 'HEADLINE_PASS') {
    return 'APPROVE_AS_IS'
  }

  if (escalationClass === 'LEGAL_REVIEW') {
    return 'ESCALATE_LEGAL_REVIEW'
  }

  if (escalationClass === 'MARKET_RISK_REVIEW') {
    return 'ESCALATE_MARKET_REVIEW'
  }

  if (holdFromPublish && escalationClass !== 'NONE') {
    return 'ESCALATE_SENIOR_EDITOR'
  }

  if (routingAction === 'CORRECTION_REQUIRED') {
    return correctionRecommendations.length > 0 ? 'ACCEPT_SUGGESTED_FIX' : 'MANUAL_REVISION'
  }

  if (routingAction === 'HUMAN_REVIEW_REQUIRED') {
    return 'REQUEST_REWRITE'
  }

  if (routingAction === 'SUPERVISOR_REVIEW_REQUIRED' || routingAction === 'TERMINAL_REJECT') {
    return 'HOLD_FROM_PUBLISH'
  }

  return 'MANUAL_REVISION'
}

function resolveOneLineRecommendation(
  recommendedAction: HeadlineEditorActionType,
  topReason: HeadlineEditorTopReason | null
): string {
  const reasonLabel = topReason?.policyLabel || 'headline policy checks'

  if (recommendedAction === 'APPROVE_AS_IS') {
    return 'Approve as-is. No headline policy intervention required.'
  }

  if (recommendedAction === 'ACCEPT_SUGGESTED_FIX') {
    return `Apply suggested fix before publish. Primary issue: ${reasonLabel}.`
  }

  if (recommendedAction === 'MANUAL_REVISION') {
    return `Revise headline manually before publish. Primary issue: ${reasonLabel}.`
  }

  if (recommendedAction === 'REQUEST_REWRITE') {
    return `Request rewrite and re-review. Primary issue: ${reasonLabel}.`
  }

  if (recommendedAction === 'ESCALATE_LEGAL_REVIEW') {
    return 'Hold from publish and escalate to legal review due to headline risk posture.'
  }

  if (recommendedAction === 'ESCALATE_MARKET_REVIEW') {
    return 'Hold from publish and escalate to market-risk review due to deterministic market claims.'
  }

  if (recommendedAction === 'ESCALATE_SENIOR_EDITOR') {
    return 'Hold from publish and escalate to senior editor for decision arbitration.'
  }

  return 'Hold from publish until escalation resolution is complete.'
}

function sortRuleHits(ruleHits: HeadlineRuleHit[]): HeadlineRuleHit[] {
  return [...ruleHits].sort((left, right) => {
    const severityDiff = severityRank(right.severity) - severityRank(left.severity)
    if (severityDiff !== 0) {
      return severityDiff
    }

    const escalationDiff = ESCALATION_SEVERITY_WEIGHT[right.escalationClass] - ESCALATION_SEVERITY_WEIGHT[left.escalationClass]
    if (escalationDiff !== 0) {
      return escalationDiff
    }

    return left.ruleId.localeCompare(right.ruleId)
  })
}

function buildTopReasons(ruleHits: HeadlineRuleHit[], assessment: HeadlineAssessmentRecord | null): HeadlineEditorTopReason[] {
  const sortedHits = sortRuleHits(ruleHits)

  if (sortedHits.length === 0 && assessment) {
    return [
      {
        rank: 1,
        priority: resolvePriority(assessment.severity),
        ruleId: 'UNMAPPED_REASON',
        reasonCode: assessment.reason_code,
        policyLabel: 'Headline policy review required',
        shortExplanation: 'Headline failed policy checks and requires editorial intervention.',
        whyItMatters: 'The review path is fail-closed and must be resolved before publish.',
        offendingSurface: 'UNKNOWN',
        offendingTextSnippet: null,
        offendingPattern: null,
        language: assessment.source_languages[0] || 'cross-language',
        suggestedFix: 'Align headline to source evidence and remove unsupported certainty.',
        escalationClass: assessment.escalation_class || 'SENIOR_EDITOR_REVIEW',
        evidenceSummary: [
          `Trace signal: ${assessment.decision_id}`,
          `Reason code: ${assessment.reason_code}`
        ]
      }
    ]
  }

  return sortedHits.slice(0, 5).map((hit, index) => {
    const translation = RULE_TRANSLATIONS[hit.ruleId]

    return {
      rank: index + 1,
      priority: resolvePriority(hit.severity),
      ruleId: hit.ruleId,
      reasonCode: hit.normalizedReasonCode,
      policyLabel: translation.policyLabel,
      shortExplanation: toSnippet(hit.explanation) || translation.policyLabel,
      whyItMatters: translation.whyItMatters,
      offendingSurface: hit.offendingSurface || hit.affectedSurface || 'UNKNOWN',
      offendingTextSnippet: toSnippet(hit.offendingText),
      offendingPattern: toSnippet(hit.offendingPattern),
      language: hit.language,
      suggestedFix: hit.suggestedFix,
      escalationClass: hit.escalationClass,
      evidenceSummary: summarizeEvidenceRefs(hit.evidenceRefs)
    }
  })
}

function mapCorrectionSuggestions(
  correctionRecommendations: HeadlineCorrectionRecommendation[]
): HeadlineEditorCorrectionSuggestion[] {
  return correctionRecommendations.slice(0, 8).map(item => ({
    recommendationId: item.recommendationId,
    priority: item.priority,
    action: item.action,
    targetSurface: item.targetSurface,
    rationale: item.rationale,
    affectedRules: item.affectedRuleIds,
    ruleMappingEvidence: item.ruleMappingEvidence || []
  }))
}

function buildTitleSurfaceSummary(gateResult: HeadlineGateResult | null): HeadlineEditorTitleSurfaceSummary {
  if (!gateResult) {
    return {
      visibility: 'EDITOR_OPTIONAL',
      status: 'NOT_EVALUATED',
      sharedThesisScore: null,
      inconsistentPairCount: 0,
      problematicPairs: [],
      editorNote: 'Title-surface analysis is unavailable for this decision payload.'
    }
  }

  const inconsistentPairs = gateResult.titleSurfaceAssessment.inconsistentPairs || []
  const status = inconsistentPairs.length > 0 ? 'DIVERGENT' : 'ALIGNED'

  return {
    visibility: 'EDITOR_OPTIONAL',
    status,
    sharedThesisScore: gateResult.titleSurfaceAssessment.sharedThesisScore,
    inconsistentPairCount: inconsistentPairs.length,
    problematicPairs: inconsistentPairs.slice(0, 5),
    editorNote: status === 'DIVERGENT'
      ? `Detected ${inconsistentPairs.length} title-surface inconsistency pair(s). Prioritize canonical/editorial alignment.`
      : 'Editorial, SEO, OG, social, and homepage surfaces remain aligned.'
  }
}

function buildMultilingualSummary(gateResult: HeadlineGateResult | null): HeadlineEditorMultilingualSummary {
  if (!gateResult) {
    return {
      visibility: 'EDITOR_OPTIONAL',
      status: 'NOT_EVALUATED',
      sourceLanguage: 'unknown',
      impactedLanguages: [],
      highRiskLanguages: [],
      maxDriftScore: null,
      driftHighlights: [],
      editorNote: 'Multilingual drift analysis is unavailable for this decision payload.'
    }
  }

  const records = gateResult.multilingualAssessment.driftByLanguage.filter(
    item => item.language !== gateResult.multilingualAssessment.sourceLanguage
  )

  const impacted = records.filter(item => (
    item.action !== 'ALLOW' ||
    item.driftClass !== 'LOW' ||
    item.certaintyAmplification ||
    item.localExaggeration
  ))

  const highRisk = impacted.filter(item => (
    item.action === 'REVIEW' || item.driftClass === 'HIGH' || item.localExaggeration
  ))

  const maxDriftScore = records.length > 0
    ? Math.max(...records.map(item => item.driftScore))
    : null

  const driftHighlights = impacted
    .sort((left, right) => right.driftScore - left.driftScore)
    .slice(0, 5)
    .map(item => ({
      language: item.language,
      driftClass: item.driftClass,
      driftScore: item.driftScore,
      certaintyAmplification: item.certaintyAmplification,
      localExaggeration: item.localExaggeration,
      action: item.action,
      summary: item.violatedInvariants.length > 0
        ? `Violated invariants: ${item.violatedInvariants.join(', ')}`
        : 'Drift exceeded pair threshold without invariant break.'
    }))

  return {
    visibility: 'EDITOR_OPTIONAL',
    status: impacted.length > 0 ? 'DRIFT_DETECTED' : 'STABLE',
    sourceLanguage: gateResult.multilingualAssessment.sourceLanguage,
    impactedLanguages: impacted.map(item => item.language),
    highRiskLanguages: highRisk.map(item => item.language),
    maxDriftScore,
    driftHighlights,
    editorNote: impacted.length > 0
      ? 'Localized headline drift detected. Re-anchor translations to source-language thesis and certainty level.'
      : 'Localized headlines are stable relative to source-language meaning.'
  }
}

function buildEscalationSummary(
  escalationClass: HeadlineEscalationClass,
  escalationRequired: boolean,
  topReason: HeadlineEditorTopReason | null
): HeadlineEditorEscalationSummary {
  const reason = topReason
    ? `${topReason.policyLabel} (${topReason.reasonCode})`
    : 'No escalation trigger identified from rule-level payload.'

  return {
    visibility: 'EDITOR_MANDATORY',
    escalationRequired,
    escalationClass,
    escalationReason: reason,
    escalationInstruction: ESCALATION_INSTRUCTIONS[escalationClass] || ESCALATION_INSTRUCTIONS.NONE
  }
}

function buildProvenanceSummary(
  traceId: string,
  assessment: HeadlineAssessmentRecord | null,
  topReasons: HeadlineEditorTopReason[],
  ruleHits: HeadlineRuleHit[]
): HeadlineEditorProvenanceSummary {
  const sourceReasonCodes = assessment?.source_reason_codes && assessment.source_reason_codes.length > 0
    ? assessment.source_reason_codes
    : topReasons.map(item => item.reasonCode)

  const sourceGateIds = assessment?.source_gate_ids && assessment.source_gate_ids.length > 0
    ? assessment.source_gate_ids
    : ['HEADLINE_INTELLIGENCE_OPERATING_LAYER_V1']

  const evidenceRefs = dedupeEvidenceRefs(ruleHits.flatMap(hit => hit.evidenceRefs)).slice(0, 12)

  return {
    visibility: 'EDITOR_OPTIONAL',
    decisionId: assessment?.decision_id || null,
    traceId,
    sourceGateIds,
    sourceReasonCodes: Array.from(new Set(sourceReasonCodes)),
    evidenceRefs
  }
}

function buildInternalDebug(gateResult: HeadlineGateResult | null): HeadlineEditorInternalDebug {
  return {
    visibility: 'INTERNAL_DEBUG_ONLY',
    rawRuleIds: (gateResult?.ruleHits || []).map(hit => hit.ruleId),
    rawReasonCodes: (gateResult?.ruleHits || []).map(hit => hit.normalizedReasonCode),
    rawEvidenceByRule: (gateResult?.ruleHits || []).map(hit => ({
      ruleId: hit.ruleId,
      evidenceRefs: hit.evidenceRefs
    })),
    rawCalibration: {
      profileId: gateResult?.calibrationProfileId || null,
      titleSurface: gateResult?.calibration?.titleSurface || null,
      multilingual: gateResult?.calibration?.multilingual || null,
      escalation: gateResult?.calibration?.escalation || null
    },
    rawDriftRecords: gateResult?.multilingualAssessment?.driftByLanguage || [],
    rawPayloadPointers: RAW_PAYLOAD_POINTERS
  }
}

export interface BuildHeadlineEditorReviewPayloadInput {
  batchId: string
  traceId: string
  auditId: string
  decisionDnaAuditId?: string | null
  headlineGateResult: HeadlineGateResult | null
  headlineAssessment: HeadlineAssessmentRecord | null
  includeInternalDebug?: boolean
}

export function buildHeadlineEditorReviewPayload(
  input: BuildHeadlineEditorReviewPayloadInput
): HeadlineEditorReviewPayloadV1 | null {
  const gateResult = input.headlineGateResult || input.headlineAssessment?.headline_gate_result || null

  if (!gateResult && !input.headlineAssessment) {
    return null
  }

  const overallDecision = gateResult
    ? gateResult.overallDecision
    : resolveFallbackOverallDecision(input.headlineAssessment?.routing_action || 'HUMAN_REVIEW_REQUIRED')

  const routingAction = input.headlineAssessment?.routing_action
    || (overallDecision === 'HEADLINE_PASS'
      ? 'NONE'
      : overallDecision === 'HEADLINE_CORRECTION_REQUIRED'
        ? 'CORRECTION_REQUIRED'
        : 'HUMAN_REVIEW_REQUIRED')

  const severity: HeadlineAssessmentSeverity = input.headlineAssessment?.severity
    || ((gateResult?.ruleHits || []).some(hit => hit.severity === 'HIGH')
      ? 'HIGH'
      : (gateResult?.ruleHits || []).some(hit => hit.severity === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW')

  const confidence: HeadlineAssessmentConfidence = input.headlineAssessment?.confidence
    || ((gateResult?.ruleHits || []).length >= 4
      ? 'HIGH'
      : (gateResult?.ruleHits || []).length >= 2
        ? 'MEDIUM'
        : 'LOW')

  const escalationClass = input.headlineAssessment?.escalation_class
    || gateResult?.escalationClass
    || 'NONE'

  const correctionRecommendations = gateResult?.correctionRecommendations || []
  const ruleHits = gateResult?.ruleHits || input.headlineAssessment?.rule_hits || []
  const topReasons = buildTopReasons(ruleHits, input.headlineAssessment)

  const holdFromPublish = resolveHoldFromPublish(
    overallDecision,
    routingAction,
    Boolean(input.headlineAssessment?.fail_closed)
  )

  const escalationRequired = escalationClass !== 'NONE' || holdFromPublish || routingAction === 'HUMAN_REVIEW_REQUIRED'

  const recommendedAction = resolveRecommendedAction(
    overallDecision,
    routingAction,
    escalationClass,
    correctionRecommendations,
    holdFromPublish
  )

  const payload: HeadlineEditorReviewPayloadV1 = {
    reviewHeader: {
      contractVersion: EDITOR_REVIEW_CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      batchId: input.batchId,
      traceId: input.traceId,
      auditId: input.auditId,
      decisionDnaAuditId: input.decisionDnaAuditId || null,
      sourceGate: 'HEADLINE_INTELLIGENCE_OPERATING_LAYER_V1',
      operationalMode: gateResult?.operationalMode || 'UNKNOWN',
      calibrationBand: gateResult?.calibrationBand || 'UNKNOWN',
      calibrationProfileId: gateResult?.calibrationProfileId || null,
      category: gateResult?.category || null,
      articleType: gateResult?.articleType || 'UNKNOWN'
    },
    decisionSummary: {
      oneLineRecommendation: resolveOneLineRecommendation(recommendedAction, topReasons[0] || null),
      overallDecision,
      routingAction,
      severity,
      confidence,
      urgency: resolveUrgency(overallDecision, severity, escalationClass, routingAction),
      holdFromPublish,
      escalationRequired,
      escalationClass,
      recommendedAction
    },
    topReasons,
    correctionSuggestions: mapCorrectionSuggestions(correctionRecommendations),
    titleSurfaceSummary: buildTitleSurfaceSummary(gateResult),
    multilingualSummary: buildMultilingualSummary(gateResult),
    escalationSummary: buildEscalationSummary(escalationClass, escalationRequired, topReasons[0] || null),
    provenanceSummary: buildProvenanceSummary(input.traceId, input.headlineAssessment, topReasons, ruleHits),
    fieldPriority: FIELD_PRIORITY,
    reviewActionModel: [...REVIEW_ACTION_MODEL]
  }

  if (input.includeInternalDebug !== false) {
    payload.internalDebug = buildInternalDebug(gateResult)
  }

  return payload
}
