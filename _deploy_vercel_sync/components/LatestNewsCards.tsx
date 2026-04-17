import { getCachedArticles } from '@/lib/warroom/database'
import { getArticleFieldKey } from '@/lib/warroom/article-localization'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n/dictionaries'

const SiaRadarVisual = dynamic(() => import('@/components/SiaRadarVisual'), { ssr: false })

interface LatestNewsCardsProps {
  lang: string
  rawLang: string
}

export default async function LatestNewsCards({ lang, rawLang }: LatestNewsCardsProps) {
  const allArticles = await getCachedArticles('published')
  const titleKey = getArticleFieldKey('title', String(lang))
  const summaryKey = getArticleFieldKey('summary', String(lang))

  const formattedArticles = (allArticles as any[]).map(a => ({
    id: String(a.id),
    slug: buildArticleSlug(String(a.id), String(a[titleKey] || a.titleEn || a.titleTr || a.id)),
    title: String(a[titleKey] || a.titleEn || a.titleTr || 'Intelligence Report'),
    summary: String(a[summaryKey] || a.summaryEn || a.summaryTr || ''),
    category: a.category || 'GENERAL',
    image: a.imageUrl,
    confidence: a.confidence || 90,
    publishedAt: a.publishedAt,
    impact: a.marketImpact || 5
  }))

  const latest = formattedArticles.slice(1, 7)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {latest.map((news) => (
        <Link key={news.id} href={`/${rawLang}/news/${news.slug}`}>
          <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[4rem] overflow-hidden hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:scale-[1.02] transition-all duration-300 flex flex-col h-full shadow-2xl">
            {/* Image area - aspect-video (16:9) for CLS: 0 */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {news.image ? (
                <Image
                  src={news.image}
                  alt={news.title || ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <SiaRadarVisual category={news.category} confidence={news.confidence} compact className="w-full h-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent" />
              <div className="absolute top-10 left-10">
                <span className="px-5 py-2 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
                  {news.category}
                </span>
              </div>
            </div>
            <div className="p-12 flex-1 flex flex-col space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={16} className="text-blue-500" />
                  {new Date(news.publishedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={16} />
                  {news.confidence}% CONF
                </div>
              </div>
              <h3 className="text-3xl font-black text-white leading-[1.1] uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors flex-1">
                {news.title}
              </h3>
              <p className="text-lg text-slate-400 font-light line-clamp-3 italic border-l-2 border-white/10 pl-8 leading-relaxed">
                {news.summary}
              </p>
              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Impact: {news.impact}/10</span>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
