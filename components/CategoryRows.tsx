import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cpu, Bitcoin, TrendingUp, BarChart3 } from 'lucide-react'

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

interface CategoryRowsProps {
  articles: Article[]
  lang: string
}

const categoryConfig = {
  AI: {
    icon: Cpu,
    color: 'purple',
    gradient: 'from-purple-600 to-pink-600',
    title: 'AI_INTELLIGENCE',
    subtitle: 'Neural network analysis • Model predictions • Tech sector signals'
  },
  CRYPTO: {
    icon: Bitcoin,
    color: 'orange',
    gradient: 'from-orange-600 to-yellow-600',
    title: 'CRYPTO_SIGNALS',
    subtitle: 'On-chain metrics • Whale tracking • DeFi intelligence'
  },
  MACRO: {
    icon: TrendingUp,
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    title: 'MACRO_WAR_ROOM',
    subtitle: 'Central bank moves • Geopolitical analysis • Economic warfare'
  }
}

export default function CategoryRows({ articles, lang }: CategoryRowsProps) {
  const categories = ['AI', 'CRYPTO', 'MACRO'] as const

  const getArticlesByCategory = (category: string) => {
    return articles.filter(a => a.category === category).slice(0, 4)
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 space-y-12 md:space-y-16">
      {categories.map((category) => {
        const categoryArticles = getArticlesByCategory(category)
        if (categoryArticles.length === 0) return null

        const config = categoryConfig[category]
        const Icon = config.icon

        return (
          <div key={category} className="space-y-6 md:space-y-8">
            {/* Category header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 md:gap-8">
                <div className={`p-3 bg-gradient-to-br ${config.gradient} rounded-2xl shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight text-white">
                    {config.title}
                  </h2>
                  <p className="text-sm text-white/60 tracking-tight leading-tight mt-1">
                    {config.subtitle}
                  </p>
                </div>
              </div>
              <Link
                href={`/${lang}/category/${category.toLowerCase()}`}
                className="flex items-center gap-2 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl transition-all group"
              >
                <span className="text-xs font-bold text-white/60 group-hover:text-white uppercase tracking-wider">
                  View All
                </span>
                <ArrowRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {/* Articles grid - 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {categoryArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${lang}/news/${article.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all mb-4">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${config.gradient} opacity-20`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Confidence badge */}
                    <div className="absolute top-4 right-4">
                      <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                        <span className="text-[10px] font-bold text-emerald-500">
                          {article.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Impact indicator */}
                    <div className="absolute top-4 left-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-4 rounded-full ${
                              i < Math.floor(article.impact / 2)
                                ? `bg-${config.color}-500`
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight leading-tight text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-white/50 tracking-tight leading-tight line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-sm text-white/60">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-sm text-white/60">
                        Impact: {article.impact}/10
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
