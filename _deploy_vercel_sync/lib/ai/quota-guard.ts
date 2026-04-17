/**
 * SIA QUOTA GUARD — v1.0
 * Centralised 429 / rate-limit shield for all AI providers.
 *
 * When a provider returns 429:
 *  - A cooldown is registered (default 5 min, doubles on repeated hits).
 *  - Every caller can check isCoolingDown() before making a request.
 *  - getCooldownMessage() returns a user-friendly string for the UI.
 *  - After cooldown expires, the provider is automatically re-enabled.
 */

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
const MAX_COOLDOWN_MS = 60 * 60 * 1000    // 1 hour cap

interface CooldownEntry {
  until: number
  hitCount: number
}

// Module-level map – shared across all server-side uses within the same process.
const cooldowns = new Map<string, CooldownEntry>()

/**
 * Call this whenever you receive a 429 from an AI provider.
 * @param provider – a stable string key like 'gemini', 'groq', 'openai'
 */
export function registerQuotaHit(provider: string): void {
  const existing = cooldowns.get(provider)
  const hitCount = (existing?.hitCount ?? 0) + 1
  // Exponential back-off: 5m → 10m → 20m … capped at 1h
  const duration = Math.min(DEFAULT_COOLDOWN_MS * Math.pow(2, hitCount - 1), MAX_COOLDOWN_MS)
  cooldowns.set(provider, { until: Date.now() + duration, hitCount })
  console.warn(`[QUOTA_GUARD] ${provider} hit 429 – cooling down for ${Math.round(duration / 60000)}m (hit #${hitCount})`)
}

/**
 * Returns true if the provider is currently in cooldown.
 */
export function isCoolingDown(provider: string): boolean {
  const entry = cooldowns.get(provider)
  if (!entry) return false
  if (Date.now() >= entry.until) {
    cooldowns.delete(provider)
    return false
  }
  return true
}

/**
 * Returns remaining cooldown seconds (0 if not in cooldown).
 */
export function cooldownSecondsLeft(provider: string): number {
  const entry = cooldowns.get(provider)
  if (!entry || Date.now() >= entry.until) return 0
  return Math.ceil((entry.until - Date.now()) / 1000)
}

/**
 * User-facing message to show in the UI when a provider is resting.
 */
export function getCooldownMessage(provider: string): string {
  const secs = cooldownSecondsLeft(provider)
  if (secs <= 0) return ''
  const mins = Math.ceil(secs / 60)
  return `Sistem dinlendiriliyor – lütfen ~${mins} dakika bekleyin. (${provider} quota)`
}

/**
 * Wraps an AI call: skips it if in cooldown, registers 429 on failure.
 * Returns null when skipped or on error so callers can fall back gracefully.
 */
export async function withQuotaGuard<T>(
  provider: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (isCoolingDown(provider)) {
    console.warn(`[QUOTA_GUARD] ${provider} is cooling down – skipping request`)
    return null
  }
  try {
    return await fn()
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status ?? 0
    const msg = String(err?.message ?? '')
    if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      registerQuotaHit(provider)
    }
    throw err
  }
}
