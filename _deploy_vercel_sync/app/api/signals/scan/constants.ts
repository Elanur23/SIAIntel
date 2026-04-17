/**
 * Signal Scanner Constants
 * Shared constants for the signal scanner API
 */

// ── Source labels for UI display ──────────────────────────────────────────────
export const SOURCE_META: Record<string, { label: string; color: string; icon: string }> = {
  SEC_8K:         { label: 'SEC EDGAR',      color: 'blue',   icon: '📋' },
  CONGRESS_TRADE: { label: 'Congress',       color: 'amber',  icon: '🏛️' },
  REDDIT_SPIKE:   { label: 'Reddit Pulse',   color: 'orange', icon: '📡' },
  CRYPTO_WHALE:   { label: 'Crypto Whale',   color: 'purple', icon: '🐋' },
  FRED_RELEASE:   { label: 'Federal Reserve', color: 'green', icon: '🏦' },
}

// ── Urgency colours for UI ────────────────────────────────────────────────────
export const URGENCY_COLOR: Record<string, string> = {
  BREAKING: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HIGH:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  MEDIUM:   'text-blue-400 bg-blue-500/10 border-blue-500/30',
  WATCH:    'text-slate-400 bg-slate-500/10 border-slate-500/20',
}
