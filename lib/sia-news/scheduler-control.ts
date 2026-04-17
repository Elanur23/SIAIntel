/**
 * Scheduler Control Boundary
 *
 * Route-facing scheduler interface layer.
 * Provides pre-checked, gated access to scheduler operations.
 *
 * This module re-exports the autonomous scheduler's public surface while enforcing
 * security pre-checks before unsafe operations like approveManualReview.
 */

import {
  startScheduler as autonomousStartScheduler,
  stopScheduler as autonomousStopScheduler,
  isSchedulerRunning as autonomousIsSchedulerRunning,
  getSchedulerConfig as autonomousGetSchedulerConfig,
  updateSchedulerConfig as autonomousUpdateSchedulerConfig,
  getSchedulerStats as autonomousGetSchedulerStats,
  getSchedulerHealth as autonomousGetSchedulerHealth,
  getManualReviewQueue as autonomousGetManualReviewQueue,
  approveManualReview as autonomousApproveManualReview,
  rejectManualReview as autonomousRejectManualReview,
  clearManualReviewQueue as autonomousClearManualReviewQueue,
  type ManualReviewApprovalResult,
  type SchedulerConfig,
} from './autonomous-scheduler'

import { log, logError } from './monitoring'
import { getSchedulerDeploymentPolicy } from './scheduler-deployment-policy'

// ============================================================================
// RE-EXPORTS: PASSTHROUGH FUNCTIONS (NO PRE-CHECK REQUIRED)
// ============================================================================

/**
 * Start the autonomous scheduler.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @param customConfig - Optional custom configuration
 */
export function startScheduler(customConfig?: Partial<SchedulerConfig>): void {
  return autonomousStartScheduler(customConfig)
}

/**
 * Stop the autonomous scheduler.
 *
 * Delegates directly to autonomous-scheduler.
 */
export async function stopScheduler(): Promise<void> {
  return await autonomousStopScheduler()
}

/**
 * Check if scheduler is running.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @returns True if scheduler is active
 */
export function isSchedulerRunning(): boolean {
  return autonomousIsSchedulerRunning()
}

/**
 * Get scheduler configuration.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @returns Current configuration
 */
export function getSchedulerConfig(): SchedulerConfig {
  return autonomousGetSchedulerConfig()
}

/**
 * Update scheduler configuration.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @param updates - Configuration updates
 */
export function updateSchedulerConfig(updates: Partial<SchedulerConfig>): void {
  return autonomousUpdateSchedulerConfig(updates)
}

/**
 * Get scheduler statistics.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @returns Scheduler stats
 */
export function getSchedulerStats() {
  return autonomousGetSchedulerStats()
}

/**
 * Get scheduler health status.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @returns Health status
 */
export async function getSchedulerHealth(): Promise<unknown> {
  return await autonomousGetSchedulerHealth()
}

/**
 * Get manual review queue.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @returns Array of articles awaiting manual review
 */
export function getManualReviewQueue() {
  return autonomousGetManualReviewQueue()
}

/**
 * Reject article from manual review queue.
 *
 * Delegates directly to autonomous-scheduler.
 *
 * @param articleId - Article ID to reject
 * @returns Success status
 */
export function rejectManualReview(articleId: string): boolean {
  return autonomousRejectManualReview(articleId)
}

/**
 * Clear manual review queue.
 *
 * Delegates directly to autonomous-scheduler.
 */
export function clearManualReviewQueue(): void {
  return autonomousClearManualReviewQueue()
}

// ============================================================================
// GATED FUNCTION: APPROVE MANUAL REVIEW WITH DEPLOYMENT PRE-CHECK
// ============================================================================

/**
 * Approve article from manual review queue with deployment policy pre-check.
 *
 * This is the route-facing approval entry point. It enforces deployment mode
 * before allowing article publication to prevent unauthorized autonomous content bypass.
 *
 * Flow:
 * 1. Pre-check: Verify deployment policy allows approval/publish operations
 * 2. If blocked: return POLICY_BLOCKED (queue untouched, safe for retry)
 * 3. If allowed: delegate to autonomous scheduler's approval handler
 *
 * Queue and retry safety are preserved:
 * - Pre-check failure does not mutate queue (same failure outcome as current)
 * - Publication failure also leaves queue intact (retry available)
 *
 * @param articleId - Article ID to approve
 * @returns Approval outcome status
 */
export async function approveManualReview(
  articleId: string
): Promise<ManualReviewApprovalResult> {
  try {
    const deploymentPolicy = getSchedulerDeploymentPolicy()

    if (!deploymentPolicy.allowApprovalAndPublish) {
      const blockMsg = `[SCHEDULER-PRECHECK] Article ${articleId} blocked by deployment policy. Direct approval is not allowed in ${deploymentPolicy.mode} mode.`
      log('WARN', 'scheduler-control', blockMsg, {
        articleId,
        mode: deploymentPolicy.mode,
      })
      return { status: 'POLICY_BLOCKED' } // Queue untouched; safe for retry
    }

    // Pre-check has passed; delegate to autonomous scheduler's handler.
    // The handler performs final defense-in-depth verification and publication.
    const approvalResult = await autonomousApproveManualReview(articleId)

    if (approvalResult.status === 'APPROVED_AND_PUBLISHED') {
      log('INFO', 'scheduler-control', `Article approved and published via manual review: ${articleId}`)
    } else if (approvalResult.status === 'APPROVED_BUT_PUBLICATION_FAILED_REQUEUED') {
      log(
        'WARN',
        'scheduler-control',
        `Article approval completed but publication failed and was re-queued: ${articleId}`
      )
    } else if (approvalResult.status === 'ARTICLE_NOT_FOUND') {
      log('WARN', 'scheduler-control', `Article not found in manual review queue: ${articleId}`)
    } else if (approvalResult.status === 'POLICY_BLOCKED') {
      log('WARN', 'scheduler-control', `Article approval blocked by policy: ${articleId}`)
    } else {
      log('ERROR', 'scheduler-control', `Article approval failed with internal error: ${articleId}`)
    }

    return approvalResult
  } catch (error) {
    logError('scheduler-control', 'approveManualReview', error as Error, { articleId })
    return { status: 'INTERNAL_ERROR' }
  }
}
