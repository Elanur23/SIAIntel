'use client'

import { AlertTriangle } from 'lucide-react'
import type { LegalDisclaimer } from '@/lib/compliance/ban-shield'

interface LegalDisclaimerProps {
  disclaimer: LegalDisclaimer
}

export default function LegalDisclaimer({ disclaimer }: LegalDisclaimerProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 my-8">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-400 mb-3">
            {disclaimer.title}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            {disclaimer.content}
          </p>
          {disclaimer.regulatoryReferences.length > 0 && (
            <div className="text-xs text-slate-400 border-t border-amber-500/20 pt-3">
              {disclaimer.regulatoryReferences.map((ref, i) => (
                <p key={i}>{ref}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
