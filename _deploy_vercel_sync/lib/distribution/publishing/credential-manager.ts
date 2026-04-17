/**
 * Credential Manager
 * Phase 3B: Mock credential storage (simulation only)
 * 
 * WARNING: This is for simulation only.
 * Never store real credentials in code or in-memory storage.
 * Use environment variables or secure vault services in production.
 */

import type { Platform, PlatformCredentialsExtended } from '@/lib/distribution/types'

/**
 * In-memory mock credentials storage
 * WARNING: This is for testing only
 */
const mockCredentials = new Map<Platform, PlatformCredentialsExtended>()

/**
 * Initialize mock credentials for testing
 */
export function initializeMockCredentials(): void {
  const platforms: Platform[] = ['x', 'linkedin', 'telegram', 'facebook']
  
  platforms.forEach(platform => {
    mockCredentials.set(platform, {
      platform,
      enabled: true,
      config: {},
      accountId: `mock_${platform}_account_id`,
      accountName: `SIA Intel ${platform.toUpperCase()}`,
      apiKey: maskCredential(`mock_${platform}_api_key_12345`),
      apiSecret: maskCredential(`mock_${platform}_api_secret_67890`),
      accessToken: maskCredential(`mock_${platform}_access_token_abcdef`),
      refreshToken: maskCredential(`mock_${platform}_refresh_token_ghijkl`),
      isValid: true,
      lastValidated: new Date(),
      environment: 'simulation'
    })
  })
  
  console.log('[CREDENTIAL_MANAGER] Mock credentials initialized for simulation')
}

/**
 * Get credentials for a platform
 * WARNING: Returns mock credentials only
 */
export function getCredentials(platform: Platform): PlatformCredentialsExtended | null {
  return mockCredentials.get(platform) || null
}

/**
 * Validate credentials (mock validation)
 * WARNING: This always returns true for simulation
 */
export async function validateCredentials(platform: Platform): Promise<boolean> {
  const creds = mockCredentials.get(platform)
  
  if (!creds) {
    console.warn(`[CREDENTIAL_MANAGER] No credentials found for ${platform}`)
    return false
  }
  
  // Simulate validation delay
  await sleep(500)
  
  // Mock validation always succeeds
  creds.lastValidated = new Date()
  creds.isValid = true
  
  console.log(`[CREDENTIAL_MANAGER] Mock validation successful for ${platform}`)
  return true
}

/**
 * Check if credentials exist for a platform
 */
export function hasCredentials(platform: Platform): boolean {
  return mockCredentials.has(platform)
}

/**
 * Get all configured platforms
 */
export function getConfiguredPlatforms(): Platform[] {
  return Array.from(mockCredentials.keys())
}

/**
 * Mask credential for display
 */
function maskCredential(credential: string): string {
  if (credential.length <= 8) {
    return '****'
  }
  const visible = 4
  const start = credential.substring(0, visible)
  const end = credential.substring(credential.length - visible)
  return `${start}${'*'.repeat(credential.length - visible * 2)}${end}`
}

/**
 * Get masked credentials for display
 */
export function getMaskedCredentials(platform: Platform): Partial<PlatformCredentialsExtended> | null {
  const creds = mockCredentials.get(platform)
  
  if (!creds) {
    return null
  }
  
  return {
    platform: creds.platform,
    accountId: creds.accountId,
    accountName: creds.accountName,
    apiKey: creds.apiKey, // Already masked
    isValid: creds.isValid,
    lastValidated: creds.lastValidated,
    environment: creds.environment
  }
}

/**
 * Get all masked credentials
 */
export function getAllMaskedCredentials(): Partial<PlatformCredentialsExtended>[] {
  return Array.from(mockCredentials.keys())
    .map(platform => getMaskedCredentials(platform))
    .filter((creds): creds is Partial<PlatformCredentialsExtended> => creds !== null)
}

/**
 * Helper: sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Initialize mock credentials on module load
initializeMockCredentials()
