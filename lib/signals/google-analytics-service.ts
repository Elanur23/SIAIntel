export interface PageMetrics {
  avgReadTimeSeconds: number
  engagementRate: number
  sessions: number
  activeUsers: number
}

class GoogleAnalyticsService {
  private cache = new Map<string, { metrics: PageMetrics; expiresAt: number }>()

  async getPageMetrics(articleUrl: string): Promise<PageMetrics | null> {
    const now = Date.now()
    const cached = this.cache.get(articleUrl)

    if (cached && cached.expiresAt > now) {
      return cached.metrics
    }

    // If GA integration is not configured, fail soft with null.
    if (!process.env.GA4_PROPERTY_ID && !process.env.GA4_MEASUREMENT_ID) {
      return null
    }

    const metrics: PageMetrics = {
      avgReadTimeSeconds: 0,
      engagementRate: 0,
      sessions: 0,
      activeUsers: 0,
    }

    this.cache.set(articleUrl, {
      metrics,
      expiresAt: now + 60 * 60 * 1000,
    })

    return metrics
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService()
