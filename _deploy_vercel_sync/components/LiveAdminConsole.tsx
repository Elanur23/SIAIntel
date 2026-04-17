'use client'

import { useLiveIntelStream } from '@/lib/hooks/useLiveIntelStream'

export default function LiveAdminConsole() {
  const { liveQueue, isScanning, lastScanTime, geminiEnabled, toggleGemini } = useLiveIntelStream()

  const handlePublish = (newsId: string | number, title: string) => {
    alert(`BROADCASTING_TO_6_LANGUAGES...\n\nID: ${newsId}\nTitle: ${title}\n\nStatus: APPROVED ✓\nChannels: WEB // TERMINAL // TELEGRAM // X\nLanguages: TR, EN, DE, ES, FR, AR`)
  }

  return (
    <div className="h-full bg-black border border-green-900/20 p-6 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-green-900/30 pb-4">
        <div>
          <h2 className="text-green-500 text-xs font-black tracking-widest uppercase">
            SIA_LIVE_COMMAND_CENTER
          </h2>
          <p className="text-[8px] text-gray-600">
            UPTIME: 99.9% // DATA_SOURCES: BINANCE, CRYPTOPANIC, OSINT_NODES
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastScanTime && (
            <span className="text-[8px] text-gray-700">
              LAST_SCAN: {lastScanTime.toLocaleTimeString()}
            </span>
          )}
          
          {/* Gemini AI Toggle */}
          <button
            onClick={toggleGemini}
            className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider transition-all ${
              geminiEnabled
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30'
                : 'bg-gray-800/20 text-gray-600 border border-gray-800/40 hover:bg-gray-800/30'
            }`}
          >
            {geminiEnabled ? '🤖 GEMINI_ACTIVE' : '🤖 GEMINI_OFF'}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_#22c55e] ${
              isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'
            }`} />
            <span className="text-[10px] text-green-500 font-bold">
              {isScanning ? 'SCANNING...' : 'STREAMING_LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {liveQueue.length > 0 ? (
        <div className="space-y-6">
          {liveQueue.map((news) => (
            <div 
              key={news.id} 
              className="border border-gray-900 p-5 bg-gradient-to-br from-[#050505] to-transparent relative group hover:border-green-900/40 transition-colors"
            >
              {/* ID Badge */}
              <div className="absolute top-0 right-0 p-2 text-[7px] text-gray-700 font-mono">
                ID: {news.id}
              </div>

              {/* Sentiment & Impact Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase ${
                  news.sentiment === 'BULLISH' 
                    ? 'bg-green-500/20 text-green-500 border border-green-500/40'
                    : news.sentiment === 'BEARISH'
                    ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                    : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                }`}>
                  {news.sentiment}
                </span>
                
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase ${
                  news.riskLevel === 'CRITICAL' 
                    ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                    : news.riskLevel === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/40'
                    : news.riskLevel === 'MODERATE'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                    : 'bg-green-500/20 text-green-500 border border-green-500/40'
                }`}>
                  RISK: {news.riskLevel}
                </span>
                
                <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  {news.confidence}% CONF
                </span>

                <span className={`px-2 py-0.5 text-[8px] font-black uppercase ${
                  news.ageStatus === 'FRESH'
                    ? 'bg-green-500/20 text-green-500 border border-green-500/40'
                    : news.ageStatus === 'ACTIVE'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                    : 'bg-gray-500/20 text-gray-500 border border-gray-500/40'
                }`}>
                  {news.ageStatus}
                </span>

                <span className={`px-2 py-0.5 text-[8px] font-black uppercase ${
                  news.sdi >= 0.6
                    ? 'bg-green-500/20 text-green-500 border border-green-500/40'
                    : news.sdi >= 0.4
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                    : 'bg-red-500/20 text-red-500 border border-red-500/40'
                }`}>
                  SDI: {news.sdi.toFixed(2)}
                </span>

                {news.source === 'BINANCE_LIVE' && (
                  <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/40">
                    🔴 LIVE
                  </span>
                )}
              </div>

              {/* Manipulation Warnings */}
              {news.manipulationFlags.length > 0 && (
                <div className="mb-3 p-2 bg-red-900/10 border border-red-900/30">
                  <div className="text-[7px] text-red-500 font-black uppercase tracking-wider mb-1">
                    ⚠ MANIPULATION_ALERTS
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {news.manipulationFlags.map((flag, idx) => (
                      <span key={idx} className="text-[7px] text-red-400 font-mono">
                        • {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <h3 className="text-white text-lg font-black italic tracking-tighter mb-2">
                {news.title}
              </h3>

              {/* Raw Intel */}
              <p className="text-gray-500 text-[11px] mb-4 border-l-2 border-green-600 pl-4 font-mono">
                {news.rawIntel}
              </p>

              {/* Localized Preview (TR) */}
              <div className="bg-black/50 border border-gray-900 p-3 mb-4">
                <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-widest">
                  LOCALIZED_PREVIEW // TR
                </div>
                <p className="text-gray-400 text-[10px] leading-relaxed">
                  {news.localized.TR}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button 
                  className="text-[9px] text-gray-700 uppercase hover:text-red-500 transition-colors font-bold tracking-wider"
                >
                  YOKSAY
                </button>
                
                <button 
                  onClick={() => handlePublish(news.id, news.title)}
                  className="px-6 py-2 bg-green-600/10 border border-green-500/40 text-green-500 text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                >
                  6 DİLDE YAYINLA & GLOBAL MÜHÜR BAS
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-800">
          <div className="w-8 h-8 border-2 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4" />
          <span className="text-[10px] tracking-[0.5em] font-mono">
            SCANNING_NETWORK_FOR_SIGNALS...
          </span>
        </div>
      )}
    </div>
  )
}
