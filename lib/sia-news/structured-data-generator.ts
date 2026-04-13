/**
 * SIA SEO Structured Data Generator
 * 
 * Generates Google-optimized JSON-LD (Schema.org) structured data
 * for each published article to maximize search visibility and authority.
 * 
 * Key Features:
 * - NewsArticle / FinancialAnalysis schema types
 * - Regional entity embedding (VARA, BaFin, SEC, etc.)
 * - Hreflang-compliant multilingual support
 * - E-E-A-T signal optimization
 * - Local expert positioning
 */

import type { GeneratedArticle, Language, Region } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface StructuredDataSchema {
  '@context': 'https://schema.org'
  '@type': string | string[]
  '@id': string
  headline: string
  alternativeHeadline?: string
  description: string
  articleBody: string
  datePublished: string
  dateModified: string
  author: AuthorSchema
  publisher: PublisherSchema
  mainEntityOfPage: MainEntitySchema
  image?: ImageSchema
  keywords?: string[]
  articleSection?: string
  inLanguage: string
  about?: AboutSchema[]
  mentions?: MentionSchema[]
  speakable?: SpeakableSchema
  isAccessibleForFree: boolean
  hasPart?: DefinedTermSchema[]
}

export interface AuthorSchema {
  '@type': 'Organization' | 'Person'
  name: string
  url?: string
  sameAs?: string[]
  description?: string
}

export interface PublisherSchema {
  '@type': 'Organization'
  name: string
  url: string
  logo: {
    '@type': 'ImageObject'
    url: string
    width: number
    height: number
  }
  sameAs?: string[]
}

export interface MainEntitySchema {
  '@type': 'WebPage'
  '@id': string
  url: string
  inLanguage: string
  isPartOf: {
    '@type': 'WebSite'
    '@id': string
    url: string
    name: string
  }
}

export interface ImageSchema {
  '@type': 'ImageObject'
  url: string
  width: number
  height: number
  caption?: string
}

export interface AboutSchema {
  '@type': 'Thing' | 'Organization' | 'FinancialProduct'
  name: string
  description?: string
  sameAs?: string
}

export interface MentionSchema {
  '@type': 'Thing' | 'Organization'
  name: string
  url?: string
}

export interface SpeakableSchema {
  '@type': 'SpeakableSpecification'
  cssSelector: string[]
}

export interface DefinedTermSchema {
  '@type': 'DefinedTerm'
  name: string
  description: string
  inDefinedTermSet?: string
}

// ============================================================================
// REGIONAL REGULATORY ENTITIES
// ============================================================================

/**
 * Regional regulatory bodies and financial entities
 * These are embedded as "mentions" to signal local expertise
 */
const REGIONAL_ENTITIES: Record<Region, Array<{ name: string; url?: string; type: string }>> = {
  TR: [
    { name: 'TCMB', url: 'https://www.tcmb.gov.tr', type: 'Central Bank' },
    { name: 'KVKK', url: 'https://www.kvkk.gov.tr', type: 'Data Protection Authority' },
    { name: 'SPK', url: 'https://www.spk.gov.tr', type: 'Capital Markets Board' }
  ],
  US: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov', type: 'Central Bank' },
    { name: 'SEC', url: 'https://www.sec.gov', type: 'Securities Regulator' },
    { name: 'FINRA', url: 'https://www.finra.org', type: 'Financial Regulator' }
  ],
  DE: [
    { name: 'BaFin', url: 'https://www.bafin.de', type: 'Financial Regulator' },
    { name: 'Bundesbank', url: 'https://www.bundesbank.de', type: 'Central Bank' },
    { name: 'EZB', url: 'https://www.ecb.europa.eu', type: 'European Central Bank' }
  ],
  FR: [
    { name: 'AMF', url: 'https://www.amf-france.org', type: 'Financial Regulator' },
    { name: 'Banque de France', url: 'https://www.banque-france.fr', type: 'Central Bank' },
    { name: 'BCE', url: 'https://www.ecb.europa.eu', type: 'European Central Bank' }
  ],
  ES: [
    { name: 'CNMV', url: 'https://www.cnmv.es', type: 'Securities Regulator' },
    { name: 'Banco de España', url: 'https://www.bde.es', type: 'Central Bank' },
    { name: 'BCE', url: 'https://www.ecb.europa.eu', type: 'European Central Bank' }
  ],
  RU: [
    { name: 'ЦБ РФ', url: 'https://www.cbr.ru', type: 'Central Bank' },
    { name: 'CBR', url: 'https://www.cbr.ru', type: 'Central Bank of Russia' },
    { name: 'Минфин', url: 'https://www.minfin.ru', type: 'Ministry of Finance' }
  ],
  AE: [
    { name: 'VARA', url: 'https://www.vara.ae', type: 'Virtual Assets Regulator' },
    { name: 'DFSA', url: 'https://www.dfsa.ae', type: 'Dubai Financial Services Authority' },
    { name: 'CBUAE', url: 'https://www.centralbank.ae', type: 'Central Bank of UAE' }
  ],
  JP: [
    { name: 'FSA', url: 'https://www.fsa.go.jp', type: 'Financial Services Agency' },
    { name: 'BoJ', url: 'https://www.boj.or.jp', type: 'Central Bank' },
    { name: 'JFSA', url: 'https://www.fsa.go.jp', type: 'Securities Regulator' }
  ],
  CN: [
    { name: 'PBOC', url: 'https://www.pbc.gov.cn', type: 'Central Bank' },
    { name: 'CSRC', url: 'https://www.csrc.gov.cn', type: 'Securities Regulator' },
    { name: 'CBIRC', url: 'https://www.cbirc.gov.cn', type: 'Banking Regulator' }
  ]
}

// ============================================================================
// SCHEMA TYPE DETERMINATION
// ============================================================================

/**
 * Determine appropriate schema type based on content
 */
export function determineSchemaType(article: GeneratedArticle, isLiveBlog: boolean = false): string[] {
  // If it's a live blog, use LiveBlogPosting exclusively
  if (isLiveBlog) {
    return ['LiveBlogPosting']
  }
  
  const types: string[] = ['NewsArticle']
  
  // Add FinancialAnalysis if content contains financial analysis
  const hasFinancialAnalysis = 
    article.siaInsight.toLowerCase().includes('analysis') ||
    article.entities.some(e => e.primaryName.toLowerCase().includes('bitcoin') || 
                              e.primaryName.toLowerCase().includes('crypto'))
  
  if (hasFinancialAnalysis) {
    types.push('AnalysisNewsArticle')
  }
  
  return types
}

// ============================================================================
// AUTHOR SCHEMA GENERATION
// ============================================================================

/**
 * Generate author schema with verified entity status
 */
export function generateAuthorSchema(language: Language): AuthorSchema {
  const authorNames: Record<Language, string> = {
    tr: 'SIA Otonom Analist',
    en: 'SIA Autonomous Analyst',
    de: 'SIA Autonomer Analyst',
    fr: 'SIA Analyste Autonome',
    es: 'SIA Analista Autónomo',
    ru: 'SIA Автономный Аналитик',
    ar: 'محلل SIA المستقل',
    jp: 'SIA自律アナリスト',
    zh: 'SIA自主分析师'
  }

  const descriptions: Record<Language, string> = {
    tr: 'Yapay zeka destekli finansal analiz sistemi - Gerçek zamanlı piyasa verileri ve zincir üstü analiz',
    en: 'AI-powered financial analysis system - Real-time market data and on-chain analysis',
    de: 'KI-gestütztes Finanzanalysesystem - Echtzeit-Marktdaten und On-Chain-Analyse',
    fr: 'Système d\'analyse financière alimenté par l\'IA - Données de marché en temps réel et analyse on-chain',
    es: 'Sistema de análisis financiero impulsado por IA - Datos de mercado en tiempo real y análisis on-chain',
    ru: 'Система финансового анализа на базе ИИ - Данные рынка в реальном времени и он-чейн анализ',
    ar: 'نظام تحليل مالي مدعوم بالذكاء الاصطناعي - بيانات السوق في الوقت الفعلي والتحليل على السلسلة',
    jp: 'AI駆動の金融分析システム - リアルタイム市場データとオンチェーン分析',
    zh: 'AI驱动的金融分析系统 - 实时市场数据和链上分析'
  }
  
  return {
    '@type': 'Organization',
    name: authorNames[language],
    url: 'https://siaintel.com/about',
    sameAs: [
      'https://twitter.com/siaintel',
      'https://linkedin.com/company/siaintel'
    ],
    description: descriptions[language]
  }
}

// ============================================================================
// PUBLISHER SCHEMA GENERATION
// ============================================================================

/**
 * Generate publisher schema with authority signals
 */
export function generatePublisherSchema(): PublisherSchema {
  return {
    '@type': 'Organization',
    name: 'SIAINTEL',
    url: 'https://siaintel.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://siaintel.com/logo.png',
      width: 600,
      height: 60
    },
    sameAs: [
      'https://twitter.com/siaintel',
      'https://linkedin.com/company/siaintel',
      'https://github.com/siaintel'
    ]
  }
}

// ============================================================================
// MAIN ENTITY SCHEMA GENERATION
// ============================================================================

/**
 * Generate mainEntityOfPage with hreflang compliance
 */
export function generateMainEntitySchema(
  article: GeneratedArticle,
  slug: string
): MainEntitySchema {
  const baseUrl = 'https://siaintel.com'
  const articleUrl = `${baseUrl}/${article.language}/news/${slug}`
  
  return {
    '@type': 'WebPage',
    '@id': articleUrl,
    url: articleUrl,
    inLanguage: article.language,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'SIAINTEL'
    }
  }
}

// ============================================================================
// ABOUT SCHEMA GENERATION
// ============================================================================

/**
 * Generate "about" entities from article entities
 */
export function generateAboutSchema(article: GeneratedArticle): AboutSchema[] {
  return article.entities.slice(0, 5).map(entity => ({
    '@type': entity.category === 'CRYPTOCURRENCY' ? 'FinancialProduct' : 
             entity.category === 'CENTRAL_BANK' ? 'Organization' : 'Thing',
    name: entity.primaryName,
    description: entity.definitions[article.language] || undefined,
    sameAs: entity.primaryName.toLowerCase().includes('bitcoin') ? 
            'https://en.wikipedia.org/wiki/Bitcoin' : undefined
  }))
}

// ============================================================================
// MENTIONS SCHEMA GENERATION
// ============================================================================

/**
 * Generate "mentions" with regional regulatory entities
 * This signals to Google that we're a local expert
 */
export function generateMentionsSchema(
  article: GeneratedArticle,
  region: Region
): MentionSchema[] {
  const mentions: MentionSchema[] = []
  
  // Add regional regulatory entities
  const regionalEntities = REGIONAL_ENTITIES[region] || []
  
  regionalEntities.forEach(entity => {
    // Check if entity is mentioned in content
    const isMentioned = article.fullContent.includes(entity.name)
    
    if (isMentioned) {
      mentions.push({
        '@type': 'Organization',
        name: entity.name,
        url: entity.url
      })
    }
  })
  
  // Add article entities as mentions
  article.entities.slice(0, 3).forEach(entity => {
    mentions.push({
      '@type': 'Thing',
      name: entity.primaryName
    })
  })
  
  return mentions
}

// ============================================================================
// DEFINED TERMS SCHEMA GENERATION
// ============================================================================

/**
 * Generate DefinedTerm schema from technical glossary
 */
export function generateDefinedTermsSchema(article: GeneratedArticle): DefinedTermSchema[] {
  return article.technicalGlossary.map(entry => ({
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.definition,
    inDefinedTermSet: 'Financial & Cryptocurrency Terminology'
  }))
}

// ============================================================================
// SPEAKABLE SCHEMA GENERATION
// ============================================================================

/**
 * Generate Speakable schema for voice search optimization
 * Includes audio transcript ID for Google Assistant integration
 */
export function generateSpeakableSchema(articleId?: string): SpeakableSchema {
  const selectors = [
    '.article-summary',
    '.sia-insight',
    '.technical-glossary'
  ]
  
  // Add audio transcript ID if provided
  if (articleId) {
    selectors.unshift(`#sia-audio-transcript-${articleId}`)
  }
  
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: selectors
  }
}

// ============================================================================
// MAIN STRUCTURED DATA GENERATION
// ============================================================================

/**
 * Generate complete JSON-LD structured data for article
 */
export function generateStructuredData(
  article: GeneratedArticle,
  slug: string,
  options?: {
    isLiveBlog?: boolean
  }
): StructuredDataSchema {
  const schemaTypes = determineSchemaType(article, options?.isLiveBlog)
  const author = generateAuthorSchema(article.language)
  const publisher = generatePublisherSchema()
  const mainEntity = generateMainEntitySchema(article, slug)
  const about = generateAboutSchema(article)
  const mentions = generateMentionsSchema(article, article.region)
  const definedTerms = generateDefinedTermsSchema(article)
  const speakable = generateSpeakableSchema(article.id)
  
  // Extract keywords from entities and technical terms
  const keywords = [
    ...article.entities.map(e => e.primaryName),
    ...article.technicalGlossary.map(t => t.term)
  ].slice(0, 10)
  
  // Determine article section
  const articleSection = article.entities.some(e => 
    e.primaryName.toLowerCase().includes('bitcoin') || 
    e.primaryName.toLowerCase().includes('crypto')
  ) ? 'Cryptocurrency' : 'Financial Markets'
  
  const schema: StructuredDataSchema = {
    '@context': 'https://schema.org',
    '@type': schemaTypes.length > 1 ? schemaTypes : schemaTypes[0],
    '@id': mainEntity['@id'],
    headline: article.headline,
    alternativeHeadline: article.summary.substring(0, 110),
    description: article.summary,
    articleBody: article.fullContent,
    datePublished: article.metadata.generatedAt,
    dateModified: article.metadata.generatedAt,
    author,
    publisher,
    mainEntityOfPage: mainEntity,
    keywords,
    articleSection,
    inLanguage: article.language,
    about,
    mentions,
    speakable,
    isAccessibleForFree: true,
    hasPart: definedTerms
  }
  
  return schema
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate structured data schema
 */
export interface SchemaValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100
}

export function validateStructuredData(schema: StructuredDataSchema): SchemaValidation {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100
  
  // Required fields validation
  if (!schema['@context']) {
    errors.push('Missing @context')
    score -= 20
  }
  
  if (!schema['@type']) {
    errors.push('Missing @type')
    score -= 20
  }
  
  if (!schema.headline || schema.headline.length < 10) {
    errors.push('Headline too short or missing')
    score -= 15
  }
  
  if (!schema.description || schema.description.length < 50) {
    errors.push('Description too short or missing')
    score -= 15
  }
  
  if (!schema.author) {
    errors.push('Missing author')
    score -= 10
  }
  
  if (!schema.publisher) {
    errors.push('Missing publisher')
    score -= 10
  }
  
  // Warnings for optional but recommended fields
  if (!schema.image) {
    warnings.push('Missing image (recommended for rich results)')
    score -= 5
  }
  
  if (!schema.keywords || schema.keywords.length === 0) {
    warnings.push('Missing keywords (recommended for SEO)')
    score -= 5
  }
  
  if (!schema.about || schema.about.length === 0) {
    warnings.push('Missing "about" entities (recommended for topic authority)')
    score -= 5
  }
  
  if (!schema.mentions || schema.mentions.length === 0) {
    warnings.push('Missing "mentions" (recommended for local expertise signal)')
    score -= 5
  }
  
  if (!schema.hasPart || schema.hasPart.length === 0) {
    warnings.push('Missing defined terms (recommended for featured snippets)')
    score -= 5
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score)
  }
}

// ============================================================================
// SCHEMA INJECTION
// ============================================================================

/**
 * Generate HTML script tag for schema injection
 */
export function generateSchemaScriptTag(schema: StructuredDataSchema): string {
  const jsonString = JSON.stringify(schema, null, 2)
  return `<script type="application/ld+json">\n${jsonString}\n</script>`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate URL-friendly slug from headline
 */
export function generateSlug(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

/**
 * Extract regional entities mentioned in content
 */
export function extractMentionedRegionalEntities(
  content: string,
  region: Region
): string[] {
  const regionalEntities = REGIONAL_ENTITIES[region] || []
  const mentioned: string[] = []
  
  regionalEntities.forEach(entity => {
    if (content.includes(entity.name)) {
      mentioned.push(entity.name)
    }
  })
  
  return mentioned
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate structured data for multiple articles
 */
export async function generateBatchStructuredData(
  articles: GeneratedArticle[]
): Promise<Map<string, StructuredDataSchema>> {
  const schemas = new Map<string, StructuredDataSchema>()
  
  for (const article of articles) {
    const slug = generateSlug(article.headline)
    const schema = generateStructuredData(article, slug)
    schemas.set(article.id, schema)
  }
  
  return schemas
}

// ============================================================================
// SCHEMA COMPARISON
// ============================================================================

/**
 * Compare schema quality across multiple articles
 */
export interface SchemaComparison {
  totalArticles: number
  averageScore: number
  bestPerformer: {
    articleId: string
    score: number
  }
  commonIssues: string[]
  recommendations: string[]
}

export function compareSchemas(
  validations: Map<string, SchemaValidation>
): SchemaComparison {
  const scores = Array.from(validations.values()).map(v => v.score)
  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
  
  // Find best performer
  let bestScore = 0
  let bestArticleId = ''
  
  validations.forEach((validation, articleId) => {
    if (validation.score > bestScore) {
      bestScore = validation.score
      bestArticleId = articleId
    }
  })
  
  // Collect common issues
  const issueCount = new Map<string, number>()
  
  validations.forEach(validation => {
    [...validation.errors, ...validation.warnings].forEach(issue => {
      issueCount.set(issue, (issueCount.get(issue) || 0) + 1)
    })
  })
  
  const commonIssues = Array.from(issueCount.entries())
    .filter(([_, count]) => count > validations.size * 0.3) // Issues in >30% of articles
    .map(([issue]) => issue)
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (averageScore < 90) {
    recommendations.push('Improve schema completeness by adding all recommended fields')
  }
  
  if (commonIssues.some(i => i.includes('image'))) {
    recommendations.push('Add featured images to all articles for rich results')
  }
  
  if (commonIssues.some(i => i.includes('mentions'))) {
    recommendations.push('Include more regional regulatory entity mentions for local expertise')
  }
  
  return {
    totalArticles: validations.size,
    averageScore: Math.round(averageScore),
    bestPerformer: {
      articleId: bestArticleId,
      score: bestScore
    },
    commonIssues,
    recommendations
  }
}
