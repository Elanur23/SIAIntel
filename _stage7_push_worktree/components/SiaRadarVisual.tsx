'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SiaRadarVisualProps {
  category?: string
  confidence?: number
  compact?: boolean
  className?: string
  sentiment?: string
}

export default function SiaRadarVisual({ category, confidence, compact, className }: SiaRadarVisualProps) {
  const [dots, setDots] = useState<Array<{ id: number, x: number, y: number, opacity: number }>>([])
  const [isScanning, setIsScanning] = useState(false)

  const triggerScan = () => {
    if (isScanning) return
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 2000)
  }

  useEffect(() => {
    // Sinyal noktalarını simüle et
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 15) return prev;
        return [...prev, {
          id: Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: 1
        }]
      })
    }, 2000)

    const decay = setInterval(() => {
      setDots(prev => prev.map(dot => ({ ...dot, opacity: dot.opacity - 0.1 })).filter(dot => dot.opacity > 0))
    }, 500)

    return () => {
      clearInterval(interval)
      clearInterval(decay)
    }
  }, [])

  const size = compact ? 'w-full h-full' : 'w-[300px] h-[300px] md:w-[450px] md:h-[450px]'

  return (
    <div
      onClick={triggerScan}
      className={`relative cursor-crosshair group/radar ${size} ${className || ''}`}
    >
      {/* Outer Rings */}
      <div className={`absolute inset-0 border border-blue-500/20 rounded-full transition-all duration-500 ${isScanning ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`} />
      {/* ... (rest of the component) */}

      {/* Radar Sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: isScanning ? 1 : 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-transparent origin-center"
        style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0%, 50% 0%)' }}
      />

      {/* Signal Dots */}
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: dot.opacity }}
          className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        />
      ))}

      {/* Center Point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-pulse" />

      {/* Scanning Text */}
      {!compact && (
        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] font-mono font-black text-blue-500/50 uppercase tracking-[0.3em] animate-pulse">
            SIA_SCAN_PROTOCOL: ACTIVE
          </span>
        </div>
      )}
    </div>
  )
}
