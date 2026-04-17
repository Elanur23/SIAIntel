/**
 * SIA Distribution OS - Admin Dashboard
 * Phase 2: Admin UI Foundation
 * Phase 4C: Added error boundary protection
 */

import { Suspense } from 'react'
import DistributionDashboard from '@/components/distribution/DistributionDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Distribution OS - SIA Intelligence',
  description: 'Multilingual financial news distribution system'
}

export default function DistributionPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            DISTRIBUTION_OS
          </h1>
          <p className="text-slate-400 text-sm">
            Multilingual Financial News Distribution System
          </p>
        </div>
        
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <DistributionDashboard />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
