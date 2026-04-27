'use client'

import React, { useEffect, useState } from 'react'
import { X, ShieldAlert, Eye, Trash2 } from 'lucide-react'
import type { RemediationSuggestion } from '@/lib/editorial/remediation-types'
import {
  isApplyEligibleSuggestion,
  getApplyBlockReason,
  type AppliedRemediationEvent,
  type DraftSnapshot,
  type AuditInvalidationState,
  AuditInvalidationReason,
  CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY,
  type LocalDraftApplyRequest,
  type LocalDraftApplyRequestResult
} from '@/lib/editorial/remediation-apply-types'

interface RemediationConfirmModalProps {
  // Modal State
  isOpen: boolean
  onClose: () => void
  
  // Suggestion Data
  suggestion: RemediationSuggestion | null
  originalText?: string | null
  
  // Context (for display only)
  articleId?: string
  packageId?: string
  
  // Phase 3C-3B-2: Typed callback plumbing (Dry-run only)
  onRequestLocalDraftApply?: (request: LocalDraftApplyRequest) => Promise<LocalDraftApplyRequestResult> | LocalDraftApplyRequestResult

  // Styling
  className?: string
}

/**
 * Phase 3C-2 Inert Preview State Model
 * 
 * Local in-memory preview objects that simulate future apply flow
 * without mutating draft, vault, or audit state.
 */
interface InertPreviewState {
  mockSnapshot: DraftSnapshot
  mockAppliedEvent: AppliedRemediationEvent
  mockAuditInvalidation: AuditInvalidationState
  previewOnly: true
  noMutation: true
  createdAt: string
}

/**
 * Controlled Remediation Phase 3C-2 - Inert Apply Preview Modal
 *
 * This component provides a UI-only confirmation modal with inert preview capability.
 * It displays a side-by-side diff preview with mandatory human confirmation checkboxes,
 * a disabled real Apply button, and a separate inert preview control.
 *
 * CRITICAL PHASE 3C-2 CONSTRAINTS:
 * - Strictly UI prototype only — no actual draft or vault mutation
 * - No API routes, database writes, or server persistence
 * - No audit state changes or deploy gate modifications
 * - Preview objects are local in-memory only
 * - Preview does not unlock Deploy
 * - Preview does not change real audit state
 *
 * SAFETY RULES:
 * - Read-only / Presentational
 * - No Apply to Draft functionality (real button remains disabled)
 * - No vault/article mutation
 * - No API/Database calls
 * - No localStorage/sessionStorage persistence
 * - Preview state is local component state only
 * - Disabled apply button remains permanently disabled
 * - Forbidden wording guarded
 */
export default function RemediationConfirmModal({
  isOpen,
  onClose,
  suggestion,
  originalText,
  articleId,
  packageId,
  onRequestLocalDraftApply,
  className = ''
}: RemediationConfirmModalProps) {
  // Local UI state for confirmation checkboxes
  const [confirmations, setConfirmations] = useState({
    understandsDraftChange: false,
    reviewedDiff: false,
    understandsNoDeployUnlock: false
  })

  // Phase 3C-2: Local in-memory preview state (never persisted)
  const [inertPreview, setInertPreview] = useState<InertPreviewState | null>(null)

  // Phase 3C-3C-1: Typed acknowledgement scaffold (UI-only, no execution)
  const [typedAcknowledgement, setTypedAcknowledgement] = useState('')
  const REQUIRED_ACKNOWLEDGEMENT_PHRASE = 'STAGE'

  // Reset confirmation state and preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmations({
        understandsDraftChange: false,
        reviewedDiff: false,
        understandsNoDeployUnlock: false
      })
      setInertPreview(null) // Clear preview on close
      setTypedAcknowledgement('') // Clear typed acknowledgement on close
    }
  }, [isOpen])

  // ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus first interactive element when modal opens
      const firstButton = document.querySelector('[role="dialog"] button')
      if (firstButton instanceof HTMLElement) {
        firstButton.focus()
      }
    }
  }, [isOpen])

  // Modal not rendered when closed or no suggestion
  if (!isOpen || !suggestion) {
    return null
  }

  const allConfirmed = Object.values(confirmations).every(Boolean)
  const canShowApply = originalText && suggestion.suggestedText
  
  // Phase 3C-2: Check if suggestion is eligible for inert preview
  const isEligibleForPreview = isApplyEligibleSuggestion(suggestion)
  const blockReason = getApplyBlockReason(suggestion)

  // Phase 3C-3C-1: Check if typed acknowledgement matches required phrase
  const isAcknowledgementValid = typedAcknowledgement.trim() === REQUIRED_ACKNOWLEDGEMENT_PHRASE

  // Phase 3C-2: Handler for inert preview (no mutations)
  const handleInertPreview = () => {
    if (!suggestion || !originalText || !suggestion.suggestedText) return
    if (!allConfirmed) return
    if (!isEligibleForPreview) return

    // Generate local in-memory preview objects only
    const now = new Date().toISOString()
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const mockSnapshot: DraftSnapshot = {
      snapshotId: `snapshot-${previewId}`,
      articleId: articleId || 'unknown',
      packageId: packageId || 'unknown',
      affectedLanguage: suggestion.affectedLanguage,
      affectedField: suggestion.affectedField,
      beforeValue: originalText,
      createdAt: now,
      reason: 'INERT_PREVIEW_ONLY',
      linkedSuggestionId: suggestion.id
    }

    const mockAppliedEvent: AppliedRemediationEvent = {
      eventId: `event-${previewId}`,
      suggestionId: suggestion.id,
      articleId: articleId || 'unknown',
      packageId: packageId || 'unknown',
      operatorId: 'preview-operator',
      category: suggestion.category,
      affectedLanguage: suggestion.affectedLanguage,
      affectedField: suggestion.affectedField,
      originalText: originalText,
      appliedText: suggestion.suggestedText,
      diff: { from: originalText, to: suggestion.suggestedText },
      auditInvalidated: true, // MOCK/FUTURE EFFECT ONLY
      reAuditRequired: true, // MOCK/FUTURE EFFECT ONLY
      createdAt: now,
      approvalTextAccepted: [
        'I understand this changes the draft and requires re-audit.',
        'I have reviewed the before/after diff.',
        'I understand this does not unlock Deploy.'
      ],
      confirmationMethod: 'INERT_PREVIEW_CHECKBOX',
      phase: CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY
    }

    const mockAuditInvalidation: AuditInvalidationState = {
      auditInvalidated: true, // MOCK/FUTURE EFFECT ONLY
      reAuditRequired: true, // MOCK/FUTURE EFFECT ONLY
      invalidationReason: AuditInvalidationReason.REMEDIATION_APPLIED,
      invalidatedAt: now
    }

    // Store in local component state only (never persisted)
    setInertPreview({
      mockSnapshot,
      mockAppliedEvent,
      mockAuditInvalidation,
      previewOnly: true,
      noMutation: true,
      createdAt: now
    })
  }

  // Phase 3C-2: Handler to clear preview (no changes saved)
  const handleClearPreview = () => {
    setInertPreview(null)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div className="relative bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full mx-3 sm:mx-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <h2 id="modal-title" className="text-lg font-bold text-white">
            Review Suggestion
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        <div id="modal-description" className="sr-only">
          Review remediation suggestion with side-by-side diff preview and confirmation checkboxes
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 space-y-4">
          {/* MANDATORY WARNING BANNER */}
          <div className="p-4 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-yellow-400" />
              <h3 className="text-sm font-bold text-yellow-400 uppercase">
                Prototype Only — No Changes Made
              </h3>
            </div>
            <ul className="text-xs text-yellow-300/90 space-y-1 list-disc list-inside">
              <li>Prototype only — no draft change will be made.</li>
              <li>This does not unlock Deploy.</li>
              <li>Future apply will require re-audit.</li>
              <li>Human approval is required before any draft change.</li>
            </ul>
          </div>

          {/* Suggestion Context */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Suggestion Details
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-bold rounded uppercase">
                  {suggestion.category.replace(/_/g, ' ')}
                </span>
                {suggestion.affectedLanguage && (
                  <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs font-bold rounded uppercase">
                    {suggestion.affectedLanguage}
                  </span>
                )}
                {suggestion.affectedField && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                    {suggestion.affectedField}
                  </span>
                )}
              </div>
              <div className="text-xs text-white/70 leading-relaxed">
                {suggestion.issueDescription}
              </div>
              <div className="text-xs text-white/50 italic leading-relaxed">
                Rationale: {suggestion.rationale}
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE DIFF PREVIEW */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Before / After Preview
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Left Column: Original Text */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white/80">Current Text</h3>
                {originalText ? (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded min-h-[100px]">
                    <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono break-words">
                      {originalText}
                    </pre>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-900/50 border border-gray-500/30 rounded min-h-[100px] flex items-center justify-center">
                    <p className="text-xs text-gray-400 italic text-center">
                      Original text unavailable — apply disabled.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Suggested Text */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white/80">Suggested Text</h3>
                {suggestion.suggestedText ? (
                  <div className="p-3 bg-green-900/20 border border-green-500/30 rounded min-h-[100px]">
                    <pre className="text-xs text-green-300 whitespace-pre-wrap font-mono break-words">
                      {suggestion.suggestedText}
                    </pre>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-900/50 border border-gray-500/30 rounded min-h-[100px] flex items-center justify-center">
                    <p className="text-xs text-gray-400 italic text-center">
                      No automated suggestion available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MANDATORY CONFIRMATION CHECKBOXES */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Required Confirmations
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmations.understandsDraftChange}
                  onChange={(e) => setConfirmations(prev => ({
                    ...prev,
                    understandsDraftChange: e.target.checked
                  }))}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-white/80 leading-relaxed">
                  I understand this changes the draft and requires re-audit.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmations.reviewedDiff}
                  onChange={(e) => setConfirmations(prev => ({
                    ...prev,
                    reviewedDiff: e.target.checked
                  }))}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-white/80 leading-relaxed">
                  I have reviewed the before/after diff.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmations.understandsNoDeployUnlock}
                  onChange={(e) => setConfirmations(prev => ({
                    ...prev,
                    understandsNoDeployUnlock: e.target.checked
                  }))}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-white/80 leading-relaxed">
                  I understand this does not unlock Deploy.
                </span>
              </label>
            </div>
          </div>

          {/* PHASE 3C-3C-1: UI SAFETY SCAFFOLD FOR FUTURE LOCAL DRAFT APPLY */}
          {isEligibleForPreview && (
            <div className="space-y-2 pt-2 border-t-2 border-orange-500/30">
              <div className="p-4 bg-orange-900/20 border-2 border-orange-500/40 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-orange-400" />
                  <h3 className="text-sm font-bold text-orange-400 uppercase">
                    Future Local Draft Copy Only
                  </h3>
                </div>
                
                <div className="space-y-2 text-xs text-orange-300/90">
                  <div className="p-3 bg-black/30 border border-orange-500/20 rounded">
                    <div className="font-bold text-orange-400 mb-2">Safety Constraints:</div>
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li><strong>Local Draft Copy Only</strong> — Vault remains unchanged</li>
                      <li><strong>This will not save or publish</strong> — No backend mutation</li>
                      <li><strong>Deploy remains locked</strong> — No unlock mechanism</li>
                      <li><strong>Future local apply will invalidate the current Global Audit</strong></li>
                      <li><strong>A full re-audit will be required before deploy</strong></li>
                      <li><strong>FORMAT_REPAIR + body only</strong> — Other categories require manual review</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-black/30 border border-orange-500/20 rounded">
                    <div className="font-bold text-orange-400 mb-2">Eligibility:</div>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Category: <span className="font-mono text-orange-200">{suggestion.category}</span></li>
                      <li>Field: <span className="font-mono text-orange-200">{suggestion.affectedField || 'N/A'}</span></li>
                      <li>Status: <span className="text-green-400 font-bold">✓ Eligible for future local apply</span></li>
                    </ul>
                  </div>
                </div>

                {/* Typed Acknowledgement Input Scaffold */}
                <div className="space-y-2">
                  <label className="block">
                    <div className="text-xs font-bold text-orange-400 mb-2 uppercase">
                      Future Local Apply Acknowledgement (Scaffold Only)
                    </div>
                    <div className="text-xs text-orange-300/70 mb-2 italic">
                      Future local apply will require typing: <span className="font-mono font-bold text-orange-200">{REQUIRED_ACKNOWLEDGEMENT_PHRASE}</span>
                    </div>
                    <input
                      type="text"
                      value={typedAcknowledgement}
                      onChange={(e) => setTypedAcknowledgement(e.target.value)}
                      placeholder={`Type "${REQUIRED_ACKNOWLEDGEMENT_PHRASE}" to prepare acknowledgement`}
                      className="w-full px-3 py-2 bg-black/50 border border-orange-500/30 rounded text-sm text-orange-200 font-mono placeholder:text-orange-500/30 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </label>
                  
                  {/* Acknowledgement Status Display (UI-only feedback) */}
                  {typedAcknowledgement && (
                    <div className={`p-2 rounded text-xs font-bold ${
                      isAcknowledgementValid 
                        ? 'bg-green-900/30 border border-green-500/40 text-green-400'
                        : 'bg-red-900/30 border border-red-500/40 text-red-400'
                    }`}>
                      {isAcknowledgementValid 
                        ? '✓ Acknowledgement prepared (UI scaffold only — no action enabled)'
                        : `✗ Must type exactly: ${REQUIRED_ACKNOWLEDGEMENT_PHRASE}`
                      }
                    </div>
                  )}
                </div>

                <div className="p-3 bg-yellow-900/30 border border-yellow-500/40 rounded">
                  <div className="text-xs font-bold text-yellow-400 mb-1 uppercase">
                    ⚠ Phase 3C-3C-1 Scaffold Notice
                  </div>
                  <div className="text-xs text-yellow-300/80 leading-relaxed">
                    This is UI-only safety scaffold. No apply action is enabled. No controller invocation. No vault mutation.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3C-3C-1: INELIGIBLE SUGGESTION EXPLANATION */}
          {!isEligibleForPreview && blockReason && (
            <div className="space-y-2 pt-2 border-t-2 border-red-500/30">
              <div className="p-4 bg-red-900/20 border-2 border-red-500/40 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold text-red-400 uppercase">
                    Not Eligible for Local Draft Apply
                  </h3>
                </div>
                
                <div className="space-y-2 text-xs text-red-300/90">
                  <div className="p-3 bg-black/30 border border-red-500/20 rounded">
                    <div className="font-bold text-red-400 mb-2">Reason:</div>
                    <div className="text-red-300">{blockReason.replace(/_/g, ' ')}</div>
                  </div>

                  <div className="p-3 bg-black/30 border border-red-500/20 rounded">
                    <div className="font-bold text-red-400 mb-2">Category:</div>
                    <div className="font-mono text-red-300">{suggestion.category}</div>
                  </div>

                  <div className="p-3 bg-yellow-900/30 border border-yellow-500/40 rounded">
                    <div className="font-bold text-yellow-400 mb-2">Manual Review Required:</div>
                    <ul className="space-y-1 list-disc list-inside text-yellow-300/90">
                      <li>This suggestion requires human judgment and manual editing</li>
                      <li>Only FORMAT_REPAIR suggestions on body field are eligible for future local apply</li>
                      <li>High-risk categories (SOURCE_REVIEW, PROVENANCE_REVIEW, PARITY_REVIEW, etc.) must be handled manually</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DISABLED/MOCK APPLY CONTROL */}
          <div className="space-y-2">
            <button
              disabled={true}
              className="w-full px-4 py-3 bg-gray-600 text-gray-400 rounded cursor-not-allowed text-sm font-bold"
              title="Prototype only — no draft changes will be made"
            >
              Apply to Draft — Disabled in Phase 3B
            </button>
            <p className="text-xs text-white/40 text-center italic">
              This is a UI prototype. No draft changes will be made.
            </p>
          </div>

          {/* PHASE 3C-2: INERT PREVIEW CONTROL */}
          {isEligibleForPreview && !inertPreview && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={14} className="text-blue-400" />
                  <h3 className="text-xs font-bold text-blue-400 uppercase">
                    Inert Preview Available
                  </h3>
                </div>
                <ul className="text-xs text-blue-300/90 space-y-1 list-disc list-inside mb-3">
                  <li>Preview only — this action will not change the draft or vault.</li>
                  <li>This preview does not unlock Deploy and does not change the real audit state.</li>
                  <li>A real Apply will invalidate the global audit and require a full re-audit.</li>
                  <li>Human approval will be required for any future real Apply.</li>
                  <li>Only FORMAT_REPAIR suggestions are eligible for future Tier-1 Apply in this pilot.</li>
                </ul>
                <button
                  onClick={handleInertPreview}
                  disabled={!allConfirmed}
                  className={`w-full px-4 py-2 rounded text-sm font-bold transition-colors ${
                    allConfirmed
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={allConfirmed ? 'Generate inert preview (no draft change)' : 'Complete all confirmations first'}
                >
                  Preview Apply (No Draft Change)
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3C-2: INERT PREVIEW RESULT DISPLAY */}
          {inertPreview && (
            <div className="space-y-2 pt-2 border-t-2 border-green-500/30">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-green-400" />
                    <h3 className="text-sm font-bold text-green-400 uppercase">
                      Preview Only — No Draft Change
                    </h3>
                  </div>
                  <button
                    onClick={handleClearPreview}
                    className="p-1 text-green-400 hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    title="Clear preview (no changes saved)"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-green-300/90">
                  <div className="p-2 bg-black/30 rounded font-mono">
                    <div className="text-green-400 font-bold mb-1">Preview Event ID:</div>
                    <div className="text-green-300 break-all">{inertPreview.mockAppliedEvent.eventId}</div>
                  </div>

                  <div className="p-2 bg-black/30 rounded font-mono">
                    <div className="text-green-400 font-bold mb-1">Suggestion ID:</div>
                    <div className="text-green-300 break-all">{inertPreview.mockAppliedEvent.suggestionId}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-black/30 rounded">
                      <div className="text-green-400 font-bold mb-1">Language:</div>
                      <div className="text-green-300">{inertPreview.mockAppliedEvent.affectedLanguage || 'N/A'}</div>
                    </div>
                    <div className="p-2 bg-black/30 rounded">
                      <div className="text-green-400 font-bold mb-1">Category:</div>
                      <div className="text-green-300">{inertPreview.mockAppliedEvent.category.replace(/_/g, ' ')}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-900/30 border border-yellow-500/40 rounded">
                    <div className="font-bold text-yellow-400 mb-2">Preview Status:</div>
                    <ul className="space-y-1 list-disc list-inside text-yellow-300/90">
                      <li>✅ No draft change made</li>
                      <li>✅ No backend call made</li>
                      <li>✅ Deploy remains locked</li>
                      <li>✅ Real audit state unchanged</li>
                      <li>⚠️ Future real Apply will invalidate audit</li>
                      <li>⚠️ Future real Apply will require re-audit</li>
                    </ul>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-green-400 font-bold mb-1">Mock Audit Invalidation (Future Effect Only):</div>
                    <div className="text-green-300">
                      auditInvalidated: {String(inertPreview.mockAuditInvalidation.auditInvalidated)}
                    </div>
                    <div className="text-green-300">
                      reAuditRequired: {String(inertPreview.mockAuditInvalidation.reAuditRequired)}
                    </div>
                    <div className="text-green-300">
                      reason: {inertPreview.mockAuditInvalidation.invalidationReason}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClearPreview}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded transition-colors"
                >
                  Clear Preview (No Changes Saved)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-white/10 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40">
              {articleId && <span className="font-mono">Article: {articleId}</span>}
              {packageId && <span className="font-mono ml-3">Package: {packageId}</span>}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
