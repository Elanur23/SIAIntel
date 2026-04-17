/**
 * SIA KNOWLEDGE GRAPH SCHEMA V1.0
 * 
 * Google'a şunu deriz:
 * "Bizim sitemiz rastgele haberlerden oluşmuyor; biz bir finansal bilgi tabanıyız."
 * 
 * Üretilen şemalar:
 * 1. DataCatalog — Site genelinde "Finansal İstihbarat Kataloğu"
 * 2. Organization — SIAintel as a NewsMediaOrganization
 * 3. Dataset — Her kategori bir veri kümesi node'u
 * 4. ItemList — Trending/son haberler listesi
 * 5. WebSite — SearchAction + sameAs bağlantıları
 * 6. BreadcrumbList — Navigasyon şeması
 * 
 * Bu şema site genelinde <head> içine enjekte edilir.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface KnowledgeGraphConfig {
  baseUrl: string
  siteName: string
  description: string
  logoUrl: string
  lang: string
}

export interface ArticleSummaryForGraph {
  id: string
  slug: string
  title: string
  category: string
  publishedAt: string
  url: string
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: KnowledgeGraphConfig = {
  baseUrl: 'https://siaintel.com',
  siteName: 'SIA Intelligence',
  description: 'AI-Powered Autonomous Financial Intelligence Platform — Real-time market analysis, institutional-grade risk assessment, and sovereign economic insights.',
  logoUrl: 'https://siaintel.com/logo.png',
  lang: 'en',
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY DATASETS
// ═══════════════════════════════════════════════════════════════

const INTELLIGENCE_DOMAINS = [
  {
    id: 'crypto-intelligence',
    name: 'Cryptocurrency Intelligence',
    nameTr: 'Kripto Para İstihbaratı',
    description: 'Real-time cryptocurrency market analysis, on-chain metrics, DeFi protocols, and digital asset intelligence.',
    keywords: ['Bitcoin', 'Ethereum', 'DeFi', 'Blockchain', 'Crypto Markets', 'On-Chain Analytics'],
    category: 'CRYPTO',
  },
  {
    id: 'equity-intelligence',
    name: 'Equity & Stock Market Intelligence',
    nameTr: 'Hisse Senedi Piyasa İstihbaratı',
    description: 'Global equity market analysis, earnings intelligence, sector rotation, and institutional flow tracking.',
    keywords: ['S&P 500', 'Nasdaq', 'BIST', 'Earnings', 'Tech Stocks', 'Market Structure'],
    category: 'STOCKS',
  },
  {
    id: 'macro-intelligence',
    name: 'Macroeconomic Intelligence',
    nameTr: 'Makroekonomik İstihbarat',
    description: 'Central bank policy analysis, inflation tracking, GDP forecasting, and monetary policy intelligence.',
    keywords: ['Federal Reserve', 'ECB', 'TCMB', 'Interest Rates', 'Inflation', 'GDP'],
    category: 'ECONOMY',
  },
  {
    id: 'ai-tech-intelligence',
    name: 'AI & Technology Intelligence',
    nameTr: 'Yapay Zeka & Teknoloji İstihbaratı',
    description: 'Artificial intelligence developments, semiconductor industry, cloud computing, and tech sector analysis.',
    keywords: ['NVIDIA', 'OpenAI', 'Semiconductors', 'Machine Learning', 'Cloud Computing'],
    category: 'AI',
  },
  {
    id: 'commodities-intelligence',
    name: 'Commodities Intelligence',
    nameTr: 'Emtia İstihbaratı',
    description: 'Gold, crude oil, natural gas, and precious metals market analysis with supply-demand dynamics.',
    keywords: ['Gold', 'Crude Oil', 'Natural Gas', 'Silver', 'OPEC', 'Precious Metals'],
    category: 'COMMODITIES',
  },
  {
    id: 'geopolitical-intelligence',
    name: 'Geopolitical Intelligence',
    nameTr: 'Jeopolitik İstihbarat',
    description: 'Geopolitical risk assessment, trade policy analysis, sanctions monitoring, and sovereign economic intelligence.',
    keywords: ['Trade War', 'Sanctions', 'Geopolitics', 'Tariffs', 'Emerging Markets'],
    category: 'GENERAL',
  },
]

// ═══════════════════════════════════════════════════════════════
// SCHEMA GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. SITE-LEVEL KNOWLEDGE GRAPH
 * The master @graph that establishes SIAintel as a financial knowledge base.
 * Embed this in <head> of the root layout.
 */
export function generateSiteKnowledgeGraph(
  config: Partial<KnowledgeGraphConfig> = {},
  recentArticles: ArticleSummaryForGraph[] = []
): object {
  const c = { ...DEFAULT_CONFIG, ...config }
  const isTr = c.lang === 'tr'

  const graph: object[] = []

  // ── NODE 1: NewsMediaOrganization ──
  graph.push({
    '@type': 'NewsMediaOrganization',
    '@id': `${c.baseUrl}/#organization`,
    'name': c.siteName,
    'url': c.baseUrl,
    'logo': {
      '@type': 'ImageObject',
      '@id': `${c.baseUrl}/#logo`,
      'url': c.logoUrl,
      'width': 600,
      'height': 60,
    },
    'description': c.description,
    'foundingDate': '2024-01-01',
    'actionableFeedbackPolicy': `${c.baseUrl}/contact`,
    'correctionsPolicy': `${c.baseUrl}/legal`,
    'ethicsPolicy': `${c.baseUrl}/terms`,
    'diversityPolicy': `${c.baseUrl}/about`,
    'ownershipFundingInfo': `${c.baseUrl}/about`,
    'masthead': `${c.baseUrl}/about`,
    'verificationFactCheckingPolicy': `${c.baseUrl}/about`,
    'publishingPrinciples': `${c.baseUrl}/terms`,
    'sameAs': [
      'https://twitter.com/siaintel',
      'https://linkedin.com/company/siaintel',
    ],
    'knowsAbout': INTELLIGENCE_DOMAINS.map(d => ({
      '@type': 'Thing',
      'name': isTr ? d.nameTr : d.name,
      'description': d.description,
    })),
  })

  // ── NODE 2: WebSite with SearchAction ──
  graph.push({
    '@type': 'WebSite',
    '@id': `${c.baseUrl}/#website`,
    'url': c.baseUrl,
    'name': c.siteName,
    'description': c.description,
    'publisher': { '@id': `${c.baseUrl}/#organization` },
    'inLanguage': ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'ja', 'zh'],
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${c.baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  })

  // ── NODE 3: DataCatalog (Financial Knowledge Base) ──
  graph.push({
    '@type': 'DataCatalog',
    '@id': `${c.baseUrl}/#datacatalog`,
    'name': isTr ? 'SIA Finansal İstihbarat Kataloğu' : 'SIA Financial Intelligence Catalog',
    'description': isTr
      ? 'Yapay zeka destekli otonom finansal istihbarat platformu. Gerçek zamanlı piyasa analizi, kurumsal risk değerlendirmesi ve egemen ekonomik içgörüler.'
      : 'AI-powered autonomous financial intelligence platform. Real-time market analysis, institutional-grade risk assessment, and sovereign economic insights.',
    'url': c.baseUrl,
    'creator': { '@id': `${c.baseUrl}/#organization` },
    'dataset': INTELLIGENCE_DOMAINS.map(domain => ({
      '@type': 'Dataset',
      '@id': `${c.baseUrl}/#dataset-${domain.id}`,
      'name': isTr ? domain.nameTr : domain.name,
      'description': domain.description,
      'keywords': domain.keywords,
      'url': `${c.baseUrl}/${c.lang}/${domain.category.toLowerCase()}`,
      'creator': { '@id': `${c.baseUrl}/#organization` },
      'license': 'https://creativecommons.org/licenses/by-nc/4.0/',
      'temporalCoverage': `2024-01-01/${new Date().toISOString().split('T')[0]}`,
    })),
  })

  // ── NODE 4: ItemList (Recent Intelligence Reports) ──
  if (recentArticles.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${c.baseUrl}/#latest-intel`,
      'name': isTr ? 'Son İstihbarat Raporları' : 'Latest Intelligence Reports',
      'numberOfItems': recentArticles.length,
      'itemListElement': recentArticles.slice(0, 10).map((article, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': article.url,
        'name': article.title,
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

/**
 * 2. BREADCRUMB SCHEMA
 * Generate breadcrumb schema for any page.
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
  baseUrl = DEFAULT_CONFIG.baseUrl
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }
}

/**
 * 3. ARTICLE-LEVEL KNOWLEDGE NODE
 * Enhances a single article with knowledge graph connections.
 * Links article to the DataCatalog and establishes entity relationships.
 */
export function generateArticleKnowledgeNode(params: {
  articleUrl: string
  title: string
  summary: string
  category: string
  publishedAt: string
  entities: { name: string; type: string; sameAs?: string[] }[]
  relatedArticleUrls?: string[]
}): object {
  const baseUrl = DEFAULT_CONFIG.baseUrl
  const domain = INTELLIGENCE_DOMAINS.find(d => d.category === params.category) || INTELLIGENCE_DOMAINS[0]

  return {
    '@context': 'https://schema.org',
    '@type': ['NewsArticle', 'AnalysisNewsArticle'],
    '@id': `${params.articleUrl}#article`,
    'headline': params.title,
    'description': params.summary,
    'datePublished': params.publishedAt,
    'dateModified': params.publishedAt,
    'publisher': { '@id': `${baseUrl}/#organization` },
    'mainEntityOfPage': { '@id': params.articleUrl },
    'isPartOf': { '@id': `${baseUrl}/#dataset-${domain.id}` },
    'about': params.entities.slice(0, 5).map(e => {
      const node: Record<string, unknown> = { '@type': e.type, 'name': e.name }
      if (e.sameAs?.length) node.sameAs = e.sameAs
      return node
    }),
    'mentions': params.entities.slice(0, 10).map(e => ({
      '@type': e.type, 'name': e.name,
    })),
    ...(params.relatedArticleUrls?.length ? {
      'relatedLink': params.relatedArticleUrls,
    } : {}),
  }
}
