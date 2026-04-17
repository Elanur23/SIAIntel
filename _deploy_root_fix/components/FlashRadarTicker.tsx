'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

export interface FlashSignal {
  asset: string
  status: 'ABNORMAL VOLUME' | 'DECOUPLING ALERT' | 'WHALE MOVEMENT' | 'GAMMA SQUEEZE' | 'DARK POOL' | 'NORMAL'
  note: string
  timestamp: string
  confidence: number
  isMock?: boolean
}

const STATUS_COLOR: Record<string, string> = {
  'ABNORMAL VOLUME':  'text-yellow-400 font-bold',
  'DECOUPLING ALERT': 'text-red-500 font-bold',
  'WHALE MOVEMENT':   'text-blue-400 font-bold',
  'GAMMA SQUEEZE':    'text-purple-400 font-bold',
  'DARK POOL':        'text-orange-400 font-bold',
  'NORMAL':           'text-emerald-400 font-bold',
}

export default function FlashRadarTicker() {
  const [signals, setSignals]           = useState<FlashSignal[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cooldownMsg, setCooldownMsg]   = useState('')
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null)

  const fetchSignals = useCallback(async (force = false) => {
    const url = force ? '/api/flash-radar?refresh=1' : '/api/flash-radar'
    try {
      const res  = await fetch(url)
      const data = await res.json()
      if (data.success && data.data?.signals) {
        setSignals(data.data.signals)
        setLastUpdated(new Date())
      }
      setCooldownMsg(data.cooldownMessage ?? '')
    } catch {
      // network error – keep current signals
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch once on mount – NO setInterval
  useEffect(() => { fetchSignals() }, [fetchSignals])

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    fetchSignals(true)
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 h-9 bg-black border-b border-white/10 flex items-center justify-center z-[200]">
        <span className="text-[10px] font-black text-blue-500/40 tracking-[0.4em] animate-pulse uppercase">
          Syncing_Radar...
        </span>
      </div>
    )
  }

  // ── Cooldown banner ────────────────────────────────────────────────────────
  if (cooldownMsg && signals.length === 0) {
    return (
      <div className="fixed top-0 left-0 right-0 h-9 bg-black border-b border-amber-900/30 flex items-center justify-center gap-3 z-[200]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{cooldownMsg}</span>
        <button
          onClick={handleRefresh}
          className="ml-2 text-[8px] font-black text-white/30 hover:text-white uppercase tracking-widest flex items-center gap-1"
        >
          <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>
    )
  }

  // ── Normal ticker ──────────────────────────────────────────────────────────
  return (
    <div className="fixed top-0 left-0 right-0 h-9 bg-black border-b border-white/10 flex items-center overflow-hidden z-[200]">
      {/* Scrolling signals */}
      <div className="flex items-center whitespace-nowrap animate-ticker-slow hover:pause">
        {[...signals, ...signals, ...signals].map((signal, index) => (
          <div key={index} className="flex items-center gap-6 px-20 border-r border-white/5 font-mono">
            <span className="text-[11px] font-black text-white uppercase italic tracking-wider">
              {signal.asset}
            </span>
            <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 ${STATUS_COLOR[signal.status] ?? STATUS_COLOR.NORMAL}`}>
              {signal.status}
            </span>
            <span className="text-[10px] font-medium text-slate-400 italic">{signal.note}</span>
            <span className="text-[9px] font-black text-white/20 uppercase ml-2">{signal.confidence}% CONF</span>
          </div>
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-black via-black/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-black via-black/80 to-transparent z-20 pointer-events-none" />

      {/* LIVE badge + manual refresh */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 bg-red-600/10 border border-red-600/30 px-3 py-1 rounded-md">
        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">
          {signals.some(s => s.isMock) ? 'CACHED' : 'LIVE'}
        </span>
      </div>

      {/* Refresh button (right edge) */}
      <button
        onClick={handleRefresh}
        title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
        className="absolute right-52 top-1/2 -translate-y-1/2 z-30 text-white/20 hover:text-white/60 transition-colors p-1"
      >
        <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
