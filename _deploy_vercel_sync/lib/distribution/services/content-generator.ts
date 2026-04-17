/**
 * Content Generator Service
 * Phase 2: Interface/Mock Implementation
 * 
 * This service provides the interface for content generation.
 * Real AI integration will be added in Phase 3.
 */

import type { Language, LocalizedContent } from '../types'

export interface ContentGenerationRequest {
  sourceTitle: string
  sourceContent: string
  sourceLanguage: Language
  targetLanguages: Language[]
  mode: 'breaking' | 'editorial'
}

export interface ContentGenerationResult {
  success: boolean
  localizedContent: Record<Language, LocalizedContent>
  error?: string
}

/**
 * Generate localized content for multiple languages
 * Phase 2: Mock implementation
 */
export async function generateLocalizedContent(
  request: ContentGenerationRequest
): Promise<ContentGenerationResult> {
  // Phase 2: Mock implementation
  // Real AI generation will be added in Phase 3
  
  console.log('[CONTENT_GENERATOR] Mock generation for:', request.sourceTitle)
  
  const localizedContent: Record<Language, LocalizedContent> = {} as Record<Language, LocalizedContent>
  
  for (const lang of request.targetLanguages) {
    localizedContent[lang] = {
      language: lang,
      title: `[${lang.toUpperCase()}] ${request.sourceTitle}`,
      summary: `[${lang.toUpperCase()}] Mock summary for: ${request.sourceContent.substring(0, 100)}...`,
      content: `[${lang.toUpperCase()}] Mock content generated from source.\n\nOriginal: ${request.sourceContent}`,
      hashtags: [`#${lang}`, '#mock', '#test'],
      glossaryTermsUsed: [],
      readabilityScore: 75,
      seoScore: 80
    }
  }
  
  return {
    success: true,
    localizedContent
  }
}

/**
 * Validate content quality
 */
export function validateContentQuality(content: LocalizedContent): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!content.title || content.title.length < 10) {
    issues.push('Title too short')
  }
  
  if (!content.summary || content.summary.length < 50) {
    issues.push('Summary too short')
  }
  
  if (!content.content || content.content.length < 100) {
    issues.push('Content too short')
  }
  
  if (content.readabilityScore < 60) {
    issues.push('Readability score too low')
  }
  
  if (content.seoScore < 60) {
    issues.push('SEO score too low')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
