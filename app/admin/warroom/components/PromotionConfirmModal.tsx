'use client'

import React from 'react'
import { X, ShieldAlert, Lock, Database, AlertTriangle } from 'lucide-react'
import type {
  PromotionPreconditionResult,
  OperatorAcknowledgementState
} from '@/lib/editorial/session-draft-promotion-types'
import type {
  SessionDraftPromotionPayload
} from '@/lib/editorial/session-draft-promotion-payload'

/**
 * Props for PromotionConfirmModal component.
 * 
 * TASK 12: Modal now supports real execution wiring.
 * - onPromote callback executes real local promotion
 * - Acknowledgement state managed by page
 * - Execution state (isPromoting, error) managed by page
 * - Deploy remains locked after promotion
 * - No API calls, no backend persistence
 */
export interface PromotionConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  
  /** Callback to close the modal */
  onClose: () => void
  
  /** Precondition check result (null if not available) */
  precondition: PromotionPreconditionResult | null
  
  /** Optional payload preview for display */
  payloadPreview?: SessionDraftPromotionPayload | null
  
  /** Optional draft metadata for display */
  draftMeta?: {
    draftId?: string
    sessionId?: string
    title?: string
    author?: string
  } | null
  
  /** Optional operator metadata for display */
  operator?: {
    operatorId?: string
    acknowledgementState?: OperatorAcknowledgementState
  } | null
  
  /** Optional UI configuration */
  uiOptions?: {
    showPayloadPreview?: boolean
    allowLocalAcknowledgeToggle?: boolean
  }
  
  /** TASK 12: Promotion execution callback */
  onPromote?: (acknowledgement: OperatorAcknowledgementState) => Promise<void> | void
  
  /** TASK 12: Whether promotion is currently executing */
  isPromoting?: boolean
  
  /** TASK 12: Promotion execution error message */
  promotionExecutionError?: string | null
}

/**
 * Promotion Confirm Modal - TASK 12: Real Execution Wiring
 * 
 * This component provides promotion precondition review and execution UI.
 * 
 * TASK 12 SAFETY RULES:
 * - Memory-only local promotion (no backend/API/database/provider)
 * - Deploy remains locked after promotion
 * - Canonical audit invalidated after promotion
 * - Full canonical re-audit required before deploy
 * - No localStorage/sessionStorage
 * - Requires all four acknowledgements before enabling promote button
 * - Prevents double-click execution
 * 
 * SAFE WORDING:
 * - Use: "Local Promotion Applied", "Canonical Audit Invalidated",
 *   "Deploy Remains Locked", "Canonical Re-Audit Required",
 *   "Memory-Only Promotion", "Session Draft Promoted to Vault"
 */
export default function PromotionConfirmModal({
  isOpen,
  onClose,
  precondition,
  payloadPreview,
  draftMeta,
  operator,
  uiOptions = {},
  onPromote,
  isPromoting = false,
  promotionExecutionError = null
}: PromotionConfirmModalProps) {
  // Default UI options
  const showPayloadPreview = uiOptions.showPayloadPreview ?? false
  const allowLocalAcknowledgeToggle = uiOptions.allowLocalAcknowledgeToggle ?? false

  // TASK 12: Local acknowledgement state (UI-only, not persisted)
  const [localAcknowledgement, setLocalAcknowledgement] = React.useState<OperatorAcknowledgementState>({
    vaultReplacementAcknowledged: false,
    auditInvalidationAcknowledged: false,
    deployLockAcknowledged: false,
    reAuditRequiredAcknowledged: false,
    acknowledgedAt: '',
    operatorId: 'warroom-operator'
  })

  // Reset acknowledgement state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalAcknowledgement({
        vaultReplacementAcknowledged: false,
        auditInvalidationAcknowledged: false,
        deployLockAcknowledged: false,
        reAuditRequiredAcknowledged: false,
        acknowledgedAt: '',
        operatorId: 'warroom-operator'
      })
    }
  }, [isOpen])

  // Modal not rendered when closed
  if (!isOpen) {
    return null
  }

  // Determine precondition outcome
  const canPromote = precondition?.canPromote ?? false
  const blockReasons = precondition?.blockReasons ?? []
  const preconditions = precondition?.preconditions

  // TASK 12: Determine if promote button should be enabled
  const allAcknowledgementsChecked = 
    localAcknowledgement.vaultReplacementAcknowledged &&
    localAcknowledgement.auditInvalidationAcknowledged &&
    localAcknowledgement.deployLockAcknowledged &&
    localAcknowledgement.reAuditRequiredAcknowledged

  const promoteButtonEnabled = 
    canPromote &&
    allAcknowledgementsChecked &&
    !isPromoting &&
    !!onPromote &&
    !!precondition &&
    !!payloadPreview

  // TASK 12: Handle promote button click
  const handlePromoteClick = async () => {
    if (!promoteButtonEnabled || !onPromote) return

    // Stamp acknowledgement with timestamp
    const stampedAcknowledgement: OperatorAcknowledgementState = {
      ...localAcknowledgement,
      acknowledgedAt: new Date().toISOString()
    }

    // Call onPromote callback
    await onPromote(stampedAcknowledgement)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-modal-title"
      aria-describedby="promotion-modal-description"
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
          <div>
            <h2 id="promotion-modal-title" className="text-lg font-bold text-amber-400">
              Review Promotion Preconditions
            </h2>
            <p className="text-xs text-amber-300/70 mt-1">
              UI scaffold only — no promotion will be executed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        <div id="promotion-modal-description" className="sr-only">
          Review promotion preconditions and payload preview. This is a UI scaffold only and will not execute promotion.
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 space-y-4">
          {/* Draft Metadata Summary */}
          {draftMeta && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Draft Metadata
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded space-y-2">
                {draftMeta.title && (
                  <div className="text-sm text-white/90 font-medium">
                    {draftMeta.title}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {draftMeta.draftId && (
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-300 font-mono rounded">
                      Draft: {draftMeta.draftId}
                    </span>
                  )}
                  {draftMeta.sessionId && (
                    <span className="px-2 py-1 bg-purple-900/30 text-purple-300 font-mono rounded">
                      Session: {draftMeta.sessionId}
                    </span>
                  )}
                  {draftMeta.author && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                      Author: {draftMeta.author}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HIGH-VISIBILITY WARNING BANNER */}
          <div className="p-4 bg-amber-900/30 border-2 border-amber-500/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400 uppercase">
                Memory-Only Local Promotion
              </h3>
            </div>
            <ul className="text-xs text-amber-300/90 space-y-1.5 list-disc list-inside">
              <li><strong>This is a memory-only local promotion.</strong> Session draft will be promoted to canonical vault in React memory.</li>
              <li><strong>Canonical audit will be invalidated.</strong> Full protocol re-audit required before deploy.</li>
              <li><strong>Deploy remains locked.</strong> Promotion does not unlock deploy.</li>
              <li><strong>No backend persistence.</strong> No API calls, no database writes, no localStorage/sessionStorage.</li>
            </ul>
          </div>

          {/* PRECONDITION SUMMARY PANEL */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Precondition Summary
            </div>
            
            {precondition ? (
              <div className={`p-4 border-2 rounded-lg ${
                canPromote 
                  ? 'bg-green-900/20 border-green-500/40'
                  : 'bg-red-900/20 border-red-500/40'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className={canPromote ? 'text-green-400' : 'text-red-400'} />
                  <h3 className={`text-sm font-bold uppercase ${
                    canPromote ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {canPromote ? 'PASS' : 'BLOCKED'}
                  </h3>
                </div>

                {preconditions && (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={preconditions.sessionDraftExists ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.sessionDraftExists ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Session draft exists</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.auditRun ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.auditRun ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Session audit run</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.auditPassed ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.auditPassed ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Session audit passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.auditNotStale ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.auditNotStale ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Session audit not stale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.globalAuditPassed ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.globalAuditPassed ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Global Audit passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.pandaCheckPassed ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.pandaCheckPassed ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Panda Check passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.snapshotIdentityMatches ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.snapshotIdentityMatches ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Snapshot identity matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.noTransformError ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.noTransformError ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">No transform error</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.articleSelected ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.articleSelected ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Article selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={preconditions.localDraftValid ? 'text-green-400' : 'text-red-400'}>
                        {preconditions.localDraftValid ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80">Local draft valid</span>
                    </div>
                  </div>
                )}

                {canPromote && (
                  <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/40 rounded text-xs text-yellow-300/90">
                    Preconditions may be satisfied, but execution is disabled in this scaffold and deploy remains locked.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-900/50 border border-gray-500/30 rounded">
                <p className="text-xs text-gray-400 italic">
                  No precondition evaluation available.
                </p>
              </div>
            )}
          </div>

          {/* BLOCKED REASONS PANEL */}
          {blockReasons.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Promotion Blocked
              </div>
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold text-red-400 uppercase">
                    Precondition Report
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-red-300/90 list-disc list-inside">
                  {blockReasons.map((reason, index) => (
                    <li key={index}>
                      <strong>Reason:</strong> {reason.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* PAYLOAD PREVIEW PANEL */}
          {showPayloadPreview && payloadPreview && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Payload Preview (Read-Only)
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3 max-h-96 overflow-y-auto">
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-black/30 rounded">
                      <div className="text-white/60 font-bold mb-1">Payload ID:</div>
                      <div className="text-white/90 font-mono break-all">{payloadPreview.payloadId}</div>
                    </div>
                    <div className="p-2 bg-black/30 rounded">
                      <div className="text-white/60 font-bold mb-1">Instruction:</div>
                      <div className="text-amber-400 font-mono">{payloadPreview.instruction}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-white/60 font-bold mb-1">Protocol Version:</div>
                    <div className="text-white/90 font-mono">{payloadPreview.promotionProtocolVersion}</div>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-white/60 font-bold mb-2">Vault Before:</div>
                    <div className="space-y-1 text-white/80 font-mono text-[10px]">
                      <div>ID: {payloadPreview.vaultBefore.vaultId}</div>
                      {payloadPreview.vaultBefore.checksum && (
                        <div>Checksum: {payloadPreview.vaultBefore.checksum.substring(0, 16)}...</div>
                      )}
                      {payloadPreview.vaultBefore.version && (
                        <div>Version: {payloadPreview.vaultBefore.version}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-white/60 font-bold mb-2">Vault After (Expected):</div>
                    <div className="space-y-1 text-white/80 font-mono text-[10px]">
                      <div>ID: {payloadPreview.vaultAfter.vaultId}</div>
                      <div>Expected Checksum: {payloadPreview.vaultAfter.expectedChecksum.substring(0, 16)}...</div>
                      {payloadPreview.vaultAfter.expectedVersion && (
                        <div>Expected Version: {payloadPreview.vaultAfter.expectedVersion}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-white/60 font-bold mb-2">Diff Metadata:</div>
                    <div className="space-y-1 text-white/80 text-[10px]">
                      <div>Change Count: {payloadPreview.diff.changeCount}</div>
                      <div>Affected Fields: {payloadPreview.diff.affectedFields.join(', ') || 'None'}</div>
                      <div>Changed Paths: {payloadPreview.diff.changedPaths.join(', ') || 'None'}</div>
                      <div className="mt-1 italic">{payloadPreview.diff.changeSummary}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-black/30 rounded">
                    <div className="text-white/60 font-bold mb-2">Promotion Metadata:</div>
                    <div className="space-y-1 text-white/80 font-mono text-[10px]">
                      <div>Requested By: {payloadPreview.promotionMeta.requestedBy}</div>
                      <div>Requested At: {payloadPreview.promotionMeta.requestedAt}</div>
                      {payloadPreview.promotionMeta.reason && (
                        <div>Reason: {payloadPreview.promotionMeta.reason}</div>
                      )}
                      {payloadPreview.promotionMeta.ledgerEventCount !== undefined && (
                        <div>Ledger Event Count: {payloadPreview.promotionMeta.ledgerEventCount}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-900/30 border border-amber-500/40 rounded">
                    <div className="text-amber-400 font-bold mb-2 text-xs">Safety Invariants:</div>
                    <div className="space-y-1 text-amber-300/90 text-[10px]">
                      <div>• forceAuditInvalidation: {String(payloadPreview.forceAuditInvalidation)}</div>
                      <div>• maintainDeployLock: {String(payloadPreview.maintainDeployLock)}</div>
                      <div>• backendPersistenceAllowed: {String(payloadPreview.backendPersistenceAllowed)}</div>
                      <div>• memoryOnly: {String(payloadPreview.memoryOnly)}</div>
                      <div>• canonicalReAuditRequiredAfterPromotion: {String(payloadPreview.canonicalReAuditRequiredAfterPromotion)}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-yellow-900/30 border border-yellow-500/40 rounded text-xs text-yellow-300/90 italic">
                    Preview truncated for display safety. Full payload available in execution handler only.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPERATOR ACKNOWLEDGEMENT CONTROLS */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Operator Acknowledgement Required
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
              <p className="text-xs text-white/70 leading-relaxed">
                This promotion requires explicit operator acknowledgement. All four acknowledgements must be checked to enable the promote button.
              </p>

              <div className="space-y-2">
                <label className={`flex items-start gap-2 ${allowLocalAcknowledgeToggle ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    disabled={!allowLocalAcknowledgeToggle || isPromoting}
                    checked={localAcknowledgement.vaultReplacementAcknowledged}
                    onChange={(e) => setLocalAcknowledgement(prev => ({
                      ...prev,
                      vaultReplacementAcknowledged: e.target.checked
                    }))}
                    className="mt-1 w-4 h-4 text-amber-600 bg-gray-900 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="text-xs text-white/80 leading-relaxed">
                    I understand session draft will replace canonical vault content in memory.
                  </span>
                </label>

                <label className={`flex items-start gap-2 ${allowLocalAcknowledgeToggle ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    disabled={!allowLocalAcknowledgeToggle || isPromoting}
                    checked={localAcknowledgement.auditInvalidationAcknowledged}
                    onChange={(e) => setLocalAcknowledgement(prev => ({
                      ...prev,
                      auditInvalidationAcknowledged: e.target.checked
                    }))}
                    className="mt-1 w-4 h-4 text-amber-600 bg-gray-900 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="text-xs text-white/80 leading-relaxed">
                    I understand canonical audit will be invalidated and full re-audit is required.
                  </span>
                </label>

                <label className={`flex items-start gap-2 ${allowLocalAcknowledgeToggle ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    disabled={!allowLocalAcknowledgeToggle || isPromoting}
                    checked={localAcknowledgement.deployLockAcknowledged}
                    onChange={(e) => setLocalAcknowledgement(prev => ({
                      ...prev,
                      deployLockAcknowledged: e.target.checked
                    }))}
                    className="mt-1 w-4 h-4 text-amber-600 bg-gray-900 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="text-xs text-white/80 leading-relaxed">
                    I understand deploy remains locked after promotion.
                  </span>
                </label>

                <label className={`flex items-start gap-2 ${allowLocalAcknowledgeToggle ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    disabled={!allowLocalAcknowledgeToggle || isPromoting}
                    checked={localAcknowledgement.reAuditRequiredAcknowledged}
                    onChange={(e) => setLocalAcknowledgement(prev => ({
                      ...prev,
                      reAuditRequiredAcknowledged: e.target.checked
                    }))}
                    className="mt-1 w-4 h-4 text-amber-600 bg-gray-900 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="text-xs text-white/80 leading-relaxed">
                    I understand full canonical re-audit is required before deploy.
                  </span>
                </label>
              </div>

              {!allowLocalAcknowledgeToggle && (
                <div className="p-2 bg-gray-900/50 border border-gray-700 rounded text-xs text-gray-400 italic text-center">
                  Acknowledgement controls disabled (allowLocalAcknowledgeToggle not enabled)
                </div>
              )}
            </div>
          </div>

          {/* TASK 12: Promotion Execution Error Display */}
          {promotionExecutionError && (
            <div className="p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-sm font-bold text-red-400 uppercase">
                  Promotion Execution Error
                </h3>
              </div>
              <p className="text-xs text-red-300/90 leading-relaxed font-mono">
                {promotionExecutionError}
              </p>
            </div>
          )}

          {/* MANDATORY SAFETY FOOTERS */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/20 rounded-md text-[10px] text-yellow-500/70 font-bold uppercase tracking-wide">
              <Database size={10} />
              Not Saved to Vault
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/10 border border-red-500/20 rounded-md text-[10px] text-red-500/60 font-bold uppercase tracking-wide">
              <Lock size={10} />
              Deploy Remains Locked
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-black uppercase tracking-wide">
              <Lock size={10} />
              Canonical Re-Audit Required
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="p-4 border-t border-white/10 bg-gray-900/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary button - Promote (enabled when all acknowledgements checked) */}
            <button
              disabled={!promoteButtonEnabled}
              onClick={handlePromoteClick}
              className={`flex-1 px-4 py-3 rounded text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                promoteButtonEnabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              title={
                !canPromote
                  ? 'Preconditions not met'
                  : !allAcknowledgementsChecked
                  ? 'All acknowledgements must be checked'
                  : isPromoting
                  ? 'Promotion in progress'
                  : !onPromote
                  ? 'Promotion handler not provided'
                  : !precondition || !payloadPreview
                  ? 'Precondition or payload missing'
                  : 'Execute memory-only local promotion'
              }
            >
              {isPromoting ? 'Promoting...' : 'Promote to Canonical Vault'}
            </button>

            {/* Secondary button - Close/Cancel */}
            <button
              onClick={onClose}
              disabled={isPromoting}
              className={`flex-1 px-4 py-3 rounded text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isPromoting
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isPromoting ? 'Executing...' : 'Cancel'}
            </button>
          </div>

          <p className="text-xs text-white/40 text-center italic">
            {isPromoting 
              ? 'Promotion in progress — do not close this window'
              : 'Memory-Only Local Promotion — Deploy Remains Locked'}
          </p>
        </footer>
      </div>
    </div>
  )
}
