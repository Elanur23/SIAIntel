import Link from 'next/link'
import { Shield, Terminal, ArrowRight } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 mb-4">
            <Shield className="w-10 h-10 text-[#FFB800]" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            SIA<span className="text-[#FFB800]">INTEL</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-mono">
            Sovereign Intelligence Architecture
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 text-center">
          <p className="text-slate-300 text-sm leading-relaxed">
            Command center for intelligence operations. Access War Room for content deployment,
            workspace synchronization, and multilingual publishing control.
          </p>
        </div>

        {/* Primary Action */}
        <div className="space-y-4">
          <Link
            href="/admin/warroom"
            className="group flex items-center justify-between w-full bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-black uppercase text-sm px-6 py-4 rounded-lg transition-all shadow-lg shadow-[#FFB800]/20"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5" />
              <span>Enter War Room</span>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-black text-white mb-1">9</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Languages</div>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-black text-emerald-400 mb-1">●</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">System Active</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-500 font-mono">
            Authenticated session active • All operations logged
          </p>
        </div>
      </div>
    </div>
  )
}
