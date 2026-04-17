import type { Language } from '@/lib/dispatcher/types'

export interface SlugOptions {
  maxLength?: number
}

function sanitizeSlugPart(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function generateSlug(title: string, _language: Language, options: SlugOptions = {}): string {
  const maxLength = options.maxLength || 80
  const slug = sanitizeSlugPart(title)

  if (!slug) {
    return 'untitled'
  }

  if (slug.length <= maxLength) {
    return slug
  }

  return slug.slice(0, maxLength).replace(/-+$/g, '')
}

export function generateMultilingualUrls(
  articleId: string,
  slugs: Record<Language, string>,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
): Record<Language, string> {
  const entries = Object.entries(slugs).map(([language, slug]) => [
    language,
    `${baseUrl}/${language}/news/${articleId}-${slug}`,
  ])

  return Object.fromEntries(entries) as Record<Language, string>
}
