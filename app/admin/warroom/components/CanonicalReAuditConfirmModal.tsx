'use client'

import React, { useState } from 'react'
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
import type { CanonicalReAuditRunGateResultFields } from '../controllers/canonical-reaudit-run-controller'

interface CanonicalReAuditConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  disabledReason?: string | null
  articleId?: string | null
  preflight?: CanonicalReAuditPreflightResult | null
  gateResult?: CanonicalReAuditRunGateResultFields | null
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
  disabledReason,
  articleId,
  preflight,
  gateResult
}: CanonicalReAuditConfirmModalProps) {
  // Internal acknowledgement state
  const [acknowledgements, setAcknowledgements] = useState({
    inMemoryOnly: false,
    deployLocked: false,
    globalAuditNotUpdated: false,
    acceptanceLaterPhase: false,
    noSavePublishDeploy: false
  })

  // Typed attestation state
  const [typedAttestation, setTypedAttestation] = useState('')

  // Reset acknowledgements and typed attestation when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAcknowledgements({
        inMemoryOnly: false,
        deployLocked: false,
        globalAuditNotUpdated: false,
        acceptanceLaterPhase: false,
        noSavePublishDeploy: false
      })
      setTypedAttestation('')
    }
  }, [isOpen])

  const allAcknowledged = Object.values(acknowledgements).every(Boolean)
  const attestationMatches = preflight?.attestationPhrase ? 
    typedAttestation.trim() === preflight.attestationPhrase.trim() : 
    true // No attestation required if no phrase provided

  const handleAcknowledgementChange = (key: keyof typeof acknowledgements) => {
    setAcknowledgements(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
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
            onClick={onClose}
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
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
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
                      onChange={(e) => setTypedAttestation(e.target.value)}
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/2">
              <button
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-white/70 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors uppercase tracking-wide"
              >
                Cancel
              </button>

              {/* TASK 7C-2B-1: Final execute button reflects gate state but remains disabled/inert */}
              <button
                disabled={true} // Always disabled in Task 7C-2B-1
                className="px-8 py-3 bg-neutral-800 text-neutral-500 border-2 border-neutral-700 cursor-not-allowed grayscale opacity-50 rounded-lg text-sm font-black uppercase tracking-wide flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                {gateResult?.uiLabel || 'Execute Re-Audit'} (Disabled)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}