'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Loader2,
  Terminal,
  Globe2,
  Eye,
  Edit3,
  Shield,
  Activity,
  Image as ImageIcon,
  Send,
  AlertCircle,
  Database,
  Wand2,
  FileJson,
} from 'lucide-react'
import { applyLegalShield, LEGAL_CONFIG } from '@/lib/compliance/legal-enforcer'
import TechnicalChart from '@/components/TechnicalChart'
import { transformRawToArticle, type FormattedArticle } from '@/lib/editorial/transform-raw-to-article'
import { processSIAMasterProtocol } from '@/lib/content/sia-master-protocol-v4'
import { runDeepAudit, type AuditResult } from '@/lib/neural-assembly/sia-sentinel-core'
import { Language } from '@/lib/store/language-store'
import PandaImport from './components/PandaImport'
import { PandaPackage, PANDA_REQUIRED_LANGS } from '@/lib/editorial/panda-intake-validator'
import { runGlobalGovernanceAudit, type GlobalAuditResult } from '@/lib/editorial/global-governance-audit'
import RemediationPreviewPanel from './components/RemediationPreviewPanel'

// Fallback implementations for missing dependencies
function formatArticleBody(body: string, lang: string): string {
  return body.replace(/\n/g, '<br />')
}

const SUPPORTED_LANGS = ['en', 'de', 'es', 'fr', 'ru', 'ar', 'jp', 'zh', 'tr'] as const
type SupportedLang = (typeof SUPPORTED_LANGS)[number]

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
  ar: 'Arabic',
  jp: 'Japanese',
  zh: 'Chinese',
}

const CATEGORY_OPTIONS = ['MARKET', 'AI', 'CRYPTO', 'STOCKS', 'ECONOMY'] as const

function getLangFieldSuffix(lang: string): string {
  const normalized = (lang || '').toLowerCase()
  const map: Record<string, string> = {
    en: 'En',
    tr: 'Tr',
    de: 'De',
    es: 'Es',
    fr: 'Fr',
    ru: 'Ru',
    ar: 'Ar',
    jp: 'Jp',
    zh: 'Zh',
  }
  return map[normalized] || 'En'
}

function LiveClock() {
  const [dt, setDt] = useState<{ date: string; time: string } | null>(null)
  useEffect(() => {
    const update = () =>
      setDt({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span suppressHydrationWarning className="tabular-nums font-bold text-white/80">
      {dt ? `${dt.date} // ${dt.time}` : '– // –:–:–'}
    </span>
  )
}

function CyberBox({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  icon: any
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`border border-white/15 bg-gradient-to-b from-[#151920]/92 via-[#0d1016]/92 to-[#080a0e]/95 backdrop-blur-md flex flex-col min-h-0 overflow-hidden rounded-lg ring-1 ring-white/10 shadow-[0_18px_34px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="border-b border-white/15 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-white/12 via-white/7 to-white/4 shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.5)]" />}
          <span className="text-xs font-black uppercase tracking-wider text-white/80">
            {title}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]/30" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  )
}

export default function WarRoom() {
  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [activeLang, setActiveLang] = useState<SupportedLang>('en')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false)
  const [publishCategory, setPublishCategory] = useState('MARKET')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const lockRef = useRef<string | null>(null)
  const [transformedArticle, setTransformedArticle] = useState<FormattedArticle | null>(null)
  const [isTransforming, setIsTransforming] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)
  const [transformError, setTransformError] = useState<string | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [globalAudit, setGlobalAudit] = useState<GlobalAuditResult | null>(null)

  const [manualTitle, setManualTitle] = useState('')
  const [manualSummary, setManualSummary] = useState('')
  const [isPandaImportOpen, setIsPandaImportOpen] = useState(false)
  const [lastImportInfo, setLastImportInfo] = useState<{ id: string; time: string } | null>(null)

  const [vault, setVault] = useState<
    Record<string, { title: string; desc: string; ready: boolean }>
  >({
    tr: { title: '', desc: '', ready: false },
    en: { title: '', desc: '', ready: false },
    fr: { title: '', desc: '', ready: false },
    de: { title: '', desc: '', ready: false },
    es: { title: '', desc: '', ready: false },
    ru: { title: '', desc: '', ready: false },
    ar: { title: '', desc: '', ready: false },
    jp: { title: '', desc: '', ready: false },
    zh: { title: '', desc: '', ready: false },
  })

  // Protocol configuration
  const [protocolConfig, setProtocolConfig] = useState({
    enableScarcityTone: false,
    enableGlobalLexicon: true,
    enableFinancialGravity: true,
    enableVerificationFooter: true
  })

  // Fail-closed gate logic
  const isDeployBlocked = useMemo(() => {
    // Basic connectivity and ready checks
    if (!selectedNews || !vault[activeLang].ready || isPublishing || isTransforming || transformError) {
      return true
    }
    // MUST have a global audit pass
    if (!globalAudit || !globalAudit.publishable) {
      return true
    }
    // Must have a transformed article and audit result for active language
    if (!transformedArticle || !auditResult) {
      return true
    }
    // Strict audit score threshold
    if (auditResult.overall_score < 70) {
      return true
    }
    // Scarcity Tone requires Sovereign-level validation (85+)
    if (protocolConfig.enableScarcityTone && auditResult.overall_score < 85) {
      return true
    }
    return false
  }, [
    selectedNews,
    vault,
    activeLang,
    isPublishing,
    isTransforming,
    transformError,
    transformedArticle,
    auditResult,
    globalAudit,
    protocolConfig.enableScarcityTone
  ])

  const activeDraft = vault[activeLang] || { title: '', desc: '', ready: false }

  const activeWordCount = useMemo(() => {
    const body = (activeDraft.desc || '').trim()
    return body ? body.split(/\s+/).filter(Boolean).length : 0
  }, [activeDraft.desc])

  const loadManualDraft = () => {
    if (!manualTitle.trim() || !manualSummary.trim()) return
    
    setSelectedNews({ id: 'manual_input', title: manualTitle })
    setImageUrl(null)
    setTransformedArticle(null)
    setTransformError(null)
    setAuditResult(null)
    setGlobalAudit(null) // Clear stale global audit
    
    const resetVault: any = {}
    SUPPORTED_LANGS.forEach((l) => {
      resetVault[l] = {
        title: manualTitle,
        desc: manualSummary,
        ready: true,
      }
    })
    setVault(resetVault)
    setActiveLang('en')
  }

  const clearManualInput = () => {
    setManualTitle('')
    setManualSummary('')
  }

  const applyPandaPackageToVault = (pkg: PandaPackage) => {
    const newVault = { ...vault }

    PANDA_REQUIRED_LANGS.forEach((lang) => {
      const node = pkg.languages[lang]

      // Compose description from all available fields to preserve intelligence depth
      const composedDesc = [
        `[SUBHEADLINE]\n${node.subheadline}`,
        `[SUMMARY]\n${node.summary}`,
        `[BODY]\n${node.body}`,
        `[KEY_INSIGHTS]\n${node.keyInsights.map(i => `• ${i}`).join('\n')}`,
        `[RISK_NOTE]\n${node.riskNote}`,
        `[SEO_TITLE]\n${node.seoTitle}`,
        `[SEO_DESCRIPTION]\n${node.seoDescription}`,
        `[PROVENANCE]\n${node.provenanceNotes}`
      ].join('\n\n')

      newVault[lang] = {
        title: node.headline,
        desc: composedDesc,
        ready: true
      }
    })

    setVault(newVault)
    setTransformedArticle(null)
    setTransformError(null)
    setAuditResult(null)
    setGlobalAudit(null)
    setActiveLang('en')
    setSelectedNews({ id: pkg.articleId, title: pkg.languages.en.headline })
    setLastImportInfo({ id: pkg.articleId, time: new Date().toLocaleTimeString() })
    setIsPandaImportOpen(false)

    alert(`✅ PANDA_IMPORT_SUCCESS: ${pkg.articleId} // 9 Languages Loaded. Global audit required.`)
  }

  const syncFromAiWorkspace = async () => {
    setIsSyncingWorkspace(true)
    try {
      const res = await fetch('/api/war-room/workspace')
      const data = await res.json()
      if (data.success && data.data) {
        // Normalize workspace source: support both nested (articles[0]) and top-level structures
        const ws = data.data.articles?.[0] || data.data
        const newVault = { ...vault }

        let hydrationCount = 0
        SUPPORTED_LANGS.forEach((lang) => {
          if (ws[lang]) {
            newVault[lang] = {
              title: ws[lang].title,
              desc: ws[lang].content || ws[lang].desc || '',
              ready: true,
            }
            hydrationCount++
          }
        })

        // Only proceed if at least one language was hydrated
        if (hydrationCount > 0) {
          setVault(newVault)
          // FORCE IMAGE SYNC
          const img = ws.imageUrl || ws.en?.imageUrl || null
          setImageUrl(img)

          if (!selectedNews)
            setSelectedNews({ id: 'workspace_sync', title: ws.en?.title || 'AI Sync Node' })
          alert('✅ SYSTEM SYNCED: All nodes and Visuals operational.')
        } else {
          alert('❌ SYNC_FAILED: No valid language data found in workspace')
        }
      }
    } catch (e: any) {
      alert('❌ SYNC_FAILED: ' + e.message)
    } finally {
      setIsSyncingWorkspace(false)
    }
  }

  const handlePublish = async () => {
    // FAIL-CLOSED GATING ENFORCEMENT
    if (isDeployBlocked) {
      console.error('[WARROOM] Publish blocked: Gating criteria not met.')
      alert('❌ PUBLISH BLOCKED: Content did not pass all required quality gates.')
      return
    }

    setIsPublishing(true)

    // ... (existing body construction)
    const deployTitle = transformedArticle ? transformedArticle.headline : vault[activeLang].title
    const deployBody = transformedArticle
      ? [
          transformedArticle.summary,
          transformedArticle.body,
          transformedArticle.keyInsights.length
            ? '**Key Insights:**\n' + transformedArticle.keyInsights.map((i) => `• ${i}`).join('\n')
            : '',
          transformedArticle.riskNote ? `*${transformedArticle.riskNote}*` : '',
        ]
          .filter(Boolean)
          .join('\n\n')
      : vault[activeLang].desc

    const finalContent = applyLegalShield(deployBody, activeLang)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    try {
      await fetch(`${origin}/api/content-buffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          article: {
            headline: deployTitle,
            fullContent: finalContent,
            imageUrl: imageUrl ?? undefined,
            language_code: activeLang,
            source: 'SIA_WAR_ROOM',
            category: publishCategory,
          },
        }),
      })

      const savePayload: Record<string, any> = {
        imageUrl: imageUrl ?? undefined,
        source: 'SIA_WAR_ROOM',
        category: publishCategory,
        status: 'published',
      }

      SUPPORTED_LANGS.forEach((lang) => {
        if (vault[lang].ready) {
          const suffix = getLangFieldSuffix(lang)
          // For the active language, use transformed title if available
          const titleToSave = (lang === activeLang && transformedArticle)
            ? transformedArticle.headline
            : vault[lang].title
          const contentToSave = (lang === activeLang && transformedArticle)
            ? finalContent
            : vault[lang].desc
          savePayload[`title${suffix}`] = titleToSave
          savePayload[`content${suffix}`] = contentToSave
        }
      })

      // SYNC TO AI_WORKSPACE.JSON (Mandatory Pre-Publish Gate)
      try {
        const workspaceArticle = {
          id: selectedNews.id,
          created_at: new Date().toISOString(),
          imageUrl: imageUrl ?? undefined,
          category: publishCategory,
          status: 'published',
          [activeLang]: {
            title: deployTitle,
            summary: transformedArticle?.summary || '',
            content: finalContent,
            imageUrl: imageUrl ?? ''
          }
        }
        const wsRes = await fetch(`/api/war-room/workspace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workspaceArticle),
        })

        if (!wsRes.ok) {
          const errorData = await wsRes.json().catch(() => ({}))
          throw new Error(errorData.error || 'Workspace staging failed')
        }
      } catch (wsErr) {
        console.error('[WARROOM] Workspace sync blocked deploy:', wsErr)
        alert(`❌ DEPLOY BLOCKED: Staging layer failure. ${ (wsErr as Error).message }`)
        setIsPublishing(false)
        return // TERMINAL BLOCK: Do not proceed to database save
      }

      const saveRes = await fetch(`/api/war-room/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      })

      const saveData = await saveRes.json()

      // Handle duplicate detection (409 Conflict)
      if (saveRes.status === 409 && saveData.duplicate) {
        setIsPublishing(false)
        const matchedTitle = saveData.matchedTitle || 'Unknown article'
        alert(`⚠️ DUPLICATE DETECTED\n\nAn article with a similar title already exists:\n"${matchedTitle}"\n\nPlease adjust the headline to proceed.`)
        return
      }

      // Handle other errors
      if (!saveRes.ok || !saveData.success) {
        alert(`❌ PUBLISH FAILED: ${saveData.error || 'Unknown error'}`)
        return
      }

      // Success
      alert(`🚀 GLOBAL DEPLOY SUCCESS: ${activeLang.toUpperCase()}`)
    } catch (publishErr) {
      console.error('[WARROOM] Publish failed:', (publishErr as Error).message)
      alert(`❌ PUBLISH FAILED: ${(publishErr as Error).message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleTransform = async () => {
    const raw = activeDraft.desc || ''
    if (!raw.trim()) return
    setIsTransforming(true)
    setTransformError(null)
    setAuditResult(null)
    setGlobalAudit(null)
    setTransformedArticle(null) // CLEAR STATE BEFORE NEW TRANSFORM

    try {
      const result = await transformRawToArticle(raw)

      // APPLY SIA PROTOCOL
      const processed = processSIAMasterProtocol(result.body, activeLang as Language, {
        ...protocolConfig,
        confidenceScore: 98.4
      })

      const finalArticle = {
        ...result,
        body: processed.content
      }

      // RUN DEEP AUDIT
      // Concatenate all visible fields to ensure no residue hides in meta fields
      const auditText = [
        finalArticle.headline,
        finalArticle.subheadline,
        finalArticle.summary,
        finalArticle.body,
        finalArticle.riskNote,
        ...finalArticle.keyInsights
      ].join('\n\n');

      const audit = runDeepAudit({
        title: finalArticle.headline,
        body: auditText,
        summary: finalArticle.summary,
        language: activeLang,
        schema: { '@type': 'NewsArticle' }
      })

      setAuditResult(audit)

      // ONLY SET ARTICLE IF AUDIT PASSED (OR SHOW AS BLOCKED)
      if (audit.overall_score > 0) {
        setTransformedArticle(finalArticle)
      } else {
        setTransformError('DETERMINISTIC_RESIDUE_BLOCK: Content failed mandatory audit gate.')
      }
    } catch (err: any) {
      console.error('[WARROOM] Transform failed:', err)
      setTransformError(err?.message || 'Transform failed. Raw content preserved.')
    } finally {
      setIsTransforming(false)
    }
  }

  const handleGlobalAudit = async () => {
    if (!selectedNews) return
    setIsAuditing(true)
    try {
      const result = await runGlobalGovernanceAudit(selectedNews.id, vault)
      setGlobalAudit(result)
      if (result.status === 'FAIL') {
        alert(`❌ GLOBAL AUDIT FAILED: ${result.failedLanguages.length} languages blocked deploy.`)
      } else {
        alert('✅ GLOBAL AUDIT SUCCESS: All 9 nodes validated.')
      }
    } catch (e: any) {
      alert('❌ AUDIT_ENGINE_ERROR: ' + e.message)
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-br from-[#0a0a0f] via-[#18181c] to-[#0a0a0f] text-[13px] text-white font-mono">
      <header className="h-14 border-b border-[#23232a] bg-gradient-to-r from-[#18181c]/95 to-[#23232a]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-50 shadow-lg shadow-black/60">
        <div className="flex items-center gap-6">
          <Shield className="w-5 h-5 text-[#FFB800] drop-shadow-[0_0_6px_rgba(255,184,0,0.6)]" />
          <h1 className="text-2xl font-black italic tracking-tight text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
            SIA<span className="text-white">INTEL</span>
          </h1>
          <button
            onClick={syncFromAiWorkspace}
            disabled={isSyncingWorkspace}
            className="ml-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-700/80 to-blue-500/70 border-2 border-blue-400/60 rounded-lg text-sm font-black text-blue-100 hover:from-blue-600/90 hover:to-blue-400/80 hover:border-blue-200/80 transition-all uppercase disabled:opacity-50 shadow-[0_8px_18px_rgba(37,99,235,0.22)] ring-2 ring-blue-300/20 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
            style={{letterSpacing: '0.08em'}}
          >
            <Database size={16} /> {isSyncingWorkspace ? 'SYNCING...' : 'SYNC WORKSPACE'}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider font-medium">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse shadow-[0_0_8px_#00FF00]" />
            Terminal Active // 9 Nodes
          </div>
          <LiveClock />
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-[#18181c] via-[#23232a] to-[#18181c]">
        <div className="mx-auto grid min-h-full w-full max-w-[1920px] grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-12 lg:gap-5 lg:p-5 xl:gap-6 xl:p-6 2xl:gap-8">
        {/* LEFT: MANUAL INPUT WORKSPACE */}
        <div className="flex flex-col min-h-[420px] lg:min-h-0 lg:col-span-4 xl:col-span-3 overflow-hidden rounded-2xl border-2 border-[#23232a] bg-gradient-to-b from-[#18181c]/95 via-[#23232a]/90 to-[#18181c]/95 p-2 shadow-[0_4px_32px_0_rgba(0,0,0,0.18)]">
          <CyberBox
            title="Manual Intelligence Input"
            icon={Edit3}
            className="h-full"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs uppercase text-white/60 mb-2 block font-bold tracking-wider">
                  Article Title
                </label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter article title..."
                  className="w-full bg-black/65 border border-white/15 rounded-md px-3 py-3 text-sm text-white/90 outline-none focus:border-[#FFB800]/60 transition-colors placeholder:text-white/30"
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-xs uppercase text-white/60 mb-2 block font-bold tracking-wider">
                  Raw Intelligence / Summary
                </label>
                <textarea
                  value={manualSummary}
                  onChange={(e) => setManualSummary(e.target.value)}
                  placeholder="Enter raw report or summary..."
                  rows={14}
                  className="w-full bg-black/65 border border-white/15 rounded-md px-3 py-3 text-sm text-white/90 resize-none outline-none focus:border-[#FFB800]/60 transition-colors custom-scrollbar placeholder:text-white/30"
                />
              </div>
              
              <button
                onClick={loadManualDraft}
                disabled={!manualTitle.trim() || !manualSummary.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black font-black uppercase text-sm rounded-md disabled:opacity-30 hover:from-[#FFC524] hover:to-[#FFD86D] transition-all shadow-[0_8px_18px_rgba(255,184,0,0.18)] ring-1 ring-[#FFB800]/40"
              >
                Load Manual Draft
              </button>
              
              <button
                onClick={clearManualInput}
                className="w-full py-2 border border-white/20 text-white/60 text-xs uppercase rounded-md hover:border-white/40 hover:text-white/80 transition-all"
              >
                Clear Input
              </button>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <button
                  onClick={() => setIsPandaImportOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black uppercase text-sm rounded-md hover:from-blue-600 hover:to-blue-400 transition-all shadow-lg shadow-blue-900/20 ring-1 ring-blue-400/40 flex items-center justify-center gap-2"
                >
                  <FileJson size={14} />
                  Import Panda JSON
                </button>
                {lastImportInfo && (
                  <div className="px-3 py-2 bg-black/40 border border-white/5 rounded text-[10px] font-mono text-white/30 flex justify-between">
                    <span>ID: {lastImportInfo.id}</span>
                    <span>{lastImportInfo.time}</span>
                  </div>
                )}
              </div>
            </div>
          </CyberBox>
        </div>

        {/* MIDDLE: EDITOR & PREVIEW */}
        <div className="flex flex-col min-h-[640px] lg:min-h-0 lg:col-span-8 xl:col-span-6 overflow-hidden rounded-2xl border-4 border-[#FFB800]/40 bg-gradient-to-b from-[#23232a]/98 via-[#18181c]/95 to-[#23232a]/98 p-2 shadow-[0_8px_48px_0_rgba(255,184,0,0.10)] ring-2 ring-[#FFB800]/10">
          <CyberBox title="Analysis Command Center" icon={Terminal} className="h-full border-[#FFB800]/30 ring-[#FFB800]/10">
            <div className="h-full flex flex-col p-4 sm:p-6 xl:p-8">
              {selectedNews ? (
                <>
                    <div className="mb-4 flex shrink-0 flex-col gap-4 border-2 border-[#23232a] rounded-lg bg-gradient-to-r from-[#23232a]/90 to-[#18181c]/90 px-3 py-3 shadow-[0_4px_18px_rgba(255,184,0,0.10)] sm:px-4 sm:py-4 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full bg-[#18181c]/90 border-2 border-[#23232a] rounded-md overflow-hidden p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:w-auto">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`flex-1 px-4 py-2 text-sm font-black uppercase rounded-md transition-all tracking-wide sm:px-6 sm:py-2.5 sm:text-base ${viewMode === 'edit' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40' : 'text-white/60 hover:text-white/90'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`flex-1 px-4 py-2 text-sm font-black uppercase rounded-md transition-all tracking-wide sm:px-6 sm:py-2.5 sm:text-base ${viewMode === 'preview' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40' : 'text-white/60 hover:text-white/90'}`}
                      >
                        Preview
                      </button>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                      <button
                        onClick={handleTransform}
                        disabled={isTransforming || !activeDraft.desc}
                        title="Transform raw report into a formatted article using AI"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-700/80 to-purple-500/70 border-2 border-purple-400/60 rounded-lg text-sm font-black text-purple-100 hover:from-purple-600/90 hover:to-purple-400/80 hover:border-purple-200/80 transition-all uppercase disabled:opacity-40 shadow-[0_8px_18px_rgba(147,51,234,0.22)] ring-2 ring-purple-300/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 sm:px-5"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        {isTransforming ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Wand2 size={14} />
                        )}
                        {isTransforming ? 'Transforming...' : transformedArticle ? 'Re-Transform' : 'Transform to Article'}
                      </button>
                      <button
                        onClick={() => handlePublish()}
                        disabled={isDeployBlocked}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 font-black uppercase text-sm sm:text-base rounded-lg transition-all focus:outline-none focus:ring-4 sm:px-6 ${
                          isDeployBlocked
                            ? 'bg-neutral-800 text-neutral-500 border-2 border-neutral-700 cursor-not-allowed grayscale opacity-50'
                            : 'bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black shadow-[0_8px_18px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40 hover:from-[#FFC524] hover:to-[#FFD86D] focus:ring-[#FFB800]/30'
                        }`}
                      >
                        {isPublishing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}{' '}
                        {isDeployBlocked && !isPublishing ? 'Locked' : 'Deploy'}
                      </button>
                    </div>
                  </div>

                  {isDeployBlocked && transformedArticle && (
                    <div className="mx-0 mb-4 flex flex-col items-start gap-2 px-4 py-2 bg-red-900/20 border border-red-500/40 rounded-lg sm:mx-2 lg:mx-8 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-red-400 font-black uppercase tracking-tighter animate-pulse">
                        <AlertCircle size={14} /> Critical Gating Restriction Active
                      </div>
                      <div className="text-[10px] text-white/40 font-bold uppercase italic">
                        {auditResult && auditResult.overall_score < 70 ? 'Audit Threshold Failed (<70)' :
                         protocolConfig.enableScarcityTone && auditResult && auditResult.overall_score < 85 ? 'Sovereign Validation Required (>=85)' :
                         'Draft Integrity Pending'}
                      </div>
                    </div>
                  )}

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {viewMode === 'edit' ? (
                    <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-h-0">
                        <input
                          value={activeDraft.title}
                          onChange={(e) =>
                            setVault({
                              ...vault,
                              [activeLang]: { ...activeDraft, title: e.target.value },
                            })
                          }
                          className="w-full bg-[#23232a]/90 border-2 border-[#FFB800]/30 p-4 sm:p-5 text-xl sm:text-2xl font-black text-[#FFB800] outline-none shrink-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/60 transition-colors tracking-tight"
                          placeholder="ENTER HEADLINE..."
                        />

                        {/* Edit Mode Mini Preview */}
                        {imageUrl && (
                          <div className="relative h-28 w-full rounded-md overflow-hidden border border-white/15 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help shrink-0 shadow-lg">
                            <Image
                              src={imageUrl}
                              alt="Haber Görseli"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white uppercase tracking-wider bg-black/50 backdrop-blur-sm">
                              ACTIVE_VISUAL_LOCKED
                            </div>
                          </div>
                        )}

                        <textarea
                          value={activeDraft.desc}
                          onChange={(e) => {
                            setVault({
                              ...vault,
                              [activeLang]: {
                                ...activeDraft,
                                desc: e.target.value,
                                ready: !!e.target.value,
                              },
                            })
                            // Clear stale global audit on manual edit
                            setGlobalAudit(null)
                          }}
                          className="flex-1 bg-[#18181c]/90 border-2 border-[#FFB800]/20 p-4 sm:p-6 outline-none resize-none text-sm sm:text-base leading-6 sm:leading-7 custom-scrollbar font-sans text-white/95 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/40 transition-colors"
                          placeholder="ENTER INTELLIGENCE DATA..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#18181c]/95 to-[#23232a]/90 border-2 border-[#FFB800]/20 rounded-lg space-y-6 sm:space-y-8 shadow-[0_2px_24px_rgba(255,184,0,0.08)]">
                        {imageUrl && (
                          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-white/20 shadow-2xl">
                            <Image
                              src={imageUrl}
                              alt="Preview"
                              fill
                              className="object-cover opacity-90"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          </div>
                        )}

                        {/* Transform error banner */}
                        {transformError && (
                          <div className="flex items-center gap-3 px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-medium">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{transformError} — showing raw content.</span>
                          </div>
                        )}

                        {transformedArticle ? (
                          /* ── FORMATTED ARTICLE PREVIEW ── */
                          <>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 opacity-80">
                              <Wand2 size={12} /> Transformed Article
                            </div>
                            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white leading-tight uppercase italic tracking-tight drop-shadow-lg mb-2">
                              {transformedArticle.headline}
                            </h1>
                            {transformedArticle.subheadline && (
                              <p className="text-lg text-white/70 font-semibold leading-snug">
                                {transformedArticle.subheadline}
                              </p>
                            )}
                            {transformedArticle.summary && (
                              <p className="text-base text-white/60 italic border-l-2 border-purple-500/50 pl-4">
                                {transformedArticle.summary}
                              </p>
                            )}

                            {/* 🔥 DYNAMIC CHART PREVIEW */}
                            <TechnicalChart
                              articleBody={transformedArticle.body}
                              category={publishCategory}
                              lang={activeLang}
                            />

                            <div
                              className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatArticleBody(transformedArticle.body, activeLang),
                              }}
                            />
                            {transformedArticle.keyInsights.length > 0 && (
                              <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-5 space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-purple-400">Key Insights</p>
                                <ul className="space-y-1.5">
                                  {transformedArticle.keyInsights.map((insight, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                      <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {transformedArticle.riskNote && (
                              <p className="text-xs text-white/40 italic border-t border-white/10 pt-4">
                                {transformedArticle.riskNote}
                              </p>
                            )}
                          </>
                        ) : (
                          /* ── RAW REPORT FALLBACK PREVIEW ── */
                          <>
                            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white leading-tight uppercase italic tracking-tight drop-shadow-lg mb-4">
                              {activeDraft.title}
                            </h1>

                            {/* 🔥 DYNAMIC CHART PREVIEW */}
                            <TechnicalChart
                              articleBody={activeDraft.desc}
                              category={publishCategory}
                              lang={activeLang}
                            />

                            <div
                              className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatArticleBody(activeDraft.desc, activeLang),
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-16 bg-gradient-to-b from-[#23232a]/80 via-[#18181c]/90 to-[#23232a]/80 border-4 border-dashed border-[#FFB800]/30 rounded-2xl shadow-[0_2px_24px_rgba(255,184,0,0.08)]">
                  <Activity size={80} className="mb-10 opacity-50 drop-shadow-[0_0_24px_rgba(255,184,0,0.18)]" />
                  <p className="uppercase font-black tracking-[0.18em] text-xl text-center mb-4 text-white/60">
                    Awaiting Intelligence Signal
                  </p>
                  <p className="text-base text-white/30 text-center font-medium max-w-xs leading-relaxed">
                    Load a manual draft from the left panel to begin analysis
                  </p>
                </div>
              )}
            </div>
          </CyberBox>
        </div>

        {/* RIGHT: STATUS & NODES */}
        <div className="flex flex-col gap-4 sm:gap-5 min-h-[520px] lg:min-h-0 lg:col-span-12 xl:col-span-3 rounded-2xl border-2 border-[#23232a] bg-gradient-to-b from-[#18181c]/95 via-[#23232a]/90 to-[#18181c]/95 p-2 shadow-[0_4px_32px_0_rgba(0,0,0,0.18)]">
          <CyberBox title="Neural Language Nodes" icon={Globe2} className="shrink-0">
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {SUPPORTED_LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`py-2.5 border transition-all flex items-center justify-between px-3 rounded-md ${activeLang === l ? 'border-[#FFB800]/80 bg-gradient-to-r from-[#FFB800]/24 to-[#FFB800]/10 text-[#FFB800] shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-1 ring-[#FFB800]/30' : 'border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] text-white/50 hover:text-white/80 hover:from-white/[0.08] hover:to-white/[0.03] hover:border-white/25'}`}
                >
                  <span className="uppercase font-black text-sm">{l}</span>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${vault[l].ready ? 'bg-[#00FF00] shadow-[0_0_10px_#00FF00]' : 'bg-white/20'}`}
                  />
                </button>
              ))}
            </div>
          </CyberBox>

          <CyberBox title="Deploy Configuration" icon={Send} className="shrink-0">
            <div className="p-4 space-y-3">
              <label className="flex items-center justify-between gap-2 bg-white/[0.08] border border-white/20 rounded-md px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
                <span className="text-sm font-medium uppercase text-white/60 tracking-wider">
                  Target Category
                </span>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value)}
                  className="bg-transparent border-none text-white/90 text-sm font-black uppercase outline-none cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-black">
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => handlePublish()}
                disabled={isDeployBlocked}
                className={`w-full py-5 font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-3 rounded-md ${
                  isDeployBlocked
                    ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed grayscale opacity-50'
                    : 'bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black shadow-[0_14px_28px_rgba(255,184,0,0.28)] ring-1 ring-[#FFB800]/50 hover:from-[#FFC524] hover:to-[#FFD86D]'
                }`}
              >
                {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}{' '}
                {isDeployBlocked && !isPublishing ? 'GATING_RESTRICTED' : 'Deploy Hub'}
              </button>
            </div>
          </CyberBox>

          <CyberBox title="SIA Protocol Controls" icon={Wand2} className="shrink-0">
            <div className="p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border ${protocolConfig.enableScarcityTone ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/20'} flex items-center justify-center transition-colors`}>
                  {protocolConfig.enableScarcityTone && <div className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={protocolConfig.enableScarcityTone}
                  onChange={(e) => setProtocolConfig({ ...protocolConfig, enableScarcityTone: e.target.checked })}
                />
                <span className="text-xs uppercase font-bold text-white/70 group-hover:text-white transition-colors">
                  Enable Scarcity Tone
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border ${protocolConfig.enableGlobalLexicon ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/20'} flex items-center justify-center transition-colors`}>
                  {protocolConfig.enableGlobalLexicon && <div className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={protocolConfig.enableGlobalLexicon}
                  onChange={(e) => setProtocolConfig({ ...protocolConfig, enableGlobalLexicon: e.target.checked })}
                />
                <span className="text-xs uppercase font-bold text-white/70 group-hover:text-white transition-colors">
                  Protect Finance Terms
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border ${protocolConfig.enableFinancialGravity ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/20'} flex items-center justify-center transition-colors`}>
                  {protocolConfig.enableFinancialGravity && <div className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={protocolConfig.enableFinancialGravity}
                  onChange={(e) => setProtocolConfig({ ...protocolConfig, enableFinancialGravity: e.target.checked })}
                />
                <span className="text-xs uppercase font-bold text-white/70 group-hover:text-white transition-colors">
                  Financial Gravity
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border ${protocolConfig.enableVerificationFooter ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/20'} flex items-center justify-center transition-colors`}>
                  {protocolConfig.enableVerificationFooter && <div className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={protocolConfig.enableVerificationFooter}
                  onChange={(e) => setProtocolConfig({ ...protocolConfig, enableVerificationFooter: e.target.checked })}
                />
                <span className="text-xs uppercase font-bold text-white/70 group-hover:text-white transition-colors">
                  Verification Footer
                </span>
              </label>
            </div>
          </CyberBox>

          <CyberBox title="Node Metrics" icon={Activity} className="flex-1 min-h-[360px] xl:min-h-0">
            <div className="p-5 space-y-4 text-sm uppercase font-bold tracking-wider">
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Active Language:</span>{' '}
                <span className="text-white/90 font-black">{LANGUAGE_LABELS[activeLang]}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Intelligence Load:</span>{' '}
                <span className="text-[#FFB800] font-black">{activeWordCount} Words</span>
              </div>
              {auditResult && (
                <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                  <span className="font-medium">Active Node:</span>{' '}
                  <span className={`font-black ${auditResult.overall_score >= 85 ? 'text-[#00FF00]' : auditResult.overall_score >= 70 ? 'text-[#FFB800]' : 'text-red-500'}`}>
                    {auditResult.overall_score}/100
                  </span>
                </div>
              )}
              
              {/* GLOBAL HEALTH BOARD - PHASE 1 READABILITY */}
              {globalAudit ? (
                <>
                  <div className="mt-4 pt-4 border-t-2 border-[#FFB800]/20 space-y-4">
                    <div className="text-xs font-black text-[#FFB800]/70 mb-3 tracking-wider">
                      GLOBAL HEALTH BOARD
                    </div>
                    
                    {/* Top-Level Health Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-3 py-3 bg-emerald-900/20 border-2 border-emerald-500/40 rounded-lg text-center">
                        <div className="text-2xl font-black text-emerald-400">{globalAudit.globalScore}</div>
                        <div className="text-[10px] uppercase text-emerald-300/60 font-bold">Global Health</div>
                      </div>
                      <div className={`px-3 py-3 rounded-lg text-center border-2 ${
                        isDeployBlocked 
                          ? 'bg-red-900/20 border-red-500/40' 
                          : 'bg-emerald-900/20 border-emerald-500/40'
                      }`}>
                        <div className={`text-xs font-black ${isDeployBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isDeployBlocked ? 'LOCKED' : 'READY'}
                        </div>
                        <div className={`text-[10px] uppercase font-bold ${isDeployBlocked ? 'text-red-300/60' : 'text-emerald-300/60'}`}>
                          Deploy Gate
                        </div>
                      </div>
                    </div>
                    
                    {/* Clarification Banner - Prominent when audit passes but deploy locked */}
                    {globalAudit.publishable && isDeployBlocked && (
                      <div className="px-4 py-3 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-black text-yellow-400 uppercase mb-1">
                          <AlertCircle size={14} />
                          Global Audit PASS ≠ Deploy READY
                        </div>
                        <div className="text-[11px] text-yellow-300/80 leading-relaxed">
                          All gates must pass: Global Audit + Transform + Active Node Audit
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                      <span className="font-medium text-xs">Audit Status:</span>{' '}
                      <span className={`font-black text-xs ${globalAudit.status === 'PASS' ? 'text-[#00FF00]' : globalAudit.status === 'NEEDS_REVIEW' ? 'text-[#FFB800]' : 'text-red-500'}`}>
                        {globalAudit.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                      <span className="font-medium text-xs">Gating Status:</span>{' '}
                      <span className={`font-black text-xs ${globalAudit.gatingStatus === 'READY_FOR_GLOBAL_DEPLOY' ? 'text-[#00FF00]' : 'text-red-500'}`}>
                        {globalAudit.gatingStatus === 'READY_FOR_GLOBAL_DEPLOY' ? 'READY' : 'RESTRICTED'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                      <span className="font-medium text-xs">Publishable:</span>{' '}
                      <span className={`font-black text-sm ${globalAudit.publishable ? 'text-[#00FF00]' : 'text-red-500'}`}>
                        {globalAudit.publishable ? 'YES' : 'NO'}
                      </span>
                    </div>
                    
                    {/* Language Health Grid */}
                    <div className="mt-3 mb-2">
                      <div className="text-[11px] font-bold text-white/50 mb-2 uppercase">Language Health (9 Nodes)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {PANDA_REQUIRED_LANGS.map((l) => {
                          const langStatus = globalAudit.languages[l as SupportedLang]
                          const score = langStatus?.score || 0
                          const status = langStatus?.status || 'FAIL'
                          return (
                            <div
                              key={l}
                              className={`px-2 py-2 rounded text-[10px] font-black uppercase text-center ${
                                status === 'PASS'
                                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                                  : status === 'NEEDS_REVIEW'
                                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-red-900/30 text-red-400 border border-red-500/30'
                              }`}
                              title={`${l.toUpperCase()}: ${score}/100 - ${status}`}
                            >
                              <div>{l}</div>
                              <div className="text-[9px] opacity-70">{score}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Failed Languages Alert - More Prominent */}
                    {globalAudit.failedLanguages.length > 0 && (
                      <div className="px-4 py-3 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
                        <div className="text-xs font-black text-red-400 uppercase mb-2">
                          ⚠ FAILED LANGUAGES
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {globalAudit.failedLanguages.map(lang => (
                            <span key={lang} className="px-2 py-1 bg-red-500/20 text-red-300 text-[11px] font-bold uppercase rounded">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Warning Languages */}
                    {globalAudit.warningLanguages.length > 0 && (
                      <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-[11px] text-yellow-400 font-bold uppercase">
                        ⚠ Warnings: {globalAudit.warningLanguages.length} language(s)
                      </div>
                    )}
                    
                    {/* Top Global Findings - More Readable */}
                    {globalAudit.globalFindings && globalAudit.globalFindings.length > 0 && (
                      <div className="mt-3 px-3 py-3 bg-white/5 border border-white/10 rounded">
                        <div className="text-[11px] font-bold text-white/50 mb-2 uppercase">Top Findings</div>
                        <div className="space-y-2">
                          {globalAudit.globalFindings.slice(0, 3).map((finding, idx) => (
                            <div key={idx} className="text-[11px] text-white/70 leading-relaxed">
                              • {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : selectedNews ? (
                <div className="mt-4 pt-4 border-t-2 border-red-500/30">
                  <div className="px-4 py-3 bg-red-900/20 border border-red-500/30 rounded">
                    <div className="text-xs font-black text-red-400 uppercase mb-2">
                      ⚠ GLOBAL 9-NODE AUDIT REQUIRED
                    </div>
                    <div className="text-[11px] text-red-300/70 leading-relaxed">
                      Run Global Audit after import/edit before publish can be considered.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* SUGGESTED FIXES PREVIEW - PHASE 2B */}
              {selectedNews && (
                <RemediationPreviewPanel
                  globalAudit={globalAudit}
                  auditResult={auditResult}
                  articleId={selectedNews?.id}
                  packageId={lastImportInfo?.id}
                />
              )}

              {/* Deploy Lock Reasons - Readable Cards */}
              {isDeployBlocked && selectedNews && (
                <div className="mt-4 pt-4 border-t-2 border-red-500/30 space-y-3">
                  <div className="text-xs font-black text-red-400 uppercase flex items-center gap-2">
                    <AlertCircle size={14} />
                    🔒 DEPLOY LOCKED - REASONS
                  </div>
                  <div className="space-y-2">
                    {!selectedNews && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">No article/source loaded</span>
                      </div>
                    )}
                    {!vault[activeLang].ready && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Active language vault not ready</span>
                      </div>
                    )}
                    {isPublishing && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Publishing in progress</span>
                      </div>
                    )}
                    {isTransforming && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Transforming in progress</span>
                      </div>
                    )}
                    {transformError && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Transform error present</span>
                      </div>
                    )}
                    {!globalAudit && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Global 9-Node Audit required</span>
                      </div>
                    )}
                    {globalAudit && !globalAudit.publishable && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Global Audit failed (not publishable)</span>
                      </div>
                    )}
                    {!transformedArticle && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Article transform required</span>
                      </div>
                    )}
                    {!auditResult && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Active language audit required</span>
                      </div>
                    )}
                    {auditResult && auditResult.overall_score < 70 && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Active node score below threshold (&lt;70)</span>
                      </div>
                    )}
                    {protocolConfig.enableScarcityTone && auditResult && auditResult.overall_score < 85 && (
                      <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span className="text-[11px] text-red-300/90">Scarcity Tone requires Sovereign validation (≥85)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Vault Status:</span>{' '}
                <span className={activeDraft.ready ? 'text-[#00FF00] font-black drop-shadow-[0_0_4px_#00FF00]' : 'text-red-400 font-black'}>
                  {activeDraft.ready ? 'SYNCED' : 'AWAITING'}
                </span>
              </div>
              <div className="flex justify-between text-white/50">
                <span className="font-medium">Visual Locked:</span>{' '}
                <span className={imageUrl ? 'text-emerald-400 font-black' : 'text-white/25 font-medium'}>
                  {imageUrl ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between text-white/50 pb-3">
                <span className="font-medium">Article Transform:</span>{' '}
                <span className={transformedArticle ? 'text-purple-400 font-black' : 'text-white/25 font-medium'}>
                  {isTransforming ? 'PROCESSING' : transformedArticle ? 'READY' : 'RAW'}
                </span>
              </div>
              <button
                onClick={handleGlobalAudit}
                disabled={isAuditing || !selectedNews}
                className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-700/80 to-emerald-500/70 border-2 border-emerald-400/60 rounded-lg text-[11px] font-black text-emerald-100 hover:from-emerald-600/90 hover:to-emerald-400/80 transition-all uppercase disabled:opacity-40 shadow-[0_8px_18px_rgba(16,185,129,0.22)] flex items-center justify-center gap-2"
              >
                {isAuditing ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                {isAuditing ? 'AUDITING ALL NODES...' : 'Run Global 9-Node Audit'}
              </button>
            </div>
          </CyberBox>
        </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 184, 0, 0.3);
          border-radius: 10px;
          border: 1px solid rgba(255, 184, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 184, 0, 0.5);
          border-color: rgba(255, 184, 0, 0.3);
        }
      `}</style>

      <PandaImport
        isOpen={isPandaImportOpen}
        onClose={() => setIsPandaImportOpen(false)}
        onApply={applyPandaPackageToVault}
      />
    </div>
  )
}
