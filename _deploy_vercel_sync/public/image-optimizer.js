/**
 * Image Optimizer Pro
 * Client-side image optimization and lazy loading
 */

class ImageOptimizerPro {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.optimizedImages = new Map()
    this.init()
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  init() {
    // Lazy load images
    this.setupLazyLoading()

    // Optimize images on page load
    window.addEventListener('load', () => this.optimizePageImages())

    // Track image performance
    this.trackImagePerformance()
  }

  /**
   * Setup lazy loading
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              img.classList.add('loaded')
            }
            observer.unobserve(img)
          }
        })
      })

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    } else {
      // Fallback for older browsers
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src
      })
    }
  }

  /**
   * Optimize page images
   */
  optimizePageImages() {
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      this.optimizeImage(img)
    })
  }

  /**
   * Optimize individual image
   */
  optimizeImage(img) {
    const src = img.src || img.dataset.src
    if (!src) return

    // Get image dimensions
    const width = img.width || img.naturalWidth || 800
    const height = img.height || img.naturalHeight || 600

    // Send optimization request
    this.sendOptimizationRequest(src, width, height, img.alt)

    // Add responsive srcset
    this.addResponsiveSrcSet(img, src)
  }

  /**
   * Add responsive srcset
   */
  addResponsiveSrcSet(img, src) {
    const srcSet = [
      `${src}?w=320&h=240 320w`,
      `${src}?w=640&h=480 640w`,
      `${src}?w=1024&h=768 1024w`,
      `${src}?w=1280&h=960 1280w`,
      `${src}?w=1920&h=1440 1920w`
    ].join(', ')

    img.srcset = srcSet
    img.sizes = '(max-width: 320px) 100vw, (max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw'
  }

  /**
   * Send optimization request
   */
  sendOptimizationRequest(src, width, height, alt) {
    const data = {
      sessionId: this.sessionId,
      imageUrl: src,
      width,
      height,
      altText: alt,
      timestamp: new Date().toISOString()
    }

    navigator.sendBeacon('/api/images/optimize', JSON.stringify(data))
  }

  /**
   * Track image performance
   */
  trackImagePerformance() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.initiatorType === 'img') {
              const data = {
                sessionId: this.sessionId,
                imageUrl: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                timestamp: new Date().toISOString()
              }

              navigator.sendBeacon('/api/images/track', JSON.stringify(data))
            }
          }
        })

        observer.observe({ entryTypes: ['resource'] })
      } catch (e) {
        console.error('Performance observer error:', e)
      }
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(imageUrl, width, height, format = 'webp') {
    return `${imageUrl}?format=${format}&w=${width}&h=${height}&q=85`
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizerPro()
  })
} else {
  window.imageOptimizer = new ImageOptimizerPro()
}
