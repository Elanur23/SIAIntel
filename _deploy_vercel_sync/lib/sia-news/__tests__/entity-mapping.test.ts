/**
 * Unit tests for Entity Mapping Layer
 * Tests entity identification, translation, categorization, and database operations
 */

import {
  mapEntities,
  translateEntity,
  categorizeEntity,
  storeNewEntity,
  retrieveEntityMapping,
  ensureConsistency,
  SUPPORTED_LANGUAGES,
  MINIMUM_ENTITIES
} from '../entity-mapping'
import { VerifiedData, CausalChain, EntityCategory } from '../types'
import { clearAllData } from '../database'

describe('Entity Mapping Layer', () => {
  beforeEach(async () => {
    // Clear database before each test
    await clearAllData()
  })

  describe('mapEntities', () => {
    it('should identify minimum 3 entities from verified data', async () => {
      const verifiedData: VerifiedData = {
        source: 'Binance',
        category: 'ON_CHAIN',
        timestamp: new Date().toISOString(),
        extractedData: {
          timestamps: [new Date().toISOString()],
          numericalValues: [
            { metric: 'price', value: 67500, unit: 'USD' },
            { metric: 'volume', value: 2.3e9, unit: 'USD' }
          ],
          entityReferences: ['Bitcoin', 'Institutional Investors', 'Exchange Flows']
        },
        crossReferences: [],
        auditTrail: {
          verificationTimestamp: new Date().toISOString(),
          verifiedBy: 'SourceVerifier',
          sourceAttribution: 'Binance API',
          validationResult: 'APPROVED'
        }
      }

      const causalChains: CausalChain[] = [
        {
          id: 'chain-1',
          triggerEvent: {
            description: 'Institutional buying pressure',
            timestamp: new Date().toISOString(),
            metrics: [
              { type: 'PERCENTAGE', value: 34, unit: '%' }
            ],
            entities: ['Whale Wallets']
          },
          intermediateEffects: [
            {
              description: 'Exchange inflows increase',
              timestamp: new Date().toISOString(),
              metrics: [
                { type: 'VOLUME', value: 2.3e9, unit: 'USD' }
              ],
              entities: ['Exchange Flows']
            }
          ],
          finalOutcome: {
            description: 'Price appreciation',
            timestamp: new Date().toISOString(),
            metrics: [
              { type: 'PERCENTAGE', value: 8, unit: '%' }
            ],
            entities: ['Bitcoin']
          },
          confidence: 87,
          temporalValidation: true
        }
      ]

      const result = await mapEntities(verifiedData, causalChains, 'Bitcoin', 'Market Analysis')

      expect(result.entityCount).toBeGreaterThanOrEqual(MINIMUM_ENTITIES)
      expect(result.entities.length).toBeGreaterThanOrEqual(MINIMUM_ENTITIES)
    })

    it('should map entities to all 6 supported languages', async () => {
      const verifiedData: VerifiedData = {
        source: 'Binance',
        category: 'ON_CHAIN',
        timestamp: new Date().toISOString(),
        extractedData: {
          timestamps: [new Date().toISOString()],
          numericalValues: [],
          entityReferences: ['Bitcoin', 'Federal Reserve', 'Gold']
        },
        crossReferences: [],
        auditTrail: {
          verificationTimestamp: new Date().toISOString(),
          verifiedBy: 'SourceVerifier',
          sourceAttribution: 'Binance API',
          validationResult: 'APPROVED'
        }
      }

      const result = await mapEntities(verifiedData, [], 'Bitcoin', 'Market Analysis')

      // Check that each entity has translations for all supported languages
      for (const entity of result.entities) {
        for (const lang of SUPPORTED_LANGUAGES) {
          expect(entity.translations[lang]).toBeDefined()
          expect(entity.translations[lang]).not.toBe('')
        }
      }
    })

    it('should integrate with semantic-entity-mapper', async () => {
      const verifiedData: VerifiedData = {
        source: 'Binance',
        category: 'ON_CHAIN',
        timestamp: new Date().toISOString(),
        extractedData: {
          timestamps: [new Date().toISOString()],
          numericalValues: [],
          entityReferences: ['Bitcoin']
        },
        crossReferences: [],
        auditTrail: {
          verificationTimestamp: new Date().toISOString(),
          verifiedBy: 'SourceVerifier',
          sourceAttribution: 'Binance API',
          validationResult: 'APPROVED'
        }
      }

      const result = await mapEntities(verifiedData, [], 'Bitcoin', 'Market Analysis')

      // Should have expanded entities beyond the initial reference
      expect(result.entityCount).toBeGreaterThan(1)
    })
  })

  describe('translateEntity', () => {
    it('should translate entity to all supported languages', async () => {
      const translations = await translateEntity('Bitcoin', SUPPORTED_LANGUAGES)

      expect(translations.tr).toBe('Bitcoin')
      expect(translations.en).toBe('Bitcoin')
      expect(translations.de).toBe('Bitcoin')
      expect(translations.fr).toBe('Bitcoin')
      expect(translations.es).toBe('Bitcoin')
      expect(translations.ru).toBe('Биткоин')
    })

    it('should handle entities without predefined translations', async () => {
      const translations = await translateEntity('Unknown Entity', SUPPORTED_LANGUAGES)

      // Should return the original name for all languages
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(translations[lang]).toBe('Unknown Entity')
      }
    })
  })

  describe('categorizeEntity', () => {
    it('should categorize cryptocurrency entities', () => {
      expect(categorizeEntity('Bitcoin')).toBe('CRYPTOCURRENCY')
      expect(categorizeEntity('Ethereum')).toBe('CRYPTOCURRENCY')
      expect(categorizeEntity('BTC')).toBe('CRYPTOCURRENCY')
    })

    it('should categorize central bank entities', () => {
      expect(categorizeEntity('Federal Reserve')).toBe('CENTRAL_BANK')
      expect(categorizeEntity('ECB')).toBe('CENTRAL_BANK')
      expect(categorizeEntity('Central Bank')).toBe('CENTRAL_BANK')
    })

    it('should categorize commodity entities', () => {
      expect(categorizeEntity('Gold')).toBe('COMMODITY')
      expect(categorizeEntity('Silver')).toBe('COMMODITY')
      expect(categorizeEntity('Oil')).toBe('COMMODITY')
    })

    it('should categorize index entities', () => {
      expect(categorizeEntity('S&P 500')).toBe('INDEX')
      expect(categorizeEntity('DXY Index')).toBe('INDEX')
      expect(categorizeEntity('NASDAQ')).toBe('INDEX')
    })

    it('should default to INSTITUTION for unknown entities', () => {
      expect(categorizeEntity('Unknown Entity')).toBe('INSTITUTION')
    })
  })

  describe('Database Operations', () => {
    it('should store and retrieve entity mappings', async () => {
      const entity = {
        entityId: 'test-entity-1',
        primaryName: 'Bitcoin',
        category: 'CRYPTOCURRENCY' as EntityCategory,
        translations: {
          tr: 'Bitcoin',
          en: 'Bitcoin',
          de: 'Bitcoin',
          fr: 'Bitcoin',
          es: 'Bitcoin',
          ru: 'Биткоин'
        },
        definitions: {
          en: 'Digital cryptocurrency',
          tr: 'Dijital kripto para'
        },
        isNew: true,
        storedAt: new Date().toISOString()
      }

      await storeNewEntity(entity)

      const retrieved = await retrieveEntityMapping('Bitcoin')

      expect(retrieved).not.toBeNull()
      expect(retrieved?.primaryName).toBe('Bitcoin')
      expect(retrieved?.category).toBe('CRYPTOCURRENCY')
    })

    it('should ensure terminology consistency', async () => {
      // Store first entity
      const entity1 = {
        entityId: 'test-entity-1',
        primaryName: 'Bitcoin',
        category: 'CRYPTOCURRENCY' as EntityCategory,
        translations: {
          tr: 'Bitcoin',
          en: 'Bitcoin',
          de: 'Bitcoin',
          fr: 'Bitcoin',
          es: 'Bitcoin',
          ru: 'Биткоин'
        },
        definitions: {},
        isNew: true,
        storedAt: new Date().toISOString()
      }

      await storeNewEntity(entity1)

      // Check consistency with same entity
      const entity2 = {
        entityId: 'test-entity-2',
        primaryName: 'Bitcoin',
        category: 'CRYPTOCURRENCY' as EntityCategory,
        translations: {
          tr: 'Bitcoin',
          en: 'Bitcoin',
          de: 'Bitcoin',
          fr: 'Bitcoin',
          es: 'Bitcoin',
          ru: 'Биткоин'
        },
        definitions: {},
        isNew: false
      }

      const consistencyScore = await ensureConsistency([entity2])

      expect(consistencyScore).toBe(100)
    })

    it('should detect inconsistent translations', async () => {
      // Store first entity
      const entity1 = {
        entityId: 'test-entity-1',
        primaryName: 'Bitcoin',
        category: 'CRYPTOCURRENCY' as EntityCategory,
        translations: {
          tr: 'Bitcoin',
          en: 'Bitcoin',
          de: 'Bitcoin',
          fr: 'Bitcoin',
          es: 'Bitcoin',
          ru: 'Биткоин'
        },
        definitions: {},
        isNew: true,
        storedAt: new Date().toISOString()
      }

      await storeNewEntity(entity1)

      // Check consistency with different translations
      const entity2 = {
        entityId: 'test-entity-2',
        primaryName: 'Bitcoin',
        category: 'CRYPTOCURRENCY' as EntityCategory,
        translations: {
          tr: 'Farklı',
          en: 'Different',
          de: 'Unterschiedlich',
          fr: 'Différent',
          es: 'Diferente',
          ru: 'Другой'
        },
        definitions: {},
        isNew: false
      }

      const consistencyScore = await ensureConsistency([entity2])

      expect(consistencyScore).toBeLessThan(100)
    })
  })
})
