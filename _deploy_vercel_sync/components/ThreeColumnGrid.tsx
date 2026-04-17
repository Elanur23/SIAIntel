import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Zap } from 'lucide-react'
import { SignalTerminal } from './SignalTerminal'

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

interface ThreeColumnGridProps {
  articles: Article[]
  lang: string
}

export default function ThreeColumnGrid({ articles, lang }: ThreeColumnGridProps) {
  const trendingArticles = articles.slice(0, 5) // Top 5 for trending
  const mostReadArticles = articles.slice(5, 10) // Next 5 for most read
  const featuredMain = articles[0]
  const featuredSecondary = articles.slice(1, 3)

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Trending Now + Most Read */}
        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          {/* TRENDING NOW - 5 small cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={20} className="text-yellow-500" />
              <h2 className="text-sm font-semibold tracking-tight leading-tight text-white/60">
                TRENDING NOW
              </h2>
            </div>
            
            <div className="space-y-3">
              {trendingArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/${lang}/news/${article.slug}`}
                  className="block group"
                >
                  <div className="relative rounded-xl overflow-hidden border border-white/10 hover:border-yellow-500/30 transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                    <div className="flex gap-2 p-2">
                      {/* Number badge */}
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
                        <span className="text-xs font-black text-white">
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">
                            {article.category}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-500">
                            {article.confidence}%
                          </span>
                        </div>
                        <h3 className="text-xs font-bold tracking-tight leading-tight text-white/90 group-hover:text-white line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* MOST READ - 5 list items */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={20} className="text-blue-500" />
              <h2 className="text-sm font-semibold tracking-tight leading-tight text-white/60">
                MOST READ
              </h2>
            </div>
            
            <div className="space-y-2">
              {mostReadArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/${lang}/news/${article.slug}`}
                  className="block group"
                >
                  <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/[0.02] transition-all">
                    {/* Number */}
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                      <span className="text-base font-black text-white/20 group-hover:text-blue-500 transition-colors">
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium tracking-tight leading-tight text-white/70 group-hover:text-white line-clamp-2 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-white/40 uppercase tracking-wider">
                          {article.category}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                        <span className="text-[9px] text-white/40">
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Featured Deep Analysis (1 large + 2 small) */}
        <div className="lg:col-span-6 space-y-6 md:space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap size={20} className="text-yellow-500" />
            <h2 className="text-sm font-semibold tracking-tight leading-tight text-white/60">
              DEEP ANALYSIS
            </h2>
          </div>

          {/* Large featured card */}
          {featuredMain && (
            <Link
              href={`/${lang}/news/${featuredMain.slug}`}
              className="block group"
            >
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all mb-6">
                {featuredMain.image ? (
                  <Image
                    src={featuredMain.image}
                    alt={featuredMain.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-950/50 to-purple-950/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {featuredMain.category}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-500">
                        {featuredMain.confidence}%
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight leading-tight text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {featuredMain.title}
                  </h3>
                  <p className="text-sm text-white/70 tracking-tight leading-tight line-clamp-2">
                    {featuredMain.summary}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Two smaller featured cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {featuredSecondary.map((article) => (
              <Link
                key={article.id}
                href={`/${lang}/news/${article.slug}`}
                className="block group"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all mb-4">
                  {article.image ? (
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-950/50 to-pink-950/50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-600/80 rounded text-[9px] font-black uppercase tracking-wider">
                        {article.category}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500">
                        {article.confidence}%
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-tight leading-tight text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Intelligence Panel (enhanced) */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={20} className="text-emerald-500" />
            <h2 className="text-sm font-semibold tracking-tight leading-tight text-white/60">
              INTEL PANEL
            </h2>
          </div>
          <SignalTerminal />
        </div>

      </div>
    </section>
  )
}
