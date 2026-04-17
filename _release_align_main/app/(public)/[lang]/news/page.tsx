import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, ArrowRight, ChevronRight, Clock3, Newspaper } from 'lucide-react'
import { getCachedArticles } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { getLocalizedArticleValue } from '@/lib/warroom/article-localization'
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
const NEWS_PAGE_DESCRIPTION =
  'Latest verified intelligence reports from SIA analysts, including market impact, confidence scoring, and category-level monitoring.'

interface NewsCard {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  publishedAt: string
  imageUrl?: string | null
  confidence: number
}

function formatPublishedDate(routeLang: string, publishedAt: string): string {
  const localeTag = routeLang === 'pt-br' ? 'pt-BR' : routeLang
  return new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(publishedAt))
}

async function getNewsCards(contentLang: string, limit = 24): Promise<NewsCard[]> {
  const rawArticles = await getCachedArticles('published')

  return rawArticles.slice(0, limit).map((article) => {
    const localizedTitle =
      getLocalizedArticleValue(article as Record<string, unknown>, 'title', contentLang) ||
      article.titleEn ||
      article.titleTr ||
      article.id

    return {
      id: article.id,
      slug: buildArticleSlug(article.id, localizedTitle),
      title: localizedTitle,
      summary:
        getLocalizedArticleValue(article as Record<string, unknown>, 'summary', contentLang) ||
        article.summaryEn ||
        article.summaryTr ||
        'No summary available yet.',
      category: article.category || 'MARKET',
      publishedAt: article.publishedAt.toISOString(),
      imageUrl: article.imageUrl,
      confidence: article.confidence || 90,
    }
  })
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const dictLocale = toDictionaryLocale(routeLang) as Locale
  const dict = getDictionary(dictLocale)
  const publishedCount = (await getCachedArticles('published')).length
  const pageUrl = `${BASE_URL}/${routeLang}/news`

  return {
    title: `${dict.nav.news} | SIA Intelligence`,
    description: NEWS_PAGE_DESCRIPTION,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: pageUrl,
      languages: buildLanguageAlternates('/news', { baseUrl: BASE_URL }),
    },
    robots: {
      index: publishedCount > 0,
      follow: true,
      googleBot: {
        index: publishedCount > 0,
        follow: true,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: toOpenGraphLocale(routeLang),
      url: pageUrl,
      siteName: 'SIA Intelligence',
      title: `${dict.nav.news} | SIA Intelligence`,
      description: NEWS_PAGE_DESCRIPTION,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'SIA Intelligence news index',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dict.nav.news} | SIA Intelligence`,
      description: NEWS_PAGE_DESCRIPTION,
      images: [`${BASE_URL}/og-image.png`],
      site: '@SIAIntel',
      creator: '@SIAIntel',
    },
  }
}

export default async function NewsIndexPage({ params }: { params: { lang: string } }) {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const dictLocale = toDictionaryLocale(routeLang) as Locale
  const dict = getDictionary(dictLocale)
  const articles = await getNewsCards(String(dictLocale), 30)
  const pageUrl = `${BASE_URL}/${routeLang}/news`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/${routeLang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: dict.nav.news,
        item: pageUrl,
      },
    ],
  }

  const itemListSchema =
    articles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          numberOfItems: articles.length,
          itemListElement: articles.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${BASE_URL}/${routeLang}/news/${article.slug}`,
            name: article.title,
          })),
        }
      : null

  const schemas = itemListSchema ? [breadcrumbSchema, itemListSchema] : [breadcrumbSchema]

  return (
    <div className="relative text-white selection:bg-blue-600">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      <main className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">
        <nav className="mb-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          <Link href={`/${routeLang}`} className="transition-colors hover:text-blue-400">
            {dict.nav.home}
          </Link>
          <ChevronRight size={10} />
          <span className="text-white/60">{dict.nav.news}</span>
        </nav>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
          <span className="text-white/20">Trust:</span>
          <Link
            href={`/${routeLang}/editorial-policy`}
            className="transition-colors hover:text-blue-400"
          >
            Editorial Policy
          </Link>
          <span className="text-white/20">/</span>
          <Link
            href={`/${routeLang}/ai-transparency`}
            className="transition-colors hover:text-blue-400"
          >
            AI Transparency
          </Link>
          <span className="text-white/20">/</span>
          <Link href={`/${routeLang}/contact`} className="transition-colors hover:text-blue-400">
            Contact Editorial
          </Link>
        </div>

        <section className="mb-14 rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 md:p-12">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-600/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
            <Newspaper size={14} />
            SIGNAL_DIRECTORY
          </div>
          <h1 className="mb-4 text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
            {dict.home.latest.title}
          </h1>
          <p className="max-w-3xl border-l-2 border-blue-600/50 pl-6 text-lg text-slate-400">
            {NEWS_PAGE_DESCRIPTION}
          </p>
        </section>

        {articles.length === 0 ? (
          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-12 text-center">
            <Activity className="mx-auto mb-4 h-10 w-10 text-white/30" />
            <h2 className="mb-3 text-xl font-black uppercase tracking-[0.2em] text-white/80">
              No published news reports yet
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-sm text-slate-400">
              This index is available and crawlable, but it remains noindex until at least one
              published report exists.
            </p>
            <Link
              href={`/${routeLang}/intelligence`}
              className="inline-flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-blue-600/20 px-6 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300 transition-colors hover:bg-blue-600/30"
            >
              View Intelligence Hub
              <ArrowRight size={14} />
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${routeLang}/news/${article.slug}`}
                className="group overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.02] transition-all hover:border-blue-500/40 hover:bg-white/[0.03]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={`${article.title} intelligence report cover`}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/20 to-transparent">
                      <Activity className="h-12 w-12 text-blue-500/30" aria-hidden />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-blue-500/30 bg-black/60 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">
                    {article.category}
                  </div>
                </div>

                <div className="flex h-full flex-col p-7">
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    <Clock3 size={14} className="text-blue-400" />
                    <time dateTime={article.publishedAt}>
                      {formatPublishedDate(routeLang, article.publishedAt)}
                    </time>
                    <span className="text-white/20">/</span>
                    <span>{article.confidence}% CONF</span>
                  </div>

                  <h2 className="mb-3 line-clamp-2 text-2xl font-black uppercase italic tracking-tight text-white transition-colors group-hover:text-blue-400">
                    {article.title}
                  </h2>
                  <p className="mb-6 line-clamp-3 border-l-2 border-white/10 pl-4 text-sm text-slate-400">
                    {article.summary}
                  </p>

                  <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                    {dict.common.readFullArticle}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
