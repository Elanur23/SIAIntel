import { notifySearchEngines, notifySearchEnginesBatch } from '@/lib/seo/global-search-engine-push'

export interface AutoIndexingInput {
  slug?: string
  url?: string
  lang?: string
  urls?: string[]
}

export async function triggerAutoIndexing(input: AutoIndexingInput): Promise<{
  success: boolean
  results: unknown
}> {
  if (Array.isArray(input.urls) && input.urls.length > 0) {
    const results = await notifySearchEnginesBatch(input.urls)
    return {
      success: results.some((result) => result.success),
      results,
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  const lang = input.lang || 'en'
  const url = input.url || `${baseUrl}/${lang}/news/${input.slug || ''}`
  const result = await notifySearchEngines(url)

  return {
    success: result.success,
    results: result,
  }
}
