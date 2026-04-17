/**
 * useSearch Hook - Server-Side Search Integration
 * 
 * Features:
 * - Debounced search queries
 * - Loading states
 * - Error handling
 * - Pagination support
 * - Filter support
 */

import { useState, useEffect, useCallback } from 'react'

interface SearchResult {
  id: string
  title: string
  summary: string
  content: string
  insight: string
  risk: string
  category: string
  sentiment: string
  confidence: number
  impact: number
  region: string
  language: string
  image: string
  createdAt: string
  updatedAt: string
  relevanceScore: number
}

interface SearchResponse {
  success: boolean
  data?: {
    results: SearchResult[]
    pagination: {
      page: number
      limit: number
      totalResults: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
    query: {
      q: string
      category?: string
      language?: string
      sortBy: string
      sortOrder: string
    }
  }
  error?: string
  timestamp?: string
}

interface UseSearchOptions {
  query: string
  category?: string
  language?: string
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'date' | 'impact' | 'confidence'
  sortOrder?: 'asc' | 'desc'
  enabled?: boolean
  debounceMs?: number
}

interface UseSearchReturn {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalResults: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  } | null
  refetch: () => void
}

export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const {
    query,
    category,
    language,
    page = 1,
    limit = 20,
    sortBy = 'relevance',
    sortOrder = 'desc',
    enabled = true,
    debounceMs = 300,
  } = options

  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<NonNullable<SearchResponse['data']>['pagination'] | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Fetch search results
  const fetchResults = useCallback(async () => {
    // Don't search if query is empty or disabled
    if (!debouncedQuery.trim() || !enabled) {
      setResults([])
      setPagination(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      if (category && category !== 'ALL') {
        params.append('category', category)
      }

      if (language) {
        params.append('language', language)
      }

      // Fetch from API
      const response = await fetch(`/api/search?${params.toString()}`)
      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.success && data.data) {
        setResults(data.data.results)
        setPagination(data.data.pagination || null)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('[useSearch] Error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setPagination(null)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, category, language, page, limit, sortBy, sortOrder, enabled])

  // Fetch on dependency changes
  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return {
    results,
    isLoading,
    error,
    pagination,
    refetch: fetchResults,
  }
}
