/**
 * SIA TERMS OF SERVICE - V2.0 (SEO & COMPLIANCE ENHANCED)
 * FEATURES: 9-LANG SEO | JSON-LD | LEGAL REBRANDING
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Terminal } from 'lucide-react'
import { getT } from '@/lib/i18n/server-utils'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

type Props = {
  params: { lang: string }
}

const SEO_CONTENT: Record<string, { title: string; desc: string }> = {
  en: {
    title: 'Terms of Service | SIA Intelligence',
    desc: 'Rules and regulations for the use of the SIA Intelligence Global Terminal.',
  },
  tr: {
    title: 'Kullanım Şartları | SIA İstihbarat',
    desc: 'SIA İstihbarat Küresel Terminali kullanımı için kural ve düzenlemeler.',
  },
  de: {
    title: 'Nutzungsbedingungen | SIA Intelligence',
    desc: 'Regeln und Vorschriften für die Nutzung des SIA Intelligence Global Terminals.',
  },
  fr: {
    title: "Conditions d'Utilisation | SIA Intelligence",
    desc: "Règles et réglementations pour l'utilisation du terminal mondial SIA Intelligence.",
  },
  es: {
    title: 'Términos de Servicio | SIA Intelligence',
    desc: 'Reglas y regulaciones para el uso de la Terminal Global de SIA Intelligence.',
  },
  ru: {
    title: 'Условия использования | SIA Intelligence',
    desc: 'Правила и нормы использования глобального терминала SIA Intelligence.',
  },
  ar: {
    title: 'شروط الخدمة | SIA Intelligence',
    desc: 'القواعد واللوائح الخاصة باستخدام محطة SIA Intelligence العالمية.',
  },
  jp: {
    title: '利用規約 | SIAインテリジェンス',
    desc: 'SIAインテリジェンス・グローバルターミナルの利用に関する規則と規定。',
  },
  zh: {
    title: '服务条款 | SIA Intelligence',
    desc: '使用 SIA Intelligence 全球终端的规则和规定。',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const t = SEO_CONTENT[contentLang] || SEO_CONTENT.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  return {
    title: t.title,
    description: t.desc,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${routeLang}/terms`,
      languages: buildLanguageAlternates('/terms', { baseUrl }),
    },
    robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } },
    openGraph: {
      title: t.title,
      description: t.desc,
      locale: toOpenGraphLocale(routeLang),
      url: `${baseUrl}/${routeLang}/terms`,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.desc },
  }
}

export default function Terms({ params }: Props) {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_CONTENT[lang]?.title || SEO_CONTENT.en.title,
    description: SEO_CONTENT[lang]?.desc || SEO_CONTENT.en.desc,
    url: `https://siaintel.com/${routeLang}/terms`,
    publisher: {
      '@type': 'Organization',
      name: 'SIA Intelligence',
      url: 'https://siaintel.com',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Terminal', item: `${baseUrl}/${routeLang}` },
      {
        '@type': 'ListItem',
        position: 2,
        name: SEO_CONTENT[lang]?.title || SEO_CONTENT.en.title,
        item: `${baseUrl}/${routeLang}/terms`,
      },
    ],
  }

  return (
    <div className="text-slate-300 selection:bg-blue-600">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbSchema]) }}
      />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30 mb-12">
          <Link
            href={`/${routeLang}`}
            className="hover:text-blue-500 transition-colors flex items-center gap-2 uppercase"
          >
            <Terminal size={12} /> Terminal
          </Link>
          <ChevronRight size={10} />
          <span className="text-slate-700 dark:text-white/60 uppercase">Terms</span>
        </nav>

        <header className="mb-16 border-b border-white/5 pb-10">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">
            {getT(lang)('legal.terms_title')}
          </h1>
          <p className="text-blue-500 font-black uppercase tracking-widest text-xs">
            {getT(lang)('legal.terms_version')}
          </p>
        </header>

        <div
          className="prose prose-lg prose-slate dark:prose-invert max-w-none
          prose-headings:uppercase prose-headings:italic prose-headings:font-black prose-headings:tracking-tight
          prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:font-medium
          prose-strong:text-blue-500 prose-a:text-blue-500 hover:prose-a:underline
          prose-ul:list-disc"
        >
          <p>
            Welcome to <strong>SIA Intelligence</strong>!
          </p>

          <p>
            These terms and conditions outline the rules and regulations for the use of{' '}
            <strong>SIA Intelligence's</strong> Website, located at siaintel.com.
          </p>

          <p>
            By accessing this website we assume you accept these terms and conditions. Do not
            continue to use
            <strong> SIA Intelligence</strong> if you do not agree to take all of the terms and
            conditions stated on this page.
          </p>

          <h2>Cookies</h2>
          <p>
            We employ the use of cookies. By accessing <strong>SIA Intelligence</strong>, you agreed
            to use cookies in agreement with the <strong>SIA Intelligence's</strong> Privacy Policy.
          </p>
          <p>
            Most interactive websites use cookies to let us retrieve the user's details for each
            visit. Cookies are used by our website to enable the functionality of certain areas to
            make it easier for people visiting our website. Some of our affiliate/advertising
            partners may also use cookies.
          </p>

          <h2>License</h2>
          <p>
            Unless otherwise stated, <strong>SIA Intelligence</strong> and/or its licensors own the
            intellectual property rights for all material on <strong>SIA Intelligence</strong>. All
            intellectual property rights are reserved. You may access this from
            <strong> SIA Intelligence</strong> for your own personal use subjected to restrictions
            set in these terms and conditions.
          </p>

          <p>You must not:</p>
          <ul>
            <li>Republish material from SIA Intelligence</li>
            <li>Sell, rent or sub-license material from SIA Intelligence</li>
            <li>Reproduce, duplicate or copy material from SIA Intelligence</li>
            <li>Redistribute content from SIA Intelligence</li>
          </ul>

          <h2>User Comments</h2>
          <p>
            Parts of this website offer an opportunity for users to post and exchange opinions and
            information in certain areas of the website. <strong>SIA Intelligence</strong> does not
            filter, edit, publish or review Comments prior to their presence on the website.
            Comments do not reflect the views and opinions of <strong>SIA Intelligence</strong>, its
            agents and/or affiliates.
          </p>

          <h2>Hyperlinking to our Content</h2>
          <p>The following organizations may link to our Website without prior written approval:</p>
          <ul>
            <li>Government agencies;</li>
            <li>Search engines;</li>
            <li>News organizations;</li>
            <li>Online directory distributors;</li>
            <li>System wide Accredited Businesses.</li>
          </ul>

          <h2>Content Liability</h2>
          <p>
            We shall not be hold responsible for any content that appears on your Website. You agree
            to protect and defend us against all claims that is rising on your Website.
          </p>

          <h2>Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations,
            warranties and conditions relating to our website and the use of this website. Nothing
            in this disclaimer will:
          </p>
          <ul>
            <li>limit or exclude our or your liability for death or personal injury;</li>
            <li>limit or exclude our or your liability for fraud;</li>
            <li>
              limit any of our or your liabilities in any way that is not permitted under applicable
              law.
            </li>
          </ul>

          <p>
            <strong>
              As long as the website and the information and services on the website are provided
              free of charge, we will not be liable for any loss or damage of any nature.
            </strong>
          </p>
        </div>
      </div>
    </div>
  )
}
