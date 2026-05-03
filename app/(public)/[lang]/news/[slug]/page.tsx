/**
 * SIA DYNAMIC NEWS ARTICLE - V10.0 (FULL SUITE: DEBRIEFING + SOCIAL DISTRIBUTION)
 * FEATURES: DEBRIEFING SYSTEM | REPORT EXPORT | SOCIAL SHARE SUITE | E-E-A-T | 9-LANG SEO | DISCOVER OPTIMIZED
 */
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import {
  Clock,
  Zap,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  User,
  Radio,
  Share2,
  Download,
  Terminal,
} from 'lucide-react'
import GroundingVerificationBadge from '@/components/GroundingVerificationBadge'
import TechnicalChart from '@/components/TechnicalChart'
import RelatedIntelligenceNodes from '@/components/RelatedIntelligenceNodes'
import IntelligenceDebriefing from '@/components/IntelligenceDebriefing'
import SocialShareSuite from '@/components/SocialShareSuite'
import LegalStamp from '@/components/LegalStamp'
import dynamic from 'next/dynamic'
import { formatArticleBody } from '@/lib/content/article-formatter'
import { Locale } from '@/lib/i18n/dictionaries'
import Image from 'next/image'
import SiaSchemaInjector from '@/components/SiaSchemaInjector'
import { getAllExperts } from '@/lib/identity/council-of-five'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { buildSpeakableForVisibleSummary } from '@/lib/seo/speakable-surface'
import { buildDatasetForVisibleSignals } from '@/lib/seo/dataset-surface'
import { buildVisibleSummaryWithIntroFallback } from '@/lib/seo/golden-keyword-prelaunch'
import type { SupportedLang } from '@/lib/articles/types'

const SiaRadarVisual = dynamic(() => import('@/components/SiaRadarVisual'), { ssr: false })
import {
  ARTICLE_LANGUAGE_LOCALES,
  getLocalizedArticleValue,
  normalizeArticleLanguage,
} from '@/lib/warroom/article-localization'
import {
  HREFLANG_BY_ROUTE_LOCALE,
  type PublicRouteLocale,
  PUBLIC_ROUTE_LOCALES,
  normalizePublicRouteLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

function getDirectArticleLanguageForRouteLocale(locale: PublicRouteLocale): SupportedLang | null {
  if (locale === 'ja') return 'jp'
  if (locale === 'pt-br') return null
  return locale as SupportedLang
}

function toRouteLocaleFromArticleLanguage(language: string): PublicRouteLocale {
  if (language === 'jp') return 'ja'
  if (language === 'ar') return 'en'
  return normalizePublicRouteLocale(language)
}

function getCategoryPageSlug(rawCategory?: string): string {
  const category = (rawCategory || '').trim().toUpperCase()
  if (!category) return 'intelligence'
  if (category === 'AI') return 'ai'
  if (category.startsWith('CRYPTO')) return 'crypto'
  if (category === 'STOCKS' || category.includes('STOCK') || category === 'MARKET') return 'stocks'
  if (category === 'ECONOMY' || category.includes('ECONOMY')) return 'economy'
  return category.toLowerCase()
}

function normalizePersonName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

interface ArticlePageProps {
  params: { lang: string; slug: string }
}

function calculateReadTime(text: string): number {
  const wordsPerMinute = 200
  const noOfWords = (text || '').split(/\s+/g).length
  return Math.ceil(noOfWords / wordsPerMinute)
}

const SUPPORTED_ARTICLE_LANGS: SupportedLang[] = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'ru',
  'ar',
  'jp',
  'zh',
]
const SUPPORTED_ARTICLE_LANG_SET = new Set<SupportedLang>(SUPPORTED_ARTICLE_LANGS)

interface NormalizedTranslationRecord {
  lang: string
  title: string
  excerpt: string
  content: string
  slug: string
}

interface NormalizedArticleRecord {
  id: string
  category: string
  publishedAt: Date
  updatedAt: Date
  imageUrl: string | null
  impact: number | null
  confidence: number | null
  signal: string | null
  translations: NormalizedTranslationRecord[]
}

interface ResolvedDetailArticle {
  source: 'article' | 'warroom'
  id: string
  category: string
  publishedAt: Date
  updatedAt: Date
  imageUrl: string | null
  confidence: number
  impact: number
  sentiment: string | null
  datasetConfidence: number | null
  datasetImpact: number | null
  datasetSignal: string | null
  authorName: string
  authorRole: string
  title: string
  summary: string
  body: string
  insight: string
  risk: string
  canonicalSlug: string
  canonicalRouteLocale: PublicRouteLocale
  isLocaleAvailable: (locale: PublicRouteLocale) => boolean
  getSlugForLocale: (locale: PublicRouteLocale) => string | null
  getTitleForLocale: (locale: PublicRouteLocale) => string
}

function toSupportedArticleLang(routeLocale: PublicRouteLocale): SupportedLang {
  const mapped = toDictionaryLocale(routeLocale)
  if (SUPPORTED_ARTICLE_LANG_SET.has(mapped as SupportedLang)) {
    return mapped as SupportedLang
  }
  return 'en'
}

function isLikelyCuid(value: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(value)
}

/**
 * Validates that a raw slug parameter conforms to canonical news article slug format.
 * Accepts:
 * - Canonical format: {title-slug}--{articleId} (both parts non-empty)
 * - Direct CUID: c[a-z0-9]{24}
 * Rejects:
 * - Empty slugs
 * - Malformed slugs without -- separator (unless valid CUID)
 * - Slugs where slug part or id part is empty
 */
function isCanonicalNewsSlug(rawSlug: string): boolean {
  const slug = (rawSlug || '').trim()
  
  // Reject empty slugs
  if (!slug) {
    return false
  }
  
  // Accept direct CUID format
  if (isLikelyCuid(slug)) {
    return true
  }
  
  // Check for canonical format: {slug}--{id}
  if (slug.includes('--')) {
    const splitIndex = slug.lastIndexOf('--')
    const slugPart = slug.slice(0, splitIndex).trim()
    const idPart = slug.slice(splitIndex + 2).trim()
    
    // Both parts must be non-empty
    return slugPart.length > 0 && idPart.length > 0
  }
  
  // Reject slugs without -- separator that aren't valid CUIDs
  return false
}

function parseRouteSlugParam(rawSlug: string): {
  idCandidates: string[]
  slugCandidates: string[]
} {
  const slug = (rawSlug || '').trim()
  const idCandidates = new Set<string>()
  const slugCandidates = new Set<string>()

  if (!slug) {
    return {
      idCandidates: [],
      slugCandidates: [],
    }
  }

  slugCandidates.add(slug)

  if (slug.includes('--')) {
    const splitIndex = slug.lastIndexOf('--')
    const slugPart = slug.slice(0, splitIndex).trim()
    const idPart = slug.slice(splitIndex + 2).trim()

    if (slugPart) slugCandidates.add(slugPart)
    if (idPart) idCandidates.add(idPart)
  }

  if (isLikelyCuid(slug)) {
    idCandidates.add(slug)
  }

  return {
    idCandidates: Array.from(idCandidates),
    slugCandidates: Array.from(slugCandidates),
  }
}

function pickBestTranslation(
  translations: NormalizedTranslationRecord[],
  preferredLang: SupportedLang
): NormalizedTranslationRecord | null {
  if (!translations.length) return null

  return (
    translations.find((translation) => translation.lang === preferredLang) ||
    translations.find((translation) => translation.lang === 'en') ||
    translations[0]
  )
}

function mapNormalizedArticle(
  article: NormalizedArticleRecord,
  routeLang: PublicRouteLocale,
  slugHint?: string
): ResolvedDetailArticle | null {
  const preferredLang = toSupportedArticleLang(routeLang)
  const currentTranslation = pickBestTranslation(article.translations, preferredLang)
  if (!currentTranslation) return null

  const getTranslationForLocale = (
    locale: PublicRouteLocale
  ): NormalizedTranslationRecord | null => {
    const localeLang = toSupportedArticleLang(locale)
    return pickBestTranslation(article.translations, localeLang)
  }

  const getDirectTranslationForLocale = (
    locale: PublicRouteLocale
  ): NormalizedTranslationRecord | null => {
    const requiredLang = getDirectArticleLanguageForRouteLocale(locale)
    if (!requiredLang) return null

    return (
      article.translations.find(
        (translation) =>
          translation.lang === requiredLang &&
          translation.slug.trim().length > 0 &&
          translation.title.trim().length > 0 &&
          translation.content.trim().length > 0
      ) || null
    )
  }

  const canonicalRouteLocale = (() => {
    const directLanguage = getDirectArticleLanguageForRouteLocale(routeLang)
    if (directLanguage && getDirectTranslationForLocale(routeLang)) {
      return routeLang
    }

    if (getDirectTranslationForLocale('en')) {
      return 'en'
    }

    return toRouteLocaleFromArticleLanguage(currentTranslation.lang)
  })()

  const canonicalSlug = currentTranslation.slug || slugHint || article.id
  const datasetConfidence = typeof article.confidence === 'number' ? article.confidence : null
  const datasetImpact = typeof article.impact === 'number' ? article.impact : null
  const datasetSignal = typeof article.signal === 'string' ? article.signal : null

  return {
    source: 'article',
    id: article.id,
    category: article.category || 'MARKET',
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    imageUrl: article.imageUrl,
    confidence: Number(datasetConfidence ?? 94),
    impact: Number(datasetImpact ?? 5),
    sentiment: datasetSignal,
    datasetConfidence,
    datasetImpact,
    datasetSignal,
    authorName: 'SIA Intelligence Unit',
    authorRole: 'Senior Analyst',
    title: currentTranslation.title || 'Untitled Report',
    summary: currentTranslation.excerpt || '',
    body: currentTranslation.content || '',
    insight: currentTranslation.excerpt || '',
    risk: '',
    canonicalSlug,
    canonicalRouteLocale,
    isLocaleAvailable: (locale: PublicRouteLocale): boolean => {
      return getDirectTranslationForLocale(locale) !== null
    },
    getSlugForLocale: (locale: PublicRouteLocale): string | null => {
      const translation = getDirectTranslationForLocale(locale)
      return translation?.slug || null
    },
    getTitleForLocale: (locale: PublicRouteLocale): string => {
      const translation = getTranslationForLocale(locale)
      return translation?.title || currentTranslation.title || 'SIA Intelligence Report'
    },
  }
}

function mapWarRoomArticle(
  article: Record<string, unknown>,
  routeLang: PublicRouteLocale
): ResolvedDetailArticle {
  const contentLang = normalizeArticleLanguage(routeLang)
  const title = getLocalizedArticleValue(article, 'title', contentLang) || 'Untitled Report'
  const summary = getLocalizedArticleValue(article, 'summary', contentLang) || ''

  const getTitleForLocale = (locale: PublicRouteLocale): string => {
    const localeLang = toDictionaryLocale(locale)
    return getLocalizedArticleValue(article, 'title', localeLang) || title
  }

  const getSlugForLocale = (locale: PublicRouteLocale): string | null => {
    const requiredLang = getDirectArticleLanguageForRouteLocale(locale)
    if (!requiredLang) return null

    const localizedTitle = getLocalizedArticleValue(article, 'title', requiredLang, [])
    if (!localizedTitle) return null

    const articleId = String(article.id || '')
    return buildArticleSlug(articleId, localizedTitle || articleId)
  }

  const isLocaleAvailable = (locale: PublicRouteLocale): boolean => {
    const requiredLang = getDirectArticleLanguageForRouteLocale(locale)
    if (!requiredLang) return false

    return (
      Boolean(getLocalizedArticleValue(article, 'title', requiredLang, [])) &&
      Boolean(getLocalizedArticleValue(article, 'content', requiredLang, []))
    )
  }

  const canonicalRouteLocale = (() => {
    if (isLocaleAvailable(routeLang)) {
      return routeLang
    }

    if (isLocaleAvailable('en')) {
      return 'en'
    }

    for (const locale of PUBLIC_ROUTE_LOCALES) {
      if (isLocaleAvailable(locale)) {
        return locale
      }
    }

    return 'en'
  })()

  const articleId = String(article.id || '')
  const parsedConfidence = Number(article.confidence)
  const parsedImpact = Number(article.marketImpact)
  const datasetConfidence = Number.isFinite(parsedConfidence) ? parsedConfidence : null
  const datasetImpact = Number.isFinite(parsedImpact) ? parsedImpact : null
  const datasetSignal = typeof article.sentiment === 'string' ? article.sentiment : null

  return {
    source: 'warroom',
    id: articleId,
    category: String(article.category || 'MARKET'),
    publishedAt: new Date(String(article.publishedAt || new Date().toISOString())),
    updatedAt: new Date(
      String(article.updatedAt || article.publishedAt || new Date().toISOString())
    ),
    imageUrl: typeof article.imageUrl === 'string' ? article.imageUrl : null,
    confidence: Number(datasetConfidence ?? 94),
    impact: Number(datasetImpact ?? 5),
    sentiment: datasetSignal,
    datasetConfidence,
    datasetImpact,
    datasetSignal,
    authorName: String(article.authorName || 'SIA Intelligence Unit'),
    authorRole: String(article.authorRole || 'Senior Analyst'),
    title,
    summary,
    body: getLocalizedArticleValue(article, 'content', contentLang) || '',
    insight: getLocalizedArticleValue(article, 'siaInsight', contentLang) || '',
    risk: getLocalizedArticleValue(article, 'riskShield', contentLang) || '',
    canonicalSlug: buildArticleSlug(articleId, title || articleId),
    canonicalRouteLocale,
    isLocaleAvailable,
    getSlugForLocale,
    getTitleForLocale,
  }
}

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function resolveFromNormalizedModel(
  slugParam: string,
  routeLang: PublicRouteLocale
): Promise<ResolvedDetailArticle | null> {
  const normalizedSlug = normalizeSlug(slugParam)
  const { idCandidates, slugCandidates } = parseRouteSlugParam(slugParam)

  console.log({
    incoming: slugParam,
    normalized: normalizedSlug,
  })

  if (idCandidates.length > 0) {
    const byId = await prisma.article.findFirst({
      where: {
        id: { in: idCandidates },
        published: true,
      },
      include: {
        translations: true,
      },
    })

    if (byId) {
      return mapNormalizedArticle(byId as unknown as NormalizedArticleRecord, routeLang)
    }
  }

  const preferredLang = toSupportedArticleLang(routeLang)

  for (const slug of slugCandidates) {
    const normalizedCandidate = normalizeSlug(slug)
    
    const preferredTranslation = await prisma.articleTranslation.findUnique({
      where: {
        slug_lang: {
          slug: normalizedCandidate,
          lang: preferredLang,
        },
      },
      include: {
        article: {
          include: {
            translations: true,
          },
        },
      },
    })

    if (preferredTranslation?.article?.published) {
      return mapNormalizedArticle(
        preferredTranslation.article as unknown as NormalizedArticleRecord,
        routeLang,
        slug
      )
    }

    if (preferredLang !== 'en') {
      const englishTranslation = await prisma.articleTranslation.findUnique({
        where: {
          slug_lang: {
            slug: normalizedCandidate,
            lang: 'en',
          },
        },
        include: {
          article: {
            include: {
              translations: true,
            },
          },
        },
      })

      if (englishTranslation?.article?.published) {
        return mapNormalizedArticle(
          englishTranslation.article as unknown as NormalizedArticleRecord,
          routeLang,
          slug
        )
      }
    }
  }

  return null
}

async function resolveFromWarRoomModel(
  slugParam: string,
  routeLang: PublicRouteLocale
): Promise<ResolvedDetailArticle | null> {
  const { idCandidates } = parseRouteSlugParam(slugParam)
  const candidateIds = Array.from(new Set([...idCandidates, slugParam]))

  for (const candidateId of candidateIds) {
    if (!candidateId) continue

    const byId = await prisma.warRoomArticle.findFirst({
      where: {
        id: candidateId,
        status: 'published',
      },
    })

    if (byId) {
      return mapWarRoomArticle(byId as unknown as Record<string, unknown>, routeLang)
    }
  }

  return null
}

async function resolveDetailArticle(
  slugParam: string,
  routeLang: PublicRouteLocale
): Promise<ResolvedDetailArticle | null> {
  const normalized = await resolveFromNormalizedModel(slugParam, routeLang)
  if (normalized) {
    const canonicalSlug = normalized.canonicalSlug
    if (normalizeSlug(slugParam) !== canonicalSlug) {
      redirect(`/${routeLang}/news/${canonicalSlug}`)
    }
    return normalized
  }

  const warroom = await resolveFromWarRoomModel(slugParam, routeLang)
  if (warroom) {
    const canonicalSlug = warroom.canonicalSlug
    if (normalizeSlug(slugParam) !== canonicalSlug) {
      redirect(`/${routeLang}/news/${canonicalSlug}`)
    }
    return warroom
  }

  return null
}

async function getRelatedNodes(
  detailArticle: ResolvedDetailArticle,
  routeLang: PublicRouteLocale
): Promise<
  Array<{
    id: string
    slug: string
    title: string
    summary: string
    category: string
    sentiment: string
    publishedAt: string
    imageUrl: string
    relevanceScore: number
    matchReasons: string[]
  }>
> {
  if (detailArticle.source === 'article') {
    const preferredLang = toSupportedArticleLang(routeLang)

    const related = await prisma.article.findMany({
      where: {
        published: true,
        category: detailArticle.category,
        id: {
          not: detailArticle.id,
        },
      },
      include: {
        translations: {
          where: {
            lang: {
              in: preferredLang === 'en' ? ['en'] : [preferredLang, 'en'],
            },
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 3,
    })

    return related
      .map((article) => {
        const translation =
          article.translations.find((item) => item.lang === preferredLang) ||
          article.translations.find((item) => item.lang === 'en') ||
          article.translations[0]

        if (!translation) return null

        return {
          id: article.id,
          slug: translation.slug || article.id,
          title: translation.title || 'Untitled',
          summary: translation.excerpt || '',
          category: article.category || 'MARKET',
          sentiment: 'NEUTRAL',
          publishedAt: article.publishedAt.toISOString(),
          imageUrl: article.imageUrl || '',
          relevanceScore: 0.8,
          matchReasons: ['same-category'],
        }
      })
      .filter(
        (
          value
        ): value is {
          id: string
          slug: string
          title: string
          summary: string
          category: string
          sentiment: string
          publishedAt: string
          imageUrl: string
          relevanceScore: number
          matchReasons: string[]
        } => value !== null
      )
  }

  const fallbackLang = normalizeArticleLanguage(routeLang)
  const relatedRaw = await prisma.warRoomArticle.findMany({
    where: {
      category: detailArticle.category,
      id: {
        not: detailArticle.id,
      },
      status: 'published',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 3,
  })

  return relatedRaw.map((article) => ({
    id: article.id,
    slug: buildArticleSlug(
      article.id,
      getLocalizedArticleValue(article as Record<string, unknown>, 'title', fallbackLang) ||
        article.id
    ),
    title:
      getLocalizedArticleValue(article as Record<string, unknown>, 'title', fallbackLang) ||
      'Untitled',
    summary:
      getLocalizedArticleValue(article as Record<string, unknown>, 'summary', fallbackLang) || '',
    category: article.category || 'MARKET',
    sentiment: article.sentiment || 'NEUTRAL',
    publishedAt: article.publishedAt.toISOString(),
    imageUrl: article.imageUrl || '',
    relevanceScore: 0.8,
    matchReasons: ['same-category'],
  }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params.lang)
  
  // Early canonical slug validation gate
  if (!isCanonicalNewsSlug(params.slug)) {
    notFound()
  }
  
  const detailArticle = await resolveDetailArticle(params.slug, routeLang)
  if (!detailArticle) {
    notFound()
  }

  const title = detailArticle.title || 'SIA Intelligence Report'
  const description = buildVisibleSummaryWithIntroFallback({
    summary: detailArticle.summary,
    content: detailArticle.body,
    maxLength: 220,
  })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const canonicalRouteLocale = detailArticle.canonicalRouteLocale
  const canonicalSlug =
    detailArticle.getSlugForLocale(canonicalRouteLocale) || detailArticle.canonicalSlug
  const canonicalUrl = `${baseUrl}/${canonicalRouteLocale}/news/${canonicalSlug}`
  const imageUrl = detailArticle.imageUrl || `${baseUrl}/og-image.png`

  const languageAlternates = PUBLIC_ROUTE_LOCALES.reduce(
    (acc, locale) => {
      if (!detailArticle.isLocaleAvailable(locale)) {
        return acc
      }

      const localeSlug = detailArticle.getSlugForLocale(locale)
      if (!localeSlug) {
        return acc
      }

      acc[HREFLANG_BY_ROUTE_LOCALE[locale]] = `${baseUrl}/${locale}/news/${localeSlug}`
      return acc
    },
    {} as Record<string, string>
  )

  languageAlternates[HREFLANG_BY_ROUTE_LOCALE[canonicalRouteLocale]] = canonicalUrl
  const xDefaultUrl = languageAlternates.en || canonicalUrl

  return {
    title: `${title} | SIA Intelligence`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': xDefaultUrl,
        ...languageAlternates,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title,
      description,
      siteName: 'SIA Intelligence',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      publishedTime: detailArticle.publishedAt.toISOString(),
      modifiedTime: detailArticle.updatedAt.toISOString(),
      authors: [detailArticle.authorName || 'SIA Intelligence'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: '@SIAIntel',
      creator: '@SIAIntel',
    },
  }
}

import PdfExportButton from '@/components/PdfExportButton'
import { getDictionary } from '@/lib/i18n/dictionaries'
import LiveAnalystTrigger from '@/components/LiveAnalystTrigger'
import SiaAdUnit from '@/components/SiaAdUnit'
import RevenueMaximizer from '@/components/RevenueMaximizer'

export default async function ArticlePage({ params }: ArticlePageProps) {
  const routeLang = normalizePublicRouteLocale(params.lang)
  
  // Early canonical slug validation gate
  if (!isCanonicalNewsSlug(params.slug)) {
    notFound()
  }
  
  const detailArticle = await resolveDetailArticle(params.slug, routeLang)
  
  // Defensive guard: if no article found, call notFound() immediately
  if (!detailArticle) {
    notFound()
  }

  const lang = normalizeArticleLanguage(routeLang)
  const dict = getDictionary(lang as any)
  const locale = ARTICLE_LANGUAGE_LOCALES[lang]

  const ui = dict.article

  const content = {
    title: detailArticle.title || 'Untitled Report',
    summary: detailArticle.summary || '',
    insight: detailArticle.insight || '',
    risk: detailArticle.risk || '',
    body: detailArticle.body || '',
    category: detailArticle.category || 'MARKET',
    author: detailArticle.authorName || 'SIA Intelligence Unit',
    role: detailArticle.authorRole || 'Senior Analyst',
    time: new Date(detailArticle.publishedAt).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    isoDate: detailArticle.publishedAt.toISOString(),
    image:
      detailArticle.imageUrl ||
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200',
    confidence: detailArticle.confidence || 94,
    impact: detailArticle.impact || 5,
  }

  const matchedExpert = getAllExperts().find(
    (expert) => normalizePersonName(expert.name) === normalizePersonName(content.author || '')
  )
  const authorProfilePath = matchedExpert
    ? `/${routeLang}/experts/${matchedExpert.id}`
    : `/${routeLang}/experts`

  const readTime = calculateReadTime(content.body || '')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const canonicalRouteLocale = detailArticle.canonicalRouteLocale
  const canonicalSlug =
    detailArticle.getSlugForLocale(canonicalRouteLocale) || detailArticle.canonicalSlug
  const canonicalUrl = `${baseUrl}/${canonicalRouteLocale}/news/${canonicalSlug}`
  const visibleSummary = buildVisibleSummaryWithIntroFallback({
    summary: content.summary || '',
    content: content.body || '',
    maxLength: 220,
  })
  const speakable = buildSpeakableForVisibleSummary({
    routeLang,
    summary: visibleSummary,
    selector: '#article-visible-summary',
  })
  const datasetSurface = buildDatasetForVisibleSignals({
    routeLang,
    articleUrl: canonicalUrl,
    title: content.title,
    summary: visibleSummary,
    selector: '#article-visible-signal-dataset',
    category: content.category,
    confidence: detailArticle.datasetConfidence,
    impact: detailArticle.datasetImpact,
    signal: detailArticle.datasetSignal,
    publishedAtIso: detailArticle.publishedAt.toISOString(),
    updatedAtIso: detailArticle.updatedAt.toISOString(),
  })

  const authorSchema: Record<string, unknown> = {
    '@type': 'Person',
    name: content.author || 'SIA Intelligence Unit',
    jobTitle: content.role || 'Senior Analyst',
    knowsAbout: [content.category || 'MARKET', 'Financial Markets'],
  }
  if (matchedExpert) {
    authorSchema.url = `${baseUrl}/${routeLang}/experts/${matchedExpert.id}`
  }

  // 🚀 ENHANCED GOOGLE DISCOVER & NEWS SCHEMA
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['NewsArticle', 'AnalysisNewsArticle'],
    headline: content.title || 'SIA Intelligence Report',
    description: content.summary || 'Intelligence analysis from SIA',
    url: canonicalUrl,
    image: {
      '@type': 'ImageObject',
      url: content.image || `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
    },
    datePublished: content.isoDate || new Date().toISOString(),
    dateModified: content.isoDate || new Date().toISOString(),
    author: [authorSchema],
    publisher: {
      '@type': 'Organization',
      name: 'SIA Intelligence Protocol',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    inLanguage: canonicalRouteLocale,
    isAccessibleForFree: true,
    articleSection: content.category || 'MARKET',
    ...(speakable ? { speakable } : {}),
  }

  // BreadcrumbList schema for Google Discover & rich results
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/${routeLang}` },
      {
        '@type': 'ListItem',
        position: 2,
        name: content.category || 'MARKET',
        item: `${baseUrl}/${routeLang}/${getCategoryPageSlug(content.category)}`,
      },
      { '@type': 'ListItem', position: 3, name: content.title || 'Intelligence Report', item: canonicalUrl },
    ],
  }

  const relatedNodes = await getRelatedNodes(detailArticle, routeLang)

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <SiaSchemaInjector
        schema={structuredData as any}
        breadcrumb={breadcrumbSchema}
        dataset={datasetSurface?.schema}
      />

      <main className="relative z-10">
        {/* --- ARTICLE HEADER --- */}
        <section className="container mx-auto px-4 lg:px-12 py-8">
          <div className="glass-panel machined-edge p-6 md:p-12 relative overflow-hidden border border-white/5 shadow-2xl">
            {/* Background Decor - LCP optimized */}
            <div className="absolute inset-0 z-0 aspect-[16/9]">
              <Image
                src={content.image}
                alt={content.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                fetchPriority="high"
                className="object-cover opacity-20 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#020203] via-[#020203]/80 to-transparent" />
            </div>

            <div className="relative z-10 space-y-6">
              <nav className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-white/40">
                <Link
                  href={`/${routeLang}`}
                  className="hover:text-blue-500 transition-colors flex items-center gap-2"
                >
                  <Terminal size={11} /> {ui.terminal}
                </Link>
                <ChevronRight size={9} />
                <Link
                  href={`/${routeLang}/${getCategoryPageSlug(content.category)}`}
                  className="hover:text-blue-500 transition-colors"
                >
                  {content.category}
                </Link>
                <ChevronRight size={9} />
                <span className="text-white/60 line-clamp-1">{content.title}</span>
              </nav>

              <div className="max-w-5xl space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    INTEL_REPORT_#{detailArticle.id.slice(0, 8).toUpperCase()}
                  </span>
                  <GroundingVerificationBadge
                    confidence={content.confidence}
                    sources={['SIA_Scanner', 'Market_Pulse']}
                  />
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] uppercase italic tracking-tighter">
                  {content.title}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* --- 💎 MAIN ARTICLE BODY --- */}
            <article className="lg:col-span-8 space-y-16">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      {content.role}
                    </span>
                    <Link
                      href={authorProfilePath}
                      className="text-lg font-black text-white uppercase italic hover:text-blue-400 transition-colors"
                    >
                      {content.author}
                    </Link>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                    {ui.readTime}
                  </span>
                  <div className="flex items-center gap-2 text-sm font-black text-white italic">
                    <Clock size={16} className="text-blue-500" />
                    {readTime} {ui.minRead}
                  </div>
                </div>
              </div>

              <div className="-mt-4 flex items-center space-x-0.5 py-2 px-0 border-l-4 border-blue-700/60 bg-white/[0.02] rounded-r-2xl shadow-sm">
                <span className="pl-4 pr-2 text-xs font-semibold tracking-widest text-blue-300 uppercase select-none" style={{letterSpacing:'.13em'}}>Trust & Integrity</span>
                <span className="mx-2 text-white/20 select-none">|</span>
                <Link
                  href={`/${routeLang}/editorial-policy`}
                  className="px-2 py-0.5 text-xs font-medium text-white/80 hover:text-blue-400 transition-colors underline underline-offset-4 decoration-blue-400/30"
                >
                  Editorial Policy
                </Link>
                <span className="mx-1 text-white/20 select-none">•</span>
                <Link
                  href={`/${routeLang}/ai-transparency`}
                  className="px-2 py-0.5 text-xs font-medium text-white/80 hover:text-blue-400 transition-colors underline underline-offset-4 decoration-blue-400/30"
                >
                  AI Transparency
                </Link>
                <span className="mx-1 text-white/20 select-none">•</span>
                <Link
                  href={`/${routeLang}/contact`}
                  className="px-2 py-0.5 text-xs font-medium text-white/80 hover:text-blue-400 transition-colors underline underline-offset-4 decoration-blue-400/30"
                >
                  Contact Editorial
                </Link>
              </div>

              {visibleSummary ? (
                <div
                  id="article-visible-summary"
                  className="article-summary relative p-8 bg-white/[0.02] border-l-4 border-l-blue-600 shadow-lg"
                >
                  <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed italic">
                    &quot;{visibleSummary}&quot;
                  </p>
                </div>
              ) : null}

              {datasetSurface ? (
                <section
                  id="article-visible-signal-dataset"
                  className="p-6 bg-slate-900/40 border border-blue-500/20 rounded-xl space-y-4"
                  aria-label="Visible signal dataset snapshot"
                >
                  <div className="space-y-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                      {datasetSurface.title}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {datasetSurface.description}
                    </p>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {datasetSurface.metrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="rounded-lg border border-white/10 bg-black/30 p-3"
                      >
                        <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {metric.label}
                        </dt>
                        <dd className="mt-2 text-base font-bold text-white break-words">
                          {metric.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black">
                <SiaRadarVisual
                  category={content.category}
                  confidence={content.confidence}
                  sentiment={detailArticle.sentiment ?? undefined}
                  className="w-full h-full"
                />
              </div>

              <div
                className="sia-formatted-content prose prose-invert prose-2xl max-w-none text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatArticleBody(content.body, lang) }}
              />

              <RelatedIntelligenceNodes nodes={relatedNodes} lang={routeLang} />

              <RevenueMaximizer category={content.category} lang={routeLang} />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/10">
                <PdfExportButton
                  articleId={detailArticle.id}
                  title={content.title}
                  content={content.body}
                  author={content.author}
                  lang={routeLang}
                />
                <SocialShareSuite url={canonicalUrl} title={content.title} lang={routeLang} />
              </div>

              {/* 🎙️ LIVE AI DEBRIEFING SYSTEM */}
              <section className="pt-20">
                <IntelligenceDebriefing articleId={detailArticle.id} lang={routeLang} />
              </section>
            </article>

            {/* --- 🛡️ SIDEBAR INTELLIGENCE --- */}
            <aside className="lg:col-span-4 space-y-12 sticky top-32">
              <SiaAdUnit slotType="SIDEBAR" />

              {/* Sovereign Insight Card */}
              <div className="p-6 glass-panel machined-edge rounded-xl space-y-5 relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Zap size={80} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-3 text-blue-400">
                  <Zap size={20} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    Sovereign_Insight
                  </span>
                </div>
                <p className="text-lg text-white font-medium leading-relaxed italic border-l-2 border-blue-600/30 pl-6">
                  {content.insight}
                </p>
              </div>

              {/* Risk Shield Node */}
              <div className="p-6 bg-red-600/5 border border-red-600/20 rounded-xl space-y-5">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    Risk_Shield_Node
                  </span>
                </div>
                <p className="text-base text-slate-400 leading-relaxed font-light">
                  {content.risk}
                </p>
              </div>

              <LiveAnalystTrigger />
            </aside>
          </div>
        </div>
      </main>

      <LegalStamp lang={routeLang} />
    </div>
  )
}
