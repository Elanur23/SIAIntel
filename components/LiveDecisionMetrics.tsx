'use client'

import { useLiveIntel } from '@/lib/hooks/useLiveIntel'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMemo } from 'react'

export default function LiveDecisionMetrics() {
  const { currentLang, t } = useLanguage()
  const { intelFeed, isLoading } = useLiveIntel(currentLang as string)

  // Calculate market metrics from real-time data
  const metrics = useMemo(() => {
    if (!intelFeed || intelFeed.length === 0) {
      return {
        sentiment: t('home.decision.neutral_sentiment') || 'NEUTRAL',
        sentimentColor: 'text-orange-500',
        sentimentBg: 'bg-orange-500',
        sentimentDesc: t('home.decision.neutral_desc') || 'Neutral Environment • Consolidation',
        activeSignals: 0,
        highPriority: 0,
        medium: 0,
        volatility: t('home.decision.volatility_medium') || 'MEDIUM',
        volatilityColor: 'text-orange-500',
        volatilityBg: 'bg-orange-500',
        volatilityDesc: t('home.decision.volatility_moderate') || 'Moderate',
        confidence: 50,
        confidenceColor: 'text-orange-500',
        confidenceDesc: t('home.decision.medium_conviction') || 'Medium Conviction • Moderate Noise',
      }
    }

    // Calculate sentiment from price changes
    const priceChanges = intelFeed.map((item) => {
      const match = item.executive_summary?.match(/([+-]?[0-9]+\.[0-9]{2})%/)
      return match ? parseFloat(match[1]) : 0
    })

    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length

    // Determine sentiment
    let sentiment = t('home.decision.neutral_sentiment') || 'NEUTRAL'
    let sentimentColor = 'text-orange-500'
    let sentimentBg = 'bg-orange-500'
    let sentimentDesc = t('home.decision.neutral_desc') || 'Neutral Environment • Consolidation'

    if (avgChange > 1) {
      sentiment = t('home.decision.bullish_sentiment') || 'BULLISH'
      sentimentColor = 'text-emerald-500'
      sentimentBg = 'bg-emerald-500'
      sentimentDesc = t('home.decision.risk_on') || 'Risk-On Environment • 72h Momentum'
    } else if (avgChange < -1) {
      sentiment = t('home.decision.bearish_sentiment') || 'BEARISH'
      sentimentColor = 'text-red-500'
      sentimentBg = 'bg-red-500'
      sentimentDesc = t('home.decision.risk_off_desc') || 'Risk-Off Environment • Defensive Positioning'
    }

    // Calculate active signals (based on price movements)
    const activeSignals = intelFeed.filter((item) => Math.abs(item.impact || 0) > 5).length
    const highPriority = intelFeed.filter((item) => (item.impact || 0) > 7).length
    const medium = activeSignals - highPriority

    // Calculate volatility from price changes
    const absChanges = priceChanges.map(Math.abs)
    const avgVolatility = absChanges.reduce((a, b) => a + b, 0) / absChanges.length

    let volatility = t('home.decision.volatility_medium') || 'MEDIUM'
    let volatilityColor = 'text-orange-500'
    let volatilityBg = 'bg-orange-500'
    let volatilityDesc = t('home.decision.volatility_moderate') || 'Moderate'

    if (avgVolatility > 3) {
      volatility = t('home.decision.volatility_high') || 'HIGH'
      volatilityColor = 'text-red-500'
      volatilityBg = 'bg-red-500'
      volatilityDesc = t('home.decision.volatility_elevated') || 'Elevated'
    } else if (avgVolatility < 1.5) {
      volatility = t('home.decision.volatility_low') || 'LOW'
      volatilityColor = 'text-emerald-500'
      volatilityBg = 'bg-emerald-500'
      volatilityDesc = t('home.decision.volatility_stable') || 'Stable'
    }

    // Calculate confidence (based on data consistency)
    const stdDev = Math.sqrt(
      priceChanges.reduce((sum, val) => sum + Math.pow(val - avgChange, 2), 0) / priceChanges.length
    )
    const confidence = Math.max(50, Math.min(95, Math.round(85 - stdDev * 5)))

    let confidenceColor = 'text-purple-500'
    let confidenceDesc = t('home.decision.high_conviction') || 'High Conviction • Low Noise'

    if (confidence < 70) {
      confidenceColor = 'text-orange-500'
      confidenceDesc = t('home.decision.medium_conviction') || 'Medium Conviction • Moderate Noise'
    } else if (confidence < 60) {
      confidenceColor = 'text-red-500'
      confidenceDesc = t('home.decision.low_conviction') || 'Low Conviction • High Noise'
    }

    return {
      sentiment,
      sentimentColor,
      sentimentBg,
      sentimentDesc,
      activeSignals: Math.max(1, activeSignals),
      highPriority: Math.max(1, highPriority),
      medium: Math.max(1, medium),
      volatility,
      volatilityColor,
      volatilityBg,
      volatilityDesc,
      volatilityValue: avgVolatility.toFixed(1),
      confidence,
      confidenceColor,
      confidenceDesc,
    }
  }, [intelFeed, currentLang, t])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
            <div className="h-4 bg-white/5 rounded mb-2" />
            <div className="h-8 bg-white/5 rounded mb-1" />
            <div className="h-3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Market Sentiment */}
      <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {t('home.decision.market_sentiment') || 'Market Sentiment'}
            </span>
            <div className="group/tooltip relative">
              <svg
                className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                {t('home.decision.overall_direction') || 'Overall market direction based on multiple indicators'}
              </div>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${metrics.sentimentBg} group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-shadow`} />
        </div>
        <div className={`text-2xl font-black ${metrics.sentimentColor} mb-1`}>{metrics.sentiment}</div>
        <div className="text-xs text-white/60">{metrics.sentimentDesc}</div>
        <div className="absolute top-2 right-2 text-[9px] text-emerald-500/60 font-mono">
          {t('home.decision.valid') || 'Valid'}: 4h
        </div>
      </div>

      {/* Active Signals */}
      <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {t('home.decision.active_signals_count') || 'Active Signals'}
            </span>
            <div className="group/tooltip relative">
              <svg
                className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                {t('home.decision.actionable_signals') || 'Number of actionable trading signals detected'}
              </div>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-shadow" />
        </div>
        <div className="text-2xl font-black text-blue-500 mb-1">{metrics.activeSignals}</div>
        <div className="text-xs text-white/60">
          {metrics.highPriority} {t('home.decision.high_priority') || 'High Priority'} • {metrics.medium}{' '}
          {t('home.decision.medium') || 'Medium'}
        </div>
        <div className="absolute top-2 right-2 text-[9px] text-blue-500/60 font-mono">
          {t('home.hero.live') || 'Live'}
        </div>
      </div>

      {/* Volatility Index */}
      <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {t('home.decision.volatility_index') || 'Volatility Index'}
            </span>
            <div className="group/tooltip relative">
              <svg
                className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                {t('home.decision.expected_price_movement') || 'Expected price movement range (VIX-based)'}
              </div>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${metrics.volatilityBg} group-hover:shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-shadow`} />
        </div>
        <div className={`text-2xl font-black ${metrics.volatilityColor} mb-1`}>{metrics.volatility}</div>
        <div className="text-xs text-white/60">
          {t('home.decision.crypto_vol') || 'Crypto Vol'} {metrics.volatilityValue}% • {metrics.volatilityDesc}
        </div>
        <div className="absolute top-2 right-2 text-[9px] text-orange-500/60 font-mono">
          {t('home.decision.valid') || 'Valid'}: 1h
        </div>
      </div>

      {/* Decision Confidence */}
      <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {t('home.decision.decision_confidence') || 'Decision Confidence'}
            </span>
            <div className="group/tooltip relative">
              <svg
                className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                {t('home.decision.ai_model_confidence') || 'AI model confidence in current analysis'}
              </div>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-shadow" />
        </div>
        <div className={`text-2xl font-black ${metrics.confidenceColor} mb-1`}>{metrics.confidence}%</div>
        <div className="text-xs text-white/60">{metrics.confidenceDesc}</div>
        <div className="absolute top-2 right-2 text-[9px] text-purple-500/60 font-mono">
          {t('home.decision.valid') || 'Valid'}: 6h
        </div>
      </div>
    </div>
  )
}
