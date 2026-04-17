'use client'

import { useEffect, useRef, useState } from 'react'
import { getAdRefreshManager, type AdPosition, type AdSize } from '@/lib/ads/AdRefreshManager'

interface AdBannerProps {
  slotId: string
  position: AdPosition
  size?: AdSize
  refreshable?: boolean
  minRefreshInterval?: number
  className?: string
  keywords?: string[] // High-CPC keywords injection
}

/**
 * SIA AdBanner V2.0 - REVENUE MAXIMIZER
 * Features: High-CPC Keyword Injection | Layout Stability | Policy Compliance
 */
export default function AdBanner({
  slotId,
  position,
  size = 'responsive',
  refreshable = true,
  minRefreshInterval = 90,
  className = '',
  keywords = []
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Default High-CPC keywords for financial niche
  const defaultKeywords = [
    'Institutional Finance', 'Asset Management', 'Investment Strategy',
    'Market Analysis', 'Quantitative Trading', 'Sovereign Wealth',
    'AI Financial Analysis', 'Hedge Fund Insights', 'Macro Economic Signals'
  ]
  const finalKeywords = [...new Set([...defaultKeywords, ...keywords])].join(',')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Pre-calculate heights to prevent Layout Shift (CLS)
    const minHeight = size === 'responsive' ? '280px' : size.split('x')[1] + 'px'
    if (containerRef.current) {
      containerRef.current.style.minHeight = minHeight
    }

    const manager = getAdRefreshManager()
    const containerId = `ad-${slotId}-${position}`

    manager.registerSlot({
      id: slotId,
      containerId,
      position,
      size,
      priority: getPriority(position),
      refreshable,
      minRefreshInterval,
      viewabilityThreshold: 50
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsVisible(true)
            if (!isLoaded) loadAd()
          } else {
            setIsVisible(false)
          }
        })
      },
      { threshold: [0, 0.5, 1.0], rootMargin: '100px' }
    )

    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      manager.unregisterSlot(slotId)
    }
  }, [slotId, position, size, refreshable, minRefreshInterval])

  const loadAd = () => {
    if (isLoaded) return
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({})
        setIsLoaded(true)
      }
    } catch (error) {
      console.error(`[AdBanner] Load error ${slotId}:`, error)
    }
  }

  const getPriority = (pos: AdPosition): 'high' | 'medium' | 'low' => {
    const high: AdPosition[] = ['article-top', 'sidebar-top', 'header']
    if (high.includes(pos)) return 'high'
    return 'medium'
  }

  const getSizeClass = (): string => {
    switch (size) {
      case '728x90': return 'w-[728px] h-[90px]'
      case '300x250': return 'w-[300px] h-[250px]'
      case '300x600': return 'w-[300px] h-[600px]'
      case 'responsive': return 'w-full min-h-[280px]'
      default: return 'w-full min-h-[250px]'
    }
  }

  return (
    <div
      ref={containerRef}
      id={`ad-${slotId}-${position}`}
      className={`ad-wrapper relative mx-auto my-10 overflow-hidden transition-all duration-500 ${getSizeClass()} ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '1.5rem'
      }}
    >
      <div className="absolute top-2 left-4 text-[8px] font-black text-white/10 uppercase tracking-widest z-0">
        Institutional Sponsorship
      </div>

      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={process.env[`NEXT_PUBLIC_ADSENSE_SLOT_${position.toUpperCase().replace('-', '_')}`]}
          data-ad-format={size === 'responsive' ? 'auto' : 'fixed'}
          data-full-width-responsive="true"
          data-ad-keywords={finalKeywords} // 💰 KEY TO HIGH-CPC
        />
      )}

      {!isLoaded && (
        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
          <div className="w-8 h-8 border border-white/20 rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">SIA_AD_NODE_PENDING</span>
        </div>
      )}
    </div>
  )
}
