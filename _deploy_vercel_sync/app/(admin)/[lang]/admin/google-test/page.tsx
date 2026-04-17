'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import SiaAdvancedAudit from '@/components/SiaAdvancedAudit'
import { Loader2, Radio } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function GoogleTestPage() {
  const { lang } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchingSignal, setFetchingSignal] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: 'Project Lazarus-X: Quantum Recovery Protocol Leak',
    content:
      'State Street and BNY Mellon are reportedly developing a quantum-based backdoor to recover over 3.7 million Bitcoins in dormant wallets by 2026. This move threatens the immutability of the blockchain and could inject $200B into the legacy financial system.',
    evidenceUrl: '',
    videoUrl: '',
    runOsint: true,
  })

  const fetchLatestSignal = async () => {
    setFetchingSignal(true)
    try {
      const response = await fetch('/api/google/fetch-signals', { cache: 'no-store' })
      const data = await response.json()
      if (data.success && data.signal) {
        setFormData({
          ...formData,
          title: data.signal.title,
          content: data.signal.content,
        })
        toast.success('Yeni istihbarat sinyali yakalandı!')
      } else {
        toast.error('Sinyal yakalanamadı: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Signal fetch failed:', error)
      toast.error('Uplink hatası: Google servislerine bağlanılamadı.')
    } finally {
      setFetchingSignal(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/google/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, language: lang }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Test failed:', error)
      setResult({ success: false, error: 'Network or server error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-white">
      <div className="border border-cyan-900/50 bg-black/80 p-8 rounded-lg shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-bold text-cyan-500 mb-2 font-mono">
          SIA_GOOGLE_INTEGRATION_TEST_V1.0
        </h1>
        <p className="text-gray-400 mb-8 border-b border-gray-800 pb-4">
          Test the Sovereign Core: Indexing, TTS, Vision, Sentiment, and OSINT nodes.
        </p>

        <div className="mb-10 p-4 border border-blue-500/20 bg-blue-500/5 rounded flex items-center justify-between">
          <div>
            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">
              Otonom İstihbarat Tarayıcı
            </div>
            <p className="text-[9px] text-gray-500">
              Google Trends ve OSINT düğümlerini kullanarak en taze sinyalleri yakalayın.
            </p>
          </div>
          <button
            onClick={fetchLatestSignal}
            disabled={fetchingSignal}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center gap-2"
          >
            {fetchingSignal ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
            {fetchingSignal ? 'TARANIYOR...' : 'YENİ SİNYAL YAKALA'}
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Intelligence Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black border border-gray-800 p-3 rounded text-cyan-100 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Content for Analysis & TTS
            </label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-black border border-gray-800 p-3 rounded text-gray-300 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Evidence Image URL (Vision Test)
              </label>
              <input
                type="text"
                placeholder="https://example.com/leak-photo.jpg"
                value={formData.evidenceUrl}
                onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                className="w-full bg-black border border-gray-800 p-3 rounded text-gray-300 focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Leaked Video URI (Video Intel)
              </label>
              <input
                type="text"
                placeholder="gs://your-bucket/leak.mp4"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full bg-black border border-gray-800 p-3 rounded text-gray-300 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-900/50 rounded border border-gray-800 w-full hover:bg-gray-800 transition-all">
              <input
                type="checkbox"
                checked={formData.runOsint}
                onChange={(e) => setFormData({ ...formData, runOsint: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
              <span className="text-sm text-gray-300">Run Google OSINT Leak Scan</span>
            </label>
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all ${
              loading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
            }`}
          >
            {loading ? 'PROCESSING THROUGH SOVEREIGN CORE...' : 'TRIGGER GOOGLE STACK'}
          </button>
        </div>

        {result && (
          <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-cyan-400 border-l-4 border-cyan-400 pl-4 uppercase">
              Core Output Report
            </h2>

            {/* Result Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900 rounded border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1">Truth Score</div>
                <div
                  className={`text-2xl font-mono ${
                    (result.processedResult?.truthAnalysis?.truthScore || 0) > 80
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {result.processedResult?.truthAnalysis?.truthScore || '0'}%
                </div>
              </div>
              <div className="p-4 bg-gray-900 rounded border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1">Sentiment</div>
                <div
                  className={`text-xl font-bold ${
                    result.processedResult?.marketPulse?.sentiment === 'BULLISH'
                      ? 'text-green-500'
                      : result.processedResult?.marketPulse?.sentiment === 'BEARISH'
                        ? 'text-red-500'
                        : 'text-yellow-500'
                  }`}
                >
                  {result.processedResult?.marketPulse?.sentiment || 'UNKNOWN'}
                </div>
              </div>
              <div className="p-4 bg-gray-900 rounded border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1">Indexing</div>
                <div className="text-sm font-mono text-cyan-400 truncate">
                  {result.processedResult?.indexingStatus || 'Pending'}
                </div>
              </div>
              <div className="p-4 bg-gray-900 rounded border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1">Detected Lang</div>
                <div className="text-xl font-bold text-yellow-500">
                  {result.processedResult?.detectedLanguage?.toUpperCase() || 'UND'}
                </div>
              </div>
            </div>

            {/* Translation & Truth Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-blue-950/10 rounded border border-blue-900/30">
                <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase flex items-center">
                  <span className="mr-2">🌐</span> Universal Decoder (Full Content Preview)
                </h3>
                <div className="max-h-64 overflow-y-auto text-[10px] text-gray-400 space-y-4 font-sans leading-relaxed">
                  {result.processedResult?.translations &&
                    Object.entries(result.processedResult.translations).map(([lang, text]: any) => (
                      <div key={lang} className="border-b border-white/5 pb-4">
                        <div className="text-blue-500 font-bold mb-1 uppercase tracking-tighter">
                          {lang}: FULL_ARTICLE_NODE
                        </div>
                        {text}
                      </div>
                    ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-green-950/10 rounded border border-green-900/30">
                  <h3 className="text-sm font-bold text-green-400 mb-2 uppercase flex items-center">
                    <span className="mr-2">⚖️</span> Truth Engine (Grounding)
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {result.processedResult?.truthAnalysis?.summary || 'No analysis available.'}
                  </p>
                </div>
                {/* Discover Visual Preview */}
                <div className="p-6 bg-amber-950/10 rounded border border-amber-900/30">
                  <h3 className="text-sm font-bold text-amber-400 mb-2 uppercase flex items-center">
                    <span className="mr-2">🖼️</span> Discover Visual Optimizer
                  </h3>
                  <div className="relative aspect-video rounded overflow-hidden mb-2">
                    <img
                      src={result.processedResult?.optimizedImageUrl}
                      className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                      alt="Discover Preview"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-black text-[8px] font-black uppercase">
                      1600px+ Ready
                    </div>
                  </div>
                  <p className="text-[9px] text-amber-500/60 italic">
                    Görsel otomatik olarak 1600px genişliğe ve 16:9 Discover oranına optimize
                    edildi.
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Section */}
            {result.processedResult?.audioBriefBase64 && (
              <div className="p-6 bg-cyan-950/20 rounded border border-cyan-900/50">
                <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase flex items-center">
                  <span className="mr-2">🔊</span> Intelligence Audio Briefing (Google TTS)
                </h3>
                <audio
                  controls
                  src={`data:audio/mp3;base64,${result.processedResult.audioBriefBase64}`}
                  className="w-full filter invert hue-rotate-180"
                />
              </div>
            )}

            {/* Video Analysis Section */}
            {result.videoAnalysis && (
              <div className="p-6 bg-purple-950/20 rounded border border-purple-900/50">
                <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase">
                  📹 Video Intelligence Output
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Detected Logos:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.videoAnalysis.logos.length > 0 ? (
                        result.videoAnalysis.logos.map((logo: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-900/40 text-purple-300 text-xs rounded"
                          >
                            {logo}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-600">None detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Speech Transcription:</span>
                    <p className="text-sm text-gray-300 mt-1 italic">
                      "{result.videoAnalysis.transcription}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OSINT Results */}
            {result.osintLeads?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-500 mb-4 uppercase">
                  OSINT Leak Detections
                </h3>
                <div className="space-y-2">
                  {result.osintLeads.map((lead: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-900/80 rounded border border-gray-800 text-sm"
                    >
                      <div className="text-cyan-400 font-bold mb-1">{lead.title}</div>
                      <div className="text-gray-500 text-xs mb-2 italic">{lead.source}</div>
                      <p className="text-gray-400 mb-2">{lead.snippet}</p>
                      <a
                        href={lead.link}
                        target="_blank"
                        className="text-cyan-600 hover:underline text-xs"
                      >
                        View Original Source &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🚀 NEW: SIA ADVANCED AUDIT DASHBOARD */}
            <div className="mt-16 pt-16 border-t border-gray-800">
              <SiaAdvancedAudit />
            </div>

            <div className="p-4 bg-black border border-gray-900 rounded-md">
              <details>
                <summary className="text-xs text-gray-600 cursor-pointer uppercase">
                  Raw Intelligence JSON
                </summary>
                <pre className="mt-4 p-4 bg-black text-xs text-cyan-800 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
