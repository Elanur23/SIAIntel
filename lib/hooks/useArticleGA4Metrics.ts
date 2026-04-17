/**
 * SIA ARTICLE GA4 METRICS HOOK
 * React hook for fetching real-time GA4 behavioral metrics for articles
 */

import { useState, useEffect } from 'react'

export interface ArticleGA4Metrics {
  avg_read_time_seconds: number
  engagement_rate: number
  sessions: number
  active_users: number
}

export interface UseArticleGA4MetricsResult {
  metrics: ArticleGA4Metrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Fetches GA4 metrics for a specific article URL
 * 
 * @param articleUrl - Full URL of the article (e.g., https://siaintel.com/en/reports/cbsb)
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * 
 * @example
 * ```tsx
 * const { metrics, loading, error } = useArticleGA4Metrics('https://siaintel.com/en/reports/cbsb')
 * 
 * if (loading) return <Spinner />
 * if (error) return <Error message={error} />
 * 
 * return (
 *   <div>
 *     <p>Read Time: {metrics.avg_read_time_seconds}s</p>
 *     <p>Engagement: {(metrics.engagement_rate * 100).toFixed(1)}%</p>
 *   </div>
 * )
 * ```
 */
export function useArticleGA4Metrics(
  articleUrl: string | null,
  autoFetch: boolean = true
): UseArticleGA4MetricsResult {
  const [metrics, setMetrics] = useState<ArticleGA4Metrics | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    if (!articleUrl) {
      setError('No article URL provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/article-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GA4 metrics')
      }

      if (data.success) {
        setMetrics(data.data)
      } else {
        setMetrics({
          avg_read_time_seconds: 0,
          engagement_rate: 0,
          sessions: 0,
          active_users: 0,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred')
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && articleUrl) {
      fetchMetrics()
    }
  }, [articleUrl, autoFetch])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}

/**
 * Batch fetch GA4 metrics for multiple articles
 * 
 * @param articleUrls - Array of article URLs
 * 
 * @example
 * ```tsx
 * const { metricsMap, loading } = useBatchArticleGA4Metrics([
 *   'https://siaintel.com/en/reports/cbsb',
 *   'https://siaintel.com/en/reports/btc-analysis'
 * ])
 * ```
 */
export function useBatchArticleGA4Metrics(articleUrls: string[]) {
  const [metricsMap, setMetricsMap] = useState<Record<string, ArticleGA4Metrics>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBatchMetrics = async () => {
    if (articleUrls.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const promises = articleUrls.map(async (url) => {
        const response = await fetch('/api/analytics/article-metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleUrl: url }),
        })

        const data = await response.json()
        return { url, metrics: data.success ? data.data : null }
      })

      const results = await Promise.all(promises)
      
      const map: Record<string, ArticleGA4Metrics> = {}
      results.forEach(({ url, metrics }) => {
        if (metrics) {
          map[url] = metrics
        }
      })

      setMetricsMap(map)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch batch metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (articleUrls.length > 0) {
      fetchBatchMetrics()
    }
  }, [JSON.stringify(articleUrls)])

  return {
    metricsMap,
    loading,
    error,
    refetch: fetchBatchMetrics,
  }
}
