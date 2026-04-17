import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { MasterOrchestrator } from '../master-orchestrator'
import type {
  BatchJob,
  ChiefEditorDecision,
  Language,
  LanguageEdition,
  MasterIntelligenceCore
} from '../core-types'
import { evaluateHeadlineIntelligenceGate, mapHeadlineGateResultToAssessment } from '../headline-intelligence/headline-gate'
import * as chiefEditorModule from '../chief-editor-engine'
import * as databaseModule from '../database'
import * as eventBusModule from '../editorial-event-bus'
import * as observabilityModule from '../observability'

const ALL_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

function createMIC(overrides?: Partial<MasterIntelligenceCore>): MasterIntelligenceCore {
  const now = Date.now()
  return {
    id: `mic_hiol_${now}`,
    version: 1,
    created_at: now,
    updated_at: now,
    truth_nucleus: {
      facts: [
        {
          id: 'fact_1',
          statement: 'Federal Reserve held rates steady in April 2026.',
          confidence: 0.95,
          sources: ['https://example.com/fed']
        }
      ],
      claims: [
        {
          id: 'claim_1',
          statement: 'Markets are reacting cautiously to policy hold.',
          verification_status: 'verified'
        }
      ],
      impact_analysis: 'Moderate macro impact.',
      geopolitical_context: 'Low geopolitical volatility.'
    },
    structural_atoms: {
      core_thesis: 'Federal Reserve held rates steady and markets reacted cautiously',
      key_entities: ['Federal Reserve', 'Markets'],
      temporal_markers: ['April 2026'],
      numerical_data: [
        { value: 2026, unit: 'year', context: 'reporting date' }
      ]
    },
    metadata: {
      category: 'macro markets',
      urgency: 'standard',
      target_regions: ['US']
    },
    ...overrides
  }
}

function createEdition(language: Language, title?: string): LanguageEdition {
  return {
    id: `edition_${language}_hiol`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title: title || `Fed Holds Rates Steady ${language}`,
      lead: 'Federal Reserve kept rates unchanged as markets digested policy messaging.',
      body: {
        summary: 'The central bank held rates steady in April 2026 while market reaction stayed measured.',
        full: 'Federal Reserve officials held benchmark rates steady in April 2026. Market participants reacted cautiously, with no official policy shift toward emergency actions.'
      },
      schema: {
        '@type': 'NewsArticle',
        headline: title || `Fed Holds Rates Steady ${language}`
      },
      internalLinks: [`https://example.com/${language}/macro`]
    },
    metadata: {
      keywords: ['fed', 'rates', 'macro'],
      region: 'US',
      category: 'macro markets'
    },
    entities: ['Federal Reserve', 'Markets'],
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

function createBatch(batchId: string): BatchJob {
  const editions = Object.fromEntries(
    ALL_LANGUAGES.map(language => [language, createEdition(language)])
  ) as Record<Language, LanguageEdition>

  return {
    id: batchId,
    mic_id: `mic_${batchId}`,
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

function createDecision(overrides?: Partial<ChiefEditorDecision>): ChiefEditorDecision {
  const now = Date.now()
  return {
    overall_decision: 'REJECT',
    approved_languages: ['en'],
    rejected_languages: ['tr'],
    delayed_languages: [],
    reasons: ['headline review required'],
    requires_supervisor_review: false,
    confidence_score: 62,
    confidence_band: 'MEDIUM',
    confidence_reasons: ['fixture'],
    decision_trace: {
      trace_id: `trace_hiol_${now}`,
      stage: 'CHIEF_EDITOR',
      decision: 'REJECT',
      confidence_score: 62,
      hard_rule_hits: [],
      reasons: ['headline review required'],
      emitted_events: [],
      timestamp: new Date(now).toISOString(),
      rule_checks: [],
      semantic_analysis: null,
      risk_assessment: {
        overall_risk_score: 30,
        policy_risk: 20,
        financial_risk: 20,
        geopolitical_risk: 10,
        legal_risk: 10,
        brand_safety_risk: 20,
        risk_factors: []
      },
      final_reasoning: 'fixture'
    },
    timestamp: now,
    gate_results: [],
    ...overrides
  }
}

describe('Headline Intelligence Operating Layer - Gate Core', () => {
  test('detects clickbait template and produces correction/review controls', () => {
    const batch = createBatch('hiol_clickbait')
    batch.editions.en.content.title = '7 Reasons This Fed Move Will Change Everything'

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'CLICKBAIT_TEMPLATE')).toBe(true)
    expect(result.overallDecision === 'HEADLINE_CORRECTION_REQUIRED' || result.overallDecision === 'HEADLINE_REVIEW_REQUIRED' || result.overallDecision === 'HEADLINE_BLOCK').toBe(true)
  })

  test('detects thesis drift against source thesis markers', () => {
    const batch = createBatch('hiol_thesis')
    batch.editions.en.content.title = 'Celebrity Scandal Breaks Internet Overnight'

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'THESIS_DRIFT')).toBe(true)
  })

  test('detects unsupported certainty and routes to review path', () => {
    const batch = createBatch('hiol_certainty')
    batch.editions.en.content.title = 'Markets Will Certainly Surge 100% Today'

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(result, decision.decision_trace.trace_id, ['en'])

    expect(result.ruleHits.some(hit => hit.ruleId === 'UNSUPPORTED_CERTAINTY')).toBe(true)
    expect(assessment?.routing_action === 'HUMAN_REVIEW_REQUIRED' || assessment?.routing_action === 'SUPERVISOR_REVIEW_REQUIRED').toBe(true)
  })

  test('detects misleading number/date mismatch', () => {
    const batch = createBatch('hiol_number_date')
    batch.editions.en.content.title = 'Fed Announces 75% Emergency Rate Cut in 2028'

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'MISLEADING_NUMBER_OR_DATE')).toBe(true)
  })

  test('detects title surface inconsistency across editorial, SEO and social surfaces', () => {
    const batch = createBatch('hiol_surface')
    batch.editions.en.content.schema = {
      '@type': 'NewsArticle',
      headline: 'Fed Holds Rates Steady',
      seoTitle: 'Fed Slashes Rates 50% in Emergency Move',
      openGraph: { title: 'Fed Holds Rates in Calm Policy Session' },
      social: { title: 'Markets Collapse After Emergency Fed Cut' }
    }

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'TITLE_SURFACE_INCONSISTENCY')).toBe(true)
    expect(result.titleSurfaceAssessment.inconsistentPairs.length).toBeGreaterThan(0)
  })

  test('detects multilingual drift and local exaggeration from source anchor', () => {
    const batch = createBatch('hiol_multilingual')
    batch.editions.en.content.title = 'Fed Holds Rates Steady as Markets React Cautiously'
    batch.editions.tr.content.title = 'Piyasalar kesin garanti 500% cokus yasayacak'
    batch.editions.tr.entities = ['Baska Aktor']

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'MULTILINGUAL_DRIFT')).toBe(true)
    expect(result.ruleHits.some(hit => hit.ruleId === 'LOCAL_LANGUAGE_EXAGGERATION')).toBe(true)
  })

  test('detects EN->ES/JP native-script certainty amplification in runtime focus pairs', () => {
    const batch = createBatch('hiol_multilingual_en_es_jp')
    batch.editions.en.content.title = 'Index futures trade mixed as volatility remains elevated'
    batch.editions.es.content.title = 'Mercados subiran con certeza total y sin riesgo hoy'
    batch.editions.jp.content.title = '市場は必ず急騰し、リスクゼロで暴落を回避する'

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    expect(result.ruleHits.some(hit => hit.ruleId === 'MULTILINGUAL_DRIFT')).toBe(true)
    expect(result.ruleHits.some(hit => hit.ruleId === 'LOCAL_LANGUAGE_EXAGGERATION')).toBe(true)

    const esDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'es')
    const jpDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'jp')

    expect(esDrift?.localExaggeration).toBe(true)
    expect(jpDrift?.localExaggeration).toBe(true)
    expect(['CORRECT', 'REVIEW'].includes(esDrift?.action || '')).toBe(true)
    expect(['CORRECT', 'REVIEW'].includes(jpDrift?.action || '')).toBe(true)
  })

  test('allows strong but evidence-aligned ES/JP phrasing without exaggeration flags', () => {
    const batch = createBatch('hiol_multilingual_focus_non_risk')
    const sourceTitle = 'Federal Reserve holds rates steady as markets show firm rebound momentum'

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = sourceTitle
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: sourceTitle
      }
    }

    batch.editions.es.content.title = 'La Reserva Federal mantiene tasas estables y los mercados muestran un firme impulso de rebote'
    batch.editions.es.content.schema = {
      ...(batch.editions.es.content.schema || {}),
      headline: batch.editions.es.content.title
    }

    batch.editions.jp.content.title = 'FRBは金利を据え置き、市場は力強い反発の勢いを示している'
    batch.editions.jp.content.schema = {
      ...(batch.editions.jp.content.schema || {}),
      headline: batch.editions.jp.content.title
    }

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    const esDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'es')
    const jpDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'jp')

    expect(esDrift?.localExaggeration).toBe(false)
    expect(jpDrift?.certaintyAmplification).toBe(false)
    expect(esDrift?.violatedInvariants.includes('localExaggeration')).toBe(false)
    expect(jpDrift?.violatedInvariants.includes('thesisPolarity')).toBe(false)
    expect(esDrift?.action).toBe('ALLOW')
    expect(jpDrift?.action).toBe('ALLOW')
  })

  test('still escalates real ES/JP drift and exaggeration in control cases', () => {
    const batch = createBatch('hiol_multilingual_focus_control')
    const sourceTitle = 'Federal Reserve holds rates steady as markets react cautiously'

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = sourceTitle
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: sourceTitle
      }
    }

    batch.editions.es.content.title = 'La Reserva Federal garantiza que los mercados subiran sin riesgo hoy'
    batch.editions.es.entities = ['Actor Distinto']
    batch.editions.es.content.schema = {
      ...(batch.editions.es.content.schema || {}),
      headline: batch.editions.es.content.title
    }

    batch.editions.jp.content.title = 'FRBの据え置きで市場は必ず急騰し、リスクゼロになる'
    batch.editions.jp.content.schema = {
      ...(batch.editions.jp.content.schema || {}),
      headline: batch.editions.jp.content.title
    }

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)

    const esDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'es')
    const jpDrift = result.multilingualAssessment.driftByLanguage.find(item => item.language === 'jp')

    expect(result.ruleHits.some(hit => hit.ruleId === 'MULTILINGUAL_DRIFT')).toBe(true)
    expect(result.ruleHits.some(hit => hit.ruleId === 'LOCAL_LANGUAGE_EXAGGERATION')).toBe(true)
    expect(esDrift?.action).toBe('REVIEW')
    expect(jpDrift?.certaintyAmplification).toBe(true)
    expect(['CORRECT', 'REVIEW'].includes(jpDrift?.action || '')).toBe(true)
  })

  test('keeps borderline but acceptable EN phrasing below human-review escalation', () => {
    const batch = createBatch('hiol_borderline_en_safe')

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = 'Federal Reserve holds rates steady as markets react cautiously'
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: batch.editions[language].content.title
      }
    }

    batch.editions.en.content.title = 'Federal Reserve holds rates steady as markets brace for a choppy session'
    batch.editions.en.content.schema = {
      ...(batch.editions.en.content.schema || {}),
      headline: batch.editions.en.content.title
    }

    const decision = createDecision()
    const mic = createMIC()

    const result = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(result, decision.decision_trace.trace_id, ['en'])

    expect(result.ruleHits.some(hit => hit.ruleId === 'UNSUPPORTED_CERTAINTY')).toBe(false)
    expect(assessment?.routing_action === 'HUMAN_REVIEW_REQUIRED' || assessment?.routing_action === 'SUPERVISOR_REVIEW_REQUIRED').toBe(false)
  })
})

describe('Headline Intelligence Operating Layer - Orchestrator Integration', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('maps escalation class into escalation record routing', () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createBatch('hiol_escalation')
    batch.editions.en.content.title = 'Markets Will Certainly Crash Today'

    const decision = createDecision()
    const mic = createMIC()

    const gate = evaluateHeadlineIntelligenceGate(batch, decision, mic)
    const assessment = mapHeadlineGateResultToAssessment(gate, decision.decision_trace.trace_id, ['en'])

    expect(assessment).toBeDefined()
    const escalation = (orchestrator as any).mapHeadlineAssessmentToEscalation(assessment, decision)

    expect(escalation).toBeDefined()
    expect(escalation.escalation_class).toBeDefined()
  })

  test('persists structured HIOL payload and emits observability envelope', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createBatch('hiol_persistence')
    batch.editions.en.content.title = 'Markets Will Certainly Crash 90% Today'

    const mic = createMIC({
      metadata: {
        category: 'macro markets',
        urgency: 'standard',
        target_regions: ['US']
      }
    })

    const chiefEditorDecision = createDecision({
      overall_decision: 'ESCALATE',
      reasons: ['headline integrity review']
    })

    const saveEditorialDecisionAudit = jest.fn()

    jest
      .spyOn(chiefEditorModule, 'getGlobalChiefEditor')
      .mockReturnValue({
        makeDecision: jest.fn().mockImplementation(async () => chiefEditorDecision)
      } as any)

    jest
      .spyOn(databaseModule, 'getGlobalDatabase')
      .mockReturnValue({
        saveDecisionDNA: jest.fn(),
        saveDecisionTrace: jest.fn(),
        saveEditorialDecisionAudit,
        saveBatch: jest.fn(),
        saveCheckpoint: jest.fn(),
        setIdempotency: jest.fn(),
        acquireLock: jest.fn().mockReturnValue(true),
        releaseLock: jest.fn()
      } as any)

    jest
      .spyOn(eventBusModule, 'getGlobalEventBus')
      .mockReturnValue({
        publish: jest.fn().mockImplementation(async () => undefined)
      } as any)

    const logSpy = jest.spyOn(observabilityModule, 'logOperation')

    jest
      .spyOn(orchestrator as any, 'routeChiefEditorDecision')
      .mockResolvedValue(undefined)

    const decision = await orchestrator.chiefEditorReview(batch, mic)

    expect(decision.headline_intelligence_v1).toBeDefined()
    expect(decision.headline_intelligence_v1?.scoreBreakdown.length).toBeGreaterThan(0)
    expect(decision.editor_review_payload_v1).toBeDefined()
    expect(decision.editor_review_payload_v1?.decisionSummary.oneLineRecommendation.length).toBeGreaterThan(0)
    expect(decision.editor_review_payload_v1?.reviewActionModel.length).toBeGreaterThan(0)

    expect(saveEditorialDecisionAudit).toHaveBeenCalled()
    const persistedAudit = saveEditorialDecisionAudit.mock.calls[0][0] as {
      gate_payload: {
        headline_intelligence_v1: {
          ruleHits: unknown[]
          titleSurfaceAssessment: unknown
          multilingualAssessment: unknown
        }
        editor_review_payload_v1: {
          decisionSummary: {
            oneLineRecommendation: string
            overallDecision: string
          }
          topReasons: unknown[]
          escalationSummary: {
            escalationClass: string
          }
          fieldPriority: {
            mandatoryEditorFields: string[]
          }
        }
      }
    }
    expect(persistedAudit.gate_payload.headline_intelligence_v1).toBeDefined()
    expect(Array.isArray(persistedAudit.gate_payload.headline_intelligence_v1.ruleHits)).toBe(true)
    expect(persistedAudit.gate_payload.headline_intelligence_v1.titleSurfaceAssessment).toBeDefined()
    expect(persistedAudit.gate_payload.headline_intelligence_v1.multilingualAssessment).toBeDefined()
    expect(persistedAudit.gate_payload.editor_review_payload_v1).toBeDefined()
    expect(persistedAudit.gate_payload.editor_review_payload_v1.decisionSummary.oneLineRecommendation.length).toBeGreaterThan(0)
    expect(Array.isArray(persistedAudit.gate_payload.editor_review_payload_v1.topReasons)).toBe(true)
    expect(persistedAudit.gate_payload.editor_review_payload_v1.escalationSummary.escalationClass.length).toBeGreaterThan(0)
    expect(persistedAudit.gate_payload.editor_review_payload_v1.fieldPriority.mandatoryEditorFields.length).toBeGreaterThan(0)

    const hasHeadlineLog = logSpy.mock.calls.some(call =>
      call[1] === 'HEADLINE_INTELLIGENCE_OPERATING_LAYER'
    )
    expect(hasHeadlineLog).toBe(true)
  })
})
