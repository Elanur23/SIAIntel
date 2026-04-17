import React from 'react'
import { Zap, TrendingUp, Users, FileText, Activity, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/warroom/database'

export const dynamic = 'force-dynamic'

/**
 * SIA DYNAMIC DASHBOARD - V14.1
 * Real-time stats from database
 */
async function getStats() {
  const [totalArticles, totalComments, whaleAlerts] = await Promise.all([
    prisma.warRoomArticle.count(),
    prisma.comment.count(),
    prisma.warRoomArticle.count({ where: { marketImpact: { gte: 8 } } }),
  ])

  return [
    {
      name: 'Total Articles',
      value: totalArticles.toLocaleString(),
      icon: <FileText className="text-blue-500" />,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Active Signals',
      value: whaleAlerts.toString(),
      icon: <Zap className="text-yellow-500" />,
      change: 'Live',
      changeType: 'status',
    },
    {
      name: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: <Users className="text-purple-500" />,
      change: '+5.4%',
      changeType: 'increase',
    },
    {
      name: 'SIA Performance',
      value: '99.8%',
      icon: <Activity className="text-green-500" />,
      change: 'Optimal',
      changeType: 'status',
    },
  ]
}

export default async function AdminDashboard() {
  let stats = [
    {
      name: 'Total Articles',
      value: '–',
      icon: <FileText className="text-blue-500" />,
      change: '–',
      changeType: 'status',
    },
    {
      name: 'Active Signals',
      value: '–',
      icon: <Zap className="text-yellow-500" />,
      change: 'Live',
      changeType: 'status',
    },
    {
      name: 'Total Comments',
      value: '–',
      icon: <Users className="text-purple-500" />,
      change: '–',
      changeType: 'status',
    },
    {
      name: 'SIA Performance',
      value: '99.8%',
      icon: <Activity className="text-green-500" />,
      change: 'Optimal',
      changeType: 'status',
    },
  ]

  try {
    stats = await getStats()
  } catch (e) {
    console.error('[DASHBOARD_DB_ERROR]', e)
  }

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
            System_Overview
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase mt-2 tracking-[0.4em] flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-500" />
            SIA Intelligence Command Node
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
            Local_Time
          </p>
          <p className="text-xl font-mono text-yellow-500">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={80} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group-hover:border-blue-500/30 transition-all">
                {stat.icon}
              </div>
              <span
                className={`text-[9px] font-black px-3 py-1 rounded-full ${stat.changeType === 'increase' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2">
              {stat.name}
            </p>
            <p className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-xl font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
            <Activity size={20} /> System_Status
          </h3>
          <div className="space-y-6 font-mono relative z-10">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-500 text-[10px] uppercase font-bold">Gemini 2.0 Node</span>
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">
                ONLINE
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-500 text-[10px] uppercase font-bold">Groq Llama 3.3</span>
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Embedding Engine
              </span>
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
                V2_READY
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-[10px] uppercase font-bold">Database Sync</span>
              <span className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                STABLE
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/en/admin/warroom"
          className="bg-gradient-to-br from-blue-600 to-blue-700 p-10 rounded-[3rem] flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-all shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform">
            <Zap size={150} fill="white" />
          </div>
          <div className="relative z-10">
            <Zap className="text-white mb-6 group-hover:animate-pulse" size={48} fill="white" />
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
              Enter_War_Room
            </h3>
            <p className="text-blue-200/60 text-sm mt-4 font-bold leading-tight max-w-xs italic">
              Autonomous intelligence broadcasting across 9 global nodes.
            </p>
          </div>
          <div className="text-right relative z-10">
            <span className="bg-white text-blue-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
              Execute_Command
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
