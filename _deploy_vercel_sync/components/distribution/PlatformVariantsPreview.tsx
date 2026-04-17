/**
 * Platform Variants Preview Component
 * Shows platform-specific content variants
 */

'use client'

import { useState } from 'react'
import type { Platform, PlatformVariant } from '@/lib/distribution/types'

interface PlatformVariantsPreviewProps {
  platformVariants: Partial<Record<Platform, PlatformVariant>>
}

const PLATFORM_NAMES: Record<Platform, string> = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  facebook: 'Facebook',
  discord: 'Discord',
  instagram: 'Instagram',
  tiktok: 'TikTok'
}

const PLATFORM_ICONS: Record<Platform, string> = {
  x: '𝕏',
  linkedin: 'in',
  telegram: '✈',
  facebook: 'f',
  discord: '💬',
  instagram: '📷',
  tiktok: '🎵'
}

export default function PlatformVariantsPreview({ platformVariants }: PlatformVariantsPreviewProps) {
  const platforms = Object.keys(platformVariants) as Platform[]
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    platforms.length > 0 ? platforms[0] : null
  )

  if (platforms.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
        <p className="text-slate-400">No platform variants available</p>
      </div>
    )
  }

  const variant = selectedPlatform ? platformVariants[selectedPlatform] : null

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Platform Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10 overflow-x-auto">
        {platforms.map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-2 ${
              selectedPlatform === platform
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span>{PLATFORM_ICONS[platform]}</span>
            {PLATFORM_NAMES[platform]}
          </button>
        ))}
      </div>

      {/* Variant Content */}
      {variant ? (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">Platform</p>
              <p className="text-lg font-bold">{PLATFORM_NAMES[variant.platform]}</p>
            </div>
            <StatusBadge status={variant.status} />
          </div>

          <div>
            <p className="text-slate-500 text-sm mb-2">Title</p>
            <h3 className="text-xl font-bold">{variant.title}</h3>
          </div>

          <div>
            <p className="text-slate-500 text-sm mb-2">Body</p>
            <div className="text-slate-300 whitespace-pre-wrap bg-black/20 rounded-lg p-4">
              {variant.body}
            </div>
          </div>

          {variant.media && variant.media.length > 0 && (
            <div>
              <p className="text-slate-500 text-sm mb-2">Media ({variant.media.length})</p>
              <div className="flex flex-wrap gap-2">
                {variant.media.map((url, i) => (
                  <div key={i} className="px-3 py-1 bg-purple-500/20 text-purple-500 rounded-lg text-sm">
                    Media {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {variant.publishedUrl && (
            <div>
              <p className="text-slate-500 text-sm mb-2">Published URL</p>
              <a 
                href={variant.publishedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {variant.publishedUrl}
              </a>
            </div>
          )}

          {variant.publishedAt && (
            <div>
              <p className="text-slate-500 text-sm mb-1">Published At</p>
              <p className="text-white">{new Date(variant.publishedAt).toLocaleString()}</p>
            </div>
          )}

          {variant.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-500 font-bold mb-1">Error</p>
              <p className="text-red-400 text-sm">{variant.error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-slate-400">
          No variant available
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    published: 'bg-emerald-500/20 text-emerald-500',
    failed: 'bg-red-500/20 text-red-500'
  }

  return (
    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${statusColors[status as keyof typeof statusColors]}`}>
      {status}
    </span>
  )
}
