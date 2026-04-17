/**
 * SIA MARKET DATA API — v3.0
 * Lightweight ticker: no AI, free public APIs, 10-minute server-side cache.
 *
 * Sources:
 *  - Crypto  → CoinGecko (free, no key)
 *  - Equities → Yahoo Finance chart endpoint (no key, best-effort)
 *  - Fallback → deterministic mock with small variance per minute
 */

import { NextResponse } from 'next/server'

// ─── 10-minute server-side cache ─────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000

interface CacheEntry {
  data: MarketItem[]
  ts: number
}

let cache: CacheEntry | null = null

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketItem {
  symbol: string
  price: number
  change: number
  positive: boolean
  source: 'live' | 'mock'
}

// ─── CoinGecko (crypto) ───────────────────────────────────────────────────────
async function fetchCrypto(): Promise<Partial<Record<string, { price: number; change: number }>>> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price' +
    '?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
  const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const d = await res.json()
  return {
    BTC: { price: d.bitcoin?.usd ?? 0, change: d.bitcoin?.usd_24h_change ?? 0 },
    ETH: { price: d.ethereum?.usd ?? 0, change: d.ethereum?.usd_24h_change ?? 0 },
  }
}

// ─── Yahoo Finance (equity indices) ──────────────────────────────────────────
async function fetchYahoo(ticker: string): Promise<{ price: number; change: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) return null
  const d = await res.json()
  const result = d?.chart?.result?.[0]
  if (!result) return null
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
  const price = closes[closes.length - 1] ?? 0
  const prevClose = closes[closes.length - 2] ?? price
  const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
  return { price, change }
}

// ─── Deterministic minute-bucketed mock fallback ──────────────────────────────
function mockItem(symbol: string, base: number, vol: number): MarketItem {
  const bucket = Math.floor(Date.now() / 60000) // changes each minute
  const seed = (bucket * 9301 + symbol.charCodeAt(0) * 49297) % 233280
  const f = seed / 233280 // 0..1
  const delta = (f - 0.5) * vol * base
  const price = +(base + delta).toFixed(2)
  const change = +((delta / base) * 100).toFixed(2)
  return { symbol, price, change, positive: change >= 0, source: 'mock' }
}

const MOCK_BASES: { symbol: string; base: number; vol: number }[] = [
  { symbol: 'BTC',    base: 84000,  vol: 0.02  },
  { symbol: 'ETH',    base: 3200,   vol: 0.025 },
  { symbol: 'NASDAQ', base: 19200,  vol: 0.008 },
  { symbol: 'S&P500', base: 5650,   vol: 0.006 },
  { symbol: 'GOLD',   base: 2340,   vol: 0.005 },
  { symbol: 'OIL',    base: 79,     vol: 0.015 },
]

// ─── Handler ──────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic'

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, data: cache.data, cached: true, timestamp: new Date(cache.ts).toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } }
    )
  }

  const items: MarketItem[] = []

  // Crypto from CoinGecko
  try {
    const crypto = await fetchCrypto()
    for (const [sym, val] of Object.entries(crypto)) {
      if (val && val.price > 0) {
        items.push({ symbol: sym, price: +val.price.toFixed(2), change: +val.change.toFixed(2), positive: val.change >= 0, source: 'live' })
      }
    }
  } catch {
    // CoinGecko failed → fall through to mock
  }

  // Equity indices from Yahoo Finance
  const equities: [string, string][] = [
    ['NASDAQ', '^IXIC'],
    ['S&P500', '^GSPC'],
    ['GOLD',   'GC=F'],
    ['OIL',    'CL=F'],
  ]

  await Promise.allSettled(
    equities.map(async ([label, ticker]) => {
      try {
        const val = await fetchYahoo(ticker)
        if (val && val.price > 0) {
          items.push({ symbol: label, price: +val.price.toFixed(2), change: +val.change.toFixed(2), positive: val.change >= 0, source: 'live' })
        }
      } catch { /* ignore */ }
    })
  )

  // Fill missing symbols with mock
  for (const m of MOCK_BASES) {
    if (!items.find(i => i.symbol === m.symbol)) {
      items.push(mockItem(m.symbol, m.base, m.vol))
    }
  }

  // Keep consistent order
  const order = ['BTC', 'ETH', 'NASDAQ', 'S&P500', 'GOLD', 'OIL']
  items.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol))

  cache = { data: items, ts: Date.now() }

  return NextResponse.json(
    { success: true, data: items, cached: false, timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } }
  )
}
