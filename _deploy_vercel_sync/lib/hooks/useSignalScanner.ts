/**
 * SIA Intelligence — Signal Scanner Hook
 *
 * Fetches early-warning signals from /api/signals/scan and refreshes
 * every 3 minutes (cache aligned). Signals are sourced from SEC EDGAR,
 * US Congress disclosures, Reddit Pulse, and CoinGecko anomalies.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface SignalItem {
  id:          string
  source:      string
  category:    string
  title:       string
  summary:     string
  entities:    string[]
  url:         string
  publishedAt: string
  score:       number
  urgency:     'BREAKING' | 'HIGH' | 'MEDIUM' | 'WATCH'
  sentiment:   'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED'
  boostedBy:   string[]
  sourceMeta:  { label: string; color: string; icon: string }
  metadata:    Record<string, unknown>
}

export interface ScanStats {
  sec:           { count: number; errors: string[] }
  reddit:        { count: number; errors: string[] }
  capitolTrades: { count: number; errors: string[] }
  coinGecko:     { count: number; errors: string[] }
  processingMs:  number
  scannedAt:     string
}

interface UseSignalScannerOptions {
  minScore?:     number   // default: 50
  limit?:        number   // default: 25
  autoRefresh?:  boolean  // default: true
  refreshMs?:    number   // default: 180_000 (3 min)
}

interface UseSignalScannerReturn {
  signals:    SignalItem[]
  stats:      ScanStats | null
  isLoading:  boolean
  error:      string | null
  refresh:    () => void
  lastScan:   Date | null
}

const REFRESH_DEFAULT = 3 * 60 * 1000 // 3 minutes

export function useSignalScanner({
  minScore    = 50,
  limit       = 25,
  autoRefresh = true,
  refreshMs   = REFRESH_DEFAULT,
}: UseSignalScannerOptions = {}): UseSignalScannerReturn {
  const [signals,   setSignals]   = useState<SignalItem[]>([])
  const [stats,     setStats]     = useState<ScanStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [lastScan,  setLastScan]  = useState<Date | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSignals = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      setIsLoading(true)

      const url = `/api/signals/scan?min=${minScore}&limit=${limit}`
      const res = await fetch(url, { signal: ctrl.signal })

      if (!res.ok) throw new Error(`Signal scan failed: ${res.status}`)

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Scan returned error')

      const { signals: raw, sources, processingMs, scannedAt } = json.data

      setSignals(raw ?? [])
      setStats({
        sec:           sources?.sec           ?? { count: 0, errors: [] },
        reddit:        sources?.reddit        ?? { count: 0, errors: [] },
        capitolTrades: sources?.capitolTrades ?? { count: 0, errors: [] },
        coinGecko:     sources?.coinGecko     ?? { count: 0, errors: [] },
        processingMs:  processingMs ?? 0,
        scannedAt:     scannedAt    ?? new Date().toISOString(),
      })
      setLastScan(new Date())
      setError(null)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown scan error')
    } finally {
      setIsLoading(false)
    }
  }, [minScore, limit])

  // Initial fetch
  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchSignals, refreshMs)
    return () => clearInterval(id)
  }, [autoRefresh, refreshMs, fetchSignals])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { signals, stats, isLoading, error, refresh: fetchSignals, lastScan }
}
