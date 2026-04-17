/**
 * SIA EXPERTS PAGE - V2.0 (SEO & E-E-A-T ENHANCED)
 * FEATURES: 9-LANG SEO | JSON-LD | TERMINAL THEME | BREADCRUMBS
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { getAllExperts } from '@/lib/identity/council-of-five'
import { getT } from '@/contexts/LanguageContext'
import { ChevronRight, ShieldCheck, Award, BookOpen, User, Zap, Radio, Globe } from 'lucide-react'
import ExpertsClient from '@/components/ExpertsClient'

const expertsSeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'The Council of Five | Expert Financial Analysts | SIA Intelligence',
    description: 'Meet our elite council of analysts providing institutional-grade intelligence across crypto, macro, tech, and global markets.',
    keywords: ['expert analysts', 'financial intelligence team', 'council of five', 'market specialists']
  },
  tr: {
    title: 'Beşler Konseyi | Uzman Finansal Analistler | SIA İstihbarat',
    description: 'Kripto, makro, teknoloji ve küresel piyasalarda kurumsal düzeyde istihbarat sunan seçkin analist konseyimizle tanışın.',
    keywords: ['uzman analistler', 'finansal istihbarat ekibi', 'beşler konseyi', 'piyasa uzmanları']
  },
}

export async function generateMetadata({ params }: { params: { lang?: string } }): Promise<Metadata> {
  const lang = params?.lang ?? 'en'
  const t = expertsSeo[lang] ?? expertsSeo.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    alternates: { canonical: `${baseUrl}/${lang}/experts` },
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${baseUrl}/${lang}/experts`,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: t.title }]
    }
  }
}

export default function ExpertsPage({ params }: { params: { lang: string } }) {
  const experts = getAllExperts()
  const lang = params.lang || 'en'
  const tr = getT(lang)

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <div className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-16">
          <Link href={`/${lang}`} className="hover:text-blue-500 transition-colors uppercase">Terminal</Link>
          <ChevronRight size={10} />
          <span className="text-white/60 uppercase">{tr('experts.title')}</span>
        </nav>

        {/* Header Section */}
        <header className="mb-28 text-center md:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                <Radio size={12} className="animate-pulse" />
                IDENTITY_VERIFICATION: ACTIVE
              </div>
              <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase italic">Node_Council_V2</div>
            </div>

            <h1 className="text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-[0.8] block">
              {tr('experts.council')}
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 font-light max-w-4xl leading-relaxed border-l-2 border-blue-600/50 pl-10 italic">
              "{tr('experts.subtitle')}"
            </p>
          </div>

          <div className="lg:col-span-4 hidden lg:flex justify-end pb-4">
             <div className="flex items-center gap-6">
                <div className="text-right">
                   <div className="text-4xl font-black text-white tabular-nums">05</div>
                   <div className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">ELITE_NODES</div>
                </div>
                <div className="w-px h-12 bg-white/5" />
                <div className="text-right">
                   <div className="text-4xl font-black text-emerald-500 tabular-nums">100%</div>
                   <div className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">VERIFIED_TRUST</div>
                </div>
             </div>
          </div>
        </header>

        {/* Experts Grid */}
        <ExpertsClient 
          experts={experts} 
          lang={lang}
          translations={{
            years_exp: tr('experts.years_exp'),
            publications: tr('experts.publications')
          }}
        />

        {/* Professional Trust Footer */}
        <section
          className="bg-gradient-to-br from-blue-600/5 to-transparent rounded-[4rem] p-12 md:p-24 border border-blue-500/20 text-center relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000 opacity-50" />
          <ShieldCheck size={80} className="text-emerald-500 mx-auto mb-10 animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-10 leading-none">
            {tr('experts.badge')}
          </h3>
          <p className="text-xl md:text-2xl text-slate-400 max-w-5xl mx-auto font-light leading-relaxed italic border-l-2 border-emerald-500/30 px-12">
            {lang === 'tr'
              ? 'İçeriğimiz gelişmiş yapay zeka teknolojisiyle üretilir ve Beşler Konseyi uzman analistlerimiz tarafından onaylanır. Her içgörü, finansal gazeteciliğin en yüksek standartlarına uygunluk, özgünlük ve doğruluk sağlamak için titiz bir incelemeden geçer.'
              : 'Our content is generated through advanced AI technology and validated by our Council of Five expert analysts. Every insight undergoes rigorous review to ensure accuracy, originality, and compliance with the highest standards of financial journalism.'}
          </p>
          <div className="mt-12 flex items-center justify-center gap-8">
             <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                <Globe size={14} /> Global_Verification: Enabled
             </div>
             <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-blue-500" /> Compliance_Code: SIA_2026
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ArrowRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}
