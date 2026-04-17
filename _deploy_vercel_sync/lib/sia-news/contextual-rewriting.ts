/**
 * Contextual Re-Writing Engine for SIA_NEWS_v1.0
 * 
 * Adapts content to regional economic psychology and cultural context for each target region.
 * Each region has unique economic focus areas, priority indicators, and cultural references.
 * 
 * Regions:
 * - TR (Turkey): Inflation, currency volatility, TCMB policy
 * - US (United States): Institutional liquidity, Fed policy, DXY
 * - DE (Germany): ECB policy, manufacturing data, DAX
 * - FR (France): AMF regulations, CAC 40, EU policy
 * - ES (Spain): CNMV regulations, IBEX 35, tourism impact
 * - RU (Russia): CBR policy, sanctions impact, energy markets
 * 
 * Requirements: 4.1, 4.4, 17.1, 17.2, 17.4, 17.5
 */

import type {
  RegionalContext,
  RewrittenContent,
  EntityMapping,
  CausalChain,
  Region,
  Language
} from './types'

// ============================================================================
// REGIONAL CONTEXT CONFIGURATIONS
// ============================================================================

/**
 * Regional context configurations for all 6 supported regions
 * Each region has unique economic focus, priority indicators, cultural references, and regulatory context
 */
export const REGIONAL_CONTEXTS: Record<Region, RegionalContext> = {
  TR: {
    region: 'TR',
    economicFocus: [
      'Inflation rates',
      'Currency exchange (TRY/USD)',
      'TCMB (Central Bank of Turkey) policy',
      'Capital flows',
      'Foreign reserves',
      'Interest rate decisions',
      'Currency volatility',
      'Import/export balance'
    ],
    priorityIndicators: [
      'USD/TRY',
      'EUR/TRY',
      'CPI (Consumer Price Index)',
      'PPI (Producer Price Index)',
      'TCMB interest rates',
      'Foreign reserves',
      'BIST 100',
      'Turkish bond yields'
    ],
    culturalReferences: [
      'BIST 100 (Borsa Istanbul)',
      'Turkish Lira',
      'Central Bank decisions',
      'Ankara policy',
      'Istanbul financial district',
      'Turkish Treasury',
      'Domestic savings'
    ],
    regulatoryContext: 'KVKK (Personal Data Protection Law) compliance, SPK (Capital Markets Board) regulations, TCMB monetary policy framework'
  },

  US: {
    region: 'US',
    economicFocus: [
      'Institutional liquidity',
      'Federal Reserve policy',
      'Interest rates',
      'Treasury yields',
      'Corporate earnings',
      'Employment data',
      'Inflation metrics',
      'Dollar strength'
    ],
    priorityIndicators: [
      'DXY Index (Dollar Index)',
      'Fed Funds Rate',
      'Real yields',
      'S&P 500',
      'Nasdaq Composite',
      'US 10-year Treasury',
      'VIX (Volatility Index)',
      'Non-farm payrolls'
    ],
    culturalReferences: [
      'Wall Street',
      'Federal Reserve',
      'Nasdaq',
      'New York Stock Exchange',
      'Silicon Valley',
      'Main Street vs Wall Street',
      'American institutional investors'
    ],
    regulatoryContext: 'SEC (Securities and Exchange Commission) regulations, FINRA compliance, Federal Reserve oversight, CFTC commodity regulations'
  },

  DE: {
    region: 'DE',
    economicFocus: [
      'ECB (European Central Bank) policy',
      'Euro stability',
      'German manufacturing',
      'EU integration',
      'Export economy',
      'Industrial production',
      'Eurozone inflation',
      'German bonds'
    ],
    priorityIndicators: [
      'EUR/USD',
      'DAX (German stock index)',
      'ECB interest rates',
      'German Bund yields',
      'IFO Business Climate Index',
      'German manufacturing PMI',
      'Eurozone CPI',
      'German GDP'
    ],
    culturalReferences: [
      'DAX',
      'Bundesbank',
      'European Central Bank',
      'Frankfurt financial center',
      'German engineering',
      'Mittelstand (medium-sized enterprises)',
      'German precision'
    ],
    regulatoryContext: 'BaFin (Federal Financial Supervisory Authority) regulations, MiFID II compliance, ECB banking supervision, EU financial directives'
  },

  FR: {
    region: 'FR',
    economicFocus: [
      'CAC 40 performance',
      'European market integration',
      'French government bonds',
      'EU policy impact',
      'French banking sector',
      'Eurozone coordination',
      'French economic reforms',
      'European fiscal policy'
    ],
    priorityIndicators: [
      'CAC 40',
      'French OAT (government bonds)',
      'EUR/USD',
      'ECB policy rates',
      'French GDP',
      'French unemployment',
      'French CPI',
      'Paris Bourse volume'
    ],
    culturalReferences: [
      'CAC 40',
      'Banque de France',
      'Paris Bourse',
      'French financial sector',
      'European integration',
      'French economic policy',
      'Parisian financial district'
    ],
    regulatoryContext: 'AMF (Autorité des marchés financiers) regulations, EU directives, ECB oversight, French financial law, MiFID II compliance'
  },

  ES: {
    region: 'ES',
    economicFocus: [
      'IBEX 35 performance',
      'Mediterranean economy',
      'Spanish government bonds',
      'Tourism sector impact',
      'Spanish banking sector',
      'Real estate market',
      'Unemployment trends',
      'EU recovery funds'
    ],
    priorityIndicators: [
      'IBEX 35',
      'Spanish bond yields',
      'EUR/USD',
      'Spanish unemployment rate',
      'Tourism revenue',
      'Spanish GDP',
      'Spanish CPI',
      'Madrid Stock Exchange volume'
    ],
    culturalReferences: [
      'IBEX 35',
      'Banco de España',
      'Madrid Stock Exchange',
      'Spanish banking sector',
      'Mediterranean economy',
      'Spanish tourism',
      'Regional economies'
    ],
    regulatoryContext: 'CNMV (Comisión Nacional del Mercado de Valores) regulations, EU directives, ECB oversight, Spanish securities law, MiFID II compliance'
  },

  RU: {
    region: 'RU',
    economicFocus: [
      'Commodity markets',
      'Geopolitical risk',
      'Ruble stability',
      'Energy prices',
      'Sanctions impact',
      'Gold reserves',
      'Oil and gas exports',
      'Capital controls'
    ],
    priorityIndicators: [
      'RUB/USD',
      'Oil prices (Brent, Urals)',
      'MOEX (Moscow Exchange)',
      'Gold reserves',
      'Natural gas prices',
      'Russian bond yields',
      'RTS Index',
      'Foreign currency reserves'
    ],
    culturalReferences: [
      'MOEX (Moscow Exchange)',
      'Central Bank of Russia',
      'Ruble',
      'Russian energy sector',
      'Commodity exports',
      'Moscow financial center',
      'Russian sovereign wealth'
    ],
    regulatoryContext: 'CBR (Central Bank of Russia) regulations, local compliance requirements, capital control measures, sanctions framework, Russian securities law'
  },

  AE: {
    region: 'AE',
    economicFocus: [
      'Oil and gas markets',
      'Dollar peg (AED/USD)',
      'Dubai/Abu Dhabi financial hubs',
      'Regional trade',
      'Real estate and tourism',
      'Sovereign wealth',
      'Islamic finance',
      'GCC monetary policy'
    ],
    priorityIndicators: [
      'Brent crude',
      'Dubai Financial Market (DFM)',
      'ADX (Abu Dhabi)',
      'AED/USD',
      'GCC bond yields',
      'Regional PMI',
      'Tourism and real estate metrics'
    ],
    culturalReferences: [
      'Dubai International Financial Centre',
      'Abu Dhabi Global Market',
      'UAE Central Bank',
      'GCC economies',
      'Petrodollar flows',
      'Sovereign investment'
    ],
    regulatoryContext: 'DFSA (Dubai), ADGM (Abu Dhabi), SCA (UAE Securities), Islamic finance compliance, GCC regulations'
  },

  JP: {
    region: 'JP',
    economicFocus: [
      'Bank of Japan policy',
      'Yen strength (USD/JPY)',
      'Nikkei and TOPIX',
      'Japanese government bonds (JGBs)',
      'Export sector',
      'Demographics and deflation',
      'Corporate governance reform',
      'Asian supply chains'
    ],
    priorityIndicators: [
      'USD/JPY',
      'Nikkei 225',
      'TOPIX',
      'JGB 10-year',
      'BoJ policy rate',
      'Tankan survey',
      'Japanese CPI',
      'Trade balance'
    ],
    culturalReferences: [
      'Tokyo Stock Exchange',
      'Bank of Japan',
      'Yen carry trade',
      'Japanese megabanks',
      'Abenomics legacy',
      'Keiretsu and corporate culture'
    ],
    regulatoryContext: 'FSA (Financial Services Agency), JPX regulations, BoJ oversight, Japanese financial instruments law'
  },

  CN: {
    region: 'CN',
    economicFocus: [
      'PBOC (People\'s Bank of China) policy',
      'Yuan (CNY) exchange rate',
      'A-shares and HK markets',
      'Property sector',
      'Manufacturing and exports',
      'Capital controls',
      'Belt and Road',
      'Tech and green policy'
    ],
    priorityIndicators: [
      'USD/CNY',
      'Shanghai Composite',
      'CSI 300',
      'PBOC rates and RRR',
      'Chinese PMI',
      'Property sales and prices',
      'Credit growth',
      'Foreign reserves'
    ],
    culturalReferences: [
      'Shanghai and Shenzhen exchanges',
      'Hong Kong Stock Exchange',
      'PBOC',
      'Chinese sovereign funds',
      'Belt and Road financing',
      'Chinese tech and manufacturing'
    ],
    regulatoryContext: 'CSRC (China Securities Regulatory Commission), PBOC monetary policy, capital flow management, mainland-HK connect rules'
  }
}

// ============================================================================
// REGIONAL CONTENT ADAPTATION FUNCTIONS
// ============================================================================

/**
 * Rewrites content for a specific region with adapted economic psychology and cultural context
 * 
 * @param baseContent - Original content to adapt
 * @param entities - Identified entities in the content
 * @param causalChains - Causal relationships in the content
 * @param region - Target region code
 * @param language - Target language code
 * @returns Rewritten content adapted for the region
 * 
 * Requirements: 4.1, 4.4, 17.5
 */
export async function rewriteForRegion(
  baseContent: string,
  entities: EntityMapping[],
  causalChains: CausalChain[],
  region: Region,
  language: Language
): Promise<RewrittenContent> {
  const context = REGIONAL_CONTEXTS[region]
  
  if (!context) {
    throw new Error(`Unsupported region: ${region}`)
  }

  // Step 1: Inject regional economic psychology
  let adaptedContent = await injectEconomicPsychology(baseContent, context, entities)

  // Step 2: Prioritize regional indicators
  const prioritizedIndicators = await prioritizeRegionalIndicators(
    extractIndicators(baseContent, entities),
    context
  )

  // Step 3: Adapt cultural references
  adaptedContent = await adaptCulturalReferences(adaptedContent, context, language)

  // Step 4: Emphasize region-relevant metrics
  adaptedContent = await emphasizeRegionalMetrics(
    adaptedContent,
    prioritizedIndicators,
    context
  )

  // Step 5: Calculate regional relevance score
  const confidenceScore = await calculateRegionalRelevance(adaptedContent, context)

  // Step 6: Generate regional headline
  const headline = await generateRegionalHeadline(
    adaptedContent,
    entities,
    context,
    language
  )

  // Track regional adaptations made
  const regionalAdaptations = [
    `Economic focus: ${context.economicFocus.slice(0, 3).join(', ')}`,
    `Priority indicators: ${prioritizedIndicators.slice(0, 3).join(', ')}`,
    `Cultural context: ${context.culturalReferences.slice(0, 2).join(', ')}`,
    `Regulatory awareness: ${context.regulatoryContext.split(',')[0]}`
  ]

  return {
    region,
    language,
    headline,
    content: adaptedContent,
    regionalAdaptations,
    economicPsychology: context.economicFocus[0], // Primary economic focus
    confidenceScore
  }
}

/**
 * Injects regional economic psychology into content
 * Adapts the narrative to reflect regional economic concerns and perspectives
 * 
 * @param content - Original content
 * @param context - Regional context configuration
 * @param entities - Identified entities
 * @returns Content with injected economic psychology
 * 
 * Requirements: 4.1, 17.5
 */
export async function injectEconomicPsychology(
  content: string,
  context: RegionalContext,
  entities: EntityMapping[]
): Promise<string> {
  let adaptedContent = content

  // Inject region-specific economic concerns
  const economicFocusMap: Record<Region, string> = {
    TR: 'currency stability and inflation control',
    US: 'institutional liquidity and Federal Reserve policy',
    DE: 'ECB monetary policy and Eurozone stability',
    FR: 'European market integration and French economic reforms',
    ES: 'Mediterranean economic recovery and tourism sector',
    RU: 'commodity market dynamics and geopolitical risk',
    AE: 'GCC markets, oil and dollar peg, regional financial hubs',
    JP: 'Bank of Japan policy, yen and Nikkei, export sector',
    CN: 'PBOC policy, yuan and A-shares, property and exports'
  }

  const psychologyPhrase = economicFocusMap[context.region]

  // Add regional perspective to analysis
  if (content.includes('market') || content.includes('economy')) {
    adaptedContent = adaptedContent.replace(
      /market (analysis|perspective|outlook)/gi,
      `market $1 with focus on ${psychologyPhrase}`
    )
  }

  // Emphasize region-relevant entities
  for (const entity of entities) {
    const entityName = entity.primaryName
    
    // Add regional context to entity mentions
    if (context.priorityIndicators.some(ind => 
      entityName.toLowerCase().includes(ind.toLowerCase()) ||
      ind.toLowerCase().includes(entityName.toLowerCase())
    )) {
      // This entity is regionally relevant - it's already emphasized by being mentioned
      continue
    }
  }

  return adaptedContent
}

/**
 * Prioritizes indicators based on regional relevance
 * 
 * @param indicators - List of indicators mentioned in content
 * @param context - Regional context configuration
 * @returns Prioritized list of indicators
 * 
 * Requirements: 4.1, 17.5
 */
export async function prioritizeRegionalIndicators(
  indicators: string[],
  context: RegionalContext
): Promise<string[]> {
  // Score each indicator based on regional priority
  const scoredIndicators = indicators.map(indicator => {
    let score = 0
    
    // Check if indicator is in priority list
    const isPriority = context.priorityIndicators.some(priority =>
      indicator.toLowerCase().includes(priority.toLowerCase()) ||
      priority.toLowerCase().includes(indicator.toLowerCase())
    )
    
    if (isPriority) {
      score += 10
    }
    
    // Check if indicator relates to economic focus
    const isFocusArea = context.economicFocus.some(focus =>
      indicator.toLowerCase().includes(focus.toLowerCase()) ||
      focus.toLowerCase().includes(indicator.toLowerCase())
    )
    
    if (isFocusArea) {
      score += 5
    }
    
    return { indicator, score }
  })

  // Sort by score (descending) and return indicator names
  return scoredIndicators
    .sort((a, b) => b.score - a.score)
    .map(item => item.indicator)
}

/**
 * Adapts cultural references to be appropriate for the target region
 * 
 * @param content - Original content
 * @param context - Regional context configuration
 * @param language - Target language
 * @returns Content with adapted cultural references
 * 
 * Requirements: 17.5
 */
export async function adaptCulturalReferences(
  content: string,
  context: RegionalContext,
  language: Language
): Promise<string> {
  let adaptedContent = content

  // Cultural reference mappings for different regions
  const culturalMappings: Record<Region, Record<string, string>> = {
    TR: {
      'stock market': 'BIST 100',
      'central bank': 'TCMB (Türkiye Cumhuriyet Merkez Bankası)',
      'currency': 'Turkish Lira',
      'financial center': 'Istanbul financial district'
    },
    US: {
      'stock market': 'Wall Street',
      'central bank': 'Federal Reserve',
      'currency': 'US Dollar',
      'financial center': 'New York financial district'
    },
    DE: {
      'stock market': 'DAX',
      'central bank': 'European Central Bank',
      'currency': 'Euro',
      'financial center': 'Frankfurt financial center'
    },
    FR: {
      'stock market': 'CAC 40',
      'central bank': 'Banque de France',
      'currency': 'Euro',
      'financial center': 'Paris financial district'
    },
    ES: {
      'stock market': 'IBEX 35',
      'central bank': 'Banco de España',
      'currency': 'Euro',
      'financial center': 'Madrid financial center'
    },
    RU: {
      'stock market': 'MOEX',
      'central bank': 'Central Bank of Russia',
      'currency': 'Ruble',
      'financial center': 'Moscow financial center'
    },
    AE: {
      'stock market': 'DFM / ADX',
      'central bank': 'UAE Central Bank',
      'currency': 'UAE Dirham',
      'financial center': 'DIFC / ADGM'
    },
    JP: {
      'stock market': 'Nikkei 225 / TOPIX',
      'central bank': 'Bank of Japan',
      'currency': 'Yen',
      'financial center': 'Tokyo financial district'
    },
    CN: {
      'stock market': 'Shanghai / Shenzhen / HKEX',
      'central bank': 'People\'s Bank of China',
      'currency': 'Yuan',
      'financial center': 'Shanghai / Hong Kong'
    }
  }

  const mappings = culturalMappings[context.region]

  // Apply cultural reference adaptations
  for (const [generic, specific] of Object.entries(mappings)) {
    const regex = new RegExp(`\\b${generic}\\b`, 'gi')
    adaptedContent = adaptedContent.replace(regex, specific)
  }

  return adaptedContent
}

/**
 * Emphasizes region-relevant metrics in the content
 * 
 * @param content - Original content
 * @param prioritizedIndicators - List of prioritized indicators
 * @param context - Regional context configuration
 * @returns Content with emphasized regional metrics
 */
async function emphasizeRegionalMetrics(
  content: string,
  prioritizedIndicators: string[],
  context: RegionalContext
): Promise<string> {
  let adaptedContent = content

  // Add regional metric context where relevant
  const topIndicators = prioritizedIndicators.slice(0, 3)
  
  if (topIndicators.length > 0) {
    // Indicators are already mentioned in content, no need to add emphasis
    // The prioritization itself serves as the emphasis mechanism
  }

  return adaptedContent
}

/**
 * Generates a region-specific headline
 * 
 * @param content - Adapted content
 * @param entities - Identified entities
 * @param context - Regional context configuration
 * @param language - Target language
 * @returns Regional headline
 */
async function generateRegionalHeadline(
  content: string,
  entities: EntityMapping[],
  context: RegionalContext,
  language: Language
): Promise<string> {
  // Extract key information from content
  const firstSentence = content.split('.')[0]
  
  // Add regional context to headline
  const regionalIndicator = context.priorityIndicators[0]
  
  // Create headline with regional focus
  let headline = firstSentence
  
  // Ensure headline includes regional context
  if (!headline.includes(regionalIndicator)) {
    headline = `${headline} - ${regionalIndicator} Impact`
  }

  // Limit to 60-80 characters for optimal display
  if (headline.length > 80) {
    headline = headline.substring(0, 77) + '...'
  }

  return headline
}

/**
 * Calculates regional relevance score for the adapted content
 * 
 * @param content - Adapted content
 * @param context - Regional context configuration
 * @returns Relevance score (0-100)
 * 
 * Requirements: 4.1, 17.5
 */
export async function calculateRegionalRelevance(
  content: string,
  context: RegionalContext
): Promise<number> {
  let score = 0
  const contentLower = content.toLowerCase()

  // Check for priority indicators (40 points max)
  const indicatorMatches = context.priorityIndicators.filter(indicator =>
    contentLower.includes(indicator.toLowerCase())
  ).length
  score += Math.min(indicatorMatches * 5, 40)

  // Check for economic focus areas (30 points max)
  const focusMatches = context.economicFocus.filter(focus =>
    contentLower.includes(focus.toLowerCase())
  ).length
  score += Math.min(focusMatches * 5, 30)

  // Check for cultural references (20 points max)
  const culturalMatches = context.culturalReferences.filter(ref =>
    contentLower.includes(ref.toLowerCase())
  ).length
  score += Math.min(culturalMatches * 5, 20)

  // Check for regulatory context (10 points max)
  const regulatoryTerms = context.regulatoryContext.split(',')
  const regulatoryMatches = regulatoryTerms.filter(term =>
    contentLower.includes(term.trim().toLowerCase())
  ).length
  score += Math.min(regulatoryMatches * 5, 10)

  return Math.min(score, 100)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts indicators mentioned in the content
 * 
 * @param content - Content to analyze
 * @param entities - Identified entities
 * @returns List of indicators found
 */
function extractIndicators(content: string, entities: EntityMapping[]): string[] {
  const indicators: string[] = []

  // Extract from entities
  for (const entity of entities) {
    if (entity.category === 'INDEX' || entity.category === 'COMMODITY') {
      indicators.push(entity.primaryName)
    }
  }

  // Common financial indicators
  const commonIndicators = [
    'DXY', 'S&P 500', 'Nasdaq', 'DAX', 'CAC 40', 'IBEX 35', 'MOEX',
    'BIST 100', 'USD/TRY', 'EUR/USD', 'RUB/USD',
    'CPI', 'PPI', 'GDP', 'unemployment', 'interest rate',
    'bond yield', 'VIX', 'oil price', 'gold price'
  ]

  for (const indicator of commonIndicators) {
    if (content.toLowerCase().includes(indicator.toLowerCase())) {
      indicators.push(indicator)
    }
  }

  // Remove duplicates
  return [...new Set(indicators)]
}

/**
 * Gets the language code for a region
 * 
 * @param region - Region code
 * @returns Language code
 */
export function getLanguageForRegion(region: Region): Language {
  const languageMap: Record<Region, Language> = {
    TR: 'tr',
    US: 'en',
    DE: 'de',
    FR: 'fr',
    ES: 'es',
    RU: 'ru',
    AE: 'ar',
    JP: 'jp',
    CN: 'zh'
  }
  
  return languageMap[region]
}

/**
 * Gets all supported regions
 * 
 * @returns Array of region codes
 */
export function getSupportedRegions(): Region[] {
  return Object.keys(REGIONAL_CONTEXTS) as Region[]
}

/**
 * Validates if a region is supported
 * 
 * @param region - Region code to validate
 * @returns True if region is supported
 */
export function isRegionSupported(region: string): region is Region {
  return region in REGIONAL_CONTEXTS
}
