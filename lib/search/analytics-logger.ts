interface SearchLogInput {
  userId: string
  query: string
  userLanguage: string
  filters: Record<string, unknown>
  resultCount: number
  searchTime: number
  cacheHit: boolean
}

class AnalyticsLogger {
  private logs: SearchLogInput[] = []

  logSearch(entry: SearchLogInput): string {
    this.logs.push(entry)
    return `search_${Date.now()}_${this.logs.length}`
  }

  getRecent(limit = 100): SearchLogInput[] {
    return this.logs.slice(-limit)
  }
}

let globalLogger: AnalyticsLogger | null = null

export function getAnalyticsLogger(): AnalyticsLogger {
  if (!globalLogger) {
    globalLogger = new AnalyticsLogger()
  }
  return globalLogger
}
