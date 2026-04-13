import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Terminal } from 'lucide-react'
import {
  buildLanguageAlternates,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  toOpenGraphLocale,
} from '@/lib/i18n/route-locales'

const EDITORIAL_SEO: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Editorial Policy | SIA Intelligence',
    description:
      'Our editorial standards, fact-checking process, and commitment to accuracy and transparency.',
  },
  tr: {
    title: 'Yayin Ilkeleri | SIA Intelligence',
    description: 'Yayin standartlarimiz, dogrulama sureci ve dogruluk ile seffaflik taahhudumuz.',
  },
  de: {
    title: 'Redaktionsrichtlinien | SIA Intelligence',
    description:
      'Unsere redaktionellen Standards und unser Bekenntnis zu Genauigkeit und Transparenz.',
  },
  fr: {
    title: 'Politique editoriale | SIA Intelligence',
    description:
      'Nos standards editoriaux et notre engagement en faveur de l exactitude et de la transparence.',
  },
  es: {
    title: 'Politica editorial | SIA Intelligence',
    description:
      'Nuestros estandares editoriales y compromiso con la precision y la transparencia.',
  },
  ru: {
    title: 'Redaktsionnaya politika | SIA Intelligence',
    description: 'Nashi redaktsionnye standarty i priverzhennost tochnosti i prozrachnosti.',
  },
  jp: {
    title: 'Bianji fangzhen | SIA Intelligence',
    description:
      'Bianji biaozhun, shishi hecha liucheng yi ji women dui zhunque xing he toumingdu de chengnuo.',
  },
  zh: {
    title: 'Bianji zhengce | SIA Intelligence',
    description:
      'Women de bianji biaozhun, shishi hecha liucheng yi ji dui zhunque xing yu toumingdu de chengnuo.',
  },
}

type EditorialSection = { heading: string; content: string }

const EDITORIAL_CONTENT: Record<
  string,
  { title: string; subtitle: string; sections: EditorialSection[] }
> = {
  en: {
    title: 'Editorial Policy',
    subtitle: 'Our Standards for Accuracy, Transparency, and Quality',
    sections: [
      {
        heading: 'Editorial Independence',
        content:
          'SIA Intelligence maintains strict editorial independence. Our analysis and insights are based solely on data, research, and expert judgment. We do not accept payment for coverage or favorable analysis.',
      },
      {
        heading: 'Fact-Checking Process',
        content:
          'Every article undergoes multi-layer validation: AI-assisted data verification, source authentication, analyst review, and originality checks. We cite data sources and provide clear attribution.',
      },
      {
        heading: 'Corrections Policy',
        content:
          'We are committed to accuracy. If we make an error, we correct it promptly and transparently. Corrections are clearly marked on the affected content.',
      },
      {
        heading: 'Conflict of Interest',
        content:
          'Analysts disclose relevant conflicts of interest. We avoid editorial decisions that are influenced by direct market positions in covered assets.',
      },
      {
        heading: 'Risk Disclaimers',
        content:
          'Our analysis is informational and not investment advice. Readers should perform independent research and consult qualified advisors when needed.',
      },
    ],
  },
  tr: {
    title: 'Yayin Ilkeleri',
    subtitle: 'Dogruluk, Seffaflik ve Kalite Standartlarimiz',
    sections: [
      {
        heading: 'Yayin Bagimsizligi',
        content:
          'SIA Intelligence yayin bagimsizligini korur. Icerikler veri, arastirma ve uzman degerlendirmesiyle hazirlanir.',
      },
      {
        heading: 'Dogrulama Sureci',
        content:
          'Her makale yapay zeka destekli veri dogrulama, kaynak kontrolu ve analist incelemesinden gecir.',
      },
      {
        heading: 'Duzeltme Politikasi',
        content:
          'Hata oldugunda duzeltmeleri hizli ve acik sekilde uygulariz; duzeltmeler ilgili icerikte isaretlenir.',
      },
    ],
  },
  zh: {
    title: 'Bianji zhengce',
    subtitle: 'Women dui zhunque xing, toumingdu yu zhiliang de biaozhun',
    sections: [
      {
        heading: 'Bianji duli',
        content:
          'SIA Intelligence baochi yange de bianji duli xing. Women de fenxi he dongcha jiyu shuju, yanjiu he zhuanjia panduan.',
      },
      {
        heading: 'Shishi hecha liucheng',
        content:
          'Mei pian wenzhang dou yao jingguo AI shuju hecha, laiyuan yanzheng he fenxishi fushen.',
      },
      {
        heading: 'Gengzheng zhengce',
        content:
          'Ruo chu xian cuowu, women hui jishi gengzheng bing zai xiangguan neirong zhong qingxi biaozhu.',
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
  const t = EDITORIAL_SEO[contentLang] ?? EDITORIAL_SEO.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const currentUrl = `${baseUrl}/${routeLang}/editorial-policy`
  const ogImage = `${baseUrl}/og-image.png`

  return {
    title: t.title,
    description: t.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: buildLanguageAlternates('/editorial-policy', { baseUrl }),
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

export default function EditorialPolicyPage({ params }: { params: { lang: string } }) {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const contentLang = toDictionaryLocale(routeLang)
  const content = EDITORIAL_CONTENT[contentLang] || EDITORIAL_CONTENT.en
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  const currentUrl = `${baseUrl}/${routeLang}/editorial-policy`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Terminal', item: `${baseUrl}/${routeLang}` },
      { '@type': 'ListItem', position: 2, name: content.title, item: currentUrl },
    ],
  }

  const webPageSchema = {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageSchema, breadcrumbSchema]) }}
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
          <span className="text-slate-700 dark:text-white/60">Editorial_Policy</span>
        </nav>

        <div className="text-center mb-16">
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

        <section
          id="corrections-policy"
          className="mt-10 bg-white dark:bg-slate-800/30 rounded-lg p-8 border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {contentLang === 'zh'
              ? 'Gengzheng yu gengxin liucheng'
              : contentLang === 'tr'
                ? 'Duzeltme ve guncelleme sureci'
                : 'Corrections and Update Workflow'}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {contentLang === 'zh'
              ? 'Duzhe keyi tongguo editorial@siaintel.com baogao cuowu bing fujia zhengju lianjie. Women zai hecha hou gengxin xiangguan neirong bing baoliu gengxin shijian.'
              : contentLang === 'tr'
                ? 'Okuyucular editorial@siaintel.com adresine hata bildirimi ve kaynak baglantisi iletebilir. Inceleme sonrasi ilgili icerik guncellenir ve guncelleme zamani belirtilir.'
                : 'Readers can report potential errors to editorial@siaintel.com with the article URL and supporting evidence. After review, we update the affected content and keep update timing transparent.'}
          </p>
        </section>

        <section className="mt-10 bg-white dark:bg-slate-800/30 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {contentLang === 'zh'
              ? 'Lianxi bianji tuandui'
              : contentLang === 'tr'
                ? 'Yayin ekibi ile iletisim'
                : 'Contact Editorial Team'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {contentLang === 'zh'
              ? 'Gengzheng, fankui huo bianji zixun:'
              : contentLang === 'tr'
                ? 'Duzeltmeler, geri bildirim veya yayin sorulari icin:'
                : 'For corrections, feedback, or editorial inquiries:'}
          </p>
          <a
            href="mailto:editorial@siaintel.com"
            className="text-emerald-500 hover:text-emerald-400 font-semibold"
          >
            editorial@siaintel.com
          </a>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
            <span className="text-slate-400 dark:text-white/20">Related:</span>
            <Link
              href={`/${routeLang}/ai-transparency`}
              className="hover:text-blue-500 transition-colors"
            >
              AI Transparency
            </Link>
            <span className="text-slate-300 dark:text-white/20">/</span>
            <Link href={`/${routeLang}/contact`} className="hover:text-blue-500 transition-colors">
              Contact
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
