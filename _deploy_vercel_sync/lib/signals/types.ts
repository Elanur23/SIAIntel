/**
 * SIA Intelligence — Signal Types
 * Early-warning signal system: SEC, Congress, Reddit, CoinGecko
 */

export type SignalSource =
  | 'SEC_8K'           // SEC EDGAR Form 8-K: material corporate events
  | 'SEC_13F'          // SEC EDGAR Form 13F: institutional holdings
  | 'CONGRESS_TRADE'   // US Congressional stock trading disclosures
  | 'REDDIT_SPIKE'     // Unusual Reddit discussion velocity
  | 'CRYPTO_WHALE'     // CoinGecko anomalous volume / price movement
  | 'FRED_RELEASE'     // Federal Reserve economic data release

export type SignalUrgency = 'BREAKING' | 'HIGH' | 'MEDIUM' | 'WATCH'

export type SignalSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED'

export type SignalCategory = 'STOCKS' | 'CRYPTO' | 'ECONOMY' | 'AI' | 'GEOPOLITICS'

export interface RawSignal {
  id: string
  source: SignalSource
  category: SignalCategory
  title: string
  summary: string
  entities: string[]          // tickers, company names, key persons
  url: string
  publishedAt: string         // ISO 8601 string
  rawScore: number            // base relevance score 0–100 before boosts
  metadata: Record<string, unknown>
}

export interface ScoredSignal extends RawSignal {
  score: number               // final score 0–100 after all boosts
  urgency: SignalUrgency
  sentiment: SignalSentiment
  boostedBy: string[]         // audit trail of scoring boosts applied
}

export interface SourceStats {
  count: number
  errors: string[]
}

export interface SignalScanResult {
  signals: ScoredSignal[]
  scannedAt: string
  sources: {
    sec: SourceStats
    reddit: SourceStats
    capitolTrades: SourceStats
    coinGecko: SourceStats
  }
  processingMs: number
}
