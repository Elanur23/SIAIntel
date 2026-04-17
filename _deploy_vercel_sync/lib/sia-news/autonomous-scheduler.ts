/**
 * Autonomous Operation Scheduler for SIA_NEWS_v1.0
 * 
 * Implements continuous autonomous operation with:
 * - Event-driven generation triggers
 * - Confidence threshold gating (minimum 70%)
 * - Automatic publication for approved content
 * - Manual review queue for rejected content
 * - System health monitoring and recovery
 * 
 * Requirements: 9.5, 10.5, 20.3
 */

import {
  NormalizedEvent,
  GeneratedArticle,
  ConsensusResult,
  SystemHealth,
  PublicationRequest
} from './types'

import { publishArticle } from './publishing-pipeline'

import {
  checkEnhancedSystemHealth,
  sendAlert,
  log,
  logError,
  trackPerformance
} from './monitoring'

// ============================================================================
// SCHEDULER CONFIGURATION
// ============================================================================

export interface SchedulerConfig {
  enabled: boolean
  confidenceThreshold: number // Minimum confidence for auto-publication (default: 70)
  healthCheckInterval: number // Milliseconds between health checks (default: 60000 = 1 minute)
  maxConcurrentGenerations: number // Maximum parallel generations (default: 5)
  autoRecovery: boolean // Enable automatic recovery from failures
  targetUptime: number // Target uptime percentage (default: 99.5)
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: false, // Disabled by default - must be explicitly enabled
  confidenceThreshold: 70,
  healthCheckInterval: 60000, // 1 minute
  maxConcurrentGenerations: 5,
  autoRecovery: true,
  targetUptime: 99.5
}

// ============================================================================
// SCHEDULER STATE
// ============================================================================

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
  downtimeTotal: 0
}

// Manual review queue for rejected content
const manualReviewQueue: Array<{
  id: string
  article: GeneratedArticle
  validationResult: ConsensusResult
  rejectedAt: string
  reason: string
}> = []

// Health check interval handle
let healthCheckInterval: NodeJS.Timeout | null = null

// Event queue for processing
const eventQueue: NormalizedEvent[] = []
let isProcessingQueue = false

// ============================================================================
// SCHEDULER CONTROL
// ============================================================================

/**
 * Start the autonomous scheduler
 * 
 * Begins continuous operation:
 * - Monitors event queue for new content triggers
 * - Performs periodic health checks
 * - Enables automatic recovery
 * 
 * @param customConfig - Optional custom configuration
 */
export function startScheduler(customConfig?: Partial<SchedulerConfig>): void {
  if (state.isRunning) {
    log('WARN', 'autonomous-scheduler', 'Scheduler is already running')
    return
  }
  
  // Apply custom configuration
  config = { ...DEFAULT_CONFIG, ...customConfig }
  
  if (!config.enabled) {
    log('WARN', 'autonomous-scheduler', 'Scheduler is disabled in configuration')
    return
  }
  
  // Initialize state
  state = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    lastHealthCheck: null,
    activeGenerations: 0,
    totalGenerated: 0,
    totalPublished: 0,
    totalRejected: 0,
    uptimeStart: Date.now(),
    downtimeTotal: 0
  }
  
  log('INFO', 'autonomous-scheduler', 'Starting autonomous scheduler', {
    config,
    timestamp: state.startedAt
  })
  
  // Start health monitoring
  startHealthMonitoring()
  
  // Start event queue processing
  startEventQueueProcessing()
  
  sendAlert(
    'LOW',
    'autonomous-scheduler',
    'Autonomous scheduler started successfully',
    { config }
  )
}

/**
 * Stop the autonomous scheduler
 * 
 * Gracefully shuts down:
 * - Stops accepting new events
 * - Waits for active generations to complete
 * - Stops health monitoring
 */
export async function stopScheduler(): Promise<void> {
  if (!state.isRunning) {
    log('WARN', 'autonomous-scheduler', 'Scheduler is not running')
    return
  }
  
  log('INFO', 'autonomous-scheduler', 'Stopping autonomous scheduler')
  
  state.isRunning = false
  
  // Stop health monitoring
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
  
  // Wait for active generations to complete (with timeout)
  const maxWaitTime = 30000 // 30 seconds
  const startWait = Date.now()
  
  while (state.activeGenerations > 0 && (Date.now() - startWait) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  if (state.activeGenerations > 0) {
    log('WARN', 'autonomous-scheduler', `Scheduler stopped with ${state.activeGenerations} active generations`)
  }
  
  const stoppedAt = new Date().toISOString()
  const uptime = calculateUptime()
  
  log('INFO', 'autonomous-scheduler', 'Autonomous scheduler stopped', {
    stoppedAt,
    uptime,
    stats: {
      totalGenerated: state.totalGenerated,
      totalPublished: state.totalPublished,
      totalRejected: state.totalRejected,
      manualReviewQueueSize: manualReviewQueue.length
    }
  })
  
  sendAlert(
    'LOW',
    'autonomous-scheduler',
    'Autonomous scheduler stopped',
    { uptime, stats: getSchedulerStats() }
  )
}

/**
 * Check if scheduler is running
 * 
 * @returns True if scheduler is active
 */
export function isSchedulerRunning(): boolean {
  return state.isRunning
}

/**
 * Get scheduler configuration
 * 
 * @returns Current configuration
 */
export function getSchedulerConfig(): SchedulerConfig {
  return { ...config }
}

/**
 * Update scheduler configuration
 * 
 * @param updates - Configuration updates
 */
export function updateSchedulerConfig(updates: Partial<SchedulerConfig>): void {
  const oldConfig = { ...config }
  config = { ...config, ...updates }
  
  log('INFO', 'autonomous-scheduler', 'Configuration updated', {
    oldConfig,
    newConfig: config
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
// EVENT QUEUE PROCESSING
// ============================================================================

/**
 * Add event to processing queue
 * 
 * Events are queued for autonomous processing. The scheduler will
 * automatically generate and publish content based on these events.
 * 
 * @param event - Normalized event to process
 */
export function queueEvent(event: NormalizedEvent): void {
  if (!state.isRunning) {
    log('WARN', 'autonomous-scheduler', 'Cannot queue event - scheduler not running', { event })
    return
  }
  
  eventQueue.push(event)
  
  log('DEBUG', 'autonomous-scheduler', `Event queued: ${event.id}`, {
    queueSize: eventQueue.length,
    eventType: event.eventType,
    asset: event.asset
  })
  
  // Trigger queue processing if not already running
  if (!isProcessingQueue) {
    processEventQueue()
  }
}

/**
 * Start continuous event queue processing
 */
function startEventQueueProcessing(): void {
  // This function sets up the queue processing loop
  // In a real implementation, this would be triggered by WebSocket events
  log('INFO', 'autonomous-scheduler', 'Event queue processing started')
}

/**
 * Process events from the queue
 * 
 * Processes events one at a time, respecting concurrency limits.
 * Each event triggers the full generation pipeline.
 */
async function processEventQueue(): Promise<void> {
  if (isProcessingQueue || !state.isRunning) {
    return
  }
  
  isProcessingQueue = true
  
  try {
    while (eventQueue.length > 0 && state.isRunning) {
      // Check concurrency limit
      if (state.activeGenerations >= config.maxConcurrentGenerations) {
        log('DEBUG', 'autonomous-scheduler', 'Concurrency limit reached, waiting...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      
      const event = eventQueue.shift()
      if (!event) continue
      
      // Process event asynchronously (don't await)
      processEvent(event).catch(error => {
        logError('autonomous-scheduler', 'processEvent', error, { event })
      })
      
      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } finally {
    isProcessingQueue = false
  }
}

/**
 * Process a single event through the generation pipeline
 * 
 * @param event - Event to process
 */
async function processEvent(event: NormalizedEvent): Promise<void> {
  state.activeGenerations++
  
  const trackerId = `event-${event.id}`
  
  try {
    log('INFO', 'autonomous-scheduler', `Processing event: ${event.id}`, {
      eventType: event.eventType,
      asset: event.asset
    })
    
    // NOTE: This is a placeholder for the full generation pipeline
    // In the complete implementation, this would call:
    // 1. Source verification
    // 2. Causal analysis
    // 3. Entity mapping
    // 4. Content generation (all 6 languages)
    // 5. Multi-agent validation
    // 6. Publication (if approved)
    
    // For now, we'll simulate the pipeline with a stub
    const result = await simulateGenerationPipeline(event)
    
    state.totalGenerated++
    
    // Check confidence threshold
    if (result.validationResult.overallConfidence >= config.confidenceThreshold) {
      // Auto-publish approved content
      await handleApprovedContent(result.article, result.validationResult)
    } else {
      // Add to manual review queue
      await handleRejectedContent(result.article, result.validationResult)
    }
    
  } catch (error) {
    logError('autonomous-scheduler', 'processEvent', error as Error, { event })
    
    sendAlert(
      'MEDIUM',
      'autonomous-scheduler',
      `Event processing failed: ${event.id}`,
      { event, error: (error as Error).message }
    )
  } finally {
    state.activeGenerations--
  }
}

/**
 * Handle approved content (confidence >= threshold)
 * 
 * @param article - Generated article
 * @param validationResult - Validation result
 */
async function handleApprovedContent(
  article: GeneratedArticle,
  validationResult: ConsensusResult
): Promise<void> {
  try {
    const publicationRequest: PublicationRequest = {
      article,
      validationResult,
      publishImmediately: true
    }
    
    const result = await publishArticle(publicationRequest)
    
    if (result.success) {
      state.totalPublished++
      
      log('INFO', 'autonomous-scheduler', `Article auto-published: ${article.id}`, {
        language: article.language,
        region: article.region,
        confidence: validationResult.overallConfidence,
        eeatScore: article.eeatScore
      })
    } else {
      throw new Error(result.error || 'Publication failed')
    }
    
  } catch (error) {
    logError('autonomous-scheduler', 'handleApprovedContent', error as Error, { article })
    
    // Add to manual review queue on publication failure
    await handleRejectedContent(article, validationResult, 'Publication failed')
  }
}

/**
 * Handle rejected content (confidence < threshold)
 * 
 * @param article - Generated article
 * @param validationResult - Validation result
 * @param reason - Rejection reason
 */
async function handleRejectedContent(
  article: GeneratedArticle,
  validationResult: ConsensusResult,
  reason?: string
): Promise<void> {
  state.totalRejected++
  
  const rejectionReason = reason || `Confidence below threshold (${validationResult.overallConfidence}% < ${config.confidenceThreshold}%)`
  
  manualReviewQueue.push({
    id: article.id,
    article,
    validationResult,
    rejectedAt: new Date().toISOString(),
    reason: rejectionReason
  })
  
  log('WARN', 'autonomous-scheduler', `Article queued for manual review: ${article.id}`, {
    reason: rejectionReason,
    confidence: validationResult.overallConfidence,
    queueSize: manualReviewQueue.length
  })
  
  // Alert if manual review queue is growing large
  if (manualReviewQueue.length > 10) {
    sendAlert(
      'MEDIUM',
      'autonomous-scheduler',
      `Manual review queue growing: ${manualReviewQueue.length} items`,
      { queueSize: manualReviewQueue.length }
    )
  }
}

// ============================================================================
// MANUAL REVIEW QUEUE
// ============================================================================

/**
 * Get manual review queue
 * 
 * @returns Array of articles awaiting manual review
 */
export function getManualReviewQueue() {
  return [...manualReviewQueue]
}

/**
 * Approve article from manual review queue
 * 
 * @param articleId - Article ID to approve
 * @returns Success status
 */
export async function approveManualReview(articleId: string): Promise<boolean> {
  const index = manualReviewQueue.findIndex(item => item.id === articleId)
  
  if (index === -1) {
    log('WARN', 'autonomous-scheduler', `Article not found in manual review queue: ${articleId}`)
    return false
  }
  
  const item = manualReviewQueue[index]
  
  try {
    await handleApprovedContent(item.article, item.validationResult)
    manualReviewQueue.splice(index, 1)
    
    log('INFO', 'autonomous-scheduler', `Manual review approved: ${articleId}`)
    return true
    
  } catch (error) {
    logError('autonomous-scheduler', 'approveManualReview', error as Error, { articleId })
    return false
  }
}

/**
 * Reject article from manual review queue
 * 
 * @param articleId - Article ID to reject
 * @returns Success status
 */
export function rejectManualReview(articleId: string): boolean {
  const index = manualReviewQueue.findIndex(item => item.id === articleId)
  
  if (index === -1) {
    log('WARN', 'autonomous-scheduler', `Article not found in manual review queue: ${articleId}`)
    return false
  }
  
  manualReviewQueue.splice(index, 1)
  
  log('INFO', 'autonomous-scheduler', `Manual review rejected: ${articleId}`)
  return true
}

/**
 * Clear manual review queue
 */
export function clearManualReviewQueue(): void {
  const count = manualReviewQueue.length
  manualReviewQueue.length = 0
  
  log('INFO', 'autonomous-scheduler', `Manual review queue cleared: ${count} items removed`)
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

/**
 * Start continuous health monitoring
 */
function startHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
  
  // Perform initial health check
  performHealthCheck()
  
  // Schedule periodic health checks
  healthCheckInterval = setInterval(() => {
    performHealthCheck()
  }, config.healthCheckInterval)
  
  log('INFO', 'autonomous-scheduler', 'Health monitoring started', {
    interval: config.healthCheckInterval
  })
}

/**
 * Perform system health check
 */
async function performHealthCheck(): Promise<void> {
  try {
    const health = await checkEnhancedSystemHealth()
    
    state.lastHealthCheck = new Date().toISOString()
    
    log('DEBUG', 'autonomous-scheduler', 'Health check completed', {
      status: health.status,
      uptime: health.uptime,
      degradedServices: health.degradedServices
    })
    
    // Handle degraded or down status
    if (health.status === 'DEGRADED') {
      sendAlert(
        'MEDIUM',
        'autonomous-scheduler',
        'System health degraded',
        {
          status: health.status,
          degradedServices: health.degradedServices,
          components: health.components
        }
      )
      
      // Attempt automatic recovery if enabled
      if (config.autoRecovery) {
        await attemptRecovery(health)
      }
    } else if (health.status === 'DOWN') {
      sendAlert(
        'HIGH',
        'autonomous-scheduler',
        'System health critical - DOWN',
        {
          status: health.status,
          components: health.components
        }
      )
      
      // Attempt automatic recovery if enabled
      if (config.autoRecovery) {
        await attemptRecovery(health)
      }
    }
    
    // Check uptime target
    const uptime = calculateUptime()
    if (uptime < config.targetUptime) {
      sendAlert(
        'MEDIUM',
        'autonomous-scheduler',
        `Uptime below target: ${uptime.toFixed(2)}% < ${config.targetUptime}%`,
        { uptime, target: config.targetUptime }
      )
    }
    
  } catch (error) {
    logError('autonomous-scheduler', 'performHealthCheck', error as Error)
    
    sendAlert(
      'HIGH',
      'autonomous-scheduler',
      'Health check failed',
      { error: (error as Error).message }
    )
  }
}

/**
 * Attempt automatic recovery from failures
 * 
 * @param health - Current system health status
 */
async function attemptRecovery(health: SystemHealth): Promise<void> {
  log('INFO', 'autonomous-scheduler', 'Attempting automatic recovery', {
    status: health.status,
    components: health.components
  })
  
  // Track downtime
  const downtimeStart = Date.now()
  
  try {
    // Recovery strategies based on component status
    const downComponents = Object.entries(health.components)
      .filter(([_, status]) => status === 'DOWN')
      .map(([name, _]) => name)
    
    for (const component of downComponents) {
      log('INFO', 'autonomous-scheduler', `Attempting recovery for: ${component}`)
      
      // Component-specific recovery logic
      switch (component) {
        case 'dataIngestion':
          // Reconnect WebSocket connections
          log('INFO', 'autonomous-scheduler', 'Reconnecting data ingestion...')
          // TODO: Implement reconnection logic
          break
          
        case 'contentGeneration':
          // Reset generation state
          log('INFO', 'autonomous-scheduler', 'Resetting content generation...')
          // TODO: Implement reset logic
          break
          
        case 'validation':
          // Restart validation agents
          log('INFO', 'autonomous-scheduler', 'Restarting validation agents...')
          // TODO: Implement restart logic
          break
          
        case 'publishing':
          // Clear publishing queue
          log('INFO', 'autonomous-scheduler', 'Clearing publishing queue...')
          // TODO: Implement queue clearing logic
          break
          
        case 'database':
          // Reconnect database
          log('INFO', 'autonomous-scheduler', 'Reconnecting database...')
          // TODO: Implement database reconnection logic
          break
      }
    }
    
    // Wait a bit and check health again
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const newHealth = await checkEnhancedSystemHealth()
    
    if (newHealth.status === 'HEALTHY') {
      log('INFO', 'autonomous-scheduler', 'Automatic recovery successful')
      
      sendAlert(
        'LOW',
        'autonomous-scheduler',
        'System recovered automatically',
        { previousStatus: health.status, newStatus: newHealth.status }
      )
    } else {
      log('WARN', 'autonomous-scheduler', 'Automatic recovery incomplete', {
        status: newHealth.status
      })
    }
    
  } catch (error) {
    logError('autonomous-scheduler', 'attemptRecovery', error as Error)
    
    sendAlert(
      'HIGH',
      'autonomous-scheduler',
      'Automatic recovery failed',
      { error: (error as Error).message }
    )
  } finally {
    // Track downtime
    const downtimeDuration = Date.now() - downtimeStart
    state.downtimeTotal += downtimeDuration
  }
}

// ============================================================================
// STATISTICS AND MONITORING
// ============================================================================

/**
 * Calculate system uptime percentage
 * 
 * @returns Uptime percentage
 */
function calculateUptime(): number {
  if (!state.uptimeStart) return 100
  
  const totalTime = Date.now() - state.uptimeStart
  const uptime = totalTime - state.downtimeTotal
  
  return (uptime / totalTime) * 100
}

/**
 * Get scheduler statistics
 * 
 * @returns Scheduler stats
 */
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
    eventQueueSize: eventQueue.length,
    config: { ...config }
  }
}

/**
 * Get scheduler health status
 * 
 * @returns Health status
 */
export async function getSchedulerHealth() {
  const systemHealth = await checkEnhancedSystemHealth()
  const uptime = calculateUptime()
  
  return {
    scheduler: {
      isRunning: state.isRunning,
      uptime,
      activeGenerations: state.activeGenerations,
      queueSizes: {
        events: eventQueue.length,
        manualReview: manualReviewQueue.length
      }
    },
    system: systemHealth,
    meetsUptimeTarget: uptime >= config.targetUptime
  }
}

// ============================================================================
// SIMULATION HELPERS (FOR TESTING)
// ============================================================================

/**
 * Simulate generation pipeline (placeholder for testing)
 * 
 * In production, this would call the actual pipeline components.
 * 
 * @param event - Event to process
 * @returns Simulated generation result
 */
async function simulateGenerationPipeline(event: NormalizedEvent): Promise<{
  article: GeneratedArticle
  validationResult: ConsensusResult
}> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Create mock article
  const article: GeneratedArticle = {
    id: `article-${event.id}`,
    language: 'en',
    region: 'US',
    headline: `${event.asset} Market Update`,
    summary: 'Market analysis summary',
    siaInsight: 'SIA proprietary insight',
    riskDisclaimer: 'Risk disclaimer',
    fullContent: 'Full article content',
    technicalGlossary: [],
    sentiment: {
      overall: 50,
      zone: 'NEUTRAL',
      byEntity: {},
      confidence: 80,
      timestamp: new Date().toISOString()
    },
    entities: [],
    causalChains: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      confidenceScore: Math.random() * 100,
      eeatScore: 75 + Math.random() * 25,
      wordCount: 500,
      readingTime: 3,
      sources: [event.source],
      processingTime: 1000
    },
    eeatScore: 75 + Math.random() * 25,
    originalityScore: 70 + Math.random() * 30,
    technicalDepth: 'MEDIUM',
    adSenseCompliant: true
  }
  
  // Create mock validation result
  const validationResult: ConsensusResult = {
    approved: Math.random() > 0.3,
    consensusScore: Math.random() > 0.3 ? 3 : 1,
    overallConfidence: article.metadata.confidenceScore,
    criticalIssues: [],
    requiresManualReview: article.metadata.confidenceScore < config.confidenceThreshold,
    validationResults: []
  }
  
  return { article, validationResult }
}
