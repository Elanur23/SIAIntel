import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import type {
  BatchJob,
  ChiefEditorDecision,
  Language,
  LanguageEdition,
  MasterIntelligenceCore
} from '../core-types'
import { evaluateHeadlineIntelligenceGate, mapHeadlineGateResultToAssessment } from '../headline-intelligence/headline-gate'
import {
  HIOL_ADVERSARIAL_CORPUS,
  HIOL_ALL_VALIDATION_CORPUS,
  HIOL_GOLDEN_VALIDATION_CORPUS,
  HIOL_MULTILINGUAL_SIMULATION_CORPUS,
  HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS,
  REQUIRED_ADVERSARIAL_CHALLENGES,
  REQUIRED_HIOL_ARTICLE_TYPES,
  REQUIRED_HIOL_CATEGORIES,
  REQUIRED_MULTILINGUAL_DRIFT_CLASSES,
  REQUIRED_TITLE_SURFACE_PATTERNS,
  type HIOLMultilingualSimulationCase,
  type HIOLMultilingualSimulationVariant,
  type HIOLRoutingExpectation,
  type HIOLValidationCorpusCase
} from './fixtures/hiol-validation-corpus'

const ALL_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

function normalizeCategory(value: string): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function createDecisionFixture(): ChiefEditorDecision {
  const now = Date.now()
  return {
    overall_decision: 'REJECT',
    approved_languages: ['en'],
    rejected_languages: ['tr'],
    delayed_languages: [],
    reasons: ['validation-corpus-fixture'],
    requires_supervisor_review: false,
    confidence_score: 61,
    confidence_band: 'MEDIUM',
    confidence_reasons: ['validation-fixture'],
    decision_trace: {
      trace_id: `trace_hiol_corpus_${now}`,
      stage: 'CHIEF_EDITOR',
      decision: 'REJECT',
      confidence_score: 61,
      hard_rule_hits: [],
      reasons: ['validation-corpus-fixture'],
      emitted_events: [],
      timestamp: new Date(now).toISOString(),
      rule_checks: [],
      semantic_analysis: null,
      risk_assessment: {
        overall_risk_score: 28,
        policy_risk: 18,
        financial_risk: 18,
        geopolitical_risk: 10,
        legal_risk: 14,
        brand_safety_risk: 16,
        risk_factors: []
      },
      final_reasoning: 'validation-corpus-fixture'
    },
    timestamp: now,
    gate_results: []
  }
}

function createSchema(headline: string, caseFixture: HIOLValidationCorpusCase, language: Language): Record<string, unknown> {
  if (language !== caseFixture.sourceLanguage) {
    return {
      '@type': 'NewsArticle',
      headline
    }
  }

  const surfaces = caseFixture.titleSurfaces
  const schema: Record<string, unknown> = {
    '@type': 'NewsArticle',
    headline: surfaces?.canonicalTitle || headline
  }

  if (surfaces?.seoTitle) {
    schema.seoTitle = surfaces.seoTitle
  }

  if (surfaces?.ogTitle) {
    schema.openGraph = { title: surfaces.ogTitle }
  }

  if (surfaces?.socialTitle) {
    schema.social = { title: surfaces.socialTitle }
  }

  if (surfaces?.homepageTitle) {
    schema.homepageTitle = surfaces.homepageTitle
  }

  return schema
}

function createEdition(caseFixture: HIOLValidationCorpusCase, language: Language): LanguageEdition {
  const localized = caseFixture.multilingualVariants?.find(variant => variant.language === language)
  const isSource = language === caseFixture.sourceLanguage
  const title = isSource
    ? caseFixture.proposedHeadline
    : (localized?.headline || caseFixture.proposedHeadline)

  return {
    id: `edition_${caseFixture.id}_${language}`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title,
      lead: caseFixture.sourceArticle.lede,
      body: {
        summary: caseFixture.sourceArticle.bodySummary,
        full: `${caseFixture.sourceArticle.summary} ${caseFixture.sourceArticle.bodySummary}`
      },
      schema: createSchema(title, caseFixture, language)
    },
    metadata: {
      keywords: ['headline', 'validation', caseFixture.category],
      region: 'GLOBAL',
      category: caseFixture.category
    },
    entities: localized?.entities || caseFixture.sourceEntities,
    audit_results: {
      overall_score: 90,
      cell_scores: {
        title_cell: 90,
        body_cell: 90,
        seo_cell: 90,
        schema_cell: 90,
        meta_cell: 90,
        fact_check_cell: 90,
        policy_cell: 90,
        discover_cell: 90,
        cross_lang_cell: 90,
        tone_cell: 90,
        readability_cell: 90,
        link_cell: 90,
        sovereign_cell: 90,
        visual_cell: 90
      },
      issues: []
    },
    healing_history: [],
    stale: false
  }
}

function createBatchFixture(caseFixture: HIOLValidationCorpusCase): BatchJob {
  const editions = Object.fromEntries(
    ALL_LANGUAGES.map(language => [language, createEdition(caseFixture, language)])
  ) as Record<Language, LanguageEdition>

  return {
    id: `batch_${caseFixture.id}`,
    mic_id: `mic_${caseFixture.id}`,
    user_id: 'validation-corpus-user',
    status: 'IN_PROGRESS',
    created_at: Date.now(),
    updated_at: Date.now(),
    editions,
    approved_languages: [],
    pending_languages: [],
    escalation_depth: 0,
    chief_editor_escalated_to_supervisor: false,
    supervisor_decision_made: false,
    budget: {
      total: 10,
      spent: 0,
      remaining: 10
    },
    recirculation_count: 0,
    max_recirculation: 3
  }
}

function createMicFixture(caseFixture: HIOLValidationCorpusCase): MasterIntelligenceCore {
  const now = Date.now()
  return {
    id: `mic_${caseFixture.id}_${now}`,
    version: 1,
    created_at: now,
    updated_at: now,
    truth_nucleus: {
      facts: [
        {
          id: `${caseFixture.id}_fact_1`,
          statement: caseFixture.sourceArticle.summary,
          confidence: 0.9,
          sources: ['https://example.com/validation-corpus']
        }
      ],
      claims: [
        {
          id: `${caseFixture.id}_claim_1`,
          statement: caseFixture.sourceArticle.lede,
          verification_status: 'verified'
        }
      ],
      impact_analysis: 'Validation corpus impact anchor.',
      geopolitical_context: 'Validation corpus context anchor.'
    },
    structural_atoms: {
      core_thesis: caseFixture.proposedHeadline,
      key_entities: caseFixture.sourceEntities,
      temporal_markers: ['2026'],
      numerical_data: []
    },
    metadata: {
      category: caseFixture.category,
      urgency: caseFixture.urgency,
      target_regions: ['GLOBAL']
    }
  }
}

function assertRouting(
  expectedRouting: HIOLRoutingExpectation,
  actualRouting: string | undefined,
  assessmentPresent: boolean
): void {
  if (expectedRouting === 'PASS') {
    expect(assessmentPresent).toBe(false)
    return
  }

  expect(assessmentPresent).toBe(true)
  const expectedRank: Record<Exclude<HIOLRoutingExpectation, 'PASS'>, number> = {
    CORRECTION_REQUIRED: 1,
    HUMAN_REVIEW_REQUIRED: 2,
    SUPERVISOR_REVIEW_REQUIRED: 3
  }

  const actualRank: Record<string, number> = {
    CORRECTION_REQUIRED: 1,
    HUMAN_REVIEW_REQUIRED: 2,
    SUPERVISOR_REVIEW_REQUIRED: 3,
    TERMINAL_REJECT: 4
  }

  const resolvedActualRank = actualRouting ? (actualRank[actualRouting] || 0) : 0
  expect(resolvedActualRank).toBeGreaterThanOrEqual(expectedRank[expectedRouting])
}

function findCorpusCase(id: string): HIOLValidationCorpusCase {
  const found = HIOL_ALL_VALIDATION_CORPUS.find(item => item.id === id)
  if (!found) {
    throw new Error(`CORPUS_CASE_NOT_FOUND: ${id}`)
  }
  return found
}

function buildValidationCaseFromMultilingualVariant(
  anchor: HIOLMultilingualSimulationCase,
  variant: HIOLMultilingualSimulationVariant,
  suffix: string
): HIOLValidationCorpusCase {
  return {
    id: `multi_runtime_${anchor.id}_${suffix}`,
    family: 'GOLDEN',
    title: `${anchor.title} (${variant.driftClass})`,
    articleType: anchor.articleType,
    category: anchor.category,
    urgency: 'standard',
    sourceLanguage: anchor.sourceLanguage,
    sourceEntities: anchor.sourceEntities,
    sourceArticle: {
      summary: anchor.sourceHeadline,
      lede: anchor.sourceHeadline,
      bodySummary: `${anchor.sourceHeadline}. ${anchor.sourceSummary}`
    },
    proposedHeadline: anchor.sourceHeadline,
    multilingualVariants: [
      {
        language: variant.language,
        headline: variant.localizedHeadline,
        entities: variant.localizedEntities,
        notes: variant.notes
      }
    ],
    expected: {
      classification: variant.expectedRuleHits.length > 0 ? 'AMBER' : 'GREEN',
      overallDecision: variant.expectedRuleHits.length > 0 ? 'HEADLINE_REVIEW_REQUIRED' : 'HEADLINE_PASS',
      routing: variant.expectedRouting,
      expectedTriggeredRules: variant.expectedRuleHits,
      expectedEscalationClass: variant.expectedEscalationClass
    },
    notes: variant.notes,
    tags: ['multilingual-runtime-check', variant.driftClass]
  }
}

describe('HIOL Corpus Foundation - Integrity', () => {
  test('golden corpus keeps explicit classification and routing expectations', () => {
    expect(HIOL_GOLDEN_VALIDATION_CORPUS.length).toBeGreaterThanOrEqual(20)

    for (const caseFixture of HIOL_GOLDEN_VALIDATION_CORPUS) {
      expect(caseFixture.family).toBe('GOLDEN')
      expect(caseFixture.expected.classification).toBeDefined()
      expect(caseFixture.expected.overallDecision).toBeDefined()
      expect(caseFixture.expected.routing).toBeDefined()
      expect(Array.isArray(caseFixture.expected.expectedTriggeredRules)).toBe(true)
      expect(caseFixture.notes.length).toBeGreaterThan(20)
      expect(caseFixture.sourceArticle.summary.length).toBeGreaterThan(25)
      expect(caseFixture.sourceArticle.lede.length).toBeGreaterThan(25)
      expect(caseFixture.sourceArticle.bodySummary.length).toBeGreaterThan(25)
    }
  })

  test('golden corpus coverage spans required article types and categories', () => {
    const articleTypesCovered = new Set(HIOL_GOLDEN_VALIDATION_CORPUS.map(item => item.articleType))
    const categoriesCovered = new Set(HIOL_GOLDEN_VALIDATION_CORPUS.map(item => normalizeCategory(item.category)))

    for (const requiredType of REQUIRED_HIOL_ARTICLE_TYPES) {
      expect(articleTypesCovered.has(requiredType)).toBe(true)
    }

    for (const requiredCategory of REQUIRED_HIOL_CATEGORIES) {
      expect(categoriesCovered.has(normalizeCategory(requiredCategory))).toBe(true)
    }
  })

  test('adversarial corpus includes all mandatory challenge families', () => {
    expect(HIOL_ADVERSARIAL_CORPUS.length).toBeGreaterThanOrEqual(10)

    const challengeCoverage = new Set(
      HIOL_ADVERSARIAL_CORPUS
        .map(item => item.challengeType)
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
    )

    for (const requiredChallenge of REQUIRED_ADVERSARIAL_CHALLENGES) {
      expect(challengeCoverage.has(requiredChallenge)).toBe(true)
    }
  })

  test('multilingual simulation corpus spans all drift classes with explicit expected outcomes', () => {
    const driftCoverage = new Set(
      HIOL_MULTILINGUAL_SIMULATION_CORPUS.flatMap(item => item.variants.map(variant => variant.driftClass))
    )

    for (const requiredDriftClass of REQUIRED_MULTILINGUAL_DRIFT_CLASSES) {
      expect(driftCoverage.has(requiredDriftClass)).toBe(true)
    }

    for (const anchor of HIOL_MULTILINGUAL_SIMULATION_CORPUS) {
      expect(anchor.variants.length).toBeGreaterThan(0)
      for (const variant of anchor.variants) {
        expect(variant.localizedHeadline.length).toBeGreaterThan(10)
        expect(variant.expectedRouting).toBeDefined()
        expect(Array.isArray(variant.expectedRuleHits)).toBe(true)
      }
    }
  })

  test('title-surface corpus includes acceptable and unacceptable divergence patterns', () => {
    const patternCoverage = new Set(
      HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS
        .map(item => item.surfacePattern)
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
    )

    for (const requiredPattern of REQUIRED_TITLE_SURFACE_PATTERNS) {
      expect(patternCoverage.has(requiredPattern)).toBe(true)
    }

    const divergenceClasses = new Set(
      HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS
        .map(item => item.surfaceDivergenceClass)
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
    )

    expect(divergenceClasses.has('ACCEPTABLE_ALIGNMENT')).toBe(true)
    expect(divergenceClasses.has('UNACCEPTABLE_DIVERGENCE')).toBe(true)
  })
})

describe('HIOL Corpus Foundation - Representative Runtime Usability', () => {
  let originalMode: string | undefined

  beforeEach(() => {
    originalMode = process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE
    process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE = 'SOFT_ENFORCEMENT'
  })

  afterEach(() => {
    if (typeof originalMode === 'string') {
      process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE = originalMode
      return
    }

    delete process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE
  })

  test.each([
    'amber_mild_emotional_inflation_market',
    'amber_number_date_framing_needs_correction',
    'amber_subtle_title_surface_mismatch',
    'red_market_moving_certainty',
    'red_severe_multilingual_exaggeration'
  ])('representative golden case runs through HIOL gate: %s', (id) => {
    const caseFixture = findCorpusCase(id)
    const batch = createBatchFixture(caseFixture)
    const decision = createDecisionFixture()
    const mic = createMicFixture(caseFixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(result, decision.decision_trace.trace_id, [caseFixture.sourceLanguage])

    const calibrationRank: Record<'GREEN' | 'AMBER' | 'RED', number> = {
      GREEN: 1,
      AMBER: 2,
      RED: 3
    }

    expect(calibrationRank[result.calibrationBand]).toBeGreaterThanOrEqual(
      calibrationRank[caseFixture.expected.classification]
    )

    assertRouting(caseFixture.expected.routing, assessment?.routing_action, Boolean(assessment))

    for (const expectedRule of caseFixture.expected.expectedTriggeredRules) {
      expect(result.ruleHits.some(hit => hit.ruleId === expectedRule)).toBe(true)
    }
  })

  test('adversarial market-disguised analysis case remains executable and risk-signaling', () => {
    const caseFixture = findCorpusCase('adv_market_claim_disguised_analysis')
    const batch = createBatchFixture(caseFixture)
    const decision = createDecisionFixture()
    const mic = createMicFixture(caseFixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(result, decision.decision_trace.trace_id, [caseFixture.sourceLanguage])

    expect(result.ruleHits.some(hit => hit.ruleId === 'MARKET_MOVING_RISK')).toBe(true)
    expect(result.calibrationBand === 'AMBER' || result.calibrationBand === 'RED').toBe(true)
    expect(assessment).not.toBeNull()
  })

  test('title-surface divergence case is consumable by gate and emits surface inconsistency rule', () => {
    const caseFixture = findCorpusCase('surface_editorial_vs_seo_divergence_policy')
    const batch = createBatchFixture(caseFixture)
    const decision = createDecisionFixture()
    const mic = createMicFixture(caseFixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'TITLE_SURFACE_INCONSISTENCY')).toBe(true)
    expect(result.titleSurfaceAssessment.inconsistentPairs.length).toBeGreaterThan(0)
  })

  test('multilingual simulation anchor variants can be transformed into executable HIOL fixtures', () => {
    const anchor = HIOL_MULTILINGUAL_SIMULATION_CORPUS.find(item => item.id === 'multi_anchor_regulatory_consultation')
    expect(anchor).toBeDefined()

    const faithfulVariant = anchor?.variants.find(item => item.driftClass === 'FAITHFUL_TRANSLATION')
    const severeVariant = anchor?.variants.find(item => item.driftClass === 'SEVERE_DRIFT')

    expect(faithfulVariant).toBeDefined()
    expect(severeVariant).toBeDefined()

    if (!anchor || !faithfulVariant || !severeVariant) {
      return
    }

    const faithfulCase = buildValidationCaseFromMultilingualVariant(anchor, faithfulVariant, 'faithful')
    const severeCase = buildValidationCaseFromMultilingualVariant(anchor, severeVariant, 'severe')

    const faithfulResult = evaluateHeadlineIntelligenceGate(
      createBatchFixture(faithfulCase),
      createDecisionFixture(),
      createMicFixture(faithfulCase)
    )

    const severeResult = evaluateHeadlineIntelligenceGate(
      createBatchFixture(severeCase),
      createDecisionFixture(),
      createMicFixture(severeCase)
    )

    expect(
      faithfulResult.ruleHits.every(hit => hit.ruleId === 'MULTILINGUAL_DRIFT')
    ).toBe(true)
    expect(
      faithfulResult.ruleHits.some(hit => hit.ruleId === 'LOCAL_LANGUAGE_EXAGGERATION')
    ).toBe(false)
    expect(severeResult.ruleHits.some(hit => hit.ruleId === 'MULTILINGUAL_DRIFT')).toBe(true)
  })
})
