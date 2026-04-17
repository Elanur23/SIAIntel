import fs from 'fs/promises'
import path from 'path'
import { PUBLIC_ROUTE_LOCALES, type PublicRouteLocale } from '@/lib/i18n/route-locales'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const DEFAULT_DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000
const PUBLIC_ROUTE_LOCALE_SET = new Set<string>(PUBLIC_ROUTE_LOCALES)
const recentSubmissionByUrl = new Map<string, number>()

export type IndexNowSkipReason =
  | 'missing-key'
  | 'invalid-site-url'
  | 'no-eligible-urls'
  | 'deduped'
  | 'missing-key-file'

export interface IndexNowSubmissionResult {
  success: boolean
  submitted: boolean
  skipped: boolean
  skipReason?: IndexNowSkipReason
  reason?: string
  error?: string
  acceptedUrls: string[]
}

function getPublicSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://siaintel.com'
  ).replace(/\/+$/, '')
}

function getPublicSiteUrlObject(): URL | null {
  try {
    return new URL(getPublicSiteBaseUrl())
  } catch {
    return null
  }
}

function getDedupeWindowMs(): number {
  const raw = Number(process.env.INDEXNOW_DEDUPE_WINDOW_MS)
  if (Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw)
  }
  return DEFAULT_DEDUPE_WINDOW_MS
}

function pruneExpiredDedupeEntries(now: number, dedupeWindowMs: number): void {
  for (const [url, submittedAt] of recentSubmissionByUrl.entries()) {
    if (now - submittedAt >= dedupeWindowMs) {
      recentSubmissionByUrl.delete(url)
    }
  }
}

function normalizeAbsoluteUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    parsed.hash = ''
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

function isEligibleNewsDetailUrl(url: URL, siteHost: string): boolean {
  if (url.hostname !== siteHost) return false
  if (url.search || url.hash) return false

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    return false
  }

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length !== 3) return false

  const locale = segments[0].toLowerCase()
  if (!PUBLIC_ROUTE_LOCALE_SET.has(locale)) return false
  if (segments[1] !== 'news') return false

  const slug = decodeURIComponent(segments[2]).trim()
  if (!slug) return false

  return true
}

async function resolveIndexNowKeyLocation(baseUrl: URL, key: string): Promise<string | null> {
  const configured = process.env.INDEXNOW_KEY_LOCATION?.trim()
  if (configured) {
    try {
      const parsed = new URL(configured)
      return parsed.toString()
    } catch {
      // If it's a relative path like "/indexnow-key.txt"
      return `${baseUrl.origin}${configured.startsWith('/') ? '' : '/'}${configured}`
    }
  }

  // Check for the standard dynamic route first
  // No need for fs.access as it's a route handled by Next.js
  return `${baseUrl.origin}/indexnow-key.txt`
}

export function mapArticleLanguageToRouteLocale(articleLanguage: string): PublicRouteLocale | null {
  const normalized = (articleLanguage || '').toLowerCase()

  if (normalized === 'jp') return 'ja'
  if (normalized === 'ar') return null
  if (PUBLIC_ROUTE_LOCALE_SET.has(normalized)) return normalized as PublicRouteLocale

  return null
}

export function resetIndexNowDedupeForTests(): void {
  recentSubmissionByUrl.clear()
}

export async function submitUrlsToIndexNow(
  urls: string[],
  source = 'unknown'
): Promise<IndexNowSubmissionResult> {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) {
    return {
      success: false,
      submitted: false,
      skipped: true,
      skipReason: 'missing-key',
      reason: 'INDEXNOW_KEY is not configured',
      acceptedUrls: [],
    }
  }

  const siteUrl = getPublicSiteUrlObject()
  if (!siteUrl) {
    return {
      success: false,
      submitted: false,
      skipped: true,
      skipReason: 'invalid-site-url',
      reason: 'NEXT_PUBLIC_BASE_URL is not a valid absolute URL',
      acceptedUrls: [],
    }
  }

  const uniqueCandidates = Array.from(
    new Set(urls.map((url) => normalizeAbsoluteUrl(url)).filter((url): url is string => Boolean(url)))
  )

  const eligibleUrls = uniqueCandidates.filter((candidate) => {
    try {
      return isEligibleNewsDetailUrl(new URL(candidate), siteUrl.hostname)
    } catch {
      return false
    }
  })

  if (eligibleUrls.length === 0) {
    return {
      success: false,
      submitted: false,
      skipped: true,
      skipReason: 'no-eligible-urls',
      reason: 'No canonical public article detail URLs were eligible for IndexNow',
      acceptedUrls: [],
    }
  }

  const now = Date.now()
  const dedupeWindowMs = getDedupeWindowMs()
  pruneExpiredDedupeEntries(now, dedupeWindowMs)

  const freshUrls = eligibleUrls.filter((url) => {
    const previous = recentSubmissionByUrl.get(url)
    return typeof previous !== 'number' || now - previous >= dedupeWindowMs
  })

  if (freshUrls.length === 0) {
    return {
      success: true,
      submitted: false,
      skipped: true,
      skipReason: 'deduped',
      reason: 'Skipped duplicate IndexNow submission inside dedupe window',
      acceptedUrls: eligibleUrls,
    }
  }

  const keyLocation = await resolveIndexNowKeyLocation(siteUrl, key)
  if (!keyLocation) {
    return {
      success: false,
      submitted: false,
      skipped: true,
      skipReason: 'missing-key-file',
      reason: 'IndexNow key file is not available (public/<INDEXNOW_KEY>.txt or INDEXNOW_KEY_LOCATION)',
      acceptedUrls: [],
    }
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: siteUrl.hostname,
        key,
        keyLocation,
        urlList: freshUrls,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return {
        success: false,
        submitted: false,
        skipped: false,
        error: `IndexNow request failed (${response.status}): ${body.slice(0, 280)}`,
        acceptedUrls: freshUrls,
      }
    }

    for (const url of freshUrls) {
      recentSubmissionByUrl.set(url, now)
    }

    return {
      success: true,
      submitted: true,
      skipped: false,
      acceptedUrls: freshUrls,
    }
  } catch (error) {
    return {
      success: false,
      submitted: false,
      skipped: false,
      error: `[${source}] ${error instanceof Error ? error.message : 'Unknown IndexNow error'}`,
      acceptedUrls: freshUrls,
    }
  }
}
