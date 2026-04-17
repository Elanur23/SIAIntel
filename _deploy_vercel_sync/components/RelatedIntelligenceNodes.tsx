/**
 * SIA RELATED INTELLIGENCE NODES - V1.0
 * 
 * "İlgili İstihbarat Düğümleri" — Semantik otomatik iç linkleme bileşeni.
 * Her haber sayfasının altında gösterilir.
 * 
 * Google botları bu linkleri takip eder → Otorite Ağı oluşur.
 */

import Link from 'next/link'
import { Zap, ArrowRight, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RelatedNode {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  sentiment: string
  publishedAt: string
  imageUrl: string
  relevanceScore: number
  matchReasons: string[]
}

interface Props {
  nodes: RelatedNode[]
  lang: string
  title?: string
}

const SENTIMENT_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  BULLISH: { icon: TrendingUp, color: 'text-emerald-400', label: '▲' },
  BEARISH: { icon: TrendingDown, color: 'text-rose-400', label: '▼' },
  NEUTRAL: { icon: Minus, color: 'text-amber-400', label: '—' },
}

const CATEGORY_COLORS: Record<string, string> = {
  CRYPTO: 'bg-orange-600',
  STOCKS: 'bg-blue-600',
  ECONOMY: 'bg-emerald-600',
  AI: 'bg-purple-600',
  COMMODITIES: 'bg-amber-600',
  GENERAL: 'bg-slate-600',
}

export default function RelatedIntelligenceNodes({ nodes, lang, title }: Props) {
  if (!nodes || nodes.length === 0) return null

  const isTr = lang === 'tr'
  const sectionTitle = title || (isTr ? 'İlgili İstihbarat Düğümleri' : 'Related Intelligence Nodes')

  return (
    <section className="mt-16 pt-12 border-t border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-600/20 rounded-xl">
          <Brain size={20} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-[0.15em]">
            {sectionTitle}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            {isTr ? 'Semantik olarak bağlantılı istihbarat raporları' : 'Semantically linked intelligence reports'}
            {' · '}{nodes.length} {isTr ? 'düğüm' : 'nodes'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Zap size={12} className="text-blue-400" />
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Auto-Linked</span>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const sentimentCfg = SENTIMENT_CONFIG[node.sentiment] || SENTIMENT_CONFIG.NEUTRAL
          const categoryColor = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.GENERAL
          const articleUrl = `/${lang}/news/${node.slug}`

          return (
            <Link
              key={node.id}
              href={articleUrl}
              className="group block bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
            >
              {/* Image */}
              {node.imageUrl && (
                <div className="h-32 overflow-hidden relative">
                  <img
                    src={node.imageUrl}
                    alt={node.title}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`${categoryColor} text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider`}>
                      {node.category}
                    </span>
                    <span className={`text-[9px] font-black ${sentimentCfg.color}`}>
                      {sentimentCfg.label}
                    </span>
                  </div>
                  {/* Relevance score badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/70 backdrop-blur text-[8px] font-black text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                      {node.relevanceScore}% match
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-black text-white leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                  {node.title}
                </h3>

                {node.summary && (
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {node.summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-wrap gap-1">
                    {node.matchReasons.slice(0, 2).map((reason) => (
                      <span key={reason} className="text-[8px] font-bold text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <ArrowRight size={12} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Schema: relatedLink for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': sectionTitle,
            'numberOfItems': nodes.length,
            'itemListElement': nodes.map((node, index) => ({
              '@type': 'ListItem',
              'position': index + 1,
              'url': `https://siaintel.com/${lang}/news/${node.slug}`,
              'name': node.title,
            })),
          }),
        }}
      />
    </section>
  )
}
