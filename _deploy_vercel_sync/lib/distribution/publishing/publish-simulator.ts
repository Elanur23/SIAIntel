/**
 * Publish Simulator
 * Phase 3B: Configurable simulation engine
 * 
 * WARNING: This is for simulation only.
 * No real publishing occurs.
 */

import type { SimulationOptions } from '@/lib/distribution/types'

/**
 * Default simulation options
 */
const defaultOptions: SimulationOptions = {
  simulateDelay: true,
  simulateFailure: true,
  failureRate: 0.05, // 5% failure rate
  delayRange: {
    min: 500,
    max: 2000
  }
}

/**
 * Current simulation options
 */
let currentOptions: SimulationOptions = { ...defaultOptions }

/**
 * Set simulation options
 */
export function setSimulationOptions(options: Partial<SimulationOptions>): void {
  currentOptions = {
    ...currentOptions,
    ...options
  }
  console.log('[PUBLISH_SIMULATOR] Options updated:', currentOptions)
}

/**
 * Get current simulation options
 */
export function getSimulationOptions(): SimulationOptions {
  return { ...currentOptions }
}

/**
 * Reset simulation options to defaults
 */
export function resetSimulationOptions(): void {
  currentOptions = { ...defaultOptions }
  console.log('[PUBLISH_SIMULATOR] Options reset to defaults')
}

/**
 * Simulate network delay
 */
export async function simulateDelay(): Promise<number> {
  if (!currentOptions.simulateDelay) {
    return 0
  }
  
  const { min, max } = currentOptions.delayRange
  const delay = Math.random() * (max - min) + min
  
  await sleep(delay)
  return delay
}

/**
 * Determine if this simulation should fail
 */
export function shouldSimulateFailure(): boolean {
  if (!currentOptions.simulateFailure) {
    return false
  }
  
  return Math.random() < currentOptions.failureRate
}

/**
 * Generate mock post ID
 */
export function generateMockPostId(platform: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${platform}_${timestamp}_${random}`
}

/**
 * Generate mock post URL
 */
export function generateMockPostUrl(platform: string, postId: string): string {
  const urls: Record<string, string> = {
    x: `https://x.com/siaintel/status/${postId}`,
    linkedin: `https://www.linkedin.com/feed/update/urn:li:share:${postId}`,
    telegram: `https://t.me/siaintel/${postId}`,
    facebook: `https://www.facebook.com/siaintel/posts/${postId}`,
    discord: `https://discord.com/channels/siaintel/${postId}`,
    instagram: `https://www.instagram.com/p/${postId}/`,
    tiktok: `https://www.tiktok.com/@siaintel/video/${postId}`
  }
  
  return urls[platform] || `https://example.com/${platform}/${postId}`
}

/**
 * Generate mock error
 */
export function generateMockError(platform: string): {
  code: string
  message: string
  details: string
} {
  const errors = [
    {
      code: 'SIMULATED_NETWORK_ERROR',
      message: `Simulated network error for ${platform} (this is a test)`,
      details: 'Random network failure simulation for testing error handling'
    },
    {
      code: 'SIMULATED_API_ERROR',
      message: `Simulated API error for ${platform} (this is a test)`,
      details: 'Random API failure simulation for testing error handling'
    },
    {
      code: 'SIMULATED_RATE_LIMIT',
      message: `Simulated rate limit error for ${platform} (this is a test)`,
      details: 'Random rate limit simulation for testing error handling'
    },
    {
      code: 'SIMULATED_AUTH_ERROR',
      message: `Simulated authentication error for ${platform} (this is a test)`,
      details: 'Random auth failure simulation for testing error handling'
    }
  ]
  
  return errors[Math.floor(Math.random() * errors.length)]
}

/**
 * Get simulation statistics
 */
export function getSimulationStats(): {
  options: SimulationOptions
  expectedSuccessRate: number
  expectedFailureRate: number
  averageDelay: number
} {
  const { failureRate, delayRange } = currentOptions
  const averageDelay = (delayRange.min + delayRange.max) / 2
  
  return {
    options: { ...currentOptions },
    expectedSuccessRate: (1 - failureRate) * 100,
    expectedFailureRate: failureRate * 100,
    averageDelay
  }
}

/**
 * Helper: sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
