'use client'

import { Clock, BarChart3, Share2, Eye } from 'lucide-react'
import type { HumanTouchMetadata } from '@/lib/compliance/ban-shield'

interface ArticleMetadataProps {
  metadata: HumanTouchMetadata
  onShare?: () => void
}

export default function ArticleMetadata({ metadata, onShare }: ArticleMetadataProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 border-t border-b border-slate-700 py-4 my-6">
      {/* Reading Time */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>{metadata.readingTime}</span>
      </div>

      {/* Difficulty Level */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        <span>{metadata.difficultyLevel}</span>
      </div>

      {/* View Count (if available) */}
      {metadata.viewCount && (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{metadata.viewCount.toLocaleString()} views</span>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex-1 text-right text-xs">
        {metadata.lastUpdated}
      </div>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
      >
        <Share2 className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400">{metadata.sharePrompt}</span>
      </button>
    </div>
  )
}
