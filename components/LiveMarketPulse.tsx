'use client'

import { useLiveIntel } from '@/lib/hooks/useLiveIntel'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LiveMarketPulse() {
  const { currentLang } = useLanguage()
  const { intelFeed, isLoading } = useLiveIntel(currentLang as string)

  // Get BTC, ETH, and SOL data
  const btcData = intelFeed.find((item) => item.id === 'BTCUSDT')
  const ethData = intelFeed.find((item) => item.id === 'ETHUSDT')
  const solData = intelFeed.find((item) => item.id === 'SOLUSDT')

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-6 bg-white/5 rounded" />
        <div className="h-6 bg-white/5 rounded" />
        <div className="h-6 bg-white/5 rounded" />
      </div>
    )
  }

  // Extract price and change from executive_summary
  const extractData = (item: any) => {
    if (!item?.executive_summary) return { price: '---', change: '0.0', isPositive: true }
    
    const priceMatch = item.executive_summary.match(/\$([0-9,]+\.[0-9]{2})/)
    const changeMatch = item.executive_summary.match(/([+-]?[0-9]+\.[0-9]{2})%/)
    
    const price = priceMatch ? priceMatch[1] : '---'
    const change = changeMatch ? changeMatch[1] : '0.0'
    const isPositive = !change.startsWith('-')
    
    return { price, change, isPositive }
  }

  const btc = extractData(btcData)
  const eth = extractData(ethData)
  const sol = extractData(solData)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">BTC/USD</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">${btc.price}</span>
          <span className={`text-xs font-bold ${btc.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {btc.change}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">ETH/USD</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">${eth.price}</span>
          <span className={`text-xs font-bold ${eth.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {eth.change}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">SOL/USD</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">${sol.price}</span>
          <span className={`text-xs font-bold ${sol.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {sol.change}%
          </span>
        </div>
      </div>
    </div>
  )
}
