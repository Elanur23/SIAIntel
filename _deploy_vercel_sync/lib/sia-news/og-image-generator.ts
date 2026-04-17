/**
 * SIA Dynamic OG Image Generator
 * 
 * Generates OpenGraph images for social media sharing with:
 * - Dark anthracite financial chart background
 * - Gold headline text
 * - SIA logo
 * - Automatic generation on article publish
 */

import type { GeneratedArticle, Language } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface OGImageConfig {
  width: number
  height: number
  backgroundColor: string
  textColor: string
  accentColor: string
  logoUrl: string
  chartPattern: 'candlestick' | 'line' | 'area'
}

export interface OGImageMetadata {
  url: string
  width: number
  height: number
  alt: string
  type: string
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: OGImageConfig = {
  width: 1200,
  height: 630,
  backgroundColor: '#1a1a1a', // Dark anthracite
  textColor: '#ffffff',
  accentColor: '#f59e0b', // Gold
  logoUrl: 'https://siaintel.com/logo.png',
  chartPattern: 'candlestick'
}

// ============================================================================
// OG IMAGE URL GENERATION
// ============================================================================

/**
 * Generate OG image URL for article
 * Uses dynamic image generation service or pre-generated images
 */
export function generateOGImageUrl(
  article: GeneratedArticle,
  config: Partial<OGImageConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Option 1: Use dynamic image generation service (e.g., Vercel OG)
  const params = new URLSearchParams({
    title: truncateTitle(article.headline, 80),
    language: article.language,
    sentiment: article.sentiment?.overall.toString() || '50',
    eeat: article.eeatScore.toString(),
    width: finalConfig.width.toString(),
    height: finalConfig.height.toString()
  })
  
  return `https://siaintel.com/api/og?${params.toString()}`
  
  // Option 2: Use pre-generated images stored in CDN
  // const slug = generateSlug(article.headline)
  // return `https://cdn.sia-global.com/og-images/${article.language}/${slug}.png`
}

/**
 * Generate OG image metadata for HTML meta tags
 */
export function generateOGImageMetadata(
  article: GeneratedArticle,
  config: Partial<OGImageConfig> = {}
): OGImageMetadata {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const url = generateOGImageUrl(article, config)
  
  return {
    url,
    width: finalConfig.width,
    height: finalConfig.height,
    alt: `${article.headline} - SIAINTEL`,
    type: 'image/png'
  }
}

/**
 * Generate complete OpenGraph meta tags
 */
export function generateOGMetaTags(article: GeneratedArticle): Record<string, string> {
  const ogImage = generateOGImageMetadata(article)
  
  return {
    'og:type': 'article',
    'og:title': article.headline,
    'og:description': article.summary,
    'og:image': ogImage.url,
    'og:image:width': ogImage.width.toString(),
    'og:image:height': ogImage.height.toString(),
    'og:image:alt': ogImage.alt,
    'og:image:type': ogImage.type,
    'og:url': `https://siaintel.com/${article.language}/news/${generateSlug(article.headline)}`,
    'og:site_name': 'SIAINTEL',
    'og:locale': getOGLocale(article.language),
    'article:published_time': article.metadata.generatedAt,
    'article:author': 'SIAINTEL',
    'article:section': 'Financial Analysis',
    'article:tag': article.entities.map(e => e.primaryName).join(',')
  }
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterMetaTags(article: GeneratedArticle): Record<string, string> {
  const ogImage = generateOGImageMetadata(article)
  
  return {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@siaintel',
    'twitter:creator': '@siaintel',
    'twitter:title': article.headline,
    'twitter:description': article.summary,
    'twitter:image': ogImage.url,
    'twitter:image:alt': ogImage.alt
  }
}

// ============================================================================
// DYNAMIC IMAGE GENERATION (Server-Side)
// ============================================================================

/**
 * Generate OG image data for server-side rendering
 * This would be used in an API route (e.g., /api/og)
 */
export interface OGImageData {
  title: string
  language: Language
  sentiment: number
  eeat: number
  chartData?: number[]
}

export function generateOGImageHTML(data: OGImageData): string {
  const { title, language, sentiment, eeat } = data
  
  // SVG-based OG image template
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="630" fill="#1a1a1a"/>
      
      <!-- Chart Pattern Background -->
      <g opacity="0.1">
        ${generateChartPattern()}
      </g>
      
      <!-- Gradient Overlay -->
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#d97706;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#goldGradient)"/>
      
      <!-- SIA Logo -->
      <text x="60" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#f59e0b">
        SIA
      </text>
      <text x="120" y="80" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        FINANCIAL SENTINEL
      </text>
      
      <!-- Title -->
      <foreignObject x="60" y="140" width="1080" height="300">
        <div xmlns="http://www.w3.org/1999/xhtml" style="
          font-family: Arial, sans-serif;
          font-size: 48px;
          font-weight: bold;
          color: #ffffff;
          line-height: 1.2;
          word-wrap: break-word;
        ">
          ${escapeHtml(title)}
        </div>
      </foreignObject>
      
      <!-- Metrics Bar -->
      <rect x="60" y="500" width="1080" height="80" fill="#000000" opacity="0.5" rx="8"/>
      
      <!-- E-E-A-T Score -->
      <text x="100" y="535" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
        E-E-A-T SCORE
      </text>
      <text x="100" y="565" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#f59e0b">
        ${eeat}/100
      </text>
      
      <!-- Sentiment -->
      <text x="400" y="535" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
        MARKET SENTIMENT
      </text>
      <text x="400" y="565" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${getSentimentColor(sentiment)}">
        ${sentiment}/100
      </text>
      
      <!-- Language Badge -->
      <rect x="700" y="515" width="80" height="40" fill="#f59e0b" rx="4"/>
      <text x="740" y="543" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#000000" text-anchor="middle">
        ${language.toUpperCase()}
      </text>
      
      <!-- Verification Badge -->
      <text x="850" y="535" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
        21 REGULATORY SOURCES
      </text>
      <circle cx="1050" cy="545" r="20" fill="#3b82f6"/>
      <text x="1050" y="552" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle">
        ✓
      </text>
    </svg>
  `
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength - 3) + '...'
}

function generateSlug(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

function getOGLocale(language: Language): string {
  const locales: Record<Language, string> = {
    en: 'en_US',
    tr: 'tr_TR',
    de: 'de_DE',
    fr: 'fr_FR',
    es: 'es_ES',
    ru: 'ru_RU',
    ar: 'ar_AE',
    jp: 'ja_JP',
    zh: 'zh_CN'
  }
  return locales[language]
}

function getSentimentColor(sentiment: number): string {
  if (sentiment < 20) return '#ef4444' // Red
  if (sentiment < 40) return '#f97316' // Orange
  if (sentiment < 60) return '#eab308' // Yellow
  if (sentiment < 80) return '#22c55e' // Green
  return '#10b981' // Emerald
}

function generateChartPattern(): string {
  // Generate SVG candlestick pattern
  const candles = []
  let x = 100
  
  for (let i = 0; i < 20; i++) {
    const high = 200 + Math.random() * 200
    const low = high - Math.random() * 100
    const open = low + Math.random() * (high - low)
    const close = low + Math.random() * (high - low)
    const isGreen = close > open
    
    candles.push(`
      <line x1="${x}" y1="${high}" x2="${x}" y2="${low}" stroke="${isGreen ? '#22c55e' : '#ef4444'}" stroke-width="1"/>
      <rect x="${x - 10}" y="${Math.min(open, close)}" width="20" height="${Math.abs(close - open)}" fill="${isGreen ? '#22c55e' : '#ef4444'}"/>
    `)
    
    x += 50
  }
  
  return candles.join('')
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate OG images for multiple articles
 */
export async function generateBatchOGImages(
  articles: GeneratedArticle[]
): Promise<Map<string, OGImageMetadata>> {
  const images = new Map<string, OGImageMetadata>()
  
  for (const article of articles) {
    const metadata = generateOGImageMetadata(article)
    images.set(article.id, metadata)
  }
  
  return images
}

/**
 * Cache OG image metadata
 */
const ogImageCache = new Map<string, OGImageMetadata>()

export function cacheOGImage(articleId: string, metadata: OGImageMetadata): void {
  ogImageCache.set(articleId, metadata)
}

export function getCachedOGImage(articleId: string): OGImageMetadata | undefined {
  return ogImageCache.get(articleId)
}

export function clearOGImageCache(): void {
  ogImageCache.clear()
}
