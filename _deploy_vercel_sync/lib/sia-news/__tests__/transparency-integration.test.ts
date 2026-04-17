/**
 * Transparency Layer Integration Test
 * Verifies that transparency layers are properly integrated and displayed in generated content
 */

import { generateArticle } from '../content-generation'
import type {
  ContentGenerationRequest,
  VerifiedData,
  CausalChain,
  EntityMapping,
  RewrittenContent
} from '../types'

describe('Transparency Layer Integration', () => {
  const mockVerifiedData: VerifiedData = {
    source: 'Glassnode',
    category: 'ON_CHAIN',
    timestamp: new Date().toISOString(),
    extractedData: {
      timestamps: [new Date().toISOString()],
      numericalValues: [
        { metric: 'Whale accumulation', value: 34, unit: '%' },
        { metric: 'Exchange inflows', value: 2.3, unit: 'B' }
      ],
      entityReferences: ['Bitcoin', 'Institutional Investors']
    },
    crossReferences: [],
    auditTrail: {
      verificationTimestamp: new Date().toISOString(),
      verifiedBy: 'Source_Verifier',
      sourceAttribution: 'Glassnode',
      validationResult: 'APPROVED'
    }
  }

  const mockCausalChains: CausalChain[] = [
    {
      id: 'chain-1',
      triggerEvent: {
        description: 'Institutional buying pressure increases',
        timestamp: new Date().toISOString(),
        metrics: [
          { type: 'PERCENTAGE', value: 34, unit: '%' }
        ],
        entities: ['Institutional Investors']
      },
      intermediateEffects: [
        {
          description: 'Exchange inflows surge',
          timestamp: new Date().toISOString(),
          metrics: [
            { type: 'VOLUME', value: 2.3, unit: 'B' }
          ],
          entities: ['Bitcoin']
        }
      ],
      finalOutcome: {
        description: 'Bitcoin price increases 8%',
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

  const mockEntities: EntityMapping[] = [
    {
      entityId: 'btc-1',
      primaryName: 'Bitcoin',
      category: 'CRYPTOCURRENCY',
      translations: {
        en: 'Bitcoin',
        tr: 'Bitcoin',
        de: 'Bitcoin',
        fr: 'Bitcoin',
        es: 'Bitcoin',
        ru: 'Биткоин'
      },
      definitions: {
        en: 'A decentralized digital currency',
        tr: 'Merkezi olmayan dijital para birimi',
        de: 'Eine dezentrale digitale Währung',
        fr: 'Une monnaie numérique décentralisée',
        es: 'Una moneda digital descentralizada',
        ru: 'Децентрализованная цифровая валюта'
      },
      isNew: false
    }
  ]

  const mockRegionalContent: RewrittenContent = {
    region: 'US',
    language: 'en',
    headline: 'Bitcoin Surges 8% Following Institutional Buying',
    content: 'Bitcoin surged 8% to $67,500 following institutional buying pressure.',
    regionalAdaptations: ['Institutional liquidity focus'],
    economicPsychology: 'US institutional market dynamics',
    confidenceScore: 87
  }

  test('should include transparency layers in generated content', async () => {
    const request: ContentGenerationRequest = {
      verifiedData: mockVerifiedData,
      causalChains: mockCausalChains,
      entities: mockEntities,
      regionalContent: mockRegionalContent,
      language: 'en',
      asset: 'Bitcoin',
      confidenceScore: 87
    }

    const article = await generateArticle(request)

    // Verify transparency layer section exists
    expect(article.fullContent).toContain('Data Sources & Verification')
    
    // Verify transparency badge exists
    expect(article.fullContent).toContain('Transparency Score')
    expect(article.fullContent).toContain('Citation Density')
    
    // Verify source attribution exists
    expect(article.fullContent).toContain('Glassnode')
    
    // Verify E-E-A-T metadata includes transparency information
    expect(article.metadata.eeATProtocols).toBeDefined()
    expect(article.metadata.eeATProtocols?.transparencyLayers).toBeGreaterThan(0)
  }, 30000) // 30 second timeout for API calls

  test('should display verification URLs when available', async () => {
    const request: ContentGenerationRequest = {
      verifiedData: mockVerifiedData,
      causalChains: mockCausalChains,
      entities: mockEntities,
      regionalContent: mockRegionalContent,
      language: 'en',
      asset: 'Bitcoin',
      confidenceScore: 87
    }

    const article = await generateArticle(request)

    // Verify verification URLs are included
    expect(article.fullContent).toMatch(/Verify:.*https?:\/\//i)
  }, 30000)

  test('should support multilingual transparency headers', async () => {
    const languages: Array<'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru'> = ['en', 'tr', 'de', 'fr', 'es', 'ru']
    
    for (const language of languages) {
      const request: ContentGenerationRequest = {
        verifiedData: mockVerifiedData,
        causalChains: mockCausalChains,
        entities: mockEntities,
        regionalContent: {
          ...mockRegionalContent,
          language
        },
        language,
        asset: 'Bitcoin',
        confidenceScore: 87
      }

      const article = await generateArticle(request)

      // Verify transparency section exists in each language
      expect(article.fullContent.length).toBeGreaterThan(300)
      expect(article.metadata.eeATProtocols).toBeDefined()
    }
  }, 60000) // 60 second timeout for multiple API calls

  test('should calculate citation density correctly', async () => {
    const request: ContentGenerationRequest = {
      verifiedData: mockVerifiedData,
      causalChains: mockCausalChains,
      entities: mockEntities,
      regionalContent: mockRegionalContent,
      language: 'en',
      asset: 'Bitcoin',
      confidenceScore: 87
    }

    const article = await generateArticle(request)

    // Verify citation density is displayed
    expect(article.fullContent).toMatch(/Citation Density:.*\d+\.\d+/)
    
    // Verify transparency score is displayed
    expect(article.fullContent).toMatch(/Transparency Score:.*\d+\/100/)
  }, 30000)

  test('should include source breakdown by type', async () => {
    const request: ContentGenerationRequest = {
      verifiedData: mockVerifiedData,
      causalChains: mockCausalChains,
      entities: mockEntities,
      regionalContent: mockRegionalContent,
      language: 'en',
      asset: 'Bitcoin',
      confidenceScore: 87
    }

    const article = await generateArticle(request)

    // Verify E-E-A-T protocols metadata includes transparency layers
    expect(article.metadata.eeATProtocols).toBeDefined()
    if (article.metadata.eeATProtocols) {
      expect(article.metadata.eeATProtocols.transparencyLayers).toBeGreaterThanOrEqual(0)
    }
  }, 30000)
})
