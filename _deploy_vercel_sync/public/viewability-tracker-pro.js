/**
 * Viewability Tracker Pro - Client Script
 * Enterprise-grade ad viewability tracking
 * Tracks: viewability, bot detection, brand safety
 */

(function() {
  'use strict'

  const ViewabilityTrackerPro = {
    config: {
      apiEndpoint: '/api/viewability/track',
      trackingInterval: 100,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableBotDetection: true,
      enableBrandSafety: true
    },

    sessionId: null,
    sessionData: {
      clicksPerSecond: 0,
      mouseMovements: 0,
      scrollEvents: 0,
      pageLoadTime: 0,
      actionIntervals: [],
      lastActionTime: Date.now()
    },

    /**
     * Initialize tracker
     */
    init() {
      this.sessionId = this.generateSessionId()
      this.setupEventListeners()
      this.trackPageLoadTime()
      this.startViewabilityTracking()
      this.startSessionTracking()
    },

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      document.addEventListener('click', () => this.recordClick())
      document.addEventListener('mousemove', () => this.recordMouseMovement())
      document.addEventListener('scroll', () => this.recordScroll())
    },

    /**
     * Track page load time
     */
    trackPageLoadTime() {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        this.sessionData.pageLoadTime = loadTime
      }
    },

    /**
     * Record click event
     */
    recordClick() {
      this.sessionData.clicksPerSecond++
      this.recordActionInterval()

      // Reset counter every second
      setTimeout(() => {
        this.sessionData.clicksPerSecond = 0
      }, 1000)
    },

    /**
     * Record mouse movement
     */
    recordMouseMovement() {
      this.sessionData.mouseMovements++
      this.recordActionInterval()
    },

    /**
     * Record scroll event
     */
    recordScroll() {
      this.sessionData.scrollEvents++
      this.recordActionInterval()
    },

    /**
     * Record action interval for bot detection
     */
    recordActionInterval() {
      const now = Date.now()
      const interval = now - this.sessionData.lastActionTime
      this.sessionData.actionIntervals.push(interval)

      // Keep only last 20 intervals
      if (this.sessionData.actionIntervals.length > 20) {
        this.sessionData.actionIntervals.shift()
      }

      this.sessionData.lastActionTime = now
    },

    /**
     * Start viewability tracking
     */
    startViewabilityTracking() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target.classList.contains('ad-container')) {
            this.trackAdViewability(entry)
          }
        })
      }, {
        threshold: [0, 0.25, 0.5, 0.75, 1]
      })

      // Observe all ad containers
      document.querySelectorAll('.ad-container, [data-ad-slot]').forEach((ad) => {
        observer.observe(ad)
      })
    },

    /**
     * Track individual ad viewability
     */
    trackAdViewability(entry) {
      const adId = entry.target.id || entry.target.getAttribute('data-ad-id')
      const placementId = entry.target.getAttribute('data-placement-id') || 'unknown'

      const rect = entry.boundingClientRect
      const visibilityPercentage = entry.intersectionRatio * 100

      // Track viewable time
      if (!entry.target._viewabilityStart) {
        entry.target._viewabilityStart = Date.now()
      }

      const viewableTime = Date.now() - entry.target._viewabilityStart

      this.sendViewabilityData({
        adId,
        placementId,
        visibilityPercentage: Math.round(visibilityPercentage),
        viewableTime,
        totalTime: Date.now() - entry.target._loadTime || 0
      })
    },

    /**
     * Start session tracking
     */
    startSessionTracking() {
      setInterval(() => {
        this.sendSessionData()
      }, this.config.trackingInterval)
    },

    /**
     * Send viewability data to server
     */
    sendViewabilityData(data) {
      const payload = {
        sessionId: this.sessionId,
        action: 'track-viewability',
        data: {
          ...data,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }

      this.sendBeacon(payload)
    },

    /**
     * Send session data to server
     */
    sendSessionData() {
      const payload = {
        sessionId: this.sessionId,
        action: 'track-session',
        data: {
          ...this.sessionData,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }

      this.sendBeacon(payload)
    },

    /**
     * Send data to server using Beacon API
     */
    sendBeacon(data) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })

      // Use sendBeacon if available (doesn't block page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.config.apiEndpoint, blob)
      } else {
        // Fallback to fetch
        fetch(this.config.apiEndpoint, {
          method: 'POST',
          body: blob,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {
          // Silently fail - don't block user experience
        })
      }
    },

    /**
     * Get session data
     */
    getSessionData() {
      return {
        sessionId: this.sessionId,
        ...this.sessionData
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ViewabilityTrackerPro.init()
    })
  } else {
    ViewabilityTrackerPro.init()
  }

  // Expose globally for debugging
  window.ViewabilityTrackerPro = ViewabilityTrackerPro
})()
