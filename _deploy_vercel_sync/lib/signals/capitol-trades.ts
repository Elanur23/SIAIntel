/**
 * SIA Intelligence — Capitol Trades Signal Fetcher
 *
 * Fetches US Congress stock trading disclosures.
 * Data sources: housestockwatcher.com and senatestockwatcher.com
 * Both are public, free, no API key required.
 *
 * Why this matters: Congressional trades often precede market-moving legislation.
 * STOCK Act (2012) mandates disclosure within 45 days — still an early signal.
 */

import type { RawSignal } from './types'

const HOUSE_API =
  'https://house-stock-watcher-data.s3-us-gov-east-1.amazonaws.com/data/all_transactions.json'
const SENATE_API =
  'https://senate-stock-watcher-data.s3-us-gov-east-1.amazonaws.com/aggregate/all_transactions.json'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

interface HouseTrade {
  transaction_date:  string
  disclosure_date:   string
  representative:    string
  district:          string
  ticker:            string
  asset_description: string
  asset_type:        string
  type:              string  // 'purchase' | 'sale (partial)' | 'sale (full)'
  amount:            string  // e.g. "$15,001 - $50,000"
  link:              string
  cap_gains_over_200_usd?: string
}

interface SenateTrade {
  transaction_date: string
  senator:          string
  ticker:           string
  asset_name:       string
  asset_type:       string
  type:             string
  amount:           string
  comment:          string
  ptr_link:         string
}

/**
 * Converts STOCK Act amount ranges to a midpoint numeric value.
 * "$15,001 - $50,000" → 32500
 */
function amountMidpoint(raw: string): number {
  const clean = raw.replace(/[$,]/g, '').trim()
  const parts = clean.split(/\s*-\s*/)
  if (parts.length === 2) {
    const lo = parseFloat(parts[0]) || 0
    const hi = parseFloat(parts[1]) || 0
    return (lo + hi) / 2
  }
  return parseFloat(clean) || 0
}

function amountBoost(usd: number): number {
  if (usd >= 5_000_000) return 30
  if (usd >= 1_000_000) return 25
  if (usd >= 500_000)   return 20
  if (usd >= 250_000)   return 15
  if (usd >= 100_000)   return 10
  if (usd >=  50_000)   return 5
  return 0
}

function isBuy(type: string): boolean {
  return type.toLowerCase().includes('purchase')
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export async function fetchCapitolTradesSignals(): Promise<RawSignal[]> {
  const signals: RawSignal[] = []
  const cutoff = Date.now() - THIRTY_DAYS_MS

  const [houseRes, senateRes] = await Promise.allSettled([
    fetch(HOUSE_API,  { next: { revalidate: 3_600 } }).then(r => r.json()),
    fetch(SENATE_API, { next: { revalidate: 3_600 } }).then(r => r.json()),
  ])

  // ── House of Representatives ────────────────────────────────────────────
  if (houseRes.status === 'fulfilled') {
    const raw: HouseTrade[] = Array.isArray(houseRes.value)
      ? houseRes.value
      : (houseRes.value?.transactions ?? [])

    const recent = raw
      .filter(t => {
        const d = new Date(t.disclosure_date || t.transaction_date)
        return !isNaN(d.getTime()) && d.getTime() > cutoff
      })
      .slice(0, 60)

    for (const t of recent) {
      // Skip non-equity or missing ticker
      if (!t.ticker || t.ticker === '--')              continue
      if (/Government|Treasury|Municipal/i.test(t.asset_type ?? '')) continue

      const mid   = amountMidpoint(t.amount || '')
      const boost = amountBoost(mid)
      const buy   = isBuy(t.type)

      signals.push({
        id: `house_${t.representative?.replace(/\W/g, '_')}_${t.ticker}_${t.transaction_date}`,
        source: 'CONGRESS_TRADE',
        category: 'STOCKS',
        title: `CONGRESS ▸ Rep. ${t.representative} ${buy ? 'BOUGHT' : 'SOLD'} $${t.ticker}`,
        summary: `Representative ${t.representative} (${t.district ?? 'US House'}) ${buy ? 'purchased' : 'sold'} ${t.asset_description || t.ticker} worth ${t.amount}. Trade date: ${t.transaction_date}. Disclosed: ${t.disclosure_date}.`,
        entities: [t.ticker, t.representative].filter(Boolean),
        url: t.link || 'https://disclosures.house.gov/FinancialDisclosure',
        publishedAt: new Date(t.disclosure_date || t.transaction_date).toISOString(),
        rawScore: Math.min(55 + boost, 95),
        metadata: {
          chamber:        'house',
          representative: t.representative,
          ticker:         t.ticker,
          type:           t.type,
          amount:         t.amount,
          amountUsd:      mid,
          amountDisplay:  formatUsd(mid),
          isBuy:          buy,
          // Legal attribution
          sourceAttribution: 'U.S. House of Representatives Financial Disclosures (disclosures.house.gov)',
          legalBasis: 'STOCK Act (Stop Trading on Congressional Knowledge Act), 5 U.S.C. App. 4 §101 — mandatory disclosure within 45 days',
          dataLicense: 'Public record — U.S. Government disclosure',
        },
      })
    }
  }

  // ── Senate ───────────────────────────────────────────────────────────────
  if (senateRes.status === 'fulfilled') {
    const raw: SenateTrade[] = Array.isArray(senateRes.value)
      ? senateRes.value
      : (senateRes.value?.transactions ?? [])

    const recent = raw
      .filter(t => {
        const d = new Date(t.transaction_date)
        return !isNaN(d.getTime()) && d.getTime() > cutoff
      })
      .slice(0, 60)

    for (const t of recent) {
      if (!t.ticker || t.ticker === '--') continue

      const mid   = amountMidpoint(t.amount || '')
      const boost = amountBoost(mid)
      const buy   = isBuy(t.type)

      signals.push({
        id: `senate_${t.senator?.replace(/\W/g, '_')}_${t.ticker}_${t.transaction_date}`,
        source: 'CONGRESS_TRADE',
        category: 'STOCKS',
        title: `SENATE ▸ Sen. ${t.senator} ${buy ? 'BOUGHT' : 'SOLD'} $${t.ticker}`,
        summary: `Senator ${t.senator} ${buy ? 'purchased' : 'sold'} ${t.asset_name || t.ticker} worth ${t.amount}. Trade date: ${t.transaction_date}.`,
        entities: [t.ticker, t.senator].filter(Boolean),
        url: t.ptr_link || 'https://efts.sec.gov/LATEST/search-index?q=',
        publishedAt: new Date(t.transaction_date).toISOString(),
        rawScore: Math.min(60 + boost, 95), // Senate gets +5 (fewer senators = more weight per trade)
        metadata: {
          chamber:       'senate',
          senator:       t.senator,
          ticker:        t.ticker,
          type:          t.type,
          amount:        t.amount,
          amountUsd:     mid,
          amountDisplay: formatUsd(mid),
          isBuy:         buy,
          comment:       t.comment,
          // Legal attribution
          sourceAttribution: 'U.S. Senate Financial Disclosures (efts.sec.gov / senate.gov)',
          legalBasis: 'STOCK Act (Stop Trading on Congressional Knowledge Act), 5 U.S.C. App. 4 §101',
          dataLicense: 'Public record — U.S. Government disclosure',
        },
      })
    }
  }

  return signals.sort((a, b) => b.rawScore - a.rawScore).slice(0, 30)
}
