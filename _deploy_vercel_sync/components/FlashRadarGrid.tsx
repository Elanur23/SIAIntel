'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Zap, RefreshCw, Clock } from 'lucide-react'
import type { FlashSignal } from '@/components/FlashRadarTicker'

const STATUS_ICON: Record<string, React.ReactNode> = {
  'ABNORMAL VOLUME':  <Activity className="text-yellow-400" size={20} />,
  'DECOUPLING ALERT': <AlertTriangle className="text-red-400" size={20} />,
  'WHALE MOVEMENT':   <TrendingUp className="text-blue-400" size={20} />,
  'GAMMA SQUEEZE':    <Zap className="text-purple-400" size={20} />,
  'DARK POOL':        <TrendingDown className="text-orange-400" size={20} />,
  'NORMAL':           <Activity className="text-green-400" size={20} />,
}

/* Neon-only borders – no background fills */
const STATUS_BORDER: Record<string, string> = {
  'ABNORMAL VOLUME':  'border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.15)]',
  'DECOUPLING ALERT': 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
  'WHALE MOVEMENT':   'border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  'GAMMA SQUEEZE':    'border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
  'DARK POOL':        'border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
  'NORMAL':           'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
}

export default function FlashRadarGrid() {
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

  // Fetch once on mount — NO auto-refresh interval
  useEffect(() => { fetchSignals() }, [fetchSignals])

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    fetchSignals(true)
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-transparent border border-white/10 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  // ── Cooldown banner ────────────────────────────────────────────────────────
  if (cooldownMsg && signals.length === 0) {
    return (
      <div className="bg-amber-900/10 border border-amber-700/30 rounded-2xl p-8 text-center space-y-4">
        <span className="text-amber-400 text-2xl">⏳</span>
        <p className="text-amber-300 font-black text-sm uppercase tracking-widest">{cooldownMsg}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          Yeniden Dene
        </button>
      </div>
    )
  }

  // ── Signal grid ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header with refresh + last-updated */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
          {lastUpdated && (
            <>
              <Clock size={10} />
              <span>Son güncelleme: {lastUpdated.toLocaleTimeString()}</span>
              {signals.some(s => s.isMock) && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-500 border border-amber-700/30">
                  CACHED DATA
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
        >
          <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
          Tara
        </button>
      </div>

      {/* Empty state */}
      {signals.length === 0 && (
        <div className="bg-transparent border border-white/10 rounded-lg p-6 text-center">
          <Activity className="mx-auto mb-2 text-gray-600" size={32} />
          <p className="text-gray-400 text-sm">No anomalies detected • Markets normal</p>
        </div>
      )}

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((signal, index) => (
          <div
            key={index}
            className={`bg-transparent border rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${STATUS_BORDER[signal.status] ?? STATUS_BORDER.NORMAL}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {STATUS_ICON[signal.status] ?? STATUS_ICON.NORMAL}
                <span className="font-bold text-white font-mono">{signal.asset}</span>
              </div>
              <div className="text-xs text-gray-400 font-mono">{signal.confidence}%</div>
            </div>
            <div className="text-xs font-semibold text-gray-400 mb-1 font-mono">{signal.status}</div>
            <div className="text-sm text-gray-300 font-mono flex items-baseline gap-0.5">
              <span>{signal.note}</span>
              <span className="inline-block w-2 h-4 bg-blue-500/60 animate-pulse" />
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </div>
              <div className={`w-2 h-2 rounded-full ${signal.isMock ? 'bg-amber-500' : 'bg-green-400 animate-pulse'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
