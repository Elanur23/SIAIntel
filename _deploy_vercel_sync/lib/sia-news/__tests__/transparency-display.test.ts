/**
 * Transparency Layer Display Test
 * Verifies that transparency layers are properly formatted and displayed
 */

import { formatFullContentWithEEAT } from '../content-generation'
import type { GlossaryEntry, Language } from '../types'
import type { EEATProtocolsResult } from '@/lib/ai/eeat-protocols-orchestrator'
import type { TransparencyLayerResult } from '@/lib/ai/transparency-layer-generator'

describe('Transparency Layer Display', () => {
  const mockTransparencyLayers: TransparencyLayerResult = {
    layers: [
      {
        dataPoint: 'Whale accumulation increased 34%',
        source: {
          name: 'Glassnode',
          type: 'ON_CHAIN',
          date: '2024-03-01',
          metric: 'Whale accumulation',
          value: '+34%',
          isVerified: true
        },
        citation: 'According to Glassnode data from Mar 1, 2024, Whale accumulation shows +34%',
        credibilityScore: 94,
        verificationURL: 'https://glassnode.com'
      },
      {
        dataPoint: 'Exchange inflows reached $2.3B',
        source: {
          name: 'CryptoQuant',
          type: 'ON_CHAIN',
          date: '2024-03-01',
          metric: 'Exchange inflows',
          value: '$2.3B',
          isVerified: true
        },
        citation: 'According to CryptoQuant data from Mar 1, 2024, Exchange inflows shows $2.3B',
        credibilityScore: 91,
        verificationURL: 'https://cryptoquant.com'
      },
      {
        dataPoint: 'Stablecoin inflows declined 18%',
        source: {
          name: 'Glassnode',
          type: 'ON_CHAIN',
          date: '2024-03-01',
          metric: 'Stablecoin inflows',
          value: '-18%',
          isVerified: true
        },
        citation: 'According to Glassnode data from Mar 1, 2024, Stablecoin inflows shows -18%',
        credibilityScore: 94,
        verificationURL: 'https://glassnode.com'
      }
    ],
    trustTransparencyScore: 85,
    citationDensity: 4.2,
    sourceBreakdown: {
      onChain: 3,
      sentiment: 0,
      correlation: 0,
      macro: 0
    }
  }

  const mockEEATResult: EEATProtocolsResult = {
    quantumExpertise: [],
    transparencyLayers: mockTransparencyLayers,
    semanticEntityMap: {
      entities: [],
      entityCount: 0,
      categories: [],
      interconnections: [],
      entityClusteringScore: 0,
      languageVariants: {}
    },
    predictiveSentiment: {
      currentScore: 65,
      sentimentZone: 'GREED',
      nextBreakingPoint: null,
      historicalContext: {
        similarPatterns: [],
        averageBreakpointDuration: 0,
        historicalAccuracy: 0
      },
      riskFactors: []
    },
    authorityManifesto: {
      content: 'SIA_SENTINEL Intelligence Platform',
      wordCount: 4,
      components: {
        authorityEstablishment: '',
        uniqueValueProposition: '',
        methodologyTransparency: ''
      },
      authorityManifestoScore: 75,
      uniquenessScore: 80
    },
    eeATVerification: {
      content: 'Verified by E-E-A-T protocols',
      wordCount: 5,
      components: {
        dataSources: {
          sources: ['Glassnode', 'CryptoQuant'],
          totalCount: 2,
          categoryBreakdown: { onChain: 2 }
        },
        methodology: 'Multi-modal analysis',
        confidenceLevel: '87%',
        limitations: 'Market volatility',
        disclaimer: 'Not financial advice'
      },
      verificationCompletenessScore: 85
    },
    enhancedEEATScore: 95,
    protocolBonuses: {
      authorityManifesto: 3,
      quantumExpertise: 0,
      transparencyLayer: 5,
      entityMapping: 0,
      totalBonus: 8
    },
    performanceMetrics: {
      totalProcessingTime: 100,
      protocolTimings: {},
      cacheHitRates: {},
      geminiAPICalls: 0
    },
    errors: []
  }

  const mockGlossary: GlossaryEntry[] = [
    {
      term: 'Whale Wallet',
      definition: 'Large holders of cryptocurrency who can influence market prices',
      language: 'en',
      schemaMarkup: '{}'
    }
  ]

  test('should include transparency section header', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockEEATResult,
      'en'
    )

    expect(content).toContain('📊 Data Sources & Verification')
  })

  test('should display transparency layers with citations', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockEEATResult,
      'en'
    )

    // Check for citations
    expect(content).toContain('According to Glassnode')
    expect(content).toContain('According to CryptoQuant')
    expect(content).toContain('Whale accumulation shows +34%')
    expect(content).toContain('Exchange inflows shows $2.3B')
  })

  test('should display verification URLs', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockEEATResult,
      'en'
    )

    expect(content).toContain('🔗 Verify: https://glassnode.com')
    expect(content).toContain('🔗 Verify: https://cryptoquant.com')
  })

  test('should display transparency badge with metrics', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockEEATResult,
      'en'
    )

    expect(content).toContain('✓ Transparency Score: 85/100')
    expect(content).toContain('Citation Density: 4.2 per 100 words')
  })

  test('should support multilingual transparency headers', () => {
    const languages: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru']
    const expectedHeaders: Record<Language, string> = {
      en: '📊 Data Sources & Verification',
      tr: '📊 Veri Kaynakları ve Doğrulama',
      de: '📊 Datenquellen und Verifizierung',
      fr: '📊 Sources de Données et Vérification',
      es: '📊 Fuentes de Datos y Verificación',
      ru: '📊 Источники Данных и Проверка',
      ar: '📊 مصادر البيانات والتحقق'
    }

    languages.forEach(language => {
      const content = formatFullContentWithEEAT(
        'Summary text',
        'SIA Insight text',
        'Risk disclaimer text',
        mockGlossary,
        mockEEATResult,
        language
      )

      expect(content).toContain(expectedHeaders[language])
    })
  })

  test('should limit displayed layers to 5 for readability', () => {
    // Create mock with 10 layers
    const manyLayers: TransparencyLayerResult = {
      ...mockTransparencyLayers,
      layers: Array(10).fill(mockTransparencyLayers.layers[0])
    }

    const mockResult: EEATProtocolsResult = {
      ...mockEEATResult,
      transparencyLayers: manyLayers
    }

    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockResult,
      'en'
    )

    // Count numbered citations (1. 2. 3. 4. 5.)
    const citationMatches = content.match(/\d+\.\s+According to/g)
    expect(citationMatches).toBeTruthy()
    expect(citationMatches!.length).toBeLessThanOrEqual(5)
  })

  test('should handle missing transparency layers gracefully', () => {
    const mockResultNoLayers: EEATProtocolsResult = {
      ...mockEEATResult,
      transparencyLayers: {
        layers: [],
        trustTransparencyScore: 0,
        citationDensity: 0,
        sourceBreakdown: { onChain: 0, sentiment: 0, correlation: 0, macro: 0 }
      }
    }

    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockResultNoLayers,
      'en'
    )

    // Should not include transparency section if no layers
    expect(content).not.toContain('📊 Data Sources & Verification')
  })

  test('should handle null E-E-A-T result gracefully', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      null,
      'en'
    )

    // Should still generate content without transparency section
    expect(content).toContain('Summary text')
    expect(content).toContain('SIA Insight text')
    expect(content).toContain('Risk disclaimer text')
    expect(content).not.toContain('📊 Data Sources & Verification')
  })

  test('should maintain proper section ordering', () => {
    const content = formatFullContentWithEEAT(
      'Summary text',
      'SIA Insight text',
      'Risk disclaimer text',
      mockGlossary,
      mockEEATResult,
      'en'
    )

    // Check section order
    const summaryIndex = content.indexOf('Summary text')
    const insightIndex = content.indexOf('SIA Insight text')
    const transparencyIndex = content.indexOf('📊 Data Sources & Verification')
    const glossaryIndex = content.indexOf('📚 Technical Terms')
    const riskIndex = content.indexOf('Risk disclaimer text')

    expect(summaryIndex).toBeLessThan(insightIndex)
    expect(insightIndex).toBeLessThan(transparencyIndex)
    expect(transparencyIndex).toBeLessThan(glossaryIndex)
    expect(glossaryIndex).toBeLessThan(riskIndex)
  })
})
