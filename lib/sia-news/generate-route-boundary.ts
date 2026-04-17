/**
 * NOTE: content-generation module is not available in this minimized workspace.
 * Restoring it would require 6+ AI/SEO dependencies:
 * - @/lib/ai/adsense-compliant-writer
 * - @/lib/ai/predictive-sentiment-analyzer
 * - @/lib/ai/eeat-protocols-orchestrator
 * - @/lib/ai/quantum-expertise-signaler
 * - @/lib/ai/semantic-entity-mapper
 * - @/lib/seo/auto-silo-linking
 * 
 * This file is only used by tests, not in production runtime path.
 */
// import { generateArticle as generateArticleInternal } from './content-generation'
import { rewriteForRegion as rewriteForRegionInternal } from './contextual-rewriting'
import type {
  CausalChain,
  ContentGenerationRequest,
  EntityMapping,
  GeneratedArticle,
  Language,
  Region,
  RewrittenContent,
} from './types'

export interface RouteRegionalAdaptationInput {
  baseContent: string
  entities: EntityMapping[]
  causalChains: CausalChain[]
  region: Region
  language: Language
}

export async function adaptRegionalContentForRoute(
  input: RouteRegionalAdaptationInput
): Promise<RewrittenContent> {
  return rewriteForRegionInternal(
    input.baseContent,
    input.entities,
    input.causalChains,
    input.region,
    input.language
  )
}

/**
 * NOTE: This function is intentionally unsupported in the minimized workspace.
 * The content-generation module requires 6+ AI/SEO dependencies that are excluded.
 * This function is only used in tests, not in production runtime path.
 */
export async function composeArticleForRoute(
  request: ContentGenerationRequest
): Promise<GeneratedArticle> {
  throw new Error(
    'composeArticleForRoute is not implemented in this minimized workspace. ' +
    'The content-generation module requires 6+ AI/SEO dependencies ' +
    '(adsense-compliant-writer, predictive-sentiment-analyzer, eeat-protocols-orchestrator, ' +
    'quantum-expertise-signaler, semantic-entity-mapper, auto-silo-linking) ' +
    'that are not available in the current build.'
  )
}