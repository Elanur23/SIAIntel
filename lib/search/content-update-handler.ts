export interface UpdateEvent {
  contentId?: string
  languages?: string[]
  [key: string]: unknown
}

export interface UpdateResult {
  success: boolean
  contentId: string
  updatedLanguages: string[]
  failedLanguages: string[]
  totalTime: number
  errors: string[]
}

class ContentUpdateHandler {
  async handleUpdate(event: UpdateEvent): Promise<UpdateResult> {
    const start = Date.now()
    const contentId = String(event.contentId || 'unknown-content')
    const languages = Array.isArray(event.languages) && event.languages.length > 0 ? event.languages : ['en']

    return {
      success: true,
      contentId,
      updatedLanguages: languages,
      failedLanguages: [],
      totalTime: Date.now() - start,
      errors: [],
    }
  }
}

let globalHandler: ContentUpdateHandler | null = null

export function getContentUpdateHandler(): ContentUpdateHandler {
  if (!globalHandler) {
    globalHandler = new ContentUpdateHandler()
  }
  return globalHandler
}
