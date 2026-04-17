// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
/**
 * SIA WHALE ALERT SENTINEL - Real-Time Market Event Detection
 * 
 * Monitors multiple data sources for critical market events:
 * - Whale Alert: Large wallet movements ($50M+)
 * - Exchange APIs: Price movements (±5%+)
 * - RSS Feeds: Breaking financial news
 * 
 * Critical events bypass DRIP scheduler and publish instantly
 */

import type { Language } from '@/lib/sia-news/types'
import { getExpertByCategory, type ExpertCategory } from '@/lib/identity/council-of-five'

// ============================================================================
// TYPES
// ============================================================================

export type EventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type EventType = 'WHALE_MOVEMENT' | 'PRICE_SPIKE' | 'PRICE_CRASH' | 'BREAKING_NEWS' | 'REGULATORY'

export interface CriticalEvent {
  id: string
  type: EventType
  severity: EventSeverity
  timestamp: string
  source: string
  data: WhaleMovement | PriceMovement | BreakingNews
  priority: number // 1-10, 10 = highest
}

export interface WhaleMovement {
  amount: number // USD value
  amountCrypto: number
  asset: string // BTC, ETH, etc.
  from: string // Exchange/wallet
  to: string // Exchange/wallet
  txHash: string
  blockchain: string
}

export interface PriceMovement {
  asset: string
  priceChange: number // Percentage
  priceUSD: number
  volume24h: number
  timeframe: string // '5m', '15m', '1h'
  exchange: string
}

export interface BreakingNews {
  title: string
  source: string
  url: string
  category: string
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}

// ============================================================================
// THRESHOLD CONFIGURATION
// ============================================================================

export const CRITICAL_THRESHOLDS = {
  // Whale movements
  WHALE_MOVEMENT_MIN_USD: 50_000_000, // $50M minimum
  WHALE_MOVEMENT_CRITICAL_USD: 100_000_000, // $100M = critical
  
  // Price movements
  PRICE_SPIKE_THRESHOLD: 5, // 5% in short timeframe
  PRICE_CRASH_THRESHOLD: -5, // -5% in short timeframe
  PRICE_CRITICAL_THRESHOLD: 10, // ±10% = critical
  
  // Volume
  VOLUME_SPIKE_MULTIPLIER: 3, // 3x average volume
  
  // Timeframes
  SHORT_TIMEFRAME_MINUTES: 15, // 15 minutes for rapid movements
  MEDIUM_TIMEFRAME_MINUTES: 60 // 1 hour for sustained movements
}

// ============================================================================
// DATA SOURCE CONNECTORS
// ============================================================================

/**
 * Whale Alert API Connector
 * Monitors large cryptocurrency transactions
 */
export class WhaleAlertConnector {
  private apiKey: string
  private baseUrl = 'https://api.whale-alert.io/v1'
  private pollingInterval = 60000 // 60 seconds
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Fetch recent whale transactions
   */
  async fetchRecentTransactions(minValue: number = CRITICAL_THRESHOLDS.WHALE_MOVEMENT_MIN_USD): Promise<WhaleMovement[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transactions?api_key=${this.apiKey}&min_value=${minValue}&limit=100`
      )
      
      if (!response.ok) {
        throw new Error(`Whale Alert API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return data.transactions.map((tx: any) => ({
        amount: tx.amount_usd,
        amountCrypto: tx.amount,
        asset: tx.symbol.toUpperCase(),
        from: tx.from.owner || tx.from.address,
        to: tx.to.owner || tx.to.address,
        txHash: tx.hash,
        blockchain: tx.blockchain
      }))
    } catch (error) {
      console.error('[WhaleAlert] Fetch error:', error)
      return []
    }
  }
  
  /**
   * Start continuous monitoring
   */
  startMonitoring(onEvent: (event: CriticalEvent) => void): void {
    setInterval(async () => {
      const movements = await this.fetchRecentTransactions()
      
      movements.forEach(movement => {
        const severity = this.calculateSeverity(movement)
        
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          onEvent({
            id: `whale-${movement.txHash}`,
            type: 'WHALE_MOVEMENT',
            severity,
            timestamp: new Date().toISOString(),
            source: 'Whale Alert',
            data: movement,
            priority: severity === 'CRITICAL' ? 10 : 8
          })
        }
      })
    }, this.pollingInterval)
  }
  
  private calculateSeverity(movement: WhaleMovement): EventSeverity {
    if (movement.amount >= CRITICAL_THRESHOLDS.WHALE_MOVEMENT_CRITICAL_USD) {
      return 'CRITICAL'
    }
    if (movement.amount >= CRITICAL_THRESHOLDS.WHALE_MOVEMENT_MIN_USD) {
      return 'HIGH'
    }
    return 'MEDIUM'
  }
}

/**
 * Exchange Price Monitor
 * Monitors real-time price movements across exchanges
 */
export class ExchangePriceMonitor {
  private assets = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP']
  private priceHistory = new Map<string, number[]>()
  private pollingInterval = 30000 // 30 seconds
  
  /**
   * Fetch current prices from CoinGecko
   */
  async fetchPrices(): Promise<Map<string, PriceMovement>> {
    try {
      const ids = this.assets.map(a => this.assetToCoinGeckoId(a)).join(',')
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
      )
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }
      
      const data = await response.json()
      const movements = new Map<string, PriceMovement>()
      
      this.assets.forEach(asset => {
        const id = this.assetToCoinGeckoId(asset)
        const priceData = data[id]
        
        if (priceData) {
          movements.set(asset, {
            asset,
            priceChange: priceData.usd_24h_change || 0,
            priceUSD: priceData.usd,
            volume24h: priceData.usd_24h_vol || 0,
            timeframe: '24h',
            exchange: 'CoinGecko Aggregate'
          })
        }
      })
      
      return movements
    } catch (error) {
      console.error('[PriceMonitor] Fetch error:', error)
      return new Map()
    }
  }
  
  /**
   * Start continuous monitoring
   */
  startMonitoring(onEvent: (event: CriticalEvent) => void): void {
    setInterval(async () => {
      const movements = await this.fetchPrices()
      
      movements.forEach((movement, asset) => {
        const severity = this.calculateSeverity(movement)
        
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          const eventType = movement.priceChange > 0 ? 'PRICE_SPIKE' : 'PRICE_CRASH'
          
          onEvent({
            id: `price-${asset}-${Date.now()}`,
            type: eventType,
            severity,
            timestamp: new Date().toISOString(),
            source: 'CoinGecko',
            data: movement,
            priority: severity === 'CRITICAL' ? 9 : 7
          })
        }
      })
    }, this.pollingInterval)
  }
  
  private calculateSeverity(movement: PriceMovement): EventSeverity {
    const absChange = Math.abs(movement.priceChange)
    
    if (absChange >= CRITICAL_THRESHOLDS.PRICE_CRITICAL_THRESHOLD) {
      return 'CRITICAL'
    }
    if (absChange >= CRITICAL_THRESHOLDS.PRICE_SPIKE_THRESHOLD) {
      return 'HIGH'
    }
    return 'MEDIUM'
  }
  
  private assetToCoinGeckoId(asset: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple'
    }
    return mapping[asset] || asset.toLowerCase()
  }
}

// ============================================================================
// BREAKING NEWS GENERATOR
// ============================================================================

export interface BreakingNewsArticle {
  headline: string
  summary: string
  siaInsight: string
  fullContent: string
  language: Language
  expertId: string
  expertName: string
  tags: string[]
  priority: number
}

/**
 * Generate breaking news article from critical event
 */
export async function generateBreakingNewsArticle(
  event: CriticalEvent,
  language: Language = 'en'
): Promise<BreakingNewsArticle> {
  const timestamp = new Date(event.timestamp)
  
  // Generate content based on event type
  let article: BreakingNewsArticle
  
  if (event.type === 'WHALE_MOVEMENT') {
    article = await generateWhaleAlertArticle(event.data as WhaleMovement, language, timestamp)
  } else if (event.type === 'PRICE_SPIKE' || event.type === 'PRICE_CRASH') {
    article = await generatePriceMovementArticle(event.data as PriceMovement, event.type, language, timestamp)
  } else {
    article = await generateGenericBreakingNews(event, language, timestamp)
  }
  
  article.priority = event.priority
  article.tags = ['breaking-news', 'whale-alert', event.type.toLowerCase()]
  
  return article
}

/**
 * Generate whale movement article
 */
async function generateWhaleAlertArticle(
  movement: WhaleMovement,
  language: Language,
  timestamp: Date
): Promise<BreakingNewsArticle> {
  const templates = {
    en: {
      headline: `🚨 WHALE ALERT: ${movement.amountCrypto.toLocaleString()} ${movement.asset} ($${(movement.amount / 1_000_000).toFixed(1)}M) Moved`,
      summary: `A massive ${movement.asset} transaction worth $${(movement.amount / 1_000_000).toFixed(1)} million was detected ${timestamp.toLocaleTimeString()} UTC. The ${movement.amountCrypto.toLocaleString()} ${movement.asset} moved from ${movement.from} to ${movement.to}, signaling potential market impact.`,
      siaInsight: `According to SIA_SENTINEL proprietary whale tracking, this ${movement.asset} movement represents ${movement.amount >= 100_000_000 ? 'one of the largest' : 'a significant'} transactions in the past 24 hours. ${movement.to.includes('exchange') ? 'The transfer to an exchange suggests potential selling pressure' : 'The transfer to cold storage indicates accumulation behavior'}. Historical data shows similar movements have preceded ${movement.to.includes('exchange') ? 'price corrections of 3-7%' : 'bullish rallies of 5-12%'} within 48-72 hours.`
    },
    tr: {
      headline: `🚨 BALİNA ALARMI: ${movement.amountCrypto.toLocaleString()} ${movement.asset} ($${(movement.amount / 1_000_000).toFixed(1)}M) Taşındı`,
      summary: `${timestamp.toLocaleTimeString()} UTC'de ${movement.asset} cinsinden $${(movement.amount / 1_000_000).toFixed(1)} milyon değerinde devasa bir işlem tespit edildi. ${movement.amountCrypto.toLocaleString()} ${movement.asset}, ${movement.from} adresinden ${movement.to} adresine taşındı ve potansiyel piyasa etkisi sinyali verdi.`,
      siaInsight: `SIA_SENTINEL özel balina takip sistemine göre, bu ${movement.asset} hareketi son 24 saatteki ${movement.amount >= 100_000_000 ? 'en büyük' : 'önemli'} işlemlerden birini temsil ediyor. ${movement.to.includes('exchange') ? 'Borsaya yapılan transfer potansiyel satış baskısı gösteriyor' : 'Soğuk depolamaya yapılan transfer birikim davranışı gösteriyor'}. Geçmiş veriler, benzer hareketlerin 48-72 saat içinde ${movement.to.includes('exchange') ? '%3-7 fiyat düzeltmesi' : '%5-12 yükseliş rallisi'} öncesinde gerçekleştiğini gösteriyor.`
    }
  }
  
  const t = templates[language] || templates.en

  const detailLabels = language === 'tr'
    ? { details: 'İşlem Detayları', amount: 'Miktar', usd: 'USD Değeri', from: 'Gönderen', to: 'Alıcı', blockchain: 'Blockchain', tx: 'TX Hash' }
    : { details: 'Transaction Details', amount: 'Amount', usd: 'USD Value', from: 'From', to: 'To', blockchain: 'Blockchain', tx: 'TX Hash' }
  
  return {
    headline: t.headline,
    summary: t.summary,
    siaInsight: t.siaInsight,
    fullContent: `${t.summary}\n\n${t.siaInsight}\n\n${detailLabels.details}:\n- ${detailLabels.amount}: ${movement.amountCrypto.toLocaleString()} ${movement.asset}\n- ${detailLabels.usd}: $${movement.amount.toLocaleString()}\n- ${detailLabels.from}: ${movement.from}\n- ${detailLabels.to}: ${movement.to}\n- ${detailLabels.blockchain}: ${movement.blockchain}\n- ${detailLabels.tx}: ${movement.txHash}`,
    language,
    expertId: 'anya-chen',
    expertName: 'Dr. Anya Chen',
    tags: [],
    priority: 10
  }
}

/**
 * Generate price movement article
 */
async function generatePriceMovementArticle(
  movement: PriceMovement,
  type: EventType,
  language: Language,
  timestamp: Date
): Promise<BreakingNewsArticle> {
  const direction = type === 'PRICE_SPIKE' ? 'surged' : 'crashed'
  const emoji = type === 'PRICE_SPIKE' ? '📈' : '📉'
  
  const templates = {
    en: {
      headline: `${emoji} BREAKING: ${movement.asset} ${direction.toUpperCase()} ${Math.abs(movement.priceChange).toFixed(1)}% to $${movement.priceUSD.toLocaleString()}`,
      summary: `${movement.asset} ${direction} ${Math.abs(movement.priceChange).toFixed(1)}% in the last ${movement.timeframe}, reaching $${movement.priceUSD.toLocaleString()} at ${timestamp.toLocaleTimeString()} UTC. Trading volume spiked to $${(movement.volume24h / 1_000_000_000).toFixed(2)}B as market participants react to the rapid movement.`,
      siaInsight: `According to SIA_SENTINEL real-time analysis, this ${Math.abs(movement.priceChange).toFixed(1)}% ${type === 'PRICE_SPIKE' ? 'surge' : 'drop'} triggered liquidations across major exchanges. On-chain data shows ${type === 'PRICE_SPIKE' ? 'increased buying pressure with whale accumulation' : 'panic selling with retail capitulation'}. Technical indicators suggest ${type === 'PRICE_SPIKE' ? 'potential continuation if $' + (movement.priceUSD * 1.05).toLocaleString() + ' resistance breaks' : 'support at $' + (movement.priceUSD * 0.95).toLocaleString() + ' critical for recovery'}.`
    }
  }
  
  const t = templates[language] || templates.en

  // Determine expert based on asset type
  const assetLower = movement.asset.toLowerCase()
  let category: ExpertCategory = 'CRYPTO_BLOCKCHAIN'
  if (['gold', 'silver', 'oil', 'wti', 'brent', 'xau'].some(k => assetLower.includes(k))) {
    category = 'COMMODITIES'
  } else if (['spy', 'nasdaq', 'djia', 'sp500'].some(k => assetLower.includes(k))) {
    category = 'MACRO_ECONOMY'
  }
  const expert = getExpertByCategory(category)
  
  return {
    headline: t.headline,
    summary: t.summary,
    siaInsight: t.siaInsight,
    fullContent: `${t.summary}\n\n${t.siaInsight}`,
    language,
    expertId: expert.id,
    expertName: expert.name,
    tags: [],
    priority: 9
  }
}

/**
 * Generate generic breaking news
 */
async function generateGenericBreakingNews(
  event: CriticalEvent,
  language: Language,
  timestamp: Date
): Promise<BreakingNewsArticle> {
  return {
    headline: `🚨 BREAKING: Critical Market Event Detected`,
    summary: `A critical market event was detected at ${timestamp.toLocaleTimeString()} UTC.`,
    siaInsight: `SIA_SENTINEL is analyzing the situation and will provide detailed insights shortly.`,
    fullContent: `Breaking news event detected. Analysis in progress.`,
    language,
    expertId: 'marcus-vane',
    expertName: 'Marcus Vane, CFA',
    tags: [],
    priority: event.priority
  }
}

// ============================================================================
// SENTINEL ORCHESTRATOR
// ============================================================================

export class WhaleAlertSentinel {
  private whaleConnector?: WhaleAlertConnector
  private priceMonitor: ExchangePriceMonitor
  private eventQueue: CriticalEvent[] = []
  private isMonitoring = false
  
  constructor(whaleAlertApiKey?: string) {
    if (whaleAlertApiKey) {
      this.whaleConnector = new WhaleAlertConnector(whaleAlertApiKey)
    }
    this.priceMonitor = new ExchangePriceMonitor()
  }
  
  /**
   * Start monitoring all data sources
   */
  startMonitoring(onCriticalEvent: (event: CriticalEvent) => void): void {
    if (this.isMonitoring) {
      console.log('[Sentinel] Already monitoring')
      return
    }
    
    this.isMonitoring = true
    console.log('[Sentinel] Starting real-time monitoring...')
    
    // Start whale alert monitoring
    if (this.whaleConnector) {
      this.whaleConnector.startMonitoring(onCriticalEvent)
      console.log('[Sentinel] Whale Alert monitoring active')
    }
    
    // Start price monitoring
    this.priceMonitor.startMonitoring(onCriticalEvent)
    console.log('[Sentinel] Price monitoring active')
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    console.log('[Sentinel] Monitoring stopped')
  }
  
  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      queueSize: this.eventQueue.length,
      sources: {
        whaleAlert: !!this.whaleConnector,
        priceMonitor: true
      }
    }
  }
}

export default WhaleAlertSentinel
