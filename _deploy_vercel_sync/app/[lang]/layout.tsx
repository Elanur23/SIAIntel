import { Metadata, ResolvingMetadata } from 'next'
import dynamic from 'next/dynamic'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getDictionary, Locale } from '@/lib/i18n/dictionaries'
import { LanguageProvider } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FlashRadarTicker from '@/components/FlashRadarTicker'
import AdsUnitPlaceholder from '@/components/AdsUnitPlaceholder'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import GoogleTagManager from '@/components/GoogleTagManager'

const SUPPORTED_LOCALES = ['en', 'tr', 'de', 'es', 'fr', 'ar', 'ru', 'jp', 'zh'] as const

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

type Props = {
  params: { lang: string }
  children: React.ReactNode
}

const OPEN_GRAPH_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  ar: 'ar_AE',
  ru: 'ru_RU',
  jp: 'ja_JP',
  zh: 'zh_CN',
}

const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })

function isLocaleSegment(segment: string): segment is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(segment.toLowerCase())
}

function normalizePublicRouteLocale(segment: string): SupportedLocale {
  const normalized = segment.toLowerCase()
  if (normalized === 'ja') {
    return 'jp'
  }

  return isLocaleSegment(normalized) ? normalized : 'en'
}

function toDictionaryLocale(segment: string): Locale {
  return normalizePublicRouteLocale(segment) as Locale
}

function toOpenGraphLocale(segment: string): string {
  return OPEN_GRAPH_LOCALE_MAP[normalizePublicRouteLocale(segment)]
}

function buildLanguageAlternates(): Record<string, string> {
  return {
    en: '/en',
    tr: '/tr',
    de: '/de',
    es: '/es',
    fr: '/fr',
    ar: '/ar',
    ru: '/ru',
    jp: '/jp',
    zh: '/zh',
  }
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const dictLocale = toDictionaryLocale(routeLang)
  const dict = getDictionary(dictLocale)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'

  return {
    title: {
      template: `%s | SIA Intel`,
      default: `${dict.home.hero.title} | SIA Intelligence Protocol`,
    },
    description: dict.home.hero.subtitle,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${routeLang}`,
      languages: buildLanguageAlternates(),
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
      type: 'website',
      locale: toOpenGraphLocale(routeLang),
      url: `${siteUrl}/${routeLang}`,
      siteName: 'SIA Intelligence',
      images: [
        { url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'SIA Intelligence' },
      ],
    },
    twitter: { card: 'summary_large_image', site: '@SIAIntel', creator: '@SIAIntel' },
  }
}

export default function LangLayout({ children, params }: Props) {
  if (!isLocaleSegment(params.lang)) {
    notFound()
  }

  const requestHeaders = headers()
  const rawPath =
    requestHeaders.get('x-pathname') ||
    requestHeaders.get('next-url') ||
    requestHeaders.get('x-matched-path') ||
    ''
  const requestPathname = rawPath.startsWith('http') ? new URL(rawPath).pathname : rawPath
  const segments = requestPathname.split('/').filter(Boolean)
  const activeRouteLocale = segments[0]
  const isAdminRoute =
    segments[1] === 'admin' &&
    !!activeRouteLocale &&
    isLocaleSegment(activeRouteLocale) &&
    normalizePublicRouteLocale(activeRouteLocale) === normalizePublicRouteLocale(params.lang)

  const initialLocale = toDictionaryLocale(params.lang)
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || ''

  // Defensive fallback: keep admin pages free from public-site chrome.
  if (isAdminRoute) {
    return <LanguageProvider initialLang={initialLocale}>{children}</LanguageProvider>
  }

  return (
    <LanguageProvider initialLang={initialLocale}>
      <Suspense fallback={null}>{gaId && <GoogleAnalytics gaId={gaId} />}</Suspense>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <div className="relative min-h-screen bg-[#020203]">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="noise-overlay absolute inset-0 opacity-[0.02]" />
          <div className="breathing-grid absolute inset-0 opacity-[0.03]" />
          <div className="quantum-scanline absolute inset-0 opacity-[0.01]" />
          <div className="crt-scanline absolute inset-0" />
          <MatrixRain />
        </div>

        <FlashRadarTicker />
        <Header />

        <div className="relative z-10 container mx-auto px-4 py-2 max-w-7xl">
          <AdsUnitPlaceholder slot="HEADER" format="horizontal" className="max-h-16" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <AdsUnitPlaceholder slot="FOOTER" format="horizontal" />
          </div>
          <Footer />
        </div>
      </div>
    </LanguageProvider>
  )
}
