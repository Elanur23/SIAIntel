/**
 * RSS haberlerini content buffer için GeneratedArticle formatına çevirir.
 */

import type { GeneratedArticle } from '@/lib/sia-news/types';
import type { NewsItem } from '@/lib/sovereign-core/scout';

const DEFAULT_METADATA = {
  generatedAt: new Date().toISOString(),
  confidenceScore: 75,
  eeatScore: 70,
  wordCount: 0,
  readingTime: 2,
  sources: [] as string[],
  processingTime: 0
};

const DEFAULT_SENTIMENT = {
  overall: 0,
  zone: 'NEUTRAL' as const,
  byEntity: {},
  confidence: 0.5,
  timestamp: new Date().toISOString()
};

/**
 * Tek bir NewsItem -> GeneratedArticle (buffer'a uygun minimal)
 */
export function newsItemToGeneratedArticle(item: NewsItem): GeneratedArticle {
  const summary = (item.content || item.title).slice(0, 300);
  const fullContent = (item.content || item.title).slice(0, 2000) || summary;
  const wordCount = fullContent.split(/\s+/).length;

  return {
    id: item.id,
    language: 'en',
    region: 'US',
    headline: item.title.slice(0, 120),
    summary,
    siaInsight: summary,
    riskDisclaimer: 'This is a third-party news summary. Not financial advice.',
    fullContent,
    technicalGlossary: [],
    sentiment: { ...DEFAULT_SENTIMENT },
    entities: [],
    causalChains: [],
    metadata: {
      ...DEFAULT_METADATA,
      wordCount,
      sources: item.source ? [item.source] : []
    },
    eeatScore: 70,
    originalityScore: 80,
    technicalDepth: 'MEDIUM',
    adSenseCompliant: true
  };
}
