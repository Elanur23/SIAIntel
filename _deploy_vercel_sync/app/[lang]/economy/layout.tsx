import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
const OG_IMAGE = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&h=630&fit=crop'

const categorySeo: Record<string, { title: string; desc: string; keywords: string[] }> = {
  en: {
    title: 'Global Economy Intelligence | Macro Analysis & Central Banks',
    desc: 'Deep macro-economic analysis, central bank policy tracking (Fed, ECB, BoJ), global fiscal intelligence and interest rate signals for institutional investors.',
    keywords: ['macro economy', 'central banks', 'global fiscal intelligence', 'economic trends', 'interest rates', 'Federal Reserve', 'ECB', 'inflation analysis', 'GDP signals', 'sovereign bonds', 'monetary policy', 'macroeconomic analysis']
  },
  tr: {
    title: 'Küresel Ekonomi İstihbaratı | Makro Analiz ve Merkez Bankaları',
    desc: 'Kurumsal yatırımcılar için derin makro-ekonomik analiz, merkez bankası politikası takibi ve küresel mali istihbarat.',
    keywords: ['makro ekonomi', 'merkez bankaları', 'küresel mali istihbarat', 'ekonomik trendler', 'faiz oranları', 'Fed', 'ECB', 'enflasyon analizi', 'GSYİH sinyalleri', 'egemen tahviller', 'para politikası']
  },
  de: {
    title: 'Weltwirtschafts-Intelligenz | Makroanalyse & Zentralbanken',
    desc: 'Tiefe makroökonomische Analyse, Verfolgung der Zentralbankpolitik und globale Fiskalintelligenz.',
    keywords: ['Weltwirtschaft', 'Makroanalyse', 'Zentralbanken', 'Wirtschaftstrends', 'Zinssätze', 'Federal Reserve', 'EZB', 'Inflationsanalyse', 'BIP Signale', 'Geldpolitik', 'Staatsanleihen']
  },
  fr: {
    title: 'Intelligence Économique Mondiale | Analyse Macro & Banques Centrales',
    desc: 'Analyse macroéconomique approfondie, suivi des politiques des banques centrales et intelligence fiscale mondiale.',
    keywords: ['économie mondiale', 'analyse macro', 'banques centrales', 'tendances économiques', 'taux d\'intérêt', 'Fed', 'BCE', 'analyse inflation', 'signaux PIB', 'politique monétaire', 'obligations souveraines']
  },
  es: {
    title: 'Inteligencia Económica Global | Análisis Macro y Bancos Centrales',
    desc: 'Análisis macroeconómico profundo, seguimiento de políticas de bancos centrales e inteligencia fiscal global.',
    keywords: ['economía global', 'análisis macro', 'bancos centrales', 'tendencias económicas', 'tasas de interés', 'Fed', 'BCE', 'análisis inflación', 'señales PIB', 'política monetaria', 'bonos soberanos']
  },
  ru: {
    title: 'Мировая Экономическая Аналитика | Макроанализ и Центральные Банки',
    desc: 'Глубокий макроэкономический анализ, отслеживание политики центральных банков и глобальная фискальная аналитика.',
    keywords: ['мировая экономика', 'макроанализ', 'центральные банки', 'экономические тренды', 'процентные ставки', 'ФРС', 'ЕЦБ', 'анализ инфляции', 'сигналы ВВП', 'денежно-кредитная политика']
  },
  ar: {
    title: 'استخبارات الاقتصاد العالمي | التحليل الكلي والبنوك المركزية',
    desc: 'تحليل اقتصادي كلي عميق وتتبع سياسات البنوك المركزية والاستخبارات المالية العالمية.',
    keywords: ['الاقتصاد العالمي', 'التحليل الكلي', 'البنوك المركزية', 'الاتجاهات الاقتصادية', 'أسعار الفائدة', 'الاحتياطي الفيدرالي', 'البنك المركزي الأوروبي', 'تحليل التضخم', 'إشارات الناتج المحلي الإجمالي']
  },
  jp: {
    title: '世界経済インテリジェンス | マクロ分析と中央銀行政策',
    desc: '機関投資家向けの深いマクロ経済分析、中央銀行政策追跡（Fed・ECB・日銀）、グローバル財政情報。',
    keywords: ['世界経済', 'マクロ分析', '中央銀行', '経済トレンド', '金利', '連邦準備制度', 'ECB', 'インフレ分析', 'GDP シグナル', '金融政策', '国債']
  },
  zh: {
    title: '全球经济情报 | 宏观分析与央行政策',
    desc: '针对机构投资者的深度宏观经济分析、央行政策追踪（美联储、欧央行、日央行）和全球财政情报。',
    keywords: ['全球经济', '宏观分析', '央行政策', '经济趋势', '利率', '美联储', '欧洲央行', '通胀分析', 'GDP信号', '货币政策', '主权债券', '宏观经济分析']
  },
}

export async function generateMetadata({ params }: { params: { lang?: string } }): Promise<Metadata> {
  const lang = params?.lang || 'en'
  const t = categorySeo[lang] || categorySeo.en
  const currentUrl = `${baseUrl}/${lang}/economy`

  return {
    title: t.title,
    description: t.desc,
    keywords: t.keywords,
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': `${baseUrl}/en/economy`,
        en: `${baseUrl}/en/economy`, tr: `${baseUrl}/tr/economy`,
        de: `${baseUrl}/de/economy`, fr: `${baseUrl}/fr/economy`,
        es: `${baseUrl}/es/economy`, ru: `${baseUrl}/ru/economy`,
        ar: `${baseUrl}/ar/economy`, ja: `${baseUrl}/jp/economy`,
        zh: `${baseUrl}/zh/economy`,
      },
    },
    openGraph: {
      title: t.title, description: t.desc, url: currentUrl,
      siteName: 'SIA Intelligence', type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.title }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.desc, images: [OG_IMAGE] },
    robots: { index: true, follow: true },
  }
}

export default function EconomyLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  const lang = params?.lang || 'en'
  const t = categorySeo[lang] || categorySeo.en
  const pageUrl = `${baseUrl}/${lang}/economy`

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
      name: 'Macroeconomics',
      sameAs: [
        'https://www.wikidata.org/wiki/Q159810',
        'https://en.wikipedia.org/wiki/Macroeconomics',
        'https://www.imf.org',
        'https://www.worldbank.org',
      ],
    },
    publisher: { '@id': `${baseUrl}/#organization` },
    inLanguage: lang,
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
      { '@type': 'ListItem', position: 1, name: 'SIA Intelligence', item: `${baseUrl}/${lang}` },
      { '@type': 'ListItem', position: 2, name: t.title.split('|')[0].trim(), item: pageUrl },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionPage, breadcrumb]) }} />
      {children}
    </>
  )
}
