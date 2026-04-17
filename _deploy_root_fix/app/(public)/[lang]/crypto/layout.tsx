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
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&h=630&fit=crop'

const categorySeo: Record<string, { title: string; desc: string; keywords: string[] }> = {
  en: {
    title: 'Crypto Intelligence | Bitcoin, Ethereum & DeFi Analysis',
    desc: 'Real-time cryptocurrency intelligence, whale tracking, DeFi analysis and on-chain blockchain signals for institutional investors. Bitcoin, Ethereum, altcoins.',
    keywords: [
      'bitcoin analysis',
      'crypto intelligence',
      'ethereum signals',
      'DeFi tracking',
      'whale alert',
      'blockchain data',
      'crypto institutional',
      'altcoin analysis',
      'on-chain data',
      'crypto market',
      'BTC signals',
      'ETH analysis',
    ],
  },
  tr: {
    title: 'Kripto İstihbaratı | Bitcoin, Ethereum & DeFi Analizi',
    desc: 'Kurumsal yatırımcılar için gerçek zamanlı kripto istihbaratı, balina takibi, DeFi analizi ve on-chain blockchain sinyalleri.',
    keywords: [
      'bitcoin analizi',
      'kripto istihbarat',
      'ethereum sinyalleri',
      'DeFi takibi',
      'balina alarmı',
      'blockchain verisi',
      'altcoin analizi',
      'on-chain veri',
      'kripto piyasası',
      'BTC sinyalleri',
    ],
  },
  de: {
    title: 'Krypto-Intelligenz | Bitcoin, Ethereum & DeFi-Analyse',
    desc: 'Echtzeit-Kryptowährungsintelligenz, Wal-Tracking und On-Chain-Blockchain-Signale für institutionelle Investoren.',
    keywords: [
      'Bitcoin Analyse',
      'Krypto Intelligenz',
      'Ethereum Signale',
      'DeFi Tracking',
      'Wal Alert',
      'Blockchain Daten',
      'Altcoin Analyse',
      'On-Chain Daten',
      'Krypto Markt',
      'BTC Signale',
    ],
  },
  fr: {
    title: 'Intelligence Crypto | Analyse Bitcoin, Ethereum & DeFi',
    desc: 'Intelligence crypto en temps réel, suivi des baleines et signaux on-chain pour investisseurs institutionnels.',
    keywords: [
      'analyse bitcoin',
      'intelligence crypto',
      'signaux ethereum',
      'DeFi suivi',
      'alerte baleine',
      'données blockchain',
      'analyse altcoin',
      'données on-chain',
      'marché crypto',
      'signaux BTC',
    ],
  },
  es: {
    title: 'Inteligencia Crypto | Análisis Bitcoin, Ethereum & DeFi',
    desc: 'Inteligencia de criptomonedas en tiempo real, seguimiento de ballenas y señales on-chain para inversores institucionales.',
    keywords: [
      'análisis bitcoin',
      'inteligencia cripto',
      'señales ethereum',
      'DeFi seguimiento',
      'alerta ballena',
      'datos blockchain',
      'análisis altcoin',
      'datos on-chain',
      'mercado cripto',
      'señales BTC',
    ],
  },
  ru: {
    title: 'Крипто-Аналитика | Биткоин, Эфириум и DeFi',
    desc: 'Аналитика криптовалют в реальном времени, отслеживание китов и on-chain сигналы для институциональных инвесторов.',
    keywords: [
      'анализ биткоина',
      'крипто аналитика',
      'сигналы ethereum',
      'DeFi отслеживание',
      'Whale Alert',
      'данные блокчейна',
      'анализ альткоинов',
      'on-chain данные',
      'рынок криптовалют',
    ],
  },
  ar: {
    title: 'استخبارات التشفير | تحليل البيتكوين وإيثريوم وDeFi',
    desc: 'استخبارات العملات المشفرة في الوقت الفعلي وتتبع الحيتان وإشارات on-chain للمستثمرين المؤسسيين.',
    keywords: [
      'تحليل البيتكوين',
      'استخبارات التشفير',
      'إشارات إيثريوم',
      'تتبع DeFi',
      'تنبيه الحيتان',
      'بيانات blockchain',
      'تحليل العملات البديلة',
      'بيانات on-chain',
    ],
  },
  jp: {
    title: '暗号資産インテリジェンス | ビットコイン・イーサリアム・DeFi分析',
    desc: '機関投資家向けのリアルタイム暗号資産インテリジェンス、クジラ追跡、on-chainシグナル。',
    keywords: [
      'ビットコイン分析',
      '暗号資産インテリジェンス',
      'イーサリアムシグナル',
      'DeFi追跡',
      'クジラアラート',
      'ブロックチェーンデータ',
      'アルトコイン分析',
      'オンチェーンデータ',
    ],
  },
  zh: {
    title: '加密货币情报 | 比特币、以太坊和DeFi分析',
    desc: '面向机构投资者的实时加密货币情报、鲸鱼追踪、DeFi分析和链上信号。',
    keywords: [
      '比特币分析',
      '加密货币情报',
      '以太坊信号',
      'DeFi追踪',
      '鲸鱼预警',
      '区块链数据',
      '山寨币分析',
      '链上数据',
      '加密货币市场',
      'BTC信号',
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
  const currentUrl = `${baseUrl}/${routeLang}/crypto`

  return {
    title: t.title,
    description: t.desc,
    keywords: t.keywords,
    alternates: {
      canonical: currentUrl,
      languages: buildLanguageAlternates('/crypto', { baseUrl }),
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

export default function CryptoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const t = categorySeo[lang] || categorySeo.en
  const pageUrl = `${baseUrl}/${routeLang}/crypto`

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
      name: 'Cryptocurrency',
      sameAs: [
        'https://www.wikidata.org/wiki/Q13479982',
        'https://en.wikipedia.org/wiki/Cryptocurrency',
        'https://www.coindesk.com',
        'https://coinmarketcap.com',
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
