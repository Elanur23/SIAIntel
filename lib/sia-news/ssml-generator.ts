/**
 * SIA Voice Supreme Director - SSML Generator
 * 
 * Converts financial analysis articles into professional broadcast-quality
 * SSML (Speech Synthesis Markup Language) for text-to-speech systems.
 * 
 * Features:
 * - Professional news studio voice quality
 * - Authority tone with prosody control
 * - Emphasis on key data points and entities
 * - Natural breathing pauses
 * - Multilingual support (7 languages)
 * - Voice character customization
 */

import type { GeneratedArticle, Language } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface SSMLConfig {
  voiceGender: 'male' | 'female' | 'neutral'
  voiceAge: 'young' | 'middle' | 'senior'
  speakingRate: number // 0.5 - 2.0 (1.0 = normal)
  pitch: string // e.g., "-5%", "+10%"
  volume: string // e.g., "medium", "loud", "soft"
  language: Language
}

export interface SSMLOutput {
  ssml: string
  plainText: string
  estimatedDuration: number // in seconds
  wordCount: number
  characterCount: number
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_CONFIG: SSMLConfig = {
  voiceGender: 'neutral',
  voiceAge: 'middle',
  speakingRate: 0.9, // Slightly slower for authority
  pitch: '-5%', // Slightly deeper for credibility
  volume: 'medium',
  language: 'en'
}

// Voice configurations by language (Google Cloud TTS voice names)
const VOICE_CONFIGS: Record<Language, Partial<SSMLConfig>> = {
  en: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-5%' }, // en-US-Studio-O (Wall Street tone)
  tr: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-3%' }, // tr-TR-Wavenet-D (Financial terms clarity)
  de: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-5%' }, // de-DE-Wavenet-F
  fr: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-4%' }, // fr-FR-Wavenet-E
  es: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-3%' }, // es-ES-Wavenet-C
  ru: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-6%' }, // ru-RU-Wavenet-D
  ar: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-4%' }, // ar-XA-Wavenet-B (Gulf financial authority)
  jp: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-4%' }, // ja-JP-Wavenet-B
  zh: { voiceGender: 'neutral', voiceAge: 'middle', pitch: '-3%' }  // zh-CN-Wavenet-C
}

// Google Cloud TTS voice names by language
export const GOOGLE_VOICE_NAMES: Record<Language, string> = {
  en: 'en-US-Studio-O',      // Wall Street broadcaster tone
  tr: 'tr-TR-Wavenet-D',     // Turkish financial clarity
  de: 'de-DE-Wavenet-F',     // German authority
  fr: 'fr-FR-Wavenet-E',     // French professional
  es: 'es-ES-Wavenet-C',     // Spanish clarity
  ru: 'ru-RU-Wavenet-D',     // Russian depth
  ar: 'ar-XA-Wavenet-B',     // Gulf financial center authority
  jp: 'ja-JP-Wavenet-B',     // Japanese professional
  zh: 'zh-CN-Wavenet-C'      // Mandarin clarity
}

// ============================================================================
// MAIN SSML GENERATION
// ============================================================================

/**
 * Generate SSML from article
 * 
 * @param article - Generated article
 * @param config - SSML configuration (optional)
 * @returns SSML output with metadata
 */
export function generateSSML(
  article: GeneratedArticle,
  config?: Partial<SSMLConfig>
): SSMLOutput {
  // Merge configurations
  const finalConfig: SSMLConfig = {
    ...DEFAULT_CONFIG,
    ...VOICE_CONFIGS[article.language],
    ...config,
    language: article.language
  }
  
  // Build SSML document
  const ssml = buildSSMLDocument(article, finalConfig)
  
  // Extract plain text (without SSML tags)
  const plainText = extractPlainText(ssml)
  
  // Calculate metadata
  const wordCount = plainText.split(/\s+/).length
  const characterCount = plainText.length
  const estimatedDuration = calculateDuration(wordCount, finalConfig.speakingRate)
  
  return {
    ssml,
    plainText,
    estimatedDuration,
    wordCount,
    characterCount
  }
}

/**
 * Build complete SSML document
 */
function buildSSMLDocument(article: GeneratedArticle, config: SSMLConfig): string {
  const parts: string[] = []
  
  // SSML document start
  parts.push('<speak>')
  
  // SFX: Intro jingle description
  parts.push('[SIA_INTRO_SFX]')
  parts.push(`<break time="500ms"/>`)
  
  // Opening (SIA Global Intelligence Report)
  parts.push(generateOpening(config.language))
  parts.push(`<break time="1000ms"/>`)
  
  // Headline with emphasis
  parts.push(generateHeadline(article.headline, config))
  parts.push(`<break time="800ms"/>`)
  
  // Section 1: "Neden Oldu?" (Why It Happened / Causal Analysis)
  parts.push(generateSectionHeader('causal', config.language))
  parts.push(generateSummary(article.summary, config))
  parts.push(`<break time="800ms"/>`)
  
  // Section 2: "Bölgesel Etki" (Regional Impact / SIA Insight)
  parts.push(generateSectionHeader('regional', config.language))
  parts.push(generateSIAInsight(article.siaInsight, config))
  parts.push(`<break time="800ms"/>`)
  
  // Section 3: "Risk Analizi" (Risk Analysis / Risk Disclaimer)
  parts.push(generateSectionHeader('risk', config.language))
  parts.push(generateRiskDisclaimer(article.riskDisclaimer, config))
  parts.push(`<break time="1000ms"/>`)
  
  // Closing with CTA
  parts.push(generateClosing(config.language))
  
  // Document end
  parts.push('</speak>')
  
  return parts.join('\n')
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

/**
 * Generate section header (news-style announcement)
 */
function generateSectionHeader(section: 'causal' | 'regional' | 'risk', language: Language): string {
  const headers: Record<Language, Record<string, string>> = {
    en: {
      causal: 'Why It Happened',
      regional: 'Regional Impact',
      risk: 'Risk Analysis'
    },
    tr: {
      causal: 'Neden Oldu?',
      regional: 'Bölgesel Etki',
      risk: 'Risk Analizi'
    },
    de: {
      causal: 'Warum Es Geschah',
      regional: 'Regionale Auswirkungen',
      risk: 'Risikoanalyse'
    },
    fr: {
      causal: 'Pourquoi C\'est Arrivé',
      regional: 'Impact Régional',
      risk: 'Analyse des Risques'
    },
    es: {
      causal: 'Por Qué Sucedió',
      regional: 'Impacto Regional',
      risk: 'Análisis de Riesgo'
    },
    ru: {
      causal: 'Почему Это Произошло',
      regional: 'Региональное Влияние',
      risk: 'Анализ Рисков'
    },
    ar: {
      causal: 'لماذا حدث ذلك',
      regional: 'التأثير الإقليمي',
      risk: 'تحليل المخاطر'
    },
    jp: {
      causal: 'なぜ起きたか',
      regional: '地域への影響',
      risk: 'リスク分析'
    },
    zh: {
      causal: '原因分析',
      regional: '区域影响',
      risk: '风险分析'
    }
  }
  
  return `<prosody rate="95%" pitch="-3%" volume="loud">
<emphasis level="strong">${escapeXML(headers[language][section])}</emphasis>
<break time="600ms"/>
</prosody>`
}

/**
 * Generate opening (SIA Global Intelligence Report intro)
 */
function generateOpening(language: Language): string {
  const intros: Record<Language, string> = {
    en: 'SIA Global Intelligence Report Presents',
    tr: 'SIA Global İstihbarat Raporu Sunar',
    de: 'SIA Global Intelligence-Bericht Präsentiert',
    fr: 'SIA Global Rapport d\'Intelligence Présente',
    es: 'SIA Global Informe de Inteligencia Presenta',
    ru: 'SIA Global Отчет Разведки Представляет',
    ar: 'تقرير SIA العالمي للاستخبارات يقدم',
    jp: 'SIAグローバルインテリジェンスレポート',
    zh: 'SIA全球情报报告'
  }
  
  return `<prosody rate="95%" pitch="-3%">
<emphasis level="strong">${escapeXML(intros[language])}</emphasis>
</prosody>`
}

/**
 * Generate headline with strong emphasis
 */
function generateHeadline(headline: string, config: SSMLConfig): string {
  return `<prosody rate="90%" pitch="${config.pitch}" volume="loud">
<emphasis level="strong">${escapeXML(headline)}</emphasis>
</prosody>`
}

/**
 * Generate summary (ÖZET) - Layer 1
 */
function generateSummary(summary: string, config: SSMLConfig): string {
  const sentences = summary.split(/(?<=[.!?])\s+/)
  
  const ssmlSentences = sentences.map(sentence => {
    const emphasized = emphasizeNumbers(sentence)
    return `${emphasized}<break time="300ms"/>`
  }).join('\n')
  
  return `<prosody rate="${config.speakingRate * 100}%" pitch="${config.pitch}">
${ssmlSentences}
</prosody>`
}

/**
 * Generate SIA Insight - Layer 2 (with authority tone)
 */
function generateSIAInsight(siaInsight: string, config: SSMLConfig): string {
  const sentences = siaInsight.split(/(?<=[.!?])\s+/)
  
  const ssmlSentences = sentences.map(sentence => {
    let emphasized = sentence
    
    emphasized = emphasized.replace(
      /(SIA_SENTINEL|SIA SENTINEL|proprietary analysis|özel analiz|proprietäre Analyse|analyse propriétaire|análisis propietario|проприетарный анализ|تحليل خاص)/gi,
      '<emphasis level="strong">$1</emphasis>'
    )
    
    emphasized = emphasizeNumbers(emphasized)
    emphasized = emphasizeEntities(emphasized)
    
    return `${emphasized}<break time="300ms"/>`
  }).join('\n')
  
  return `<prosody rate="90%" pitch="-5%" volume="medium">
${ssmlSentences}
</prosody>`
}

/**
 * Generate technical glossary
 */
function generateTechnicalGlossary(
  glossary: Array<{ term: string; definition: string }>,
  _config: SSMLConfig
): string {
  const terms = glossary.slice(0, 3).map(entry => {
    return `<emphasis level="moderate">${escapeXML(entry.term)}</emphasis>: ${escapeXML(entry.definition)}<break time="500ms"/>`
  }).join('\n')
  
  return terms
}

/**
 * Generate risk disclaimer - Layer 3
 */
function generateRiskDisclaimer(riskDisclaimer: string, config: SSMLConfig): string {
  const sentences = riskDisclaimer.split(/(?<=[.!?])\s+/)
  
  const ssmlSentences = sentences.map(sentence => {
    let emphasized = sentence.replace(
      /(RISK ASSESSMENT|RİSK DEĞERLENDİRMESİ|RISIKOBEWERTUNG|ÉVALUATION DES RISQUES|EVALUACIÓN DE RIESGOS|ОЦЕНКА РИСКОВ|تقييم المخاطر)/gi,
      '<emphasis level="strong">$1</emphasis>'
    )
    
    emphasized = emphasizeNumbers(emphasized)
    
    return `${emphasized}<break time="300ms"/>`
  }).join('\n')
  
  return `<prosody rate="85%" pitch="${config.pitch}" volume="soft">
${ssmlSentences}
</prosody>`
}

/**
 * Generate closing with CTA
 */
function generateClosing(language: Language): string {
  const closings: Record<Language, string> = {
    en: 'For deeper analysis, visit siaintel.com. SIAINTEL: Knowledge is Sovereignty.',
    tr: 'Daha fazla derinlik için siaintel.com\'u ziyaret edin. SIAINTEL: Bilgi Egemenliktir.',
    de: 'Für tiefere Analysen besuchen Sie siaintel.com. SIAINTEL: Wissen ist Souveränität.',
    fr: 'Pour une analyse plus approfondie, visitez siaintel.com. SIAINTEL: La Connaissance est Souveraineté.',
    es: 'Para un análisis más profundo, visite siaintel.com. SIAINTEL: El Conocimiento es Soberanía.',
    ru: 'Для более глубокого анализа посетите siaintel.com. SIAINTEL: Знание - это Суверенитет.',
    ar: 'لمزيد من التحليل المتعمق، قم بزيارة siaintel.com. SIAINTEL: المعرفة هي السيادة.',
    jp: '詳細はsiaintel.comをご覧ください。SIAINTEL: 知は主権です。',
    zh: '深度分析请访问 siaintel.com。SIAINTEL：知识即主权。'
  }
  
  return `<prosody rate="95%" pitch="-3%">
${escapeXML(closings[language])}
</prosody>`
}

// ============================================================================
// EMPHASIS HELPERS
// ============================================================================

/**
 * Emphasize numbers and percentages
 */
function emphasizeNumbers(text: string): string {
  // Emphasize percentages (e.g., "8%", "+20%", "-15%")
  text = text.replace(
    /([+-]?\d+(?:\.\d+)?%)/g,
    '<emphasis level="strong">$1</emphasis>'
  )
  
  // Emphasize large numbers with commas/periods (e.g., "12,450", "2.3B")
  text = text.replace(
    /(\d{1,3}(?:[,\.]\d{3})+(?:\.\d+)?[BMK]?)/g,
    '<emphasis level="moderate">$1</emphasis>'
  )
  
  // Emphasize dollar amounts (e.g., "$67,500", "$2.3B")
  text = text.replace(
    /(\$\d+(?:[,\.]\d+)*(?:\.\d+)?[BMK]?)/g,
    '<emphasis level="strong">$1</emphasis>'
  )
  
  return text
}

/**
 * Emphasize regulatory entities and institutions
 */
function emphasizeEntities(text: string): string {
  const entities = [
    'SEC', 'FINRA', 'Federal Reserve', 'VARA', 'DFSA', 'CBUAE',
    'BaFin', 'Bundesbank', 'EZB', 'AMF', 'Banque de France', 'BCE',
    'CNMV', 'Banco de España', 'CBR', 'ЦБ РФ', 'Минфин',
    'TCMB', 'KVKK', 'SPK', 'Bitcoin', 'BTC', 'Ethereum', 'ETH'
  ]
  
  entities.forEach(entity => {
    const regex = new RegExp(`\\b(${entity})\\b`, 'g')
    text = text.replace(regex, '<emphasis level="moderate">$1</emphasis>')
  })
  
  return text
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get language code for SSML
 */
function getLanguageCode(language: Language): string {
  const codes: Record<Language, string> = {
    en: 'en-US',
    tr: 'tr-TR',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    ru: 'ru-RU',
    ar: 'ar-AE',
    jp: 'ja-JP',
    zh: 'zh-CN'
  }
  return codes[language]
}

/**
 * Get voice name based on configuration (Google Cloud TTS)
 */
function getVoiceName(config: SSMLConfig): string {
  return GOOGLE_VOICE_NAMES[config.language]
}

/**
 * Get glossary label by language
 */
function getGlossaryLabel(language: Language): string {
  const labels: Record<Language, string> = {
    en: 'Technical Terms:',
    tr: 'Teknik Terimler:',
    de: 'Technische Begriffe:',
    fr: 'Termes Techniques:',
    es: 'Términos Técnicos:',
    ru: 'Технические Термины:',
    ar: 'المصطلحات الفنية:',
    jp: '専門用語:',
    zh: '技术术语:'
  }
  return labels[language]
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Extract plain text from SSML (remove all tags)
 */
function extractPlainText(ssml: string): string {
  return ssml
    .replace(/<[^>]+>/g, '') // Remove all XML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Calculate estimated duration in seconds
 * 
 * @param wordCount - Number of words
 * @param speakingRate - Speaking rate multiplier
 * @returns Estimated duration in seconds
 */
function calculateDuration(wordCount: number, speakingRate: number): number {
  // Average speaking rate: 150 words per minute (normal)
  // Adjusted by speakingRate multiplier
  const wordsPerMinute = 150 * speakingRate
  const minutes = wordCount / wordsPerMinute
  return Math.ceil(minutes * 60)
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate SSML for multiple articles
 * 
 * @param articles - Array of articles
 * @param config - SSML configuration (optional)
 * @returns Map of article IDs to SSML outputs
 */
export function generateBatchSSML(
  articles: GeneratedArticle[],
  config?: Partial<SSMLConfig>
): Map<string, SSMLOutput> {
  const results = new Map<string, SSMLOutput>()
  
  articles.forEach(article => {
    const ssmlOutput = generateSSML(article, config)
    results.set(article.id, ssmlOutput)
  })
  
  return results
}

// ============================================================================
// SSML VALIDATION
// ============================================================================

/**
 * Validate SSML document
 * 
 * @param ssml - SSML string
 * @returns Validation result
 */
export function validateSSML(ssml: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for required elements
  if (!ssml.includes('<speak')) {
    errors.push('Missing <speak> root element')
  }
  
  if (!ssml.includes('</speak>')) {
    errors.push('Missing </speak> closing tag')
  }
  
  // Check for balanced tags
  const openTags = ssml.match(/<(\w+)[^>]*>/g) || []
  const closeTags = ssml.match(/<\/(\w+)>/g) || []
  
  if (openTags.length !== closeTags.length) {
    warnings.push('Unbalanced tags detected')
  }
  
  // Check for proper XML escaping
  if (ssml.match(/[<>&](?![a-z]+;)/)) {
    warnings.push('Unescaped XML characters detected')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
// Types are already exported at the top of the file
