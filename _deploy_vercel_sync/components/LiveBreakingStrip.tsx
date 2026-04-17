'use client'

import { useEffect, useState } from 'react'
import { Zap, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface BreakingNews {
  id: string
  title: string
  slug: string
  category: string
  confidence: number
  timestamp: string
}

interface LiveBreakingStripProps {
  lang: string
}

export default function LiveBreakingStrip({ lang }: LiveBreakingStripProps) {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch breaking news from API
    const fetchBreakingNews = async () => {
      try {
        const response = await fetch('/api/breaking-news')
        const result = await response.json()
        
        if (result.success && result.data) {
          setBreakingNews(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch breaking news:', error)
        // Fallback to mock data
        setBreakingNews([
          {
            id: '1',
            title: 'BTC +2.3% breaks $68.2K - Whale accumulation detected',
            slug: 'btc-whale-accumulation',
            category: 'CRYPTO',
            confidence: 94,
            timestamp: new Date().toISOString()
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBreakingNews()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBreakingNews()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading || breakingNews.length === 0) return null

  return (
    <div className="border-y border-red-500/20 bg-gradient-to-r from-red-950/20 via-red-900/10 to-red-950/20 backdrop-blur-sm relative overflow-hidden">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-6 py-3 relative z-10">
        <div className="flex items-center gap-4">
          {/* Breaking label */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg">
              <Zap size={14} className="text-white animate-soft-pulse" />
              <span className="text-xs font-bold tracking-wider text-white uppercase font-mono-data">
                Breaking
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
          </div>

          {/* Scrolling news ticker with categories */}
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8 animate-scroll-left">
              {[...breakingNews, ...breakingNews].map((news, idx) => (
                <Link
                  key={`${news.id}-${idx}`}
                  href={`/${lang}/news/${news.slug}`}
                  className="flex items-center gap-3 shrink-0 group hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20">
                      {news.category}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
                      {news.title}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <TrendingUp size={10} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-500 tabular-nums">
                        {news.confidence}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 45s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
