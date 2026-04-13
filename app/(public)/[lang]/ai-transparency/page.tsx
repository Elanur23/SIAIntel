import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Terminal } from 'lucide-react'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

const AI_TRANSPARENCY_SEO: Record<string, { title: string; description: string }> = {
  en: {
    title: 'AI Transparency | SIA Intelligence',
    description:
      'Learn how SIA Intelligence uses AI technology responsibly with human oversight and expert validation.',
  },
  tr: {
    title: 'Yapay Zeka Seffafligi | SIA Intelligence',
    description:
      'SIA Intelligence in insan denetimi ve uzman dogrulamasi ile yapay zekayi nasil sorumlu kullandigini ogrenin.',
  },
  de: {
    title: 'KI-Transparenz | SIA Intelligence',
    description:
      'Wie SIA Intelligence KI verantwortungsvoll mit menschlicher Aufsicht und Expertenvalidierung einsetzt.',
  },
  fr: {
    title: 'Transparence IA | SIA Intelligence',
    description:
      'Comment SIA Intelligence utilise l IA de maniere responsable avec supervision humaine et validation d experts.',
  },
  es: {
    title: 'Transparencia IA | SIA Intelligence',
    description:
      'Como SIA Intelligence utiliza la IA de forma responsable con supervision humana y validacion de expertos.',
  },
  ru: {
    title: 'Prozrachnost II | SIA Intelligence',
    description:
      'Kak SIA Intelligence otvetstvenno ispolzuet II s nadzorom cheloveka i proverkoy ekspertov.',
  },
  jp: {
    title: 'AI toumeisei | SIA Intelligence',
    description:
      'SIA Intelligence ga ningen no kantoku to senmonka kensho no moto de AI o sekinin motte katsuyo suru hoho.',
  },
  zh: {
    title: 'AI toumingdu | SIA Intelligence',
    description:
      'Liaojie SIA Intelligence ruhe zai rengong jiandu yu zhuanjia yanzheng xia fuzeren de shiyong AI jishu.',
  },
}

type TransparencySection = { heading: string; content: string }

const AI_TRANSPARENCY_CONTENT: Record<
  string,
  { title: string; subtitle: string; sections: TransparencySection[] }
> = {
  en: {
    title: 'AI Transparency',
    subtitle: 'How We Use AI Responsibly in Publishing',
    sections: [
      {
        heading: 'AI-Assisted, Human-Verified Workflow',
        content:
          'We use AI to process data and surface candidate insights. Final publication decisions are reviewed by human analysts before release.',
      },
      {
        heading: 'Model and Data Boundaries',
        content:
          'AI systems are used as research tools. Source verification, contextual checks, and editorial judgment remain mandatory for publication.',
      },
      {
        heading: 'Quality and Compliance Checks',
        content:
          'Content passes internal quality checks for clarity, source attribution, and policy compliance before it is eligible for publication.',
      },
    ],
  },
  tr: {
    title: 'Yapay Zeka Seffafligi',
    subtitle: 'Yayincilikta yapay zekayi nasil sorumlu kullaniyoruz',
    sections: [
      {
        heading: 'Yapay zeka destekli, insan dogrulamali akis',
        content:
          'Yapay zekayi veri isleme ve aday icgoruler olusturma icin kullaniriz. Nihai yayin karari insan analistler tarafindan verilir.',
      },
      {
        heading: 'Model ve veri sinirlari',
        content:
          'Yapay zeka arastirma araci olarak kullanilir. Kaynak dogrulama ve editor degerlendirmesi yayin icin zorunludur.',
      },
      {
        heading: 'Kalite ve uyum kontrolleri',
        content:
          'Icerik yayinlanmadan once kaynak atfi, baglam dogrulugu ve politika uyumu kontrollerinden gecirilir.',
      },
    ],
  },
  zh: {
    title: 'AI toumingdu',
    subtitle: 'Women zai chuban zhong ruhe fuzeren de shiyong AI',
    sections: [
      {
        heading: 'AI fuzhu, rengong fushen',
        content:
          'Women yong AI chuli shuju bing xun zhao houxuan dongcha. Fabu qian rengong fenxishi hui jinxing zuihou fushen.',
      },
      {
        heading: 'Moxing yu shuju bianjie',
        content:
          'AI zuowei yanjiu gongju shiyong. Chuban qian bixu wancheng laiyuan yanzheng he bianji panduan.',
      },
      {
        heading: 'Zhiliang yu hegui jiancha',
        content: 'Neirong xu tongguo qingxidu, laiyuan biaozhu he hegui jiancha hou cai neng fabu.',
      },
    ],
  },
}

export async function generateMetadata({
  params,
}: {
  params: { lang?: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const t = AI_TRANSPARENCY_SEO[contentLang] ?? AI_TRANSPARENCY_SEO.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const currentUrl = `${baseUrl}/${routeLang}/ai-transparency`
  const ogImage = `${baseUrl}/og-image.png`

  return {
    title: t.title,
    description: t.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: buildLanguageAlternates('/ai-transparency', { baseUrl }),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: t.title,
      description: t.description,
      locale: toOpenGraphLocale(routeLang),
      url: currentUrl,
      siteName: 'SIA Intelligence',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
      images: [ogImage],
    },
  }
}

export default function AITransparencyPage({ params }: { params: { lang: string } }) {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const content = AI_TRANSPARENCY_CONTENT[contentLang] || AI_TRANSPARENCY_CONTENT.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const currentUrl = `${baseUrl}/${routeLang}/ai-transparency`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Terminal', item: `${baseUrl}/${routeLang}` },
      { '@type': 'ListItem', position: 2, name: content.title, item: currentUrl },
    ],
  }

  const transparencySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: content.title,
    description: content.subtitle,
    url: currentUrl,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([transparencySchema, breadcrumbSchema]) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30 mb-12">
          <Link
            href={`/${routeLang}`}
            className="hover:text-blue-500 transition-colors flex items-center gap-2"
          >
            <Terminal size={12} /> Terminal
          </Link>
          <ChevronRight size={10} />
          <span className="text-slate-700 dark:text-white/60">AI_Transparency</span>
        </nav>

        <div className="text-center mb-16">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-500 text-sm font-semibold">AI + Human Oversight</span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {content.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">{content.subtitle}</p>
        </div>

        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <section
              key={index}
              className="bg-white dark:bg-slate-800/50 rounded-lg p-8 border border-slate-200 dark:border-slate-700"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {section.heading}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {contentLang === 'zh'
              ? 'Women de chengnuo'
              : contentLang === 'tr'
                ? 'Taahhudumuz'
                : 'Our Commitment'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {contentLang === 'zh'
              ? 'Women zhiliyu zai baochi zhuanye bianji shenhe de tongshi, dui AI shiyong fangshi jinxing qingxi pulu.'
              : contentLang === 'tr'
                ? 'Yayin surecinde insan denetimini korurken yapay zeka kullanimini acik ve seffaf sekilde paylasiriz.'
                : 'We disclose how AI is used in our workflow while preserving human editorial oversight and accountability.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
            <span className="text-slate-400 dark:text-white/20">Related:</span>
            <Link
              href={`/${routeLang}/editorial-policy`}
              className="hover:text-blue-500 transition-colors"
            >
              Editorial Policy
            </Link>
            <span className="text-slate-300 dark:text-white/20">/</span>
            <Link href={`/${routeLang}/contact`} className="hover:text-blue-500 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
