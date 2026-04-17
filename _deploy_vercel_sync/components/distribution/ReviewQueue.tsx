/**
 * Review Queue Component
 * Editorial review workflow UI
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDistributionRecords } from '@/lib/distribution/database'
import type { DistributionRecord } from '@/lib/distribution/types'

export default function ReviewQueue() {
  const [records, setRecords] = useState<DistributionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQueue() {
      const data = await getDistributionRecords({ status: 'review', limit: 20 })
      setRecords(data)
      setLoading(false)
    }
    loadQueue()
  }, [])

  if (loading) {
    return <div className="text-slate-400">Loading review queue...</div>
  }

  if (records.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
        <p className="text-slate-400 mb-2">Review queue is empty</p>
        <p className="text-slate-500 text-sm">
          Records awaiting review will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-500 font-bold">
          {records.length} record{records.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      <div className="space-y-4">
        {records.map(record => (
          <div key={record.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{record.sourceTitle}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                  {record.sourceContent.substring(0, 200)}...
                </p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Mode:</span>{' '}
                    <span className="text-white font-bold uppercase">{record.mode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Trust:</span>{' '}
                    <span className="text-emerald-500 font-bold">{record.trustScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Compliance:</span>{' '}
                    <span className="text-blue-500 font-bold">{record.complianceScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <Link 
                href={`/admin/distribution/records/${record.id}`}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                Review
              </Link>
              <button className="px-6 py-2 bg-emerald-500/20 text-emerald-500 rounded-lg font-bold hover:bg-emerald-500/30 transition-colors">
                Approve
              </button>
              <button className="px-6 py-2 bg-red-500/20 text-red-500 rounded-lg font-bold hover:bg-red-500/30 transition-colors">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
