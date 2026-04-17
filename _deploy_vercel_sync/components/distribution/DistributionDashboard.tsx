/**
 * Distribution Dashboard Component
 * Phase 2: Admin UI Foundation
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDistributionStats } from '@/lib/distribution/database'
import { getAllFeatureFlags } from '@/lib/distribution/feature-flags'
import type { WorkflowStatus } from '@/lib/distribution/types'

export default function DistributionDashboard() {
  const [stats, setStats] = useState<{
    total: number
    byStatus: Record<WorkflowStatus, number>
    byMode: Record<'breaking' | 'editorial', number>
  } | null>(null)
  
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadData() {
      const statsData = await getDistributionStats()
      const flagsData = getAllFeatureFlags()
      setStats(statsData)
      setFlags(flagsData)
    }
    loadData()
  }, [])

  const enabledFlagsCount = Object.values(flags).filter(Boolean).length

  return (
    <div className="space-y-8">
      {/* System Status */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-4">SYSTEM_STATUS</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Total Records</p>
            <p className="text-3xl font-black">{stats?.total || 0}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Active Flags</p>
            <p className="text-3xl font-black text-blue-500">{enabledFlagsCount}/10</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Status</p>
            <p className="text-lg font-black text-emerald-500">OPERATIONAL</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="Draft" value={stats.byStatus.draft} color="slate" />
          <StatCard label="Review" value={stats.byStatus.review} color="yellow" />
          <StatCard label="Scheduled" value={stats.byStatus.scheduled} color="blue" />
          <StatCard label="Published" value={stats.byStatus.published} color="emerald" />
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <NavCard 
          href="/admin/distribution/records" 
          title="Records" 
          description="View all distribution records"
        />
        <NavCard 
          href="/admin/distribution/review" 
          title="Review Queue" 
          description="Editorial review workflow"
        />
        <NavCard 
          href="/admin/distribution/glossary" 
          title="Glossary" 
          description="Terminology management"
        />
        <NavCard 
          href="/admin/distribution/settings" 
          title="Settings" 
          description="Feature flags & config"
        />
      </div>

      {/* Warning if no flags enabled */}
      {enabledFlagsCount === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <p className="text-yellow-500 font-bold mb-2">⚠️ Distribution System Disabled</p>
          <p className="text-slate-400 text-sm">
            All feature flags are currently disabled. Enable flags in{' '}
            <Link href="/admin/distribution/settings" className="text-blue-500 hover:underline">
              Settings
            </Link>{' '}
            to activate distribution features.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    slate: 'text-slate-400',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    emerald: 'text-emerald-500'
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-4xl font-black ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </p>
    </div>
  )
}

function NavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href}>
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 transition-all cursor-pointer group">
        <h3 className="text-lg font-black uppercase mb-2 group-hover:text-blue-500 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </Link>
  )
}
