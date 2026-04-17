'use client'

import { useEffect } from 'react'
import { X, TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react'

interface SIAReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: {
    title: string
    timestamp: string
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    confidence: number
    region: string
    market_impact?: number
    executive_summary?: string
    sovereign_insight?: string
    risk_assessment?: string
    source: string
  }
}

export default function SIAReportModal({ isOpen, onClose, report }: SIAReportModalProps) {
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

  const getSignalColor = (signal: string) => {
    if (signal === 'BULLISH') return 'text-[#00FF00]'
    if (signal === 'BEARISH') return 'text-[#FF0000]'
    return 'text-[#FFB800]'
  }

  const getSignalIcon = (signal: string) => {
    if (signal === 'BULLISH') return <TrendingUp className="w-5 h-5" />
    if (signal === 'BEARISH') return <TrendingDown className="w-5 h-5" />
    return <Shield className="w-5 h-5" />
  }

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'text-[#FF0000]'
    if (impact >= 6) return 'text-[#FFB800]'
    return 'text-[#00FF00]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-black border-2 border-[#FFB800] w-full max-w-4xl max-h-[90vh] overflow-y-auto font-mono shadow-2xl shadow-[#FFB800]/20">
        {/* Header - Bloomberg Terminal Style */}
        <div className="bg-black border-b border-[#FFB800] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`${getSignalColor(report.signal)}`}>
              {getSignalIcon(report.signal)}
            </div>
            <div>
              <div className="text-[#FFB800] font-bold text-sm uppercase tracking-wider">
                SIA INTELLIGENCE REPORT
              </div>
              <div className="text-gray-500 text-[10px] uppercase">
                {report.timestamp} | {report.region}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#FFB800] hover:bg-[#FFD700] text-black font-bold text-xs transition-colors uppercase tracking-wider"
          >
            CLOSE_TERMINAL [ESC]
          </button>
        </div>

        {/* Title - Bloomberg Terminal Style */}
        <div className="border-b border-[#FFB800] px-4 py-3 bg-black">
          <h2 className="text-[#FFB800] text-lg font-bold uppercase tracking-tight font-mono">
            {report.title}
          </h2>
        </div>

        {/* Metrics Bar - Bloomberg Terminal Style with Percentage Bars */}
        <div className="border-b border-[#FFB800] bg-black px-4 py-3 grid grid-cols-3 gap-4 text-[11px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 uppercase tracking-wider">SENTIMENT</span>
              <span className={`${getSignalColor(report.signal)} font-bold`}>
                {report.signal}
              </span>
            </div>
            <div className="h-2 bg-gray-900 border border-gray-800">
              <div 
                className={`h-full ${report.signal === 'BULLISH' ? 'bg-[#00FF00]' : report.signal === 'BEARISH' ? 'bg-[#FF0000]' : 'bg-[#FFB800]'}`}
                style={{ width: `${report.confidence}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5 text-right tabular-nums">{report.confidence}%</div>
          </div>
          <div className="border-l border-gray-800 pl-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 uppercase tracking-wider">MARKET IMPACT</span>
              <span className={`${getImpactColor(report.market_impact || 5)} font-bold tabular-nums`}>
                {report.market_impact || 5}
              </span>
            </div>
            <div className="h-2 bg-gray-900 border border-gray-800">
              <div 
                className={`h-full ${getImpactColor(report.market_impact || 5).replace('text-', 'bg-')}`}
                style={{ width: `${((report.market_impact || 5) / 10) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5 text-right tabular-nums">{((report.market_impact || 5) / 10) * 100}%</div>
          </div>
          <div className="border-l border-gray-800 pl-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 uppercase tracking-wider">SOURCE</span>
              <span className="text-[#FFB800] font-bold">{report.source}</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              VERIFIED • REAL-TIME
            </div>
          </div>
        </div>

        {/* Content - Bloomberg Terminal Style */}
        <div className="p-4 space-y-4 bg-black">
          {/* Executive Summary */}
          {report.executive_summary && (
            <div className="border border-[#FFB800] p-3 bg-black">
              <div className="text-[#FFB800] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
                <div className="w-1 h-4 bg-[#FFB800]" />
                EXECUTIVE SUMMARY
              </div>
              <p className="text-gray-400 text-[12px] leading-relaxed font-mono">
                {report.executive_summary}
              </p>
            </div>
          )}

          {/* Sovereign Insight */}
          {report.sovereign_insight && (
            <div className="border border-[#00FF00] p-3 bg-black">
              <div className="text-[#00FF00] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
                <Shield className="w-4 h-4" />
                SOVEREIGN INSIGHT
              </div>
              <p className="text-gray-400 text-[12px] leading-relaxed font-mono">
                {report.sovereign_insight}
              </p>
              <div className="mt-2 text-[10px] text-gray-600 font-mono">
                // Behind-the-scenes analysis that mainstream sites miss
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {report.risk_assessment && (
            <div className="border border-[#FF0000] p-3 bg-black">
              <div className="text-[#FF0000] text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
                <AlertTriangle className="w-4 h-4" />
                RISK ASSESSMENT
              </div>
              <p className="text-gray-400 text-[12px] leading-relaxed font-mono">
                {report.risk_assessment}
              </p>
            </div>
          )}

          {/* Fallback if no SIA fields */}
          {!report.executive_summary && !report.sovereign_insight && !report.risk_assessment && (
            <div className="border border-gray-800 p-4 bg-black text-center">
              <div className="text-gray-600 text-[11px] uppercase tracking-wider mb-2 font-mono">
                DETAILED ANALYSIS UNAVAILABLE
              </div>
              <p className="text-gray-500 text-[12px] font-mono">
                This intelligence report is being processed by the SIA system.
                <br />
                Full analysis will be available shortly.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Bloomberg Terminal Style */}
        <div className="border-t border-[#FFB800] bg-black px-4 py-2 flex items-center justify-between text-[10px]">
          <span className="text-gray-600 uppercase font-mono tracking-wider">
            CLASSIFICATION: <span className="text-[#FFB800]">SOVEREIGN_ACCESS</span>
          </span>
          <span className="text-gray-600 uppercase font-mono tracking-wider">
            GENERATED BY: <span className="text-[#00FF00]">GEMINI-2.5-PRO</span>
          </span>
        </div>
      </div>
    </div>
  )
}
