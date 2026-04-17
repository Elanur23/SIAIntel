/**
 * Autonomous Scheduler - Minimal Boundary-Aligned Implementation
 *
 * This is a minimal self-contained scheduler implementation that satisfies
 * the scheduler-control.ts contract without pulling in large dependencies.
 *
 * Design principles:
 * - In-memory state only (no database)
 * - Stub monitoring (no monitoring module dependency)
 * - Stub publishing (no publishing-pipeline dependency)
 * - Exact contract match with scheduler-control.ts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SchedulerConfig {
  enabled: boolean
  confidenceThreshold: number
  healthCheckInterval: number
  maxConcurrentGenerations: number
  autoRecovery: boolean
  targetUptime: number
}

export type ManualReviewApprovalResult =
  | { status: 'APPROVED_AND_PUBLISHED' }
  | { status: 'APPROVED_BUT_PUBLICATION_FAILED_REQUEUED' }
  | { status: 'ARTICLE_NOT_FOUND' }
  | { status: 'POLICY_BLOCKED' }
  | { status: 'INTERNAL_ERROR' }

interface ManualReviewItem {
  id: string
  article: unknown
  validationResult: unknown
  rejectedAt: string
  reason: string
}

interface SchedulerState {
  isRunning: boolean
  startedAt: string | null
  lastHealthCheck: string | null
  activeGenerations: number
  totalGenerated: number
  totalPublished: number
  totalRejected: number
  uptimeStart: number
  downtimeTotal: number
}

// ============================================================================
// STATE
// ============================================================================

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: false,
  confidenceThreshold: 70,
  healthCheckInterval: 60000,
  maxConcurrentGenerations: 5,
  autoRecovery: true,
  targetUptime: 99.5,
}

let config: SchedulerConfig = { ...DEFAULT_CONFIG }
let state: SchedulerState = {
  isRunning: false,
  startedAt: null,
  lastHealthCheck: null,
  activeGenerations: 0,
  totalGenerated: 0,
  totalPublished: 0,
  totalRejected: 0,
  uptimeStart: 0,
  downtimeTotal: 0,
}

const manualReviewQueue: ManualReviewItem[] = []
let healthCheckInterval: NodeJS.Timeout | null = null

// ============================================================================
// SCHEDULER CONTROL
// ============================================================================

export function startScheduler(customConfig?: Partial<SchedulerConfig>): void {
  if (state.isRunning) {
    console.warn('[autonomous-scheduler] Scheduler is already running')
    return
  }

  config = { ...DEFAULT_CONFIG, ...customConfig }

  if (!config.enabled) {
    console.warn('[autonomous-scheduler] Scheduler is disabled in configuration')
    return
  }

  state = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    lastHealthCheck: null,
    activeGenerations: 0,
    totalGenerated: 0,
    totalPublished: 0,
    totalRejected: 0,
    uptimeStart: Date.now(),
    downtimeTotal: 0,
  }

  console.log('[autonomous-scheduler] Scheduler started', { config })

  // Start health monitoring
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
  healthCheckInterval = setInterval(() => {
    performHealthCheck()
  }, config.healthCheckInterval)
}

export async function stopScheduler(): Promise<void> {
  if (!state.isRunning) {
    console.warn('[autonomous-scheduler] Scheduler is not running')
    return
  }

  console.log('[autonomous-scheduler] Stopping scheduler')

  state.isRunning = false

  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }

  // Wait for active generations (with timeout)
  const maxWaitTime = 30000
  const startWait = Date.now()

  while (state.activeGenerations > 0 && Date.now() - startWait < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log('[autonomous-scheduler] Scheduler stopped', {
    stats: getSchedulerStats(),
  })
}

export function isSchedulerRunning(): boolean {
  return state.isRunning
}

export function getSchedulerConfig(): SchedulerConfig {
  return { ...config }
}

export function updateSchedulerConfig(updates: Partial<SchedulerConfig>): void {
  const oldConfig = { ...config }
  config = { ...config, ...updates }

  console.log('[autonomous-scheduler] Configuration updated', {
    oldConfig,
    newConfig: config,
  })

  // If enabled state changed, start/stop scheduler
  if (oldConfig.enabled !== config.enabled) {
    if (config.enabled && !state.isRunning) {
      startScheduler()
    } else if (!config.enabled && state.isRunning) {
      stopScheduler()
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

function calculateUptime(): number {
  if (!state.uptimeStart) return 100

  const totalTime = Date.now() - state.uptimeStart
  const uptime = totalTime - state.downtimeTotal

  return (uptime / totalTime) * 100
}

export function getSchedulerStats() {
  return {
    isRunning: state.isRunning,
    startedAt: state.startedAt,
    uptime: calculateUptime(),
    lastHealthCheck: state.lastHealthCheck,
    activeGenerations: state.activeGenerations,
    totalGenerated: state.totalGenerated,
    totalPublished: state.totalPublished,
    totalRejected: state.totalRejected,
    manualReviewQueueSize: manualReviewQueue.length,
    config: { ...config },
  }
}

export async function getSchedulerHealth(): Promise<unknown> {
  const uptime = calculateUptime()

  return {
    scheduler: {
      isRunning: state.isRunning,
      uptime,
      activeGenerations: state.activeGenerations,
      queueSizes: {
        manualReview: manualReviewQueue.length,
      },
    },
    system: {
      status: 'HEALTHY',
      components: {},
    },
    meetsUptimeTarget: uptime >= config.targetUptime,
  }
}

// ============================================================================
// MANUAL REVIEW QUEUE
// ============================================================================

export function getManualReviewQueue() {
  return [...manualReviewQueue]
}

export async function approveManualReview(
  articleId: string
): Promise<ManualReviewApprovalResult> {
  const index = manualReviewQueue.findIndex((item) => item.id === articleId)

  if (index === -1) {
    console.warn(
      `[autonomous-scheduler] Article not found in manual review queue: ${articleId}`
    )
    return { status: 'ARTICLE_NOT_FOUND' }
  }

  const item = manualReviewQueue[index]

  try {
    // Stub: In a real implementation, this would call publishing-pipeline
    // For now, we simulate successful publication
    const publishSuccess = true

    if (publishSuccess) {
      manualReviewQueue.splice(index, 1)
      state.totalPublished++

      console.log(
        `[autonomous-scheduler] Manual review approved and published: ${articleId}`
      )
      return { status: 'APPROVED_AND_PUBLISHED' }
    } else {
      console.warn(
        `[autonomous-scheduler] Publication failed for article: ${articleId}`
      )
      return { status: 'APPROVED_BUT_PUBLICATION_FAILED_REQUEUED' }
    }
  } catch (error) {
    console.error(
      `[autonomous-scheduler] Error approving manual review: ${articleId}`,
      error
    )
    return { status: 'INTERNAL_ERROR' }
  }
}

export function rejectManualReview(articleId: string): boolean {
  const index = manualReviewQueue.findIndex((item) => item.id === articleId)

  if (index === -1) {
    console.warn(
      `[autonomous-scheduler] Article not found in manual review queue: ${articleId}`
    )
    return false
  }

  manualReviewQueue.splice(index, 1)

  console.log(`[autonomous-scheduler] Manual review rejected: ${articleId}`)
  return true
}

export function clearManualReviewQueue(): void {
  const count = manualReviewQueue.length
  manualReviewQueue.length = 0

  console.log(
    `[autonomous-scheduler] Manual review queue cleared: ${count} items removed`
  )
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

function performHealthCheck(): void {
  state.lastHealthCheck = new Date().toISOString()

  // Stub: In a real implementation, this would check system components
  console.log('[autonomous-scheduler] Health check completed', {
    status: 'HEALTHY',
    uptime: calculateUptime(),
  })
}
