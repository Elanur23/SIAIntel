/**
 * Entity Mapping Layer for SIA_NEWS_v1.0
 * 
 * Identifies entities and maps them across all supported languages (TR, EN, DE, FR, ES, RU),
 * integrating with existing semantic-entity-mapper from E-E-A-T protocols.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.1, 13.2, 13.3, 13.4
 */

import { 
  expandSemanticEntityMap, 
  type SemanticEntityMap,
  type InverseEntity,
  type TechnicalEntity
} from '@/lib/ai/semantic-entity-mapper'
import {
  EntityMapping,
  EntityMappingResult,
  EntityCategory,
  VerifiedData,
  CausalChain
} from './types'
import {
  storeEntity,
  getEntityByName,
  getAllEntities,
  incrementEntityUsage
} from './database'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Supported languages for entity mapping
 */
export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de', 'fr', 'es', 'ru'] as const

/**
 * Minimum number of entities required per article
 */
export const MINIMUM_ENTITIES = 3

/**
 * Entity category keywords for classification
 */
const CATEGORY_KEYWORDS: Record<EntityCategory, string[]> = {
  CRYPTOCURRENCY: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'coin', 'token', 'blockchain'],
  CENTRAL_BANK: ['fed', 'federal reserve', 'ecb', 'european central bank', 'tcmb', 'bank of england', 'boe', 'central bank'],
  COMMODITY: ['gold', 'silver', 'oil', 'crude', 'commodity', 'metal', 'energy'],
  INDEX: ['s&p', 'nasdaq', 'dow', 'dxy', 'index', 'ftse', 'dax', 'cac'],
  INSTITUTION: ['blackrock', 'vanguard', 'grayscale', 'microstrategy', 'institution', 'fund', 'investor']
}

/**
 * Multi-language entity translations
 * Extends the semantic-entity-mapper definitions
 */
const ENTITY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Bitcoin': {
    tr: 'Bitcoin',
    en: 'Bitcoin',
    de: 'Bitcoin',
    fr: 'Bitcoin',
    es: 'Bitcoin',
    ru: 'Биткоин'
  },
  'Ethereum': {
    tr: 'Ethereum',
    en: 'Ethereum',
    de: 'Ethereum',
    fr: 'Ethereum',
    es: 'Ethereum',
    ru: 'Эфириум'
  },
  'Federal Reserve': {
    tr: 'Federal Rezerv',
    en: 'Federal Reserve',
    de: 'Federal Reserve',
    fr: 'Réserve fédérale',
    es: 'Reserva Federal',
    ru: 'Федеральная резервная система'
  },
  'European Central Bank': {
    tr: 'Avrupa Merkez Bankası',
    en: 'European Central Bank',
    de: 'Europäische Zentralbank',
    fr: 'Banque centrale européenne',
    es: 'Banco Central Europeo',
    ru: 'Европейский центральный банк'
  },
  'Gold': {
    tr: 'Altın',
    en: 'Gold',
    de: 'Gold',
    fr: 'Or',
    es: 'Oro',
    ru: 'Золото'
  },
  'US Dollar': {
    tr: 'ABD Doları',
    en: 'US Dollar',
    de: 'US-Dollar',
    fr: 'Dollar américain',
    es: 'Dólar estadounidense',
    ru: 'Доллар США'
  },
  'Institutional Investors': {
    tr: 'Kurumsal Yatırımcılar',
    en: 'Institutional Investors',
    de: 'Institutionelle Anleger',
    fr: 'Investisseurs institutionnels',
    es: 'Inversores institucionales',
    ru: 'Институциональные инвесторы'
  },
  'Exchange Flows': {
    tr: 'Borsa Akışları',
    en: 'Exchange Flows',
    de: 'Börsenflüsse',
    fr: 'Flux d\'échange',
    es: 'Flujos de intercambio',
    ru: 'Потоки обмена'
  },
  'Whale Wallets': {
    tr: 'Balina Cüzdanları',
    en: 'Whale Wallets',
    de: 'Wal-Wallets',
    fr: 'Portefeuilles de baleines',
    es: 'Billeteras de ballenas',
    ru: 'Кошельки китов'
  },
  'Interest Rates': {
    tr: 'Faiz Oranları',
    en: 'Interest Rates',
    de: 'Zinssätze',
    fr: 'Taux d\'intérêt',
    es: 'Tasas de interés',
    ru: 'Процентные ставки'
  }
}

// ============================================================================
// MAIN ENTITY MAPPING FUNCTION
// ============================================================================

/**
 * Map entities from verified data and causal chains
 * Integrates with semantic-entity-mapper for enhanced entity recognition
 * 
 * Requirements: 3.1, 3.2, 3.4, 13.1, 13.2
 * 
 * @param verifiedData - Verified source data
 * @param causalChains - Identified causal relationships
 * @param asset - Primary asset being analyzed
 * @param topic - Article topic
 * @returns Entity mapping result with minimum 3 entities
 */
export async function mapEntities(
  verifiedData: VerifiedData,
  causalChains: CausalChain[],
  asset: string = 'Bitcoin',
  topic: string = 'Market Analysis'
): Promise<EntityMappingResult> {
  // Step 1: Extract entity references from verified data
  const entityReferences = extractEntityReferences(verifiedData, causalChains)
  
  // Step 2: Convert to InverseEntity format for semantic-entity-mapper
  const inverseEntities: InverseEntity[] = entityReferences.map((ref, index) => ({
    primaryEntity: ref,
    inverseEntity: findInverseEntity(ref),
    correlationCoefficient: 0.75 // Default correlation
  }))
  
  // Step 3: Integrate with semantic-entity-mapper for expanded entity recognition
  const semanticMap = await identifyEntitiesWithSemanticMapper(
    inverseEntities,
    topic,
    asset,
    'en' // Use English as base language
  )
  
  // Step 4: Convert semantic entities to EntityMapping format
  const entities: EntityMapping[] = []
  const newEntitiesAdded: string[] = []
  
  for (const technicalEntity of semanticMap.entities) {
    // Check if entity already exists in database
    const existingEntity = await retrieveEntityMapping(technicalEntity.name)
    
    if (existingEntity) {
      // Use existing entity and increment usage
      entities.push(existingEntity)
      await incrementEntityUsage(existingEntity.entityId)
    } else {
      // Create new entity mapping
      const newEntity: EntityMapping = {
        entityId: `entity-${Date.now()}-${entities.length}`,
        primaryName: technicalEntity.name,
        category: mapSemanticCategoryToEntityCategory(technicalEntity.category),
        translations: await translateEntity(technicalEntity.name, SUPPORTED_LANGUAGES),
        definitions: technicalEntity.languageVariants,
        isNew: true,
        storedAt: new Date().toISOString()
      }
      
      // Store new entity in database
      await storeNewEntity(newEntity)
      
      entities.push(newEntity)
      newEntitiesAdded.push(newEntity.primaryName)
    }
  }
  
  // Step 5: Ensure minimum entity count (3)
  if (entities.length < MINIMUM_ENTITIES) {
    const additionalEntities = await addDefaultEntities(
      asset,
      MINIMUM_ENTITIES - entities.length
    )
    entities.push(...additionalEntities)
  }
  
  // Step 6: Calculate consistency score
  const consistencyScore = await ensureConsistency(entities)
  
  return {
    entities,
    entityCount: entities.length,
    newEntitiesAdded: newEntitiesAdded.length,
    consistencyScore
  }
}

// ============================================================================
// SEMANTIC-ENTITY-MAPPER INTEGRATION
// ============================================================================

/**
 * Identify entities using semantic-entity-mapper
 * Integrates with existing E-E-A-T protocols system
 * 
 * Requirements: 13.1, 13.2
 * 
 * @param inverseEntities - Initial entity references
 * @param topic - Article topic
 * @param asset - Primary asset
 * @param language - Base language for analysis
 * @returns Semantic entity map with 20+ entities
 */
export async function identifyEntitiesWithSemanticMapper(
  inverseEntities: InverseEntity[],
  topic: string,
  asset: string,
  language: string
): Promise<SemanticEntityMap> {
  // Use semantic-entity-mapper to expand entity recognition
  const semanticMap = await expandSemanticEntityMap(
    inverseEntities,
    topic,
    asset,
    language
  )
  
  return semanticMap
}

// ============================================================================
// ENTITY TRANSLATION
// ============================================================================

/**
 * Translate entity to all supported languages
 * 
 * Requirements: 3.2
 * 
 * @param entityName - Entity name in English
 * @param targetLanguages - Target languages for translation
 * @returns Record of language code to translated name
 */
export async function translateEntity(
  entityName: string,
  targetLanguages: readonly string[]
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {}
  
  // Check if we have predefined translations
  if (ENTITY_TRANSLATIONS[entityName]) {
    for (const lang of targetLanguages) {
      translations[lang] = ENTITY_TRANSLATIONS[entityName][lang] || entityName
    }
    return translations
  }
  
  // For entities without predefined translations, use the original name
  // In production, this would call a translation API
  for (const lang of targetLanguages) {
    translations[lang] = entityName
  }
  
  return translations
}

// ============================================================================
// ENTITY CATEGORIZATION
// ============================================================================

/**
 * Categorize entity based on keywords and context
 * 
 * Requirements: 3.5
 * 
 * @param entityName - Entity name to categorize
 * @returns Entity category
 */
export function categorizeEntity(entityName: string): EntityCategory {
  const lowerName = entityName.toLowerCase()
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category as EntityCategory
      }
    }
  }
  
  // Default to INSTITUTION if no match
  return 'INSTITUTION'
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Store new entity in database
 * Synchronizes with semantic-entity-mapper database
 * 
 * Requirements: 3.3, 13.3
 * 
 * @param entity - Entity mapping to store
 */
export async function storeNewEntity(entity: EntityMapping): Promise<void> {
  await storeEntity(entity)
}

/**
 * Retrieve entity mapping from database
 * 
 * Requirements: 3.3
 * 
 * @param entityName - Entity name to retrieve
 * @returns Entity mapping or null if not found
 */
export async function retrieveEntityMapping(
  entityName: string
): Promise<EntityMapping | null> {
  return await getEntityByName(entityName)
}

/**
 * Ensure terminology consistency across articles
 * Validates that entity translations are consistent
 * 
 * Requirements: 3.4, 13.4
 * 
 * @param entities - Entities to validate
 * @returns Consistency score (0-100)
 */
export async function ensureConsistency(
  entities: EntityMapping[]
): Promise<number> {
  let consistentCount = 0
  let totalChecks = 0
  
  // Get all existing entities from database
  const allEntities = await getAllEntities()
  
  // Check each entity against database
  for (const entity of entities) {
    const existing = allEntities.find(e => e.primaryName === entity.primaryName)
    
    if (existing) {
      totalChecks++
      
      // Check if translations match
      let translationsMatch = true
      for (const lang of SUPPORTED_LANGUAGES) {
        if (entity.translations[lang] !== existing.translations[lang]) {
          translationsMatch = false
          break
        }
      }
      
      if (translationsMatch) {
        consistentCount++
      }
    }
  }
  
  // If no existing entities to compare, return 100
  if (totalChecks === 0) {
    return 100
  }
  
  return Math.round((consistentCount / totalChecks) * 100)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract entity references from verified data and causal chains
 */
function extractEntityReferences(
  verifiedData: VerifiedData,
  causalChains: CausalChain[]
): string[] {
  const entities = new Set<string>()
  
  // Extract from verified data
  verifiedData.extractedData.entityReferences.forEach(ref => entities.add(ref))
  
  // Extract from causal chains
  for (const chain of causalChains) {
    chain.triggerEvent.entities.forEach(e => entities.add(e))
    chain.intermediateEffects.forEach(effect => {
      effect.entities.forEach(e => entities.add(e))
    })
    chain.finalOutcome.entities.forEach(e => entities.add(e))
  }
  
  return Array.from(entities)
}

/**
 * Find inverse entity for correlation analysis
 */
function findInverseEntity(entity: string): string {
  const inverseMap: Record<string, string> = {
    'Bitcoin': 'US Dollar',
    'Gold': 'Real Yields',
    'Whale Wallets': 'Exchange Flows',
    'Fear Index': 'Greed Index',
    'Interest Rates': 'Bond Prices'
  }
  
  return inverseMap[entity] || 'Market Sentiment'
}

/**
 * Map semantic entity category to EntityCategory type
 */
function mapSemanticCategoryToEntityCategory(
  semanticCategory: 'MARKET_INDICATOR' | 'ON_CHAIN' | 'CORRELATION' | 'TECHNICAL' | 'MACRO'
): EntityCategory {
  const categoryMap: Record<string, EntityCategory> = {
    'MARKET_INDICATOR': 'INDEX',
    'ON_CHAIN': 'CRYPTOCURRENCY',
    'CORRELATION': 'COMMODITY',
    'TECHNICAL': 'INDEX',
    'MACRO': 'CENTRAL_BANK'
  }
  
  return categoryMap[semanticCategory] || 'INSTITUTION'
}

/**
 * Add default entities when minimum count is not met
 */
async function addDefaultEntities(
  asset: string,
  count: number
): Promise<EntityMapping[]> {
  const defaultEntities: string[] = [
    'Bitcoin',
    'Ethereum',
    'Federal Reserve',
    'Gold',
    'US Dollar',
    'Institutional Investors',
    'Exchange Flows',
    'Whale Wallets'
  ]
  
  const entities: EntityMapping[] = []
  
  for (let i = 0; i < count && i < defaultEntities.length; i++) {
    const entityName = defaultEntities[i]
    
    // Check if entity exists in database
    const existing = await retrieveEntityMapping(entityName)
    
    if (existing) {
      entities.push(existing)
    } else {
      const newEntity: EntityMapping = {
        entityId: `entity-default-${Date.now()}-${i}`,
        primaryName: entityName,
        category: categorizeEntity(entityName),
        translations: await translateEntity(entityName, SUPPORTED_LANGUAGES),
        definitions: ENTITY_TRANSLATIONS[entityName] || {},
        isNew: true,
        storedAt: new Date().toISOString()
      }
      
      await storeNewEntity(newEntity)
      entities.push(newEntity)
    }
  }
  
  return entities
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type EntityMapping,
  type EntityMappingResult,
  type EntityCategory
} from './types'
