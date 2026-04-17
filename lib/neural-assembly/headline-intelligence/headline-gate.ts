import type {
  BatchJob,
  ChiefEditorDecision,
  HeadlineArticleType,
  HeadlineCalibrationBand,
  HeadlineAssessmentConfidence,
  HeadlineAssessmentRecord,
  HeadlineAssessmentSeverity,
  HeadlineCorrectionRecommendation,
  HeadlineEscalationClass,
  HeadlineEvidenceRef,
  HeadlineGateResult,
  HeadlineRuleFamily,
  HeadlineRuleHit,
  HeadlineScoreDimension,
  HeadlineOperationalMode,
  Language,
  MasterIntelligenceCore,
  TitleSurfaceName
} from '../core-types'
import { getHeadlineRuleDefinition } from './rulebook'
import {
  resolveHeadlineCalibrationProfile,
  resolveHeadlineOperationalMode,
  type ResolvedHeadlineCalibrationProfile
} from './calibration-config'
import {
  computeWeightedCompositeScore,
  getHeadlineDimensionDefinitions,
  resolveHeadlineArticleType,
  resolveHeadlineDimensionStatus,
  type HeadlineDimensionDefinition
} from './score-model'
import { resolveHeadlineTitleSurfaceAssessment } from './title-surface-resolver'
import { evaluateHeadlineMultilingualAssessment } from './multilingual-anchor'

const ESCALATION_PRIORITY: Record<HeadlineEscalationClass, number> = {
  NONE: 0,
  MULTILINGUAL_EDITOR_REVIEW: 1,
  SENIOR_EDITOR_REVIEW: 2,
  PUBLIC_PANIC_REVIEW: 3,
  REGULATORY_REVIEW: 4,
  MARKET_RISK_REVIEW: 5,
  LEGAL_REVIEW: 6,
  HIGH_TRAFFIC_HIGH_RISK_REVIEW: 7
}

const ROUTING_ESCALATION_TO_SUPERVISOR = new Set<HeadlineEscalationClass>([
  'LEGAL_REVIEW',
  'MARKET_RISK_REVIEW',
  'REGULATORY_REVIEW',
  'PUBLIC_PANIC_REVIEW',
  'HIGH_TRAFFIC_HIGH_RISK_REVIEW'
])

const CERTAINTY_MARKERS = [
  'guaranteed',
  'certain',
  'certainly',
  'definitive',
  'no risk',
  'always',
  '100%'
]

const EMOTIONAL_MARKERS = [
  'shocking',
  'explosive',
  'bombshell',
  'stunning',
  'dramatic'
]

const PANIC_MARKERS = [
  'panic',
  'meltdown',
  'collapse',
  'catastrophic',
  'crash',
  'emergency'
]

const CURIOSITY_PATTERNS = [
  /you\s+won'?t\s+believe/i,
  /what\s+happens\s+next/i,
  /the\s+truth\s+about/i,
  /this\s+one\s+thing/i,
  /\?$/
]

const CLICKBAIT_PATTERNS = [
  /^\d+\s+reasons\s+/i,
  /\bwill\s+change\s+everything\b/i,
  /\bbreaks\s+the\s+internet\b/i,
  /\bsecret\b/i,
  /\bmust\s+see\b/i
]

const PSEUDO_AUTHORITY_PATTERNS = [
  /experts\s+say/i,
  /insiders\s+reveal/i,
  /sources\s+confirm/i,
  /top\s+officials\s+admit/i
]

const ATTRIBUTION_PATTERNS = [
  /according\s+to/i,
  /data\s+from/i,
  /reported\s+by/i,
  /statement\s+from/i,
  /filing\s+shows/i
]

const LEGAL_RISK_PATTERNS = [
  /fraudster/i,
  /criminal\s+scheme/i,
  /guilty\s+of/i,
  /scam\s+operation/i,
  /illegal\s+plot/i
]

const MARKET_MOVING_PATTERNS = [
  /will\s+surge/i,
  /will\s+crash/i,
  /guaranteed\s+rally/i,
  /inevitable\s+selloff/i,
  /price\s+target\s+today/i
]

const REGULATORY_PATTERNS = [
  /regulator\s+approved/i,
  /officially\s+banned/i,
  /law\s+is\s+now\s+in\s+effect/i,
  /court\s+confirmed/i
]

const DIMENSION_PENALTIES: Record<HeadlineScoreDimension, Partial<Record<HeadlineRuleFamily, number>>> = {
  thesisFidelity: {
    THESIS_DRIFT: 48,
    TITLE_BODY_MISMATCH: 28,
    TITLE_LEDE_MISMATCH: 20
  },
  evidenceAlignment: {
    EVIDENCE_MISMATCH: 45,
    MISLEADING_NUMBER_OR_DATE: 42,
    TITLE_BODY_MISMATCH: 24
  },
  entityAccuracy: {
    EVIDENCE_MISMATCH: 30,
    MULTILINGUAL_DRIFT: 25
  },
  numberDateAccuracy: {
    MISLEADING_NUMBER_OR_DATE: 50,
    MULTILINGUAL_DRIFT: 24
  },
  attributionQuality: {
    UNSUPPORTED_CERTAINTY: 30,
    PSEUDO_AUTHORITY_LANGUAGE: 35
  },
  clarity: {
    CURIOSITY_GAP: 20,
    CLICKBAIT_TEMPLATE: 28
  },
  specificity: {
    CURIOSITY_GAP: 20,
    TITLE_LEDE_MISMATCH: 18
  },
  credibility: {
    UNSUPPORTED_CERTAINTY: 28,
    CLICKBAIT_TEMPLATE: 25,
    PSEUDO_AUTHORITY_LANGUAGE: 30,
    LEGAL_RISK_LANGUAGE: 35
  },
  emotionalRestraint: {
    EMOTIONAL_INFLATION: 35,
    PANIC_FRAMING: 40,
    LOCAL_LANGUAGE_EXAGGERATION: 20
  },
  platformSafety: {
    CLICKBAIT_TEMPLATE: 36,
    PANIC_FRAMING: 35,
    LEGAL_RISK_LANGUAGE: 35,
    REGULATORY_MISSTATEMENT: 35,
    MARKET_MOVING_RISK: 35
  },
  curiosityWithoutDeception: {
    CURIOSITY_GAP: 35,
    CLICKBAIT_TEMPLATE: 40
  },
  titleIntegrity: {
    TITLE_SURFACE_INCONSISTENCY: 45,
    TITLE_BODY_MISMATCH: 28,
    TITLE_LEDE_MISMATCH: 20
  },
  multilingualPortability: {
    MULTILINGUAL_DRIFT: 45,
    LOCAL_LANGUAGE_EXAGGERATION: 30
  },
  categoryAppropriateness: {
    MARKET_MOVING_RISK: 35,
    REGULATORY_MISSTATEMENT: 32,
    LEGAL_RISK_LANGUAGE: 32,
    PANIC_FRAMING: 32
  },
  articleTypeAppropriateness: {
    PANIC_FRAMING: 30,
    UNSUPPORTED_CERTAINTY: 28,
    CLICKBAIT_TEMPLATE: 30,
    TITLE_SURFACE_INCONSISTENCY: 22
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function upperText(value: string): string {
  return normalizeText(value).toUpperCase()
}

function tokenize(value: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'will', 'your', 'their',
    'news', 'update', 'report', 'analysis', 'today', 'global', 'market'
  ])

  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !stopWords.has(token))
}

function overlapScore(left: string, right: string): number {
  const leftTokens = tokenize(left)
  const rightTokens = new Set(tokenize(right))

  if (leftTokens.length === 0 || rightTokens.size === 0) {
    return 0
  }

  let overlap = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1
    }
  }

  return Number((overlap / leftTokens.length).toFixed(2))
}

function extractNumericTokens(value: string): string[] {
  return (value.match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(token => token.toUpperCase())
}

function extractDateTokens(value: string): string[] {
  const matches = value.match(/\b(?:20\d{2}|19\d{2}|Q[1-4]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/gi)
  return (matches || []).map(token => token.toUpperCase())
}

interface DetectedPattern {
  pattern: string
  matchedText: string
}

function findPatternMatch(value: string, patterns: RegExp[]): DetectedPattern | null {
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match && typeof match[0] === 'string') {
      return {
        pattern: pattern.source,
        matchedText: match[0]
      }
    }
  }

  return null
}

function findLexicalMarker(value: string, markers: string[]): string | null {
  const normalized = normalizeText(value).toLowerCase()
  for (const marker of markers) {
    if (normalized.includes(marker)) {
      return marker
    }
  }

  return null
}

function dedupeRuleHits(ruleHits: HeadlineRuleHit[]): HeadlineRuleHit[] {
  const seen = new Set<string>()
  const deduped: HeadlineRuleHit[] = []

  for (const hit of ruleHits) {
    const key = `${hit.ruleId}:${hit.language}:${hit.affectedSurface}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(hit)
  }

  return deduped
}

function rankSeverity(severity: HeadlineAssessmentSeverity): number {
  if (severity === 'HIGH') {
    return 3
  }
  if (severity === 'MEDIUM') {
    return 2
  }
  return 1
}

function resolveTopSeverity(ruleHits: HeadlineRuleHit[]): HeadlineAssessmentSeverity {
  if (ruleHits.some(hit => hit.severity === 'HIGH')) {
    return 'HIGH'
  }
  if (ruleHits.some(hit => hit.severity === 'MEDIUM')) {
    return 'MEDIUM'
  }
  return 'LOW'
}

function resolveConfidence(ruleHits: HeadlineRuleHit[]): HeadlineAssessmentConfidence {
  if (ruleHits.length >= 4) {
    return 'HIGH'
  }
  if (ruleHits.length >= 2) {
    return 'MEDIUM'
  }
  return 'LOW'
}

function resolveEscalationClass(ruleHits: HeadlineRuleHit[]): HeadlineEscalationClass {
  let selected: HeadlineEscalationClass = 'NONE'
  let score = 0

  for (const hit of ruleHits) {
    const current = ESCALATION_PRIORITY[hit.escalationClass]
    if (current > score) {
      selected = hit.escalationClass
      score = current
    }
  }

  return selected
}

function makeBaseEvidenceRefs(
  batch: BatchJob,
  decision: ChiefEditorDecision,
  mic: MasterIntelligenceCore,
  sourceLanguage: Language,
  sourceHeadline: string,
  lead: string,
  body: string
): HeadlineEvidenceRef[] {
  const refs: HeadlineEvidenceRef[] = []

  const claimDigest = decision.truth_gate?.provenance_binding?.claim_graph_digest_prefix
  if (claimDigest) {
    refs.push({
      refType: 'DECISION_DNA_CLAIM_DIGEST',
      ref: claimDigest,
      context: 'truth_gate.provenance_binding.claim_graph_digest_prefix'
    })
  }

  if (decision.manifest_hash) {
    refs.push({
      refType: 'MANIFEST_HASH',
      ref: decision.manifest_hash,
      context: 'chief_editor_manifest_hash'
    })
  }

  const thesis = normalizeText(mic?.structural_atoms?.core_thesis)
  if (thesis.length > 0) {
    refs.push({
      refType: 'ARTICLE_THESIS_MARKER',
      ref: thesis,
      context: 'mic.structural_atoms.core_thesis'
    })
  }

  if (lead.length > 0) {
    refs.push({
      refType: 'LEDE_ANCHOR',
      ref: lead.slice(0, 180),
      context: `language=${sourceLanguage}`
    })
  }

  if (body.length > 0) {
    refs.push({
      refType: 'BODY_ANCHOR',
      ref: body.slice(0, 180),
      context: `language=${sourceLanguage}`
    })
  }

  const edition = batch.editions[sourceLanguage]
  const metadataRef = edition
    ? `category=${edition.metadata?.category || 'unknown'};region=${edition.metadata?.region || 'unknown'}`
    : 'category=unknown;region=unknown'

  refs.push({
    refType: 'LANGUAGE_EDITION_METADATA',
    ref: metadataRef,
    context: `language=${sourceLanguage}`
  })

  refs.push({
    refType: 'TRACE_SIGNAL',
    ref: decision.decision_trace?.trace_id || 'trace-unavailable',
    context: 'decision_trace.trace_id'
  })

  refs.push({
    refType: 'TITLE_SURFACE_SOURCE_MAPPING',
    ref: sourceHeadline,
    context: 'source editorial headline'
  })

  return refs
}

function createRuleHit(
  ruleId: HeadlineRuleFamily,
  explanation: string,
  affectedSurface: TitleSurfaceName | 'MULTILINGUAL_LAYER',
  language: Language | 'cross-language',
  evidenceRefs: HeadlineEvidenceRef[],
  options?: {
    offendingSurface?: TitleSurfaceName | 'MULTILINGUAL_LAYER'
    offendingText?: string
    offendingPattern?: string
  }
): HeadlineRuleHit {
  const definition = getHeadlineRuleDefinition(ruleId)

  return {
    ruleId,
    normalizedReasonCode: definition.normalizedReasonCode,
    severity: definition.severity,
    explanation,
    affectedSurface,
    offendingSurface: options?.offendingSurface,
    offendingText: options?.offendingText,
    offendingPattern: options?.offendingPattern,
    language,
    evidenceRefs,
    suggestedFix: definition.correctionHint,
    escalationClass: definition.escalationClass
  }
}

function getFallbackReasonCode(overallDecision: HeadlineGateResult['overallDecision']): string {
  if (overallDecision === 'HEADLINE_BLOCK') {
    return 'HEADLINE_GATE_BLOCKED'
  }
  if (overallDecision === 'HEADLINE_REVIEW_REQUIRED') {
    return 'HEADLINE_GATE_REVIEW_REQUIRED'
  }
  return 'HEADLINE_GATE_CORRECTION_REQUIRED'
}

function evaluateRuleHits(
  batch: BatchJob,
  decision: ChiefEditorDecision,
  mic: MasterIntelligenceCore,
  sourceLanguage: Language,
  sourceHeadline: string,
  lead: string,
  body: string,
  articleType: HeadlineArticleType,
  calibrationProfile: ResolvedHeadlineCalibrationProfile
): {
  titleSurfaceAssessment: ReturnType<typeof resolveHeadlineTitleSurfaceAssessment>
  multilingualAssessment: ReturnType<typeof evaluateHeadlineMultilingualAssessment>
  ruleHits: HeadlineRuleHit[]
} {
  const sourceEdition = batch.editions[sourceLanguage]
  const titleSurfaceAssessment = resolveHeadlineTitleSurfaceAssessment(
    sourceEdition,
    calibrationProfile.titleSurface
  )
  const multilingualAssessment = evaluateHeadlineMultilingualAssessment(
    batch,
    sourceLanguage,
    articleType,
    calibrationProfile.multilingual
  )

  const bodyComposite = `${lead} ${body}`
  const bodyUpper = upperText(bodyComposite)

  const thesis = normalizeText(mic?.structural_atoms?.core_thesis)
  const thesisScore = overlapScore(sourceHeadline, thesis)
  const headlineToBodyScore = overlapScore(sourceHeadline, bodyComposite)
  const headlineToLedeScore = overlapScore(sourceHeadline, lead)

  const thesisDriftThreshold = Math.max(0.16, calibrationProfile.titleSurface.minLexicalOverlap - 0.18)
  const evidenceMismatchThreshold = Math.max(0.14, calibrationProfile.titleSurface.minLexicalOverlap - 0.2)
  const titleBodyMismatchThreshold = Math.max(0.18, calibrationProfile.titleSurface.minLexicalOverlap - 0.12)
  const titleLedeMismatchThreshold = Math.max(0.16, calibrationProfile.titleSurface.minLexicalOverlap - 0.14)

  const headlineNumbers = extractNumericTokens(sourceHeadline)
  const bodyNumbers = new Set(extractNumericTokens(bodyComposite))
  const headlineDates = extractDateTokens(sourceHeadline)
  const bodyDates = new Set(extractDateTokens(bodyComposite))

  const missingNumbers = headlineNumbers.filter(token => !bodyNumbers.has(token))
  const missingDates = headlineDates.filter(token => !bodyDates.has(token))

  const certaintyMarker = findLexicalMarker(sourceHeadline, CERTAINTY_MARKERS)
  const emotionalMarker = findLexicalMarker(sourceHeadline, EMOTIONAL_MARKERS)
  const panicMarker = findLexicalMarker(sourceHeadline, PANIC_MARKERS)
  const curiosityPattern = findPatternMatch(sourceHeadline, CURIOSITY_PATTERNS)
  const clickbaitPattern = findPatternMatch(sourceHeadline, CLICKBAIT_PATTERNS)
  const pseudoAuthorityPattern = findPatternMatch(sourceHeadline, PSEUDO_AUTHORITY_PATTERNS)
  const attributionPattern = findPatternMatch(`${sourceHeadline} ${lead} ${body}`, ATTRIBUTION_PATTERNS)
  const legalRiskPattern = findPatternMatch(sourceHeadline, LEGAL_RISK_PATTERNS)
  const marketRiskPattern = findPatternMatch(sourceHeadline, MARKET_MOVING_PATTERNS)
  const regulatoryPattern = findPatternMatch(sourceHeadline, REGULATORY_PATTERNS)
  const hasAttribution = attributionPattern !== null

  const evidenceRefs = makeBaseEvidenceRefs(
    batch,
    decision,
    mic,
    sourceLanguage,
    sourceHeadline,
    lead,
    body
  )

  const hits: HeadlineRuleHit[] = []

  if (thesisScore < thesisDriftThreshold) {
    hits.push(
      createRuleHit(
        'THESIS_DRIFT',
        `Headline-thesis lexical alignment is low (${thesisScore}).`,
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline
        }
      )
    )
  }

  if (headlineToBodyScore < evidenceMismatchThreshold) {
    hits.push(
      createRuleHit(
        'EVIDENCE_MISMATCH',
        `Headline-body alignment score is below threshold (${headlineToBodyScore}).`,
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline
        }
      )
    )
  }

  if (certaintyMarker && !hasAttribution) {
    hits.push(
      createRuleHit(
        'UNSUPPORTED_CERTAINTY',
        'Headline certainty marker appears without attribution signal.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline,
          offendingPattern: certaintyMarker
        }
      )
    )
  }

  if (emotionalMarker) {
    hits.push(
      createRuleHit(
        'EMOTIONAL_INFLATION',
        'Headline includes emotional inflation markers.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline,
          offendingPattern: emotionalMarker
        }
      )
    )
  }

  if (panicMarker) {
    hits.push(
      createRuleHit(
        'PANIC_FRAMING',
        'Headline includes panic framing lexicon.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline,
          offendingPattern: panicMarker
        }
      )
    )
  }

  if (curiosityPattern) {
    hits.push(
      createRuleHit(
        'CURIOSITY_GAP',
        'Headline structure uses curiosity-gap phrasing.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: curiosityPattern.matchedText,
          offendingPattern: curiosityPattern.pattern
        }
      )
    )
  }

  if (clickbaitPattern) {
    hits.push(
      createRuleHit(
        'CLICKBAIT_TEMPLATE',
        'Headline matches clickbait template pattern.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: clickbaitPattern.matchedText,
          offendingPattern: clickbaitPattern.pattern
        }
      )
    )
  }

  if (headlineToBodyScore < titleBodyMismatchThreshold) {
    hits.push(
      createRuleHit(
        'TITLE_BODY_MISMATCH',
        `Title-body mismatch detected with overlap ${headlineToBodyScore}.`,
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline
        }
      )
    )
  }

  if (headlineToLedeScore < titleLedeMismatchThreshold) {
    hits.push(
      createRuleHit(
        'TITLE_LEDE_MISMATCH',
        `Title-lede mismatch detected with overlap ${headlineToLedeScore}.`,
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: sourceHeadline
        }
      )
    )
  }

  if (missingNumbers.length > 0 || missingDates.length > 0) {
    const unsupportedFacts = [
      ...missingNumbers.map(token => `number:${token}`),
      ...missingDates.map(token => `date:${token}`)
    ]

    hits.push(
      createRuleHit(
        'MISLEADING_NUMBER_OR_DATE',
        `Headline references unsupported numeric/date facts: numbers=${missingNumbers.join(',') || 'none'} dates=${missingDates.join(',') || 'none'}.`,
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: unsupportedFacts.join(' | ') || sourceHeadline,
          offendingPattern: unsupportedFacts.join(',')
        }
      )
    )
  }

  if (pseudoAuthorityPattern && !hasAttribution) {
    hits.push(
      createRuleHit(
        'PSEUDO_AUTHORITY_LANGUAGE',
        'Pseudo-authority phrase appears without verifiable attribution.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: pseudoAuthorityPattern.matchedText,
          offendingPattern: pseudoAuthorityPattern.pattern
        }
      )
    )
  }

  if (legalRiskPattern) {
    hits.push(
      createRuleHit(
        'LEGAL_RISK_LANGUAGE',
        'Headline contains potentially defamatory legal-risk framing.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: legalRiskPattern.matchedText,
          offendingPattern: legalRiskPattern.pattern
        }
      )
    )
  }

  if (marketRiskPattern) {
    hits.push(
      createRuleHit(
        'MARKET_MOVING_RISK',
        'Headline contains deterministic market-moving language.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: marketRiskPattern.matchedText,
          offendingPattern: marketRiskPattern.pattern
        }
      )
    )
  }

  if (regulatoryPattern && !bodyUpper.includes('REGULAT') && !bodyUpper.includes('COURT') && !bodyUpper.includes('POLICY')) {
    hits.push(
      createRuleHit(
        'REGULATORY_MISSTATEMENT',
        'Headline includes regulatory certainty claim without supporting regulatory evidence anchors.',
        'EDITORIAL_HEADLINE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: 'EDITORIAL_HEADLINE',
          offendingText: regulatoryPattern.matchedText,
          offendingPattern: regulatoryPattern.pattern
        }
      )
    )
  }

  if (titleSurfaceAssessment.inconsistentPairs.length > calibrationProfile.titleSurface.maxAllowedInconsistentPairs) {
    const firstInconsistency = titleSurfaceAssessment.inconsistentPairs[0]
    hits.push(
      createRuleHit(
        'TITLE_SURFACE_INCONSISTENCY',
        `Detected ${titleSurfaceAssessment.inconsistentPairs.length} inconsistent title-surface pair(s).`,
        'CANONICAL_TITLE',
        sourceLanguage,
        evidenceRefs,
        {
          offendingSurface: firstInconsistency?.left || 'CANONICAL_TITLE',
          offendingText: firstInconsistency
            ? `${firstInconsistency.left} <> ${firstInconsistency.right}: ${firstInconsistency.reason}`
            : sourceHeadline,
          offendingPattern: 'TITLE_SURFACE_DIVERGENCE'
        }
      )
    )
  }

  const multilingualReviewSignals = multilingualAssessment.driftByLanguage.filter(record => {
    if (record.action === 'REVIEW') {
      return true
    }

    if (record.language === multilingualAssessment.sourceLanguage) {
      return false
    }

    const invariantViolation =
      record.violatedInvariants.includes('coreActor') ||
      record.violatedInvariants.includes('numberDateFacts') ||
      record.violatedInvariants.includes('legalRegulatoryMeaning') ||
      record.violatedInvariants.includes('marketMovingMeaning')

    return invariantViolation || (record.driftScore / 100) >= record.pairThreshold
  })
  if (multilingualReviewSignals.length > 0) {
    const languages = multilingualReviewSignals
      .filter(record => record.language !== multilingualAssessment.sourceLanguage)
      .map(record => record.language)

    hits.push(
      createRuleHit(
        'MULTILINGUAL_DRIFT',
        `Cross-language drift detected in ${multilingualReviewSignals.length} localized headline(s).`,
        'MULTILINGUAL_LAYER',
        'cross-language',
        evidenceRefs,
        {
          offendingSurface: 'MULTILINGUAL_LAYER',
          offendingText: languages.join(',') || 'cross-language',
          offendingPattern: 'MULTILINGUAL_SEMANTIC_DRIFT'
        }
      )
    )
  }

  const localExaggerationSignals = multilingualAssessment.driftByLanguage.filter(record => record.localExaggeration)
  if (localExaggerationSignals.length > 0) {
    const languages = localExaggerationSignals
      .filter(record => record.language !== multilingualAssessment.sourceLanguage)
      .map(record => record.language)

    hits.push(
      createRuleHit(
        'LOCAL_LANGUAGE_EXAGGERATION',
        `Localized certainty/emotion amplification detected in ${localExaggerationSignals.length} language variant(s).`,
        'MULTILINGUAL_LAYER',
        'cross-language',
        evidenceRefs,
        {
          offendingSurface: 'MULTILINGUAL_LAYER',
          offendingText: languages.join(',') || 'cross-language',
          offendingPattern: 'LOCAL_LANGUAGE_EXAGGERATION'
        }
      )
    )
  }

  return {
    titleSurfaceAssessment,
    multilingualAssessment,
    ruleHits: dedupeRuleHits(hits)
  }
}

function scoreDimensions(
  dimensions: HeadlineDimensionDefinition[],
  ruleHits: HeadlineRuleHit[]
): HeadlineGateResult['scoreBreakdown'] {
  return dimensions.map(dimension => {
    const penalties = DIMENSION_PENALTIES[dimension.dimension]
    const signals: string[] = []

    let score = 100
    for (const hit of ruleHits) {
      const directPenalty = penalties[hit.ruleId]
      if (typeof directPenalty === 'number') {
        score -= directPenalty
        signals.push(hit.normalizedReasonCode)
        continue
      }

      if (hit.severity === 'HIGH') {
        score -= 10
        continue
      }

      if (hit.severity === 'MEDIUM') {
        score -= 6
        continue
      }

      score -= 3
    }

    const bounded = Math.max(0, Math.min(100, Number(score.toFixed(2))))

    return {
      dimension: dimension.dimension,
      description: dimension.description,
      measuredBy: dimension.measuredBy,
      thresholds: dimension.thresholds,
      score: bounded,
      status: resolveHeadlineDimensionStatus(bounded, dimension.thresholds),
      signals: Array.from(new Set(signals))
    }
  })
}

function buildRuleMappingEvidence(hit: HeadlineRuleHit): string[] {
  const details = [
    `rule=${hit.ruleId}`,
    `reason=${hit.normalizedReasonCode}`,
    `severity=${hit.severity}`
  ]

  if (hit.offendingSurface) {
    details.push(`surface=${hit.offendingSurface}`)
  }

  if (hit.offendingPattern) {
    details.push(`pattern=${hit.offendingPattern}`)
  }

  if (hit.offendingText) {
    details.push(`text=${hit.offendingText.replace(/\s+/g, ' ').slice(0, 120)}`)
  }

  if (hit.evidenceRefs.length > 0) {
    details.push(`evidence=${hit.evidenceRefs[0].refType}`)
  }

  return details
}

function buildCorrectionRecommendations(ruleHits: HeadlineRuleHit[]): HeadlineCorrectionRecommendation[] {
  const eligible = ruleHits.filter(hit => {
    const action = getHeadlineRuleDefinition(hit.ruleId).defaultControlAction
    return action === 'CORRECT' || action === 'REVIEW'
  })

  const sorted = eligible.sort((left, right) => rankSeverity(right.severity) - rankSeverity(left.severity))
  const recommendations: HeadlineCorrectionRecommendation[] = []
  const seen = new Set<HeadlineRuleFamily>()

  for (const hit of sorted) {
    if (seen.has(hit.ruleId)) {
      continue
    }

    seen.add(hit.ruleId)
    recommendations.push({
      recommendationId: `headline-correction-${hit.ruleId}-${recommendations.length + 1}`,
      action: hit.suggestedFix,
      targetSurface: hit.affectedSurface,
      rationale: hit.explanation,
      affectedRuleIds: [hit.ruleId],
      ruleMappingEvidence: buildRuleMappingEvidence(hit),
      priority: hit.severity === 'HIGH' ? 'HIGH' : hit.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW'
    })

    if (recommendations.length >= 8) {
      break
    }
  }

  return recommendations
}

function countHighSeverityRuleHits(ruleHits: HeadlineRuleHit[]): number {
  return ruleHits.filter(hit => hit.severity === 'HIGH').length
}

function shouldForceHighConfidenceBlock(
  ruleHits: HeadlineRuleHit[],
  scoreBreakdown: HeadlineGateResult['scoreBreakdown'],
  compositeHeadlineScore: number,
  calibrationProfile: ResolvedHeadlineCalibrationProfile
): boolean {
  const minDimensionScore = scoreBreakdown.length > 0
    ? Math.min(...scoreBreakdown.map(item => item.score))
    : 100

  const highSeverityHits = countHighSeverityRuleHits(ruleHits)

  return (
    compositeHeadlineScore <= calibrationProfile.escalation.hardBlockCompositeThreshold ||
    minDimensionScore <= calibrationProfile.escalation.highConfidenceHardBlockScore ||
    highSeverityHits >= calibrationProfile.escalation.highConfidenceHardBlockRuleHits
  )
}

function resolveCalibrationBand(
  baseDecision: HeadlineGateResult['overallDecision'],
  compositeHeadlineScore: number,
  ruleHits: HeadlineRuleHit[]
): HeadlineCalibrationBand {
  if (baseDecision === 'HEADLINE_BLOCK' || compositeHeadlineScore < 60 || countHighSeverityRuleHits(ruleHits) >= 2) {
    return 'RED'
  }

  if (baseDecision === 'HEADLINE_REVIEW_REQUIRED' || baseDecision === 'HEADLINE_CORRECTION_REQUIRED' || ruleHits.length > 0 || compositeHeadlineScore < 82) {
    return 'AMBER'
  }

  return 'GREEN'
}

function decideOverallDecision(
  ruleHits: HeadlineRuleHit[],
  scoreBreakdown: HeadlineGateResult['scoreBreakdown'],
  escalationRequired: boolean,
  compositeHeadlineScore: number,
  calibrationProfile: ResolvedHeadlineCalibrationProfile
): HeadlineGateResult['overallDecision'] {
  const hasEscalateDimension = scoreBreakdown.some(item => item.status === 'ESCALATE')
  const hasBlockDimension = scoreBreakdown.some(item => item.status === 'BLOCK')
  const hardBlockScore = scoreBreakdown.some(item => item.score <= calibrationProfile.escalation.highConfidenceHardBlockScore)
  const hardBlockComposite = compositeHeadlineScore <= calibrationProfile.escalation.hardBlockCompositeThreshold

  if (hardBlockScore || hardBlockComposite) {
    return 'HEADLINE_BLOCK'
  }

  const hasReviewRule = ruleHits.some(hit => getHeadlineRuleDefinition(hit.ruleId).defaultControlAction === 'REVIEW')
  if (hasEscalateDimension && escalationRequired) {
    return 'HEADLINE_REVIEW_REQUIRED'
  }

  if (hasReviewRule || escalationRequired || hasBlockDimension) {
    return 'HEADLINE_REVIEW_REQUIRED'
  }

  if (ruleHits.length > 0) {
    return 'HEADLINE_CORRECTION_REQUIRED'
  }

  return 'HEADLINE_PASS'
}

function applyOperationalMode(
  baseDecision: HeadlineGateResult['overallDecision'],
  operationalMode: HeadlineOperationalMode,
  ruleHits: HeadlineRuleHit[],
  scoreBreakdown: HeadlineGateResult['scoreBreakdown'],
  compositeHeadlineScore: number,
  calibrationProfile: ResolvedHeadlineCalibrationProfile
): HeadlineGateResult['overallDecision'] {
  if (operationalMode === 'SHADOW_ONLY' || operationalMode === 'LOG_AND_SCORE') {
    return 'HEADLINE_PASS'
  }

  if (operationalMode === 'SOFT_ENFORCEMENT') {
    return baseDecision
  }

  if (baseDecision !== 'HEADLINE_BLOCK') {
    return baseDecision
  }

  if (shouldForceHighConfidenceBlock(ruleHits, scoreBreakdown, compositeHeadlineScore, calibrationProfile)) {
    return 'HEADLINE_BLOCK'
  }

  return 'HEADLINE_REVIEW_REQUIRED'
}

export function evaluateHeadlineIntelligenceGate(
  batch: BatchJob,
  decision: ChiefEditorDecision,
  mic: MasterIntelligenceCore
): HeadlineGateResult {
  const editionLanguages = Object.keys(batch.editions || {}) as Language[]
  const sourceLanguage: Language = editionLanguages.includes('en') ? 'en' : (editionLanguages[0] || 'en')
  const sourceEdition = batch.editions[sourceLanguage]

  const sourceHeadline = normalizeText(sourceEdition?.content?.title)
  const lead = normalizeText(sourceEdition?.content?.lead)
  const body = normalizeText(sourceEdition?.content?.body?.summary) || normalizeText(sourceEdition?.content?.body?.full)

  const category = mic?.metadata?.category || sourceEdition?.metadata?.category || 'general'
  const urgency = mic?.metadata?.urgency || 'standard'
  const articleType = resolveHeadlineArticleType(category, urgency, sourceHeadline, `${lead} ${body}`)
  const calibrationProfile = resolveHeadlineCalibrationProfile(category, articleType)
  const operationalMode = resolveHeadlineOperationalMode()

  const { titleSurfaceAssessment, multilingualAssessment, ruleHits } = evaluateRuleHits(
    batch,
    decision,
    mic,
    sourceLanguage,
    sourceHeadline,
    lead,
    body,
    articleType,
    calibrationProfile
  )

  const dimensions = getHeadlineDimensionDefinitions(
    articleType,
    category,
    calibrationProfile.dimensionOverrides
  )
  const scoreBreakdown = scoreDimensions(dimensions, ruleHits)

  const compositeHeadlineScore = computeWeightedCompositeScore(
    scoreBreakdown.map(item => {
      const definition = dimensions.find(candidate => candidate.dimension === item.dimension)
      return {
        score: item.score,
        weight: definition ? definition.weight : 1
      }
    })
  )

  let escalationClass = resolveEscalationClass(ruleHits)

  const trustProxyScores = scoreBreakdown
    .filter(item => item.dimension === 'credibility' || item.dimension === 'platformSafety' || item.dimension === 'titleIntegrity')
    .map(item => item.score)

  const trustProxy = trustProxyScores.length > 0
    ? trustProxyScores.reduce((sum, score) => sum + score, 0) / trustProxyScores.length
    : 100

  const highCtrSignal = ruleHits.some(hit =>
    hit.ruleId === 'CLICKBAIT_TEMPLATE' ||
    hit.ruleId === 'CURIOSITY_GAP' ||
    hit.ruleId === 'EMOTIONAL_INFLATION'
  )

  const highCtrLowTrustPattern = highCtrSignal && trustProxy < 60
  if (highCtrLowTrustPattern && ESCALATION_PRIORITY.HIGH_TRAFFIC_HIGH_RISK_REVIEW > ESCALATION_PRIORITY[escalationClass]) {
    escalationClass = 'HIGH_TRAFFIC_HIGH_RISK_REVIEW'
  }

  const escalationRequired = escalationClass !== 'NONE'
  const baseOverallDecision = decideOverallDecision(
    ruleHits,
    scoreBreakdown,
    escalationRequired,
    compositeHeadlineScore,
    calibrationProfile
  )

  const overallDecision = applyOperationalMode(
    baseOverallDecision,
    operationalMode,
    ruleHits,
    scoreBreakdown,
    compositeHeadlineScore,
    calibrationProfile
  )

  const calibrationBand = resolveCalibrationBand(baseOverallDecision, compositeHeadlineScore, ruleHits)

  const correctionRecommendations = buildCorrectionRecommendations(ruleHits)

  const multilingualDriftRate: Record<string, number> = {}
  for (const drift of multilingualAssessment.driftByLanguage) {
    multilingualDriftRate[drift.language] = Number((drift.driftScore / 100).toFixed(2))
  }

  const titleSurfaceInconsistencyRate = titleSurfaceAssessment.resolvedSurfaces.length > 1
    ? Number((titleSurfaceAssessment.inconsistentPairs.length / (titleSurfaceAssessment.resolvedSurfaces.length - 1)).toFixed(2))
    : 0

  const ruleFamilyFingerprint = Array.from(new Set(ruleHits.map(hit => hit.ruleId))).sort().join('|') || 'NONE'

  return {
    overallDecision,
    calibrationBand,
    operationalMode,
    calibrationProfileId: calibrationProfile.id,
    compositeHeadlineScore,
    scoreBreakdown,
    ruleHits,
    correctionRecommendations,
    escalationRequired,
    escalationClass,
    multilingualAssessment,
    titleSurfaceAssessment,
    articleType,
    category,
    calibration: {
      titleSurface: { ...calibrationProfile.titleSurface },
      multilingual: {
        ...calibrationProfile.multilingual,
        semanticVarianceThreshold: multilingualAssessment.semanticVarianceThreshold,
        languagePairVarianceThresholds: { ...calibrationProfile.multilingual.languagePairVarianceThresholds }
      },
      escalation: { ...calibrationProfile.escalation }
    },
    metricsModel: {
      blockedHeadlineCandidate: baseOverallDecision === 'HEADLINE_BLOCK',
      correctedHeadlineCandidate: baseOverallDecision === 'HEADLINE_CORRECTION_REQUIRED',
      escalationCandidate: escalationRequired,
      perCategoryFailureKey: `${category.toLowerCase().replace(/\s+/g, '_')}::${articleType}`,
      perLanguageDriftRate: multilingualDriftRate,
      titleSurfaceInconsistencyRate,
      highCtrLowTrustPattern,
      headlineFamilyFingerprint: ruleFamilyFingerprint
    },
    evaluatedAt: new Date().toISOString()
  }
}

export function mapHeadlineGateResultToAssessment(
  gateResult: HeadlineGateResult,
  decisionId: string,
  sourceLanguages: Language[]
): HeadlineAssessmentRecord | null {
  if (gateResult.operationalMode === 'SHADOW_ONLY' || gateResult.operationalMode === 'LOG_AND_SCORE') {
    return null
  }

  if (gateResult.overallDecision === 'HEADLINE_PASS') {
    return null
  }

  let routingAction: HeadlineAssessmentRecord['routing_action']
  let failClosed = false

  if (gateResult.overallDecision === 'HEADLINE_CORRECTION_REQUIRED') {
    routingAction = 'CORRECTION_REQUIRED'
  } else if (gateResult.overallDecision === 'HEADLINE_BLOCK') {
    routingAction = 'SUPERVISOR_REVIEW_REQUIRED'
    failClosed = true
  } else {
    routingAction = ROUTING_ESCALATION_TO_SUPERVISOR.has(gateResult.escalationClass)
      ? 'SUPERVISOR_REVIEW_REQUIRED'
      : 'HUMAN_REVIEW_REQUIRED'
    failClosed = true
  }

  const reasonCode = gateResult.ruleHits[0]?.normalizedReasonCode || getFallbackReasonCode(gateResult.overallDecision)
  const severity = resolveTopSeverity(gateResult.ruleHits)

  return {
    headline_assessment_present: true,
    passed: false,
    issues: gateResult.ruleHits.map(hit => hit.ruleId),
    reason_code: reasonCode,
    severity,
    confidence: resolveConfidence(gateResult.ruleHits),
    routing_action: routingAction,
    alignment_score: gateResult.titleSurfaceAssessment.sharedThesisScore,
    fail_closed: failClosed,
    source_gate_ids: ['HEADLINE_INTELLIGENCE_OPERATING_LAYER_V1'],
    source_reason_codes: Array.from(new Set(gateResult.ruleHits.map(hit => hit.normalizedReasonCode))),
    source_languages: sourceLanguages,
    escalation_class: gateResult.escalationClass,
    rule_hits: gateResult.ruleHits,
    correction_recommendations: gateResult.correctionRecommendations,
    headline_gate_result: gateResult,
    timestamp: new Date().toISOString(),
    decision_id: decisionId
  }
}
