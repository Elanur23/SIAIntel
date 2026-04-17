/**
 * Semantic Entity Mapper
 * Expands entity linking from 3-5 to 20+ entities with conceptual clustering
 * Part of E-E-A-T Reasoning Protocols (Level Max)
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface SemanticEntityMap {
  entities: TechnicalEntity[]
  entityCount: number // Target: 20+
  categories: EntityCategory[]
  interconnections: EntityInterconnection[]
  entityClusteringScore: number // 0-100
  languageVariants: Record<string, Record<string, string>> // entity ID → language → translation
}

export interface TechnicalEntity {
  id: string
  name: string
  category: 'MARKET_INDICATOR' | 'ON_CHAIN' | 'CORRELATION' | 'TECHNICAL' | 'MACRO'
  definition: string
  relevanceScore: number // 0-100
  connectionCount: number
  languageVariants: Record<string, string> // language → translation
}

export interface EntityCategory {
  name: string
  entities: string[] // Entity IDs
  description: string
}

export interface EntityInterconnection {
  sourceEntityId: string
  targetEntityId: string
  connectionType: 'CORRELATION' | 'CAUSATION' | 'INVERSE' | 'LEADING_INDICATOR'
  strength: number // 0.0-1.0
  description: string
}

export interface InverseEntity {
  primaryEntity: string
  inverseEntity: string
  correlationCoefficient: number
}

// ============================================================================
// ENTITY CATEGORIES WITH EXAMPLES
// ============================================================================

export const ENTITY_CATEGORIES_CONFIG = {
  MARKET_INDICATOR: {
    name: 'Market Indicators',
    description: 'Sentiment and market psychology metrics',
    examples: [
      'Fear/Greed Index',
      'Sentiment Divergence',
      'BTC Dominance',
      'Market Cap',
      'Trading Volume',
      'Volatility Index'
    ]
  },
  ON_CHAIN: {
    name: 'On-Chain Metrics',
    description: 'Blockchain-based activity indicators',
    examples: [
      'Whale Wallets',
      'Exchange Flows',
      'Active Addresses',
      'Transaction Volume',
      'HODL Waves',
      'Realized Cap'
    ]
  },
  CORRELATION: {
    name: 'Correlation Entities',
    description: 'Traditional market correlation factors',
    examples: [
      'Real Yields',
      'Central Bank Purchases',
      'DXY Index',
      'Gold Prices',
      'Treasury Yields',
      'Inflation Rate'
    ]
  },
  TECHNICAL: {
    name: 'Technical Indicators',
    description: 'Chart-based technical analysis metrics',
    examples: [
      'RSI',
      'MACD',
      'Support Levels',
      'Resistance Levels',
      'Moving Averages',
      'Fibonacci Retracements'
    ]
  },
  MACRO: {
    name: 'Macro Factors',
    description: 'Macroeconomic and geopolitical factors',
    examples: [
      'Interest Rates',
      'Inflation Data',
      'GDP Growth',
      'Unemployment Rate',
      'Geopolitical Events',
      'Regulatory Changes'
    ]
  }
}

// ============================================================================
// MULTI-LANGUAGE ENTITY DEFINITIONS
// ============================================================================

export const ENTITY_DEFINITIONS: Record<string, Record<string, string>> = {
  'Whale Wallets': {
    en: 'Cryptocurrency wallets holding 1,000+ BTC or equivalent large amounts',
    tr: '1,000+ BTC veya eşdeğer büyük miktarlar tutan kripto para cüzdanları',
    de: 'Kryptowährungs-Wallets mit 1.000+ BTC oder gleichwertigen großen Mengen',
    es: 'Billeteras de criptomonedas que contienen 1,000+ BTC o cantidades grandes equivalentes',
    fr: 'Portefeuilles de cryptomonnaies détenant 1 000+ BTC ou des montants importants équivalents',
    ar: 'محافظ العملات المشفرة التي تحتوي على 1000+ BTC أو مبالغ كبيرة مماثلة'
  },
  'Real Yields': {
    en: 'Interest rates adjusted for inflation, measuring true return on investment',
    tr: 'Enflasyona göre ayarlanmış faiz oranları, gerçek yatırım getirisini ölçen',
    de: 'Inflationsbereinigte Zinssätze, die die tatsächliche Kapitalrendite messen',
    es: 'Tasas de interés ajustadas por inflación, midiendo el retorno real de la inversión',
    fr: 'Taux d\'intérêt ajustés à l\'inflation, mesurant le rendement réel de l\'investissement',
    ar: 'أسعار الفائدة المعدلة حسب التضخم، قياس العائد الحقيقي على الاستثمار'
  },
  'Fear/Greed Index': {
    en: 'Market sentiment indicator measuring investor emotions from extreme fear (0) to extreme greed (100)',
    tr: 'Yatırımcı duygularını aşırı korkudan (0) aşırı açgözlülüğe (100) kadar ölçen piyasa duyarlılık göstergesi',
    de: 'Marktstimmungsindikator, der Anlegeremotionen von extremer Angst (0) bis extremer Gier (100) misst',
    es: 'Indicador de sentimiento del mercado que mide las emociones de los inversores desde miedo extremo (0) hasta codicia extrema (100)',
    fr: 'Indicateur de sentiment du marché mesurant les émotions des investisseurs de la peur extrême (0) à la cupidité extrême (100)',
    ar: 'مؤشر معنويات السوق يقيس مشاعر المستثمرين من الخوف الشديد (0) إلى الجشع الشديد (100)'
  },
  'Exchange Flows': {
    en: 'Net movement of cryptocurrency into or out of exchanges, indicating buying or selling pressure',
    tr: 'Borsalara giren veya çıkan kripto para net hareketi, alım veya satım baskısını gösteren',
    de: 'Nettobewegung von Kryptowährungen in oder aus Börsen, die Kauf- oder Verkaufsdruck anzeigt',
    es: 'Movimiento neto de criptomonedas hacia o desde exchanges, indicando presión de compra o venta',
    fr: 'Mouvement net de cryptomonnaies vers ou depuis les exchanges, indiquant une pression d\'achat ou de vente',
    ar: 'الحركة الصافية للعملات المشفرة إلى أو من البورصات، مما يشير إلى ضغط الشراء أو البيع'
  },
  'DXY Index': {
    en: 'US Dollar Index measuring dollar strength against basket of major currencies',
    tr: 'ABD Doları Endeksi, doların başlıca para birimleri sepetine karşı gücünü ölçen',
    de: 'US-Dollar-Index, der die Stärke des Dollars gegenüber einem Korb wichtiger Währungen misst',
    es: 'Índice del Dólar estadounidense que mide la fortaleza del dólar frente a una cesta de monedas principales',
    fr: 'Indice du dollar américain mesurant la force du dollar par rapport à un panier de devises majeures',
    ar: 'مؤشر الدولار الأمريكي يقيس قوة الدولار مقابل سلة من العملات الرئيسية'
  },
  'RSI': {
    en: 'Relative Strength Index: momentum oscillator measuring overbought/oversold conditions (0-100)',
    tr: 'Göreceli Güç Endeksi: aşırı alım/aşırı satım koşullarını ölçen momentum osilatörü (0-100)',
    de: 'Relative Strength Index: Momentum-Oszillator zur Messung überkaufter/überverkaufter Bedingungen (0-100)',
    es: 'Índice de Fuerza Relativa: oscilador de momentum que mide condiciones de sobrecompra/sobreventa (0-100)',
    fr: 'Indice de Force Relative: oscillateur de momentum mesurant les conditions de surachat/survente (0-100)',
    ar: 'مؤشر القوة النسبية: مذبذب الزخم يقيس ظروف الشراء المفرط/البيع المفرط (0-100)'
  },
  'BTC Dominance': {
    en: 'Bitcoin\'s market cap as percentage of total cryptocurrency market cap',
    tr: 'Bitcoin\'in piyasa değerinin toplam kripto para piyasa değerine yüzdesi',
    de: 'Bitcoins Marktkapitalisierung als Prozentsatz der gesamten Kryptowährungsmarktkapitalisierung',
    es: 'Capitalización de mercado de Bitcoin como porcentaje de la capitalización total del mercado de criptomonedas',
    fr: 'Capitalisation boursière de Bitcoin en pourcentage de la capitalisation totale du marché des cryptomonnaies',
    ar: 'القيمة السوقية للبيتكوين كنسبة مئوية من إجمالي القيمة السوقية للعملات المشفرة'
  },
  'HODL Waves': {
    en: 'Distribution of Bitcoin holdings by age, showing long-term holder behavior',
    tr: 'Bitcoin varlıklarının yaşa göre dağılımı, uzun vadeli sahip davranışını gösteren',
    de: 'Verteilung der Bitcoin-Bestände nach Alter, die das Verhalten langfristiger Inhaber zeigt',
    es: 'Distribución de tenencias de Bitcoin por edad, mostrando el comportamiento de los holders a largo plazo',
    fr: 'Distribution des avoirs Bitcoin par âge, montrant le comportement des détenteurs à long terme',
    ar: 'توزيع حيازات البيتكوين حسب العمر، يظهر سلوك الحائزين على المدى الطويل'
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function expandSemanticEntityMap(
  existingEntities: InverseEntity[],
  topic: string,
  asset: string,
  language: string
): Promise<SemanticEntityMap> {
  // Start with existing entities from Phase 3
  const entities: TechnicalEntity[] = []
  
  // Convert existing inverse entities to TechnicalEntity format
  for (const inverseEntity of existingEntities) {
    entities.push({
      id: `entity-${entities.length + 1}`,
      name: inverseEntity.primaryEntity,
      category: categorizeEntity(inverseEntity.primaryEntity),
      definition: getEntityDefinition(inverseEntity.primaryEntity, language),
      relevanceScore: 100, // Existing entities are highly relevant
      connectionCount: 1,
      languageVariants: getLanguageVariants(inverseEntity.primaryEntity)
    })
    
    entities.push({
      id: `entity-${entities.length + 1}`,
      name: inverseEntity.inverseEntity,
      category: categorizeEntity(inverseEntity.inverseEntity),
      definition: getEntityDefinition(inverseEntity.inverseEntity, language),
      relevanceScore: 100,
      connectionCount: 1,
      languageVariants: getLanguageVariants(inverseEntity.inverseEntity)
    })
  }
  
  // Discover additional entities to reach 20+ target
  const additionalEntities = await discoverAdditionalEntities(
    existingEntities,
    topic,
    asset,
    20 - entities.length
  )
  
  entities.push(...additionalEntities)
  
  // Filter entities by relevance score (≥ 60 threshold)
  const filteredEntities = entities.filter(e => e.relevanceScore >= 60)
  
  // Map entity interconnections
  const interconnections = await mapEntityInterconnections(filteredEntities)
  
  // Update connection counts
  for (const entity of filteredEntities) {
    entity.connectionCount = interconnections.filter(
      i => i.sourceEntityId === entity.id || i.targetEntityId === entity.id
    ).length
  }
  
  // Categorize entities
  const categories = categorizeEntities(filteredEntities)
  
  // Build language variants map
  const languageVariants: Record<string, Record<string, string>> = {}
  for (const entity of filteredEntities) {
    languageVariants[entity.id] = entity.languageVariants
  }
  
  // Calculate entity clustering score
  const entityClusteringScore = calculateEntityClusteringScore({
    entities: filteredEntities,
    entityCount: filteredEntities.length,
    categories,
    interconnections,
    entityClusteringScore: 0, // Will be calculated
    languageVariants
  })
  
  return {
    entities: filteredEntities,
    entityCount: filteredEntities.length,
    categories,
    interconnections,
    entityClusteringScore,
    languageVariants
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function discoverAdditionalEntities(
  existingEntities: InverseEntity[],
  topic: string,
  asset: string,
  targetCount: number
): Promise<TechnicalEntity[]> {
  const additionalEntities: TechnicalEntity[] = []
  
  // Get all entity examples from categories
  const allExamples: string[] = []
  for (const category of Object.values(ENTITY_CATEGORIES_CONFIG)) {
    allExamples.push(...category.examples)
  }
  
  // Filter out entities that already exist
  const existingNames = existingEntities.flatMap(e => [e.primaryEntity, e.inverseEntity])
  const availableEntities = allExamples.filter(name => !existingNames.includes(name))
  
  // Select entities based on relevance to topic and asset
  for (const entityName of availableEntities) {
    if (additionalEntities.length >= targetCount) break
    
    const relevanceScore = calculateRelevanceScore(
      {
        id: '',
        name: entityName,
        category: categorizeEntity(entityName),
        definition: '',
        relevanceScore: 0,
        connectionCount: 0,
        languageVariants: {}
      },
      topic,
      asset
    )
    
    if (relevanceScore >= 60) {
      additionalEntities.push({
        id: `entity-${Date.now()}-${additionalEntities.length}`,
        name: entityName,
        category: categorizeEntity(entityName),
        definition: getEntityDefinition(entityName, 'en'),
        relevanceScore,
        connectionCount: 0,
        languageVariants: getLanguageVariants(entityName)
      })
    }
  }
  
  return additionalEntities
}

export function categorizeEntities(
  entities: TechnicalEntity[]
): EntityCategory[] {
  const categories: EntityCategory[] = []
  
  for (const [categoryKey, categoryConfig] of Object.entries(ENTITY_CATEGORIES_CONFIG)) {
    const categoryEntities = entities.filter(e => e.category === categoryKey)
    
    if (categoryEntities.length > 0) {
      categories.push({
        name: categoryConfig.name,
        entities: categoryEntities.map(e => e.id),
        description: categoryConfig.description
      })
    }
  }
  
  return categories
}

export async function mapEntityInterconnections(
  entities: TechnicalEntity[]
): Promise<EntityInterconnection[]> {
  const interconnections: EntityInterconnection[] = []
  
  // Define known interconnections based on financial relationships
  const knownConnections: Array<{
    source: string
    target: string
    type: 'CORRELATION' | 'CAUSATION' | 'INVERSE' | 'LEADING_INDICATOR'
    strength: number
  }> = [
    { source: 'Fear/Greed Index', target: 'Trading Volume', type: 'CORRELATION', strength: 0.75 },
    { source: 'Whale Wallets', target: 'Exchange Flows', type: 'INVERSE', strength: 0.82 },
    { source: 'Real Yields', target: 'BTC Dominance', type: 'INVERSE', strength: 0.68 },
    { source: 'DXY Index', target: 'Gold Prices', type: 'INVERSE', strength: 0.71 },
    { source: 'RSI', target: 'Fear/Greed Index', type: 'CORRELATION', strength: 0.79 },
    { source: 'Interest Rates', target: 'Real Yields', type: 'CAUSATION', strength: 0.88 },
    { source: 'Exchange Flows', target: 'Trading Volume', type: 'LEADING_INDICATOR', strength: 0.73 },
    { source: 'HODL Waves', target: 'Whale Wallets', type: 'CORRELATION', strength: 0.76 },
    { source: 'Inflation Rate', target: 'Real Yields', type: 'CAUSATION', strength: 0.85 },
    { source: 'BTC Dominance', target: 'Market Cap', type: 'CORRELATION', strength: 0.69 }
  ]
  
  for (const connection of knownConnections) {
    const sourceEntity = entities.find(e => e.name === connection.source)
    const targetEntity = entities.find(e => e.name === connection.target)
    
    if (sourceEntity && targetEntity) {
      interconnections.push({
        sourceEntityId: sourceEntity.id,
        targetEntityId: targetEntity.id,
        connectionType: connection.type,
        strength: connection.strength,
        description: `${connection.source} ${connection.type.toLowerCase()} with ${connection.target}`
      })
    }
  }
  
  return interconnections
}

export async function generateEntityDefinitions(
  entity: TechnicalEntity,
  languages: string[]
): Promise<Record<string, string>> {
  const definitions: Record<string, string> = {}
  
  for (const lang of languages) {
    definitions[lang] = getEntityDefinition(entity.name, lang)
  }
  
  return definitions
}

export function calculateRelevanceScore(
  entity: TechnicalEntity,
  topic: string,
  asset: string
): number {
  let score = 60 // Base score
  
  const lowerTopic = topic.toLowerCase()
  const lowerAsset = asset.toLowerCase()
  const lowerEntityName = entity.name.toLowerCase()
  
  // Boost score for crypto-specific entities when asset is crypto
  if (['btc', 'eth', 'crypto'].includes(lowerAsset)) {
    if (entity.category === 'ON_CHAIN') score += 20
    if (entity.category === 'MARKET_INDICATOR') score += 15
  }
  
  // Boost score for macro entities when topic mentions macro factors
  if (lowerTopic.includes('macro') || lowerTopic.includes('economy')) {
    if (entity.category === 'MACRO') score += 20
    if (entity.category === 'CORRELATION') score += 15
  }
  
  // Boost score for technical entities when topic mentions technical analysis
  if (lowerTopic.includes('technical') || lowerTopic.includes('chart')) {
    if (entity.category === 'TECHNICAL') score += 20
  }
  
  // Boost score if entity name appears in topic
  if (lowerTopic.includes(lowerEntityName)) {
    score += 25
  }
  
  return Math.min(100, score)
}

export function calculateEntityClusteringScore(
  entityMap: SemanticEntityMap
): number {
  // Weighted formula: entity count (40%), interconnection density (40%), relevance (20%)
  
  // 1. Entity count score (0-100)
  const entityCountScore = Math.min(100, (entityMap.entityCount / 20) * 100)
  
  // 2. Interconnection density score (0-100)
  const avgConnections =
    entityMap.entities.length > 0
      ? entityMap.entities.reduce((sum, e) => sum + e.connectionCount, 0) / entityMap.entities.length
      : 0
  const interconnectionDensityScore = Math.min(100, (avgConnections / 3) * 100)
  
  // 3. Average relevance score (0-100)
  const avgRelevance =
    entityMap.entities.length > 0
      ? entityMap.entities.reduce((sum, e) => sum + e.relevanceScore, 0) / entityMap.entities.length
      : 0
  
  // Calculate weighted score
  const clusteringScore =
    entityCountScore * 0.4 +
    interconnectionDensityScore * 0.4 +
    avgRelevance * 0.2
  
  return Math.round(clusteringScore)
}

function categorizeEntity(entityName: string): 'MARKET_INDICATOR' | 'ON_CHAIN' | 'CORRELATION' | 'TECHNICAL' | 'MACRO' {
  for (const [categoryKey, categoryConfig] of Object.entries(ENTITY_CATEGORIES_CONFIG)) {
    if (categoryConfig.examples.includes(entityName)) {
      return categoryKey as 'MARKET_INDICATOR' | 'ON_CHAIN' | 'CORRELATION' | 'TECHNICAL' | 'MACRO'
    }
  }
  
  // Default categorization based on keywords
  const lower = entityName.toLowerCase()
  if (lower.includes('whale') || lower.includes('exchange') || lower.includes('chain')) {
    return 'ON_CHAIN'
  }
  if (lower.includes('fear') || lower.includes('greed') || lower.includes('sentiment')) {
    return 'MARKET_INDICATOR'
  }
  if (lower.includes('rsi') || lower.includes('macd') || lower.includes('support')) {
    return 'TECHNICAL'
  }
  if (lower.includes('yield') || lower.includes('gold') || lower.includes('dxy')) {
    return 'CORRELATION'
  }
  
  return 'MACRO'
}

function getEntityDefinition(entityName: string, language: string): string {
  const definitions = ENTITY_DEFINITIONS[entityName]
  
  if (definitions && definitions[language]) {
    return definitions[language]
  }
  
  // Fallback to English or generic definition
  if (definitions && definitions.en) {
    return definitions.en
  }
  
  return `${entityName} - Financial market indicator`
}

function getLanguageVariants(entityName: string): Record<string, string> {
  const definitions = ENTITY_DEFINITIONS[entityName]
  
  if (definitions) {
    return definitions
  }
  
  // Return entity name for all languages if no translations available
  return {
    en: entityName,
    tr: entityName,
    de: entityName,
    es: entityName,
    fr: entityName,
    ar: entityName
  }
}
