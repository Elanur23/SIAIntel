import Link from 'next/link'
import { WifiOff, ShieldAlert, ArrowLeft } from 'lucide-react'

export default function NewsArticleNotFound() {
  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl">
            <WifiOff size={64} className="text-blue-500 mx-auto" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Article Not Found
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            INTELLIGENCE REPORT UNAVAILABLE
          </p>
          <div className="h-px w-24 bg-blue-500/30 mx-auto" />
          <p className="text-slate-400 text-sm leading-relaxed italic">
            The intelligence report you are looking for is unavailable or no longer published.
          </p>
        </div>

        <div className="pt-8">
          <Link
            href="/en/news"
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to News
          </Link>
        </div>

        <div className="pt-12 flex justify-center gap-4 text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={12} /> ARTICLE_NOT_FOUND
          </span>
          <span>//</span>
          <span>SIA_PROTOCOL_v4.0</span>
        </div>
      </div>
    </div>
  )
}
