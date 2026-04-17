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
  HEADLINE_CALIBRATION_CORPUS,
  type HeadlineCalibrationCorpusCase
} from './fixtures/headline-calibration-corpus'

const ALL_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

function createDecisionFixture(): ChiefEditorDecision {
  const now = Date.now()
  return {
    overall_decision: 'REJECT',
    approved_languages: ['en'],
    rejected_languages: ['tr'],
    delayed_languages: [],
    reasons: ['headline calibration corpus test'],
    requires_supervisor_review: false,
    confidence_score: 60,
    confidence_band: 'MEDIUM',
    confidence_reasons: ['fixture'],
    decision_trace: {
      trace_id: `trace_corpus_${now}`,
      stage: 'CHIEF_EDITOR',
      decision: 'REJECT',
      confidence_score: 60,
      hard_rule_hits: [],
      reasons: ['headline calibration corpus test'],
      emitted_events: [],
      timestamp: new Date(now).toISOString(),
      rule_checks: [],
      semantic_analysis: null,
      risk_assessment: {
        overall_risk_score: 25,
        policy_risk: 15,
        financial_risk: 15,
        geopolitical_risk: 10,
        legal_risk: 10,
        brand_safety_risk: 15,
        risk_factors: []
      },
      final_reasoning: 'fixture'
    },
    timestamp: now,
    gate_results: []
  }
}

function createMICFixture(caseFixture: HeadlineCalibrationCorpusCase): MasterIntelligenceCore {
  const now = Date.now()
  return {
    id: `mic_${caseFixture.id}_${now}`,
    version: 1,
    created_at: now,
    updated_at: now,
    truth_nucleus: {
      facts: [
        {
          id: 'fact_1',
          statement: caseFixture.sourceBodySummary,
          confidence: 0.9,
          sources: ['https://example.com/source']
        }
      ],
      claims: [
        {
          id: 'claim_1',
          statement: caseFixture.sourceLead,
          verification_status: 'verified'
        }
      ],
      impact_analysis: 'Calibration corpus impact analysis.',
      geopolitical_context: 'Calibration corpus context.'
    },
    structural_atoms: {
      core_thesis: caseFixture.sourceTitle,
      key_entities: ['Primary Actor'],
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

function createEditionFixture(caseFixture: HeadlineCalibrationCorpusCase, language: Language): LanguageEdition {
  const title = caseFixture.localizedTitles?.[language]
    || caseFixture.sourceTitle

  const entities = caseFixture.localizedEntities?.[language]
    || ['Primary Actor']

  const schema = {
    '@type': 'NewsArticle',
    headline: title,
    ...(caseFixture.sourceSchema && language === caseFixture.sourceLanguage ? caseFixture.sourceSchema : {})
  }

  return {
    id: `edition_${caseFixture.id}_${language}`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title,
      lead: caseFixture.sourceLead,
      body: {
        summary: caseFixture.sourceBodySummary,
        full: caseFixture.sourceBodyFull
      },
      schema
    },
    metadata: {
      keywords: ['headline', 'calibration'],
      region: 'GLOBAL',
      category: caseFixture.category
    },
    entities,
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

function createBatchFixture(caseFixture: HeadlineCalibrationCorpusCase): BatchJob {
  const editions = Object.fromEntries(
    ALL_LANGUAGES.map(language => [language, createEditionFixture(caseFixture, language)])
  ) as Record<Language, LanguageEdition>

  return {
    id: `batch_${caseFixture.id}`,
    mic_id: `mic_${caseFixture.id}`,
    user_id: 'test-user',
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

describe('Headline Intelligence Calibration and Hardening', () => {
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

  test.each(HEADLINE_CALIBRATION_CORPUS)('corpus case: $id', (caseFixture) => {
    const batch = createBatchFixture(caseFixture)
    const decision = createDecisionFixture()
    const mic = createMICFixture(caseFixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.calibrationBand).toBe(caseFixture.expected.calibrationBand)
    expect(result.calibrationProfileId).toBe(caseFixture.expected.calibrationProfileId)

    if (caseFixture.expected.overallDecision) {
      expect(result.overallDecision).toBe(caseFixture.expected.overallDecision)
    }

    for (const expectedRule of caseFixture.expected.mustIncludeRules || []) {
      const hit = result.ruleHits.find(ruleHit => ruleHit.ruleId === expectedRule)
      expect(hit).toBeDefined()
      expect(hit?.offendingSurface).toBeDefined()
      expect((hit?.offendingText || '').length > 0 || (hit?.offendingPattern || '').length > 0).toBe(true)
    }
  })

  test('log-and-score mode preserves risk signals but prevents routing enforcement', () => {
    process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE = 'LOG_AND_SCORE'

    const fixture = HEADLINE_CALIBRATION_CORPUS[0]
    const batch = createBatchFixture(fixture)
    const decision = createDecisionFixture()
    const mic = createMICFixture(fixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(result, decision.decision_trace.trace_id, ['en'])

    expect(result.calibrationBand).toBe('RED')
    expect(result.operationalMode).toBe('LOG_AND_SCORE')
    expect(result.overallDecision).toBe('HEADLINE_PASS')
    expect(assessment).toBeNull()
  })

  test('hard-block-only mode keeps high-confidence red case in blocked state', () => {
    process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE = 'HARD_BLOCK_FOR_HIGH_CONFIDENCE_ONLY'

    const fixture = HEADLINE_CALIBRATION_CORPUS[0]
    const batch = createBatchFixture(fixture)
    const decision = createDecisionFixture()
    const mic = createMICFixture(fixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.operationalMode).toBe('HARD_BLOCK_FOR_HIGH_CONFIDENCE_ONLY')
    expect(result.calibrationBand).toBe('RED')
    expect(result.overallDecision).toBe('HEADLINE_BLOCK')
  })

  test('breaking profile applies stricter title and multilingual calibration thresholds', () => {
    const fixture = HEADLINE_CALIBRATION_CORPUS.find(item => item.id === 'amber_breaking_multilingual_drift') as HeadlineCalibrationCorpusCase
    const batch = createBatchFixture(fixture)
    const decision = createDecisionFixture()
    const mic = createMICFixture(fixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.calibrationProfileId).toBe('breaking_sensitive')
    expect(result.titleSurfaceAssessment.calibration.minLexicalOverlap).toBeGreaterThan(0.3)
    expect(result.multilingualAssessment.semanticVarianceThreshold).toBeLessThanOrEqual(0.35)

    const trDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'tr')
    expect(trDrift).toBeDefined()
    expect((trDrift?.pairThreshold || 1) <= 0.32).toBe(true)
  })

  test('market profile tightens EN->ES/JP pair thresholds for runtime multilingual focus', () => {
    const fixture = HEADLINE_CALIBRATION_CORPUS.find(item => item.id === 'red_market_deterministic_claims') as HeadlineCalibrationCorpusCase
    const batch = createBatchFixture(fixture)
    const decision = createDecisionFixture()
    const mic = createMICFixture(fixture)

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    const esDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'es')
    const jpDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'jp')

    expect(esDrift).toBeDefined()
    expect(jpDrift).toBeDefined()
    expect((esDrift?.pairThreshold || 1) <= 0.27).toBe(true)
    expect((jpDrift?.pairThreshold || 1) <= 0.23).toBe(true)
  })
})
