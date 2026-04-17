/**
 * SIA ENTITY-BASED SEO ENGINE V1.0
 * 
 * Sadece anahtar kelime değil, "Varlıklar" (Person, Company, Event, Currency)
 * arasında bir harita çıkarır. Google'ın en sevdiği mentions ve about
 * şemalarını haberin içine gizlice gömer.
 * 
 * Google Knowledge Graph API'ye uyumlu:
 * - Person (CEO'lar, Bakanlar, Analistler)
 * - Organization (Şirketler, Bankalar, Regülatörler)
 * - Event (Faiz Kararı, FOMC, Halving, Earnings)
 * - FinancialProduct (BTC, ETH, Gold, S&P 500)
 * - MonetaryAmount / Currency (USD, EUR, TRY)
 * - Place (Countries, Cities, Regions)
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type EntityType = 'Person' | 'Organization' | 'Event' | 'FinancialProduct' | 'Currency' | 'Place' | 'Thing'

export interface ExtractedEntity {
  name: string
  type: EntityType
  /** For schema.org sameAs — Wikipedia/Wikidata links */
  sameAs?: string[]
  description?: string
  /** Which cluster this belongs to (for cross-linking) */
  clusterId?: string
}

export interface EntitySchemaResult {
  entities: ExtractedEntity[]
  aboutSchema: object[]
  mentionsSchema: object[]
  /** Full JSON-LD snippet for embedding in article page */
  jsonLdSnippet: object
}

// ═══════════════════════════════════════════════════════════════
// ENTITY DICTIONARY (Enriched with Schema.org types + sameAs)
// ═══════════════════════════════════════════════════════════════

interface EntityDef {
  name: string
  type: EntityType
  keywords: string[]
  sameAs?: string[]
  description?: string
}

const ENTITY_DEFINITIONS: EntityDef[] = [
  // ─── PERSONS ───
  { name: 'Jerome Powell', type: 'Person', keywords: ['powell', 'jerome powell'], sameAs: ['https://en.wikipedia.org/wiki/Jerome_Powell'], description: 'Chair of the Federal Reserve' },
  { name: 'Christine Lagarde', type: 'Person', keywords: ['lagarde', 'christine lagarde'], sameAs: ['https://en.wikipedia.org/wiki/Christine_Lagarde'], description: 'President of the European Central Bank' },
  { name: 'Elon Musk', type: 'Person', keywords: ['elon musk', 'musk'], sameAs: ['https://en.wikipedia.org/wiki/Elon_Musk'], description: 'CEO of Tesla and SpaceX' },
  { name: 'Sam Altman', type: 'Person', keywords: ['sam altman', 'altman'], sameAs: ['https://en.wikipedia.org/wiki/Sam_Altman'], description: 'CEO of OpenAI' },
  { name: 'Jensen Huang', type: 'Person', keywords: ['jensen huang', 'jensen'], sameAs: ['https://en.wikipedia.org/wiki/Jensen_Huang'], description: 'CEO of NVIDIA' },
  { name: 'Satya Nadella', type: 'Person', keywords: ['satya nadella', 'nadella'], sameAs: ['https://en.wikipedia.org/wiki/Satya_Nadella'], description: 'CEO of Microsoft' },
  { name: 'Tim Cook', type: 'Person', keywords: ['tim cook'], sameAs: ['https://en.wikipedia.org/wiki/Tim_Cook'], description: 'CEO of Apple' },
  { name: 'Warren Buffett', type: 'Person', keywords: ['buffett', 'warren buffett'], sameAs: ['https://en.wikipedia.org/wiki/Warren_Buffett'], description: 'CEO of Berkshire Hathaway' },
  { name: 'Janet Yellen', type: 'Person', keywords: ['yellen', 'janet yellen'], sameAs: ['https://en.wikipedia.org/wiki/Janet_Yellen'], description: 'US Secretary of the Treasury' },
  { name: 'Mark Zuckerberg', type: 'Person', keywords: ['zuckerberg'], sameAs: ['https://en.wikipedia.org/wiki/Mark_Zuckerberg'], description: 'CEO of Meta Platforms' },
  { name: 'Fatih Karahan', type: 'Person', keywords: ['fatih karahan', 'karahan'], sameAs: ['https://en.wikipedia.org/wiki/Fatih_Karahan'], description: 'Governor of the Central Bank of Turkey' },

  // ─── ORGANIZATIONS ───
  { name: 'Federal Reserve', type: 'Organization', keywords: ['fed', 'federal reserve', 'fomc', 'amerikan merkez bankası'], sameAs: ['https://en.wikipedia.org/wiki/Federal_Reserve'], description: 'Central bank of the United States' },
  { name: 'European Central Bank', type: 'Organization', keywords: ['ecb', 'avrupa merkez bankası'], sameAs: ['https://en.wikipedia.org/wiki/European_Central_Bank'], description: 'Central bank for the eurozone' },
  { name: 'TCMB', type: 'Organization', keywords: ['tcmb', 'türkiye cumhuriyet merkez bankası', 'merkez bankası'], sameAs: ['https://en.wikipedia.org/wiki/Central_Bank_of_the_Republic_of_Turkey'], description: 'Central Bank of the Republic of Turkey' },
  { name: 'SEC', type: 'Organization', keywords: ['sec', 'securities and exchange'], sameAs: ['https://en.wikipedia.org/wiki/U.S._Securities_and_Exchange_Commission'], description: 'U.S. Securities and Exchange Commission' },
  { name: 'NVIDIA', type: 'Organization', keywords: ['nvidia', 'nvda'], sameAs: ['https://en.wikipedia.org/wiki/Nvidia'], description: 'American multinational technology company' },
  { name: 'Tesla', type: 'Organization', keywords: ['tesla', 'tsla'], sameAs: ['https://en.wikipedia.org/wiki/Tesla,_Inc.'], description: 'Electric vehicle and clean energy company' },
  { name: 'Apple', type: 'Organization', keywords: ['apple', 'aapl'], sameAs: ['https://en.wikipedia.org/wiki/Apple_Inc.'], description: 'American multinational technology company' },
  { name: 'Microsoft', type: 'Organization', keywords: ['microsoft', 'msft'], sameAs: ['https://en.wikipedia.org/wiki/Microsoft'], description: 'American multinational technology company' },
  { name: 'Google', type: 'Organization', keywords: ['google', 'alphabet', 'googl'], sameAs: ['https://en.wikipedia.org/wiki/Google'], description: 'American multinational technology company' },
  { name: 'Meta Platforms', type: 'Organization', keywords: ['meta', 'facebook'], sameAs: ['https://en.wikipedia.org/wiki/Meta_Platforms'], description: 'American multinational technology conglomerate' },
  { name: 'OpenAI', type: 'Organization', keywords: ['openai', 'chatgpt'], sameAs: ['https://en.wikipedia.org/wiki/OpenAI'], description: 'AI research organization' },
  { name: 'OPEC', type: 'Organization', keywords: ['opec', 'opec+'], sameAs: ['https://en.wikipedia.org/wiki/OPEC'], description: 'Organization of the Petroleum Exporting Countries' },
  { name: 'IMF', type: 'Organization', keywords: ['imf', 'international monetary fund', 'uluslararası para fonu'], sameAs: ['https://en.wikipedia.org/wiki/International_Monetary_Fund'], description: 'International financial institution' },
  { name: 'World Bank', type: 'Organization', keywords: ['world bank', 'dünya bankası'], sameAs: ['https://en.wikipedia.org/wiki/World_Bank'], description: 'International financial institution' },
  { name: 'TSMC', type: 'Organization', keywords: ['tsmc', 'taiwan semiconductor'], sameAs: ['https://en.wikipedia.org/wiki/TSMC'], description: 'World\'s largest semiconductor foundry' },
  { name: 'Berkshire Hathaway', type: 'Organization', keywords: ['berkshire', 'berkshire hathaway'], sameAs: ['https://en.wikipedia.org/wiki/Berkshire_Hathaway'], description: 'American multinational conglomerate' },
  { name: 'Amazon', type: 'Organization', keywords: ['amazon', 'amzn', 'aws'], sameAs: ['https://en.wikipedia.org/wiki/Amazon_(company)'], description: 'American multinational technology company' },
  { name: 'Borsa Istanbul', type: 'Organization', keywords: ['bist', 'borsa istanbul', 'borsa'], sameAs: ['https://en.wikipedia.org/wiki/Borsa_Istanbul'], description: 'Istanbul stock exchange' },

  // ─── EVENTS ───
  { name: 'FOMC Meeting', type: 'Event', keywords: ['fomc', 'fomc meeting', 'fomc toplantısı', 'fed meeting', 'fed toplantısı'], description: 'Federal Open Market Committee monetary policy meeting' },
  { name: 'Bitcoin Halving', type: 'Event', keywords: ['halving', 'bitcoin halving', 'btc halving', 'yarılanma'], description: 'Bitcoin block reward halving event' },
  { name: 'Earnings Season', type: 'Event', keywords: ['earnings', 'kazanç raporu', 'bilanço', 'quarterly report', 'çeyreklik rapor'], description: 'Quarterly corporate earnings reporting period' },
  { name: 'G20 Summit', type: 'Event', keywords: ['g20', 'g20 summit', 'g20 zirvesi'], description: 'International forum for governments and central bank governors' },
  { name: 'Jackson Hole', type: 'Event', keywords: ['jackson hole', 'jackson hole symposium'], description: 'Annual central banking conference hosted by the Federal Reserve' },
  { name: 'Davos', type: 'Event', keywords: ['davos', 'world economic forum', 'dünya ekonomik forumu', 'wef'], description: 'Annual meeting of the World Economic Forum' },

  // ─── FINANCIAL PRODUCTS ───
  { name: 'Bitcoin', type: 'FinancialProduct', keywords: ['bitcoin', 'btc'], sameAs: ['https://en.wikipedia.org/wiki/Bitcoin'], description: 'Decentralized digital currency' },
  { name: 'Ethereum', type: 'FinancialProduct', keywords: ['ethereum', 'eth'], sameAs: ['https://en.wikipedia.org/wiki/Ethereum'], description: 'Decentralized blockchain platform' },
  { name: 'Gold', type: 'FinancialProduct', keywords: ['gold', 'altın', 'xau', 'xauusd'], sameAs: ['https://en.wikipedia.org/wiki/Gold'], description: 'Precious metal commodity' },
  { name: 'Crude Oil', type: 'FinancialProduct', keywords: ['crude oil', 'brent', 'wti', 'ham petrol', 'petrol'], sameAs: ['https://en.wikipedia.org/wiki/Petroleum'], description: 'Petroleum commodity' },
  { name: 'S&P 500', type: 'FinancialProduct', keywords: ['s&p 500', 's&p500', 'sp500'], sameAs: ['https://en.wikipedia.org/wiki/S%26P_500'], description: 'U.S. stock market index' },
  { name: 'Nasdaq', type: 'FinancialProduct', keywords: ['nasdaq', 'nasdaq 100'], sameAs: ['https://en.wikipedia.org/wiki/Nasdaq'], description: 'American stock exchange' },
  { name: 'Solana', type: 'FinancialProduct', keywords: ['solana', 'sol'], sameAs: ['https://en.wikipedia.org/wiki/Solana_(blockchain_platform)'], description: 'High-performance blockchain platform' },
  { name: 'Spot Bitcoin ETF', type: 'FinancialProduct', keywords: ['spot etf', 'bitcoin etf', 'crypto etf', 'spot bitcoin etf'], description: 'Exchange-traded fund tracking bitcoin spot price' },

  // ─── CURRENCIES ───
  { name: 'US Dollar', type: 'Currency', keywords: ['dollar', 'dolar', 'usd', 'dxy'], sameAs: ['https://en.wikipedia.org/wiki/United_States_dollar'], description: 'Official currency of the United States' },
  { name: 'Euro', type: 'Currency', keywords: ['euro', 'eur'], sameAs: ['https://en.wikipedia.org/wiki/Euro'], description: 'Official currency of the eurozone' },
  { name: 'Turkish Lira', type: 'Currency', keywords: ['lira', 'try', 'türk lirası'], sameAs: ['https://en.wikipedia.org/wiki/Turkish_lira'], description: 'Official currency of Turkey' },
  { name: 'Japanese Yen', type: 'Currency', keywords: ['yen', 'jpy'], sameAs: ['https://en.wikipedia.org/wiki/Japanese_yen'], description: 'Official currency of Japan' },
  { name: 'Chinese Yuan', type: 'Currency', keywords: ['yuan', 'renminbi', 'cny', 'rmb'], sameAs: ['https://en.wikipedia.org/wiki/Renminbi'], description: 'Official currency of China' },

  // ─── PLACES ───
  { name: 'United States', type: 'Place', keywords: ['united states', 'usa', 'abd', 'amerika', 'washington'], sameAs: ['https://en.wikipedia.org/wiki/United_States'], description: 'Country in North America' },
  { name: 'China', type: 'Place', keywords: ['china', 'çin', 'beijing', 'pekin'], sameAs: ['https://en.wikipedia.org/wiki/China'], description: 'Country in East Asia' },
  { name: 'Turkey', type: 'Place', keywords: ['turkey', 'türkiye', 'ankara', 'istanbul'], sameAs: ['https://en.wikipedia.org/wiki/Turkey'], description: 'Country in Eurasia' },
  { name: 'Japan', type: 'Place', keywords: ['japan', 'japonya', 'tokyo'], sameAs: ['https://en.wikipedia.org/wiki/Japan'], description: 'Country in East Asia' },
  { name: 'European Union', type: 'Place', keywords: ['european union', 'avrupa birliği', 'eu', 'ab'], sameAs: ['https://en.wikipedia.org/wiki/European_Union'], description: 'Political and economic union in Europe' },
  { name: 'Russia', type: 'Place', keywords: ['russia', 'rusya', 'moscow', 'moskova'], sameAs: ['https://en.wikipedia.org/wiki/Russia'], description: 'Country in Eurasia' },
  { name: 'Saudi Arabia', type: 'Place', keywords: ['saudi', 'suudi', 'saudi arabia', 'suudi arabistan'], sameAs: ['https://en.wikipedia.org/wiki/Saudi_Arabia'], description: 'Country in the Middle East' },
]

// ═══════════════════════════════════════════════════════════════
// EXTRACTION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Extract all recognized entities from article text
 * Sorts longer keywords first for accurate matching (e.g., "Sam Altman" before "Altman")
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const lower = text.toLowerCase()
  const found = new Map<string, EntityDef>()

  // Sort definitions by longest keyword first for best matching
  const sorted = [...ENTITY_DEFINITIONS].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map(k => k.length))
    const maxB = Math.max(...b.keywords.map(k => k.length))
    return maxB - maxA
  })

  for (const def of sorted) {
    if (found.has(def.name)) continue
    for (const kw of def.keywords) {
      // Word boundary check: ensure keyword isn't part of a larger word
      const idx = lower.indexOf(kw.toLowerCase())
      if (idx !== -1) {
        const before = idx > 0 ? lower[idx - 1] : ' '
        const after = idx + kw.length < lower.length ? lower[idx + kw.length] : ' '
        const isBoundary = /[\s.,;:!?'"()\-/]/.test(before) || idx === 0
        const isEndBoundary = /[\s.,;:!?'"()\-/]/.test(after) || idx + kw.length === lower.length

        if (isBoundary && isEndBoundary) {
          found.set(def.name, def)
          break
        }
      }
    }
  }

  return Array.from(found.values()).map(def => ({
    name: def.name,
    type: def.type,
    sameAs: def.sameAs,
    description: def.description,
  }))
}

// ═══════════════════════════════════════════════════════════════
// SCHEMA GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Schema.org "about" and "mentions" arrays from entities
 * + full JSON-LD snippet for article page injection
 */
export function generateEntitySchema(
  entities: ExtractedEntity[],
  articleUrl: string,
  articleTitle: string
): EntitySchemaResult {
  // Primary entities → "about" (max 5, prioritize Person + Organization)
  const aboutPriority: EntityType[] = ['Person', 'Organization', 'Event', 'FinancialProduct']
  const sortedForAbout = [...entities].sort((a, b) => {
    return aboutPriority.indexOf(a.type) - aboutPriority.indexOf(b.type)
  })
  const aboutEntities = sortedForAbout.slice(0, 5)

  // All entities → "mentions" (max 10)
  const mentionEntities = entities.slice(0, 10)

  const aboutSchema = aboutEntities.map(e => {
    const node: Record<string, unknown> = {
      '@type': e.type === 'Currency' ? 'Thing' : e.type,
      'name': e.name,
    }
    if (e.description) node.description = e.description
    if (e.sameAs?.length) node.sameAs = e.sameAs
    return node
  })

  const mentionsSchema = mentionEntities.map(e => {
    const node: Record<string, unknown> = {
      '@type': e.type === 'Currency' ? 'Thing' : e.type,
      'name': e.name,
    }
    if (e.sameAs?.length) node.sameAs = e.sameAs
    return node
  })

  const jsonLdSnippet = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#entity-map`,
    'headline': articleTitle,
    'about': aboutSchema,
    'mentions': mentionsSchema,
  }

  return {
    entities,
    aboutSchema,
    mentionsSchema,
    jsonLdSnippet,
  }
}

/**
 * Full pipeline: extract entities from text + generate schema
 */
export function processArticleEntities(
  text: string,
  articleUrl: string,
  articleTitle: string
): EntitySchemaResult {
  const entities = extractEntities(text)
  return generateEntitySchema(entities, articleUrl, articleTitle)
}
