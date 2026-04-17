/**
 * Platform Copy Generation Pipeline
 * Phase 3A: Platform-specific content adaptation
 */

import { getAIProvider } from '../provider-factory'
import { PLATFORM_ADAPTER_SYSTEM_PROMPT } from '../prompts/system-prompts'
import { getPlatformPrompt } from '../prompts/platform-prompts'
import type { Platform, PlatformVariant, Language } from '../../types'

export interface PlatformCopyRequest {
  content: string
  platforms: Platform[]
  language: Language
}

export interface PlatformCopyResult {
  success: boolean
  variants: Partial<Record<Platform, PlatformVariant>>
  errors: Partial<Record<Platform, string>>
}

export async function generatePlatformCopies(
  request: PlatformCopyRequest
): Promise<PlatformCopyResult> {
  const provider = getAIProvider()
  
  if (!provider) {
    return {
      success: false,
      variants: {},
      errors: { x: 'AI provider not available' }
    }
  }

  const variants: Partial<Record<Platform, PlatformVariant>> = {}
  const errors: Partial<Record<Platform, string>> = {}

  for (const platform of request.platforms) {
    try {
      const userPrompt = getPlatformPrompt(platform, request.content)
      
      const response = await provider.generate({
        systemPrompt: PLATFORM_ADAPTER_SYSTEM_PROMPT,
        userPrompt,
        responseFormat: 'json'
      })

      if (response.success) {
        const parsed = JSON.parse(response.content)
        variants[platform] = {
          platform,
          language: request.language,
          title: parsed.title || '',
          body: parsed.body || '',
          media: [],
          metadata: createPlatformMetadata(platform),
          status: 'pending'
        }
      } else {
        errors[platform] = response.error || 'Generation failed'
      }
    } catch (error: any) {
      errors[platform] = error.message
    }
  }

  return {
    success: Object.keys(variants).length > 0,
    variants,
    errors
  }
}

function createPlatformMetadata(platform: Platform): any {
  switch (platform) {
    case 'x':
      return { platform: 'x', threadLength: 1 }
    case 'linkedin':
      return { platform: 'linkedin', visibility: 'public', articleFormat: false }
    case 'telegram':
      return { platform: 'telegram', channelId: '', pinMessage: false, disableNotification: false }
    case 'facebook':
      return { platform: 'facebook', pageId: '', targetAudience: [] }
    case 'discord':
      return { platform: 'discord', channelId: '', embedColor: '', mentionRoles: [] }
    case 'instagram':
      return { platform: 'instagram', postType: 'feed', aspectRatio: '1:1' }
    case 'tiktok':
      return { platform: 'tiktok', videoUrl: '', duetEnabled: false, stitchEnabled: false }
    default:
      return { platform }
  }
}
