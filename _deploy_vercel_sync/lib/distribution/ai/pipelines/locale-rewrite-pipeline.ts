/**
 * Locale Rewrite Pipeline
 * Phase 3A: 9-language content rewriting
 */

import { getAIProvider } from '../provider-factory'
import { LOCALE_REWRITER_SYSTEM_PROMPT } from '../prompts/system-prompts'
import { getLocalePrompt } from '../prompts/locale-prompts'
import type { Language, LocalizedContent } from '../../types'

export interface LocaleRewriteRequest {
  sourceContent: string
  sourceLanguage: Language
  targetLanguages: Language[]
}

export interface LocaleRewriteResult {
  success: boolean
  localizedContent: Record<Language, LocalizedContent>
  errors: Record<Language, string>
}

export async function rewriteForLocales(
  request: LocaleRewriteRequest
): Promise<LocaleRewriteResult> {
  const provider = getAIProvider()
  
  if (!provider) {
    return {
      success: false,
      localizedContent: {} as Record<Language, LocalizedContent>,
      errors: { en: 'AI provider not available' } as Record<Language, string>
    }
  }

  const localizedContent: Partial<Record<Language, LocalizedContent>> = {}
  const errors: Partial<Record<Language, string>> = {}

  for (const lang of request.targetLanguages) {
    try {
      const userPrompt = getLocalePrompt(lang, request.sourceContent)
      
      const response = await provider.generate({
        systemPrompt: LOCALE_REWRITER_SYSTEM_PROMPT,
        userPrompt,
        responseFormat: 'json'
      })

      if (response.success) {
        const parsed = JSON.parse(response.content)
        localizedContent[lang] = {
          language: lang,
          title: parsed.title || '',
          summary: parsed.summary || '',
          content: parsed.content || '',
          hashtags: parsed.hashtags || [],
          glossaryTermsUsed: [],
          readabilityScore: 75,
          seoScore: 80
        }
      } else {
        errors[lang] = response.error || 'Generation failed'
      }
    } catch (error: any) {
      errors[lang] = error.message
    }
  }

  return {
    success: Object.keys(localizedContent).length > 0,
    localizedContent: localizedContent as Record<Language, LocalizedContent>,
    errors: errors as Record<Language, string>
  }
}
