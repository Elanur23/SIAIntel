/**
 * Distribution Settings & Feature Flags Page
 */

import { Suspense } from 'react'
import FeatureFlagsPanel from '@/components/distribution/FeatureFlagsPanel'
import Link from 'next/link'

export const metadata = {
  title: 'Distribution Settings - SIA Intelligence',
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            DISTRIBUTION_SETTINGS
          </h1>
          <p className="text-slate-400 text-sm">
            Feature flags and system configuration
          </p>
        </div>
        
        <Suspense fallback={<SettingsSkeleton />}>
          <FeatureFlagsPanel />
        </Suspense>
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}
