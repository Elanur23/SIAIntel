import type { BatchJob, MasterIntelligenceCore } from './master-orchestrator'
import type { Blackboard } from './blackboard-system'
import type { EditorialEventBus } from './editorial-event-bus'
import type { Language } from './editorial-event-bus'
import { getGlobalEventBus } from './editorial-event-bus'
import { evaluateHardRulesForBatch } from './stabilization/hard-rule-engine'
import { computeDecisionConfidence } from './stabilization/confidence-scoring'
import { DEFAULT_CONFIDENCE_CONFIG, DEFAULT_ESCALATION_CONFIG } from './stabilization/config'
import type { DecisionConfidence, SupervisorDecision } from './stabilization/types'

type SupervisorDecisionInternal = SupervisorDecision & {
  supervisor_decision: SupervisorDecision['final_decision']
  approved_languages: Language[]
  rejected_languages: Language[]
  delayed_languages: Language[]
}

class AISupervisor {
  async reviewEscalation(
    batch: BatchJob,
    mic: MasterIntelligenceCore,
    chiefDecision: any,
    blackboard: Blackboard,
    eventBus: EditorialEventBus
  ): Promise<SupervisorDecisionInternal> {
    // Hard rules are absolute: supervisor cannot approve if any violation exists.
    const hard = evaluateHardRulesForBatch(batch)
    const hard_rule_hits = hard.hard_rule_hits
    if (hard.violations.length > 0) {
      const trace = [
        'hard_rules:FAIL',
        ...hard.violations.slice(0, 5).map(v => `${v.rule_id}:${v.field}`)
      ]
      return {
        final_decision: 'REJECT',
        supervisor_decision: 'REJECT',
        confidence_score: 0,
        reasons: ['Hard rule violations present; cannot approve autonomously.'],
        risk_summary: ['Hard rules block publish/approval.'],
        overridden_chief_editor: true,
        trace,
        approved_languages: [],
        rejected_languages: Object.keys(batch.editions) as Language[],
        delayed_languages: [],
      }
    }

    const languages = Object.keys(batch.editions) as Language[]
    const auditScores = languages.map(l => batch.editions[l]?.audit_results?.overall_score ?? 0)
    const batchScore = auditScores.length > 0 ? auditScores.reduce((a, b) => a + b, 0) / auditScores.length : 0

    const criticalIssueCount = languages.reduce((sum, lang) => {
      const issues = batch.editions[lang]?.audit_results?.issues ?? []
      return sum + (issues.some(i => i.severity === 'CRITICAL') ? 1 : 0)
    }, 0)

    const highIssueCount = languages.reduce((sum, lang) => {
      const issues = batch.editions[lang]?.audit_results?.issues ?? []
      return sum + issues.filter(i => i.severity === 'HIGH').length
    }, 0)

    const staleCount = languages.reduce((sum, lang) => sum + (batch.editions[lang]?.stale ? 1 : 0), 0)

    // Approximate cross-language consistency and AI certainty deterministically.
    const consistencyHeuristic = criticalIssueCount > 0 ? 55 : 82
    const semanticAiCert = 0.85

    // Risk heuristic: geopolitics keywords are the strongest signal in this repository.
    const geo = (mic.truth_nucleus?.geopolitical_context ?? '').toLowerCase()
    const sensitiveKeywords = [
      'conflict',
      'war',
      'sanctions',
      'diplomatic',
      'sovereignty',
      'territorial',
      'military',
      'nuclear',
      'regime',
      'coup'
    ]
    let sensitiveCount = 0
    for (const k of sensitiveKeywords) if (geo.includes(k)) sensitiveCount++

    const rawRiskOverallScore = Math.min(100, sensitiveCount * 15)
    // Bounded supervisor mitigation: apply a deterministic risk dampening model
    // after bounded second-level review (confidence only; approval bounds still use raw risk).
    const riskOverallScoreForConfidence = Math.max(0, rawRiskOverallScore - 40)

    const deterministicRuleCriticalFailures = 0
    const deterministicRuleHighFailures = 0

    const confidence: DecisionConfidence = computeDecisionConfidence({
      batchScore,
      criticalIssueCount,
      highIssueCount,
      semanticConsistencyScore: consistencyHeuristic,
      semanticAiConfidence: semanticAiCert,
      riskOverallScore: riskOverallScoreForConfidence,
      staleCount,
      deterministicRuleCriticalFailures,
      deterministicRuleHighFailures,
      confidence_thresholds: {
        min_confidence_approve_all: DEFAULT_CONFIDENCE_CONFIG.min_confidence_approve_all,
        min_confidence_partial: DEFAULT_CONFIDENCE_CONFIG.min_confidence_partial
      }
    })

    const trace = [
      'supervisor_stage:reviewEscalation',
      `confidence=${confidence.confidence_score}(${confidence.confidence_band})`,
      `rawRiskOverallScore=${rawRiskOverallScore}`,
      `riskOverallScoreForConfidence=${riskOverallScoreForConfidence}`,
      `staleCount=${staleCount}`,
      ...(hard_rule_hits.length ? [`hard_rule_hits:${hard_rule_hits.join(',')}`] : [])
    ]

    // Hard bounded supervisor approval conditions.
    if (confidence.confidence_score < DEFAULT_CONFIDENCE_CONFIG.min_confidence_supervisor) {
      return {
        final_decision: 'REJECT',
        supervisor_decision: 'REJECT',
        confidence_score: confidence.confidence_score,
        reasons: ['Supervisor confidence below threshold; terminal rejection.'],
        risk_summary: [`rawRiskOverallScore=${rawRiskOverallScore}`],
        overridden_chief_editor: true,
        trace,
        approved_languages: [],
        rejected_languages: languages,
        delayed_languages: []
      }
    }

    // Risk bounds: allow approve_partial up to a bounded risk level.
    const maxRiskForPartial = 85
    if (rawRiskOverallScore > maxRiskForPartial) {
      return {
        final_decision: 'REJECT',
        supervisor_decision: 'REJECT',
        confidence_score: confidence.confidence_score,
        reasons: ['Risk exceeds allowed bounded bounds for autonomous publishing.'],
        risk_summary: [`rawRiskOverallScore=${rawRiskOverallScore}`],
        overridden_chief_editor: true,
        trace,
        approved_languages: [],
        rejected_languages: languages,
        delayed_languages: []
      }
    }

    const approved_languages = languages.filter(l => (batch.editions[l]?.audit_results?.overall_score ?? 0) >= 85) as Language[]
    const rejected_languages = languages.filter(l => (batch.editions[l]?.audit_results?.overall_score ?? 0) < 60) as Language[]
    const delayed_languages = languages.filter(
      l => !approved_languages.includes(l) && !rejected_languages.includes(l)
    ) as Language[]

    const canApproveAll = approved_languages.length === 9
    if (canApproveAll && confidence.confidence_score >= DEFAULT_CONFIDENCE_CONFIG.min_confidence_approve_all) {
      return {
        final_decision: 'APPROVE_ALL',
        supervisor_decision: 'APPROVE_ALL',
        confidence_score: confidence.confidence_score,
        reasons: ['All languages pass deterministic thresholds under supervisor confidence bound.'],
        risk_summary: [`rawRiskOverallScore=${rawRiskOverallScore}`],
        overridden_chief_editor: true,
        trace,
        approved_languages,
        rejected_languages: [],
        delayed_languages: []
      }
    }

    const canApprovePartial = approved_languages.length >= 5 && confidence.confidence_score >= DEFAULT_CONFIDENCE_CONFIG.min_confidence_partial
    if (canApprovePartial) {
      return {
        final_decision: 'APPROVE_PARTIAL',
        supervisor_decision: 'APPROVE_PARTIAL',
        confidence_score: confidence.confidence_score,
        reasons: ['Partial approval satisfies bounded supervisor policy.'],
        risk_summary: [`rawRiskOverallScore=${rawRiskOverallScore}`],
        overridden_chief_editor: true,
        trace,
        approved_languages,
        rejected_languages,
        delayed_languages
      }
    }

    return {
      final_decision: 'REJECT',
      supervisor_decision: 'REJECT',
      confidence_score: confidence.confidence_score,
      reasons: ['No bounded safe approval option available under current constraints.'],
      risk_summary: [`rawRiskOverallScore=${rawRiskOverallScore}`],
      overridden_chief_editor: true,
      trace,
      approved_languages: [],
      rejected_languages: languages,
      delayed_languages: []
    }
  }

  async executeSupervisorDecision(
    batch: BatchJob,
    mic: MasterIntelligenceCore,
    supervisorReview: SupervisorDecisionInternal,
    blackboard: Blackboard,
    eventBus: EditorialEventBus
  ): Promise<void> {
    const traceEvents: string[] = []
    const decision = supervisorReview.supervisor_decision

    await blackboard.atomicUpdate(`batch.${batch.id}`, (current: any) => ({
      ...current,
      status: current.status === 'SUPERVISOR_REVIEW' ? current.status : current.status,
      supervisor_decision: decision,
      supervisor_decision_confidence: supervisorReview.confidence_score,
      supervisor_trace: supervisorReview.trace,
      supervisor_decision_made: true,
      updated_at: Date.now()
    }), 'system')

    // Emit structured supervisor decision payload for observability.
    await eventBus.publish('SUPERVISOR_DECISION', mic.id, {
      batch_id: batch.id,
      original_decision: batch['chief_editor_decision'] ?? batch['chief_editor_decision_type'] ?? 'ESCALATE',
      supervisor_decision: decision,
      confidence_score: supervisorReview.confidence_score,
      reasoning: supervisorReview.reasons.join('; ')
    } as any)

    traceEvents.push('SUPERVISOR_DECISION')
    // Store trace summary for debugging.
    blackboard.write(`supervisor_trace.${batch.id}`, {
      decision,
      trace: supervisorReview.trace,
      emitted_events: traceEvents
    }, 'system')
  }
}

let globalAISupervisor: AISupervisor | null = null

export function getGlobalAISupervisor(): AISupervisor {
  if (!globalAISupervisor) globalAISupervisor = new AISupervisor()
  return globalAISupervisor
}

export function resetGlobalAISupervisor(): void {
  globalAISupervisor = null
}

