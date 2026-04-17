/**
 * Ads Refresh Manager Pro
 * Client-side intelligent ad refresh
 */

class AdsRefreshManagerPro {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.refreshTimers = new Map()
    this.engagementData = {
      scrollDepth: 0,
      timeOnPage: 0,
      mouseMovements: 0,
      clicks: 0
    }
    this.startTime = Date.now()
    this.init()
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  init() {
    // Track engagement
    document.addEventListener('scroll', () => this.trackScroll())
    document.addEventListener('mousemove', () => this.trackMouseMovement())
    document.addEventListener('click', (e) => this.trackClick(e))

    // Send engagement data periodically
    setInterval(() => this.sendEngagementData(), 10000)

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup())
  }

  trackScroll() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    this.engagementData.scrollDepth = Math.max(this.engagementData.scrollDepth, scrollPercentage)
  }

  trackMouseMovement() {
    this.engagementData.mouseMovements++
  }

  trackClick(event) {
    if (event.target.closest('[data-ad-slot]')) {
      this.engagementData.clicks++
    }
  }

  /**
   * Schedule ad refresh
   */
  scheduleRefresh(placementId, interval, maxRefreshes = 5) {
    if (this.refreshTimers.has(placementId)) {
      clearInterval(this.refreshTimers.get(placementId).timer)
    }

    let refreshCount = 0
    const timer = setInterval(() => {
      if (refreshCount >= maxRefreshes) {
        clearInterval(timer)
        this.refreshTimers.delete(placementId)
        return
      }

      this.refreshAd(placementId)
      refreshCount++
    }, interval)

    this.refreshTimers.set(placementId, { timer, refreshCount })
  }

  /**
   * Refresh ad
   */
  refreshAd(placementId) {
    const adSlot = document.querySelector(`[data-ad-slot="${placementId}"]`)
    if (!adSlot) return

    // Track refresh
    this.trackRefresh(placementId, true)

    // Trigger ad refresh
    if (window.adsbygoogle) {
      try {
        window.adsbygoogle.push({})
      } catch (e) {
        console.error('Ad refresh error:', e)
      }
    }
  }

  /**
   * Track refresh
   */
  trackRefresh(placementId, success) {
    const data = {
      sessionId: this.sessionId,
      placementId,
      success,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ads/refresh/track', JSON.stringify(data))
  }

  /**
   * Send engagement data
   */
  sendEngagementData() {
    const timeOnPage = Date.now() - this.startTime

    const data = {
      sessionId: this.sessionId,
      scrollDepth: this.engagementData.scrollDepth,
      timeOnPage,
      mouseMovements: this.engagementData.mouseMovements,
      clicks: this.engagementData.clicks,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ads/refresh/engagement', JSON.stringify(data))
  }

  /**
   * Get optimal refresh schedule
   */
  async getOptimalSchedule(placementId) {
    try {
      const response = await fetch('/api/ads/refresh/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-schedule',
          placementId,
          sessionId: this.sessionId,
          engagement: this.engagementData
        })
      })

      const data = await response.json()
      if (data.success) {
        return data.data
      }
    } catch (error) {
      console.error('Failed to get optimal schedule:', error)
    }

    return { interval: 60000, maxRefreshes: 5 }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.refreshTimers.forEach(({ timer }) => clearInterval(timer))
    this.sendEngagementData()
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adsRefreshManager = new AdsRefreshManagerPro()
  })
} else {
  window.adsRefreshManager = new AdsRefreshManagerPro()
}
