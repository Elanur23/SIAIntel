/**
 * Flash Radar System — v3.0
 *
 * Architecture:
 *  - PRIMARY: Groq (llama-3.1-8b-instant) — ultra-low-latency market scanner
 *  - FALLBACK: deterministic mock signals (no Gemini — Gemini is reserved for news writing)
 *  - QUOTA GUARD: 429 hits register a cooldown; mock is returned during cooldown
 *
 * Calling convention: runFlashRadarScan() returns FlashSignal[].
 */

import { withQuotaGuard, isCoolingDown, getCooldownMessage } from '@/lib/ai/quota-guard'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

export interface FlashSignal {
  asset: string
  status: 'ABNORMAL VOLUME' | 'DECOUPLING ALERT' | 'WHALE MOVEMENT' | 'GAMMA SQUEEZE' | 'DARK POOL' | 'NORMAL'
  note: string
  timestamp: string
  confidence: number
  isMock?: boolean
}

export interface MarketData {
  nasdaqVolume?: number
  nasdaqChange?: number
  btcPrice?: number
  btcChange?: number
  ethPrice?: number
  ethChange?: number
  optionFlow?: string
  darkPoolActivity?: string
  whaleTransfers?: string
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are a financial market scanner. Always respond with valid JSON only. No markdown, no explanation, just JSON.'

function buildUserPrompt(md: MarketData): string {
  return `Scan the following market data and identify at least 4 actionable anomalies.

RAW MARKET DATA:
- Nasdaq Volume: ${md.nasdaqVolume?.toFixed(0) ?? 'N/A'}
- Nasdaq Change: ${md.nasdaqChange?.toFixed(2) ?? 'N/A'}%
- BTC Price: ${md.btcPrice?.toFixed(0) ?? 'N/A'}  BTC Change: ${md.btcChange?.toFixed(2) ?? 'N/A'}%
- ETH Price: ${md.ethPrice?.toFixed(0) ?? 'N/A'}  ETH Change: ${md.ethChange?.toFixed(2) ?? 'N/A'}%
- Option Flow: ${md.optionFlow ?? 'Normal'}
- Dark Pool: ${md.darkPoolActivity ?? 'Normal'}
- Whale Transfers: ${md.whaleTransfers ?? 'None'}

Rules:
- status must be one of: ABNORMAL VOLUME | DECOUPLING ALERT | WHALE MOVEMENT | GAMMA SQUEEZE | DARK POOL | NORMAL
- note must be ≤ 150 characters, Bloomberg-terminal style
- confidence is 0-100

Respond ONLY with JSON:
{
  "signals": [
    { "asset": "$NVDA", "status": "ABNORMAL VOLUME", "note": "Short description ≤150 chars", "confidence": 85 }
  ]
}`
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(md: MarketData): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(md) },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json()
  if (!res.ok) {
    const err: any = new Error(`Groq ${res.status}: ${data?.error?.message ?? ''}`)
    err.status = res.status
    throw err
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq: empty content')
  return content
}

// ─── Parse response ───────────────────────────────────────────────────────────

function parseSignals(raw: string): FlashSignal[] {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return (parsed.signals ?? []).map((s: any) => ({
      asset: String(s.asset ?? '$UNK'),
      status: s.status ?? 'NORMAL',
      note: String(s.note ?? '').slice(0, 150),
      timestamp: new Date().toISOString(),
      confidence: Number(s.confidence ?? 75),
    }))
  } catch {
    return []
  }
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

const ASSETS = ['$NVDA', '$TSLA', '$AAPL', '$BTC', '$ETH', '$SPY', '$QQQ', '$MSFT']
const STATUSES: FlashSignal['status'][] = [
  'ABNORMAL VOLUME', 'DECOUPLING ALERT', 'WHALE MOVEMENT',
  'GAMMA SQUEEZE', 'DARK POOL', 'NORMAL',
]
const NOTES = [
  'Volume spike %d%% above 20-day avg — institutional accumulation likely.',
  'Correlation with traditional markets breaking down — crypto divergence.',
  'Large wallet transfer detected: %d BTC moved to exchange.',
  'Gamma exposure building near %d strike — squeeze risk elevated.',
  'Dark pool print %d%% of float — smart money repositioning.',
  'Market within normal parameters — no immediate action required.',
]

export function generateMockSignals(count = 6): FlashSignal[] {
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000)) // rotate every 5 min
  return ASSETS.slice(0, count).map((asset, i) => {
    const statusIdx = (bucket + i) % STATUSES.length
    const noteTemplate = NOTES[statusIdx]
    const num = 10 + ((bucket * 7 + i * 13) % 30)
    return {
      asset,
      status: STATUSES[statusIdx],
      note: noteTemplate.replace('%d', String(num)),
      timestamp: new Date().toISOString(),
      confidence: 70 + ((bucket + i * 3) % 20),
      isMock: true,
    }
  })
}

// ─── Lightweight simulated market data (no API calls needed for radar) ────────

export function buildSimulatedMarketData(): MarketData {
  const bucket = Math.floor(Date.now() / 60000)
  const seed = (n: number) => ((bucket * 9301 + n * 49297) % 233280) / 233280
  return {
    nasdaqVolume: Math.round(2_000_000_000 + seed(1) * 1_000_000_000),
    nasdaqChange: +(seed(2) * 4 - 2).toFixed(2),
    btcPrice: Math.round(80000 + seed(3) * 8000),
    btcChange: +(seed(4) * 8 - 4).toFixed(2),
    ethPrice: Math.round(3000 + seed(5) * 600),
    ethChange: +(seed(6) * 10 - 5).toFixed(2),
    optionFlow: seed(7) > 0.7 ? 'Heavy Call Buying' : seed(7) > 0.5 ? 'Put Skew Elevated' : 'Normal',
    darkPoolActivity: seed(8) > 0.8 ? 'Elevated' : 'Normal',
    whaleTransfers: seed(9) > 0.85 ? `${Math.round(seed(10) * 3000)} BTC transferred` : 'None detected',
  }
}

// ─── Quota-aware cooldown status ──────────────────────────────────────────────

export function getRadarCooldownMessage(): string {
  return getCooldownMessage('groq')
}

export function isRadarCoolingDown(): boolean {
  return isCoolingDown('groq')
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runFlashRadarScan(): Promise<FlashSignal[]> {
  const md = buildSimulatedMarketData()

  if (!GROQ_API_KEY || isCoolingDown('groq')) {
    return generateMockSignals()
  }

  try {
    const raw = await withQuotaGuard('groq', () => callGroq(md))
    if (!raw) return generateMockSignals()
    const signals = parseSignals(raw)
    const result = signals.length >= 3 ? signals : generateMockSignals()
    return result.slice(0, 8)
  } catch {
    return generateMockSignals()
  }
}
