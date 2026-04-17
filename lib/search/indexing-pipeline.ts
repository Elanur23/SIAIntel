export interface PublicationEvent {
  contentId?: string
  articleId?: string
  languages?: string[]
  [key: string]: unknown
}

export interface PipelineResult {
  success: boolean
  contentId: string
  indexedLanguages: string[]
  failedLanguages: string[]
  totalTime: number
  errors?: string[]
}

class IndexingPipeline {
  async processPublication(event: PublicationEvent): Promise<PipelineResult> {
    const start = Date.now()
    const contentId = String(event.contentId || event.articleId || 'unknown-content')
    const languages = Array.isArray(event.languages) && event.languages.length > 0 ? event.languages : ['en']

    return {
      success: true,
      contentId,
      indexedLanguages: languages,
      failedLanguages: [],
      totalTime: Date.now() - start,
      errors: [],
    }
  }
}

let globalPipeline: IndexingPipeline | null = null

export function getIndexingPipeline(): IndexingPipeline {
  if (!globalPipeline) {
    globalPipeline = new IndexingPipeline()
  }
  return globalPipeline
}
