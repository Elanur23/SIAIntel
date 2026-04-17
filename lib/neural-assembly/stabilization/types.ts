export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH'

export type PECLMode = 'OFF' | 'WARN' | 'ENFORCE'

export interface DecisionConfidence {
  confidence_score: number
  confidence_band: ConfidenceBand
  reasons: string[]
}

export interface SupervisorDecision {
  final_decision: 'APPROVE_ALL' | 'APPROVE_PARTIAL' | 'REJECT' | 'ESCALATE'
  confidence_score: number
  reasons: string[]
  risk_summary: string[]
  overridden_chief_editor: boolean
  trace: string[]
}

export interface HardRuleViolation {
  rule_id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  field: string
  message: string
  blocking: boolean
}

export interface PublishSafetyGate {
  can_publish: boolean
  blocking_reasons: string[]
  approved_languages: string[]
  delayed_languages: string[]
  blocked_languages: string[]
}

export interface DecisionTrace {
  trace_id?: string
  timestamp: string
  [key: string]: unknown
}
