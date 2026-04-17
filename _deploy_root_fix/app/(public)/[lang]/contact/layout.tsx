import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
const OG_IMAGE = `${baseUrl}/og-image.png`

const CONTACT_SEO: Record<string, { title: string; desc: string }> = {
  en: {
    title: 'Contact SIA Intelligence | Global Financial Terminal',
    desc: 'Get in touch with SIA Intelligence for support, media inquiries, and intelligence tips.',
  },
  tr: {
    title: 'SIA Istihbarat ile Iletisime Gecin | Kuresel Finansal Terminal',
    desc: 'Destek, medya sorgulari veya istihbarat ipuclari icin SIA Intelligence ile iletisime gecin.',
  },
  de: {
    title: 'Kontaktieren Sie SIA Intelligence | Globales Finanzterminal',
    desc: 'Kontaktieren Sie SIA Intelligence fuer Support, Medienanfragen oder Hinweise.',
  },
  fr: {
    title: 'Contactez SIA Intelligence | Terminal Financier Mondial',
    desc: 'Contactez SIA Intelligence pour le support, les demandes media et les informations.',
  },
  es: {
    title: 'Contacto SIA Intelligence | Terminal Financiero Global',
    desc: 'Contacte con SIA Intelligence para soporte, consultas de medios o reportes.',
  },
  ru: {
    title: 'Kontakty SIA Intelligence | Globalnyy finansovyy terminal',
    desc: 'Sviazhites s SIA Intelligence dlya podderzhki, media-zaprosov i peredachi signalov.',
  },
  jp: {
    title: "SIA Intelligenceno otoiawase | Gurobaru kin'yu taminaru",
    desc: 'SIA Intelligence e no sapoto, media toiawase, joho teikyo wa kochirakaradozo.',
  },
  zh: {
    title: 'Lianxi SIA Intelligence | Quanqiu jinrong zhongduan',
    desc: 'Lianxi SIA Intelligence huoqu zhichi, meiti hezuo he qingbao tishi.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: { lang?: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const t = CONTACT_SEO[contentLang] || CONTACT_SEO.en
  const currentUrl = `${baseUrl}/${routeLang}/contact`

  return {
    title: t.title,
    description: t.desc,
    alternates: {
      canonical: currentUrl,
      languages: buildLanguageAlternates('/contact', { baseUrl }),
    },
    openGraph: {
      title: t.title,
      description: t.desc,
      locale: toOpenGraphLocale(routeLang),
      url: currentUrl,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.desc,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  }
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
