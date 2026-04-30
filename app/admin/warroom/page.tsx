'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  ShieldAlert,
  Lock,
  AlertTriangle,
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
import SessionStateBanner from './components/SessionStateBanner'
import DraftSourceSwitcher, { type DraftSource } from './components/DraftSourceSwitcher'
import SessionDraftPreviewPanel from './components/SessionDraftPreviewPanel'
import SessionStatusChips from './components/SessionStatusChips'
import SessionAuditStatePanel from './components/SessionAuditStatePanel'
import SessionLedgerSummary from './components/SessionLedgerSummary'
import SessionDraftComparison from './components/SessionDraftComparison'
import { useLocalDraftRemediationController } from './hooks/useLocalDraftRemediationController'
import { RemediationCategory, type RemediationSuggestion } from '@/lib/editorial/remediation-types'
import {
  type LocalDraftApplyRequest,
  type LocalDraftApplyRequestResult,
  type RealLocalDraftApplyRequest,
  type RealLocalDraftApplyResult,
  getRealLocalDraftApplyBlockReason,
  createBlockedRealLocalApplyResult,
  mapRealLocalApplyRequestToControllerInput,
  mapControllerOutputToRealLocalApplyResult
} from '@/lib/editorial/remediation-apply-types'
import PromotionConfirmModal from './components/PromotionConfirmModal'
import {
  executeLocalPromotionDryRun,
  type LocalPromotionDryRunInput,
  type LocalPromotionDryRunResult,
  executeRealLocalPromotion
} from './handlers/promotion-execution-handler'
import type {
  RealPromotionExecutionInput
} from '@/lib/editorial/session-draft-promotion-6b2b-types'
import type {
  OperatorAcknowledgementState
} from '@/lib/editorial/session-draft-promotion-types'

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
  const [draftSource, setDraftSource] = useState<DraftSource>('canonical')
  const [showComparison, setShowComparison] = useState(false)
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

  // TASK 5: Promotion Review Modal State (UI Scaffold Only)
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)

  // TASK 6B-1: Promotion Dry-Run Preview State
  const [promotionDryRunResult, setPromotionDryRunResult] = useState<LocalPromotionDryRunResult | null>(null)

  // TASK 10: Promotion Finalization Summary State
  const [promotionFinalizationSummary, setPromotionFinalizationSummary] = useState<any>(null)

  // TASK 12: Promotion Execution State
  const [isPromotionExecuting, setIsPromotionExecuting] = useState(false)
  const [promotionExecutionError, setPromotionExecutionError] = useState<string | null>(null)

  // PHASE 3C-3B-1: Local Remediation Controller (Scaffold Only)
  const remediationController = useLocalDraftRemediationController()

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

  // TASK 10: Finalization Callback - Archive + Clear Session Draft
  const finalizePromotionSession = useCallback(() => {
    try {
      // PHASE 1: Archive session evidence BEFORE clearing
      const archive = remediationController.archivePromotionSession({
        executionId: `finalize_${Date.now()}`,
        operatorId: 'warroom-operator',
        promotedLanguages: Object.keys(vault).filter(lang => vault[lang].ready)
      });

      // Store archive in page-level state
      setPromotionFinalizationSummary(archive);

      // PHASE 2: Clear session draft state
      remediationController.clearLocalDraftSession();

      // PHASE 3: Return success with finalization summary
      return {
        success: true,
        finalizationSummary: {
          ...archive,
          finalizedAt: new Date().toISOString()
        },
        sessionCleared: true
      };
    } catch (error) {
      // Archive or clear failed - return error WITHOUT clearing
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Session finalization failed: ${errorMessage}`,
        sessionCleared: false
      };
    }
  }, [remediationController, vault]);

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

    // PHASE 3C-3C-3B-2B SAFETY GATE: Deploy remains locked when session draft exists
    // Full protocol re-audit and vault update required to unlock deploy.
    if (remediationController.hasSessionDraft) {
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
    protocolConfig.enableScarcityTone,
    remediationController.hasSessionDraft
  ])

  const activeDraft = vault[activeLang] || { title: '', desc: '', ready: false }

  // PHASE 3C-3B-1: Sync remediation controller when news changes
  useEffect(() => {
    if (selectedNews) {
      remediationController.initializeLocalDraftFromVault(vault)
    } else {
      remediationController.clearLocalDraftSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNews?.id])

  // Task 4: Reset draft source to canonical when session draft becomes unavailable
  // Task 8: Also reset comparison view when session draft becomes unavailable
  // Task 12: Reset promotion execution error when session draft becomes unavailable
  useEffect(() => {
    if (!remediationController.hasSessionDraft && draftSource === 'session') {
      setDraftSource('canonical')
    }
    if (!remediationController.hasSessionDraft && showComparison) {
      setShowComparison(false)
    }
    if (!remediationController.hasSessionDraft) {
      setPromotionExecutionError(null)
    }
  }, [remediationController.hasSessionDraft, draftSource, showComparison])

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

  // TASK 6B-1: Local Promotion Dry-Run Handler
  const handleBuildPromotionDryRun = useCallback(() => {
    if (!selectedNews || !remediationController.hasSessionDraft) return

    // Prepare full operator acknowledgement for dry-run re-verification
    const fullAck = {
      vaultReplacementAcknowledged: true,
      auditInvalidationAcknowledged: true,
      deployLockAcknowledged: true,
      reAuditRequiredAcknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      operatorId: 'warroom-operator'
    }

    const input: LocalPromotionDryRunInput = {
      precondition: {
        canPromote: remediationController.sessionAuditLifecycle === 'PASSED',
        blockReasons: remediationController.snapshotBinding?.blockReasons || [],
        preconditions: {
          sessionDraftExists: remediationController.hasSessionDraft,
          auditRun: remediationController.sessionAuditResult !== null,
          auditPassed: remediationController.sessionAuditLifecycle === 'PASSED',
          auditNotStale: !remediationController.isAuditStale,
          globalAuditPassed: globalAudit?.publishable ?? false,
          pandaCheckPassed: remediationController.sessionAuditResult?.pandaCheckPass ?? false,
          snapshotIdentityMatches: !remediationController.isAuditStale,
          noTransformError: transformError === null,
          articleSelected: selectedNews !== null,
          localDraftValid: remediationController.hasSessionDraft
        },
        snapshotBinding: remediationController.snapshotBinding as any,
        acknowledgement: fullAck,
        memoryOnly: true,
        deployUnlockAllowed: false,
        canonicalAuditOverwriteAllowed: false,
        automaticPromotionAllowed: false
      },
      snapshotBinding: remediationController.snapshotBinding as any,
      localDraftCopy: {
        draftId: selectedNews.id,
        contentChecksum: remediationController.snapshotBinding?.snapshotIdentity?.contentHash || '',
        title: remediationController.localDraftCopy?.[activeLang]?.title,
        body: remediationController.localDraftCopy?.[activeLang]?.desc
      },
      canonicalVaultBefore: {
        vaultId: selectedNews.id,
        checksum: vault[activeLang]?.desc,
        version: '1.0.0'
      },
      operatorContext: {
        operatorId: 'warroom-operator',
        acknowledgementState: fullAck
      },
      sessionAuditResult: remediationController.sessionAuditResult,
      sessionRemediationLedger: {
        eventCount: remediationController.sessionRemediationLedger.length,
        latestEventId: remediationController.latestAppliedEvent?.eventId,
        eventIds: remediationController.sessionRemediationLedger.map(e => e.appliedEvent.eventId)
      },
      requestedAt: new Date().toISOString()
    }

    const result = executeLocalPromotionDryRun(input)
    setPromotionDryRunResult(result)

    if (result.success) {
      alert('✅ DRY-RUN SUCCESS: Local promotion preview built successfully.')
    } else {
      alert(`❌ DRY-RUN BLOCKED: ${result.summary}\n${result.blockedReasons.join('\n')}`)
    }
  }, [
    selectedNews,
    remediationController,
    globalAudit,
    transformError,
    activeLang,
    vault
  ])

  // TASK 12: Real Local Promotion Execution Handler
  const handleExecuteRealLocalPromotion = useCallback(async (acknowledgement: OperatorAcknowledgementState) => {
    // PHASE A: Early validation before calling executeRealLocalPromotion
    
    // A1: Validate selectedNews
    if (!selectedNews) {
      setPromotionExecutionError('BLOCKED: No article selected')
      return
    }

    // A2: Validate promotionDryRunResult exists and succeeded
    if (!promotionDryRunResult || !promotionDryRunResult.success) {
      setPromotionExecutionError('BLOCKED: Dry-run preview missing or failed')
      return
    }

    // A3: Validate dry-run preview
    const preview = promotionDryRunResult.preview
    if (!preview) {
      setPromotionExecutionError('BLOCKED: Dry-run preview data missing')
      return
    }

    // A4: Validate session draft exists
    if (!remediationController.hasSessionDraft) {
      setPromotionExecutionError('BLOCKED: Session draft does not exist')
      return
    }

    // A5: Validate localDraftCopy exists
    if (!remediationController.localDraftCopy) {
      setPromotionExecutionError('BLOCKED: Local draft copy missing')
      return
    }

    // A6: Validate all acknowledgements are true
    if (
      !acknowledgement.vaultReplacementAcknowledged ||
      !acknowledgement.auditInvalidationAcknowledged ||
      !acknowledgement.deployLockAcknowledged ||
      !acknowledgement.reAuditRequiredAcknowledged
    ) {
      setPromotionExecutionError('BLOCKED: Required acknowledgements missing')
      return
    }

    // PHASE B: Set execution state
    setIsPromotionExecuting(true)
    setPromotionExecutionError(null)

    try {
      // PHASE C: Assemble executeRealLocalPromotion input

      // C1: Memory-only callback wrappers
      const applyLocalVaultUpdate = (promotedVaultContent: Record<string, { title: string; desc: string; ready: boolean }>) => {
        try {
          setVault(promotedVaultContent)
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }

      const invalidateCanonicalAudit = () => {
        try {
          // Invalidate canonical audit state
          setGlobalAudit(null)
          // Invalidate active audit result (page-level)
          // Note: auditResult will be cleared in clearDerivedPromotionState
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }

      const clearDerivedPromotionState = () => {
        try {
          // Clear ONLY page-level derived state:
          // - transformedArticle (page-level derived state)
          // - transformError (page-level derived state)
          // - auditResult (page-level active audit result)
          setTransformedArticle(null)
          setTransformError(null)
          setAuditResult(null)
          
          // CRITICAL - Do NOT clear:
          // - globalAudit (already invalidated in invalidateCanonicalAudit)
          // - sessionAuditResult (session state, preserved until finalization)
          // - promotionDryRunResult (preserved for traceability)
          // - localDraftCopy (session draft, preserved until finalization)
          // - sessionRemediationLedger (session state, preserved until finalization)
          // - vault (already updated in applyLocalVaultUpdate)
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }

      // C2: Assemble input
      const input: RealPromotionExecutionInput = {
        dryRunPreview: preview,
        precondition: preview.precondition,
        snapshotBinding: preview.snapshotBinding,
        sessionDraftContent: remediationController.localDraftCopy,
        currentVault: vault,
        acknowledgement,
        operatorId: 'warroom-operator',
        articleId: selectedNews.id,
        packageId: lastImportInfo?.id || selectedNews.id,
        requestedAt: new Date().toISOString(),
        applyLocalVaultUpdate,
        invalidateCanonicalAudit,
        clearDerivedPromotionState,
        finalizePromotionSession
      }

      // PHASE D: Execute real local promotion
      const result = executeRealLocalPromotion(input)

      // PHASE E: Handle result
      if (result.success) {
        // Success - close modal and show success message
        setIsPromotionModalOpen(false)
        setPromotionExecutionError(null)
        
        // Show success alert
        alert('✅ LOCAL PROMOTION SUCCESS\n\nSession draft promoted to canonical vault.\nCanonical audit invalidated.\nFull re-audit required before deploy.\nDeploy remains locked.')
      } else {
        // Blocked - keep modal open and show error
        const blockSummary = result.summary || 'Promotion blocked'
        const blockDetails = result.blockReasons.join('\n')
        setPromotionExecutionError(`${blockSummary}\n\n${blockDetails}`)
        
        // If partial mutation occurred, show critical warning
        if (result.blockCategory === 'AUDIT_INVALIDATION' || result.blockCategory === 'SESSION_CLEAR') {
          alert(`⚠️ CRITICAL: Promotion partially failed\n\n${blockSummary}\n\nVault may have been updated. Manual review required.`)
        }
      }
    } catch (error) {
      // Unexpected error
      const errorMessage = error instanceof Error ? error.message : String(error)
      setPromotionExecutionError(`UNEXPECTED ERROR: ${errorMessage}`)
      alert(`❌ PROMOTION FAILED\n\nUnexpected error: ${errorMessage}`)
    } finally {
      // PHASE F: Always clear execution state
      setIsPromotionExecuting(false)
    }
  }, [
    selectedNews,
    promotionDryRunResult,
    remediationController,
    vault,
    lastImportInfo,
    finalizePromotionSession
  ])

  // PHASE 3C-3B-2: Guarded Dry-Run Handler Only
  const handleRequestLocalDraftApply = (request: LocalDraftApplyRequest): LocalDraftApplyRequestResult => {
    // 1. Validate mandatory fields
    const { category, fieldPath, language, suggestionId } = request;

    // 2. Strict Dry-Run Constraints
    // - Must be FORMAT_REPAIR
    // - Must be 'body' field
    // - Must have language and suggestion ID
    const isValid =
      category === RemediationCategory.FORMAT_REPAIR &&
      fieldPath === 'body' &&
      !!language &&
      !!suggestionId;

    if (!isValid) {
      return {
        accepted: false,
        blocked: true,
        reason: "INVALID_REQUEST_PARAMETERS_OR_OUT_OF_SCOPE",
        dryRunOnly: true,
        noMutation: true
      };
    }

    // 3. Success: Confirm dry-run acceptance
    // IMPORTANT: No mutation occurs here. No call to remediationController.
    return {
      accepted: true,
      blocked: false,
      reason: "DRY_RUN_PLUMBING_ONLY_NO_APPLY_EXECUTED",
      dryRunOnly: true,
      noMutation: true
    };
  };

  // PHASE 3C-3C-3B-1: Real Local Apply Preflight Mapping Only
  const handleRequestRealLocalApply = (request: RealLocalDraftApplyRequest): RealLocalDraftApplyResult => {
    // CRITICAL PHASE 3C-3C-3B-1 CONSTRAINTS:
    // - This is preflight mapping ONLY
    // - No controller execution
    // - No mutations
    // - Pure validation only

    // 1. Validate request structure
    if (!request) {
      return createBlockedRealLocalApplyResult('BLOCKED_MISSING_SUGGESTION_ID' as any);
    }

    // 2. Call preflight guard (pure helper)
    const blockReason = getRealLocalDraftApplyBlockReason(request);

    // 3. If blocked, return blocked result
    if (blockReason !== null) {
      return createBlockedRealLocalApplyResult(blockReason);
    }

    // 4. Preflight success - return success WITHOUT calling controller
    // IMPORTANT: No controller invocation. No mutations. Preflight only.
    return {
      success: true,
      blocked: false,
      reason: 'REAL_LOCAL_APPLY_PREFLIGHT_ONLY_NO_CONTROLLER_EXECUTED',
      auditInvalidated: true,
      reAuditRequired: true,
      deployBlocked: true,
      noBackendMutation: true,
      vaultUnchanged: true,
      sessionOnly: true,
      dryRunOnly: false
    };
  };

  // PHASE 3C-3C-3B-2B: Real Local Apply with Controller Execution
  const handleRequestRealLocalApplyWithController = async (
    request: RealLocalDraftApplyRequest,
    suggestion: RemediationSuggestion
  ): Promise<RealLocalDraftApplyResult> => {
    // CRITICAL PHASE 3C-3C-3B-2B CONSTRAINTS:
    // - This executes the full adapter chain with controller invocation
    // - Session-scoped mutations only
    // - No vault mutation
    // - No backend/network/storage calls

    try {
      // 1. Map request to controller input using adapter
      const controllerInput = mapRealLocalApplyRequestToControllerInput(request, suggestion);

      // 2. Call controller to perform session-scoped mutation
      const controllerOutput = remediationController.applyToLocalDraftController(controllerInput);

      // 3. Map controller output to result using adapter
      const result = mapControllerOutputToRealLocalApplyResult(controllerOutput, request);

      return result;
    } catch (error) {
      // Handle errors and return blocked result
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        blocked: true,
        reason: `CONTROLLER_EXECUTION_FAILED: ${errorMessage}`,
        auditInvalidated: true,
        reAuditRequired: true,
        deployBlocked: true,
        noBackendMutation: true,
        vaultUnchanged: true,
        sessionOnly: true,
        dryRunOnly: false
      };
    }
  };

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
              {/* Session State Banner - Task 3 */}
              <SessionStateBanner
                visible={remediationController.hasSessionDraft}
                sessionWarningCopy={remediationController.sessionWarningCopy}
                auditStaleCopy={remediationController.auditStaleCopy}
                volatilityWarningCopy={remediationController.volatilityWarningCopy}
              />

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

                    {/* Draft Source Switcher - Task 4 */}
                    <DraftSourceSwitcher
                      currentSource={draftSource}
                      onSourceChange={setDraftSource}
                      sessionDraftAvailable={remediationController.hasSessionDraft}
                    />

                    {/* Task 8: Comparison Toggle - Only visible when session draft exists */}
                    {remediationController.hasSessionDraft && (
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        disabled={!remediationController.hasSessionDraft}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-md transition-all tracking-wide border-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                          showComparison
                            ? 'bg-blue-600/80 text-blue-100 border-blue-400/60 shadow-[0_8px_16px_rgba(59,130,246,0.18)] ring-2 ring-blue-400/40'
                            : 'bg-blue-900/40 text-blue-300/80 border-blue-500/40 hover:bg-blue-800/60 hover:text-blue-200'
                        }`}
                        title="Compare canonical vault with session draft side-by-side"
                      >
                        Compare Canonical vs Session
                      </button>
                    )}

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

                  {/* Transform Failure Panel - Globally visible when transform fails */}
                  {transformError && (
                    <div className="mx-0 mb-4 px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg flex items-start gap-3 sm:mx-2 lg:mx-8">
                      <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-300 mb-1">Article Transform Did Not Complete</p>
                        <p className="text-xs text-white/70 mb-2">
                          The transform step did not produce a formatted article. The draft remains session-only and deploy remains locked.
                        </p>
                        <p className="text-xs font-mono text-red-200/80 bg-black/20 px-2 py-1 rounded">
                          Reason: {transformError}
                        </p>
                      </div>
                    </div>
                  )}

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Task 8: Conditionally render Comparison, Session Draft Preview Panel, or Canonical Editor/Preview */}
                    {showComparison && remediationController.hasSessionDraft ? (
                      /* ── CANONICAL VS SESSION COMPARISON (READ-ONLY) ── */
                      <SessionDraftComparison
                        canonicalBody={activeDraft.desc || ''}
                        sessionBody={remediationController.localDraftCopy?.[activeLang]?.desc || ''}
                        currentLanguage={activeLang}
                        visible={true}
                        auditStaleCopy={remediationController.auditStaleCopy}
                        volatilityWarningCopy={remediationController.volatilityWarningCopy}
                      />
                    ) : draftSource === 'session' && remediationController.hasSessionDraft ? (
                      /* ── SESSION DRAFT PREVIEW PANEL (READ-ONLY) ── */
                      <>
                        <SessionDraftPreviewPanel
                          sessionBody={remediationController.localDraftCopy?.[activeLang]?.desc || ''}
                          currentLanguage={activeLang}
                          visible={true}
                          auditStaleCopy={remediationController.auditStaleCopy}
                          volatilityWarningCopy={remediationController.volatilityWarningCopy}
                        />
                        {/* Transform Feedback Panel - Shows when transform completes while viewing session draft */}
                        {transformedArticle && (
                          <div className="mx-4 my-4 px-4 py-3 bg-purple-900/30 border border-purple-500/40 rounded-lg flex items-start gap-3">
                            <Wand2 size={16} className="text-purple-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-purple-300 mb-1">Article Transform Completed</p>
                              <p className="text-xs text-white/70">
                                You are currently viewing the session draft. Switch to <span className="font-bold text-purple-400">Canonical Vault</span> view to preview the formatted article.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* ── CANONICAL VAULT EDITOR/PREVIEW (DEFAULT) ── */
                      <>
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
                      </>
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

              {/* Task 6: Session Status Chips - Read-only indicators */}
              <SessionStatusChips
                hasSessionDraft={remediationController.hasSessionDraft}
                isAuditStale={remediationController.isAuditStale}
                sessionRemediationCount={remediationController.sessionRemediationCount}
                sessionAuditLifecycle={remediationController.sessionAuditLifecycle}
              />

              {/* Task 7: Session Audit State Panel - Detailed lifecycle & Re-audit trigger */}
              <SessionAuditStatePanel
                lifecycle={remediationController.sessionAuditLifecycle}
                onReAudit={() => remediationController.runSessionDraftReAudit(selectedNews?.id)}
                hasSessionDraft={remediationController.hasSessionDraft}
                sessionAuditResult={remediationController.sessionAuditResult}
              />

              {/* Deploy Block Reason - Display only when session draft exists */}
              {remediationController.deployBlockReason && (
                <div className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-md text-xs text-red-300/90 leading-relaxed">
                  {remediationController.deployBlockReason}
                </div>
              )}

              {/* Task 7: Session Ledger Summary - Read-only remediation history */}
              <SessionLedgerSummary
                sessionRemediationLedger={remediationController.sessionRemediationLedger}
                visible={remediationController.hasSessionRemediationLedger}
              />

              {/* TASK 5: Promotion Review Entry Point - UI Scaffold Only */}
              {remediationController.hasSessionDraft && (
                <div className="mt-4 px-4 py-4 bg-gradient-to-b from-amber-900/20 to-amber-800/10 border-2 border-amber-500/40 rounded-lg space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <ShieldAlert size={14} />
                    Promotion Review
                  </div>
                  
                  {/* Required Warning Copy */}
                  <div className="space-y-2 text-[11px] text-amber-200/80 leading-relaxed">
                    <p className="flex items-start gap-2">
                      <Lock size={10} className="mt-0.5 shrink-0 text-amber-400" />
                      <span><strong>Review only</strong> — promotion execution is disabled.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Database size={10} className="mt-0.5 shrink-0 text-amber-400" />
                      <span>Session draft is <strong>not saved</strong> to canonical vault.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Lock size={10} className="mt-0.5 shrink-0 text-amber-400" />
                      <span>Deploy remains <strong>locked</strong>.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-400" />
                      <span>Canonical re-audit is <strong>required</strong> before deploy.</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPromotionModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-700/60 to-amber-600/50 border-2 border-amber-500/50 rounded-lg text-xs font-black text-amber-100 hover:from-amber-600/70 hover:to-amber-500/60 hover:border-amber-400/60 transition-all uppercase shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={14} />
                    Open Promotion Review
                  </button>

                  {/* TASK 6B-1: Dry-Run Preview Action */}
                  <button
                    onClick={handleBuildPromotionDryRun}
                    className="w-full py-3 bg-gradient-to-r from-blue-700/40 to-blue-600/30 border-2 border-blue-500/40 rounded-lg text-xs font-black text-blue-100 hover:from-blue-600/50 hover:to-blue-500/40 hover:border-blue-400/50 transition-all uppercase shadow-md flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    Build Dry-Run Preview
                  </button>
                </div>
              )}
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
                  onRequestLocalDraftApply={handleRequestLocalDraftApply}
                  onRequestRealLocalApply={handleRequestRealLocalApply}
                  onRequestRealLocalApplyWithController={handleRequestRealLocalApplyWithController}
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

      {/* TASK 5: Promotion Confirm Modal - UI Scaffold Only */}
      <PromotionConfirmModal
        isOpen={isPromotionModalOpen}
        onClose={() => {
          // Only allow close if not executing
          if (!isPromotionExecuting) {
            setIsPromotionModalOpen(false)
            setPromotionExecutionError(null)
          }
        }}
        precondition={promotionDryRunResult?.success ? promotionDryRunResult.preview.precondition : null}
        payloadPreview={promotionDryRunResult?.success ? promotionDryRunResult.preview.payload : null}
        draftMeta={{
          title: selectedNews?.title,
          draftId: selectedNews?.id,
          sessionId: selectedNews?.id
        }}
        operator={null}
        uiOptions={{
          showPayloadPreview: promotionDryRunResult?.success ?? false,
          allowLocalAcknowledgeToggle: true
        }}
        onPromote={handleExecuteRealLocalPromotion}
        isPromoting={isPromotionExecuting}
        promotionExecutionError={promotionExecutionError}
      />
    </div>
  )
}
