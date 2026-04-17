import type { NeuralSearchRequest, SearchResult } from '@/lib/search/types'

interface NeuralSearchMetrics {
  embeddingTime: number
  vectorSearchTime: number
  translationTime: number
  cacheHit: boolean
  protectedTermsDetected: string[]
}

interface NeuralSearchEngineResult {
  items: SearchResult[]
  total: number
  metrics: NeuralSearchMetrics
}

class NeuralSearchEngine {
  async search(request: NeuralSearchRequest): Promise<NeuralSearchEngineResult> {
    const start = Date.now()

    // Lightweight placeholder result set; keep contract stable for callers.
    const items: SearchResult[] = []

    return {
      items,
      total: items.length,
      metrics: {
        embeddingTime: 0,
        vectorSearchTime: Date.now() - start,
        translationTime: 0,
        cacheHit: false,
        protectedTermsDetected: this.detectProtectedTerms(request.query),
      },
    }
  }

  private detectProtectedTerms(query: string): string[] {
    const protectedTerms = ['fomc', 'cpi', 'bitcoin', 'ethereum', 'nasdaq', 'fed']
    const lower = query.toLowerCase()
    return protectedTerms.filter((term) => lower.includes(term))
  }
}

let globalEngine: NeuralSearchEngine | null = null

export function getNeuralSearchEngine(): NeuralSearchEngine {
  if (!globalEngine) {
    globalEngine = new NeuralSearchEngine()
  }
  return globalEngine
}
