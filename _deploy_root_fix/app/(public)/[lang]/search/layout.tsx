import type { Metadata } from 'next'
import { normalizePublicRouteLocale } from '@/lib/i18n/route-locales'

type SearchLayoutProps = {
  children: React.ReactNode
  params: { lang?: string }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

export async function generateMetadata({ params }: SearchLayoutProps): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)

  return {
    title: 'Search | SIA Intelligence',
    description: 'Internal intelligence search interface.',
    alternates: {
      canonical: `${BASE_URL}/${routeLang}/search`,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-snippet': 0,
        'max-image-preview': 'none',
        'max-video-preview': 0,
      },
    },
  }
}

export default function SearchLayout({ children }: SearchLayoutProps) {
  return children
}
