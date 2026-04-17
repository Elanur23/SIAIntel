/**
 * Expert Resolver — Single source of truth for category → expert mapping
 * 
 * Ensures consistent expert assignment across:
 * - War Room save (authorName, authorRole in DB)
 * - SEO structured data (author field)
 * - Article page rendering
 * - Content buffer Google validation
 */

import { getExpertByCategory, type ExpertCategory, type ExpertPersona } from './council-of-five'

const CATEGORY_TO_EXPERT: Record<string, ExpertCategory> = {
  // Buffer / content-buffer categories
  CRYPTO_BLOCKCHAIN: 'CRYPTO_BLOCKCHAIN',
  MACRO_ECONOMY: 'MACRO_ECONOMY',
  COMMODITIES: 'COMMODITIES',
  TECH_STOCKS: 'TECH_STOCKS',
  EMERGING_MARKETS: 'EMERGING_MARKETS',
  // War Room / UI categories
  CRYPTO: 'CRYPTO_BLOCKCHAIN',
  ECONOMY: 'MACRO_ECONOMY',
  MACRO: 'MACRO_ECONOMY',
  STOCKS: 'TECH_STOCKS',
  TECH: 'TECH_STOCKS',
  AI: 'TECH_STOCKS',
  MARKET: 'MACRO_ECONOMY',
  GENERAL: 'MACRO_ECONOMY',
  BREAKING: 'MACRO_ECONOMY',
}

/**
 * Resolve the expert analyst for a given article category.
 * Returns { name, title, bio } for persisting to DB / SEO.
 */
export function resolveExpertForCategory(
  category: string | undefined | null,
  language: string = 'en'
): { name: string; title: string; bio: string } {
  const upper = (category || 'GENERAL').toUpperCase()
  const expertCategory = CATEGORY_TO_EXPERT[upper] || 'MACRO_ECONOMY'
  const expert = getExpertByCategory(expertCategory)

  return {
    name: expert.name,
    title: expert.title,
    bio: expert.bio[language] || expert.bio.en,
  }
}

/**
 * Get the full ExpertPersona for a given article category
 */
export function resolveFullExpert(category: string | undefined | null): ExpertPersona {
  const upper = (category || 'GENERAL').toUpperCase()
  const expertCategory = CATEGORY_TO_EXPERT[upper] || 'MACRO_ECONOMY'
  return getExpertByCategory(expertCategory)
}
