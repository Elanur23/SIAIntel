/**
 * AI Workspace Translation System
 * Translates content to 9 languages using Groq API via direct fetch
 */

export type SupportedLanguage = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export interface WorkspaceContent {
  title: string
  summary: string
  content: string
  siaInsight: string
  riskShield: string
  socialSnippet: string
  imageUrl?: string
}

export interface MultilingualWorkspace {
  en: WorkspaceContent
  tr: WorkspaceContent
  de: WorkspaceContent
  fr: WorkspaceContent
  es: WorkspaceContent
  ru: WorkspaceContent
  ar: WorkspaceContent
  jp: WorkspaceContent
  zh: WorkspaceContent
  category: string
  verification: string
  sentiment: string
}

const LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: 'English - Professional financial journalism style (Bloomberg/Reuters)',
  tr: 'Turkish - Formal business Turkish with accurate financial terminology',
  de: 'German - Formal business German with precise technical terms',
  fr: 'French - Formal business French with AMF-compliant language',
  es: 'Spanish - Professional Latin American Spanish with clear financial terminology',
  ru: 'Russian - Formal business Russian with accurate financial terms',
  ar: 'Arabic - Modern Standard Arabic (RTL) with natural flow and Islamic finance awareness',
  jp: 'Japanese - Natural Japanese with proper honorifics and financial terminology',
  zh: 'Chinese - Simplified Chinese with natural flow and financial terminology',
}

/**
 * Translate content to target language using Groq direct fetch
 */
async function translateContent(
  content: WorkspaceContent,
  targetLang: SupportedLanguage
): Promise<WorkspaceContent> {
  const instruction = LANGUAGE_INSTRUCTIONS[targetLang]

  const prompt = `You are a professional financial translator. Translate the following content to ${instruction}.

IMPORTANT RULES:
1. Maintain professional financial journalism tone
2. Keep technical terms accurate
3. Preserve the meaning and impact
4. Use natural language flow for the target language
5. For Arabic: Use proper RTL text with natural Arabic flow
6. For Japanese: Use appropriate honorifics and natural Japanese
7. For Chinese: Use Simplified Chinese characters
8. Keep the same structure and formatting
9. Translate "SIA" references naturally but keep brand name
10. Maintain urgency and professional tone

SOURCE CONTENT (English):

Title: ${content.title}

Summary: ${content.summary}

Content: ${content.content}

SIA Insight: ${content.siaInsight}

Risk Shield: ${content.riskShield}

Social Snippet: ${content.socialSnippet}

---

Respond ONLY with valid JSON in this exact format:
{
  "title": "translated title",
  "summary": "translated summary",
  "content": "translated content",
  "siaInsight": "translated insight",
  "riskShield": "translated risk shield",
  "socialSnippet": "translated social snippet"
}`

  const apiKey = process.env.GROQ_API_KEY || ''
  if (!apiKey) throw new Error('GROQ_API_KEY is missing')

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial translator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Groq API error: ${response.status} ${JSON.stringify(errorData)}`)
    }

    const completion = await response.json()
    const responseText = completion.choices[0]?.message?.content || '{}'
    const translated = JSON.parse(responseText)

    return {
      title: translated.title || content.title,
      summary: translated.summary || content.summary,
      content: translated.content || content.content,
      siaInsight: translated.siaInsight || content.siaInsight,
      riskShield: translated.riskShield || content.riskShield,
      socialSnippet: translated.socialSnippet || content.socialSnippet,
      imageUrl: content.imageUrl,
    }
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error)
    throw new Error(`Failed to translate to ${targetLang}: ${(error as Error).message}`)
  }
}

/**
 * Translate workspace to all languages
 */
export async function translateWorkspace(
  englishContent: WorkspaceContent,
  existingTranslations?: Partial<Record<SupportedLanguage, WorkspaceContent>>,
  category: string = 'GENERAL',
  verification: string = 'VERIFIED',
  sentiment: string = 'NEUTRAL'
): Promise<MultilingualWorkspace> {
  console.log('🌍 Starting multilingual translation...')

  const targetLanguages: SupportedLanguage[] = ['tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

  const translations: Partial<Record<SupportedLanguage, WorkspaceContent>> = {
    en: englishContent,
    ...existingTranslations,
  }

  // Translate to each language
  for (const lang of targetLanguages) {
    // Skip if translation already exists
    if (translations[lang]) {
      console.log(`  ✓ ${lang.toUpperCase()}: Using existing translation`)
      continue
    }

    try {
      console.log(`  🔄 ${lang.toUpperCase()}: Translating...`)
      const translated = await translateContent(englishContent, lang)
      translations[lang] = translated
      console.log(`  ✅ ${lang.toUpperCase()}: Translation complete`)

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`  ❌ ${lang.toUpperCase()}: Translation failed`, error)
      // Use English as fallback
      translations[lang] = englishContent
    }
  }

  console.log('✨ Multilingual translation complete!\n')

  return {
    en: translations.en!,
    tr: translations.tr!,
    de: translations.de!,
    fr: translations.fr!,
    es: translations.es!,
    ru: translations.ru!,
    ar: translations.ar!,
    jp: translations.jp!,
    zh: translations.zh!,
    category,
    verification,
    sentiment,
  }
}

/**
 * Update ai_workspace.json with new translations
 */
export async function updateWorkspaceFile(
  workspace: MultilingualWorkspace,
  filePath: string = './ai_workspace.json'
): Promise<void> {
  const fs = await import('fs/promises')

  try {
    await fs.writeFile(filePath, JSON.stringify(workspace, null, 2), 'utf-8')
    console.log(`✅ Workspace file updated: ${filePath}`)
  } catch (error) {
    console.error('Failed to update workspace file:', error)
    throw error
  }
}

/**
 * Read existing workspace file
 */
export async function readWorkspaceFile(
  filePath: string = './ai_workspace.json'
): Promise<Partial<MultilingualWorkspace>> {
  const fs = await import('fs/promises')

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to read workspace file:', error)
    return {}
  }
}

/**
 * Translate and update workspace file
 */
export async function translateAndUpdateWorkspace(
  filePath: string = './ai_workspace.json'
): Promise<MultilingualWorkspace> {
  console.log('📖 Reading existing workspace...')
  const existing = await readWorkspaceFile(filePath)

  if (!existing.en) {
    throw new Error('English content is required in workspace file')
  }

  console.log('🔄 Translating to all languages...')
  const translated = await translateWorkspace(
    existing.en,
    {
      tr: existing.tr,
      de: existing.de,
      fr: existing.fr,
      es: existing.es,
      ru: existing.ru,
      ar: existing.ar,
      jp: existing.jp,
      zh: existing.zh,
    },
    existing.category || 'GENERAL',
    existing.verification || 'VERIFIED',
    existing.sentiment || 'NEUTRAL'
  )

  console.log('💾 Updating workspace file...')
  await updateWorkspaceFile(translated, filePath)

  return translated
}
