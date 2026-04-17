// @ts-nocheck - TODO: Install @types/uuid (Phase 4C - deferred to strict mode phase)
/**
 * Raw Data Ingestion Manager for SIA_NEWS_v1.0
 * 
 * Manages WebSocket connections to external data sources (Binance, WhaleAlert, Bloomberg)
 * with automatic reconnection, exponential backoff, and event queue buffering.
 * 
 * Features:
 * - Connection pooling for multiple sources
 * - Automatic reconnection with exponential backoff (max 5 attempts)
 * - Event queue for buffering incoming events
 * - Event normalization and validation
 * - Deduplication detection
 */

import { RawDataSource, RawEvent, NormalizedEvent } from './types'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// DATA SOURCE CONFIGURATIONS
// ============================================================================

export const DATA_SOURCES: Record<string, RawDataSource> = {
  BINANCE: {
    name: 'BINANCE',
    websocketUrl: 'wss://stream.binance.com:9443/ws/btcusdt@ticker',
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 5
  },
  WHALEALERT: {
    name: 'WHALEALERT',
    websocketUrl: 'wss://api.whale-alert.io/v1/websocket',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  },
  BLOOMBERG: {
    name: 'BLOOMBERG',
    websocketUrl: process.env.BLOOMBERG_WS_URL || '',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  }
}

// ============================================================================
// CONNECTION STATE MANAGEMENT
// ============================================================================

interface ConnectionState {
  websocket: WebSocket | null
  reconnectAttempts: number
  isConnecting: boolean
  lastConnectTime: number
  reconnectTimer: NodeJS.Timeout | null
}

// ============================================================================
// RAW DATA INGESTION MANAGER
// ============================================================================

export class RawDataIngestionManager {
  private connections: Map<string, ConnectionState>
  private eventQueue: RawEvent[]
  private eventCallbacks: Array<(event: RawEvent) => void>
  private errorCallbacks: Array<(error: Error, source: string) => void>
  private reconnectCallbacks: Array<(source: string) => void>
  private processedEventIds: Set<string>
  private maxQueueSize: number
  private maxProcessedIdsCache: number

  constructor(maxQueueSize: number = 1000, maxProcessedIdsCache: number = 10000) {
    this.connections = new Map()
    this.eventQueue = []
    this.eventCallbacks = []
    this.errorCallbacks = []
    this.reconnectCallbacks = []
    this.processedEventIds = new Set()
    this.maxQueueSize = maxQueueSize
    this.maxProcessedIdsCache = maxProcessedIdsCache
  }

  /**
   * Connect to a data source
   * @param source - Data source configuration
   */
  async connect(source: RawDataSource): Promise<void> {
    const sourceName = source.name

    // Check if already connected or connecting
    const existingState = this.connections.get(sourceName)
    if (existingState?.websocket?.readyState === WebSocket.OPEN) {
      console.log(`[RawDataIngestion] Already connected to ${sourceName}`)
      return
    }

    if (existingState?.isConnecting) {
      console.log(`[RawDataIngestion] Connection to ${sourceName} already in progress`)
      return
    }

    // Initialize connection state
    const state: ConnectionState = {
      websocket: null,
      reconnectAttempts: 0,
      isConnecting: true,
      lastConnectTime: Date.now(),
      reconnectTimer: null
    }
    this.connections.set(sourceName, state)

    try {
      console.log(`[RawDataIngestion] Connecting to ${sourceName} at ${source.websocketUrl}`)

      // Create WebSocket connection
      const ws = new WebSocket(source.websocketUrl)
      state.websocket = ws

      // Setup event handlers
      ws.onopen = () => {
        console.log(`[RawDataIngestion] Connected to ${sourceName}`)
        state.isConnecting = false
        state.reconnectAttempts = 0
        state.lastConnectTime = Date.now()

        // Subscribe to specific channels based on source
        this.subscribeToChannels(ws, source)
      }

      ws.onmessage = (event) => {
        this.handleMessage(event, source)
      }

      ws.onerror = (error) => {
        console.error(`[RawDataIngestion] WebSocket error for ${sourceName}:`, error)
        state.isConnecting = false
        this.notifyError(new Error(`WebSocket error for ${sourceName}`), sourceName)
      }

      ws.onclose = (event) => {
        console.log(`[RawDataIngestion] Connection closed for ${sourceName}. Code: ${event.code}, Reason: ${event.reason}`)
        state.isConnecting = false
        state.websocket = null

        // Attempt reconnection if not manually closed
        if (event.code !== 1000) {
          this.scheduleReconnect(source)
        }
      }

    } catch (error) {
      console.error(`[RawDataIngestion] Failed to connect to ${sourceName}:`, error)
      state.isConnecting = false
      this.notifyError(error as Error, sourceName)
      this.scheduleReconnect(source)
    }
  }

  /**
   * Disconnect from a data source
   * @param sourceName - Name of the source to disconnect
   */
  async disconnect(sourceName: string): Promise<void> {
    const state = this.connections.get(sourceName)
    if (!state) {
      console.log(`[RawDataIngestion] No connection found for ${sourceName}`)
      return
    }

    // Clear reconnect timer
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer)
      state.reconnectTimer = null
    }

    // Close WebSocket connection
    if (state.websocket) {
      console.log(`[RawDataIngestion] Disconnecting from ${sourceName}`)
      state.websocket.close(1000, 'Manual disconnect')
      state.websocket = null
    }

    // Remove connection state
    this.connections.delete(sourceName)
  }

  /**
   * Reconnect to a data source with exponential backoff
   * @param sourceName - Name of the source to reconnect
   */
  async reconnect(sourceName: string): Promise<void> {
    const sourceConfig = Object.values(DATA_SOURCES).find(s => s.name === sourceName)
    if (!sourceConfig) {
      console.error(`[RawDataIngestion] Unknown source: ${sourceName}`)
      return
    }

    // Disconnect first
    await this.disconnect(sourceName)

    // Reconnect
    await this.connect(sourceConfig)
  }

  /**
   * Schedule reconnection with exponential backoff
   * @param source - Data source configuration
   */
  private scheduleReconnect(source: RawDataSource): void {
    const state = this.connections.get(source.name)
    if (!state) return

    // Check if max attempts reached
    if (state.reconnectAttempts >= source.maxReconnectAttempts) {
      console.error(`[RawDataIngestion] Max reconnection attempts (${source.maxReconnectAttempts}) reached for ${source.name}`)
      this.notifyError(
        new Error(`Max reconnection attempts reached for ${source.name}`),
        source.name
      )
      return
    }

    // Calculate backoff delay (exponential: 5s, 10s, 20s, 40s, 80s)
    const backoffDelay = source.reconnectInterval * Math.pow(2, state.reconnectAttempts)
    state.reconnectAttempts++

    console.log(`[RawDataIngestion] Scheduling reconnect for ${source.name} in ${backoffDelay}ms (attempt ${state.reconnectAttempts}/${source.maxReconnectAttempts})`)

    // Clear existing timer
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer)
    }

    // Schedule reconnection
    state.reconnectTimer = setTimeout(() => {
      console.log(`[RawDataIngestion] Attempting reconnection to ${source.name}`)
      this.connect(source).then(() => {
        this.notifyReconnect(source.name)
      })
    }, backoffDelay)
  }

  /**
   * Subscribe to specific channels based on source
   * @param ws - WebSocket connection
   * @param source - Data source configuration
   */
  private subscribeToChannels(ws: WebSocket, source: RawDataSource): void {
    switch (source.name) {
      case 'BINANCE':
        // Binance streams are already subscribed via URL
        // Additional subscriptions can be sent here if needed
        console.log(`[RawDataIngestion] Subscribed to Binance ticker stream`)
        break

      case 'WHALEALERT':
        // WhaleAlert requires authentication and subscription
        // This is a mock implementation
        ws.send(JSON.stringify({
          method: 'subscribe',
          params: ['whale_transactions']
        }))
        console.log(`[RawDataIngestion] Subscribed to WhaleAlert transactions`)
        break

      case 'BLOOMBERG':
        // Bloomberg API subscription (mock)
        ws.send(JSON.stringify({
          action: 'subscribe',
          channels: ['market_news', 'macro_data']
        }))
        console.log(`[RawDataIngestion] Subscribed to Bloomberg channels`)
        break
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param event - WebSocket message event
   * @param source - Data source configuration
   */
  private handleMessage(event: MessageEvent, source: RawDataSource): void {
    try {
      const rawPayload = event.data.toString()
      
      // Parse message based on source format
      const rawEvent = this.parseMessage(rawPayload, source)
      
      if (rawEvent) {
        // Add to event queue
        this.enqueueEvent(rawEvent)
        
        // Notify callbacks
        this.notifyEvent(rawEvent)
      }
    } catch (error) {
      console.error(`[RawDataIngestion] Error handling message from ${source.name}:`, error)
      this.notifyError(error as Error, source.name)
    }
  }

  /**
   * Parse raw message into RawEvent
   * @param payload - Raw message payload
   * @param source - Data source configuration
   * @returns Parsed RawEvent or null
   */
  private parseMessage(payload: string, source: RawDataSource): RawEvent | null {
    try {
      const data = JSON.parse(payload)

      switch (source.name) {
        case 'BINANCE':
          return this.parseBinanceMessage(data, payload)
        
        case 'WHALEALERT':
          return this.parseWhaleAlertMessage(data, payload)
        
        case 'BLOOMBERG':
          return this.parseBloombergMessage(data, payload)
        
        default:
          return null
      }
    } catch (error) {
      console.error(`[RawDataIngestion] Failed to parse message from ${source.name}:`, error)
      return null
    }
  }

  /**
   * Parse Binance ticker message
   */
  private parseBinanceMessage(data: any, rawPayload: string): RawEvent | null {
    if (!data.e || data.e !== '24hrTicker') return null

    return {
      source: 'BINANCE',
      eventType: 'PRICE_CHANGE',
      timestamp: new Date(data.E).toISOString(),
      data: {
        symbol: data.s,
        priceChange: parseFloat(data.p),
        priceChangePercent: parseFloat(data.P),
        lastPrice: parseFloat(data.c),
        volume: parseFloat(data.v),
        quoteVolume: parseFloat(data.q),
        highPrice: parseFloat(data.h),
        lowPrice: parseFloat(data.l)
      },
      rawPayload
    }
  }

  /**
   * Parse WhaleAlert transaction message
   */
  private parseWhaleAlertMessage(data: any, rawPayload: string): RawEvent | null {
    if (!data.transaction) return null

    return {
      source: 'WHALEALERT',
      eventType: 'WHALE_MOVEMENT',
      timestamp: new Date(data.transaction.timestamp * 1000).toISOString(),
      data: {
        blockchain: data.transaction.blockchain,
        symbol: data.transaction.symbol,
        amount: data.transaction.amount,
        amountUsd: data.transaction.amount_usd,
        from: data.transaction.from,
        to: data.transaction.to,
        transactionType: data.transaction.transaction_type
      },
      rawPayload
    }
  }

  /**
   * Parse Bloomberg news/macro message
   */
  private parseBloombergMessage(data: any, rawPayload: string): RawEvent | null {
    if (!data.type) return null

    const eventType = data.type === 'news' ? 'NEWS_ALERT' : 'MACRO_DATA'

    return {
      source: 'BLOOMBERG',
      eventType,
      timestamp: data.timestamp || new Date().toISOString(),
      data: {
        headline: data.headline,
        content: data.content,
        category: data.category,
        symbols: data.symbols || [],
        sentiment: data.sentiment
      },
      rawPayload
    }
  }

  /**
   * Add event to queue with size management
   * @param event - Raw event to enqueue
   */
  private enqueueEvent(event: RawEvent): void {
    this.eventQueue.push(event)

    // Manage queue size
    if (this.eventQueue.length > this.maxQueueSize) {
      const removed = this.eventQueue.shift()
      console.warn(`[RawDataIngestion] Event queue full, removed oldest event from ${removed?.source}`)
    }
  }

  /**
   * Get and remove next event from queue
   * @returns Next event or null if queue is empty
   */
  public dequeueEvent(): RawEvent | null {
    return this.eventQueue.shift() || null
  }

  /**
   * Get current queue size
   * @returns Number of events in queue
   */
  public getQueueSize(): number {
    return this.eventQueue.length
  }

  /**
   * Clear event queue
   */
  public clearQueue(): void {
    this.eventQueue = []
  }

  /**
   * Register event callback
   * @param callback - Function to call when event is received
   */
  public onEvent(callback: (event: RawEvent) => void): void {
    this.eventCallbacks.push(callback)
  }

  /**
   * Register error callback
   * @param callback - Function to call when error occurs
   */
  public onError(callback: (error: Error, source: string) => void): void {
    this.errorCallbacks.push(callback)
  }

  /**
   * Register reconnect callback
   * @param callback - Function to call when reconnection succeeds
   */
  public onReconnect(callback: (source: string) => void): void {
    this.reconnectCallbacks.push(callback)
  }

  /**
   * Notify all event callbacks
   * @param event - Event to notify
   */
  private notifyEvent(event: RawEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('[RawDataIngestion] Error in event callback:', error)
      }
    })
  }

  /**
   * Notify all error callbacks
   * @param error - Error to notify
   * @param source - Source name
   */
  private notifyError(error: Error, source: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, source)
      } catch (err) {
        console.error('[RawDataIngestion] Error in error callback:', err)
      }
    })
  }

  /**
   * Notify all reconnect callbacks
   * @param source - Source name
   */
  private notifyReconnect(source: string): void {
    this.reconnectCallbacks.forEach(callback => {
      try {
        callback(source)
      } catch (error) {
        console.error('[RawDataIngestion] Error in reconnect callback:', error)
      }
    })
  }

  /**
   * Get connection status for a source
   * @param sourceName - Name of the source
   * @returns Connection status
   */
  public getConnectionStatus(sourceName: string): {
    connected: boolean
    reconnectAttempts: number
    lastConnectTime: number
  } {
    const state = this.connections.get(sourceName)
    return {
      connected: state?.websocket?.readyState === WebSocket.OPEN,
      reconnectAttempts: state?.reconnectAttempts || 0,
      lastConnectTime: state?.lastConnectTime || 0
    }
  }

  /**
   * Get status of all connections
   * @returns Map of source names to connection status
   */
  public getAllConnectionStatuses(): Map<string, {
    connected: boolean
    reconnectAttempts: number
    lastConnectTime: number
  }> {
    const statuses = new Map()
    
    for (const [sourceName] of this.connections) {
      statuses.set(sourceName, this.getConnectionStatus(sourceName))
    }
    
    return statuses
  }

  /**
   * Disconnect all sources and cleanup
   */
  public async disconnectAll(): Promise<void> {
    console.log('[RawDataIngestion] Disconnecting all sources')
    
    const disconnectPromises = Array.from(this.connections.keys()).map(
      sourceName => this.disconnect(sourceName)
    )
    
    await Promise.all(disconnectPromises)
    
    this.clearQueue()
    this.eventCallbacks = []
    this.errorCallbacks = []
    this.reconnectCallbacks = []
    this.processedEventIds.clear()
  }
}

// ============================================================================
// EVENT PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process raw event into normalized event
 * @param event - Raw event from data source
 * @returns Normalized event
 */
export async function processRawEvent(event: RawEvent): Promise<NormalizedEvent> {
  const normalized: NormalizedEvent = {
    id: uuidv4(),
    source: event.source,
    eventType: event.eventType,
    asset: extractAsset(event),
    timestamp: event.timestamp,
    metrics: extractMetrics(event),
    isValid: await validateEventIntegrity(event),
    isDuplicate: false // Will be set by checkDuplication
  }

  return normalized
}

/**
 * Validate event data integrity
 * @param event - Raw event to validate
 * @returns True if event is valid
 */
export async function validateEventIntegrity(event: RawEvent): Promise<boolean> {
  // Check required fields
  if (!event.source || !event.eventType || !event.timestamp) {
    return false
  }

  // Validate timestamp
  const timestamp = new Date(event.timestamp)
  if (isNaN(timestamp.getTime())) {
    return false
  }

  // Check if timestamp is not too old (> 1 hour) or in future
  const now = Date.now()
  const eventTime = timestamp.getTime()
  const oneHour = 60 * 60 * 1000

  if (eventTime > now + oneHour || eventTime < now - oneHour) {
    console.warn(`[RawDataIngestion] Event timestamp out of acceptable range: ${event.timestamp}`)
    return false
  }

  // Validate data object
  if (!event.data || typeof event.data !== 'object') {
    return false
  }

  return true
}

/**
 * Check if event is a duplicate
 * @param event - Normalized event to check
 * @returns True if event is a duplicate
 */
export async function checkDuplication(
  event: NormalizedEvent,
  processedIds: Set<string>
): Promise<boolean> {
  // Create a content-based hash for deduplication
  const contentHash = createEventHash(event)
  
  if (processedIds.has(contentHash)) {
    return true
  }

  // Add to processed set
  processedIds.add(contentHash)

  // Manage cache size
  if (processedIds.size > 10000) {
    // Remove oldest entries (first 1000)
    const idsArray = Array.from(processedIds)
    processedIds.clear()
    idsArray.slice(1000).forEach(id => processedIds.add(id))
  }

  return false
}

/**
 * Create hash for event deduplication
 * @param event - Normalized event
 * @returns Hash string
 */
function createEventHash(event: NormalizedEvent): string {
  const hashData = {
    source: event.source,
    eventType: event.eventType,
    asset: event.asset,
    timestamp: event.timestamp,
    metrics: JSON.stringify(event.metrics)
  }
  
  return JSON.stringify(hashData)
}

/**
 * Extract asset symbol from event
 * @param event - Raw event
 * @returns Asset symbol
 */
function extractAsset(event: RawEvent): string {
  switch (event.source) {
    case 'BINANCE':
      return event.data.symbol || 'UNKNOWN'
    
    case 'WHALEALERT':
      return event.data.symbol || 'UNKNOWN'
    
    case 'BLOOMBERG':
      return event.data.symbols?.[0] || 'MARKET'
    
    default:
      return 'UNKNOWN'
  }
}

/**
 * Extract metrics from event
 * @param event - Raw event
 * @returns Metrics object
 */
function extractMetrics(event: RawEvent): NormalizedEvent['metrics'] {
  const metrics: NormalizedEvent['metrics'] = {}

  switch (event.source) {
    case 'BINANCE':
      metrics.priceChange = event.data.priceChangePercent
      metrics.volume = event.data.volume
      metrics.lastPrice = event.data.lastPrice
      break
    
    case 'WHALEALERT':
      metrics.walletMovement = event.data.amountUsd
      metrics.amount = event.data.amount
      break
    
    case 'BLOOMBERG':
      metrics.sentiment = event.data.sentiment
      break
  }

  return metrics
}

// ============================================================================
// MOCK EVENT GENERATORS (FOR TESTING)
// ============================================================================

/**
 * Generate mock Binance price change event
 * @returns Mock Binance event
 */
export function generateMockBinanceEvent(): RawEvent {
  const priceChange = (Math.random() * 10 - 5).toFixed(2) // -5% to +5%
  const lastPrice = (65000 + Math.random() * 5000).toFixed(2)

  return {
    source: 'BINANCE',
    eventType: 'PRICE_CHANGE',
    timestamp: new Date().toISOString(),
    data: {
      symbol: 'BTCUSDT',
      priceChange: parseFloat(priceChange),
      priceChangePercent: parseFloat(priceChange),
      lastPrice: parseFloat(lastPrice),
      volume: Math.random() * 10000,
      quoteVolume: Math.random() * 1000000000,
      highPrice: parseFloat(lastPrice) * 1.02,
      lowPrice: parseFloat(lastPrice) * 0.98
    },
    rawPayload: JSON.stringify({ e: '24hrTicker', s: 'BTCUSDT', p: priceChange })
  }
}

/**
 * Generate mock WhaleAlert transaction event
 * @returns Mock WhaleAlert event
 */
export function generateMockWhaleAlertEvent(): RawEvent {
  const amount = Math.random() * 1000 + 100
  const amountUsd = amount * 67000

  return {
    source: 'WHALEALERT',
    eventType: 'WHALE_MOVEMENT',
    timestamp: new Date().toISOString(),
    data: {
      blockchain: 'bitcoin',
      symbol: 'BTC',
      amount,
      amountUsd,
      from: 'unknown_wallet',
      to: 'binance',
      transactionType: 'transfer'
    },
    rawPayload: JSON.stringify({ transaction: { amount, amount_usd: amountUsd } })
  }
}

/**
 * Generate mock Bloomberg news event
 * @returns Mock Bloomberg event
 */
export function generateMockBloombergEvent(): RawEvent {
  const headlines = [
    'Bitcoin Surges on Institutional Buying Pressure',
    'Federal Reserve Signals Rate Cut Potential',
    'Ethereum Network Upgrade Completed Successfully',
    'Major Exchange Reports Record Trading Volume'
  ]

  return {
    source: 'BLOOMBERG',
    eventType: 'NEWS_ALERT',
    timestamp: new Date().toISOString(),
    data: {
      headline: headlines[Math.floor(Math.random() * headlines.length)],
      content: 'Market analysis shows significant movement...',
      category: 'cryptocurrency',
      symbols: ['BTC', 'ETH'],
      sentiment: Math.random() * 2 - 1 // -1 to +1
    },
    rawPayload: JSON.stringify({ type: 'news', headline: 'Breaking news' })
  }
}
