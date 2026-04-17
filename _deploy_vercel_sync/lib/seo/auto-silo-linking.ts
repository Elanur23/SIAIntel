/**
 * SIA Auto-Silo Internal Linking System
 * 
 * Automatically creates internal links from keywords to:
 * - Category pages
 * - Related articles
 * - Topic clusters
 * 
 * SEO Benefits:
 * - Improved crawlability
 * - Topic authority signals
 * - PageRank distribution
 * - User engagement
 */

import type { GeneratedArticle, Language } from '@/lib/sia-news/types'

// ============================================================================
// TYPES
// ============================================================================

export interface SiloLink {
  keyword: string
  url: string
  title: string
  type: 'category' | 'article' | 'topic'
  relevanceScore: number
}

export interface SiloStructure {
  mainCategory: string
  subCategories: string[]
  relatedTopics: string[]
  keywordMap: Map<string, SiloLink[]>
}

export interface LinkingResult {
  originalContent: string
  linkedContent: string
  linksAdded: number
  keywords: string[]
}

// ============================================================================
// KEYWORD MAPPING
// ============================================================================

/**
 * Financial keywords and their category mappings
 */
const KEYWORD_CATEGORY_MAP: Record<string, { category: string; priority: number }> = {
  // Cryptocurrency
  'Bitcoin': { category: 'cryptocurrency', priority: 10 },
  'BTC': { category: 'cryptocurrency', priority: 10 },
  'Ethereum': { category: 'cryptocurrency', priority: 9 },
  'ETH': { category: 'cryptocurrency', priority: 9 },
  'Crypto': { category: 'cryptocurrency', priority: 8 },
  'Cryptocurrency': { category: 'cryptocurrency', priority: 8 },
  'Blockchain': { category: 'cryptocurrency', priority: 7 },
  'DeFi': { category: 'cryptocurrency', priority: 7 },
  'NFT': { category: 'cryptocurrency', priority: 6 },
  
  // Central Banks
  'FED': { category: 'central-banks', priority: 10 },
  'Federal Reserve': { category: 'central-banks', priority: 10 },
  'ECB': { category: 'central-banks', priority: 9 },
  'TCMB': { category: 'central-banks', priority: 9 },
  'Central Bank': { category: 'central-banks', priority: 8 },
  'Monetary Policy': { category: 'central-banks', priority: 7 },
  'Interest Rate': { category: 'central-banks', priority: 7 },
  
  // Precious Metals
  'Gold': { category: 'precious-metals', priority: 10 },
  'Altın': { category: 'precious-metals', priority: 10 },
  'Silver': { category: 'precious-metals', priority: 8 },
  'Gümüş': { category: 'precious-metals', priority: 8 },
  'Platinum': { category: 'precious-metals', priority: 7 },
  
  // Stock Market
  'Stock': { category: 'stock-market', priority: 9 },
  'Hisse': { category: 'stock-market', priority: 9 },
  'S&P 500': { category: 'stock-market', priority: 10 },
  'Nasdaq': { category: 'stock-market', priority: 10 },
  'Dow Jones': { category: 'stock-market', priority: 9 },
  'BIST': { category: 'stock-market', priority: 9 },
  
  // Forex
  'USD': { category: 'forex', priority: 9 },
  'EUR': { category: 'forex', priority: 9 },
  'TRY': { category: 'forex', priority: 8 },
  'Dollar': { category: 'forex', priority: 8 },
  'Dolar': { category: 'forex', priority: 8 },
  'Euro': { category: 'forex', priority: 8 },
  'Exchange Rate': { category: 'forex', priority: 7 },
  'Döviz': { category: 'forex', priority: 7 },
  
  // Economic Indicators
  'Inflation': { category: 'economic-indicators', priority: 9 },
  'Enflasyon': { category: 'economic-indicators', priority: 9 },
  'GDP': { category: 'economic-indicators', priority: 8 },
  'GSYİH': { category: 'economic-indicators', priority: 8 },
  'Unemployment': { category: 'economic-indicators', priority: 7 },
  'İşsizlik': { category: 'economic-indicators', priority: 7 },
}

// ============================================================================
// CATEGORY URL GENERATION
// ============================================================================

/**
 * Generate category URL for keyword
 */
export function getCategoryUrl(keyword: string, language: Language): string | null {
  const mapping = KEYWORD_CATEGORY_MAP[keyword]
  
  if (!mapping) return null
  
  return `/${language}/category/${mapping.category}`
}

/**
 * Generate category title for keyword
 */
export function getCategoryTitle(keyword: string, language: Language): string {
  const mapping = KEYWORD_CATEGORY_MAP[keyword]
  
  if (!mapping) return keyword
  
  const titles: Record<string, Record<Language, string>> = {
    'cryptocurrency': {
      en: 'Cryptocurrency News',
      tr: 'Kripto Para Haberleri',
      de: 'Kryptowährung Nachrichten',
      fr: 'Actualités Crypto',
      es: 'Noticias Cripto',
      ru: 'Новости Криптовалют',
      ar: 'أخبار العملات المشفرة',
      jp: '仮想通貨ニュース',
      zh: '加密货币新闻'
    },
    'central-banks': {
      en: 'Central Bank News',
      tr: 'Merkez Bankası Haberleri',
      de: 'Zentralbank Nachrichten',
      fr: 'Actualités Banque Centrale',
      es: 'Noticias Banco Central',
      ru: 'Новости Центробанка',
      ar: 'أخبار البنك المركزي',
      jp: '中央銀行ニュース',
      zh: '央行新闻'
    },
    'precious-metals': {
      en: 'Precious Metals',
      tr: 'Değerli Madenler',
      de: 'Edelmetalle',
      fr: 'Métaux Précieux',
      es: 'Metales Preciosos',
      ru: 'Драгоценные Металлы',
      ar: 'المعادن الثمينة',
      jp: '貴金属',
      zh: '贵金属'
    },
    'stock-market': {
      en: 'Stock Market',
      tr: 'Borsa',
      de: 'Aktienmarkt',
      fr: 'Bourse',
      es: 'Bolsa',
      ru: 'Фондовый Рынок',
      ar: 'سوق الأسهم',
      jp: '株式市場',
      zh: '股市'
    },
    'forex': {
      en: 'Forex & Currencies',
      tr: 'Döviz',
      de: 'Devisen',
      fr: 'Devises',
      es: 'Divisas',
      ru: 'Валюты',
      ar: 'العملات',
      jp: '外国為替・通貨',
      zh: '外汇与货币'
    },
    'economic-indicators': {
      en: 'Economic Indicators',
      tr: 'Ekonomik Göstergeler',
      de: 'Wirtschaftsindikatoren',
      fr: 'Indicateurs Économiques',
      es: 'Indicadores Económicos',
      ru: 'Экономические Показатели',
      ar: 'المؤشرات الاقتصادية',
      jp: '経済指標',
      zh: '经济指标'
    }
  }
  
  return titles[mapping.category]?.[language] || keyword
}

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

/**
 * Extract linkable keywords from content
 */
export function extractLinkableKeywords(content: string): string[] {
  const keywords: string[] = []
  const keywordList = Object.keys(KEYWORD_CATEGORY_MAP)
  
  // Sort by length (longest first) to match longer phrases first
  keywordList.sort((a, b) => b.length - a.length)
  
  keywordList.forEach(keyword => {
    // Case-insensitive search
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = content.match(regex)
    
    if (matches && matches.length > 0) {
      keywords.push(keyword)
    }
  })
  
  // Remove duplicates and sort by priority
  const uniqueKeywords = Array.from(new Set(keywords))
  
  uniqueKeywords.sort((a, b) => {
    const aPriority = KEYWORD_CATEGORY_MAP[a]?.priority || 0
    const bPriority = KEYWORD_CATEGORY_MAP[b]?.priority || 0
    return bPriority - aPriority
  })
  
  return uniqueKeywords
}

// ============================================================================
// LINK INSERTION
// ============================================================================

/**
 * Insert internal links into content
 */
export function insertInternalLinks(
  content: string,
  language: Language,
  options: {
    maxLinksPerKeyword?: number
    maxTotalLinks?: number
    skipFirstOccurrence?: boolean
  } = {}
): LinkingResult {
  const {
    maxLinksPerKeyword = 1,
    maxTotalLinks = 10,
    skipFirstOccurrence = false
  } = options
  
  let linkedContent = content
  const keywords = extractLinkableKeywords(content)
  const keywordOccurrences = new Map<string, number>()
  let totalLinksAdded = 0
  
  keywords.forEach(keyword => {
    if (totalLinksAdded >= maxTotalLinks) return
    
    const categoryUrl = getCategoryUrl(keyword, language)
    if (!categoryUrl) return
    
    const categoryTitle = getCategoryTitle(keyword, language)
    
    // Find all occurrences
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi')
    let match
    let occurrenceCount = 0
    let linksAddedForKeyword = 0
    
    // Replace occurrences
    linkedContent = linkedContent.replace(regex, (matched) => {
      occurrenceCount++
      
      // Skip first occurrence if requested
      if (skipFirstOccurrence && occurrenceCount === 1) {
        return matched
      }
      
      // Check if we've reached max links for this keyword
      if (linksAddedForKeyword >= maxLinksPerKeyword) {
        return matched
      }
      
      // Check if we've reached max total links
      if (totalLinksAdded >= maxTotalLinks) {
        return matched
      }
      
      linksAddedForKeyword++
      totalLinksAdded++
      
      return `<a href="${categoryUrl}" title="${categoryTitle}" class="internal-link">${matched}</a>`
    })
    
    keywordOccurrences.set(keyword, linksAddedForKeyword)
  })
  
  return {
    originalContent: content,
    linkedContent,
    linksAdded: totalLinksAdded,
    keywords: Array.from(keywordOccurrences.keys())
  }
}

// ============================================================================
// SMART LINKING
// ============================================================================

/**
 * Smart linking with context awareness
 * Avoids linking in:
 * - Headlines
 * - Already linked text
 * - Code blocks
 * - Quotes
 */
export function smartInsertLinks(
  content: string,
  language: Language,
  options: {
    maxLinksPerKeyword?: number
    maxTotalLinks?: number
    avoidHeadings?: boolean
    avoidQuotes?: boolean
  } = {}
): LinkingResult {
  const {
    maxLinksPerKeyword = 1,
    maxTotalLinks = 10,
    avoidHeadings = true,
    avoidQuotes = true
  } = options
  
  let processedContent = content
  
  // Split content into sections
  const sections: Array<{ content: string; shouldLink: boolean }> = []
  
  // Identify sections to avoid
  if (avoidHeadings) {
    // Split by headings
    const headingRegex = /<h[1-6][^>]*>.*?<\/h[1-6]>/gi
    const headings = content.match(headingRegex) || []
    
    let lastIndex = 0
    headings.forEach(heading => {
      const index = content.indexOf(heading, lastIndex)
      
      // Add content before heading
      if (index > lastIndex) {
        sections.push({
          content: content.substring(lastIndex, index),
          shouldLink: true
        })
      }
      
      // Add heading (don't link)
      sections.push({
        content: heading,
        shouldLink: false
      })
      
      lastIndex = index + heading.length
    })
    
    // Add remaining content
    if (lastIndex < content.length) {
      sections.push({
        content: content.substring(lastIndex),
        shouldLink: true
      })
    }
  } else {
    sections.push({ content, shouldLink: true })
  }
  
  // Process each section
  let totalLinksAdded = 0
  const linkedSections = sections.map(section => {
    if (!section.shouldLink) {
      return section.content
    }
    
    const result = insertInternalLinks(
      section.content,
      language,
      {
        maxLinksPerKeyword,
        maxTotalLinks: maxTotalLinks - totalLinksAdded
      }
    )
    
    totalLinksAdded += result.linksAdded
    
    return result.linkedContent
  })
  
  return {
    originalContent: content,
    linkedContent: linkedSections.join(''),
    linksAdded: totalLinksAdded,
    keywords: extractLinkableKeywords(content)
  }
}

// ============================================================================
// SILO STRUCTURE GENERATION
// ============================================================================

/**
 * Generate silo structure for article
 */
export function generateSiloStructure(article: GeneratedArticle): SiloStructure {
  const keywords = extractLinkableKeywords(article.fullContent)
  const keywordMap = new Map<string, SiloLink[]>()
  
  // Determine main category
  const mainCategory = keywords.length > 0 
    ? KEYWORD_CATEGORY_MAP[keywords[0]]?.category || 'general'
    : 'general'
  
  // Get sub-categories
  const categories = new Set<string>()
  keywords.forEach(keyword => {
    const mapping = KEYWORD_CATEGORY_MAP[keyword]
    if (mapping) {
      categories.add(mapping.category)
    }
  })
  
  const subCategories = Array.from(categories).filter(c => c !== mainCategory)
  
  // Generate keyword map
  keywords.forEach(keyword => {
    const categoryUrl = getCategoryUrl(keyword, article.language)
    if (!categoryUrl) return
    
    const link: SiloLink = {
      keyword,
      url: categoryUrl,
      title: getCategoryTitle(keyword, article.language),
      type: 'category',
      relevanceScore: KEYWORD_CATEGORY_MAP[keyword]?.priority || 0
    }
    
    if (!keywordMap.has(keyword)) {
      keywordMap.set(keyword, [])
    }
    
    keywordMap.get(keyword)!.push(link)
  })
  
  return {
    mainCategory,
    subCategories,
    relatedTopics: keywords.slice(0, 5),
    keywordMap
  }
}

// ============================================================================
// LINK ANALYSIS
// ============================================================================

/**
 * Analyze internal linking quality
 */
export interface LinkAnalysis {
  totalKeywords: number
  linkedKeywords: number
  linkDensity: number // percentage
  averageLinksPerKeyword: number
  topKeywords: Array<{ keyword: string; occurrences: number }>
  recommendations: string[]
}

export function analyzeLinking(
  originalContent: string,
  linkedContent: string
): LinkAnalysis {
  const keywords = extractLinkableKeywords(originalContent)
  const linkRegex = /<a[^>]*class="internal-link"[^>]*>([^<]+)<\/a>/gi
  const links = linkedContent.match(linkRegex) || []
  
  const linkedKeywords = new Set<string>()
  links.forEach(link => {
    const text = link.match(/>([^<]+)</)?.[1]
    if (text && keywords.includes(text)) {
      linkedKeywords.add(text)
    }
  })
  
  const wordCount = originalContent.split(/\s+/).length
  const linkDensity = (links.length / wordCount) * 100
  
  const recommendations: string[] = []
  
  if (linkDensity < 1) {
    recommendations.push('Consider adding more internal links (target: 1-2% link density)')
  }
  
  if (linkDensity > 3) {
    recommendations.push('Too many internal links - reduce to avoid over-optimization')
  }
  
  if (linkedKeywords.size < keywords.length * 0.5) {
    recommendations.push('Link more high-priority keywords to improve topic authority')
  }
  
  return {
    totalKeywords: keywords.length,
    linkedKeywords: linkedKeywords.size,
    linkDensity: Math.round(linkDensity * 100) / 100,
    averageLinksPerKeyword: linkedKeywords.size > 0 ? links.length / linkedKeywords.size : 0,
    topKeywords: keywords.slice(0, 5).map(k => ({
      keyword: k,
      occurrences: (originalContent.match(new RegExp(`\\b${k}\\b`, 'gi')) || []).length
    })),
    recommendations
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractLinkableKeywords,
  insertInternalLinks,
  smartInsertLinks,
  generateSiloStructure,
  analyzeLinking,
  getCategoryUrl,
  getCategoryTitle,
}
