'use client'

import React from 'react'
import { Radio } from 'lucide-react'

export default function LiveAnalystTrigger({ label }: { label?: string }) {
  const triggerLiveAnalyst = () => {
    window.dispatchEvent(new CustomEvent('sia-trigger-live-analyst'))
  }

  return (
    <button
      onClick={triggerLiveAnalyst}
      className="px-8 py-4 bg-blue-600 border border-blue-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3"
    >
      <Radio size={16} className="animate-pulse" /> {label || 'Discuss_with_Live_AI'}
    </button>
  )
}
