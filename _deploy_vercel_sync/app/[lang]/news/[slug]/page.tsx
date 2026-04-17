/**
 * SIA DYNAMIC NEWS ARTICLE - V10.0 (FULL SUITE: DEBRIEFING + SOCIAL DISTRIBUTION)
 * FEATURES: DEBRIEFING SYSTEM | REPORT EXPORT | SOCIAL SHARE SUITE | E-E-A-T | 9-LANG SEO | DISCOVER OPTIMIZED
 */
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/warroom/database'
import Link from 'next/link'
import { Clock, Zap, AlertTriangle, ShieldCheck, ChevronRight, User, Radio, Share2, Download, Terminal } from 'lucide-react'
import GroundingVerificationBadge from '@/components/GroundingVerificationBadge'
import TechnicalChart from '@/components/TechnicalChart'
import RelatedIntelligenceNodes from '@/components/RelatedIntelligenceNodes'
import IntelligenceDebriefing from '@/components/IntelligenceDebriefing'
import SocialShareSuite from '@/components/SocialShareSuite'
import LegalStamp from '@/components/LegalStamp'
import dynamic from 'next/dynamic'
import { formatArticleBody } from '@/lib/content/article-formatter'
import { Locale } from '@/lib/i18n/dictionaries'
import Image from 'next/image'
import SiaSchemaInjector from '@/components/SiaSchemaInjector'

const SiaRadarVisual = dynamic(() => import('@/components/SiaRadarVisual'), { ssr: false })
import { ARTICLE_LANGUAGE_LOCALES, getLocalizedArticleValue, normalizeArticleLanguage } from '@/lib/warroom/article-localization'

function getCategoryPageSlug(rawCategory?: string): string {
  const category = (rawCategory || '').trim().toUpperCase()
  if (!category) return 'intelligence'
  if (category === 'AI') return 'ai'
  if (category.startsWith('CRYPTO')) return 'crypto'
  if (category === 'STOCKS' || category.includes('STOCK') || category === 'MARKET') return 'stocks'
  if (category === 'ECONOMY' || category.includes('ECONOMY')) return 'economy'
  return category.toLowerCase()
}

interface ArticlePageProps {
  params: { lang: string; slug: string }
}

function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const noOfWords = (text || '').split(/\s+/g).length;
  return Math.ceil(noOfWords / wordsPerMinute);
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const articleId = params.slug.split('--').pop() || params.slug
  const article = await prisma.warRoomArticle.findUnique({ where: { id: articleId } })
  if (!article) return { title: 'Intelligence Not Found' }

  const lang = normalizeArticleLanguage(params.lang)
  const title = getLocalizedArticleValue(article, 'title', lang) || 'SIA Intelligence Report'
  const description = getLocalizedArticleValue(article, 'summary', lang) || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const articleUrl = `${baseUrl}/${params.lang}/news/${params.slug}`
  const imageUrl = article.imageUrl || `${baseUrl}/og-image.png`

  return {
    title: `${title} | SIA Intelligence`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: articleUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      url: articleUrl,
      title,
      description,
      siteName: 'SIA Intelligence',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.authorName || 'SIA Intelligence'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: '@SIAIntel',
      creator: '@SIAIntel',
    },
  }
}

import PdfExportButton from '@/components/PdfExportButton'
import { getDictionary } from '@/lib/i18n/dictionaries'
import LiveAnalystTrigger from '@/components/LiveAnalystTrigger'
import SiaAdUnit from '@/components/SiaAdUnit'
import RevenueMaximizer from '@/components/RevenueMaximizer'

export default async function ArticlePage({ params }: ArticlePageProps) {
  const articleId = params.slug.split('--').pop() || params.slug
  const article = await prisma.warRoomArticle.findUnique({ where: { id: articleId } })
  if (!article) notFound()

  const lang = normalizeArticleLanguage(params.lang)
  const dict = getDictionary(lang as any)
  const locale = ARTICLE_LANGUAGE_LOCALES[lang]

  const ui = dict.article

  const content = {
    title: getLocalizedArticleValue(article, 'title', lang) || 'Untitled Report',
    summary: getLocalizedArticleValue(article, 'summary', lang) || '',
    insight: getLocalizedArticleValue(article, 'siaInsight', lang) || '',
    risk: getLocalizedArticleValue(article, 'riskShield', lang) || '',
    body: getLocalizedArticleValue(article, 'content', lang) || '',
    category: article.category || 'MARKET',
    author: article.authorName || 'SIA Intelligence Unit',
    role: article.authorRole || 'Senior Analyst',
    time: new Date(article.publishedAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }),
    isoDate: article.publishedAt.toISOString(),
    image: article.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200',
    confidence: article.confidence || 94,
    impact: article.marketImpact || 5
  }

  const readTime = calculateReadTime(content.body);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const articleUrl = `${baseUrl}/${params.lang}/news/${params.slug}`

  // 🚀 ENHANCED GOOGLE DISCOVER & NEWS SCHEMA
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["NewsArticle", "AnalysisNewsArticle"],
    "headline": content.title,
    "description": content.summary,
    "image": {
      "@type": "ImageObject",
      "url": content.image,
      "width": 1200,
      "height": 630
    },
    "datePublished": content.isoDate,
    "dateModified": content.isoDate,
    "author": [{
      "@type": "Person",
      "name": content.author,
      "jobTitle": content.role,
      "url": `${baseUrl}/${params.lang}/experts/${content.author.toLowerCase().replace(/\s+/g, '-')}`,
      "knowsAbout": [content.category, "Financial Markets"]
    }],
    "publisher": {
      "@type": "Organization",
      "name": "SIA Intelligence Protocol",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 600,
        "height": 60
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "isAccessibleForFree": true,
    "articleSection": content.category
  }

  // BreadcrumbList schema for Google Discover & rich results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/${params.lang}` },
      { "@type": "ListItem", "position": 2, "name": content.category, "item": `${baseUrl}/${params.lang}/${getCategoryPageSlug(content.category)}` },
      { "@type": "ListItem", "position": 3, "name": content.title, "item": articleUrl }
    ]
  }

  const relatedRaw = await prisma.warRoomArticle.findMany({
    where: { category: content.category, id: { not: article.id }, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })
  const relatedNodes = relatedRaw.map(r => ({
    id: r.id, slug: r.id, title: getLocalizedArticleValue(r as any, 'title', lang) || 'Untitled',
    summary: getLocalizedArticleValue(r as any, 'summary', lang) || '',
    category: r.category || 'MARKET', sentiment: r.sentiment || 'NEUTRAL',
    publishedAt: r.publishedAt.toISOString(), imageUrl: r.imageUrl || '',
    relevanceScore: 0.8, matchReasons: ['same-category'],
  }))

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <SiaSchemaInjector schema={structuredData as any} breadcrumb={breadcrumbSchema} />

      <main className="relative z-10">

        {/* --- 🚀 REFINED MEDIUM-SCALE ARTICLE HEADER --- */}
        <section className="container mx-auto px-4 lg:px-12 py-12">
          <div className="glass-panel machined-edge p-8 md:p-16 rounded-[2.5rem] relative overflow-hidden group shadow-[0_0_80px_rgba(0,0,0,0.5)]">
            {/* Background Decor - LCP optimized */}
            <div className="absolute inset-0 z-0 aspect-[16/9]">
              <Image
                src={content.image}
                alt={content.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                fetchPriority="high"
                className="object-cover opacity-20 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#020203] via-[#020203]/80 to-transparent" />
            </div>

            <div className="relative z-10 space-y-8">
              <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                <Link href={`/${params.lang}`} className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <Terminal size={12} /> {ui.terminal}
                </Link>
                <ChevronRight size={10} />
                <Link href={`/${params.lang}/${getCategoryPageSlug(content.category)}`} className="hover:text-blue-500 transition-colors">{content.category}</Link>
              </nav>

              <div className="max-w-5xl space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em]">
                    INTEL_REPORT_#{article.id.slice(0, 8).toUpperCase()}
                  </span>
                  <GroundingVerificationBadge confidence={content.confidence} sources={["SIA_Scanner", "Market_Pulse"]} />
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] uppercase italic tracking-tighter text-dynamic-glow">
                  {content.title}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* --- 💎 MAIN ARTICLE BODY --- */}
            <article className="lg:col-span-8 space-y-16">

              <div className="flex items-center justify-between border-b border-white/5 pb-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20"><User size={28} /></div>
                  <div>
                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{content.role}</span>
                    <span className="text-xl font-black text-white uppercase italic">{content.author}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{ui.readTime}</span>
                  <div className="flex items-center gap-2 text-base font-black text-white italic">
                    <Clock size={18} className="text-blue-500" />
                    {readTime} {ui.minRead}
                  </div>
                </div>
              </div>

              <div className="relative p-10 bg-white/[0.03] backdrop-blur-md border-l-4 border-l-blue-600 rounded-r-[2.5rem] shadow-2xl">
                <p className="text-2xl md:text-3xl text-slate-300 font-light leading-relaxed italic">
                  &quot;{content.summary}&quot;
                </p>
              </div>

              <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-black">
                <SiaRadarVisual category={content.category} confidence={content.confidence} sentiment={article.sentiment ?? undefined} className="w-full h-full" />
              </div>

              <div className="sia-formatted-content prose prose-invert prose-2xl max-w-none text-slate-300 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: formatArticleBody(content.body, lang) }}
              />

              <RevenueMaximizer category={content.category} lang={params.lang} />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-6 pt-12 border-t border-white/5">
                <PdfExportButton
                  articleId={article.id}
                  title={content.title}
                  content={content.body}
                  author={content.author}
                  lang={params.lang}
                />
                <SocialShareSuite url={articleUrl} title={content.title} lang={params.lang} />
              </div>

              {/* 🎙️ LIVE AI DEBRIEFING SYSTEM */}
              <section className="pt-20">
                <IntelligenceDebriefing
                  articleId={article.id}
                  lang={params.lang}
                />
              </section>
            </article>

            {/* --- 🛡️ SIDEBAR INTELLIGENCE --- */}
            <aside className="lg:col-span-4 space-y-12 sticky top-32">
              <SiaAdUnit slotType="SIDEBAR" />

              {/* Sovereign Insight Card */}
              <div className="p-8 glass-panel machined-edge rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Zap size={80} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-3 text-blue-400">
                  <Zap size={20} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sovereign_Insight</span>
                </div>
                <p className="text-lg text-white font-medium leading-relaxed italic border-l-2 border-blue-600/30 pl-6">
                  {content.insight}
                </p>
              </div>

              {/* Risk Shield Node */}
              <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Risk_Shield_Node</span>
                </div>
                <p className="text-base text-slate-400 leading-relaxed font-light">
                  {content.risk}
                </p>
              </div>

              <RelatedIntelligenceNodes nodes={relatedNodes} lang={params.lang} />

              <LiveAnalystTrigger />
            </aside>
          </div>
        </div>
      </main>

      <LegalStamp lang={params.lang} />
    </div>
  )
}
