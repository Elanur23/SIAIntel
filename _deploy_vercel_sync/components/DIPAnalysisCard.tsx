'use client';

import { DIPAnalysisReport } from '@/lib/ai/deep-intelligence-pro';
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface DIPAnalysisCardProps {
  report: DIPAnalysisReport;
}

export default function DIPAnalysisCard({ report }: DIPAnalysisCardProps) {
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'LOW': return 'text-green-400 border-green-700 bg-green-900/20';
      case 'MEDIUM': return 'text-yellow-400 border-yellow-700 bg-yellow-900/20';
      case 'HIGH': return 'text-orange-400 border-orange-700 bg-orange-900/20';
      case 'CRITICAL': return 'text-red-400 border-red-700 bg-red-900/20';
      default: return 'text-gray-400 border-gray-700 bg-gray-900/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <CheckCircle size={20} />;
      case 'MEDIUM': return <Shield size={20} />;
      case 'HIGH': return <AlertTriangle size={20} />;
      case 'CRITICAL': return <AlertTriangle size={20} className="animate-pulse" />;
      default: return <Shield size={20} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-6 shadow-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-white leading-tight">
            {report.authorityTitle}
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700 rounded-full">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-400 text-sm font-mono">LIVE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>ID: {report.id}</span>
          <span>•</span>
          <span>{new Date(report.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Confidence Band */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm font-semibold">CONFIDENCE BAND</span>
          <span className="text-white text-xl font-bold">{report.confidenceBand}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${report.confidenceBand}%` }}
          />
        </div>
      </div>

      {/* Market Impact */}
      <div className="mb-6">
        <h3 className="text-gray-400 text-sm font-semibold mb-3">MARKET IMPACT PROBABILITY</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-green-400 text-xs font-semibold">BULLISH</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{report.marketImpact.bullish}%</div>
          </div>
          
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className="text-red-400" />
              <span className="text-red-400 text-xs font-semibold">BEARISH</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{report.marketImpact.bearish}%</div>
          </div>
          
          <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Minus size={18} className="text-gray-400" />
              <span className="text-gray-400 text-xs font-semibold">NEUTRAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-400">{report.marketImpact.neutral}%</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-6 p-4 bg-blue-900/10 border border-blue-800 rounded-lg">
        <h3 className="text-blue-400 text-sm font-semibold mb-2">EXECUTIVE SUMMARY</h3>
        <p className="text-gray-300 leading-relaxed">{report.executiveSummary}</p>
      </div>

      {/* Cross-Market Link */}
      <div className="mb-6">
        <h3 className="text-gray-400 text-sm font-semibold mb-3">CROSS-MARKET RIPPLE EFFECT</h3>
        <div className="space-y-3">
          <div className="p-3 bg-purple-900/10 border border-purple-800 rounded">
            <div className="text-purple-400 text-xs font-semibold mb-1">NASDAQ IMPACT</div>
            <div className="text-gray-300 text-sm">{report.crossMarketLink.nasdaqImpact}</div>
          </div>
          <div className="p-3 bg-orange-900/10 border border-orange-800 rounded">
            <div className="text-orange-400 text-xs font-semibold mb-1">CRYPTO IMPACT</div>
            <div className="text-gray-300 text-sm">{report.crossMarketLink.cryptoImpact}</div>
          </div>
          <div className="p-3 bg-cyan-900/10 border border-cyan-800 rounded">
            <div className="text-cyan-400 text-xs font-semibold mb-1">RIPPLE EFFECT</div>
            <div className="text-gray-300 text-sm">{report.crossMarketLink.rippleEffect}</div>
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="mb-6">
        <h3 className="text-gray-400 text-sm font-semibold mb-3">KEY TAKEAWAYS</h3>
        <ul className="space-y-2">
          {report.keyTakeaways.map((takeaway, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-300">
              <span className="text-blue-400 font-bold mt-1">•</span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risk Assessment */}
      <div className={`p-4 border rounded-lg ${getRiskColor(report.riskLevel)}`}>
        <div className="flex items-center gap-2 mb-3">
          {getRiskIcon(report.riskLevel)}
          <h3 className="font-semibold">RISK LEVEL: {report.riskLevel}</h3>
        </div>
        <ul className="space-y-1 text-sm">
          {report.riskFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-2">
              <span>•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        Powered by Gemini 1.5 Pro • 10-Layer DIP Analysis Methodology
      </div>
    </div>
  );
}
