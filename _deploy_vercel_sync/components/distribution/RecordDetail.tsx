/**
 * Distribution Record Detail Component
 */

'use client'

import { useEffect, useState } from 'react'
import { getDistributionRecord } from '@/lib/distribution/database'
import type { DistributionRecord } from '@/lib/distribution/types'
import LocalizedContentPreview from './LocalizedContentPreview'
import PlatformVariantsPreview from './PlatformVariantsPreview'

interface RecordDetailProps {
  recordId: string
}

export default function RecordDetail({ recordId }: RecordDetailProps) {
  const [record, setRecord] = useState<DistributionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecord() {
      const data = await getDistributionRecord(recordId)
      setRecord(data)
      setLoading(false)
    }
    loadRecord()
  }, [recordId])

  if (loading) {
    return <div className="text-slate-400">Loading record...</div>
  }

  if (!record) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <p className="text-red-500 font-bold">Record not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black mb-2">{record.sourceTitle}</h2>
            <p className="text-slate-400">{record.sourceContent}</p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-white/10">
          <MetricCard label="Mode" value={record.mode.toUpperCase()} />
          <MetricCard label="Source Language" value={record.sourceLanguage.toUpperCase()} />
          <MetricCard label="Trust Score" value={`${record.trustScore}%`} color="emerald" />
          <MetricCard label="Compliance" value={`${record.complianceScore}%`} color="blue" />
        </div>
      </div>

      {/* Localized Content */}
      <div>
        <h3 className="text-xl font-black uppercase mb-4">LOCALIZED_CONTENT</h3>
        <LocalizedContentPreview localizedContent={record.localizedContent} />
      </div>

      {/* Platform Variants */}
      <div>
        <h3 className="text-xl font-black uppercase mb-4">PLATFORM_VARIANTS</h3>
        <PlatformVariantsPreview platformVariants={record.platformVariants} />
      </div>

      {/* Metadata */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">METADATA</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Created:</span>{' '}
            <span className="text-white">{new Date(record.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500">Updated:</span>{' '}
            <span className="text-white">{new Date(record.updatedAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500">Created By:</span>{' '}
            <span className="text-white">{record.createdBy}</span>
          </div>
          {record.scheduledAt && (
            <div>
              <span className="text-slate-500">Scheduled:</span>{' '}
              <span className="text-white">{new Date(record.scheduledAt).toLocaleString()}</span>
            </div>
          )}
          {record.publishedAt && (
            <div>
              <span className="text-slate-500">Published:</span>{' '}
              <span className="text-white">{new Date(record.publishedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    review: 'bg-yellow-500/20 text-yellow-500',
    approved: 'bg-blue-500/20 text-blue-500',
    scheduled: 'bg-purple-500/20 text-purple-500',
    publishing: 'bg-orange-500/20 text-orange-500',
    published: 'bg-emerald-500/20 text-emerald-500',
    failed: 'bg-red-500/20 text-red-500',
    cancelled: 'bg-gray-500/20 text-gray-500'
  }

  return (
    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${statusColors[status as keyof typeof statusColors]}`}>
      {status}
    </span>
  )
}

function MetricCard({ label, value, color = 'white' }: { label: string; value: string; color?: string }) {
  const colorClasses = {
    white: 'text-white',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500'
  }

  return (
    <div>
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className={`text-lg font-black ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </p>
    </div>
  )
}
