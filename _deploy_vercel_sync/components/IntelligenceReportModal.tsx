'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Globe, Eye, Calendar, BarChart3 } from 'lucide-react'
import { useEffect } from 'react'

interface IntelligenceReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: {
    id: number
    title: string
    region: string
    flag: string
    confidence: number
    sentiment: string
    timestamp: string
    languages: string[]
    fullAnalysis?: string
    keyPoints?: string[]
    marketImpact?: string
    riskLevel?: string
  }
}

export default function IntelligenceReportModal({ isOpen, onClose, report }: IntelligenceReportModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const fullAnalysis = report.fullAnalysis || `
    This intelligence report provides comprehensive analysis of ${report.title}. 
    
    Our AI-powered system has analyzed multiple data sources and identified key market signals 
    that suggest significant implications for investors and traders.
    
    The analysis incorporates real-time market data, sentiment analysis from social media and news sources,
    technical indicators, and historical pattern recognition to provide actionable intelligence.
  `

  const keyPoints = report.keyPoints || [
    'Institutional demand showing strong upward momentum',
    'Technical indicators suggest continuation of current trend',
    'Market sentiment remains positive across major exchanges',
    'Volume analysis indicates sustained interest from large holders',
    'Correlation with traditional markets weakening'
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal - Bloomberg Terminal Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-black border-2 border-[#FFB800] shadow-2xl shadow-[#FFB800]/20"
        >
          {/* Header - Bloomberg Terminal Style */}
          <div className="border-b border-[#FFB800] bg-black p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{report.flag}</span>
                  <span className="text-xs text-[#FFB800] font-mono uppercase tracking-wider">{report.region}</span>
                  <div className={`px-2 py-1 text-xs font-bold font-mono ${
                    report.sentiment === 'BULLISH' ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]' :
                    report.sentiment === 'BEARISH' ? 'bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]' :
                    'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]'
                  }`}>
                    {report.sentiment}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#FFB800] mb-2 font-mono uppercase tracking-tight">{report.title}</h2>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{report.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{report.confidence}% CONFIDENCE</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-[#FFB800] hover:bg-[#FFD700] text-black font-mono text-xs font-bold transition-colors uppercase tracking-wider"
              >
                CLOSE_TERMINAL [ESC]
              </button>
            </div>
          </div>

          {/* Content - Bloomberg Terminal Style */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border border-[#FFB800] bg-black p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[#FFB800]" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Market Impact</span>
                </div>
                <div className="text-2xl font-bold text-[#FFB800] font-mono">HIGH</div>
                {/* Impact percentage bar */}
                <div className="mt-2 h-2 bg-gray-900 border border-gray-800">
                  <div className="h-full bg-[#FFB800]" style={{ width: `${report.confidence}%` }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border border-[#FFB800] bg-black p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-[#FFB800]" />
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Risk Level</span>
                </div>
                <div className="text-2xl font-bold text-[#FFB800] font-mono">MEDIUM</div>
                {/* Risk percentage bar */}
                <div className="mt-2 h-2 bg-gray-900 border border-gray-800">
                  <div className="h-full bg-[#FFB800]" style={{ width: '60%' }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border border-[#FFB800] bg-black p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {report.sentiment === 'BULLISH' ? (
                    <TrendingUp className="w-4 h-4 text-[#00FF00]" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-[#FF0000]" />
                  )}
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Trend</span>
                </div>
                <div className={`text-2xl font-bold font-mono ${
                  report.sentiment === 'BULLISH' ? 'text-[#00FF00]' : 'text-[#FF0000]'
                }`}>
                  {report.sentiment === 'BULLISH' ? 'UPWARD' : 'DOWNWARD'}
                </div>
              </motion.div>
            </div>

            {/* Full Analysis - Bloomberg Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-sm font-bold text-[#FFB800] mb-3 font-mono uppercase tracking-wider border-b border-gray-800 pb-2">DEEP INTELLIGENCE ANALYSIS</h3>
              <div className="border border-gray-800 bg-black p-4">
                <p className="text-gray-400 leading-relaxed whitespace-pre-line font-mono text-xs">{fullAnalysis}</p>
              </div>
            </motion.div>

            {/* Key Points - Bloomberg Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-bold text-[#FFB800] mb-3 font-mono uppercase tracking-wider border-b border-gray-800 pb-2">KEY INTELLIGENCE POINTS</h3>
              <div className="space-y-2">
                {keyPoints.map((point, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex items-start gap-3 border border-gray-800 bg-black p-3"
                  >
                    <div className="w-2 h-2 bg-[#FFB800] mt-1.5" />
                    <p className="text-gray-400 flex-1 font-mono text-xs">{point}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Available Languages - Bloomberg Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-sm font-bold text-[#FFB800] mb-3 font-mono uppercase tracking-wider border-b border-gray-800 pb-2">AVAILABLE IN MULTIPLE LANGUAGES</h3>
              <div className="flex items-center gap-2">
                {report.languages.map((flag, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-2xl p-2 hover:bg-[#FFB800]/10 border border-gray-800 hover:border-[#FFB800] transition-colors"
                  >
                    {flag}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer - Bloomberg Terminal Style */}
          <div className="border-t border-[#FFB800] bg-black p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
                GENERATED BY SIAINTEL AUTONOMOUS INTELLIGENCE SYSTEM
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#FFB800] hover:bg-[#FFD700] text-black font-bold font-mono text-xs transition-colors uppercase tracking-wider"
              >
                CLOSE_TERMINAL [ESC]
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
