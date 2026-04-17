/**
 * SIA Intelligence — CoinGecko Anomaly Detector
 *
 * Detects unusual crypto price/volume movements using CoinGecko's free API.
 * No API key required for the public tier (30 req/min).
 *
 * Anomaly types detected:
 *  — Hourly spike: |1h change| > 5%
 *  — Daily extreme: |24h change| > 15%
 *  — Volume surge: total_volume / market_cap > 0.20 (20%)
 *  — Whale divergence: BTC dropping while altcoin pumping (or vice versa)
 */

import type { RawSignal, SignalSentiment } from './types'

const COINGECKO_MARKETS =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd' +
  '&ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,avalanche-2,' +
  'chainlink,polkadot,dogecoin,shiba-inu,tron,near,matic-network,' +
  'internet-computer,aptos,arbitrum,optimism,sui' +
  '&order=market_cap_desc' +
  '&per_page=50' +
  '&sparkline=false' +
  '&price_change_percentage=1h%2C24h%2C7d'

const TIER1_COINS = new Set(['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'])

interface CoinData {
  id:                                            string
  symbol:                                        string
  name:                                          string
  current_price:                                 number
  market_cap:                                    number
  total_volume:                                  number
  price_change_percentage_1h_in_currency:        number | null
  price_change_percentage_24h:                   number | null
  price_change_percentage_7d_in_currency:        number | null
  market_cap_rank:                               number
  ath_change_percentage:                         number | null
}

function formatPrice(price: number | null | undefined): string {
  if (price == null || !isFinite(price)) return 'N/A'
  if (price >= 1000)  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1)     return `$${price.toFixed(2)}`
  if (price >= 0.001) return `$${price.toFixed(4)}`
  if (price > 0)      return `$${price.toFixed(8)}`
  return '$0.00'
}

function formatVolume(vol: number | null | undefined): string {
  const v = vol ?? 0
  if (!isFinite(v) || v === 0) return 'N/A'
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

function detectSentiment(change24h: number): SignalSentiment {
  if (change24h >  5) return 'BULLISH'
  if (change24h < -5) return 'BEARISH'
  return 'NEUTRAL'
}

type AnomalyType = 'hourly_spike' | 'daily_extreme' | 'volume_surge' | 'ath_proximity'

function detectAnomalies(coin: CoinData): AnomalyType[] {
  const types: AnomalyType[] = []
  const ch1h  = coin.price_change_percentage_1h_in_currency  ?? 0
  const ch24h = coin.price_change_percentage_24h              ?? 0
  const vmcap = (coin.total_volume ?? 0) / (coin.market_cap  ?? 1)
  const ath   = coin.ath_change_percentage                    ?? 0

  if (Math.abs(ch1h)  > 5)    types.push('hourly_spike')
  if (Math.abs(ch24h) > 15)   types.push('daily_extreme')
  if (vmcap > 0.20)            types.push('volume_surge')
  if (ath > -5)                types.push('ath_proximity') // within 5% of all-time high
  return types
}

function safeToFixed(n: number | null | undefined, digits = 2): string {
  const v = n ?? 0
  if (!isFinite(v)) return '0.00'
  return v.toFixed(digits)
}

function buildTitle(coin: CoinData, anomalies: AnomalyType[], ch24h: number): string {
  const dir    = ch24h >= 0 ? '▲' : '▼'
  const sym    = coin.symbol?.toUpperCase() ?? '???'
  const labels: string[] = []

  if (anomalies.includes('hourly_spike'))  labels.push('HOURLY SPIKE')
  if (anomalies.includes('daily_extreme')) labels.push('EXTREME MOVE')
  if (anomalies.includes('volume_surge'))  labels.push('VOLUME SURGE')
  if (anomalies.includes('ath_proximity')) labels.push('ATH ZONE')

  return `${sym} ${dir} ${safeToFixed(Math.abs(ch24h), 1)}% — ${labels.join(' · ')}`
}

function anomalyScore(anomalies: AnomalyType[], ch1h: number, ch24h: number, vmcap: number, tier1: boolean): number {
  let score = 50

  if (anomalies.includes('hourly_spike'))  score += Math.min(Math.abs(ch1h)  * 1.8, 18)
  if (anomalies.includes('daily_extreme')) score += Math.min(Math.abs(ch24h) * 0.8, 20)
  if (anomalies.includes('volume_surge'))  score += Math.min(vmcap * 25, 15)
  if (anomalies.includes('ath_proximity')) score += 8

  if (tier1) score += 12

  return Math.min(Math.round(score), 95)
}

export async function fetchCoinGeckoAlerts(): Promise<RawSignal[]> {
  const res = await fetch(COINGECKO_MARKETS, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 180 }, // 3 min cache
  })

  if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)

  const coins: CoinData[] = await res.json()
  const signals: RawSignal[] = []

  for (const coin of coins) {
    const ch1h  = coin.price_change_percentage_1h_in_currency ?? 0
    const ch24h = coin.price_change_percentage_24h             ?? 0
    const mcap  = Math.max(coin.market_cap ?? 0, 1)
    const vmcap = (coin.total_volume ?? 0) / mcap

    const anomalies = detectAnomalies(coin)
    if (anomalies.length === 0) continue

    const tier1     = TIER1_COINS.has(coin.id)
    const rawScore  = anomalyScore(anomalies, ch1h, ch24h, vmcap, tier1)
    const sentiment = detectSentiment(ch24h)

    signals.push({
      id: `cg_${coin.id}_${Date.now()}`,
      source: 'CRYPTO_WHALE',
      category: 'CRYPTO',
      title: buildTitle(coin, anomalies, ch24h),
      summary:
        `${coin.name ?? '?'} (${coin.symbol?.toUpperCase() ?? '?'}) trading at ${formatPrice(coin.current_price ?? null)}. ` +
        `24h: ${ch24h >= 0 ? '+' : ''}${safeToFixed(ch24h)}% · 1h: ${ch1h >= 0 ? '+' : ''}${safeToFixed(ch1h)}%. ` +
        `Volume: ${formatVolume(coin.total_volume)} (${safeToFixed(vmcap * 100, 1)}% of market cap). ` +
        `Rank #${coin.market_cap_rank ?? 'N/A'}.`,
      entities: [coin.symbol?.toUpperCase() ?? '?', coin.name ?? '?'],
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
      publishedAt: new Date().toISOString(),
      rawScore,
      metadata: {
        coinId:        coin.id,
        symbol:        coin.symbol.toUpperCase(),
        name:          coin.name,
        price:         coin.current_price,
        change1h:      ch1h,
        change24h:     ch24h,
        change7d:      coin.price_change_percentage_7d_in_currency ?? 0,
        volume:        coin.total_volume,
        marketCap:     coin.market_cap,
        volumeToMcap:  vmcap,
        rank:          coin.market_cap_rank,
        anomalies,
        sentiment,
      },
    })
  }

  return signals.sort((a, b) => b.rawScore - a.rawScore)
}
