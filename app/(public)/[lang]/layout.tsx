import { Metadata, ResolvingMetadata } from 'next'
import dynamic from 'next/dynamic'
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
import GoogleAdSense from '@/components/GoogleAdSense'
import CookieBanner from '@/components/ui/CookieBanner'
import { AuthProvider } from '@/components/Providers'
import {
  buildLanguageAlternates,
  isLocaleSegment,
  normalizePublicRouteLocale,
  toOpenGraphLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })

type Props = {
  params: { lang: string }
  children: React.ReactNode
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const dictLocale = toDictionaryLocale(routeLang) as Locale
  const dict = getDictionary(dictLocale)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'

  const parentMetadata = await parent

  return {
    title: {
      template: `%s | SIA Intel`,
      default: 'SIA Intelligence',
    },
    description: dict.home.hero.subtitle,
    metadataBase: new URL(siteUrl),
    ...(parentMetadata.verification && { verification: parentMetadata.verification }),
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

export default function PublicLangLayout({ children, params }: Props) {
  if (!isLocaleSegment(params.lang)) {
    notFound()
  }

  const initialLocale = toDictionaryLocale(params.lang) as Locale
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || ''
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || ''

  return (
    <LanguageProvider initialLang={initialLocale}>
      {/* Public-only tracking and scripts */}
      <Suspense fallback={null}>{gaId && <GoogleAnalytics gaId={gaId} />}</Suspense>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {adSenseId && <GoogleAdSense adSenseId={adSenseId} />}

      <div className="relative min-h-screen bg-[#020203]">
        {/* Background FX (single source of truth) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="noise-overlay absolute inset-0 opacity-[0.02]" />
          <div className="breathing-grid absolute inset-0 opacity-[0.03]" />
          <div className="quantum-scanline absolute inset-0 opacity-[0.01]" />
          <div className="crt-scanline absolute inset-0" />
          <MatrixRain />
        </div>

        {/* Fixed chrome: Ticker + Header */}
        <FlashRadarTicker />
        <AuthProvider>
          <Header />
        </AuthProvider>

        {/* AdSense: Header placeholder */}
        <div className="relative z-10 container mx-auto px-4 py-2 max-w-7xl">
          <AdsUnitPlaceholder slot="HEADER" format="horizontal" className="max-h-16" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>

          {/* AdSense: Footer placeholder */}
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <AdsUnitPlaceholder slot="FOOTER" format="horizontal" />
          </div>
          <Footer />
          <CookieBanner />
        </div>
      </div>
    </LanguageProvider>
  )
}
