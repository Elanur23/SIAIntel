/**
 * AI Provider Factory
 * Phase 3A: Provider selection and initialization
 */

import { isFeatureEnabled } from '../feature-flags'
import { BaseAIProvider, type AIProviderConfig } from './providers/base-provider'
import { GeminiProvider } from './providers/gemini-provider'
import { OpenAIProvider } from './providers/openai-provider'

export type AIProviderType = 'gemini' | 'openai'

/**
 * Get the configured AI provider
 */
export function getAIProvider(): BaseAIProvider | null {
  // Check if AI generation is enabled
  if (!isFeatureEnabled('enableAIGeneration')) {
    console.log('[PROVIDER_FACTORY] AI generation is disabled')
    return null
  }
  
  // Check which provider is enabled
  if (isFeatureEnabled('enableGeminiProvider')) {
    return createGeminiProvider()
  }
  
  // Future: Check for OpenAI provider
  // if (isFeatureEnabled('enableOpenAIProvider')) {
  //   return createOpenAIProvider()
  // }
  
  console.log('[PROVIDER_FACTORY] No AI provider enabled')
  return null
}

/**
 * Create Gemini provider instance
 */
function createGeminiProvider(): GeminiProvider | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('[PROVIDER_FACTORY] Gemini API key not found')
    return null
  }
  
  const config: AIProviderConfig = {
    apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-002',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.8')
  }
  
  return new GeminiProvider(config)
}

/**
 * Create OpenAI provider instance (future)
 */
function createOpenAIProvider(): OpenAIProvider | null {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.error('[PROVIDER_FACTORY] OpenAI API key not found')
    return null
  }
  
  const config: AIProviderConfig = {
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048')
  }
  
  return new OpenAIProvider(config)
}

/**
 * Get provider status
 */
export async function getProviderStatus(): Promise<{
  enabled: boolean
  provider: AIProviderType | null
  available: boolean
  model: string | null
}> {
  const provider = getAIProvider()
  
  if (!provider) {
    return {
      enabled: false,
      provider: null,
      available: false,
      model: null
    }
  }
  
  const available = await provider.isAvailable()
  
  return {
    enabled: true,
    provider: provider.getProviderName() as AIProviderType,
    available,
    model: provider.getModelName()
  }
}
