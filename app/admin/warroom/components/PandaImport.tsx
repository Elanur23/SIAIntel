'use client'

import React, { useState } from 'react'
import {
  FileJson,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  Terminal,
  Loader2,
  Copy,
} from 'lucide-react'
import {
  validatePandaPackage,
  PANDA_REQUIRED_LANGS,
  PandaPackage,
  PandaValidationError,
} from '@/lib/editorial/panda-intake-validator'

interface PandaImportProps {
  isOpen: boolean
  onClose: () => void
  onApply: (pkg: PandaPackage) => void
}

export default function PandaImport({ isOpen, onClose, onApply }: PandaImportProps) {
  const [jsonText, setJsonText] = useState('')
  const [validationResult, setValidationResult] = useState<
    { ok: true; data: PandaPackage } | { ok: false; errors: PandaValidationError[] } | null
  >(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  if (!isOpen) return null

  const handleValidate = () => {
    setParseError(null)
    setValidationResult(null)
    setIsValidating(true)

    try {
      if (!jsonText.trim()) {
        throw new Error('Please paste a JSON package')
      }
      const parsed = JSON.parse(jsonText)
      const result = validatePandaPackage(parsed)
      setValidationResult(result)
    } catch (e: any) {
      setParseError(e.message || 'Invalid JSON format')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClear = () => {
    setJsonText('')
    setValidationResult(null)
    setParseError(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#18181c] border-2 border-[#23232a] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileJson className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white/90">
                Panda 9-Language Intake
              </h2>
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">
                Staging Node // Validator-Only Intake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-white/60 tracking-wider flex items-center justify-between">
              <span>Paste Panda JSON Package</span>
              <button
                onClick={handleClear}
                className="text-[10px] text-white/30 hover:text-white/60 uppercase transition-colors"
              >
                Clear
              </button>
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{ "articleId": "...", "sourceSystem": "PANDA_V1", ... }'
              className="w-full h-64 bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-blue-200 outline-none focus:border-blue-500/50 transition-colors custom-scrollbar placeholder:text-white/10"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleValidate}
              disabled={isValidating || !jsonText.trim()}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black uppercase text-sm rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 ring-2 ring-blue-400/20"
            >
              {isValidating ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
              Validate Package
            </button>
          </div>

          {/* Result Panels */}
          {(parseError || validationResult) && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              {parseError && (
                <div className="p-4 bg-red-900/20 border border-red-500/40 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-bold text-red-400 uppercase tracking-tight">
                      Parse Failure
                    </p>
                    <p className="text-xs text-red-300/80 font-mono mt-1">{parseError}</p>
                  </div>
                </div>
              )}

              {validationResult && !validationResult.ok && (
                <div className="p-4 bg-orange-900/20 border border-orange-500/40 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-orange-400 mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-bold text-orange-400 uppercase tracking-tight">
                        Validation Blocked ({validationResult.errors.length} Issues)
                      </p>
                      <p className="text-[10px] text-orange-300/60 uppercase font-black tracking-widest mt-0.5">
                        Governance gate failed. Package cannot be applied.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {validationResult.errors.map((err, i) => (
                      <div
                        key={`${err.code}-${i}`}
                        className="p-3 bg-black/40 border border-white/5 rounded-lg text-[11px] font-mono flex items-start gap-3"
                      >
                        <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded uppercase text-[9px] font-bold">
                          {err.code}
                        </span>
                        <div className="flex-1 space-y-1">
                          {err.lang && (
                            <span className="text-white/60 font-bold mr-2 uppercase">
                              [{err.lang}]
                            </span>
                          )}
                          {err.field && (
                            <span className="text-blue-400 font-bold mr-2">{err.field}:</span>
                          )}
                          <span className="text-white/80">{err.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResult && validationResult.ok && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/40 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-400 shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-bold text-emerald-400 uppercase tracking-tight">
                          Validation Success
                        </p>
                        <p className="text-[10px] text-emerald-300/60 uppercase font-black tracking-widest mt-0.5">
                          Package compliant // 9 Languages Verified
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                          Article ID
                        </p>
                        <p className="text-xs font-mono text-emerald-400/80">
                          {validationResult.data.articleId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                          Category
                        </p>
                        <p className="text-xs font-mono text-emerald-400/80">
                          {validationResult.data.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PANDA_REQUIRED_LANGS.map((l) => (
                      <div
                        key={l}
                        className="px-3 py-2 bg-black/40 border border-emerald-500/20 rounded-md flex items-center justify-between"
                      >
                        <span className="text-[10px] font-black uppercase text-white/70">{l}</span>
                        <CheckCircle2 size={10} className="text-emerald-500" />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onApply(validationResult.data)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-sm rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 ring-2 ring-emerald-400/20"
                  >
                    <Database size={16} />
                    Apply to Vault
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              SIA Governance V4.0
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              Zod Enforced
            </div>
          </div>
          <p className="text-[10px] font-medium text-white/20 uppercase italic">
            Staging Buffer // No DB Impact
          </p>
        </div>
      </div>

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
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  )
}
