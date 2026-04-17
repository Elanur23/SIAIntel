/**
 * SIA ROLLOUT CONFIGURATION - Phase 2
 * Controlled Go-Live Deployment Strategy.
 */

export type RolloutStage = 'STAGE_0' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3'

export interface StageConfig {
  name: string
  entry_criteria: string[]
  rollback_criteria: string[]
  traffic_gating: {
    method: 'percentage' | 'allowlist' | 'flag'
    value: number | string[] | boolean
  }
  canary_behavior: 'SHADOW' | 'MOCK' | 'REAL_PARTIAL' | 'REAL_FULL'
  monitoring_window_minutes: number
}

export const ROLLOUT_STRATEGY: Record<RolloutStage, StageConfig> = {
  STAGE_0: {
    name: 'Synthetic / Canary',
    entry_criteria: [
      'Phase 1.6 Verification Green',
      'Unit/Integration tests passing',
      'Fresh database reset'
    ],
    rollback_criteria: [
      'Any fatal LLM provider error',
      'Database migration failure',
      'Shadow mode leaks'
    ],
    traffic_gating: {
      method: 'flag',
      value: true // process.env.SYSTEM_MODE = 'synthetic'
    },
    canary_behavior: 'MOCK',
    monitoring_window_minutes: 60
  },
  STAGE_1: {
    name: 'Internal / Trusted',
    entry_criteria: [
      '24h Synthetic success',
      'Zero p99 latency spikes > 30s',
      'Budget burn verified'
    ],
    rollback_criteria: [
      'Any internal staff audit failure',
      'Critical bug report from tester'
    ],
    traffic_gating: {
      method: 'allowlist',
      value: ['sia-internal-01', 'sia-internal-02'] // Specific user IPs or IDs
    },
    canary_behavior: 'SHADOW',
    monitoring_window_minutes: 120
  },
  STAGE_2: {
    name: '10% Throttled Public',
    entry_criteria: [
      '100 consecutive successful batches',
      'Chief Editor confidence average > 85%',
      'Legal compliance review complete'
    ],
    rollback_criteria: [
      'Public error rate > 1%',
      'AdSense duplication detection'
    ],
    traffic_gating: {
      method: 'percentage',
      value: 10
    },
    canary_behavior: 'REAL_PARTIAL',
    monitoring_window_minutes: 240
  },
  STAGE_3: {
    name: 'General Availability',
    entry_criteria: [
      '72h Stage 2 stability',
      'No critical incidents in 48h',
      'Manual GO decision from Launch Commander'
    ],
    rollback_criteria: [
      'Global error rate > 5%',
      'System-wide degradation (latency > 2x p90)'
    ],
    traffic_gating: {
      method: 'percentage',
      value: 100
    },
    canary_behavior: 'REAL_FULL',
    monitoring_window_minutes: 1440
  }
}
