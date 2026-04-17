/**
 * SIA Content Buffer & Exponential Growth System
 * 
 * Manages 1000-article buffer with:
 * - Topic Cluster Algorithm (5 categories)
 * - Exponential Growth Formula
 * - Hourly Publishing Mix
 * - Strategic Category Distribution
 */

import type { GeneratedArticle } from '@/lib/sia-news/types'

// ============================================================================
// TYPES
// ============================================================================

export type TopicCategory = 
  | 'CRYPTO_BLOCKCHAIN'      // A: Crypto & Blockchain
  | 'MACRO_ECONOMY'          // B: Macro Economy (FED, Inflation)
  | 'COMMODITIES'            // C: Commodities (Gold, Silver, Oil)
  | 'TECH_STOCKS'            // D: Tech Stocks (Nasdaq, AI)
  | 'EMERGING_MARKETS'       // E: Emerging Markets (BIST, EM)

export interface BufferedArticle extends GeneratedArticle {
  bufferId: string
  category: TopicCategory
  /** War Room'dan seçilen kategori (AI, CRYPTO, STOCKS, ECONOMY, MARKET); feed'de bu kullanılır. */
  displayCategory?: string
  priority: number
  scheduledPublishTime?: string
  publishStatus: 'BUFFERED' | 'SCHEDULED' | 'PUBLISHED'
  createdAt: string
}

export interface CategoryDistribution {
  category: TopicCategory
  percentage: number
  articlesPerHour: number
  keywords: string[]
}

export interface PublishingSchedule {
  hour: number
  date: string
  articles: BufferedArticle[]
  categoryMix: Record<TopicCategory, number>
  totalArticles: number
}

// ============================================================================
// TOPIC CLUSTER ALGORITHM
// ============================================================================

/**
 * 5 Main Categories with Keywords
 */
export const TOPIC_CATEGORIES: Record<TopicCategory, CategoryDistribution> = {
  CRYPTO_BLOCKCHAIN: {
    category: 'CRYPTO_BLOCKCHAIN',
    percentage: 30, // 30% of content
    articlesPerHour: 3,
    keywords: [
      'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Crypto', 'Cryptocurrency',
      'Blockchain', 'DeFi', 'NFT', 'Altcoin', 'Market Cap',
      'Whale Wallet', 'On-Chain', 'Exchange Flow', 'Mining'
    ]
  },
  MACRO_ECONOMY: {
    category: 'MACRO_ECONOMY',
    percentage: 25, // 25% of content
    articlesPerHour: 2,
    keywords: [
      'FED', 'Federal Reserve', 'ECB', 'TCMB', 'Central Bank',
      'Inflation', 'Interest Rate', 'Monetary Policy', 'GDP',
      'Unemployment', 'CPI', 'PPI', 'Economic Growth', 'Recession'
    ]
  },
  COMMODITIES: {
    category: 'COMMODITIES',
    percentage: 20, // 20% of content
    articlesPerHour: 2,
    keywords: [
      'Gold', 'Silver', 'Platinum', 'Oil', 'Crude', 'WTI', 'Brent',
      'Natural Gas', 'Copper', 'Precious Metals', 'Energy',
      'Commodity', 'Futures', 'Spot Price'
    ]
  },
  TECH_STOCKS: {
    category: 'TECH_STOCKS',
    percentage: 15, // 15% of content
    articlesPerHour: 1,
    keywords: [
      'Nasdaq', 'Tech Stock', 'AI', 'Artificial Intelligence',
      'Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Nvidia',
      'Semiconductor', 'Cloud Computing', 'Software', 'Innovation'
    ]
  },
  EMERGING_MARKETS: {
    category: 'EMERGING_MARKETS',
    percentage: 10, // 10% of content
    articlesPerHour: 1,
    keywords: [
      'BIST', 'Emerging Market', 'EM', 'Turkey', 'Brazil', 'India',
      'China', 'Developing Economy', 'Frontier Market', 'MSCI EM',
      'Currency Crisis', 'Capital Flow', 'Foreign Investment'
    ]
  }
}

/**
 * Classify article into topic category
 */
export function classifyArticle(article: GeneratedArticle): TopicCategory {
  const content = `${article.headline} ${article.summary} ${article.fullContent}`.toLowerCase()
  
  // Score each category
  const scores: Record<TopicCategory, number> = {
    CRYPTO_BLOCKCHAIN: 0,
    MACRO_ECONOMY: 0,
    COMMODITIES: 0,
    TECH_STOCKS: 0,
    EMERGING_MARKETS: 0
  }
  
  // Calculate scores based on keyword matches
  Object.entries(TOPIC_CATEGORIES).forEach(([category, config]) => {
    config.keywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        scores[category as TopicCategory] += 1
      }
    })
  })
  
  // Find category with highest score
  let maxScore = 0
  let bestCategory: TopicCategory = 'MACRO_ECONOMY' // Default
  
  Object.entries(scores).forEach(([category, score]) => {
    if (score > maxScore) {
      maxScore = score
      bestCategory = category as TopicCategory
    }
  })
  
  return bestCategory
}

// ============================================================================
// CONTENT BUFFER MANAGEMENT
// ============================================================================

/**
 * In-memory buffer (in production, use database)
 */
const contentBuffer = new Map<string, BufferedArticle>()

/**
 * Add article to buffer.
 * @param displayCategory War Room'dan gelen kategori (AI, CRYPTO, STOCKS, ECONOMY, MARKET); verilirse feed'de bu kullanılır.
 */
export function addToBuffer(article: GeneratedArticle, displayCategory?: string): BufferedArticle {
  const bufferId = `buffer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const category = classifyArticle(article)
  
  const bufferedArticle: BufferedArticle = {
    ...article,
    bufferId,
    category,
    ...(displayCategory && { displayCategory }),
    priority: calculatePriority(article, category),
    publishStatus: 'BUFFERED',
    createdAt: new Date().toISOString()
  }
  
  contentBuffer.set(bufferId, bufferedArticle)
  
  console.log(`📦 Added to buffer: ${bufferId} | Category: ${category}${displayCategory ? ` | Display: ${displayCategory}` : ''}`)
  
  return bufferedArticle
}

/**
 * Calculate article priority (1-10)
 */
function calculatePriority(article: GeneratedArticle, category: TopicCategory): number {
  let priority = 5 // Base priority
  
  // Boost priority for high-confidence articles
  if (article.metadata.confidenceScore && article.metadata.confidenceScore > 85) {
    priority += 2
  }
  
  // Boost priority for trending categories
  if (category === 'CRYPTO_BLOCKCHAIN' || category === 'MACRO_ECONOMY') {
    priority += 1
  }
  
  // Boost priority for breaking news (recent timestamps)
  const articleAge = Date.now() - new Date(article.metadata.generatedAt).getTime()
  if (articleAge < 3600000) { // Less than 1 hour old
    priority += 2
  }
  
  return Math.min(10, priority) // Cap at 10
}

/**
 * Get buffer statistics
 */
export function getBufferStats(): {
  total: number
  byCategory: Record<TopicCategory, number>
  byStatus: Record<string, number>
  avgPriority: number
  articles: BufferedArticle[]
} {
  const articles = Array.from(contentBuffer.values())
  
  const byCategory: Record<TopicCategory, number> = {
    CRYPTO_BLOCKCHAIN: 0,
    MACRO_ECONOMY: 0,
    COMMODITIES: 0,
    TECH_STOCKS: 0,
    EMERGING_MARKETS: 0
  }
  
  const byStatus: Record<string, number> = {
    BUFFERED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0
  }
  
  let totalPriority = 0
  
  articles.forEach(article => {
    byCategory[article.category]++
    byStatus[article.publishStatus]++
    totalPriority += article.priority
  })
  
  return {
    total: articles.length,
    byCategory,
    byStatus,
    avgPriority: articles.length > 0 ? totalPriority / articles.length : 0,
    articles: articles.slice(0, 20) // Return latest 20 articles
  }
}

/**
 * Radardan haberi kaldır: buffer'daki öğeyi "yayınlandı" işaretle (feed'de artık listelenmez)
 * id: feed'deki id (bufferId veya article id)
 */
export function markBufferAsPublished(id: string): boolean {
  if (!id) return false
  for (const [bufferId, article] of contentBuffer.entries()) {
    if (article.bufferId === id || article.id === id) {
      article.publishStatus = 'PUBLISHED'
      console.log(`📤 Marked as published (radar'dan kaldırıldı): ${bufferId}`)
      return true
    }
  }
  return false
}

// ============================================================================
// EXPONENTIAL GROWTH FORMULA
// ============================================================================

/**
 * Calculate articles to publish per hour using exponential growth
 * 
 * Formula: articles(t) = base * (1 + growthRate)^t
 * 
 * Where:
 * - base = starting articles per hour (e.g., 5)
 * - growthRate = growth rate (e.g., 0.15 = 15% growth)
 * - t = time period (hours)
 */
export function calculateExponentialGrowth(
  hour: number,
  baseArticles: number = 5,
  growthRate: number = 0.15,
  maxArticles: number = 50
): number {
  const articles = Math.floor(baseArticles * Math.pow(1 + growthRate, hour))
  return Math.min(articles, maxArticles) // Cap at max
}

/**
 * Generate publishing schedule for next 24 hours
 */
export function generatePublishingSchedule(
  startHour: number = 0,
  baseArticles: number = 5,
  growthRate: number = 0.15
): PublishingSchedule[] {
  const schedule: PublishingSchedule[] = []
  const now = new Date()
  
  for (let hour = 0; hour < 24; hour++) {
    const totalArticles = calculateExponentialGrowth(
      startHour + hour,
      baseArticles,
      growthRate
    )
    
    // Distribute articles across categories
    const categoryMix: Record<TopicCategory, number> = {
      CRYPTO_BLOCKCHAIN: Math.floor(totalArticles * 0.30),
      MACRO_ECONOMY: Math.floor(totalArticles * 0.25),
      COMMODITIES: Math.floor(totalArticles * 0.20),
      TECH_STOCKS: Math.floor(totalArticles * 0.15),
      EMERGING_MARKETS: Math.floor(totalArticles * 0.10)
    }
    
    // Adjust for rounding
    const sum = Object.values(categoryMix).reduce((a, b) => a + b, 0)
    if (sum < totalArticles) {
      categoryMix.CRYPTO_BLOCKCHAIN += (totalArticles - sum)
    }
    
    const publishTime = new Date(now)
    publishTime.setHours(publishTime.getHours() + hour)
    
    schedule.push({
      hour: publishTime.getHours(),
      date: publishTime.toISOString(),
      articles: [], // Will be filled by selectArticlesForPublishing
      categoryMix,
      totalArticles
    })
  }
  
  return schedule
}

// ============================================================================
// ARTICLE SELECTION & PUBLISHING
// ============================================================================

/**
 * Select articles from buffer for publishing
 */
export function selectArticlesForPublishing(
  categoryMix: Record<TopicCategory, number>
): BufferedArticle[] {
  const selected: BufferedArticle[] = []
  const bufferedArticles = Array.from(contentBuffer.values())
    .filter(a => a.publishStatus === 'BUFFERED')
    .sort((a, b) => b.priority - a.priority) // Sort by priority
  
  // Select articles for each category
  Object.entries(categoryMix).forEach(([category, count]) => {
    const categoryArticles = bufferedArticles
      .filter(a => a.category === category as TopicCategory)
      .slice(0, count)
    
    selected.push(...categoryArticles)
  })
  
  return selected
}

/**
 * Schedule articles for publishing
 */
export function scheduleArticles(
  articles: BufferedArticle[],
  publishTime: string
): void {
  articles.forEach(article => {
    article.scheduledPublishTime = publishTime
    article.publishStatus = 'SCHEDULED'
    contentBuffer.set(article.bufferId, article)
  })
  
  console.log(`📅 Scheduled ${articles.length} articles for ${publishTime}`)
}

/**
 * Publish scheduled articles
 */
export async function publishScheduledArticles(hour: number): Promise<number> {
  const now = new Date()
  const currentHour = now.getHours()
  
  if (currentHour !== hour) {
    return 0
  }
  
  const scheduled = Array.from(contentBuffer.values())
    .filter(a => a.publishStatus === 'SCHEDULED')
    .filter(a => {
      if (!a.scheduledPublishTime) return false
      const scheduleTime = new Date(a.scheduledPublishTime)
      return scheduleTime.getHours() === hour
    })
  
  console.log(`\n📢 Publishing ${scheduled.length} articles for hour ${hour}...`)
  
  // Publish articles (in production, save to database and trigger indexing)
  for (const article of scheduled) {
    article.publishStatus = 'PUBLISHED'
    contentBuffer.set(article.bufferId, article)
    
    console.log(`   ✅ Published: ${article.headline} (${article.category})`)
  }
  
  return scheduled.length
}

// ============================================================================
// HOURLY MIX GENERATOR
// ============================================================================

/**
 * Generate hourly publishing mix
 */
export interface HourlyMix {
  hour: number
  timestamp: string
  totalArticles: number
  categoryBreakdown: {
    category: TopicCategory
    count: number
    percentage: number
    articles: string[] // Article IDs
  }[]
  diversity: number // 0-100, higher = more diverse
}

export function generateHourlyMix(hour: number): HourlyMix {
  const schedule = generatePublishingSchedule(hour, 5, 0.15)
  const hourSchedule = schedule[0]
  
  const selected = selectArticlesForPublishing(hourSchedule.categoryMix)
  
  const categoryBreakdown = Object.entries(hourSchedule.categoryMix).map(([category, count]) => {
    const categoryArticles = selected.filter(a => a.category === category)
    return {
      category: category as TopicCategory,
      count,
      percentage: (count / hourSchedule.totalArticles) * 100,
      articles: categoryArticles.map(a => a.bufferId)
    }
  })
  
  // Calculate diversity (Shannon entropy)
  const diversity = calculateDiversity(categoryBreakdown.map(c => c.count))
  
  return {
    hour,
    timestamp: new Date().toISOString(),
    totalArticles: hourSchedule.totalArticles,
    categoryBreakdown,
    diversity
  }
}

/**
 * Calculate diversity using Shannon entropy
 */
function calculateDiversity(counts: number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return 0
  
  const entropy = counts.reduce((sum, count) => {
    if (count === 0) return sum
    const p = count / total
    return sum - (p * Math.log2(p))
  }, 0)
  
  // Normalize to 0-100
  const maxEntropy = Math.log2(counts.length)
  return (entropy / maxEntropy) * 100
}

// ============================================================================
// AUTO-SCHEDULER
// ============================================================================

/**
 * Automatic scheduling system
 */
export class ContentAutoScheduler {
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  
  /**
   * Start auto-scheduler
   */
  start(checkIntervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('⚠️  Auto-scheduler already running')
      return
    }
    
    this.isRunning = true
    
    console.log(`🤖 Starting auto-scheduler (check every ${checkIntervalMinutes} minutes)`)
    
    // Run immediately
    this.scheduleNextBatch()
    
    // Then run on interval
    this.intervalId = setInterval(() => {
      this.scheduleNextBatch()
    }, checkIntervalMinutes * 60 * 1000)
  }
  
  /**
   * Stop auto-scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    
    this.isRunning = false
    console.log('🛑 Auto-scheduler stopped')
  }
  
  /**
   * Schedule next batch of articles
   */
  private scheduleNextBatch(): void {
    const now = new Date()
    const currentHour = now.getHours()
    
    console.log(`\n🤖 Auto-scheduler running at ${now.toISOString()}`)
    
    // Generate schedule for next 24 hours
    const schedule = generatePublishingSchedule(currentHour, 5, 0.15)
    
    // Schedule articles for each hour
    schedule.forEach(hourSchedule => {
      const articles = selectArticlesForPublishing(hourSchedule.categoryMix)
      
      if (articles.length > 0) {
        scheduleArticles(articles, hourSchedule.date)
      }
    })
    
    // Publish articles for current hour
    publishScheduledArticles(currentHour)
    
    const stats = getBufferStats()
    console.log(`\n📊 Buffer Stats:`)
    console.log(`   Total: ${stats.total}`)
    console.log(`   Buffered: ${stats.byStatus.BUFFERED}`)
    console.log(`   Scheduled: ${stats.byStatus.SCHEDULED}`)
    console.log(`   Published: ${stats.byStatus.PUBLISHED}`)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  addToBuffer,
  getBufferStats,
  markBufferAsPublished,
  calculateExponentialGrowth,
  generatePublishingSchedule,
  selectArticlesForPublishing,
  scheduleArticles,
  publishScheduledArticles,
  generateHourlyMix,
  ContentAutoScheduler,
  TOPIC_CATEGORIES,
  classifyArticle,
}
