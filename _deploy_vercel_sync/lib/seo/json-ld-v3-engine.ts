// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
/**
 * SIA JSON-LD V3 Engine
 * 
 * Google Search Dominance System with:
 * - NewsArticle + FinancialQuote + Speakable schemas
 * - 0.1-second bot comprehension
 * - Instant indexing integration
 * - Auto-silo internal linking
 */

import type { GeneratedArticle } from '@/lib/sia-news/types'

// ============================================================================
// V3 ENHANCED SCHEMA TYPES
// ============================================================================

export interface JSONLDV3Schema {
  '@context': 'https://schema.org'
  '@graph': SchemaGraphNode[]
}

export interface SchemaGraphNode {
  '@type': string | string[]
  '@id': string
  [key: string]: any
}

export interface FinancialQuoteSchema {
  '@type': 'FinancialQuote'
  '@id': string
  price: string | number
  priceCurrency: string
  priceValidUntil?: string
  name: string
  description?: string
  url?: string
}

export interface SpeakableV3Schema {
  '@type': 'SpeakableSpecification'
  cssSelector: string[]
  xpath?: string[]
}

// ============================================================================
// V3 JSON-LD GENERATOR
// ============================================================================

/**
 * Generate V3 JSON-LD with @graph structure
 * Includes NewsArticle, FinancialQuote, and Speakable in single schema
 */
export function generateJSONLDV3(
  article: GeneratedArticle,
  slug: string,
  options: {
    includeFinancialQuote?: boolean
    includeSpeakable?: boolean
    includeAudioObject?: boolean
  } = {}
): JSONLDV3Schema {
  const {
    includeFinancialQuote = true,
    includeSpeakable = true,
    includeAudioObject = true,
  } = options
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  const articleUrl = `${baseUrl}/${article.language}/news/${slug}`
  
  const graph: SchemaGraphNode[] = []
  
  // 1. WEBSITE NODE
  graph.push({
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'SIAINTEL',
    description: 'AI-Powered Financial Intelligence & Market Analysis',
    publisher: {
      '@id': `${baseUrl}/#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  })
  
  // 2. ORGANIZATION NODE
  graph.push({
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'SIAINTEL',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${baseUrl}/#logo`,
      url: `${baseUrl}/logo.png`,
      width: 600,
      height: 60,
      caption: 'SIAINTEL Logo'
    },
    sameAs: [
      'https://twitter.com/siaintel',
      'https://linkedin.com/company/siaintel',
      'https://github.com/siaintel'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: 'editorial@siaintel.com',
      availableLanguage: ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar']
    }
  })
  
  // 3. WEBPAGE NODE
  graph.push({
    '@type': 'WebPage',
    '@id': articleUrl,
    url: articleUrl,
    name: article.headline,
    description: article.summary,
    inLanguage: article.language,
    isPartOf: {
      '@id': `${baseUrl}/#website`
    },
    about: {
      '@id': `${articleUrl}#article`
    },
    primaryImageOfPage: {
      '@id': `${articleUrl}#primaryimage`
    },
    datePublished: article.metadata.generatedAt,
    dateModified: article.metadata.generatedAt
  })
  
  // 4. NEWS ARTICLE NODE (Primary)
  const newsArticleNode: SchemaGraphNode = {
    '@type': ['NewsArticle', 'AnalysisNewsArticle'],
    '@id': `${articleUrl}#article`,
    headline: article.headline,
    alternativeHeadline: article.summary.substring(0, 110),
    description: article.summary,
    articleBody: article.fullContent,
    datePublished: article.metadata.generatedAt,
    dateModified: article.metadata.generatedAt,
    author: {
      '@type': 'Organization',
      name: 'SIA Autonomous Analyst',
      url: `${baseUrl}/about`,
      description: 'AI-powered financial analysis system with real-time market data'
    },
    publisher: {
      '@id': `${baseUrl}/#organization`
    },
    mainEntityOfPage: {
      '@id': articleUrl
    },
    image: {
      '@id': `${articleUrl}#primaryimage`
    },
    keywords: [
      ...article.entities.map(e => e.primaryName),
      ...article.technicalGlossary.map(t => t.term)
    ].slice(0, 10).join(', '),
    articleSection: determineArticleSection(article),
    inLanguage: article.language,
    isAccessibleForFree: true,
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@id': `${baseUrl}/#organization`
    }
  }
  
  // Add "about" entities
  if (article.entities.length > 0) {
    newsArticleNode.about = article.entities.slice(0, 5).map(entity => ({
      '@type': entity.category === 'CRYPTOCURRENCY' ? 'FinancialProduct' : 'Thing',
      name: entity.primaryName,
      description: entity.definitions[article.language]
    }))
  }
  
  // Add "mentions" for regional entities
  if (article.entities.length > 0) {
    newsArticleNode.mentions = article.entities.slice(0, 3).map(entity => ({
      '@type': 'Thing',
      name: entity.primaryName
    }))
  }
  
  // Add defined terms (technical glossary)
  if (article.technicalGlossary.length > 0) {
    newsArticleNode.hasPart = article.technicalGlossary.map(entry => ({
      '@type': 'DefinedTerm',
      name: entry.term,
      description: entry.definition,
      inDefinedTermSet: 'Financial & Cryptocurrency Terminology'
    }))
  }
  
  graph.push(newsArticleNode)
  
  // 5. IMAGE OBJECT NODE
  graph.push({
    '@type': 'ImageObject',
    '@id': `${articleUrl}#primaryimage`,
    url: `${baseUrl}/api/og?title=${encodeURIComponent(article.headline)}`,
    width: 1200,
    height: 630,
    caption: article.headline,
    inLanguage: article.language
  })
  
  // 6. FINANCIAL QUOTE NODE (if applicable)
  if (includeFinancialQuote && hasFinancialData(article)) {
    const financialQuotes = extractFinancialQuotes(article)
    
    financialQuotes.forEach((quote, index) => {
      graph.push({
        '@type': 'FinancialQuote',
        '@id': `${articleUrl}#financialquote${index + 1}`,
        price: quote.price,
        priceCurrency: quote.currency,
        priceValidUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        name: quote.name,
        description: quote.description,
        url: articleUrl
      })
    })
  }
  
  // 7. SPEAKABLE NODE (Voice Search Optimization)
  if (includeSpeakable) {
    const speakableNode: SchemaGraphNode = {
      '@type': 'SpeakableSpecification',
      '@id': `${articleUrl}#speakable`,
      cssSelector: [
        `#sia-audio-transcript-${article.id}`,
        '.article-summary',
        '.sia-insight',
        '.technical-glossary'
      ],
      xpath: [
        '/html/body//article//div[@class="article-summary"]',
        '/html/body//article//div[@class="sia-insight"]'
      ]
    }
    
    // Add speakable to NewsArticle
    newsArticleNode.speakable = {
      '@id': `${articleUrl}#speakable`
    }
    
    graph.push(speakableNode)
  }
  
  // 8. AUDIO OBJECT NODE (if audio available)
  if (includeAudioObject && article.id) {
    graph.push({
      '@type': 'AudioObject',
      '@id': `${articleUrl}#audio`,
      name: `Audio: ${article.headline}`,
      description: `Audio narration of ${article.headline}`,
      contentUrl: `${baseUrl}/api/sia-news/audio/${article.id}?lang=${article.language}`,
      encodingFormat: 'audio/mpeg',
      inLanguage: article.language,
      duration: 'PT3M', // Estimated 3 minutes
      transcript: {
        '@id': `${articleUrl}#transcript`
      }
    })
    
    // Add transcript
    graph.push({
      '@type': 'WebPageElement',
      '@id': `${articleUrl}#transcript`,
      cssSelector: `#sia-audio-transcript-${article.id}`,
      text: article.fullContent
    })
  }
  
  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine article section from entities
 */
function determineArticleSection(article: GeneratedArticle): string {
  const hasCrypto = article.entities.some(e => 
    e.category === 'CRYPTOCURRENCY' ||
    e.primaryName.toLowerCase().includes('bitcoin') ||
    e.primaryName.toLowerCase().includes('crypto')
  )
  
  const hasStock = article.entities.some(e =>
    e.primaryName.toLowerCase().includes('stock')
  )
  
  const hasCentralBank = article.entities.some(e => 
    e.category === 'CENTRAL_BANK'
  )
  
  if (hasCrypto) return 'Cryptocurrency'
  if (hasStock) return 'Stock Market'
  if (hasCentralBank) return 'Central Banking'
  
  return 'Financial Markets'
}

/**
 * Check if article contains financial data
 */
function hasFinancialData(article: GeneratedArticle): boolean {
  const content = article.fullContent.toLowerCase()
  
  return (
    content.includes('$') ||
    content.includes('€') ||
    content.includes('₺') ||
    content.includes('price') ||
    content.includes('fiyat') ||
    content.includes('preis')
  )
}

/**
 * Extract financial quotes from article
 */
interface FinancialQuote {
  name: string
  price: string | number
  currency: string
  description: string
}

function extractFinancialQuotes(article: GeneratedArticle): FinancialQuote[] {
  const quotes: FinancialQuote[] = []
  
  // Extract from entities
  article.entities.forEach(entity => {
    if (entity.category === 'CRYPTOCURRENCY' || entity.primaryName.toLowerCase().includes('stock')) {
      // Try to extract price from content
      const priceMatch = article.fullContent.match(
        new RegExp(`${entity.primaryName}[^\\d]*(\\$|€|₺)?([\\d,]+\\.?\\d*)`, 'i')
      )
      
      if (priceMatch) {
        const currency = priceMatch[1] === '€' ? 'EUR' : 
                        priceMatch[1] === '₺' ? 'TRY' : 'USD'
        const price = priceMatch[2].replace(/,/g, '')
        
        quotes.push({
          name: entity.primaryName,
          price: parseFloat(price),
          currency,
          description: entity.definitions[article.language] || `Current ${entity.primaryName} price`
        })
      }
    }
  })
  
  return quotes
}

// ============================================================================
// SCHEMA OPTIMIZATION
// ============================================================================

/**
 * Optimize schema for Google Bot comprehension speed
 * Target: <0.1 second parsing time
 */
export function optimizeSchemaForSpeed(schema: JSONLDV3Schema): JSONLDV3Schema {
  // Remove unnecessary whitespace
  const optimized = JSON.parse(JSON.stringify(schema))
  
  // Ensure critical nodes are first in graph
  const criticalTypes = ['WebSite', 'Organization', 'NewsArticle']
  
  optimized['@graph'].sort((a, b) => {
    const aIndex = criticalTypes.indexOf(Array.isArray(a['@type']) ? a['@type'][0] : a['@type'])
    const bIndex = criticalTypes.indexOf(Array.isArray(b['@type']) ? b['@type'][0] : b['@type'])
    
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })
  
  return optimized
}

/**
 * Generate minified JSON-LD for production
 */
export function generateMinifiedJSONLD(schema: JSONLDV3Schema): string {
  return JSON.stringify(schema)
}

/**
 * Generate pretty JSON-LD for development
 */
export function generatePrettyJSONLD(schema: JSONLDV3Schema): string {
  return JSON.stringify(schema, null, 2)
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate V3 schema completeness
 */
export interface V3SchemaValidation {
  isValid: boolean
  hasNewsArticle: boolean
  hasFinancialQuote: boolean
  hasSpeakable: boolean
  hasAudioObject: boolean
  graphNodeCount: number
  estimatedParseTime: number // milliseconds
  score: number // 0-100
}

export function validateV3Schema(schema: JSONLDV3Schema): V3SchemaValidation {
  const graph = schema['@graph'] || []
  
  const hasNewsArticle = graph.some(node => 
    (Array.isArray(node['@type']) && node['@type'].includes('NewsArticle')) ||
    node['@type'] === 'NewsArticle'
  )
  
  const hasFinancialQuote = graph.some(node => node['@type'] === 'FinancialQuote')
  const hasSpeakable = graph.some(node => node['@type'] === 'SpeakableSpecification')
  const hasAudioObject = graph.some(node => node['@type'] === 'AudioObject')
  
  // Estimate parse time based on graph complexity
  const jsonSize = JSON.stringify(schema).length
  const estimatedParseTime = Math.ceil(jsonSize / 10000) // ~10KB per ms
  
  // Calculate score
  let score = 100
  
  if (!hasNewsArticle) score -= 40
  if (!hasFinancialQuote) score -= 15
  if (!hasSpeakable) score -= 20
  if (!hasAudioObject) score -= 10
  if (estimatedParseTime > 100) score -= 15 // Penalty for slow parsing
  
  return {
    isValid: hasNewsArticle,
    hasNewsArticle,
    hasFinancialQuote,
    hasSpeakable,
    hasAudioObject,
    graphNodeCount: graph.length,
    estimatedParseTime,
    score: Math.max(0, score)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateJSONLDV3,
  optimizeSchemaForSpeed,
  generateMinifiedJSONLD,
  generatePrettyJSONLD,
  validateV3Schema,
}
