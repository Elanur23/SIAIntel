'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Flame, Activity } from 'lucide-react'
import Link from 'next/link'
import DataSyncTime from '@/components/DataSyncTime'

interface TrendingAsset {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  heatScore: number // 0-100
}

interface TrendingHeatmapProps {
  lang: string
}

export default function TrendingHeatmap({ lang }: TrendingHeatmapProps) {
  const [assets, setAssets] = useState<TrendingAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch real-time market data from API
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data/trending')
        const result = await response.json()
        
        if (result.success && result.data) {
          setAssets(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error)
        // Fallback to mock data
        setAssets([
          { symbol: 'BTC', name: 'Bitcoin', price: 68200, change24h: 2.3, volume: 31200000000, sentiment: 'bullish', heatScore: 96 },
          { symbol: 'NVDA', name: 'NVIDIA', price: 924, change24h: 8.7, volume: 58000000000, sentiment: 'bullish', heatScore: 98 }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()

    // Refresh every 10 seconds for real-time feel
    const interval = setInterval(() => {
      fetchMarketData()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getHeatColor = (score: number) => {
    if (score >= 90) return 'bg-red-500'
    if (score >= 80) return 'bg-orange-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-green-500'
    if (score >= 50) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const getHeatIntensity = (score: number) => {
    if (score >= 90) return 'shadow-[0_0_20px_rgba(239,68,68,0.6)]'
    if (score >= 80) return 'shadow-[0_0_15px_rgba(249,115,22,0.5)]'
    if (score >= 70) return 'shadow-[0_0_10px_rgba(234,179,8,0.4)]'
    return ''
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Activity className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="p-3 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl shadow-lg">
              <Flame size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight leading-tight text-white">
                Trending Heatmap
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-white/60 tracking-tight leading-tight">
                  Real-time market momentum tracking
                </p>
                <DataSyncTime className="text-white/40" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-sm text-white/60 uppercase">Hot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-sm text-white/60 uppercase">Warm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-sm text-white/60 uppercase">Cool</span>
            </div>
          </div>
        </div>

        {/* AI Interpretation Layer */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
              <Activity size={16} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">AI Market Interpretation</span>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-soft-pulse" />
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                <span className="text-purple-400 font-bold">Strong bullish momentum</span> detected across crypto assets with BTC leading at +2.3%. 
                <span className="text-emerald-400 font-bold"> Risk-on sentiment</span> confirmed by declining VIX (-3.1%). 
                <span className="text-orange-400 font-bold"> Caution advised</span> on equity exposure as S&P 500 shows weakness (-0.8%). 
                Optimal positioning: <span className="text-blue-400 font-bold">60% Crypto, 30% Cash, 10% Hedges</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {assets.map((asset) => {
            const isPositive = asset.change24h > 0
            const TrendIcon = isPositive ? TrendingUp : TrendingDown
            
            return (
              <Link
                key={asset.symbol}
                href={`/${lang}/asset/${asset.symbol.toLowerCase()}`}
                className={`
                  relative p-4 rounded-2xl border border-white/10 
                  hover:border-white/30 transition-all group cursor-pointer hover-lift
                  ${getHeatColor(asset.heatScore)} bg-opacity-10
                  hover:bg-opacity-20
                  ${getHeatIntensity(asset.heatScore)}
                `}
              >
                {/* Heat score indicator */}
                <div className="absolute top-2 right-2">
                  <div className={`
                    w-2 h-2 rounded-full ${getHeatColor(asset.heatScore)}
                    ${asset.heatScore >= 90 ? 'animate-soft-pulse' : ''}
                  `} />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white uppercase">
                      {asset.symbol}
                    </span>
                    <TrendIcon 
                      size={14} 
                      className={isPositive ? 'text-emerald-500' : 'text-red-500'} 
                    />
                  </div>
                  
                  <div className="text-sm text-white/60 truncate">
                    {asset.name}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white font-mono-data">
                      ${asset.price >= 1 ? asset.price.toLocaleString() : asset.price.toFixed(2)}
                    </span>
                  </div>

                  <div className={`
                    text-sm font-bold font-mono-data
                    ${isPositive ? 'text-emerald-500' : 'text-red-500'}
                  `}>
                    {isPositive ? '+' : ''}{asset.change24h.toFixed(1)}%
                  </div>

                  {/* Heat score bar */}
                  <div className="pt-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getHeatColor(asset.heatScore)} transition-all duration-500`}
                        style={{ width: `${asset.heatScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </Link>
            )
          })}
        </div>

        {/* Volume leaders */}
        <div className="pt-8 border-t border-white/5">
          <h3 className="text-sm font-semibold tracking-tight leading-tight text-white/60 mb-4">
            Volume Leaders 24H
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {assets.slice(0, 3).map((asset) => (
              <div 
                key={asset.symbol}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-white">{asset.symbol}</span>
                  <span className="text-xs text-white/40">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    ${(asset.volume / 1000000000).toFixed(1)}B
                  </div>
                  <div className="text-sm text-white/60 uppercase">
                    Volume
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
