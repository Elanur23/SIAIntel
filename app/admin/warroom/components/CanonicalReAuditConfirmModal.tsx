'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Database, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react'

import type { CanonicalReAuditPreflightResult } from '@/lib/editorial/canonical-reaudit-input-builder'
import { CanonicalReAuditStatus, type CanonicalReAuditResult } from '@/lib/editorial/canonical-reaudit-types'
import type { CanonicalReAuditRunGateResultFields } from '../controllers/canonical-reaudit-run-controller'

type CanonicalReAuditAcknowledgementState = {
  inMemoryOnly: boolean
  deployLocked: boolean
  globalAuditNotUpdated: boolean
  acceptanceLaterPhase: boolean
  noSavePublishDeploy: boolean
}

interface CanonicalReAuditConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmedRun: () => void | Promise<void>
  disabledReason?: string | null
  articleId?: string | null
  preflight?: CanonicalReAuditPreflightResult | null
  gateResult?: CanonicalReAuditRunGateResultFields | null
  acknowledgements: CanonicalReAuditAcknowledgementState
  onAcknowledgementToggle: (key: keyof CanonicalReAuditAcknowledgementState) => void
  typedAttestation: string
  onTypedAttestationChange: (value: string) => void
  isRunning: boolean
  status: CanonicalReAuditStatus
  result: CanonicalReAuditResult | null
  runError?: string | null
}

/**
 * Canonical Re-Audit Confirmation Modal
 * 
 * TASK 7C-1 SCOPE:
 * - Shows safety warnings
 * - Shows acknowledgement checkboxes
 * - Shows final execute/continue button (DISABLED or INERT in Task 7C-1)
 * - Final execute button must be disabled or inert
 * - There must be NO canonicalReAudit.run()
 * - There must be NO real audit execution
 * - No acceptance/promotion/deploy behavior
 * - Required warning copy included
 * - Required acknowledgement copy included
 * - Forbidden wording avoided (Deploy Ready, Approved, etc.)
 */
export default function CanonicalReAuditConfirmModal({
  isOpen,
  onClose,
  onConfirmedRun,
  disabledReason,
  articleId,
  preflight,
  gateResult,
  acknowledgements,
  onAcknowledgementToggle,
  typedAttestation,
  onTypedAttestationChange,
  isRunning,
  status,
  result,
  runError
}: CanonicalReAuditConfirmModalProps) {
  const allAcknowledged = Object.values(acknowledgements).every(Boolean)
  const attestationMatches = preflight?.attestationPhrase ? 
    typedAttestation === preflight.attestationPhrase : 
    true // No attestation required if no phrase provided

  const hasTerminalResult = Boolean(result) && !isRunning
  const canClose = !isRunning && (hasTerminalResult || !result)
  const canExecute = Boolean(gateResult?.canExecute) && !hasTerminalResult
  const executeLabel = gateResult?.uiLabel || (isRunning ? 'Running Re-Audit…' : 'Complete Confirmations')

  const handleClose = () => {
    if (!canClose) {
      return
    }
    onClose()
  }

  const handleExecute = () => {
    if (!canExecute || isRunning) {
      return
    }
    onConfirmedRun()
  }

  const resultDisplay = (() => {
    if (!result) return null

    switch (result.status) {
      case CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE:
        return {
          icon: Lock,
          title: 'Re-audit checks passed',
          body:
            "This result exists only in this session's memory. Deploy remains locked. Global audit has not been updated. Acceptance review is required in a later phase before any promotion, persistence, or deploy action.",
          tone: 'bg-amber-900/20 border-amber-500/30 text-amber-100'
        }
      case CanonicalReAuditStatus.FAILED_PENDING_REVIEW:
        return {
          icon: ShieldAlert,
          title: 'Re-audit checks failed',
          body:
            'No state has changed. This result is memory-only. Deploy remains locked. Global audit has not been updated. Review the findings before retry.',
          tone: 'bg-red-900/20 border-red-500/30 text-red-100'
        }
      case CanonicalReAuditStatus.BLOCKED:
        return {
          icon: ShieldAlert,
          title: 'Re-audit blocked',
          body:
            'Execution was halted by a boundary guard. No state changed. This result is memory-only. Deploy remains locked. Global audit has not been updated.',
          tone: 'bg-red-900/30 border-red-500/40 text-red-100'
        }
      case CanonicalReAuditStatus.STALE:
        return {
          icon: AlertTriangle,
          title: 'Result stale — discarded',
          body:
            'The canonical snapshot or vault state changed during execution or preflight. The output is unreliable. No state changed. This result is memory-only. Deploy remains locked. Global audit has not been updated. Refresh and re-run.',
          tone: 'bg-yellow-900/30 border-yellow-500/40 text-yellow-100'
        }
      default:
        return {
          icon: AlertCircle,
          title: 'Re-audit error',
          body:
            'An unexpected error occurred. This result is memory-only. Deploy remains locked. Global audit has not been updated.',
          tone: 'bg-neutral-900/40 border-white/10 text-white/80'
        }
    }
  })()

  const handleAcknowledgementChange = (key: keyof typeof acknowledgements) => {
    onAcknowledgementToggle(key)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={canClose ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-gradient-to-b from-[#151920]/95 via-[#0d1016]/95 to-[#080a0e]/98 border-2 border-blue-500/40 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.8)] ring-2 ring-blue-300/20 backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-blue-800/20">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-blue-400" />
                <h2 className="text-xl font-black uppercase tracking-tight text-blue-100">
                  Canonical Re-Audit Confirmation
                </h2>
              </div>
              {canClose && (
                <button
                  onClick={handleClose}
                  className="p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Article Info */}
              {articleId && (
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
                    Target Article
                  </div>
                  <div className="text-sm font-mono text-white/90">
                    {articleId}
                  </div>
                </div>
              )}

              {/* Preflight Status */}
              {preflight && (
                <div className="space-y-4">
                  <div className="text-sm font-black text-white/80 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-400" />
                    Preflight Validation
                  </div>

                  {preflight.canRun ? (
                    <div className="px-4 py-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">
                        Preflight PASSED
                      </div>
                      {preflight.inputPreview && (
                        <div className="space-y-2 text-sm text-green-200/90">
                          <div>Article: ***{preflight.inputPreview.articleIdSuffix}</div>
                          <div>Operator: {preflight.inputPreview.operatorId}</div>
                          <div>Languages: {preflight.inputPreview.languageCount}</div>
                          <div>Snapshot: {preflight.inputPreview.snapshotShort}***</div>
                          {preflight.inputPreview.promotionIdPresent && (
                            <div>Promotion: Present</div>
                          )}
                        </div>
                      )}
                      {preflight.attestationPhrase && (
                        <div className="mt-3 px-3 py-2 bg-green-800/30 border border-green-600/40 rounded font-mono text-sm text-green-300">
                          Attestation: {preflight.attestationPhrase}
                        </div>
                      )}
                      {preflight.warnings.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {preflight.warnings.map((warning, idx) => (
                            <div key={idx} className="text-xs text-yellow-300/80 flex items-start gap-2">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                        Preflight BLOCKED
                      </div>
                      <div className="space-y-1">
                        {preflight.blockReasons.map((reason, idx) => (
                          <div key={idx} className="text-sm text-red-300/90 flex items-start gap-2">
                            <X size={12} className="mt-0.5 shrink-0" />
                            {reason.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Required Safety Warnings */}
              <div className="space-y-4">
                <div className="text-sm font-black text-white/80 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-400" />
                  Critical Safety Warnings
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 px-4 py-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <Database size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-yellow-200/90 leading-relaxed">
                      <strong>In-memory only</strong> — Canonical re-audit results are not saved to the vault or database.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <Lock size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-200/90 leading-relaxed">
                      <strong>Deploy remains locked</strong> — This action does not unlock deployment capabilities.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                    <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-200/90 leading-relaxed">
                      <strong>Global audit has not been updated</strong> — The global audit state remains unchanged.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-200/90 leading-relaxed">
                      <strong>Acceptance is a later phase</strong> — This is audit execution only, not acceptance.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <X size={16} className="text-purple-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-purple-200/90 leading-relaxed">
                      <strong>No save, publish, or deploy occurs</strong> — This action performs audit only.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                    <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-orange-200/90 leading-relaxed">
                      <strong>Result may be STALE or BLOCKED</strong> — Audit results depend on current vault state.
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Acknowledgements */}
              <div className="space-y-4">
                <div className="text-sm font-black text-white/80 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-400" />
                  Required Acknowledgements
                </div>

                {/* Typed Attestation Input */}
                {preflight?.attestationPhrase && (
                  <div className="px-4 py-3 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-4">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                      Type the exact phrase to confirm
                    </div>
                    <div className="mb-3 px-3 py-2 bg-blue-800/30 border border-blue-600/40 rounded font-mono text-sm text-blue-300">
                      {preflight.attestationPhrase}
                    </div>
                    <input
                      type="text"
                      value={typedAttestation}
                      onChange={(e) => onTypedAttestationChange(e.target.value)}
                      placeholder="Type attestation phrase exactly..."
                      className="w-full bg-black/65 border border-blue-500/30 rounded-md px-3 py-2 text-sm text-white/90 font-mono outline-none focus:border-blue-400/60 transition-colors placeholder:text-white/30"
                    />
                    {typedAttestation && !attestationMatches && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
                        <X size={12} />
                        Attestation does not match
                      </div>
                    )}
                    {typedAttestation && attestationMatches && (
                      <div className="mt-2 text-xs text-green-400 flex items-center gap-2">
                        <ShieldCheck size={12} />
                        Attestation verified
                      </div>
                    )}
                  </div>
                )}

                {/* Gate Result Display */}
                {gateResult && gateResult.blockReasons.length > 0 && (
                  <div className="px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg mb-4">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                      Execution Gate Status
                    </div>
                    <div className="space-y-1">
                      {gateResult.blockReasons.map((reason, idx) => (
                        <div key={idx} className="text-sm text-red-300/90 flex items-start gap-2">
                          <X size={12} className="mt-0.5 shrink-0" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      acknowledgements.inMemoryOnly 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-white/30 group-hover:border-white/50'
                    }`}>
                      {acknowledgements.inMemoryOnly && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={acknowledgements.inMemoryOnly}
                      onChange={() => handleAcknowledgementChange('inMemoryOnly')}
                    />
                    <span className="text-sm text-white/90 leading-relaxed group-hover:text-white">
                      I understand this is an in-memory only canonical re-audit.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      acknowledgements.deployLocked 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-white/30 group-hover:border-white/50'
                    }`}>
                      {acknowledgements.deployLocked && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={acknowledgements.deployLocked}
                      onChange={() => handleAcknowledgementChange('deployLocked')}
                    />
                    <span className="text-sm text-white/90 leading-relaxed group-hover:text-white">
                      I understand deploy remains locked after re-audit.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      acknowledgements.globalAuditNotUpdated 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-white/30 group-hover:border-white/50'
                    }`}>
                      {acknowledgements.globalAuditNotUpdated && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={acknowledgements.globalAuditNotUpdated}
                      onChange={() => handleAcknowledgementChange('globalAuditNotUpdated')}
                    />
                    <span className="text-sm text-white/90 leading-relaxed group-hover:text-white">
                      I understand global audit will not be updated automatically.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      acknowledgements.acceptanceLaterPhase 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-white/30 group-hover:border-white/50'
                    }`}>
                      {acknowledgements.acceptanceLaterPhase && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={acknowledgements.acceptanceLaterPhase}
                      onChange={() => handleAcknowledgementChange('acceptanceLaterPhase')}
                    />
                    <span className="text-sm text-white/90 leading-relaxed group-hover:text-white">
                      I understand acceptance is a later phase.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      acknowledgements.noSavePublishDeploy 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-white/30 group-hover:border-white/50'
                    }`}>
                      {acknowledgements.noSavePublishDeploy && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={acknowledgements.noSavePublishDeploy}
                      onChange={() => handleAcknowledgementChange('noSavePublishDeploy')}
                    />
                    <span className="text-sm text-white/90 leading-relaxed group-hover:text-white">
                      I understand no save, publish, or deploy occurs during this action.
                    </span>
                  </label>
                </div>
              </div>

              {hasTerminalResult && resultDisplay && (
                <div className="space-y-4">
                  <div className="text-sm font-black text-white/80 uppercase tracking-wide flex items-center gap-2">
                    <Lock size={16} className="text-amber-400" />
                    Re-Audit Result
                  </div>
                  <div className={`px-4 py-3 rounded-lg border ${resultDisplay.tone}`}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <resultDisplay.icon size={14} />
                      {resultDisplay.title}
                    </div>
                    <div className="mt-2 text-sm leading-relaxed">
                      {resultDisplay.body}
                    </div>
                    {result?.blockReason && (
                      <div className="mt-2 text-xs text-white/70 font-mono">
                        Boundary: {result.blockReason.replace(/_/g, ' ')}
                      </div>
                    )}
                    {result?.errors && result.errors.length > 0 && (
                      <div className="mt-2 text-xs text-white/70 font-mono">
                        Error: {result.errors[0]}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disabled Reason */}
              {disabledReason && (
                <div className="px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                    Execution Blocked
                  </div>
                  <div className="text-sm text-red-300/90 font-mono leading-relaxed">
                    {disabledReason}
                  </div>
                </div>
              )}

              {runError && (
                <div className="px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                    Execution Error
                  </div>
                  <div className="text-sm text-red-300/90 font-mono leading-relaxed">
                    {runError}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/2">
              <button
                onClick={handleClose}
                disabled={!canClose}
                className={`px-6 py-3 text-sm font-bold rounded-lg transition-colors uppercase tracking-wide ${
                  canClose
                    ? 'text-white/80 hover:text-white/95 hover:bg-white/10'
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                Close Review
              </button>

              {/* TASK 7C-2B-2: Final execute button gated by confirmation and controller state */}
              <button
                onClick={handleExecute}
                disabled={!canExecute || isRunning}
                className={`px-8 py-3 border-2 rounded-lg text-sm font-black uppercase tracking-wide flex items-center gap-2 transition-all ${
                  !canExecute || isRunning
                    ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed grayscale opacity-50'
                    : 'bg-gradient-to-r from-blue-700/80 to-blue-500/70 border-blue-400/60 text-blue-100 hover:from-blue-600/90 hover:to-blue-400/80 hover:border-blue-200/80 shadow-[0_8px_18px_rgba(59,130,246,0.22)] ring-2 ring-blue-300/20'
                }`}
              >
                <ShieldCheck size={16} />
                {executeLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}