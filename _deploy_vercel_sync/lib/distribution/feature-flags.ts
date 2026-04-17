/**
 * SIA Distribution OS - Feature Flags
 * Safe rollout control for distribution features
 * 
 * ALL FLAGS DEFAULT TO FALSE (DISABLED)
 */

export type FeatureFlag =
  | 'enableDistributionModule'    // Master switch for entire distribution system
  | 'enableBreakingMode'          // Enable breaking news distribution mode
  | 'enableEditorialMode'         // Enable editorial distribution mode
  | 'enableAIGeneration'          // Enable AI content generation (Phase 3A)
  | 'enableGeminiProvider'        // Enable Gemini 1.5 Pro provider (Phase 3A)
  | 'enablePublishSimulation'     // Enable publish simulation (Phase 3B - dry-run only)
  | 'enableTelegramSandboxPublish'   // Enable Telegram SANDBOX publishing (Phase 3C - test only)
  | 'enableTelegramProductionPublish' // Enable Telegram PRODUCTION publishing (Phase 3C - disabled)
  | 'enableAutonomousAssistant'   // Enable autonomous suggestion assistant (Phase 3D - human-in-loop only)
  | 'enablePlatformX'             // Enable X (Twitter) integration
  | 'enablePlatformLinkedIn'      // Enable LinkedIn integration
  | 'enablePlatformTelegram'      // Enable Telegram integration
  | 'enablePlatformFacebook'      // Enable Facebook integration
  | 'enablePlatformDiscord'       // Enable Discord integration (Phase 3)
  | 'enablePlatformInstagram'     // Enable Instagram integration (Phase 3)
  | 'enablePlatformTikTok'        // Enable TikTok integration (Phase 3)

/**
 * Feature flag configuration
 * SAFE FIRST-LIVE CONFIGURATION
 * 
 * ENABLED: Editorial workflow + Telegram sandbox only
 * DISABLED: Production publishing, automation, other platforms
 */
const featureFlags: Record<FeatureFlag, boolean> = {
  // ENABLED: Core distribution features
  enableDistributionModule: true,      // Master switch
  enableEditorialMode: true,           // Editorial workflow
  enableAIGeneration: true,            // AI content generation
  enableGeminiProvider: true,          // Gemini 1.5 Pro
  enablePlatformTelegram: true,        // Telegram platform
  enableTelegramSandboxPublish: true,  // Sandbox publishing ONLY
  
  // DISABLED: Breaking mode, production, other platforms
  enableBreakingMode: false,                // Breaking news mode OFF
  enablePublishSimulation: false,           // Simulation OFF
  enableTelegramProductionPublish: false,   // PRODUCTION BLOCKED
  enableAutonomousAssistant: false,         // Autonomous assistant OFF
  enablePlatformX: false,                   // X/Twitter OFF
  enablePlatformLinkedIn: false,            // LinkedIn OFF
  enablePlatformFacebook: false,            // Facebook OFF
  enablePlatformDiscord: false,             // Discord OFF
  enablePlatformInstagram: false,           // Instagram OFF
  enablePlatformTikTok: false               // TikTok OFF
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] === true
}

/**
 * Get all feature flags (for admin UI)
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...featureFlags }
}

/**
 * Enable a feature flag (admin only)
 * WARNING: This is in-memory only. Use environment variables or database in production.
 */
export function enableFeature(flag: FeatureFlag): void {
  featureFlags[flag] = true
  console.log(`[DISTRIBUTION] Feature enabled: ${flag}`)
}

/**
 * Disable a feature flag (admin only)
 */
export function disableFeature(flag: FeatureFlag): void {
  featureFlags[flag] = false
  console.log(`[DISTRIBUTION] Feature disabled: ${flag}`)
}
