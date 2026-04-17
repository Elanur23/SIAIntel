'use client'

/**
 * SIA DISTRIBUTION OS - JOB CARD
 * Phase 1: Display card for distribution jobs
 */

import { Calendar, Globe2, Zap } from 'lucide-react'
import { formatRelativeTime } from '@/lib/distribution/utils/formatters'
import { JOB_STATUS_LABELS } from '@/lib/distribution/core/constants'
import type { DistributionJob } from '@/lib/distribution/core/types'

interface DistributionJobCardProps {
  job: DistributionJob
  onClick?: () => void
}

export default function DistributionJobCard({ job, onClick }: DistributionJobCardProps) {
  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-blue-500" />
          <span className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            Job #{job.id.slice(0, 8)}
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statusColors[job.status]}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Globe2 size={16} />
          <span>{job.platforms.length} platforms • {job.languages.length} languages</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar size={16} />
          <span>{formatRelativeTime(job.createdAt)}</span>
        </div>
        {job.scheduledAt && (
          <div className="text-sm text-blue-400">
            Scheduled: {formatRelativeTime(job.scheduledAt)}
          </div>
        )}
      </div>
    </div>
  )
}
