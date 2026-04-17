/**
 * Review Workflow Service
 * Phase 2: Workflow state management
 * 
 * Handles editorial review workflow transitions
 */

import type { WorkflowStatus, DistributionRecord } from '../types'
import { updateDistributionRecord } from '../database'

export interface WorkflowTransition {
  from: WorkflowStatus
  to: WorkflowStatus
  allowedBy: string[]
  requiresComment: boolean
}

/**
 * Workflow state machine
 */
const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Draft transitions
  { from: 'draft', to: 'review', allowedBy: ['editor', 'admin'], requiresComment: false },
  { from: 'draft', to: 'cancelled', allowedBy: ['editor', 'admin'], requiresComment: true },
  
  // Review transitions
  { from: 'review', to: 'approved', allowedBy: ['editor', 'admin'], requiresComment: false },
  { from: 'review', to: 'draft', allowedBy: ['editor', 'admin'], requiresComment: true },
  { from: 'review', to: 'cancelled', allowedBy: ['admin'], requiresComment: true },
  
  // Approved transitions
  { from: 'approved', to: 'scheduled', allowedBy: ['editor', 'admin'], requiresComment: false },
  { from: 'approved', to: 'publishing', allowedBy: ['system', 'admin'], requiresComment: false },
  { from: 'approved', to: 'draft', allowedBy: ['admin'], requiresComment: true },
  
  // Scheduled transitions
  { from: 'scheduled', to: 'publishing', allowedBy: ['system', 'admin'], requiresComment: false },
  { from: 'scheduled', to: 'cancelled', allowedBy: ['admin'], requiresComment: true },
  
  // Publishing transitions
  { from: 'publishing', to: 'published', allowedBy: ['system'], requiresComment: false },
  { from: 'publishing', to: 'failed', allowedBy: ['system'], requiresComment: false },
  
  // Failed transitions
  { from: 'failed', to: 'draft', allowedBy: ['editor', 'admin'], requiresComment: true },
  { from: 'failed', to: 'cancelled', allowedBy: ['admin'], requiresComment: true }
]

/**
 * Check if a workflow transition is allowed
 */
export function canTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
  userRole: string
): { allowed: boolean; reason?: string } {
  const transition = WORKFLOW_TRANSITIONS.find(
    t => t.from === from && t.to === to
  )
  
  if (!transition) {
    return { allowed: false, reason: 'Invalid transition' }
  }
  
  if (!transition.allowedBy.includes(userRole)) {
    return { allowed: false, reason: `Role '${userRole}' not authorized for this transition` }
  }
  
  return { allowed: true }
}

/**
 * Transition a record to a new status
 */
export async function transitionRecord(
  recordId: string,
  newStatus: WorkflowStatus,
  userRole: string,
  comment?: string
): Promise<{ success: boolean; error?: string; record?: DistributionRecord }> {
  // This would fetch the record in a real implementation
  // For Phase 2, we'll use a simplified version
  
  console.log('[REVIEW_WORKFLOW] Transition:', recordId, 'to', newStatus)
  
  // Phase 2: Mock implementation
  // Real implementation will:
  // 1. Fetch current record
  // 2. Validate transition
  // 3. Update record
  // 4. Log transition
  // 5. Send notifications
  
  return {
    success: true,
    record: undefined // Would return updated record
  }
}

/**
 * Get available transitions for a record
 */
export function getAvailableTransitions(
  currentStatus: WorkflowStatus,
  userRole: string
): WorkflowStatus[] {
  return WORKFLOW_TRANSITIONS
    .filter(t => t.from === currentStatus && t.allowedBy.includes(userRole))
    .map(t => t.to)
}

/**
 * Get workflow history for a record
 */
export interface WorkflowHistoryEntry {
  timestamp: Date
  from: WorkflowStatus
  to: WorkflowStatus
  user: string
  comment?: string
}

export async function getWorkflowHistory(
  recordId: string
): Promise<WorkflowHistoryEntry[]> {
  // Phase 2: Mock implementation
  // Real implementation will fetch from database
  
  console.log('[REVIEW_WORKFLOW] Get history for:', recordId)
  
  return []
}

/**
 * Validate record before transition
 */
export function validateRecordForTransition(
  record: DistributionRecord,
  targetStatus: WorkflowStatus
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Validation rules based on target status
  switch (targetStatus) {
    case 'review':
      if (!record.sourceTitle || record.sourceTitle.trim().length === 0) {
        issues.push('Title is required')
      }
      if (!record.sourceContent || record.sourceContent.trim().length < 100) {
        issues.push('Content must be at least 100 characters')
      }
      break
    
    case 'approved':
      if (record.trustScore < 60) {
        issues.push('Trust score too low (minimum 60)')
      }
      if (record.complianceScore < 60) {
        issues.push('Compliance score too low (minimum 60)')
      }
      break
    
    case 'scheduled':
      if (!record.scheduledAt) {
        issues.push('Scheduled date/time is required')
      }
      if (record.scheduledAt && record.scheduledAt < new Date()) {
        issues.push('Scheduled date/time must be in the future')
      }
      break
    
    case 'publishing':
      const localizedCount = Object.keys(record.localizedContent).length
      if (localizedCount === 0) {
        issues.push('At least one localized content version is required')
      }
      
      const variantsCount = Object.keys(record.platformVariants).length
      if (variantsCount === 0) {
        issues.push('At least one platform variant is required')
      }
      break
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
