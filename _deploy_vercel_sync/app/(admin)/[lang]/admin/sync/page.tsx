'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  RefreshCw,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Zap,
  FileText,
  BarChart3,
  Activity,
  Loader2,
  ArrowRight,
  TrendingUp,
  Search,
  Wand2,
  Radio,
} from 'lucide-react'
import SiaAdvancedAudit from '@/components/SiaAdvancedAudit'

const SUPPORTED_LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

export default function SyncWorkspacePage() {
  const [workspaceData, setWorkspaceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isNormalizing, setIsNormalizing] = useState(false)
  const [isForcingTranslate, setIsForcingTranslate] = useState(false)
  const [normalizeStep, setNormalizeStep] = useState<string>('')
  const [normalizeDetails, setNormalizeDetails] = useState<string[]>([])
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: '',
  })
  const [selectedLang, setSelectedLang] = useState<string>('en')
  const [depthStats, setDepthStats] = useState<any[]>([])
  const [seoKeywords, setSeoKeywords] = useState<string[]>([])
  const [latestSyncs, setLatestSyncs] = useState<any[]>([])

  // 1. SCAN: Reads file + syncs to War Room
  const scanWorkspace = async () => {
    setIsLoading(true)
    setStatus({ type: 'idle', message: '' })
    try {
      const getRes = await fetch('/api/admin/sync-workspace', { cache: 'no-store' })
      const getResult = await getRes.json().catch(() => ({ success: false }))
      if (getResult.success && getResult.data) {
        setWorkspaceData(getResult.data)
        const postRes = await fetch('/api/admin/sync-workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const postData = await postRes.json().catch(() => ({ success: false }))
        if (postData.success) {
          setStatus({
            type: 'success',
            message: postData.message || '9-NODE GLOBAL SYNC COMPLETE.',
          })
          fetchLatestSyncs()
        } else {
          setStatus({ type: 'error', message: 'SYNC_FAILED: ' + (postData.error || 'Unknown') })
        }
      } else {
        setWorkspaceData(null)
        setStatus({
          type: 'error',
          message: getResult.error || 'WORKSPACE_OFFLINE: File not found.',
        })
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: 'SCAN_FAILED: ' + e.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 2. SYNC: Writes the loaded data to DB
  const initiateGlobalSync = async () => {
    if (!workspaceData || isSyncing) return
    setIsSyncing(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const res = await fetch('/api/admin/sync-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (result.success) {
        setStatus({
          type: 'success',
          message: '9-NODE GLOBAL DEPLOYMENT SUCCESSFUL. ARTICLES SEALED IN DATABASE.',
        })
        fetchLatestSyncs()
      } else {
        setStatus({
          type: 'error',
          message: 'DEPLOY_FAILED: ' + (result.error || 'Unknown DB error'),
        })
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: 'API_FATAL: ' + e.message })
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchLatestSyncs = async () => {
    try {
      const res = await fetch('/api/war-room/feed', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setLatestSyncs(data.data.slice(0, 5))
      }
    } catch {
      /* silent */
    }
  }

  const fetchDepthStats = async () => {
    try {
      const res = await fetch('/api/admin/normalize-workspace', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setDepthStats(data.stats || [])
        setSeoKeywords(data.seoKeywords || [])
      }
    } catch {
      /* silent */
    }
  }

  const forceFullTranslate = async () => {
    setIsForcingTranslate(true)
    setNormalizeStep('')
    setNormalizeDetails([])
    setStatus({ type: 'idle', message: '' })
    try {
      setNormalizeStep('FORCE TRANSLATING — Gemini 1.5 Pro rewriting ALL 8 nodes (3-6 min)…')
      const normRes = await fetch('/api/admin/normalize-workspace?force=true', { method: 'POST' })
      const normData = await normRes.json()
      if (!normData.success) {
        setStatus({ type: 'error', message: 'FORCE_TRANSLATE_FAILED: ' + normData.error })
        return
      }
      if (normData.details?.length) setNormalizeDetails(normData.details)

      setNormalizeStep('READING — Loading fresh translations…')
      const getRes = await fetch('/api/admin/sync-workspace', { cache: 'no-store' })
      const getResult = await getRes.json().catch(() => ({ success: false }))
      if (getResult.success && getResult.data) setWorkspaceData(getResult.data)

      setNormalizeStep('SYNCING — Deploying all 9 nodes to database…')
      const syncRes = await fetch('/api/admin/sync-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const syncData = await syncRes.json().catch(() => ({ success: false }))
      await fetchDepthStats()

      setStatus({
        type: syncData.success ? 'success' : 'error',
        message: syncData.success
          ? `FORCE TRANSLATE COMPLETE — ${normData.message}`
          : `FORCE TRANSLATED but SYNC_FAILED: ${syncData.error || 'DB error'}`,
      })
    } catch (e: any) {
      setStatus({ type: 'error', message: 'FORCE_TRANSLATE_FATAL: ' + e.message })
    } finally {
      setIsForcingTranslate(false)
      setNormalizeStep('')
    }
  }

  const normalizeWorkspace = async () => {
    setIsNormalizing(true)
    setNormalizeStep('')
    setNormalizeDetails([])
    setStatus({ type: 'idle', message: '' })
    try {
      // Step 1: Re-translate short language nodes with AI
      setNormalizeStep('TRANSLATING — AI re-writing short nodes (may take 2-4 min)…')
      const normRes = await fetch('/api/admin/normalize-workspace', { method: 'POST' })
      const normData = await normRes.json()
      if (!normData.success) {
        setStatus({ type: 'error', message: 'NORMALIZE_FAILED: ' + normData.error })
        return
      }
      if (normData.details?.length) setNormalizeDetails(normData.details)

      // Step 2: Re-scan workspace to get fresh data
      setNormalizeStep('READING — Loading updated workspace…')
      const getRes = await fetch('/api/admin/sync-workspace', { cache: 'no-store' })
      const getResult = await getRes.json().catch(() => ({ success: false }))
      if (getResult.success && getResult.data) {
        setWorkspaceData(getResult.data)
      }

      // Step 3: Auto-sync normalized data to DB
      setNormalizeStep('SYNCING — Deploying 9 nodes to database…')
      const syncRes = await fetch('/api/admin/sync-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const syncData = await syncRes.json().catch(() => ({ success: false }))

      // Step 4: Refresh depth stats
      await fetchDepthStats()

      if (syncData.success) {
        setStatus({
          type: 'success',
          message: `NORMALIZED & SYNCED — ${normData.message} → ${syncData.message || 'DB Updated.'}`,
        })
      } else {
        setStatus({
          type: 'error',
          message: `NORMALIZED but SYNC_FAILED: ${syncData.error || 'DB error'}`,
        })
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: 'NORMALIZE_FATAL: ' + e.message })
    } finally {
      setIsNormalizing(false)
      setNormalizeStep('')
    }
  }

  useEffect(() => {
    scanWorkspace()
    fetchDepthStats()
    fetchLatestSyncs()
  }, [])

  const getWordCount = (text: any) => {
    if (typeof text !== 'string') return 0
    // CJK characters (Chinese, Japanese, Korean) don't use spaces — count characters / 2 as word equivalent
    const cjkChars = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
    if (cjkChars > 30) return Math.round(cjkChars / 2)
    return text.split(/\s+/).filter(Boolean).length
  }

  return (
    <div className="flex-1 bg-[#050506] text-slate-300 font-mono p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Database size={20} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">
              SIA_SYNC_ENGINE_V4.9
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
            Global Sync <span className="text-blue-600">Command</span>
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-xs leading-relaxed uppercase opacity-60 italic">
            "Automated Multi-Node Deployment System"
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 min-w-[220px]">
          <button
            onClick={scanWorkspace}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 border border-blue-500/40 bg-blue-600/20 rounded-sm hover:bg-blue-600/30 hover:border-blue-500/60 text-[9px] font-black uppercase tracking-widest text-blue-400 transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {isLoading ? 'Scanning Disk...' : 'Scan Workspace'}
          </button>
          <button
            onClick={normalizeWorkspace}
            disabled={isNormalizing || isForcingTranslate}
            className="w-full flex flex-col items-center justify-center gap-1 px-6 py-2.5 border border-amber-500/40 bg-amber-600/10 rounded-sm hover:bg-amber-600/20 hover:border-amber-500/60 text-[9px] font-black uppercase tracking-widest text-amber-400 transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            <span className="flex items-center gap-2">
              {isNormalizing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              {isNormalizing ? 'AI Translating...' : 'Normalize Depth (AI Re-Translate)'}
            </span>
            {isNormalizing && normalizeStep && (
              <span className="text-[7px] text-amber-300/70 font-medium normal-case tracking-wide">
                {normalizeStep}
              </span>
            )}
          </button>
          <button
            onClick={forceFullTranslate}
            disabled={isNormalizing || isForcingTranslate || !workspaceData}
            className="w-full flex flex-col items-center justify-center gap-1 px-6 py-2.5 border border-rose-500/40 bg-rose-600/10 rounded-sm hover:bg-rose-600/20 hover:border-rose-500/60 text-[9px] font-black uppercase tracking-widest text-rose-400 transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            <span className="flex items-center gap-2">
              {isForcingTranslate ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              {isForcingTranslate ? 'Force Translating...' : 'Force Full Re-Translate (8 Langs)'}
            </span>
            {isForcingTranslate && normalizeStep && (
              <span className="text-[7px] text-rose-300/70 font-medium normal-case tracking-wide">
                {normalizeStep}
              </span>
            )}
            {!isForcingTranslate && (
              <span className="text-[7px] text-rose-400/40 font-medium normal-case tracking-wide">
                Gemini 1.5 Pro · No limits · ~4-6 min
              </span>
            )}
          </button>
          <button
            onClick={initiateGlobalSync}
            disabled={!workspaceData || isSyncing}
            className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-sm hover:bg-blue-500 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isSyncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} className="group-hover:animate-pulse" />
            )}
            Initiate Global Sync
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status.type !== 'idle' && (
          <motion.div
            key="status-alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-sm mb-8 flex items-center gap-4 border shadow-2xl ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {status.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <CyberBox title="Package Integrity Audit" icon={FileText}>
            {workspaceData ? (
              <div className="divide-y divide-white/5">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-sm flex items-center justify-center text-blue-500 shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-60">
                        Payload Headline
                      </span>
                      <h2 className="text-base font-black text-white uppercase italic tracking-tight leading-snug">
                        {workspaceData.en?.title ||
                          workspaceData.tr?.title ||
                          'Unknown Intelligence'}
                      </h2>
                    </div>
                  </div>

                  {(workspaceData.imageUrl || workspaceData.en?.imageUrl) && (
                    <div className="relative h-36 w-full rounded-sm overflow-hidden border border-white/5 mb-5 group shadow-xl">
                      <img
                        src={workspaceData.imageUrl || workspaceData.en?.imageUrl}
                        alt="Visual"
                        className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-blue-600/20 border border-blue-500/40 text-[8px] font-black uppercase tracking-widest rounded-sm backdrop-blur-xl">
                          VISUAL_SOURCE_SEALED
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm mb-3">
                    <p className="text-slate-400 text-[11px] leading-relaxed italic border-l-2 border-blue-600/30 pl-3 font-bold tracking-tighter line-clamp-3">
                      {workspaceData.en?.summary ||
                        workspaceData.tr?.summary ||
                        'Verification summary not available.'}
                    </p>
                  </div>

                  {/* Full content preview — compact */}
                  {(workspaceData.en?.content || workspaceData.tr?.content) && (
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-sm max-h-[200px] overflow-y-auto custom-scrollbar">
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2 block">
                        Content Preview
                      </span>
                      <p className="text-slate-500 text-[10px] leading-relaxed whitespace-pre-wrap">
                        {workspaceData.en?.content || workspaceData.tr?.content}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <Globe2 size={14} className="text-blue-500" />
                    Distributed Node Verification
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {SUPPORTED_LANGS.map((lg) => {
                      const node = workspaceData[lg]
                      const rawContent = node?.content || node?.text || ''
                      const rawWordCount = getWordCount(rawContent || node?.summary || '')
                      const masterWordCount = getWordCount(
                        workspaceData.en?.content || workspaceData.tr?.content || ''
                      )
                      const isFallback = rawWordCount < 80 && masterWordCount > 80
                      const hasData =
                        !!(node && (node.title || rawContent || node.summary)) || isFallback
                      const displayWordCount = isFallback ? masterWordCount : rawWordCount
                      const isSelected = selectedLang === lg

                      return (
                        <button
                          key={lg}
                          onClick={() => setSelectedLang(lg)}
                          className={`p-4 rounded-sm border transition-all text-left cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/30'
                              : hasData
                                ? isFallback
                                  ? 'bg-amber-600/5 border-amber-500/30 hover:bg-amber-600/10 hover:border-amber-500/50'
                                  : 'bg-blue-600/5 border-blue-500/30 hover:bg-blue-600/10 hover:border-blue-500/50'
                                : 'bg-white/[0.01] border-white/5 opacity-20 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-[11px] font-black uppercase ${isSelected ? 'text-white' : 'text-white/90'}`}
                            >
                              {lg}
                            </span>
                            {hasData ? (
                              <CheckCircle2
                                size={12}
                                className={
                                  isSelected
                                    ? 'text-blue-400'
                                    : isFallback
                                      ? 'text-amber-400'
                                      : 'text-emerald-500'
                                }
                              />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[9px] uppercase tracking-widest">
                              <span className="text-white/20">Status:</span>
                              <span
                                className={
                                  hasData
                                    ? isSelected
                                      ? 'text-blue-300 font-bold'
                                      : isFallback
                                        ? 'text-amber-400 font-bold'
                                        : 'text-emerald-400 font-bold'
                                    : 'text-rose-500'
                                }
                              >
                                {hasData
                                  ? isSelected
                                    ? 'ACTIVE'
                                    : isFallback
                                      ? 'FALLBACK'
                                      : 'READY'
                                  : 'NULL'}
                              </span>
                            </div>
                            <div className="flex justify-between text-[9px] uppercase tracking-widest">
                              <span className="text-white/20">Depth:</span>
                              <span
                                className={
                                  isSelected
                                    ? 'text-white font-black'
                                    : isFallback
                                      ? 'text-amber-400 font-black'
                                      : 'text-blue-400 font-black'
                                }
                              >
                                {displayWordCount} W{isFallback ? '*' : ''}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-3 flex items-center gap-1 text-[8px] text-blue-400 font-black uppercase tracking-widest">
                              <ArrowRight size={10} /> View Content
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-32 flex flex-col items-center justify-center gap-4 text-white/10 border-2 border-dashed border-white/5 m-8 text-center">
                <RefreshCw size={48} className={isLoading ? 'animate-spin' : ''} />
                <span className="text-[11px] uppercase tracking-[0.4em] font-black italic">
                  Awaiting Disk Scan...
                </span>
              </div>
            )}
          </CyberBox>

          {/* Depth Audit */}
          {depthStats.length > 0 && (
            <CyberBox title="Depth Audit — Word Count vs EN" icon={TrendingUp}>
              <div className="p-6 space-y-3">
                {depthStats.map((s) => (
                  <div key={s.lang} className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-black">
                      <span className="text-white/60 w-8">{s.lang}</span>
                      <span
                        className={
                          s.pct >= 90
                            ? 'text-emerald-400'
                            : s.pct >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        }
                      >
                        {s.wordCount}W — {s.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className={`h-full rounded-full ${s.pct >= 90 ? 'bg-emerald-500' : s.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[8px] text-white/20 italic pt-2 uppercase tracking-widest">
                  * Below 85% of EN → "Normalize Depth" re-translates via Gemini/Groq AI
                </p>
                {normalizeDetails.length > 0 && (
                  <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-sm space-y-1">
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-2">
                      Last Normalize Run
                    </span>
                    {normalizeDetails.map((d, i) => {
                      const isSkipped = d.includes('SKIPPED')
                      const isFailed = d.includes('FAILED')
                      return (
                        <div key={i} className="flex items-center gap-2 text-[8px] font-mono">
                          <span
                            className={
                              isSkipped
                                ? 'text-white/20'
                                : isFailed
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                            }
                          >
                            {isSkipped ? '—' : isFailed ? '✗' : '✓'}
                          </span>
                          <span
                            className={
                              isSkipped
                                ? 'text-white/20'
                                : isFailed
                                  ? 'text-rose-300'
                                  : 'text-white/60'
                            }
                          >
                            {d}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CyberBox>
          )}

          {/* SEO Keyword Audit */}
          {depthStats.length > 0 && (
            <CyberBox title="SEO Golden Keywords Audit" icon={Search}>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {seoKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-wider rounded-sm"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {depthStats.map((s) => (
                    <div key={s.lang} className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-white/50 w-8">
                        {s.lang}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.round((s.seoKeywordsFound / s.seoKeywordsTotal) * 100)}%`,
                          }}
                          transition={{ duration: 0.6, delay: 0.05 }}
                          className={`h-full rounded-full ${s.seoKeywordsFound === s.seoKeywordsTotal ? 'bg-emerald-500' : s.seoKeywordsFound >= s.seoKeywordsTotal * 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-black w-16 text-right ${s.seoKeywordsFound === s.seoKeywordsTotal ? 'text-emerald-400' : s.seoKeywordsFound >= s.seoKeywordsTotal * 0.6 ? 'text-amber-400' : 'text-rose-400'}`}
                      >
                        {s.seoKeywordsFound}/{s.seoKeywordsTotal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CyberBox>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Discord Distribution Panel */}
          <DiscordPanel />

          {/* Latest Activity Log */}
          <CyberBox title="Latest Activity Log" icon={Activity}>
            <div className="p-5 space-y-4">
              {latestSyncs.length > 0 ? (
                <div className="space-y-3">
                  {latestSyncs.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white uppercase italic tracking-tight truncate max-w-[180px]">
                          {s.title}
                        </span>
                        <span className="text-[8px] font-mono text-white/20">
                          {new Date(s.published_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 text-[7px] font-black uppercase rounded-sm">
                          SYNCED
                        </span>
                        <span className="text-[7px] text-white/20 uppercase tracking-widest">
                          {s.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-white/10 uppercase font-black text-[9px] tracking-widest">
                  No recent activity detected
                </div>
              )}
            </div>
          </CyberBox>

          {/* Sync Health bar */}
          <CyberBox title="Sync Health Monitor" icon={Zap}>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                    Global Readiness
                  </span>
                  <span className="text-3xl font-black text-white italic tracking-tighter tabular-nums">
                    {workspaceData
                      ? Math.round(
                          (SUPPORTED_LANGS.filter((l) => workspaceData[l]).length / 9) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, workspaceData ? (SUPPORTED_LANGS.filter((l) => workspaceData[l]).length / 9) * 100 : 0)}%`,
                    }}
                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Network Nodes', val: '09/09', color: 'text-white' },
                  { label: 'Security', val: 'AES_256_LOCKED', color: 'text-emerald-500' },
                  { label: 'Uptime', val: 'OPTIMAL', color: 'text-emerald-500' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-[9px] uppercase font-black tracking-widest border-b border-white/5 pb-2"
                  >
                    <span className="text-white/20">{item.label}:</span>
                    <span className={item.color}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </CyberBox>

          {/* Language Content Viewer */}
          <CyberBox title={`Content Viewer — ${selectedLang.toUpperCase()}`} icon={FileText}>
            {workspaceData ? (
              <ContentViewer
                workspaceData={workspaceData}
                selectedLang={selectedLang}
                getWordCount={getWordCount}
              />
            ) : (
              <div className="p-12 text-center text-white/10">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
                <p className="text-[9px] uppercase font-black tracking-widest">Awaiting Scan...</p>
              </div>
            )}
          </CyberBox>
        </div>
      </div>

      {/* 🚀 NEW: SIA ADVANCED AUDIT DASHBOARD - Integrated at the bottom */}
      <div className="mt-16 pt-16 border-t border-white/5">
        <div className="mb-8">
          <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.5em] flex items-center gap-3">
            <Activity size={18} />
            Sovereign Intelligence Audit Core
          </h3>
          <p className="text-[10px] text-white/20 mt-2 tracking-widest uppercase">
            Deep semantic verification & predictive reach analytics
          </p>
        </div>
        <SiaAdvancedAudit />
      </div>
    </div>
  )
}

function DiscordPanel() {
  const [testing, setTesting] = React.useState(false)
  const [result, setResult] = React.useState<'idle' | 'ok' | 'fail'>('idle')
  const webhookConfigured = !!process.env.NEXT_PUBLIC_DISCORD_INVITE

  const testWebhook = async () => {
    setTesting(true)
    setResult('idle')
    try {
      const res = await fetch('/api/discord/test', { method: 'POST' })
      const data = await res.json()
      setResult(data.success ? 'ok' : 'fail')
    } catch {
      setResult('fail')
    } finally {
      setTesting(false)
    }
  }

  return (
    <CyberBox title="Discord Distribution" icon={Radio}>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-sm">
          <div className="w-8 h-8 bg-[#5865F2] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">D</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
              Auto-Notify on Sync
            </p>
            <p className="text-[11px] font-black text-white">Discord Webhook</p>
          </div>
          <div
            className={`ml-auto w-2 h-2 rounded-full ${result === 'ok' ? 'bg-emerald-500' : result === 'fail' ? 'bg-rose-500' : 'bg-white/20'} animate-pulse`}
          />
        </div>

        <div className="space-y-2 text-[9px] uppercase tracking-widest font-black">
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-white/20">Trigger:</span>
            <span className="text-blue-400">On Global Sync</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-white/20">Format:</span>
            <span className="text-white/60">Rich Embed + Buttons</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-white/20">Languages:</span>
            <span className="text-white/60">EN + TR links</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-white/20">Status:</span>
            <span
              className={
                result === 'ok'
                  ? 'text-emerald-400'
                  : result === 'fail'
                    ? 'text-rose-400'
                    : 'text-amber-400'
              }
            >
              {result === 'ok' ? 'CONNECTED' : result === 'fail' ? 'ERROR' : 'AWAITING KEY'}
            </span>
          </div>
        </div>

        {result === 'fail' && (
          <p className="text-[8px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-sm p-2 leading-relaxed">
            DISCORD_WEBHOOK_URL .env.local dosyasına eklenmemiş. Discord kanalından webhook URL alıp
            ekle.
          </p>
        )}

        <button
          onClick={testWebhook}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5865F2]/20 border border-[#5865F2]/40 hover:bg-[#5865F2]/30 rounded-sm text-[9px] font-black uppercase tracking-widest text-[#7289da] transition-all disabled:opacity-50 cursor-pointer"
        >
          {testing ? <Loader2 size={10} className="animate-spin" /> : <Radio size={10} />}
          {testing ? 'Sending Test...' : 'Send Test Message'}
        </button>
      </div>
    </CyberBox>
  )
}

function ContentViewer({
  workspaceData,
  selectedLang,
  getWordCount,
}: {
  workspaceData: any
  selectedLang: string
  getWordCount: (t: any) => number
}) {
  const node = workspaceData[selectedLang]
  const rawContent = node?.content || node?.text || ''
  const masterContent = workspaceData.en?.content || workspaceData.tr?.content || ''
  const masterTitle = workspaceData.en?.title || workspaceData.tr?.title || ''
  const masterSummary = workspaceData.en?.summary || workspaceData.tr?.summary || ''
  const isFallback = getWordCount(rawContent) < 80 && getWordCount(masterContent) > 80
  const displayContent = isFallback ? masterContent : rawContent
  const displayTitle = node?.title || (isFallback ? masterTitle : '')
  const displaySummary = node?.summary || (isFallback ? masterSummary : '')

  return (
    <div className="p-5 space-y-4">
      {isFallback && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-sm">
          <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
            EN Fallback Active — Native content unavailable
          </span>
        </div>
      )}
      {displayTitle && (
        <div>
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block opacity-60">
            Title
          </span>
          <p className="text-white text-xs font-black uppercase leading-snug italic">
            {displayTitle}
          </p>
        </div>
      )}
      {displaySummary && (
        <div>
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block opacity-60">
            Summary
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed border-l-2 border-blue-600/30 pl-3">
            {displaySummary}
          </p>
        </div>
      )}
      {displayContent ? (
        <div>
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2 block">
            Full Content — {getWordCount(displayContent)} words
          </span>
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            <p className="text-slate-500 text-[10px] leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-white/20">
          <Globe2 size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-[9px] uppercase font-black tracking-widest">
            No Content — Select another node
          </p>
        </div>
      )}
    </div>
  )
}

function CyberBox({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-sm overflow-hidden flex flex-col min-h-0 transition-all hover:border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
      <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-blue-500" />}
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">
            {title}
          </span>
        </div>
        <div className="flex gap-1.5 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
