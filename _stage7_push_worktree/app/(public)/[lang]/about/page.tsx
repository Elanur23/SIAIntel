/**
 * SIA ABOUT PAGE - V3.0 (BRAND IDENTITY & EEAT ENHANCED)
 */
import { Metadata } from 'next'
import { ABOUT_CONTENT } from '@/lib/identity/corporate-content'
import { getAllExperts } from '@/lib/identity/council-of-five'
import { ChevronRight, ShieldCheck, Zap, Globe, Radio, Terminal, Award } from 'lucide-react'
import Link from 'next/link'
import { getRecordValue } from '@/lib/types/strict-helpers'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

const aboutSeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'The SIA Protocol | Global Strategic Intelligence Agency',
    description:
      'Autonomous financial intelligence powered by advanced AI and the Council of Five elite analysts.',
    keywords: ['about sia', 'financial intelligence', 'ai markets', 'council of five'],
  },
  tr: {
    title: 'SIA Protokolü | Küresel Stratejik İstihbarat Ajansı',
    description:
      'Gelişmiş yapay zeka ve Beşler Konseyi seçkin analistleri tarafından desteklenen otonom finansal istihbarat.',
    keywords: ['sia hakkında', 'finansal istihbarat', 'yapay zeka borsa'],
  },
}

export async function generateMetadata({
  params,
}: {
  params: { lang?: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const t = getRecordValue(aboutSeo, contentLang, 'en')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    alternates: {
      canonical: `${baseUrl}/${routeLang}/about`,
      languages: buildLanguageAlternates('/about', { baseUrl }),
    },
    openGraph: {
      title: t.title,
      description: t.description,
      locale: toOpenGraphLocale(routeLang),
      url: `${baseUrl}/${routeLang}/about`,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export default function AboutPage({ params }: { params: { lang: string } }) {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const content = getRecordValue(ABOUT_CONTENT, contentLang, 'en')
  const experts = getAllExperts()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const pageUrl = `${baseUrl}/${routeLang}/about`

  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: content.title,
    description: content.subtitle,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'SIA Intelligence',
      url: `${baseUrl}/${routeLang}`,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Terminal', item: `${baseUrl}/${routeLang}` },
      { '@type': 'ListItem', position: 2, name: content.title, item: pageUrl },
    ],
  }

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([aboutPageSchema, breadcrumbSchema]) }}
      />

      <div className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-16">
          <Link
            href={`/${routeLang}`}
            className="hover:text-blue-500 transition-colors flex items-center gap-2 uppercase"
          >
            <Terminal size={12} /> Terminal
          </Link>
          <ChevronRight size={10} />
          <span className="text-white/60 uppercase">The_Protocol</span>
        </nav>

        {/* Header Section */}
        <header className="mb-28 max-w-5xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
              <ShieldCheck size={12} />
              AGENCY_PROTOCOL_v6.0
            </div>
            <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase">
              Verified_Node_Status
            </div>
          </div>

          <h1 className="text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-[0.8] block mb-10">
            {content.title}
          </h1>

          <p className="text-xl md:text-3xl text-slate-400 font-light leading-relaxed italic border-l-4 border-blue-600/50 pl-10">
            "{content.subtitle}"
          </p>
        </header>

        {/* Mission & Vision Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          {content.sections.map((section, index) => (
            <div
              key={index}
              className="p-10 lg:p-16 rounded-[4rem] bg-white/[0.02] border border-white/5 space-y-8 relative overflow-hidden backdrop-blur-xl group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                <Zap size={100} className="text-blue-500" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4 relative z-10">
                <span className="text-blue-500">0{index + 1}</span> {section.heading}
              </h2>
              <p className="text-lg text-slate-400 font-light leading-relaxed italic border-l border-white/10 pl-6 relative z-10">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* The Council of Five */}
        <section className="mb-32">
          <div className="flex items-center gap-6 mb-16">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Award size={28} />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                Council_of_Five
              </h2>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                Elite human analysts validating the neural-core signals
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experts.map((expert) => (
              <Link key={expert.id} href={`/${routeLang}/experts/${expert.id}`}>
                <div className="p-8 rounded-[3rem] bg-[#0A0A0C] border border-white/10 hover:border-blue-500/30 transition-all shadow-2xl flex flex-col h-full group">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">
                        {expert.name}
                      </h3>
                      <p className="text-emerald-500 font-black text-[9px] uppercase tracking-[0.2em] mt-1">
                        {expert.title}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-white/10 group-hover:text-white transition-all"
                    />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium italic border-l border-white/5 pl-4 line-clamp-3">
                    "{expert.bio[contentLang] || expert.bio.en}"
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Regulatory Frame */}
        {content.regulatoryReferences && content.regulatoryReferences.length > 0 && (
          <section className="bg-gradient-to-br from-blue-600/5 to-transparent rounded-[4rem] p-12 md:p-24 border border-blue-500/20 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000 opacity-50" />

            <div className="flex items-center gap-6 mb-16 relative z-10">
              <Radio size={32} className="text-blue-500 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                Global_Framework
              </h2>
            </div>

            <div className="grid gap-10 relative z-10">
              {content.regulatoryReferences.map((ref, index) => (
                <div
                  key={index}
                  className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] hover:bg-black/60 transition-all"
                >
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl font-black text-white hover:text-blue-400 transition-colors uppercase italic tracking-tight flex items-center gap-4"
                  >
                    {ref.name} <Globe size={18} className="text-blue-500" />
                  </a>
                  <p className="text-slate-400 text-base mt-4 font-light italic leading-relaxed">
                    {ref.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-20 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">
            Trust_Resources
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/50">
            <Link
              href={`/${routeLang}/editorial-policy`}
              className="hover:text-blue-400 transition-colors"
            >
              Editorial Policy
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={`/${routeLang}/ai-transparency`}
              className="hover:text-blue-400 transition-colors"
            >
              AI Transparency
            </Link>
            <span className="text-white/20">/</span>
            <Link href={`/${routeLang}/contact`} className="hover:text-blue-400 transition-colors">
              Contact
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={`/${routeLang}/privacy-policy`}
              className="hover:text-blue-400 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-white/20">/</span>
            <Link href={`/${routeLang}/terms`} className="hover:text-blue-400 transition-colors">
              Terms
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
