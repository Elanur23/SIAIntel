/**
 * SIA PRIVACY POLICY - V3.0 (IDENTITY & COMPLIANCE ENHANCED)
 */
import { Metadata } from 'next'
import { getT } from '@/lib/i18n/server-utils'
import { ShieldCheck, Lock, Terminal, ChevronRight, Globe, Radio } from 'lucide-react'
import Link from 'next/link'
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
    title: 'Privacy Protocol | SIA Intelligence',
    desc: 'Data protection and privacy standards for the SIA terminal network.',
  },
  tr: {
    title: 'Gizlilik Protokolü | SIA İstihbarat',
    desc: 'SIA terminal ağı için veri koruma ve gizlilik standartları.',
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
      canonical: `${baseUrl}/${routeLang}/privacy-policy`,
      languages: buildLanguageAlternates('/privacy-policy', { baseUrl }),
    },
    robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } },
    openGraph: {
      title: t.title,
      description: t.desc,
      locale: toOpenGraphLocale(routeLang),
      url: `${baseUrl}/${routeLang}/privacy-policy`,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.desc },
  }
}

export default function PrivacyPolicy({ params }: Props) {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_CONTENT[lang]?.title || SEO_CONTENT.en.title,
    description: SEO_CONTENT[lang]?.desc || SEO_CONTENT.en.desc,
    url: `${baseUrl}/${routeLang}/privacy-policy`,
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
        item: `${baseUrl}/${routeLang}/privacy-policy`,
      },
    ],
  }

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageSchema, breadcrumbSchema]) }}
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
          <span className="text-white/60 uppercase">Privacy_Protocol</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* --- 📝 MAIN CONTENT (LEFT) --- */}
          <article className="lg:col-span-8 space-y-16">
            <header className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                  <ShieldCheck size={12} />
                  GDPR_CCPA_COMPLIANT
                </div>
                <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase italic">
                  {getT(lang)('legal.privacy_version')}
                </div>
              </div>

              <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8] block">
                {getT(lang)('legal.privacy_title')}
              </h1>

              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl w-fit flex items-center gap-4">
                <Lock size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Encryption_Standard: AES-256
                </span>
              </div>
            </header>

            <div className="prose prose-invert prose-xl max-w-none text-slate-400 leading-relaxed space-y-10 font-light italic border-l-2 border-white/5 pl-10">
              <p>
                At <strong>SIA Intelligence</strong>, accessible from siaintel.com, our primary
                priority is the absolute privacy of our institutional and retail nodes. This
                document outlines the telemetry data collected and how it is encrypted within the
                SIA neural matrix.
              </p>

              <h2 className="text-2xl font-black text-white uppercase tracking-tighter not-italic mt-16 flex items-center gap-4">
                <span className="text-blue-500">01.</span> Log_File_Telemetry
              </h2>
              <p>
                SIA Intelligence follows a standard procedure of utilizing secure log files. These
                files log visitors when they interact with our terminal nodes. Information includes
                IP addresses, browser types, and timestamped activity logs for security auditing.
              </p>

              <h2 className="text-2xl font-black text-white uppercase tracking-tighter not-italic mt-16 flex items-center gap-4">
                <span className="text-blue-500">02.</span> Cookie_Management
              </h2>
              <p>
                Like any advanced intelligence platform, we use 'cookies' to optimize terminal
                performance. These cookies store preference data to ensure your language nodes and
                display settings remain consistent across sessions.
              </p>

              <h2 className="text-2xl font-black text-white uppercase tracking-tighter not-italic mt-16 flex items-center gap-4">
                <span className="text-blue-500">03.</span> Data_Sovereignty
              </h2>
              <p>
                Under GDPR and CCPA, users hold the right to request full data deletion. SIA
                Intelligence maintains no persistent personal identification profiles beyond what is
                necessary for encrypted session stability.
              </p>
            </div>

            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-6">
              <div className="flex items-center gap-3 text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">
                <Radio size={16} className="animate-pulse" /> Final_Compliance_Note
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                By accessing the SIA Terminal, you acknowledge and agree to the secure data
                processing protocols outlined above. Intelligence transmission is protected by
                sovereign encryption nodes.
              </p>
            </div>
          </article>

          {/* --- 📊 SIDEBAR (RIGHT) --- */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-10 rounded-[3rem] bg-[#0A0A0C] border border-white/10 space-y-8 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                Node_Verification
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Encryption', status: 'ACTIVE', color: 'text-emerald-500' },
                  { label: 'Anonymity', status: 'ENFORCED', color: 'text-blue-500' },
                  { label: 'GDPR_Sync', status: 'VERIFIED', color: 'text-emerald-500' },
                  { label: 'SSL_Uplink', status: 'SECURE', color: 'text-blue-500' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-3 border-b border-white/5"
                  >
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      {item.label}
                    </span>
                    <span className={`text-[10px] font-black uppercase ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  <Globe size={12} /> Last Revision: Oct 2026
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Questions regarding data sovereignty can be directed to the SIA Security Node at
                security@siaintel.com
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
