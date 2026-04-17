/**
 * Feature Flags Panel Component
 * Display and control feature flags
 */

'use client'

import { useEffect, useState } from 'react'
import { getAllFeatureFlags, type FeatureFlag } from '@/lib/distribution/feature-flags'

const FLAG_DESCRIPTIONS: Record<FeatureFlag, string> = {
  enableDistributionModule: 'Master switch for entire distribution system',
  enableBreakingMode: 'Enable breaking news distribution mode',
  enableEditorialMode: 'Enable editorial distribution mode',
  enableAIGeneration: 'Enable AI content generation (Phase 3A)',
  enableGeminiProvider: 'Enable Gemini 1.5 Pro provider (Phase 3A)',
  enablePublishSimulation: 'Enable publish simulation (Phase 3B - dry-run only)',
  enableTelegramSandboxPublish: 'Enable Telegram SANDBOX publishing (Phase 3C - test only)',
  enableTelegramProductionPublish: 'Enable Telegram PRODUCTION publishing (Phase 3C - disabled)',
  enableAutonomousAssistant: 'Enable autonomous suggestion assistant (Phase 3D - human-in-loop only)',
  enablePlatformX: 'Enable X (Twitter) integration',
  enablePlatformLinkedIn: 'Enable LinkedIn integration',
  enablePlatformTelegram: 'Enable Telegram integration',
  enablePlatformFacebook: 'Enable Facebook integration',
  enablePlatformDiscord: 'Enable Discord integration (Phase 3)',
  enablePlatformInstagram: 'Enable Instagram integration (Phase 3)',
  enablePlatformTikTok: 'Enable TikTok integration (Phase 3)'
}

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>)

  useEffect(() => {
    const flagsData = getAllFeatureFlags()
    setFlags(flagsData)
  }, [])

  const flagEntries = Object.entries(flags) as [FeatureFlag, boolean][]
  const enabledCount = flagEntries.filter(([, enabled]) => enabled).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-4">FEATURE_FLAGS_STATUS</h2>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-slate-400 text-sm mb-1">Total Flags</p>
            <p className="text-3xl font-black">{flagEntries.length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Enabled</p>
            <p className="text-3xl font-black text-emerald-500">{enabledCount}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Disabled</p>
            <p className="text-3xl font-black text-slate-500">{flagEntries.length - enabledCount}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
        <p className="text-yellow-500 font-bold mb-2">⚠️ Read-Only Display</p>
        <p className="text-slate-400 text-sm">
          Feature flags are currently read-only in the UI. To enable/disable features, 
          modify the flags in <code className="bg-black/40 px-2 py-1 rounded">lib/distribution/feature-flags.ts</code> 
          or use environment variables in production.
        </p>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {flagEntries.map(([flag, enabled]) => (
          <div 
            key={flag}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-center justify-between"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{flag}</h3>
              <p className="text-slate-400 text-sm">{FLAG_DESCRIPTIONS[flag]}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusIndicator enabled={enabled} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusIndicator({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      <span className={`text-sm font-bold uppercase ${enabled ? 'text-emerald-500' : 'text-slate-500'}`}>
        {enabled ? 'ENABLED' : 'DISABLED'}
      </span>
    </div>
  )
}
