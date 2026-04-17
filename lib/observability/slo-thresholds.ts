/**
 * SIA SLO THRESHOLDS - Phase 2
 * Machine-consumable Service Level Objectives for Launch Week.
 */

export interface SLOThreshold {
  metric: string
  window_minutes: number
  slo_percent: number
  alert_threshold_percent: number
  no_go_threshold_percent: number
  operator_action: string
}

export const LAUNCH_WEEK_SLOS: Record<string, SLOThreshold> = {
  llm_error_rate: {
    metric: 'llm_provider_error_rate',
    window_minutes: 5,
    slo_percent: 99.5, // 0.5% error rate allowed
    alert_threshold_percent: 1.0,
    no_go_threshold_percent: 5.0,
    operator_action: 'Switch to secondary LLM provider or activate Emergency Stop if dual-failure.'
  },
  generation_latency_p90: {
    metric: 'edition_generation_duration_ms_p90',
    window_minutes: 15,
    slo_percent: 30000, // 30s
    alert_threshold_percent: 45000,
    no_go_threshold_percent: 60000,
    operator_action: 'Check LLM provider status page; investigate content complexity spikes.'
  },
  generation_latency_p99: {
    metric: 'edition_generation_duration_ms_p99',
    window_minutes: 15,
    slo_percent: 60000, // 60s
    alert_threshold_percent: 90000,
    no_go_threshold_percent: 120000,
    operator_action: 'Critical latency detected. Throttling ingestion rates.'
  },
  orchestration_success_rate: {
    metric: 'batch_processing_success_rate',
    window_minutes: 10,
    slo_percent: 95.0,
    alert_threshold_percent: 90.0,
    no_go_threshold_percent: 80.0,
    operator_action: 'Audit recent code changes for state machine regressions.'
  },
  publish_success_rate: {
    metric: 'cdn_publish_success_rate',
    window_minutes: 10,
    slo_percent: 99.9,
    alert_threshold_percent: 99.0,
    no_go_threshold_percent: 95.0,
    operator_action: 'Verify CDN credentials and primary database connectivity.'
  },
  rollback_frequency: {
    metric: 'atomic_rollback_count_per_hour',
    window_minutes: 60,
    slo_percent: 2, // Max 2 rollbacks/hour
    alert_threshold_percent: 3,
    no_go_threshold_percent: 5,
    operator_action: 'Immediate freeze on new MIC creation. Investigate audit gate false positives.'
  },
  budget_burn_anomaly: {
    metric: 'hourly_budget_burn_usd',
    window_minutes: 60,
    slo_percent: 50.0, // $50/hour budget
    alert_threshold_percent: 75.0,
    no_go_threshold_percent: 100.0,
    operator_action: 'Trigger Emergency Stop. Verify for runaway loops or prompt injection billing attacks.'
  },
  shadow_contamination: {
    metric: 'shadow_leak_detection_count',
    window_minutes: 1,
    slo_percent: 0, // Zero tolerance
    alert_threshold_percent: 1,
    no_go_threshold_percent: 1,
    operator_action: 'IMMEDIATE EMERGENCY STOP. Purge production database of shadow/mock rows.'
  }
}
