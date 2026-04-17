/**
 * SIA SCOUT TWITTER — v1.0
 *
 * Groq (llama-3.1-8b-instant) is the EXCLUSIVE AI model here.
 * Purpose: analyse raw Twitter/X post text and extract structured intel signals.
 *
 * Called by:  POST /api/signals/scan  (existing route)
 *             any future Twitter webhook pipeline
 *
 * NOT used for: news article writing (that is Gemini's domain).
 * NOT used for: market scanning (that is Flash Radar's domain).
 */

import { withQuotaGuard } from '@/lib/ai/quota-guard'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export interface TwitterSignal {
  ticker: string          // e.g. "$BTC", "$NVDA"
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  confidence: number      // 0-100
  summary: string         // ≤120 chars, Bloomberg style
  source: string          // tweet author handle or URL
  timestamp: string
}

const SYSTEM_PROMPT = `You are a financial intelligence scout analysing Twitter/X posts.
Extract trading-relevant signals from the given tweet text.
Always respond with valid JSON only — no markdown, no explanation.`

function buildPrompt(tweetText: string, handle: string): string {
  return `Analyse this tweet from @${handle}:

"${tweetText}"

Return JSON with this structure:
{
  "ticker": "$SYMBOL or empty string if no clear asset",
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 0-100,
  "summary": "≤120 char Bloomberg-style summary of the signal"
}`
}

async function callGroq(tweetText: string, handle: string): Promise<string> {
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildPrompt(tweetText, handle) },
      ],
      temperature: 0.1,
      max_tokens: 256,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(6000),
  })

  const data = await res.json()
  if (!res.ok) {
    const err: any = new Error(`Groq Scout ${res.status}: ${data?.error?.message ?? ''}`)
    err.status = res.status
    throw err
  }
  return data.choices?.[0]?.message?.content ?? '{}'
}

/**
 * Analyse a single tweet and return a structured signal.
 * Returns null if Groq is in cooldown or if the tweet has no financial signal.
 */
export async function scoutTweet(tweetText: string, handle = 'unknown'): Promise<TwitterSignal | null> {
  if (!GROQ_API_KEY) return null

  try {
    const raw = await withQuotaGuard('groq', () => callGroq(tweetText, handle))
    if (!raw) return null

    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    if (!parsed.sentiment) return null

    return {
      ticker:    String(parsed.ticker    ?? '').slice(0, 10),
      sentiment: parsed.sentiment        ?? 'NEUTRAL',
      confidence:Number(parsed.confidence ?? 60),
      summary:   String(parsed.summary   ?? '').slice(0, 120),
      source:    `@${handle}`,
      timestamp: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Batch-process multiple tweets.
 * Processes sequentially to be gentle on quota.
 */
export async function scoutTweetBatch(
  tweets: { text: string; handle: string }[]
): Promise<TwitterSignal[]> {
  const results: TwitterSignal[] = []
  for (const t of tweets) {
    const sig = await scoutTweet(t.text, t.handle)
    if (sig && sig.ticker) results.push(sig)
  }
  return results
}
