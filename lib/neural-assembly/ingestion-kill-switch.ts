/**
 * 🛑 EMERGENCY_STOP_AUTO_INGESTION
 * 
 * Kill Switch for All Automatic Content Ingestion
 * 
 * When MANUAL_ONLY_MODE is enabled:
 * - No automatic news fetching
 * - No automatic workspace writes
 * - No scheduled crawlers
 * - Only manual War Room entries allowed
 */

export interface IngestionConfig {
  MANUAL_ONLY_MODE: boolean
  ALLOW_AUTO_FETCH: boolean
  ALLOW_AUTO_WORKSPACE_WRITE: boolean
  ALLOW_SCHEDULED_CRAWLERS: boolean
  ALLOW_EXTERNAL_SIGNALS: boolean
  REQUIRE_MANUAL_APPROVAL: boolean
}

/**
 * 🔴 KILL SWITCH ACTIVATED
 * 
 * All automatic ingestion is DISABLED
 * Only manual entries through War Room are allowed
 */
export const INGESTION_CONFIG: IngestionConfig = {
  MANUAL_ONLY_MODE: true,           // 🛑 EMERGENCY MODE ACTIVE
  ALLOW_AUTO_FETCH: false,          // ❌ No automatic fetching
  ALLOW_AUTO_WORKSPACE_WRITE: false, // ❌ No automatic workspace writes
  ALLOW_SCHEDULED_CRAWLERS: false,   // ❌ No scheduled crawlers
  ALLOW_EXTERNAL_SIGNALS: false,     // ❌ No external signal ingestion
  REQUIRE_MANUAL_APPROVAL: true,     // ✅ Manual approval required for all operations
}

/**
 * Check if automatic ingestion is allowed
 */
export function isAutoIngestionAllowed(): boolean {
  return !INGESTION_CONFIG.MANUAL_ONLY_MODE && INGESTION_CONFIG.ALLOW_AUTO_FETCH
}

/**
 * Check if workspace can be written automatically
 */
export function isAutoWorkspaceWriteAllowed(): boolean {
  return !INGESTION_CONFIG.MANUAL_ONLY_MODE && INGESTION_CONFIG.ALLOW_AUTO_WORKSPACE_WRITE
}

/**
 * Check if scheduled crawlers can run
 */
export function areScheduledCrawlersAllowed(): boolean {
  return !INGESTION_CONFIG.MANUAL_ONLY_MODE && INGESTION_CONFIG.ALLOW_SCHEDULED_CRAWLERS
}

/**
 * Check if external signals can be ingested
 */
export function areExternalSignalsAllowed(): boolean {
  return !INGESTION_CONFIG.MANUAL_ONLY_MODE && INGESTION_CONFIG.ALLOW_EXTERNAL_SIGNALS
}

/**
 * Throw error if automatic operation is attempted in manual-only mode
 */
export function enforceManualOnlyMode(operation: string): void {
  if (INGESTION_CONFIG.MANUAL_ONLY_MODE) {
    throw new Error(
      `🛑 MANUAL_ONLY_MODE ACTIVE: ${operation} is disabled. ` +
      `Only manual entries through War Room are allowed.`
    )
  }
}

/**
 * Log blocked automatic operation
 */
export function logBlockedOperation(operation: string, source: string): void {
  console.warn(
    `🛑 [INGESTION_KILL_SWITCH] Blocked automatic operation: ${operation} from ${source}. ` +
    `MANUAL_ONLY_MODE is active.`
  )
}

/**
 * Get current ingestion status
 */
export function getIngestionStatus(): {
  mode: 'MANUAL_ONLY' | 'AUTOMATIC'
  config: IngestionConfig
  message: string
} {
  return {
    mode: INGESTION_CONFIG.MANUAL_ONLY_MODE ? 'MANUAL_ONLY' : 'AUTOMATIC',
    config: INGESTION_CONFIG,
    message: INGESTION_CONFIG.MANUAL_ONLY_MODE
      ? '🛑 MANUAL_ONLY_MODE: All automatic ingestion is disabled. Only manual War Room entries are allowed.'
      : '✅ AUTOMATIC_MODE: Automatic ingestion is enabled.',
  }
}
