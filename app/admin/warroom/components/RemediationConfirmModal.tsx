'use client'

import React, { useEffect, useState } from 'react'
import { X, ShieldAlert } from 'lucide-react'
import type { RemediationSuggestion } from '@/lib/editorial/remediation-types'

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
  
  // Styling
  className?: string
}

/**
 * Controlled Remediation Phase 3B - Confirmation Modal Prototype
 *
 * This component provides a UI-only confirmation modal for reviewing eligible
 * remediation suggestions. It displays a side-by-side diff preview with mandatory
 * human confirmation checkboxes and a disabled/mock apply control.
 *
 * CRITICAL PHASE 3B CONSTRAINTS:
 * - Strictly UI prototype only — no actual draft or vault mutation
 * - No API routes, database writes, or server persistence
 * - No audit state changes or deploy gate modifications
 * - Preview future human-approved draft apply behavior without implementing it
 *
 * SAFETY RULES:
 * - Read-only / Presentational
 * - No Apply to Draft functionality
 * - No vault/article mutation
 * - No API/Database calls
 * - Disabled apply button remains permanently disabled
 * - No console.log apply simulation
 * - Forbidden wording guarded
 */
export default function RemediationConfirmModal({
  isOpen,
  onClose,
  suggestion,
  originalText,
  articleId,
  packageId,
  className = ''
}: RemediationConfirmModalProps) {
  // Local UI state for confirmation checkboxes
  const [confirmations, setConfirmations] = useState({
    understandsDraftChange: false,
    reviewedDiff: false,
    understandsNoDeployUnlock: false
  })

  // Reset confirmation state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmations({
        understandsDraftChange: false,
        reviewedDiff: false,
        understandsNoDeployUnlock: false
      })
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
