import type { PECLMode } from './types'

function resolveMode(): PECLMode {
  const value = (process.env.PECL_DEPLOYMENT_MODE || 'WARN').toUpperCase()
  if (value === 'OFF' || value === 'ENFORCE') {
    return value
  }
  return 'WARN'
}

export const PECL_DEPLOYMENT_MODE: PECLMode = resolveMode()

export const DEFAULT_CONFIDENCE_CONFIG = {
  min_confidence_supervisor: 60,
  min_confidence_approve_all: 85,
  min_confidence_partial: 70,
}

export const DEFAULT_ESCALATION_CONFIG = {
  max_recirculation_attempts: 3,
  escalation_thresholds: {
    confidence_drop: 15,
    critical_issue_count: 1,
    high_issue_count: 3,
  },
}
