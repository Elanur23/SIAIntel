/**
 * Locale-Specific Prompt Templates
 * Phase 3A: Per-language generation prompts
 */

import type { Language } from '../../types'

export function getLocalePrompt(language: Language, sourceContent: string): string {
  const localeInstructions = {
    en: 'Professional financial journalism tone, Bloomberg/Reuters style, technical but accessible',
    tr: 'Formal business Turkish, financial terminology accuracy, KVKK compliance in disclaimers',
    de: 'Formal business German, precise technical terms, BaFin-aware language',
    fr: 'Formal business French, AMF-compliant language, technical precision',
    es: 'Professional Latin American Spanish, clear financial terminology, CNMV-aware disclaimers',
    ru: 'Formal business Russian, financial terminology, professional credibility',
    ar: 'Modern Standard Arabic, right-to-left formatting, Islamic finance awareness',
    jp: 'Formal business Japanese (敬語), financial terminology, professional tone',
    zh: 'Formal business Chinese, financial terminology, mainland China standards'
  }

  return `Rewrite the following financial content for ${language.toUpperCase()} locale.

LOCALE REQUIREMENTS: ${localeInstructions[language]}

SOURCE CONTENT:
${sourceContent}

OUTPUT: JSON with { title, summary, content, hashtags }`
}
