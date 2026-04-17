'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PredictionChartProps {
  sentiment: string
  confidence?: number
}

export function PredictionChart({ sentiment, confidence = 95 }: PredictionChartProps): JSX.Element {
  const [gradientId, setGradientId] = useState<string>('')
  
  // Generate unique gradient ID on mount to avoid conflicts
  useEffect(() => {
    setGradientId(`grad-${Math.random().toString(36).substring(2, 11)}`)
  }, [])

  // Sentiment'e göre grafik yönünü belirle
  const isBullish = sentiment === 'BULLISH'
  
  // Yukarı trend (BULLISH) veya Aşağı trend (BEARISH)
  const points = isBullish 
    ? "0,80 20,70 40,75 60,40 80,45 100,10" // Yukarı trend
    : "0,20 20,30 40,25 60,60 80,55 100,90"  // Aşağı trend
  
  // Path for filled area
  const pathD = isBullish 
    ? "M0,80 L20,70 L40,75 L60,40 L80,45 L100,10 L100,100 L0,100 Z"
    : "M0,20 L20,30 L40,25 L60,60 L80,55 L100,90 L100,100 L0,100 Z"

  if (!gradientId) return <div className="mt-3 h-32" /> // Placeholder during mount

  return (
    <div className="mt-3 p-3 bg-black/50 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
          AI_PREDICTION_MODEL // ALPHA_V1
        </span>
        <span className={`text-[9px] font-bold ${isBullish ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
          {isBullish ? '▲ VOLATILITY_UP' : '▼ VOLATILITY_DOWN'}
        </span>
      </div>

      {/* Chart Area */}
      <div className="relative h-20 w-full">
        {/* Grafik Izgarası (Grid) */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-10">
          <div className="border-b border-white w-full h-0" />
          <div className="border-b border-white w-full h-0" />
          <div className="border-b border-white w-full h-0" />
        </div>

        {/* Dinamik Grafik Çizgisi */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Trend Line */}
          <motion.polyline
            fill="none"
            stroke={isBullish ? "#00FF00" : "#FF0000"}
            strokeWidth="2"
            points={points}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Olasılık Alanı (Glow) */}
          <motion.path
            d={pathD}
            fill={`url(#${gradientId}-${isBullish ? 'green' : 'red'})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 3 }}
          />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id={`${gradientId}-green`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00FF00" stopOpacity="1" />
              <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-red`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Footer Note */}
      <div className="mt-2 text-[8px] text-gray-700 font-mono text-center uppercase">
        * Probability based on Gemini context analysis ({confidence}% CI)
      </div>
    </div>
  )
}
