import type { Blackboard } from '../blackboard-system'
import type { DecisionTrace } from './types'
import { getGlobalDatabase } from '../database'

export function createDecisionTrace(input: Omit<DecisionTrace, 'timestamp'> & { timestamp?: string }): DecisionTrace {
  return {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString()
  }
}

export function storeDecisionTrace(params: { blackboard: Blackboard; trace: DecisionTrace; batchId?: string }): void {
  const { blackboard, trace, batchId } = params
  
  // Store in Blackboard for runtime access
  blackboard.write(`decision_trace.${trace.trace_id}`, trace, 'system')
  
  // RUNTIME WIRING: Persist to database for audit trail
  if (batchId) {
    const db = getGlobalDatabase()
    db.saveDecisionTrace(trace, batchId)
  }
}

