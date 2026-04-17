/**
 * Distribution Records List Component
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDistributionRecords } from '@/lib/distribution/database'
import type { DistributionRecord } from '@/lib/distribution/types'

export default function RecordsList() {
  const [records, setRecords] = useState<DistributionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecords() {
      const data = await getDistributionRecords({ limit: 50 })
      setRecords(data)
      setLoading(false)
    }
    loadRecords()
  }, [])

  if (loading) {
    return <div className="text-slate-400">Loading records...</div>
  }

  if (records.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
        <p className="text-slate-400 mb-4">No distribution records found</p>
        <p className="text-slate-500 text-sm">
          Records will appear here once content is generated
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map(record => (
        <Link key={record.id} href={`/admin/distribution/records/${record.id}`}>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{record.sourceTitle}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {record.sourceContent.substring(0, 200)}...
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">Mode:</span>{' '}
                <span className="text-white font-bold uppercase">{record.mode}</span>
              </div>
              <div>
                <span className="text-slate-500">Language:</span>{' '}
                <span className="text-white font-bold uppercase">{record.sourceLanguage}</span>
              </div>
              <div>
                <span className="text-slate-500">Trust:</span>{' '}
                <span className="text-emerald-500 font-bold">{record.trustScore}%</span>
              </div>
              <div>
                <span className="text-slate-500">Created:</span>{' '}
                <span className="text-white">{new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
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
