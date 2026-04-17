import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

// OG image: public Unsplash (static CDN, guaranteed available)
const OG_IMAGE = 'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&h=630&fit=crop'

const categorySeo: Record<string, { title: string; desc: string; keywords: string[] }> = {
  en: {
    title: 'AI Intelligence | Artificial Intelligence Market Analysis & Signals',
    desc: 'Cutting-edge artificial intelligence market signals, AI stock tracking, LLM industry analysis and tech sector intelligence. Updated in real-time.',
    keywords: ['AI market analysis', 'artificial intelligence stocks', 'LLM industry', 'nvidia AI', 'AI signals', 'tech intelligence', 'machine learning investment', 'ChatGPT stocks', 'OpenAI analysis', 'Gemini AI', 'AI ETF', 'semiconductor stocks']
  },
  tr: {
    title: 'Yapay Zeka İstihbaratı | AI Piyasa Analizi ve Sinyalleri',
    desc: 'Gerçek zamanlı yapay zeka piyasa sinyalleri, AI hisse takibi, LLM endüstri analizi ve teknoloji sektörü istihbaratı.',
    keywords: ['yapay zeka analizi', 'AI hisseleri', 'LLM endüstrisi', 'teknoloji istihbaratı', 'nvidia analizi', 'yapay zeka yatırımı', 'makine öğrenmesi', 'ChatGPT borsa', 'OpenAI hisse']
  },
  de: {
    title: 'KI-Intelligenz | Künstliche Intelligenz Marktanalyse & Signale',
    desc: 'Echtzeit-KI-Marktsignale, KI-Aktientracking und Technologiesektor-Intelligenz für institutionelle Investoren.',
    keywords: ['KI Marktanalyse', 'künstliche Intelligenz Aktien', 'LLM Industrie', 'Tech Intelligenz', 'Nvidia KI', 'KI Investition', 'maschinelles Lernen', 'OpenAI Analyse', 'KI ETF']
  },
  fr: {
    title: "Intelligence IA | Analyse du Marché de l'Intelligence Artificielle",
    desc: "Signaux de marché IA en temps réel, suivi des actions IA et analyse sectorielle technologique institutionnelle.",
    keywords: ["analyse IA", "actions IA", "industrie LLM", "intelligence tech", "Nvidia IA", "investissement IA", "apprentissage automatique", "OpenAI analyse"]
  },
  es: {
    title: 'Inteligencia IA | Análisis del Mercado de Inteligencia Artificial',
    desc: 'Señales de mercado de IA en tiempo real, seguimiento de acciones de IA y análisis institucional del sector tecnológico.',
    keywords: ['análisis IA', 'acciones inteligencia artificial', 'industria LLM', 'inteligencia tech', 'Nvidia IA', 'inversión IA', 'aprendizaje automático', 'análisis OpenAI']
  },
  ru: {
    title: 'ИИ-Аналитика | Анализ Рынка Искусственного Интеллекта',
    desc: 'Рыночные сигналы ИИ в реальном времени, отслеживание акций ИИ и институциональная аналитика технологического сектора.',
    keywords: ['анализ ИИ', 'акции искусственного интеллекта', 'индустрия LLM', 'Nvidia ИИ', 'инвестиции в ИИ', 'анализ OpenAI', 'ETF искусственного интеллекта']
  },
  ar: {
    title: 'استخبارات الذكاء الاصطناعي | تحليل سوق الذكاء الاصطناعي',
    desc: 'إشارات سوق الذكاء الاصطناعي في الوقت الفعلي وتتبع الأسهم للمستثمرين المؤسسيين.',
    keywords: ['تحليل الذكاء الاصطناعي', 'أسهم الذكاء الاصطناعي', 'صناعة LLM', 'Nvidia الذكاء الاصطناعي', 'استثمار الذكاء الاصطناعي', 'تحليل OpenAI']
  },
  jp: {
    title: 'AIインテリジェンス | 人工知能市場分析・シグナル',
    desc: '機関投資家向けのリアルタイムAI市場シグナル、AI株式追跡、LLM産業分析。',
    keywords: ['AI市場分析', '人工知能株', 'LLM産業', 'テック情報', 'Nvidia AI', 'AI投資', '機械学習', 'OpenAI分析', 'AI ETF']
  },
  zh: {
    title: 'AI情报 | 人工智能市场分析与信号',
    desc: '面向机构投资者的实时人工智能市场信号、AI股票追踪和科技行业情报。',
    keywords: ['AI市场分析', '人工智能股票', 'LLM行业', '科技情报', 'Nvidia AI', 'AI投资', '机器学习', 'OpenAI分析', 'AI ETF']
  },
}

export async function generateMetadata({ params }: { params: { lang?: string } }): Promise<Metadata> {
  const lang = params?.lang || 'en'
  const t = categorySeo[lang] || categorySeo.en
  const currentUrl = `${baseUrl}/${lang}/ai`

  return {
    title: t.title,
    description: t.desc,
    keywords: t.keywords,
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': `${baseUrl}/en/ai`,
        en: `${baseUrl}/en/ai`, tr: `${baseUrl}/tr/ai`,
        de: `${baseUrl}/de/ai`, fr: `${baseUrl}/fr/ai`,
        es: `${baseUrl}/es/ai`, ru: `${baseUrl}/ru/ai`,
        ar: `${baseUrl}/ar/ai`, ja: `${baseUrl}/jp/ai`,
        zh: `${baseUrl}/zh/ai`,
      },
    },
    openGraph: {
      title: t.title,
      description: t.desc,
      url: currentUrl,
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

export default function AiLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  const lang = params?.lang || 'en'
  const t = categorySeo[lang] || categorySeo.en
  const pageUrl = `${baseUrl}/${lang}/ai`
  const langT = categorySeo[lang] || categorySeo.en

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
      name: 'Artificial Intelligence',
      sameAs: [
        'https://www.wikidata.org/wiki/Q11660',
        'https://en.wikipedia.org/wiki/Artificial_intelligence',
        'https://openai.com',
        'https://deepmind.google',
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
      { '@type': 'ListItem', position: 2, name: langT.title.split('|')[0].trim(), item: pageUrl },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionPage, breadcrumb]) }} />
      {children}
    </>
  )
}
