'use client'

/**
 * SIA DISTRIBUTION OS - PLATFORM SELECTOR
 * Phase 1: Platform selection checkboxes
 */

import { SUPPORTED_PLATFORMS, PLATFORM_LABELS } from '@/lib/distribution/core/constants'
import type { Platform } from '@/lib/distribution/core/types'

interface PlatformSelectorProps {
  selected: Platform[]
  onChange: (platforms: Platform[]) => void
  disabled?: boolean
}

export default function PlatformSelector({ selected, onChange, disabled = false }: PlatformSelectorProps) {
  const handleToggle = (platform: Platform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter(p => p !== platform))
    } else {
      onChange([...selected, platform])
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-gray-400 uppercase tracking-widest">
        Select Platforms
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SUPPORTED_PLATFORMS.slice(0, 4).map((platform) => (
          <label
            key={platform}
            className={`
              flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
              ${selected.includes(platform)
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={selected.includes(platform)}
              onChange={() => handleToggle(platform)}
              disabled={disabled}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm font-bold uppercase tracking-wider">
              {PLATFORM_LABELS[platform]}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
