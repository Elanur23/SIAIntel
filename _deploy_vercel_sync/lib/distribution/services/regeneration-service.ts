/**
 * Regeneration Service
 * Phase 3A.5: Content regeneration with style modifiers
 */

import { getAIProvider } from '../ai/provider-factory'
import { LOCALE_REWRITER_SYSTEM_PROMPT, PLATFORM_ADAPTER_SYSTEM_PROMPT } from '../ai/prompts/system-prompts'
import type { RegenerationMode, Language, Platform, LocalizedContent, PlatformVariant } from '../types'

export interface RegenerationRequest {
  content: string
  mode: RegenerationMode
  language: Language
  platform?: Platform
  context?: string
}

export interface RegenerationResult {
  success: boolean
  regeneratedContent?: string
  error?: string
  metadata?: {
    originalLength: number
    regeneratedLength: number
    mode: RegenerationMode
    tokensUsed?: number
  }
}

/**
 * Regenerate content with style modifier
 * Phase 3A.5: Draft output only (no automatic persistence)
 */
export async function regenerateContent(
  request: RegenerationRequest
): Promise<RegenerationResult> {
  const provider = getAIProvider()
  
  if (!provider) {
    return {
      success: false,
      error: 'AI provider not available'
    }
  }
  
  try {
    const originalLength = request.content.length
    const prompt = buildRegenerationPrompt(request)
    
    console.log(`[REGENERATION_SERVICE] Regenerating with mode: ${request.mode}`)
    
    const response = await provider.generate({
      systemPrompt: getSystemPrompt(request),
      userPrompt: prompt,
      temperature: getTemperature(request.mode),
      maxTokens: getMaxTokens(request.mode)
    })
    
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Regeneration failed'
      }
    }
    
    const regeneratedContent = response.content.trim()
    const regeneratedLength = regeneratedContent.length
    
    console.log(`[REGENERATION_SERVICE] Original: ${originalLength} chars, Regenerated: ${regeneratedLength} chars`)
    
    return {
      success: true,
      regeneratedContent,
      metadata: {
        originalLength,
        regeneratedLength,
        mode: request.mode,
        tokensUsed: response.tokensUsed?.total
      }
    }
    
  } catch (error: any) {
    console.error('[REGENERATION_SERVICE] Regeneration failed:', error)
    
    return {
      success: false,
      error: error.message || 'Regeneration failed'
    }
  }
}

/**
 * Regenerate localized content
 */
export async function regenerateLocalizedContent(
  content: LocalizedContent,
  mode: RegenerationMode
): Promise<RegenerationResult> {
  return regenerateContent({
    content: content.content,
    mode,
    language: content.language,
    context: `Title: ${content.title}\nSummary: ${content.summary}`
  })
}

/**
 * Regenerate platform content
 */
export async function regeneratePlatformContent(
  content: PlatformVariant,
  mode: RegenerationMode
): Promise<RegenerationResult> {
  return regenerateContent({
    content: content.body,
    mode,
    language: content.language,
    platform: content.platform,
    context: `Title: ${content.title}`
  })
}

/**
 * Build regeneration prompt based on mode
 */
function buildRegenerationPrompt(request: RegenerationRequest): string {
  const modeInstructions = getRegenerationInstructions(request.mode)
  
  let prompt = `${modeInstructions}\n\n`
  
  if (request.context) {
    prompt += `CONTEXT:\n${request.context}\n\n`
  }
  
  prompt += `ORIGINAL CONTENT:\n${request.content}\n\n`
  prompt += `LANGUAGE: ${request.language.toUpperCase()}\n`
  
  if (request.platform) {
    prompt += `PLATFORM: ${request.platform.toUpperCase()}\n`
  }
  
  prompt += `\nREGENERATED CONTENT:`
  
  return prompt
}

/**
 * Get regeneration instructions for each mode
 */
function getRegenerationInstructions(mode: RegenerationMode): string {
  switch (mode) {
    case 'more_professional':
      return `Rewrite the content to be MORE PROFESSIONAL:
- Use formal business language
- Remove casual expressions
- Enhance technical terminology
- Maintain authoritative tone
- Keep all factual information
- Preserve key data points
- Professional financial journalism style`
    
    case 'shorter':
      return `Rewrite the content to be SHORTER (reduce by 30-40%):
- Keep only essential information
- Remove redundant phrases
- Condense explanations
- Maintain all key data points
- Preserve critical insights
- Keep professional tone
- No loss of core message`
    
    case 'sharper':
      return `Rewrite the content to be SHARPER:
- More direct and punchy
- Stronger opening
- Clearer conclusions
- Remove filler words
- Active voice preferred
- Impactful statements
- Maintain professionalism`
    
    case 'safer':
      return `Rewrite the content to be SAFER (compliance-focused):
- Add appropriate disclaimers
- Soften absolute claims
- Use "may", "could", "potentially"
- Emphasize risks
- Add "not financial advice" context
- Maintain factual accuracy
- Professional and cautious tone`
    
    case 'fewer_hashtags':
      return `Rewrite the content with FEWER HASHTAGS:
- Reduce hashtags by 50% or more
- Keep only most relevant hashtags
- Remove generic hashtags
- Maintain content quality
- Professional presentation
- Focus on substance over tags`
    
    default:
      return 'Rewrite the content while maintaining quality and accuracy.'
  }
}

/**
 * Get system prompt based on context
 */
function getSystemPrompt(request: RegenerationRequest): string {
  if (request.platform) {
    return PLATFORM_ADAPTER_SYSTEM_PROMPT
  }
  return LOCALE_REWRITER_SYSTEM_PROMPT
}

/**
 * Get temperature based on regeneration mode
 */
function getTemperature(mode: RegenerationMode): number {
  switch (mode) {
    case 'more_professional':
      return 0.2 // More conservative
    case 'shorter':
      return 0.3 // Balanced
    case 'sharper':
      return 0.4 // Slightly creative
    case 'safer':
      return 0.2 // Very conservative
    case 'fewer_hashtags':
      return 0.3 // Balanced
    default:
      return 0.3
  }
}

/**
 * Get max tokens based on regeneration mode
 */
function getMaxTokens(mode: RegenerationMode): number {
  switch (mode) {
    case 'shorter':
      return 1024 // Reduced output
    case 'more_professional':
    case 'sharper':
    case 'safer':
    case 'fewer_hashtags':
      return 2048 // Standard output
    default:
      return 2048
  }
}

/**
 * Validate regeneration request
 */
export function validateRegenerationRequest(request: RegenerationRequest): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!request.content || request.content.trim().length < 50) {
    issues.push('Content must be at least 50 characters')
  }
  
  if (!request.mode) {
    issues.push('Regeneration mode is required')
  }
  
  if (!request.language) {
    issues.push('Language is required')
  }
  
  const validModes: RegenerationMode[] = [
    'more_professional',
    'shorter',
    'sharper',
    'safer',
    'fewer_hashtags'
  ]
  
  if (request.mode && !validModes.includes(request.mode)) {
    issues.push(`Invalid regeneration mode: ${request.mode}`)
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
