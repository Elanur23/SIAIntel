import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import type {
  BatchJob,
  ChiefEditorDecision,
  Language,
  LanguageEdition,
  MasterIntelligenceCore
} from '../core-types'
import { evaluateHeadlineIntelligenceGate, mapHeadlineGateResultToAssessment } from '../headline-intelligence/headline-gate'
import { buildHeadlineEditorReviewPayload } from '../headline-intelligence/editor-review-payload'

const ALL_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

function createDecisionFixture(): ChiefEditorDecision {
  const now = Date.now()
  return {
    overall_decision: 'ESCALATE',
    approved_languages: ['en'],
    rejected_languages: ['tr'],
    delayed_languages: [],
    reasons: ['headline review required'],
    requires_supervisor_review: true,
    confidence_score: 62,
    confidence_band: 'MEDIUM',
    confidence_reasons: ['fixture'],
    decision_trace: {
      trace_id: `trace_editor_payload_${now}`,
      stage: 'CHIEF_EDITOR',
      decision: 'ESCALATE',
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
    gate_results: []
  }
}

interface ScenarioConfig {
  id: string
  sourceTitle: string
  sourceLead: string
  sourceBody: string
  category: string
  urgency: 'breaking' | 'standard' | 'evergreen'
  sourceEntities: string[]
  seoTitle?: string
  ogTitle?: string
  socialTitle?: string
  homepageTitle?: string
  trTitle?: string
  trEntities?: string[]
}

function createEdition(
  language: Language,
  title: string,
  sourceLead: string,
  sourceBody: string,
  category: string,
  entities: string[],
  schema?: Record<string, unknown>
): LanguageEdition {
  return {
    id: `edition_${language}`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title,
      lead: sourceLead,
      body: {
        summary: sourceBody,
        full: sourceBody
      },
      schema: schema || {
        '@type': 'NewsArticle',
        headline: title
      }
    },
    metadata: {
      keywords: ['headline', 'editor-review-payload'],
      region: 'GLOBAL',
      category
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

function createBatchFixture(config: ScenarioConfig): BatchJob {
  const editions = Object.fromEntries(
    ALL_LANGUAGES.map((language) => {
      const localizedTitle = language === 'tr' && config.trTitle
        ? config.trTitle
        : config.sourceTitle

      const entities = language === 'tr' && config.trEntities
        ? config.trEntities
        : config.sourceEntities

      const schema = language === 'en'
        ? {
            '@type': 'NewsArticle',
            headline: config.sourceTitle,
            ...(config.seoTitle ? { seoTitle: config.seoTitle } : {}),
            ...(config.ogTitle ? { openGraph: { title: config.ogTitle } } : {}),
            ...(config.socialTitle ? { social: { title: config.socialTitle } } : {}),
            ...(config.homepageTitle ? { homepageTitle: config.homepageTitle } : {})
          }
        : {
            '@type': 'NewsArticle',
            headline: localizedTitle
          }

      return [
        language,
        createEdition(
          language,
          localizedTitle,
          config.sourceLead,
          config.sourceBody,
          config.category,
          entities,
          schema
        )
      ]
    })
  ) as Record<Language, LanguageEdition>

  return {
    id: `batch_${config.id}`,
    mic_id: `mic_${config.id}`,
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

function createMicFixture(config: ScenarioConfig): MasterIntelligenceCore {
  const now = Date.now()
  return {
    id: `mic_${config.id}_${now}`,
    version: 1,
    created_at: now,
    updated_at: now,
    truth_nucleus: {
      facts: [
        {
          id: 'fact_1',
          statement: config.sourceBody,
          confidence: 0.95,
          sources: ['https://example.com/source']
        }
      ],
      claims: [
        {
          id: 'claim_1',
          statement: config.sourceLead,
          verification_status: 'verified'
        }
      ],
      impact_analysis: 'Editor payload contract fixture',
      geopolitical_context: 'Low volatility context'
    },
    structural_atoms: {
      core_thesis: config.sourceTitle,
      key_entities: config.sourceEntities,
      temporal_markers: ['2026'],
      numerical_data: []
    },
    metadata: {
      category: config.category,
      urgency: config.urgency,
      target_regions: ['US']
    }
  }
}

function evaluateScenario(config: ScenarioConfig, includeInternalDebug = true) {
  const decision = createDecisionFixture()
  const batch = createBatchFixture(config)
  const mic = createMicFixture(config)

  const gateResult = evaluateHeadlineIntelligenceGate(batch, decision, mic)
  const assessment = mapHeadlineGateResultToAssessment(
    gateResult,
    decision.decision_trace.trace_id,
    ['en', 'tr']
  )

  const payload = buildHeadlineEditorReviewPayload({
    batchId: batch.id,
    traceId: decision.decision_trace.trace_id,
    auditId: `editorial-audit-${decision.decision_trace.trace_id}`,
    decisionDnaAuditId: 'decision-dna-audit-1',
    headlineGateResult: gateResult,
    headlineAssessment: assessment,
    includeInternalDebug
  })

  return {
    gateResult,
    assessment,
    payload
  }
}

describe('Headline Editor Review Payload Contract', () => {
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

  test('produces stable top-level editor review payload sections', () => {
    const result = evaluateScenario({
      id: 'shape',
      sourceTitle: 'Markets Will Certainly Crash 90% Today',
      sourceLead: 'Desks report uncertainty with no deterministic one-day direction.',
      sourceBody: 'Analysts describe two-sided risk and no confirmed emergency policy action.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Federal Reserve', 'Markets'],
      seoTitle: 'Emergency crash is guaranteed today',
      ogTitle: 'Calm market update',
      socialTitle: 'Certain collapse is now unavoidable',
      homepageTitle: 'Market update',
      trTitle: 'Piyasalar kesin garanti 500% cokus yasayacak',
      trEntities: ['Baska Aktor']
    })

    expect(result.payload).toBeDefined()
    expect(result.payload?.reviewHeader.contractVersion).toBe('1.0.0')
    expect(result.payload?.decisionSummary.oneLineRecommendation.length).toBeGreaterThan(0)
    expect(Array.isArray(result.payload?.topReasons)).toBe(true)
    expect(Array.isArray(result.payload?.reviewActionModel)).toBe(true)
    expect(result.payload?.fieldPriority.mandatoryEditorFields.length).toBeGreaterThan(0)
  })

  test('translates top reasons into editor-usable policy language', () => {
    const result = evaluateScenario({
      id: 'reasons',
      sourceTitle: 'Markets Will Certainly Crash 90% Today',
      sourceLead: 'Desks report uncertainty with no deterministic one-day direction.',
      sourceBody: 'Analysts describe two-sided risk and no confirmed emergency policy action.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Federal Reserve', 'Markets'],
      trTitle: 'Piyasalar kesin garanti 500% cokus yasayacak',
      trEntities: ['Baska Aktor']
    })

    const topReason = result.payload?.topReasons[0]
    expect(topReason).toBeDefined()
    expect(topReason?.policyLabel.length || 0).toBeGreaterThan(5)
    expect(topReason?.shortExplanation.length || 0).toBeGreaterThan(10)
    expect(topReason?.whyItMatters.length || 0).toBeGreaterThan(20)
  })

  test('exposes offending surface/text and evidence summaries when available', () => {
    const result = evaluateScenario({
      id: 'evidence',
      sourceTitle: 'Court confirms merger filing timeline update',
      sourceLead: 'The filing remains under review and no final ruling was published.',
      sourceBody: 'Court records show the process is ongoing and outcome uncertainty remains high.',
      category: 'legal enforcement',
      urgency: 'standard',
      sourceEntities: ['Court', 'Company'],
      trTitle: 'Mahkeme kesin garanti suclu karari verdi',
      trEntities: ['Court']
    })

    const topReason = result.payload?.topReasons[0]
    expect(topReason?.offendingSurface).toBeDefined()
    expect(Array.isArray(topReason?.evidenceSummary)).toBe(true)
    expect((topReason?.evidenceSummary.length || 0) > 0).toBe(true)
    expect(topReason?.suggestedFix.length || 0).toBeGreaterThan(5)
  })

  test('summarizes title-surface divergence for editor review', () => {
    const result = evaluateScenario({
      id: 'surface',
      sourceTitle: 'Fed holds rates steady after policy meeting',
      sourceLead: 'Officials held rates and offered data-dependent guidance.',
      sourceBody: 'No emergency cut or immediate policy pivot was announced in the statement.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Federal Reserve'],
      seoTitle: 'Fed confirms emergency cut now in effect',
      ogTitle: 'Fed holds rates steady in regular meeting',
      socialTitle: 'Markets panic after emergency policy shift',
      homepageTitle: 'Fed policy update'
    })

    expect(result.payload?.titleSurfaceSummary.status).toBe('DIVERGENT')
    expect((result.payload?.titleSurfaceSummary.inconsistentPairCount || 0) > 0).toBe(true)
    expect((result.payload?.titleSurfaceSummary.problematicPairs.length || 0) > 0).toBe(true)
  })

  test('summarizes multilingual drift and highlights impacted languages', () => {
    const result = evaluateScenario({
      id: 'multilingual',
      sourceTitle: 'Regulator opens consultation on draft disclosure framework',
      sourceLead: 'Officials said no final enforcement timeline has been approved.',
      sourceBody: 'The legal status remains draft-only during the public consultation phase.',
      category: 'regulation / policy',
      urgency: 'standard',
      sourceEntities: ['Regulator'],
      trTitle: 'Duzenleyici kesin garanti kurallari hemen onayladi',
      trEntities: ['Regulator']
    })

    expect(result.payload?.multilingualSummary.status).toBe('DRIFT_DETECTED')
    expect(result.payload?.multilingualSummary.impactedLanguages.includes('tr')).toBe(true)
    expect((result.payload?.multilingualSummary.driftHighlights.length || 0) > 0).toBe(true)
  })

  test('includes escalation class and operational instruction when review is required', () => {
    const result = evaluateScenario({
      id: 'escalation',
      sourceTitle: 'Markets Will Certainly Crash 90% Today',
      sourceLead: 'Desks report uncertainty with no deterministic one-day direction.',
      sourceBody: 'Analysts describe two-sided risk and no confirmed emergency policy action.',
      category: 'macro markets',
      urgency: 'breaking',
      sourceEntities: ['Markets']
    })

    expect(result.payload?.escalationSummary.escalationRequired).toBe(true)
    expect(result.payload?.escalationSummary.escalationClass).not.toBe('NONE')
    expect((result.payload?.escalationSummary.escalationInstruction.length || 0) > 10).toBe(true)
  })

  test('keeps internal debug fields separated from primary editor-facing sections', () => {
    const result = evaluateScenario({
      id: 'debug',
      sourceTitle: 'Markets Will Certainly Crash 90% Today',
      sourceLead: 'Desks report uncertainty with no deterministic one-day direction.',
      sourceBody: 'Analysts describe two-sided risk and no confirmed emergency policy action.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Markets']
    })

    expect(result.payload?.internalDebug).toBeDefined()
    expect((result.payload?.internalDebug?.rawRuleIds.length || 0) > 0).toBe(true)
    expect((result.payload?.fieldPriority.internalDebugFields.length || 0) > 0).toBe(true)
    expect('rawRuleIds' in (result.payload?.decisionSummary || {})).toBe(false)
  })

  test('supports disabling internal debug section while preserving editor-facing payload', () => {
    const result = evaluateScenario({
      id: 'debug-off',
      sourceTitle: 'Fed holds rates steady after policy meeting',
      sourceLead: 'Officials held rates and offered data-dependent guidance.',
      sourceBody: 'No emergency cut or immediate policy pivot was announced in the statement.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Federal Reserve']
    }, false)

    expect(result.payload?.internalDebug).toBeUndefined()
    expect(result.payload?.decisionSummary.oneLineRecommendation.length || 0).toBeGreaterThan(0)
  })

  test('defines required review actions with minimum field sets for downstream UI', () => {
    const result = evaluateScenario({
      id: 'actions',
      sourceTitle: 'Markets Will Certainly Crash 90% Today',
      sourceLead: 'Desks report uncertainty with no deterministic one-day direction.',
      sourceBody: 'Analysts describe two-sided risk and no confirmed emergency policy action.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Markets']
    })

    const actions = result.payload?.reviewActionModel || []
    const actionIds = actions.map(action => action.action)

    expect(actionIds).toContain('APPROVE_AS_IS')
    expect(actionIds).toContain('ACCEPT_SUGGESTED_FIX')
    expect(actionIds).toContain('MANUAL_REVISION')
    expect(actionIds).toContain('REQUEST_REWRITE')
    expect(actionIds).toContain('ESCALATE_SENIOR_EDITOR')
    expect(actionIds).toContain('ESCALATE_LEGAL_REVIEW')
    expect(actionIds).toContain('ESCALATE_MARKET_REVIEW')
    expect(actionIds).toContain('HOLD_FROM_PUBLISH')

    for (const action of actions) {
      expect(action.minimumFields.length).toBeGreaterThan(0)
    }
  })

  test('produces approve-as-is recommendation for low-risk pass cases', () => {
    process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE = 'LOG_AND_SCORE'

    const result = evaluateScenario({
      id: 'pass',
      sourceTitle: 'Fed holds rates steady as inflation eases gradually',
      sourceLead: 'Officials held rates and said progress remains gradual and data-dependent.',
      sourceBody: 'The statement confirms no emergency action and notes measured inflation improvement.',
      category: 'macro markets',
      urgency: 'standard',
      sourceEntities: ['Federal Reserve', 'Markets']
    })

    expect(result.gateResult.overallDecision).toBe('HEADLINE_PASS')
    expect(result.assessment).toBeNull()
    expect(result.payload?.decisionSummary.recommendedAction).toBe('APPROVE_AS_IS')
    expect(result.payload?.decisionSummary.holdFromPublish).toBe(false)
  })
})
