/**
 * AI Adapter Service
 * Phase 2: Interface definition (disabled by default)
 * 
 * This adapter provides the interface for AI services (Gemini, OpenAI, etc.)
 * Real AI integration will be enabled in Phase 3.
 * 
 * IMPORTANT: This service is DISABLED by default and requires explicit feature flag
 */

import { isFeatureEnabled } from '../feature-flags'
import type { Language } from '../types'

export interface AIGenerationRequest {
  prompt: string
  language: Language
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AIGenerationResponse {
  success: boolean
  content: string
  tokensUsed?: number
  error?: string
}

/**
 * Check if AI service is enabled
 */
export function isAIServiceEnabled(): boolean {
  // Phase 2: Always disabled
  // Phase 3: Will check feature flag and API keys
  return false
}

/**
 * Generate content using AI service
 * Phase 2: Throws error (disabled)
 */
export async function generateWithAI(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  if (!isAIServiceEnabled()) {
    return {
      success: false,
      content: '',
      error: 'AI service is disabled. Enable in Phase 3.'
    }
  }
  
  // Phase 3: Real implementation will go here
  // Will integrate with Gemini 1.5 Pro with Google Search grounding
  
  throw new Error('AI service not implemented yet (Phase 3)')
}

/**
 * Validate AI service configuration
 */
export function validateAIConfig(): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check API keys
  if (!process.env.GOOGLE_AI_API_KEY && !process.env.OPENAI_API_KEY) {
    issues.push('No AI API keys configured')
  }
  
  // Check feature flags
  if (!isFeatureEnabled('enableDistributionModule')) {
    issues.push('Distribution module is disabled')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Get AI service status
 */
export function getAIServiceStatus(): {
  enabled: boolean
  provider: 'gemini' | 'openai' | 'none'
  configured: boolean
  rateLimitRemaining?: number
} {
  // Phase 2: Always disabled
  return {
    enabled: false,
    provider: 'none',
    configured: false
  }
}

/**
 * AI Service Configuration (for Phase 3)
 */
export interface AIServiceConfig {
  provider: 'gemini' | 'openai'
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  enableGrounding: boolean // For Gemini with Google Search
}

/**
 * Get default AI configuration
 */
export function getDefaultAIConfig(): AIServiceConfig {
  return {
    provider: 'gemini',
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: 'gemini-1.5-pro-002',
    temperature: 0.3,
    maxTokens: 2048,
    enableGrounding: true
  }
}

/**
 * Estimate token usage (for cost calculation)
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Calculate estimated cost
 */
export function estimateCost(inputTokens: number, outputTokens: number): {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: string
} {
  // Gemini 1.5 Pro pricing (as of 2024)
  const INPUT_COST_PER_1K = 0.00125 // $1.25 per 1M tokens
  const OUTPUT_COST_PER_1K = 0.005   // $5.00 per 1M tokens
  
  const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K
  const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD'
  }
}
