import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type {
  CausalChain,
  ContentGenerationRequest,
  EntityMapping,
  GeneratedArticle,
  RewrittenContent,
} from '../types'

const mockRewriteForRegion = jest.fn()
const mockGenerateArticle = jest.fn()

jest.mock('../contextual-rewriting', () => ({
  rewriteForRegion: mockRewriteForRegion,
}))

jest.mock('../content-generation', () => ({
  generateArticle: mockGenerateArticle,
}))

import { adaptRegionalContentForRoute, composeArticleForRoute } from '../generate-route-boundary'

describe('generate-route-boundary', () => {
  beforeEach(() => {
    mockRewriteForRegion.mockReset()
    mockGenerateArticle.mockReset()
  })

  test('forwards regional adaptation inputs without reshaping', async () => {
    const entities = [] as EntityMapping[]
    const causalChains = [] as CausalChain[]

    const rewritten = {
      region: 'US',
      language: 'en',
      headline: 'Test headline',
      content: 'Adapted content',
      regionalAdaptations: ['adapt-1'],
      economicPsychology: 'liquidity',
      confidenceScore: 92,
    } as RewrittenContent

    mockRewriteForRegion.mockResolvedValue(rewritten)

    const result = await adaptRegionalContentForRoute({
      baseContent: 'base content',
      entities,
      causalChains,
      region: 'US',
      language: 'en',
    })

    expect(mockRewriteForRegion).toHaveBeenCalledTimes(1)
    expect(mockRewriteForRegion).toHaveBeenCalledWith(
      'base content',
      entities,
      causalChains,
      'US',
      'en'
    )
    expect(result).toBe(rewritten)
  })

  test('forwards article composition request unchanged', async () => {
    const request = {
      verifiedData: {} as ContentGenerationRequest['verifiedData'],
      causalChains: [] as ContentGenerationRequest['causalChains'],
      entities: [] as ContentGenerationRequest['entities'],
      regionalContent: {
        region: 'US',
        language: 'en',
        headline: 'H',
        content: 'C',
        regionalAdaptations: [],
        economicPsychology: 'P',
        confidenceScore: 80,
      },
      language: 'en',
      asset: 'BTC',
      confidenceScore: 80,
    } as ContentGenerationRequest

    const article = { id: 'article-1' } as GeneratedArticle
    mockGenerateArticle.mockResolvedValue(article)

    const result = await composeArticleForRoute(request)

    expect(mockGenerateArticle).toHaveBeenCalledTimes(1)
    expect(mockGenerateArticle).toHaveBeenCalledWith(request)
    expect(result).toBe(article)
  })
})