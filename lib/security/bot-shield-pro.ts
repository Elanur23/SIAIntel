/**
 * Bot Shield Pro - Enterprise Bot Detection & Fraud Prevention
 * Detects bot traffic, click fraud, and invalid traffic
 * Protects AdSense revenue and analytics accuracy
 */

export enum BotType {
  LEGITIMATE = 'legitimate',
  SUSPICIOUS = 'suspicious',
  BOT = 'bot',
  CLICK_FRAUD = 'click_fraud',
  TRAFFIC_FRAUD = 'traffic_fraud',
}

export enum BotRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface BotSignature {
  id: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  fingerprint: string
  botType: BotType
  riskLevel: BotRiskLevel
  confidence: number // 0-100
  signals: string[]
  metadata: Record<string, any>
  blocked: boolean
  blockedAt?: Date
  blockedReason?: string
}

export interface BotStats {
  totalRequests: number
  botRequests: number
  botPercentage: number
  byType: Record<BotType, number>
  byRiskLevel: Record<BotRiskLevel, number>
  blockedRequests: number
  fraudulentClicks: number
  fraudulentImpressions: number
  estimatedFraudCost: number
  topBotIPs: Array<{ ip: string; count: number }>
  topBotUserAgents: Array<{ userAgent: string; count: number }>
}

export interface BotSignals {
  // Behavioral signals
  requestRate: number // Requests per second
  clickRate: number // Clicks per impression
  conversionRate: number // Conversions per click
  sessionDuration: number // Milliseconds
  pageViewsPerSession: number
  bounceRate: number // Percentage
  
  // Technical signals
  hasJavaScript: boolean
  hasCookies: boolean
  hasLocalStorage: boolean
  hasSessionStorage: boolean
  screenResolution: string
  timezone: string
  language: string
  
  // Network signals
  ipReputation: number // 0-100 (0=bad, 100=good)
  isVPN: boolean
  isProxy: boolean
  isDataCenter: boolean
  isResidential: boolean
  
  // Timing signals
  mouseMovement: boolean
  keyboardInput: boolean
  scrollBehavior: boolean
  clickPattern: string // 'random', 'pattern', 'natural'
  
  // Content signals
  adViewTime: number // Milliseconds
  adInteraction: boolean
  adCompletion: boolean
  videoPlayback: boolean
}

/**
 * Bot Shield Pro - Main class
 */
export class BotShieldPro {
  private signatures: Map<string, BotSignature> = new Map()
  private blockedIPs: Set<string> = new Set()
  private blockedUserAgents: Set<string> = new Set()
  private readonly maxSignatures = 100000
  private readonly retentionHours = 72
  private totalRequests = 0
  private botRequests = 0
  private fraudulentClicks = 0
  private fraudulentImpressions = 0

  // Bot detection thresholds
  private readonly thresholds = {
    requestRatePerSecond: 10, // More than 10 req/s = suspicious
    clickRatePercentage: 50, // More than 50% clicks = suspicious
    conversionRatePercentage: 30, // More than 30% conversion = suspicious
    sessionDurationMs: 1000, // Less than 1s = suspicious
    pageViewsPerSession: 50, // More than 50 pages = suspicious
    bounceRatePercentage: 95, // More than 95% bounce = suspicious
    ipReputationThreshold: 30, // Less than 30 = bad
    adViewTimeMs: 100, // Less than 100ms = suspicious
  }

  /**
   * Analyze request for bot activity
   */
  analyzeRequest(params: {
    ipAddress: string
    userAgent: string
    signals: BotSignals
    metadata?: Record<string, any>
  }): BotSignature {
    const fingerprint = this.generateFingerprint(params.ipAddress, params.userAgent)
    const detectedSignals = this.detectSignals(params.signals)
    const botType = this.classifyBot(detectedSignals, params.signals)
    const riskLevel = this.calculateRiskLevel(botType, detectedSignals)
    const confidence = this.calculateConfidence(detectedSignals, params.signals)

    const signature: BotSignature = {
      id: this.generateId(),
      timestamp: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      fingerprint,
      botType,
      riskLevel,
      confidence,
      signals: detectedSignals,
      metadata: params.metadata || {},
      blocked: false,
    }

    // Check if should be blocked
    if (this.shouldBlock(signature)) {
      signature.blocked = true
      signature.blockedAt = new Date()
      signature.blockedReason = `Bot detected: ${botType} (confidence: ${confidence}%)`
      this.blockedIPs.add(params.ipAddress)
      this.blockedUserAgents.add(params.userAgent)
    }

    // Store signature
    this.signatures.set(signature.id, signature)
    this.totalRequests++
    if (botType !== BotType.LEGITIMATE) {
      this.botRequests++
    }

    // Cleanup old signatures
    this.cleanup()

    return signature
  }

  /**
   * Track click for fraud detection
   */
  trackClick(params: {
    ipAddress: string
    userAgent: string
    adId: string
    timestamp: Date
  }): { valid: boolean; reason?: string } {
    // Check if IP is blocked
    if (this.blockedIPs.has(params.ipAddress)) {
      this.fraudulentClicks++
      return { valid: false, reason: 'IP is blocked' }
    }

    // Check if user agent is blocked
    if (this.blockedUserAgents.has(params.userAgent)) {
      this.fraudulentClicks++
      return { valid: false, reason: 'User agent is blocked' }
    }

    // Check click rate
    const recentClicks = Array.from(this.signatures.values()).filter(
      s => s.ipAddress === params.ipAddress && 
      s.timestamp.getTime() > Date.now() - 60000 // Last minute
    ).length

    if (recentClicks > this.thresholds.requestRatePerSecond) {
      this.fraudulentClicks++
      return { valid: false, reason: 'Excessive click rate' }
    }

    return { valid: true }
  }

  /**
   * Track impression for fraud detection
   */
  trackImpression(params: {
    ipAddress: string
    userAgent: string
    adId: string
    viewTime: number
  }): { valid: boolean; reason?: string } {
    // Check if IP is blocked
    if (this.blockedIPs.has(params.ipAddress)) {
      this.fraudulentImpressions++
      return { valid: false, reason: 'IP is blocked' }
    }

    // Check view time
    if (params.viewTime < this.thresholds.adViewTimeMs) {
      this.fraudulentImpressions++
      return { valid: false, reason: 'View time too short' }
    }

    return { valid: true }
  }

  /**
   * Get bot statistics
   */
  getStats(): BotStats {
    const byType: Record<BotType, number> = {
      [BotType.LEGITIMATE]: 0,
      [BotType.SUSPICIOUS]: 0,
      [BotType.BOT]: 0,
      [BotType.CLICK_FRAUD]: 0,
      [BotType.TRAFFIC_FRAUD]: 0,
    }

    const byRiskLevel: Record<BotRiskLevel, number> = {
      [BotRiskLevel.LOW]: 0,
      [BotRiskLevel.MEDIUM]: 0,
      [BotRiskLevel.HIGH]: 0,
      [BotRiskLevel.CRITICAL]: 0,
    }

    const ipCounts = new Map<string, number>()
    const userAgentCounts = new Map<string, number>()
    let blockedCount = 0

    Array.from(this.signatures.values()).forEach(sig => {
      byType[sig.botType]++
      byRiskLevel[sig.riskLevel]++

      if (sig.blocked) {
        blockedCount++
      }

      ipCounts.set(sig.ipAddress, (ipCounts.get(sig.ipAddress) || 0) + 1)
      userAgentCounts.set(sig.userAgent, (userAgentCounts.get(sig.userAgent) || 0) + 1)
    })

    const botPercentage = this.totalRequests > 0 ? (this.botRequests / this.totalRequests) * 100 : 0
    const estimatedFraudCost = this.fraudulentClicks * 0.5 // Assume $0.50 per fraudulent click

    return {
      totalRequests: this.totalRequests,
      botRequests: this.botRequests,
      botPercentage,
      byType,
      byRiskLevel,
      blockedRequests: blockedCount,
      fraudulentClicks: this.fraudulentClicks,
      fraudulentImpressions: this.fraudulentImpressions,
      estimatedFraudCost,
      topBotIPs: Array.from(ipCounts.entries())
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topBotUserAgents: Array.from(userAgentCounts.entries())
        .map(([userAgent, count]) => ({ userAgent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    }
  }

  /**
   * Get bot signatures with filters
   */
  getSignatures(filters?: {
    botType?: BotType
    riskLevel?: BotRiskLevel
    blocked?: boolean
    limit?: number
  }): BotSignature[] {
    let results = Array.from(this.signatures.values())

    if (filters?.botType) {
      results = results.filter(s => s.botType === filters.botType)
    }
    if (filters?.riskLevel) {
      results = results.filter(s => s.riskLevel === filters.riskLevel)
    }
    if (filters?.blocked !== undefined) {
      results = results.filter(s => s.blocked === filters.blocked)
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters?.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  /**
   * Block IP address
   */
  blockIP(ipAddress: string): void {
    this.blockedIPs.add(ipAddress)
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress)
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress)
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs)
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.signatures.clear()
    this.blockedIPs.clear()
    this.blockedUserAgents.clear()
    this.totalRequests = 0
    this.botRequests = 0
    this.fraudulentClicks = 0
    this.fraudulentImpressions = 0
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateId(): string {
    return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(ipAddress: string, userAgent: string): string {
    const data = `${ipAddress}:${userAgent}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private detectSignals(signals: BotSignals): string[] {
    const detected: string[] = []

    // Behavioral signals
    if (signals.requestRate > this.thresholds.requestRatePerSecond) {
      detected.push('high_request_rate')
    }
    if (signals.clickRate > this.thresholds.clickRatePercentage) {
      detected.push('high_click_rate')
    }
    if (signals.conversionRate > this.thresholds.conversionRatePercentage) {
      detected.push('high_conversion_rate')
    }
    if (signals.sessionDuration < this.thresholds.sessionDurationMs) {
      detected.push('short_session_duration')
    }
    if (signals.pageViewsPerSession > this.thresholds.pageViewsPerSession) {
      detected.push('excessive_page_views')
    }
    if (signals.bounceRate > this.thresholds.bounceRatePercentage) {
      detected.push('high_bounce_rate')
    }

    // Technical signals
    if (!signals.hasJavaScript) {
      detected.push('no_javascript')
    }
    if (!signals.hasCookies) {
      detected.push('no_cookies')
    }
    if (!signals.hasLocalStorage) {
      detected.push('no_local_storage')
    }

    // Network signals
    if (signals.ipReputation < this.thresholds.ipReputationThreshold) {
      detected.push('bad_ip_reputation')
    }
    if (signals.isVPN) {
      detected.push('vpn_detected')
    }
    if (signals.isProxy) {
      detected.push('proxy_detected')
    }
    if (signals.isDataCenter) {
      detected.push('datacenter_ip')
    }

    // Timing signals
    if (!signals.mouseMovement) {
      detected.push('no_mouse_movement')
    }
    if (!signals.keyboardInput) {
      detected.push('no_keyboard_input')
    }
    if (!signals.scrollBehavior) {
      detected.push('no_scroll_behavior')
    }
    if (signals.clickPattern === 'pattern') {
      detected.push('pattern_click_behavior')
    }

    // Content signals
    if (signals.adViewTime < this.thresholds.adViewTimeMs) {
      detected.push('short_ad_view_time')
    }
    if (!signals.adInteraction) {
      detected.push('no_ad_interaction')
    }

    return detected
  }

  private classifyBot(signals: string[], botSignals: BotSignals): BotType {
    const signalCount = signals.length

    // Click fraud indicators
    if (signals.includes('high_click_rate') && signals.includes('short_session_duration')) {
      return BotType.CLICK_FRAUD
    }

    // Traffic fraud indicators
    if (signals.includes('datacenter_ip') && signals.includes('no_mouse_movement')) {
      return BotType.TRAFFIC_FRAUD
    }

    // Bot indicators
    if (
      signals.includes('no_javascript') ||
      signals.includes('no_cookies') ||
      signals.includes('pattern_click_behavior') ||
      (signals.includes('vpn_detected') && signals.includes('datacenter_ip'))
    ) {
      return BotType.BOT
    }

    // Suspicious indicators
    if (signalCount >= 3) {
      return BotType.SUSPICIOUS
    }

    return BotType.LEGITIMATE
  }

  private calculateRiskLevel(botType: BotType, signals: string[]): BotRiskLevel {
    if (botType === BotType.CLICK_FRAUD || botType === BotType.TRAFFIC_FRAUD) {
      return BotRiskLevel.CRITICAL
    }

    if (botType === BotType.BOT) {
      return BotRiskLevel.HIGH
    }

    if (botType === BotType.SUSPICIOUS) {
      if (signals.length >= 5) {
        return BotRiskLevel.HIGH
      }
      if (signals.length >= 3) {
        return BotRiskLevel.MEDIUM
      }
      return BotRiskLevel.LOW
    }

    return BotRiskLevel.LOW
  }

  private calculateConfidence(signals: string[], botSignals: BotSignals): number {
    let confidence = 0

    // Each signal adds confidence
    confidence += signals.length * 5

    // Strong indicators
    if (signals.includes('datacenter_ip')) confidence += 20
    if (signals.includes('no_javascript')) confidence += 25
    if (signals.includes('pattern_click_behavior')) confidence += 20
    if (signals.includes('high_click_rate')) confidence += 15

    // Weak indicators
    if (signals.includes('vpn_detected')) confidence += 5
    if (signals.includes('short_session_duration')) confidence += 5

    return Math.min(100, confidence)
  }

  private shouldBlock(signature: BotSignature): boolean {
    // Block critical risk levels
    if (signature.riskLevel === BotRiskLevel.CRITICAL) {
      return true
    }

    // Block high risk with high confidence
    if (signature.riskLevel === BotRiskLevel.HIGH && signature.confidence > 80) {
      return true
    }

    // Block specific bot types
    if (signature.botType === BotType.CLICK_FRAUD || signature.botType === BotType.TRAFFIC_FRAUD) {
      return true
    }

    return false
  }

  private cleanup(): void {
    const now = Date.now()
    const cutoffTime = now - this.retentionHours * 3600000

    const entriesToDelete: string[] = []
    this.signatures.forEach((sig, id) => {
      if (sig.timestamp.getTime() < cutoffTime) {
        entriesToDelete.push(id)
      }
    })

    entriesToDelete.forEach(id => this.signatures.delete(id))

    // Keep only maxSignatures
    if (this.signatures.size > this.maxSignatures) {
      const sorted = Array.from(this.signatures.entries())
        .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime())
        .slice(0, this.maxSignatures)

      this.signatures.clear()
      sorted.forEach(([id, sig]) => this.signatures.set(id, sig))
    }
  }
}

/**
 * Singleton instance
 */
export const botShieldPro = new BotShieldPro()
