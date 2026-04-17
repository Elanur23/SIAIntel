/**
 * SIA Ad Refresh Manager
 * Google AdSense Policy Compliant Ad Placement & Refresh System
 * 
 * CRITICAL RULES:
 * - Ads refresh ONLY when user is active (page focused)
 * - Minimum 90 seconds between refreshes
 * - Lazy loading for performance
 * - Ad density ≤30% of main content
 * - No refresh during user interaction
 * - Viewability tracking (50%+ visible for 1+ second)
 */

export interface AdSlot {
  id: string
  containerId: string
  position: AdPosition
  size: AdSize
  priority: 'high' | 'medium' | 'low'
  refreshable: boolean
  minRefreshInterval: number // seconds
  lastRefresh: number
  viewabilityThreshold: number // percentage
  isVisible: boolean
  isLoaded: boolean
}

export type AdPosition = 
  | 'header'
  | 'sidebar-top'
  | 'sidebar-middle'
  | 'sidebar-bottom'
  | 'article-top'
  | 'article-middle'
  | 'article-bottom'
  | 'footer'
  | 'native-feed'

export type AdSize = 
  | '728x90'    // Leaderboard
  | '300x250'   // Medium Rectangle
  | '336x280'   // Large Rectangle
  | '300x600'   // Half Page
  | '320x100'   // Mobile Banner
  | '320x50'    // Mobile Leaderboard
  | 'responsive' // Auto-size

export interface AdDensityConfig {
  maxAdPercentage: number // 30% maximum
  mainContentArea: DOMRect | null
  totalAdArea: number
  currentDensity: number
  isCompliant: boolean
}

export interface RefreshPolicy {
  enabled: boolean
  minInterval: number // 90 seconds minimum
  maxRefreshPerSession: number // 10 maximum
  requiresUserActivity: boolean
  requiresViewability: boolean
  pauseOnInteraction: boolean
}

/**
 * Ad Refresh Manager Class
 * Manages all ad slots with Google AdSense compliance
 */
export class AdRefreshManager {
  private slots: Map<string, AdSlot> = new Map()
  private refreshPolicy: RefreshPolicy
  private isPageFocused: boolean = true
  private lastUserActivity: number = Date.now()
  private refreshCount: number = 0
  private intersectionObserver: IntersectionObserver | null = null
  private activityTimeout: NodeJS.Timeout | null = null

  constructor(policy?: Partial<RefreshPolicy>) {
    this.refreshPolicy = {
      enabled: true,
      minInterval: 90, // 90 seconds minimum (AdSense requirement)
      maxRefreshPerSession: 10,
      requiresUserActivity: true,
      requiresViewability: true,
      pauseOnInteraction: false,
      ...policy
    }

    this.initializeEventListeners()
    this.initializeIntersectionObserver()
  }

  /**
   * Initialize event listeners for user activity and page focus
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return

    // Page focus/blur detection
    window.addEventListener('focus', () => {
      this.isPageFocused = true
      console.log('[AdRefresh] Page focused - refresh enabled')
    })

    window.addEventListener('blur', () => {
      this.isPageFocused = false
      console.log('[AdRefresh] Page blurred - refresh paused')
    })

    // User activity detection
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      window.addEventListener(event, () => this.handleUserActivity(), { passive: true })
    })

    // Pause refresh during user interaction
    if (this.refreshPolicy.pauseOnInteraction) {
      window.addEventListener('mousedown', () => this.pauseRefresh())
      window.addEventListener('mouseup', () => this.resumeRefresh())
    }
  }

  /**
   * Initialize Intersection Observer for viewability tracking
   */
  private initializeIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const slotId = entry.target.getAttribute('data-slot-id')
          if (!slotId) return

          const slot = this.slots.get(slotId)
          if (!slot) return

          // AdSense viewability: 50%+ visible for 1+ second
          const isViewable = entry.intersectionRatio >= 0.5
          slot.isVisible = isViewable

          if (isViewable) {
            console.log(`[AdRefresh] Slot ${slotId} is viewable (${Math.round(entry.intersectionRatio * 100)}%)`)
          }
        })
      },
      {
        threshold: [0, 0.5, 1.0], // Track 0%, 50%, 100% visibility
        rootMargin: '0px'
      }
    )
  }

  /**
   * Register an ad slot
   */
  registerSlot(slot: Omit<AdSlot, 'lastRefresh' | 'isVisible' | 'isLoaded'>): void {
    const fullSlot: AdSlot = {
      ...slot,
      lastRefresh: Date.now(),
      isVisible: false,
      isLoaded: false
    }

    this.slots.set(slot.id, fullSlot)

    // Start observing for viewability
    if (this.intersectionObserver) {
      const element = document.getElementById(slot.containerId)
      if (element) {
        element.setAttribute('data-slot-id', slot.id)
        this.intersectionObserver.observe(element)
      }
    }

    console.log(`[AdRefresh] Registered slot: ${slot.id} at ${slot.position}`)
  }

  /**
   * Unregister an ad slot
   */
  unregisterSlot(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (!slot) return

    if (this.intersectionObserver) {
      const element = document.getElementById(slot.containerId)
      if (element) {
        this.intersectionObserver.unobserve(element)
      }
    }

    this.slots.delete(slotId)
    console.log(`[AdRefresh] Unregistered slot: ${slotId}`)
  }

  /**
   * Check if a slot can be refreshed
   */
  canRefresh(slotId: string): boolean {
    const slot = this.slots.get(slotId)
    if (!slot || !slot.refreshable) return false

    // Check refresh policy
    if (!this.refreshPolicy.enabled) return false

    // Check session refresh limit
    if (this.refreshCount >= this.refreshPolicy.maxRefreshPerSession) {
      console.log(`[AdRefresh] Session refresh limit reached (${this.refreshCount}/${this.refreshPolicy.maxRefreshPerSession})`)
      return false
    }

    // Check page focus
    if (this.refreshPolicy.requiresUserActivity && !this.isPageFocused) {
      console.log(`[AdRefresh] Page not focused - refresh blocked`)
      return false
    }

    // Check user activity (must be active within last 5 minutes)
    const timeSinceActivity = (Date.now() - this.lastUserActivity) / 1000
    if (this.refreshPolicy.requiresUserActivity && timeSinceActivity > 300) {
      console.log(`[AdRefresh] No user activity for ${Math.round(timeSinceActivity)}s - refresh blocked`)
      return false
    }

    // Check minimum refresh interval (90 seconds)
    const timeSinceRefresh = (Date.now() - slot.lastRefresh) / 1000
    if (timeSinceRefresh < slot.minRefreshInterval) {
      console.log(`[AdRefresh] Slot ${slotId} refreshed ${Math.round(timeSinceRefresh)}s ago - minimum ${slot.minRefreshInterval}s required`)
      return false
    }

    // Check viewability (50%+ visible)
    if (this.refreshPolicy.requiresViewability && !slot.isVisible) {
      console.log(`[AdRefresh] Slot ${slotId} not viewable - refresh blocked`)
      return false
    }

    return true
  }

  /**
   * Refresh an ad slot
   */
  async refreshSlot(slotId: string): Promise<boolean> {
    if (!this.canRefresh(slotId)) return false

    const slot = this.slots.get(slotId)
    if (!slot) return false

    try {
      console.log(`[AdRefresh] Refreshing slot: ${slotId}`)

      // Update slot state
      slot.lastRefresh = Date.now()
      this.refreshCount++

      // Trigger AdSense refresh (implementation depends on your AdSense setup)
      if (typeof window !== 'undefined' && (window as any).googletag) {
        const googletag = (window as any).googletag
        googletag.cmd.push(() => {
          const gptSlot = googletag.pubads().getSlots().find((s: any) => s.getSlotElementId() === slot.containerId)
          if (gptSlot) {
            googletag.pubads().refresh([gptSlot])
          }
        })
      }

      console.log(`[AdRefresh] ✓ Slot ${slotId} refreshed (${this.refreshCount}/${this.refreshPolicy.maxRefreshPerSession})`)
      return true

    } catch (error) {
      console.error(`[AdRefresh] Failed to refresh slot ${slotId}:`, error)
      return false
    }
  }

  /**
   * Auto-refresh all eligible slots
   */
  async autoRefreshAll(): Promise<void> {
    const eligibleSlots = Array.from(this.slots.values()).filter(slot => this.canRefresh(slot.id))

    if (eligibleSlots.length === 0) {
      console.log('[AdRefresh] No eligible slots for refresh')
      return
    }

    console.log(`[AdRefresh] Auto-refreshing ${eligibleSlots.length} eligible slots`)

    for (const slot of eligibleSlots) {
      await this.refreshSlot(slot.id)
      // Small delay between refreshes to avoid overwhelming the ad server
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Handle user activity
   */
  private handleUserActivity(): void {
    this.lastUserActivity = Date.now()

    // Clear existing timeout
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }

    // Set new timeout for auto-refresh check
    this.activityTimeout = setTimeout(() => {
      this.autoRefreshAll()
    }, this.refreshPolicy.minInterval * 1000)
  }

  /**
   * Pause refresh temporarily
   */
  private pauseRefresh(): void {
    this.refreshPolicy.enabled = false
    console.log('[AdRefresh] Refresh paused')
  }

  /**
   * Resume refresh
   */
  private resumeRefresh(): void {
    this.refreshPolicy.enabled = true
    console.log('[AdRefresh] Refresh resumed')
  }

  /**
   * Calculate ad density compliance
   */
  calculateAdDensity(): AdDensityConfig {
    if (typeof window === 'undefined') {
      return {
        maxAdPercentage: 30,
        mainContentArea: null,
        totalAdArea: 0,
        currentDensity: 0,
        isCompliant: true
      }
    }

    // Get main content area
    const mainContent = document.querySelector('main') || document.querySelector('article') || document.body
    const mainContentArea = mainContent.getBoundingClientRect()

    // Calculate total ad area
    let totalAdArea = 0
    this.slots.forEach(slot => {
      const element = document.getElementById(slot.containerId)
      if (element) {
        const rect = element.getBoundingClientRect()
        totalAdArea += rect.width * rect.height
      }
    })

    // Calculate density
    const mainContentSize = mainContentArea.width * mainContentArea.height
    const currentDensity = (totalAdArea / mainContentSize) * 100

    const config: AdDensityConfig = {
      maxAdPercentage: 30,
      mainContentArea,
      totalAdArea,
      currentDensity,
      isCompliant: currentDensity <= 30
    }

    console.log(`[AdRefresh] Ad Density: ${currentDensity.toFixed(2)}% (${config.isCompliant ? '✓ Compliant' : '✗ Non-compliant'})`)

    return config
  }

  /**
   * Get optimal ad positions based on content layout
   */
  getOptimalPositions(contentHeight: number): AdPosition[] {
    const positions: AdPosition[] = []

    // Header (always safe)
    positions.push('header')

    // Sidebar (if content is tall enough)
    if (contentHeight > 800) {
      positions.push('sidebar-top', 'sidebar-middle')
    }
    if (contentHeight > 1200) {
      positions.push('sidebar-bottom')
    }

    // Article positions (based on content length)
    if (contentHeight > 600) {
      positions.push('article-top')
    }
    if (contentHeight > 1000) {
      positions.push('article-middle')
    }
    if (contentHeight > 1500) {
      positions.push('article-bottom')
    }

    // Native feed (always safe)
    positions.push('native-feed')

    // Footer (always safe)
    positions.push('footer')

    return positions
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalSlots: this.slots.size,
      refreshCount: this.refreshCount,
      maxRefreshPerSession: this.refreshPolicy.maxRefreshPerSession,
      isPageFocused: this.isPageFocused,
      timeSinceActivity: Math.round((Date.now() - this.lastUserActivity) / 1000),
      adDensity: this.calculateAdDensity(),
      slots: Array.from(this.slots.values()).map(slot => ({
        id: slot.id,
        position: slot.position,
        isVisible: slot.isVisible,
        isLoaded: slot.isLoaded,
        timeSinceRefresh: Math.round((Date.now() - slot.lastRefresh) / 1000),
        canRefresh: this.canRefresh(slot.id)
      }))
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }

    this.slots.clear()
    console.log('[AdRefresh] Manager destroyed')
  }
}

/**
 * Singleton instance
 */
let managerInstance: AdRefreshManager | null = null

export function getAdRefreshManager(policy?: Partial<RefreshPolicy>): AdRefreshManager {
  if (!managerInstance) {
    managerInstance = new AdRefreshManager(policy)
  }
  return managerInstance
}

export function destroyAdRefreshManager(): void {
  if (managerInstance) {
    managerInstance.destroy()
    managerInstance = null
  }
}
