/**
 * Platform-Specific Prompt Templates
 * Phase 3A: Per-platform generation prompts
 */

import type { Platform } from '../../types'

export function getPlatformPrompt(platform: Platform, content: string): string {
  const platformRules = {
    x: 'Max 280 chars, thread format if needed, professional hashtags, engaging but credible',
    linkedin: 'Professional network tone, max 3000 chars, article format, industry insights',
    telegram: 'Max 4096 chars, emoji-friendly, instant messaging style, channel format',
    facebook: 'Engagement-focused, max 63K chars, visual-friendly, community tone'
  }

  const rule = platformRules[platform as keyof typeof platformRules] || 'Professional tone'

  return `Adapt the following financial content for ${platform.toUpperCase()}.

PLATFORM REQUIREMENTS: ${rule}

SOURCE CONTENT:
${content}

OUTPUT: JSON with { title, body, hashtags }`
}
