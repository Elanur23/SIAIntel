import type { Language } from '@/lib/store/language-store'

export interface TrackingContext {
  source?: string
  medium?: string
  campaign?: string
}

export function generateSourceVerificationUrl(
  articleId: string,
  lang: Language,
  tracking: TrackingContext = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  const url = new URL(`${baseUrl}/${lang}/news/${articleId}`)

  if (tracking.source) url.searchParams.set('utm_source', tracking.source)
  if (tracking.medium) url.searchParams.set('utm_medium', tracking.medium)
  if (tracking.campaign) url.searchParams.set('utm_campaign', tracking.campaign)

  return url.toString()
}

export function trackCTAClick(
  articleId: string,
  lang: Language,
  ctaId: string,
  metadata: Record<string, unknown> = {}
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[CTA_TRACK]', {
      articleId,
      lang,
      ctaId,
      metadata,
      timestamp: new Date().toISOString(),
    })
  }
}
