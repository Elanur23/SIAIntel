import type { Metadata } from 'next'
import {
  buildLanguageAlternates,
  HREFLANG_BY_ROUTE_LOCALE,
  normalizePublicRouteLocale,
  toOpenGraphLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
const OG_IMAGE =
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&h=630&fit=crop'

const categorySeo: Record<string, { title: string; desc: string; keywords: string[] }> = {
  en: {
    title: 'Stock Market Intelligence | Nasdaq, S&P500 & Equities Analysis',
    desc: 'Institutional-grade stock market signals, equity flow analysis, dark pool data and Wall Street intelligence. Nasdaq, S&P500, NYSE real-time signals.',
    keywords: [
      'stock market analysis',
      'nasdaq intelligence',
      'S&P500 signals',
      'equity flow',
      'dark pool data',
      'wall street intelligence',
      'institutional trading',
      'NYSE analysis',
      'equity analysis',
      'stock signals',
      'market intelligence',
      'stock market today',
    ],
  },
  tr: {
    title: 'Borsa İstihbaratı | Nasdaq, S&P500 ve Hisse Senedi Analizi',
    desc: 'Kurumsal düzeyde borsa sinyalleri, hisse senedi akış analizi, dark pool verileri ve Wall Street istihbaratı.',
    keywords: [
      'borsa analizi',
      'nasdaq istihbarat',
      'S&P500 sinyalleri',
      'hisse senedi analizi',
      'dark pool verileri',
      'Wall Street',
      'kurumsal işlemler',
      'NYSE analizi',
      'hisse sinyalleri',
      'borsa bugün',
    ],
  },
  de: {
    title: 'Aktienmarkt-Intelligenz | Nasdaq, S&P500 & Aktienanalyse',
    desc: 'Institutionelle Aktienmarktsignale, Aktienflussanalyse und Wall-Street-Intelligenz in Echtzeit.',
    keywords: [
      'Aktienmarkt Analyse',
      'Nasdaq Intelligenz',
      'S&P500 Signale',
      'Aktienfluss',
      'Dark-Pool-Daten',
      'Wall Street',
      'institutioneller Handel',
      'NYSE Analyse',
      'Aktiensignale',
      'Marktintelligenz',
    ],
  },
  fr: {
    title: 'Intelligence Boursière | Nasdaq, S&P500 & Analyse Actions',
    desc: "Signaux boursiers institutionnels, analyse des flux d'actions et intelligence Wall Street en temps réel.",
    keywords: [
      'analyse boursière',
      'intelligence Nasdaq',
      'signaux S&P500',
      'trading institutionnel',
      'données dark pool',
      'Wall Street',
      'NYSE analyse',
      'signaux actions',
      "bourse aujourd'hui",
    ],
  },
  es: {
    title: 'Inteligencia Bursátil | Nasdaq, S&P500 & Análisis de Acciones',
    desc: 'Señales bursátiles institucionales, análisis de flujo de acciones e inteligencia de Wall Street en tiempo real.',
    keywords: [
      'análisis bursátil',
      'inteligencia Nasdaq',
      'señales S&P500',
      'trading institucional',
      'datos dark pool',
      'Wall Street',
      'análisis NYSE',
      'señales acciones',
      'bolsa hoy',
    ],
  },
  ru: {
    title: 'Аналитика Фондового Рынка | Nasdaq, S&P500 и Акции',
    desc: 'Институциональные сигналы фондового рынка, анализ потока акций и аналитика Уолл-стрит в реальном времени.',
    keywords: [
      'анализ акций',
      'Nasdaq аналитика',
      'S&P500 сигналы',
      'институциональная торговля',
      'данные dark pool',
      'Уолл-стрит',
      'NYSE анализ',
      'фондовый рынок сегодня',
    ],
  },
  ar: {
    title: 'استخبارات سوق الأسهم | ناسداك وS&P500 وتحليل الأسهم',
    desc: 'إشارات سوق الأسهم المؤسسية وتحليل تدفق الأسهم واستخبارات وول ستريت في الوقت الفعلي.',
    keywords: [
      'تحليل الأسهم',
      'استخبارات ناسداك',
      'إشارات S&P500',
      'تداول مؤسسي',
      'بيانات dark pool',
      'وول ستريت',
      'تحليل NYSE',
      'إشارات الأسهم',
    ],
  },
  jp: {
    title: '株式市場インテリジェンス | ナスダック・S&P500・株式分析',
    desc: '機関投資家向けの株式市場シグナル、株式フロー分析、ダークプールデータ、ウォール街インテリジェンス。',
    keywords: [
      '株式市場分析',
      'ナスダックインテリジェンス',
      'S&P500シグナル',
      '機関投資家取引',
      'ダークプールデータ',
      'ウォール街',
      'NYSE分析',
      '株式シグナル',
      '株式市場今日',
    ],
  },
  zh: {
    title: '股市情报 | 纳斯达克、标普500和股票分析',
    desc: '面向机构的股市信号、股票流分析、暗池数据和华尔街情报。实时纳斯达克、标普500信号。',
    keywords: [
      '股市分析',
      '纳斯达克情报',
      '标普500信号',
      '机构交易',
      '暗池数据',
      '华尔街',
      'NYSE分析',
      '股票信号',
      '股市今日',
      '权益分析',
    ],
  },
}

export async function generateMetadata({
  params,
}: {
  params: { lang?: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const t = categorySeo[lang] || categorySeo.en
  const currentUrl = `${baseUrl}/${routeLang}/stocks`

  return {
    title: t.title,
    description: t.desc,
    keywords: t.keywords,
    alternates: {
      canonical: currentUrl,
      languages: buildLanguageAlternates('/stocks', { baseUrl }),
    },
    openGraph: {
      title: t.title,
      description: t.desc,
      url: currentUrl,
      locale: toOpenGraphLocale(routeLang),
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.desc,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  }
}

export default function StocksLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const t = categorySeo[lang] || categorySeo.en
  const pageUrl = `${baseUrl}/${routeLang}/stocks`

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl,
    name: t.title,
    description: t.desc,
    url: pageUrl,
    dateModified: new Date().toISOString(),
    about: {
      '@type': 'Thing',
      name: 'Stock Market',
      sameAs: [
        'https://www.wikidata.org/wiki/Q35883',
        'https://en.wikipedia.org/wiki/Stock_market',
        'https://www.nasdaq.com',
        'https://www.nyse.com',
      ],
    },
    publisher: { '@id': `${baseUrl}/#organization` },
    inLanguage: HREFLANG_BY_ROUTE_LOCALE[routeLang],
    image: { '@type': 'ImageObject', url: OG_IMAGE, width: 1200, height: 630 },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/en/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'SIA Intelligence',
        item: `${baseUrl}/${routeLang}`,
      },
      { '@type': 'ListItem', position: 2, name: t.title.split('|')[0].trim(), item: pageUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionPage, breadcrumb]) }}
      />
      {children}
    </>
  )
}
