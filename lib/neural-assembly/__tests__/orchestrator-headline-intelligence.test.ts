import { MasterOrchestrator } from '../master-orchestrator'
import type { BatchJob, ChiefEditorDecision, Language, LanguageEdition, MasterIntelligenceCore } from '../core-types'
import { getGlobalBlackboard, resetGlobalBlackboard } from '../blackboard-system'
import * as chiefEditorModule from '../chief-editor-engine'
import * as databaseModule from '../database'
import * as eventBusModule from '../editorial-event-bus'
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

const ALL_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

function createMockMIC(id: string): MasterIntelligenceCore {
  return {
    id,
    version: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    truth_nucleus: {
      facts: [
        {
          id: 'fact_001',
          statement: 'Institutional flows increased in the last 24 hours.',
          confidence: 0.92,
          sources: ['https://example.com/source-1']
        }
      ],
      claims: [
        {
          id: 'claim_001',
          statement: 'Institutional participation remains stable in this cycle.',
          verification_status: 'verified'
        }
      ],
      impact_analysis: 'Moderate impact.',
      geopolitical_context: 'Stable context.'
    },
    structural_atoms: {
      core_thesis: 'Institutional participation remains stable',
      key_entities: ['Institutional Participants'],
      temporal_markers: ['April 2026'],
      numerical_data: [{ value: 24, unit: 'hours', context: 'analysis window' }]
    },
    metadata: {
      category: 'Science',
      urgency: 'standard',
      target_regions: ['GLOBAL']
    }
  }
}

function createMockEdition(language: Language): LanguageEdition {
  return {
    id: `edition_${language}_headline`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title: `Global Market Pulse ${language}`,
      lead: 'Structured update with transparent claim and evidence alignment.',
      body: {
        summary: 'Measured summary aligned to verified evidence and uncertainty bounds.',
        full: 'Long-form body content that satisfies deterministic thresholds and avoids unsupported certainty packaging while preserving source-grounded reporting quality for editorial governance tests.'
      },
      schema: {
        '@type': 'NewsArticle',
        headline: `Global Market Pulse ${language}`,
        inLanguage: language
      },
      internalLinks: [
        `https://example.com/${language}/news`,
        `https://example.com/${language}/analysis`
      ]
    },
    metadata: {
      keywords: ['market', 'analysis', 'claims'],
      region: 'GLOBAL',
      category: 'Science'
    },
    entities: ['Institutional Participants'],
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

function createMockBatch(id: string): BatchJob {
  return {
    id,
    mic_id: `mic_${id}`,
    user_id: 'test-user',
    status: 'IN_PROGRESS',
    created_at: Date.now(),
    updated_at: Date.now(),
    editions: Object.fromEntries(ALL_LANGUAGES.map(language => [language, createMockEdition(language)])) as Record<Language, LanguageEdition>,
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

function createDecisionSkeleton(overrides?: Partial<ChiefEditorDecision>): ChiefEditorDecision {
  const now = Date.now()
  return {
    overall_decision: 'REJECT',
    approved_languages: ['en'],
    rejected_languages: ['tr'],
    delayed_languages: [],
    reasons: ['Headline review required'],
    requires_supervisor_review: false,
    confidence_score: 61,
    confidence_band: 'MEDIUM',
    confidence_reasons: ['base fixture'],
    decision_trace: {
      trace_id: `trace_${now}`,
      stage: 'CHIEF_EDITOR',
      decision: 'REJECT',
      confidence_score: 61,
      hard_rule_hits: [],
      reasons: ['Headline review required'],
      emitted_events: [],
      timestamp: new Date(now).toISOString(),
      rule_checks: [],
      semantic_analysis: null,
      risk_assessment: {
        overall_risk_score: 20,
        policy_risk: 10,
        financial_risk: 10,
        geopolitical_risk: 10,
        legal_risk: 10,
        brand_safety_risk: 10,
        risk_factors: []
      },
      final_reasoning: 'Fixture decision'
    },
    timestamp: now,
    gate_results: [],
    ...overrides
  }
}

function mockDatabaseAndEventBus(): void {
  jest
    .spyOn(databaseModule, 'getGlobalDatabase')
    .mockReturnValue({
      saveDecisionDNA: jest.fn(),
      saveDecisionTrace: jest.fn(),
      saveEditorialDecisionAudit: jest.fn(),
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
}

describe('Headline Intelligence Engine V1', () => {
  beforeEach(() => {
    resetGlobalBlackboard()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('routes low-severity headline inflation issue to correction-only path', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_low_batch')
    const mic = createMockMIC('headline_low_mic')
    const blackboard = getGlobalBlackboard()

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = 'Institutional Participation Remains Stable'
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: 'Institutional Participation Remains Stable'
      }
      batch.editions[language].content.lead = 'Institutional participation remains stable in this cycle according to verified evidence.'
      batch.editions[language].content.body.summary = 'Institutional participation remains stable in this cycle according to verified evidence.'
      batch.editions[language].content.body.full = 'Institutional participation remains stable in this cycle according to verified evidence and trusted reporting context.'
    }

    batch.editions.en.content.title = 'Shocking Institutional Participation Update'
    batch.editions.en.content.schema = {
      ...(batch.editions.en.content.schema || {}),
      headline: 'Shocking Institutional Participation Update'
    }
    batch.editions.en.content.lead = 'Institutional participation remains stable in this cycle according to verified evidence.'
    batch.editions.en.content.body.summary = 'Institutional participation remains stable in this cycle according to verified evidence.'
    batch.editions.en.content.body.full = 'Institutional participation remains stable in this cycle according to verified evidence and trusted reporting context.'

    blackboard.write(`batch.${batch.id}`, batch, 'system')

    mockDatabaseAndEventBus()

    const decision = createDecisionSkeleton({
      overall_decision: 'REJECT',
      reasons: ['Headline requires stylistic correction']
    })

    const assessment = (orchestrator as any).classifyHeadlineIntelligenceV1(decision, batch)
    expect(assessment).toBeDefined()
    expect(assessment.routing_action).toBe('CORRECTION_REQUIRED')

    decision.headline_assessment_v1 = assessment
    decision.decision_trace.headline_assessment_v1 = assessment

    const remediation = (orchestrator as any).mapHeadlineAssessmentToRemediation(assessment, batch)
    decision.remediation_classification_v1 = remediation
    decision.decision_trace.remediation_classification_v1 = remediation

    const sendToHealingSpy = jest
      .spyOn(orchestrator as any, 'sendToHealing')
      .mockResolvedValue(undefined)

    await (orchestrator as any).routeChiefEditorDecision(batch, mic, decision)

    const updatedBatch = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(updatedBatch.status).toBe('CORRECTION_REQUIRED')
    expect(sendToHealingSpy).toHaveBeenCalled()
  })

  test('routes unsupported certainty headline issue to HUMAN_REVIEW_REQUIRED', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_medium_batch')
    const mic = createMockMIC('headline_medium_mic')
    const blackboard = getGlobalBlackboard()

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = 'Institutional Participation Remains Stable'
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: 'Institutional Participation Remains Stable'
      }
      batch.editions[language].content.lead = 'Institutional participation remains stable in this cycle.'
      batch.editions[language].content.body.summary = 'Institutional participation remains stable in this cycle.'
      batch.editions[language].content.body.full = 'Institutional participation remains stable in this cycle with measured evidence context.'
    }

    batch.editions.en.content.title = 'Institutional Participation Certainly Remains Stable'
    batch.editions.en.content.schema = {
      ...(batch.editions.en.content.schema || {}),
      headline: 'Institutional Participation Certainly Remains Stable'
    }
    batch.editions.en.content.lead = 'Institutional participation remains stable in this cycle.'
    batch.editions.en.content.body.summary = 'Institutional participation remains stable in this cycle.'
    batch.editions.en.content.body.full = 'Institutional participation remains stable in this cycle with measured evidence context.'

    blackboard.write(`batch.${batch.id}`, batch, 'system')

    mockDatabaseAndEventBus()

    const decision = createDecisionSkeleton({
      overall_decision: 'ESCALATE',
      reasons: ['Headline certainty needs human review'],
      requires_supervisor_review: false
    })

    const assessment = (orchestrator as any).classifyHeadlineIntelligenceV1(decision, batch)
    expect(assessment).toBeDefined()
    expect(assessment.routing_action).toBe('HUMAN_REVIEW_REQUIRED')

    decision.headline_assessment_v1 = assessment
    decision.decision_trace.headline_assessment_v1 = assessment

    const escalation = (orchestrator as any).mapHeadlineAssessmentToEscalation(assessment, decision)
    decision.escalation_record_v1 = escalation
    decision.decision_trace.escalation_record_v1 = escalation

    const routeEscalateSpy = jest
      .spyOn(orchestrator as any, 'routeEscalate')
      .mockResolvedValue(undefined)

    await (orchestrator as any).routeChiefEditorDecision(batch, mic, decision)

    const updatedBatch = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(updatedBatch.status).toBe('MANUAL_REVIEW')
    expect(updatedBatch.decision_type).toBe('HUMAN_REVIEW_REQUIRED')
    expect(routeEscalateSpy).not.toHaveBeenCalled()
  })

  test('routes substantive unsupported headline claim to SUPERVISOR_REVIEW_REQUIRED', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_high_batch')
    const mic = createMockMIC('headline_high_mic')
    const blackboard = getGlobalBlackboard()

    batch.editions.en.content.title = 'Bitcoin Will Certainly Hit 500% Today'

    blackboard.write(`batch.${batch.id}`, batch, 'system')

    mockDatabaseAndEventBus()

    const decision = createDecisionSkeleton({
      overall_decision: 'REJECT',
      reasons: ['Critical claim disputed by trusted sources'],
      truth_gate: {
        gate_decision: 'BLOCK',
        severity: 'CRITICAL',
        critical_truth_outcome: 'DISPUTED',
        reason_codes: ['TRUTH_DISPUTED_CRITICAL_CLAIM'],
        reasoning: 'Critical claim disputed',
        truth_markers: {
          total_critical_claims: 1,
          supported_claims: 0,
          disputed_claims: 1,
          unverifiable_claims: 0,
          unsupported_claims: 0,
          provenance_missing_claims: 0
        },
        provenance_binding: {
          claim_graph_digest_prefix: 'a1b2c3d4',
          evidence_ledger_digest_prefix: 'e5f6g7h8',
          bound_to_provenance: true
        }
      },
      gate_results: [
        {
          gate_id: 'TRUTH_GATE',
          gate_version: '1.0.0',
          manifest_hash: 'manifest-hash',
          trace_id: 'trace-headline-high',
          decision: 'BLOCK',
          severity: 'CRITICAL',
          confidence_score: 95,
          risk_reasons: ['TRUTH_DISPUTED_CRITICAL_CLAIM'],
          reasoning: 'Critical claim disputed',
          affected_languages: ['en', 'tr'],
          mitigation_instructions: null,
          reason_codes: ['TRUTH_DISPUTED_CRITICAL_CLAIM'],
          execution_telemetry: {
            status_code: 200,
            latency_ms: 0,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        }
      ]
    })

    const assessment = (orchestrator as any).classifyHeadlineIntelligenceV1(decision, batch)
    expect(assessment).toBeDefined()
    expect(assessment.routing_action).toBe('SUPERVISOR_REVIEW_REQUIRED')

    decision.headline_assessment_v1 = assessment
    decision.decision_trace.headline_assessment_v1 = assessment

    const escalation = (orchestrator as any).mapHeadlineAssessmentToEscalation(assessment, decision)
    decision.escalation_record_v1 = escalation
    decision.decision_trace.escalation_record_v1 = escalation

    jest
      .spyOn(orchestrator as any, 'routeToAISupervisor')
      .mockResolvedValue(undefined)

    await (orchestrator as any).routeChiefEditorDecision(batch, mic, decision)

    const updatedBatch = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(updatedBatch.status).toBe('SUPERVISOR_REVIEW')
    expect(updatedBatch.requires_supervisor_review).toBe(true)
  })

  test('attaches headline_assessment_v1 to decision payload and trace on exercised chiefEditorReview path', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_trace_batch')
    const mic = createMockMIC('headline_trace_mic')

    batch.editions.en.content.title = 'Markets Will Certainly Rise'

    const chiefEditorDecision = createDecisionSkeleton({
      overall_decision: 'ESCALATE',
      reasons: ['Headline certainty requires review'],
      requires_supervisor_review: false
    })

    jest
      .spyOn(chiefEditorModule, 'getGlobalChiefEditor')
      .mockReturnValue({
        makeDecision: jest.fn().mockImplementation(async () => chiefEditorDecision)
      } as any)

    mockDatabaseAndEventBus()

    jest
      .spyOn(orchestrator as any, 'routeChiefEditorDecision')
      .mockResolvedValue(undefined)

    const decision = await orchestrator.chiefEditorReview(batch, mic)

    expect(decision.headline_assessment_v1).toBeDefined()
    expect(decision.headline_assessment_v1?.passed).toBe(false)
    expect(decision.decision_trace.headline_assessment_v1).toBeDefined()
  })

  test('runtime path computes headline assessment and routes to HUMAN_REVIEW_REQUIRED', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_runtime_batch')
    const mic = createMockMIC('headline_runtime_mic')
    const blackboard = getGlobalBlackboard()

    for (const language of ALL_LANGUAGES) {
      batch.editions[language].content.title = 'Institutional Participation Remains Stable'
      batch.editions[language].content.schema = {
        ...(batch.editions[language].content.schema || {}),
        headline: 'Institutional Participation Remains Stable'
      }
      batch.editions[language].content.lead = 'Institutional participation remains stable in this cycle.'
      batch.editions[language].content.body.summary = 'Institutional participation remains stable in this cycle.'
      batch.editions[language].content.body.full = 'Institutional participation remains stable in this cycle with measured evidence context.'
    }

    batch.editions.en.content.title = 'Institutional Participation Certainly Remains Stable'
    batch.editions.en.content.schema = {
      ...(batch.editions.en.content.schema || {}),
      headline: 'Institutional Participation Certainly Remains Stable'
    }
    batch.editions.en.content.lead = 'Institutional participation remains stable in this cycle.'
    batch.editions.en.content.body.summary = 'Institutional participation remains stable in this cycle.'
    batch.editions.en.content.body.full = 'Institutional participation remains stable in this cycle with measured evidence context.'

    blackboard.write(`batch.${batch.id}`, batch, 'system')

    const chiefEditorDecision = createDecisionSkeleton({
      overall_decision: 'ESCALATE',
      reasons: ['Headline certainty requires review'],
      requires_supervisor_review: false
    })

    jest
      .spyOn(chiefEditorModule, 'getGlobalChiefEditor')
      .mockReturnValue({
        makeDecision: jest.fn().mockImplementation(async () => chiefEditorDecision)
      } as any)

    mockDatabaseAndEventBus()

    const decision = await orchestrator.chiefEditorReview(batch, mic)
    const updatedBatch = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(decision.headline_assessment_v1).toBeDefined()
    expect(decision.headline_assessment_v1?.routing_action).toBe('HUMAN_REVIEW_REQUIRED')
    expect(updatedBatch.status).toBe('MANUAL_REVIEW')
    expect(updatedBatch.decision_type).toBe('HUMAN_REVIEW_REQUIRED')
  })

  test('blocks stale caller publish when HIOL enforcement already routed batch to HUMAN_REVIEW_REQUIRED', async () => {
    const orchestrator = new MasterOrchestrator()
    const batch = createMockBatch('headline_precedence_guard_batch')
    const mic = createMockMIC('headline_precedence_guard_mic')
    const blackboard = getGlobalBlackboard()

    blackboard.write(`batch.${batch.id}`, batch, 'system')

    const chiefEditorDecision = createDecisionSkeleton({
      overall_decision: 'APPROVE_ALL',
      approved_languages: [...ALL_LANGUAGES],
      rejected_languages: [],
      delayed_languages: [],
      reasons: ['Legacy decision approved all editions']
    })

    jest
      .spyOn(chiefEditorModule, 'getGlobalChiefEditor')
      .mockReturnValue({
        makeDecision: jest.fn().mockImplementation(async () => chiefEditorDecision)
      } as any)

    mockDatabaseAndEventBus()

    jest
      .spyOn(orchestrator as any, 'classifyHeadlineIntelligenceV1')
      .mockReturnValue({
        headline_assessment_present: true,
        passed: false,
        issues: ['HEADLINE_ENFORCEMENT_REQUIRED'],
        reason_code: 'HEADLINE_ENFORCEMENT_REQUIRED',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        routing_action: 'HUMAN_REVIEW_REQUIRED',
        fail_closed: false,
        source_gate_ids: ['HEADLINE_INTELLIGENCE_OPERATING_LAYER_V1'],
        source_reason_codes: ['HEADLINE_ENFORCEMENT_REQUIRED'],
        source_languages: [...ALL_LANGUAGES],
        escalation_class: 'SENIOR_EDITOR_REVIEW',
        timestamp: new Date().toISOString(),
        decision_id: 'trace_headline_precedence_guard'
      })

    const decision = await orchestrator.chiefEditorReview(batch, mic)
    const statusAfterReview = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(decision.overall_decision).toBe('APPROVE_ALL')
    expect(statusAfterReview.status).toBe('MANUAL_REVIEW')

    const publishResult = await orchestrator.publish(batch, decision.approved_languages, mic)
    const finalBatch = blackboard.read(`batch.${batch.id}`) as BatchJob

    expect(publishResult.blocked).toBe(true)
    expect(publishResult.blocking_reasons).toContain('authoritative_batch_status_blocks_publish:MANUAL_REVIEW')
    expect(finalBatch.status).toBe('MANUAL_REVIEW')
    expect(finalBatch.status).not.toBe('FULLY_PUBLISHED')
  })
})
