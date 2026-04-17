/**
 * SIA Intelligence — Signal Scanner API
 * GET /api/signals/scan
 *
 * Aggregates early-warning signals from four free sources in parallel:
 *  • SEC EDGAR 8-K filings   (material corporate events)
 *  • US Congress trades      (House + Senate disclosures)
 *  • Reddit financial pulse  (wallstreetbets, investing, CryptoCurrency, economics)
 *  • CoinGecko anomalies     (unusual crypto price / volume movements)
 *
 * Query params:
 *  min    — minimum score threshold (default: 50)
 *  limit  — max signals returned   (default: 30)
 *  source — filter by source type  (optional, comma-separated)
 *
 * Response cached for 2 minutes server-side.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchSecEdgarSignals }      from '@/lib/signals/sec-edgar'
import { fetchRedditSignals }        from '@/lib/signals/reddit-pulse'
import { fetchCapitolTradesSignals } from '@/lib/signals/capitol-trades'
import { fetchCoinGeckoAlerts }      from '@/lib/signals/coingecko-alerts'
import { filterAndRankSignals, deduplicateSignals } from '@/lib/signals/signal-scorer'
import type { RawSignal, SourceStats, SignalScanResult } from '@/lib/signals/types'
import { SOURCE_META, URGENCY_COLOR } from './constants'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const start = Date.now()
  const { searchParams } = req.nextUrl

  const minScore = Math.max(0, Math.min(100, parseInt(searchParams.get('min')    ?? '50', 10)))
  const limit    = Math.max(1, Math.min(100, parseInt(searchParams.get('limit')  ?? '30', 10)))
  const sourceFilter = searchParams.get('source')?.split(',').map(s => s.trim().toUpperCase())

  const stats: Record<string, SourceStats> = {
    sec:           { count: 0, errors: [] },
    reddit:        { count: 0, errors: [] },
    capitolTrades: { count: 0, errors: [] },
    coinGecko:     { count: 0, errors: [] },
  }

  // ── Fetch all sources in parallel ─────────────────────────────────────────
  const [secR, redditR, capitolR, cgR] = await Promise.allSettled([
    fetchSecEdgarSignals(),
    fetchRedditSignals(),
    fetchCapitolTradesSignals(),
    fetchCoinGeckoAlerts(),
  ])

  const allRaw: RawSignal[] = []

  if (secR.status === 'fulfilled') {
    allRaw.push(...secR.value)
    stats.sec.count = secR.value.length
  } else {
    stats.sec.errors.push(String(secR.reason?.message ?? 'Unknown error'))
    console.error('[signals/scan] SEC EDGAR error:', secR.reason)
  }

  if (redditR.status === 'fulfilled') {
    allRaw.push(...redditR.value)
    stats.reddit.count = redditR.value.length
  } else {
    stats.reddit.errors.push(String(redditR.reason?.message ?? 'Unknown error'))
    console.error('[signals/scan] Reddit error:', redditR.reason)
  }

  if (capitolR.status === 'fulfilled') {
    allRaw.push(...capitolR.value)
    stats.capitolTrades.count = capitolR.value.length
  } else {
    stats.capitolTrades.errors.push(String(capitolR.reason?.message ?? 'Unknown error'))
    console.error('[signals/scan] Capitol Trades error:', capitolR.reason)
  }

  if (cgR.status === 'fulfilled') {
    allRaw.push(...cgR.value)
    stats.coinGecko.count = cgR.value.length
  } else {
    stats.coinGecko.errors.push(String(cgR.reason?.message ?? 'Unknown error'))
    console.error('[signals/scan] CoinGecko error:', cgR.reason)
  }

  // ── Score, deduplicate, filter, rank ─────────────────────────────────────
  let signals = filterAndRankSignals(allRaw, minScore)
  signals     = deduplicateSignals(signals)

  // Optional source filter
  if (sourceFilter?.length) {
    signals = signals.filter(s => sourceFilter.includes(s.source))
  }

  signals = signals.slice(0, limit)

  // Attach UI metadata to each signal
  const enriched = signals.map(s => ({
    ...s,
    publishedAt: s.publishedAt, // Already string (ISO)
    sourceMeta: SOURCE_META[s.source] ?? { label: s.source, color: 'gray', icon: '📌' },
  }))

  const result: SignalScanResult & { signals: typeof enriched } = {
    signals:     enriched,
    scannedAt:   new Date().toISOString(),
    sources: {
      sec:           stats.sec,
      reddit:        stats.reddit,
      capitolTrades: stats.capitolTrades,
      coinGecko:     stats.coinGecko,
    },
    processingMs: Date.now() - start,
  }

  return NextResponse.json(
    {
      success: true,
      data: result,
      legal: {
        disclaimer:
          'Signals are aggregated from publicly available data sources (SEC EDGAR, STOCK Act disclosures, Reddit, CoinGecko). ' +
          'This content is for informational and research purposes only and does not constitute investment advice. ' +
          'SIA Intelligence is not a registered investment advisor or broker-dealer.',
        sources: [
          'SEC EDGAR public filings — sec.gov (17 CFR §240)',
          'Congressional disclosures — STOCK Act (5 U.S.C. App. 4 §101)',
          'Reddit public posts — reddit.com',
          'CoinGecko market data — coingecko.com',
        ],
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'X-Content-Disclaimer': 'informational-only-not-investment-advice',
      },
    },
  )
}
