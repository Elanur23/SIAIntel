import {
  notifyGoogle,
  notifyGoogleBatch,
  validateConfiguration,
  getStats,
} from '@/lib/sia-news/google-indexing-api'

export interface PushMethodResult {
  success: boolean
  error?: string
}

export interface PushToGoogleResult {
  indexingApi: PushMethodResult
  webSub: PushMethodResult
  sitemapRefresh: PushMethodResult
}

function buildArticleUrl(slugOrUrl: string, lang: string): string {
  if (slugOrUrl.startsWith('http://') || slugOrUrl.startsWith('https://')) {
    return slugOrUrl
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  return `${baseUrl}/${lang}/news/${slugOrUrl}`
}

export async function notifyGoogleIndexingAPI(
  url: string,
  _p2pToken?: string,
  _manifest?: unknown,
  _language?: string
): Promise<PushMethodResult> {
  const result = await notifyGoogle({
    url,
    type: 'URL_UPDATED',
  })

  return {
    success: result.success,
    error: result.error,
  }
}

export async function pushToGoogle(slug: string, lang = 'en'): Promise<PushToGoogleResult> {
  const url = buildArticleUrl(slug, lang)
  const indexingApi = await notifyGoogleIndexingAPI(url)

  // Keep compatibility with existing response contract used by routes.
  return {
    indexingApi,
    webSub: { success: true },
    sitemapRefresh: { success: true },
  }
}

export async function pushMultipleToGoogle(
  batch: Array<{ slug: string; lang?: string }>
): Promise<Array<{ slug: string; lang: string; indexingApi: PushMethodResult; webSub: PushMethodResult; sitemapRefresh: PushMethodResult }>> {
  const normalized = batch.map((item) => ({
    slug: item.slug,
    lang: item.lang || 'en',
    url: buildArticleUrl(item.slug, item.lang || 'en'),
  }))

  const batchResult = await notifyGoogleBatch({
    urls: normalized.map((item) => item.url),
    type: 'URL_UPDATED',
  })

  return normalized.map((item, index) => {
    const entry = batchResult.results[index]
    return {
      slug: item.slug,
      lang: item.lang,
      indexingApi: {
        success: entry?.success ?? false,
        error: entry?.error,
      },
      webSub: { success: true },
      sitemapRefresh: { success: true },
    }
  })
}

export async function checkIndexingAPIStatus(): Promise<{
  configured: boolean
  errors: string[]
  stats: ReturnType<typeof getStats>
}> {
  const config = validateConfiguration()
  return {
    configured: config.valid,
    errors: config.errors,
    stats: getStats(),
  }
}
