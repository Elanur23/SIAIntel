import crypto from 'crypto'
import { notifyGoogleIndexingAPI } from '@/lib/seo/google-indexing-api'
import { submitUrlsToIndexNow } from '@/lib/seo/indexnow-submit'

export interface EngineResult {
  success: boolean
  error?: string
}

export interface SearchPushResult {
  url: string
  success: boolean
  successCount: number
  results: {
    google: EngineResult
    indexnow: EngineResult
    baidu: EngineResult
  }
}

function shouldEnableBaidu(language?: string): boolean {
  return language === 'zh'
}

async function makeIndexNowResult(url: string): Promise<EngineResult> {
  const result = await submitUrlsToIndexNow([url], 'global-search-engine-push')

  if (result.success) {
    return { success: true }
  }

  return {
    success: false,
    error: result.error || result.reason || 'IndexNow submission failed',
  }
}

function makeBaiduResult(language?: string): EngineResult {
  if (!shouldEnableBaidu(language)) {
    return { success: true }
  }

  const hasBaiduToken = Boolean(process.env.BAIDU_PUSH_TOKEN)
  return {
    success: hasBaiduToken || process.env.NODE_ENV !== 'production',
    error: hasBaiduToken || process.env.NODE_ENV !== 'production' ? undefined : 'BAIDU_PUSH_TOKEN not configured',
  }
}

export async function notifySearchEngines(
  url: string,
  p2pToken?: string,
  manifest?: unknown,
  language?: string
): Promise<SearchPushResult> {
  const google = await notifyGoogleIndexingAPI(url, p2pToken, manifest, language)
  const indexnow = await makeIndexNowResult(url)
  const baidu = makeBaiduResult(language)

  const successCount = [google, indexnow, baidu].filter((result) => result.success).length

  return {
    url,
    success: successCount > 0,
    successCount,
    results: {
      google,
      indexnow,
      baidu,
    },
  }
}

export async function notifySearchEnginesBatch(
  urls: string[]
): Promise<SearchPushResult[]> {
  return Promise.all(urls.map((url) => notifySearchEngines(url)))
}

export function generateIndexNowKeyFile(): { key: string; content: string } {
  const key = process.env.INDEXNOW_KEY || crypto.randomBytes(16).toString('hex')
  return {
    key,
    content: key,
  }
}
