import Link from 'next/link'
import Image from 'next/image'
import { Brain, TrendingUp, Shield, Zap } from 'lucide-react'
import DataSyncTime from '@/components/DataSyncTime'

interface Article {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  image?: string
  confidence: number
  publishedAt: string
  impact: number
}

interface SiaDeepIntelProps {
  articles: Article[]
  lang: string
}

export default function SiaDeepIntel({ articles, lang }: SiaDeepIntelProps) {
  // Select deep analysis articles (highest impact + confidence)
  const deepAnalysisArticles = articles
    .filter(a => a.impact >= 7 && a.confidence >= 85)
    .slice(0, 3)

  if (deepAnalysisArticles.length === 0) {
    return null
  }

  const mainArticle = deepAnalysisArticles[0]
  const secondaryArticles = deepAnalysisArticles.slice(1, 3)

  return (
    <section className="border-y border-white/5 bg-gradient-to-b from-blue-950/10 via-purple-950/5 to-transparent relative overflow-hidden terminal-grid">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Section Header with Signal */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
                <Brain size={32} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
                SIA Deep Intel
              </h2>
              <p className="text-sm text-white/60 tracking-tight leading-tight mt-2">
                Proprietary analysis • High-confidence signals • Institutional-grade
              </p>
            </div>
          </div>
          
          {/* Signal Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl backdrop-blur-sm hover:bg-emerald-500/20 transition-all group cursor-pointer hover-lift">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-soft-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold font-mono-data">Live Analysis</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/80 font-bold font-mono-data">3 High-Priority Signals</div>
                  <DataSyncTime className="text-emerald-500/60" label="" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Featured Article - Premium Bloomberg/Apple Style */}
        <Link
          href={`/${lang}/news/${mainArticle.slug}`}
          className="block group mb-8"
        >
          <div className="relative rounded-[2rem] overflow-hidden border border-white/10 hover:border-blue-500/20 transition-all duration-500 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Image Section - 60% */}
              <div className="lg:col-span-3 relative aspect-[16/10] lg:aspect-auto lg:min-h-[480px]">
                {mainArticle.image ? (
                  <Image
                    src={mainArticle.image}
                    alt={mainArticle.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                    <Brain size={64} className="text-blue-500/30" />
                  </div>
                )}
                {/* Smooth gradient overlay - not harsh black */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#020203]/60 lg:to-[#020203]/90" />
                
                {/* Compact badge on image */}
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1.5 bg-blue-600/90 backdrop-blur-md rounded-lg shadow-lg">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      {mainArticle.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Section - 40% */}
              <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center">
                <div className="space-y-5 max-w-md">
                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-[1.2] text-white group-hover:text-blue-400 transition-colors">
                    {mainArticle.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-base text-white/60 tracking-tight leading-relaxed line-clamp-3">
                    {mainArticle.summary}
                  </p>

                  {/* Metrics - Below headline */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover-lift">
                      <Shield size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-500 font-mono-data">
                        {mainArticle.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg hover-lift">
                      <Zap size={14} className="text-red-500" />
                      <span className="text-xs font-bold text-red-500 font-mono-data">
                        {mainArticle.impact}/10
                      </span>
                    </div>
                  </div>

                  {/* CTA - Directly under content */}
                  <div className="flex items-center gap-4 pt-3">
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all group/btn shadow-lg shadow-blue-600/20 hover-lift">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Read Analysis
                      </span>
                      <TrendingUp size={16} className="text-white group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-xs text-white/40 font-medium font-mono-data">
                      {new Date(mainArticle.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
            </div>
          </div>
        </Link>

        {/* Two Secondary Articles - Side by Side */}
        {secondaryArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {secondaryArticles.map((article) => (
              <Link
                key={article.id}
                href={`/${lang}/news/${article.slug}`}
                className="block group"
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all duration-500 bg-gradient-to-br from-purple-950/10 to-blue-950/10 backdrop-blur-sm h-full">
                  {/* Image */}
                  <div className="relative aspect-[16/9]">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                        <Brain size={48} className="text-purple-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <div className="px-3 py-1 bg-purple-600/90 backdrop-blur-xl rounded-lg">
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-xl rounded-lg border border-emerald-500/30">
                        <span className="text-[9px] font-bold text-emerald-500 font-mono-data">
                          {article.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-bold tracking-tight leading-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-xs text-white/60 tracking-tight leading-tight line-clamp-2">
                      {article.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-500 font-mono-data">
                          Impact: {article.impact}/10
                        </span>
                      </div>
                      <div className="text-[9px] text-white/40 font-mono-data">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
