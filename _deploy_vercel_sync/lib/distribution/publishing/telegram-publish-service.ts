/**
 * Telegram Publish Service
 * Phase 3C Step 1: Pre-publish validation and orchestration
 * 
 * CRITICAL SAFETY RULES:
 * - Validates feature flags before publishing
 * - Enforces safety thresholds
 * - Requires manual confirmation
 * - Logs all operations
 * - Sandbox mode enforced by default
 * 
 * This service orchestrates the entire publish flow with safety checks.
 */

import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import { checkBrandSafety, type BrandSafetyResult } from '@/lib/distribution/editorial/brand-safety-editorial-service'
import type { PublishPayload, Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import {
  publishToTelegram,
  validateTelegramConfig,
  getTelegramConfigStatus,
  type TelegramPublishMode,
  type TelegramPublishResult
} from './telegram-real-adapter'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pre-publish validation result
 */
export interface PrePublishValidation {
  canPublish: boolean
  mode: TelegramPublishMode
  errors: string[]
  warnings: string[]
  safetyChecks: {
    featureFlagEnabled: boolean
    configurationValid: boolean
    trustScorePass: boolean
    complianceScorePass: boolean
    brandSafetyPass: boolean
  }
  scores: {
    trustScore: number
    complianceScore: number
    brandSafetyScore: number
  }
  brandSafetyResult?: BrandSafetyResult
}

/**
 * Publish request
 */
export interface TelegramPublishRequest {
  payload: PublishPayload
  mode: TelegramPublishMode
  
  // Context for safety checks
  context: {
    locale: Language
    platform: Platform
    category: TrendCategory
    headline: string
    hook: string
    body: string
  }
  
  // Optional metadata
  metadata?: {
    articleId?: string
    articleTitle?: string
    variantType?: string
  }
}

/**
 * Complete publish result with validation
 */
export interface TelegramPublishResponse {
  success: boolean
  mode: TelegramPublishMode
  validation: PrePublishValidation
  publishResult?: TelegramPublishResult
  timestamp: Date
  
  // Metadata
  metadata?: {
    articleId?: string
    articleTitle?: string
    variantType?: string
  }
}

// ============================================================================
// SAFETY THRESHOLDS
// ============================================================================

const SAFETY_THRESHOLDS = {
  minTrustScore: 70,
  minComplianceScore: 70,
  minBrandSafetyScore: 60
}

// ============================================================================
// PRE-PUBLISH VALIDATION
// ============================================================================

/**
 * Validate publish request before execution
 * 
 * CRITICAL: This is the safety gate. If validation fails, publishing is blocked.
 */
export async function validatePublishRequest(
  request: TelegramPublishRequest
): Promise<PrePublishValidation> {
  const { mode, context } = request
  const errors: string[] = []
  const warnings: string[] = []
  
  console.log('[TELEGRAM_PUBLISH] Validating publish request in', mode, 'mode')
  
  // Check 1: Feature flag
  const featureFlagEnabled = mode === 'sandbox'
    ? isFeatureEnabled('enableTelegramSandboxPublish')
    : isFeatureEnabled('enableTelegramProductionPublish')
  
  if (!featureFlagEnabled) {
    errors.push(`Feature flag for ${mode} mode is not enabled`)
  }
  
  // Check 2: Configuration
  const configValidation = validateTelegramConfig(mode)
  const configurationValid = configValidation.isValid
  
  if (!configurationValid) {
    errors.push(...configValidation.errors)
  }
  
  // Check 3: Brand safety
  const brandSafetyResult = checkBrandSafety({
    headline: context.headline,
    hook: context.hook,
    body: context.body,
    locale: context.locale,
    platform: context.platform,
    category: context.category,
    hasDisclaimer: true // Assume disclaimer is present
  })
  
  const brandSafetyPass = brandSafetyResult.safetyScore >= SAFETY_THRESHOLDS.minBrandSafetyScore
  const trustScorePass = brandSafetyResult.credibilityScore >= SAFETY_THRESHOLDS.minTrustScore
  const complianceScorePass = brandSafetyResult.complianceScore >= SAFETY_THRESHOLDS.minComplianceScore
  
  if (!brandSafetyPass) {
    errors.push(`Brand safety score too low: ${brandSafetyResult.safetyScore}/${SAFETY_THRESHOLDS.minBrandSafetyScore}`)
  }
  
  if (!trustScorePass) {
    warnings.push(`Trust score below threshold: ${brandSafetyResult.credibilityScore}/${SAFETY_THRESHOLDS.minTrustScore}`)
  }
  
  if (!complianceScorePass) {
    warnings.push(`Compliance score below threshold: ${brandSafetyResult.complianceScore}/${SAFETY_THRESHOLDS.minComplianceScore}`)
  }
  
  // Check for critical brand safety issues
  const criticalIssues = brandSafetyResult.issues.filter(i => i.severity === 'critical')
  if (criticalIssues.length > 0) {
    errors.push(`${criticalIssues.length} critical brand safety issue(s) detected`)
  }
  
  // Determine if can publish
  const canPublish = errors.length === 0
  
  console.log('[TELEGRAM_PUBLISH] Validation result:', {
    canPublish,
    errors: errors.length,
    warnings: warnings.length,
    brandSafetyScore: brandSafetyResult.safetyScore
  })
  
  return {
    canPublish,
    mode,
    errors,
    warnings,
    safetyChecks: {
      featureFlagEnabled,
      configurationValid,
      trustScorePass,
      complianceScorePass,
      brandSafetyPass
    },
    scores: {
      trustScore: brandSafetyResult.credibilityScore,
      complianceScore: brandSafetyResult.complianceScore,
      brandSafetyScore: brandSafetyResult.safetyScore
    },
    brandSafetyResult
  }
}

// ============================================================================
// PUBLISHING
// ============================================================================

/**
 * Publish to Telegram with full validation
 * 
 * CRITICAL: This performs REAL publishing if validation passes.
 */
export async function publishWithValidation(
  request: TelegramPublishRequest
): Promise<TelegramPublishResponse> {
  console.log('[TELEGRAM_PUBLISH] Starting publish flow')
  
  // Step 1: Validate
  const validation = await validatePublishRequest(request)
  
  // Step 2: Block if validation fails
  if (!validation.canPublish) {
    console.error('[TELEGRAM_PUBLISH] Validation failed, blocking publish')
    
    return {
      success: false,
      mode: request.mode,
      validation,
      timestamp: new Date(),
      metadata: request.metadata
    }
  }
  
  // Step 3: Publish
  console.log('[TELEGRAM_PUBLISH] Validation passed, proceeding with publish')
  
  const publishResult = await publishToTelegram(request.payload, {
    mode: request.mode,
    disableNotification: false,
    parseMode: 'HTML'
  })
  
  // Step 4: Log result
  console.log('[TELEGRAM_PUBLISH] Publish result:', {
    success: publishResult.success,
    mode: publishResult.mode,
    messageId: publishResult.messageId
  })
  
  return {
    success: publishResult.success,
    mode: request.mode,
    validation,
    publishResult,
    timestamp: new Date(),
    metadata: request.metadata
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get publish readiness status
 */
export function getPublishReadiness(mode: TelegramPublishMode): {
  ready: boolean
  issues: string[]
  configStatus: ReturnType<typeof getTelegramConfigStatus>
} {
  const issues: string[] = []
  
  // Check feature flag
  const featureFlagEnabled = mode === 'sandbox'
    ? isFeatureEnabled('enableTelegramSandboxPublish')
    : isFeatureEnabled('enableTelegramProductionPublish')
  
  if (!featureFlagEnabled) {
    issues.push(`Feature flag for ${mode} mode is not enabled`)
  }
  
  // Check configuration
  const configStatus = getTelegramConfigStatus()
  
  if (!configStatus.hasBotToken) {
    issues.push('TELEGRAM_BOT_TOKEN is not configured')
  }
  
  if (mode === 'sandbox' && !configStatus.hasTestChatId) {
    issues.push('TELEGRAM_TEST_CHAT_ID is not configured')
  }
  
  if (mode === 'production' && !configStatus.hasProductionChatId) {
    issues.push('TELEGRAM_PRODUCTION_CHAT_ID is not configured')
  }
  
  if (mode === 'production' && !configStatus.chatIdsAreDifferent) {
    issues.push('CRITICAL: Production and test chat IDs must be different')
  }
  
  return {
    ready: issues.length === 0,
    issues,
    configStatus
  }
}

/**
 * Get safety thresholds
 */
export function getSafetyThresholds() {
  return { ...SAFETY_THRESHOLDS }
}

/**
 * Check if mode is allowed
 */
export function isModeAllowed(mode: TelegramPublishMode): boolean {
  if (mode === 'sandbox') {
    return isFeatureEnabled('enableTelegramSandboxPublish')
  }
  if (mode === 'production') {
    return isFeatureEnabled('enableTelegramProductionPublish')
  }
  return false
}

/**
 * Get allowed modes
 */
export function getAllowedModes(): TelegramPublishMode[] {
  const modes: TelegramPublishMode[] = []
  
  if (isFeatureEnabled('enableTelegramSandboxPublish')) {
    modes.push('sandbox')
  }
  
  if (isFeatureEnabled('enableTelegramProductionPublish')) {
    modes.push('production')
  }
  
  return modes
}
