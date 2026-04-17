/**
 * CTR Tracker Pro
 * Client-side tracking for CTR optimization
 */

class CTRTracker {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.clickData = []
    this.startTime = Date.now()
    this.init()
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  init() {
    // Track clicks
    document.addEventListener('click', (e) => this.trackClick(e))

    // Track scroll depth
    window.addEventListener('scroll', () => this.trackScroll())

    // Track mouse movement
    document.addEventListener('mousemove', (e) => this.trackMouseMovement(e))

    // Send data on page unload
    window.addEventListener('beforeunload', () => this.sendData())
  }

  trackClick(event) {
    const target = event.target
    const rect = target.getBoundingClientRect()

    this.clickData.push({
      x: event.clientX,
      y: event.clientY,
      elementType: target.tagName,
      elementClass: target.className,
      elementId: target.id,
      timestamp: Date.now() - this.startTime
    })

    // Send click data to server
    this.sendClickData(event.clientX, event.clientY, target)
  }

  trackScroll() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    
    // Send scroll depth periodically
    if (Math.floor(scrollPercentage) % 10 === 0) {
      this.sendScrollData(scrollPercentage)
    }
  }

  trackMouseMovement(event) {
    // Sample mouse movements (every 500ms)
    if (Date.now() % 500 < 50) {
      this.sendMouseData(event.clientX, event.clientY)
    }
  }

  sendClickData(x, y, element) {
    const data = {
      sessionId: this.sessionId,
      type: 'click',
      x,
      y,
      element: {
        tag: element.tagName,
        class: element.className,
        id: element.id,
        text: element.textContent?.substring(0, 100)
      },
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ctr/track', JSON.stringify(data))
  }

  sendScrollData(percentage) {
    const data = {
      sessionId: this.sessionId,
      type: 'scroll',
      scrollPercentage: percentage,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ctr/track', JSON.stringify(data))
  }

  sendMouseData(x, y) {
    const data = {
      sessionId: this.sessionId,
      type: 'mouse',
      x,
      y,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ctr/track', JSON.stringify(data))
  }

  sendData() {
    const data = {
      sessionId: this.sessionId,
      type: 'session',
      duration: Date.now() - this.startTime,
      clickCount: this.clickData.length,
      clicks: this.clickData,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/ctr/track', JSON.stringify(data))
  }
}

// Initialize tracker
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ctrTracker = new CTRTracker()
  })
} else {
  window.ctrTracker = new CTRTracker()
}
