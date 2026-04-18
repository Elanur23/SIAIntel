/**
 * Expert Attribution System
 * 
 * Assigns expert analysts to articles based on content category
 * for E-E-A-T authority building
 */

import { getExpertByCategory, type ExpertPersona, type ExpertCategory } from './council-of-five'
import type { GeneratedArticle } from '@/lib/sia-news/types'

/**
 * Map article entities to expert categories
 */
export function determineExpertCategory(article: GeneratedArticle): ExpertCategory {
  // Check entities for category hints
  const hasCrypto = article.entities.some(e => 
    e.category === 'CRYPTOCURRENCY' || 
    e.primaryName.toLowerCase().includes('bitcoin') ||
    e.primaryName.toLowerCase().includes('crypto')
  )
  
  const hasMacro = article.entities.some(e =>
    e.category === 'CENTRAL_BANK' ||
    e.primaryName.toLowerCase().includes('fed') ||
    e.primaryName.toLowerCase().includes('interest rate')
  )
  
  const hasCommodity = article.entities.some(e =>
    e.category === 'COMMODITY' ||
    e.primaryName.toLowerCase().includes('gold') ||
    e.primaryName.toLowerCase().includes('oil')
  )
  
  const hasTech = article.entities.some(e =>
    e.primaryName.toLowerCase().includes('ai') ||
    e.primaryName.toLowerCase().includes('tech') ||
    e.primaryName.toLowerCase().includes('semiconductor')
  )
  
  // Priority order: Crypto > Macro > Commodities > Tech > Emerging Markets
  if (hasCrypto) return 'CRYPTO_BLOCKCHAIN'
  if (hasMacro) return 'MACRO_ECONOMY'
  if (hasCommodity) return 'COMMODITIES'
  if (hasTech) return 'TECH_STOCKS'
  
  // Default to emerging markets for regional content
  return 'EMERGING_MARKETS'
}

/**
 * Assign expert to article
 */
export function assignExpertToArticle(article: GeneratedArticle): ExpertPersona {
  const category = determineExpertCategory(article)
  return getExpertByCategory(category)
}

/**
 * Generate author attribution text
 */
export function generateAuthorAttribution(
  expert: ExpertPersona,
  language: string
): string {
  const attributionTemplates: Record<string, string> = {
    en: `Analysis by ${expert.name}, ${expert.title}`,
    tr: `Analiz: ${expert.name}, ${expert.title}`,
    de: `Analyse von ${expert.name}, ${expert.title}`,
    fr: `Analyse par ${expert.name}, ${expert.title}`,
    es: `Análisis por ${expert.name}, ${expert.title}`,
    ru: `Анализ: ${expert.name}, ${expert.title}`,
    ar: `تحليل بواسطة ${expert.name}، ${expert.title}`,
    jp: `分析：${expert.name}、${expert.title}`,
    zh: `分析：${expert.name}，${expert.title}`
  }
  
  return attributionTemplates[language] || attributionTemplates.en
}

/**
 * Generate expert byline for article
 */
export interface ExpertByline {
  name: string
  title: string
  bio: string
  profileUrl: string
  imageUrl: string
  expertise: string[]
  yearsExperience: number
}

export function generateExpertByline(
  article: GeneratedArticle
): ExpertByline {
  const expert = assignExpertToArticle(article)
  const bio = expert.bio[article.language] || expert.bio.en
  
  return {
    name: expert.name,
    title: expert.title,
    bio,
    profileUrl: `/experts/${expert.id}`,
    imageUrl: expert.imageUrl,
    expertise: expert.expertise.slice(0, 3),
    yearsExperience: expert.yearsExperience
  }
}

export default assignExpertToArticle
