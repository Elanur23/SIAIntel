import { notFound } from 'next/navigation'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Locale } from '@/lib/i18n/dictionaries'

const SUPPORTED_LOCALES = ['en', 'tr', 'de', 'es', 'fr', 'ar', 'ru', 'jp', 'zh'] as const

function isLocaleSegment(segment: string): boolean {
  return (SUPPORTED_LOCALES as readonly string[]).includes(segment.toLowerCase())
}

function toDictionaryLocale(segment: string): Locale {
  const normalized = segment.toLowerCase() === 'ja' ? 'jp' : segment.toLowerCase()
  if (isLocaleSegment(normalized)) {
    return normalized as Locale
  }

  return 'en' as Locale
}

type Props = {
  params: { lang: string }
  children: React.ReactNode
}

export default function AdminLangLayout({ children, params }: Props) {
  if (!isLocaleSegment(params.lang)) {
    notFound()
  }

  const initialLocale = toDictionaryLocale(params.lang)

  return <LanguageProvider initialLang={initialLocale}>{children}</LanguageProvider>
}
