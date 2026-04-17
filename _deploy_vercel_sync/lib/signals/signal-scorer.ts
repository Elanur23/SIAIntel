/**
 * SIA Intelligence — Signal Scoring Engine
 *
 * Takes raw signals from all fetchers and applies a unified scoring model:
 *  1. Base score from each fetcher (already domain-weighted)
 *  2. Entity boost   — major company / asset mentioned
 *  3. Recency boost  — filed within last 2 hours
 *  4. Market-hours boost — US equity market session (9:30–16:00 ET)
 *  5. Source authority adjustment
 *  6. Sentiment detection via keyword NLP
 *
 * Final score 0–100:
 *  85–100 → BREAKING
 *  70–84  → HIGH
 *  55–69  → MEDIUM
 *  0–54   → WATCH (filtered out by default)
 */

import type { RawSignal, ScoredSignal, SignalUrgency, SignalSentiment } from './types'

// ── Entity recognition ────────────────────────────────────────────────────────
const MAJOR_ENTITIES = new Set([
  // US equities
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK',
  'JPM', 'GS', 'BAC', 'WFC', 'C', 'MS', 'V', 'MA', 'UNH', 'PFE',
  'NFLX', 'INTC', 'AMD', 'AVGO', 'CRM', 'ORCL', 'ADBE', 'CSCO', 'QCOM',
  'BA', 'DIS', 'WMT', 'XOM', 'CVX', 'JNJ', 'MRK', 'ABT', 'KO', 'PG',
  // Company name fragments
  'Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Alphabet', 'Meta', 'Tesla',
  'Berkshire', 'JPMorgan', 'Goldman', 'Netflix', 'Intel', 'Boeing',
  'Disney', 'Walmart', 'Exxon', 'Chevron', 'Pfizer', 'Johnson',
  // Crypto top assets
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'DOGE',
  'Bitcoin', 'Ethereum', 'Solana', 'Binance',
  // Central banks / macro
  'Federal Reserve', 'Fed', 'ECB', 'IMF', 'World Bank', 'FOMC',
])

// ── Sentiment keywords ────────────────────────────────────────────────────────
const BEARISH_WORDS = [
  'bankruptcy', 'fraud', 'investigation', 'delisted', 'crash', 'collapse',
  'scandal', 'resign', 'fired', 'lawsuit', 'default', 'decline', 'fall',
  'drop', 'loss', 'warning', 'downgrade', 'recall', 'violation', 'probe',
  'restatement', 'impairment', 'shortsell', 'put option',
]

const BULLISH_WORDS = [
  'merger', 'acquisition', 'partnership', 'deal', 'contract', 'record',
  'earnings beat', 'upgrade', 'breakthrough', 'patent', 'approval',
  'buyout', 'dividend', 'buyback', 'launch', 'expansion', 'growth',
  'ipo', 'uplisting', 'raised guidance', 'revenue growth', 'beat estimates',
]

// ── Source authority adjustment ───────────────────────────────────────────────
const SOURCE_ADJUST: Record<string, number> = {
  SEC_8K:          6,
  SEC_13F:         4,
  CONGRESS_TRADE:  9,
  CRYPTO_WHALE:    2,
  REDDIT_SPIKE:    0,
  FRED_RELEASE:   10,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hasMajorEntity(signal: RawSignal): boolean {
  for (const entity of signal.entities) {
    if (MAJOR_ENTITIES.has(entity)) return true
    for (const major of MAJOR_ENTITIES) {
      if (
        entity.toLowerCase().includes(major.toLowerCase()) ||
        major.toLowerCase().includes(entity.toLowerCase())
      ) return true
    }
  }
  return false
}

function detectSentiment(signal: RawSignal): SignalSentiment {
  // Crypto signals carry pre-computed sentiment
  if (signal.source === 'CRYPTO_WHALE') {
    const s = (signal.metadata as Record<string, unknown>).sentiment
    if (typeof s === 'string') return s as SignalSentiment
  }

  // Congress trades: buy = bullish, sale = bearish
  if (signal.source === 'CONGRESS_TRADE') {
    const isBuy = (signal.metadata as Record<string, unknown>).isBuy
    return isBuy ? 'BULLISH' : 'BEARISH'
  }

  const text = `${signal.title} ${signal.summary}`.toLowerCase()
  const b    = BEARISH_WORDS.filter(w => text.includes(w)).length
  const u    = BULLISH_WORDS.filter(w => text.includes(w)).length

  if (b > u + 1) return 'BEARISH'
  if (u > b + 1) return 'BULLISH'
  if (b > 0 && u > 0) return 'MIXED'
  return 'NEUTRAL'
}

function urgencyFromScore(score: number): SignalUrgency {
  if (score >= 85) return 'BREAKING'
  if (score >= 70) return 'HIGH'
  if (score >= 55) return 'MEDIUM'
  return 'WATCH'
}

function isUsMarketHours(): boolean {
  const now = new Date()
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const h   = et.getHours()
  const m   = et.getMinutes()
  const day = et.getDay()
  if (day === 0 || day === 6) return false         // weekend
  if (h === 9 && m >= 30)     return true
  if (h >= 10 && h < 16)      return true
  return false
}

// ── Main scorer ───────────────────────────────────────────────────────────────
export function scoreSignal(raw: RawSignal): ScoredSignal {
  let score         = raw.rawScore
  const boostedBy: string[] = []

  // 1. Major entity
  if (hasMajorEntity(raw)) {
    score += 10
    boostedBy.push('major_entity')
  }

  // 2. Recency
  const ageMs = Date.now() - new Date(raw.publishedAt).getTime()
  if (ageMs < 30 * 60_000) {
    score += 10
    boostedBy.push('< 30min')
  } else if (ageMs < 2 * 3_600_000) {
    score += 5
    boostedBy.push('< 2h')
  }

  // 3. Market hours
  if (isUsMarketHours()) {
    score += 5
    boostedBy.push('market_hours')
  }

  // 4. Source authority
  const adj = SOURCE_ADJUST[raw.source] ?? 0
  if (adj > 0) {
    score += adj
    boostedBy.push(`${raw.source.toLowerCase()}`)
  }

  score = Math.min(Math.round(score), 100)

  return {
    ...raw,
    score,
    urgency:   urgencyFromScore(score),
    sentiment: detectSentiment(raw),
    boostedBy,
  }
}

export function filterAndRankSignals(
  signals: RawSignal[],
  minScore = 50,
): ScoredSignal[] {
  return signals
    .map(scoreSignal)
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

// Deduplicate by entity+source to prevent flooding from same stock/coin
export function deduplicateSignals(signals: ScoredSignal[]): ScoredSignal[] {
  const seen = new Set<string>()
  return signals.filter(s => {
    const key = `${s.source}:${s.entities[0] ?? s.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
