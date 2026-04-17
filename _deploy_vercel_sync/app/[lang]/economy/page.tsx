/**
 * SIA ECONOMY NODE - V14.0 (SSR OPTIMIZED)
 */
import { Globe } from 'lucide-react'
import CategoryPageTemplate from '@/components/CategoryPageTemplate'
import { getArticlesByCategory } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const LABELS: Record<string, any> = {
  en: {
    hero_title: 'GLOBAL ECONOMY', hero_subtitle: 'Deep macro-economic analysis, central bank policy tracking, and global fiscal intelligence for institutional investors.',
    breadcrumb_current: 'Economy', empty_msg: 'No economic intelligence reports available yet.',
    live_section: 'LIVE MACRO SIGNALS', articles_section: 'MACRO INTELLIGENCE REPORTS',
    cta_title: 'Macro Pulse Analysis',
    cta_desc: 'SIA_SENTINEL monitors global fiscal shifts and central bank liquidity injections across 21 economies in real-time.',
    cta_btn: 'Launch Radar'
  },
  tr: {
    hero_title: 'KÜRESEL EKONOMİ', hero_subtitle: 'Kurumsal yatırımcılar için derin makro-ekonomik analiz, merkez bankası politikası takibi ve küresel mali istihbarat.',
    breadcrumb_current: 'Ekonomi', empty_msg: 'Henüz ekonomi istihbarat raporu bulunmuyor.',
    live_section: 'CANLI MAKRO SİNYALLERİ', articles_section: 'MAKRO İSTİHBARAT RAPORLARI',
    cta_title: 'Makro Nabız Analizi',
    cta_desc: 'SIA_SENTINEL, 21 ekonomideki küresel mali değişimleri ve merkez bankası likidite enjeksiyonlarını gerçek zamanlı olarak izler.',
    cta_btn: 'Radarı Başlat'
  },
  de: {
    hero_title: 'WELTWIRTSCHAFT', hero_subtitle: 'Tiefe makroökonomische Analyse, Zentralbankpolitik und globale Fiskalpolitik für institutionelle Investoren.',
    breadcrumb_current: 'Wirtschaft', empty_msg: 'Noch keine Wirtschaftsberichte verfügbar.',
    live_section: 'LIVE-MAKRO-SIGNALE', articles_section: 'MAKRO-INTELLIGENCE-BERICHTE',
    cta_title: 'Makro-Puls-Analyse',
    cta_desc: 'SIA_SENTINEL überwacht globale Fiskalverschiebungen und Zentralbank-Liquiditätsinjektionen in 21 Volkswirtschaften.',
    cta_btn: 'Radar Starten'
  },
  fr: {
    hero_title: 'ÉCONOMIE MONDIALE', hero_subtitle: 'Analyse macroéconomique approfondie, suivi des banques centrales et intelligence fiscale mondiale.',
    breadcrumb_current: 'Économie', empty_msg: 'Aucun rapport économique disponible pour l\'instant.',
    live_section: 'SIGNAUX MACRO EN DIRECT', articles_section: 'RAPPORTS MACRO',
    cta_title: 'Analyse du Pouls Macro',
    cta_desc: 'SIA_SENTINEL surveille les changements fiscaux mondiaux et les injections de liquidité des banques centrales.',
    cta_btn: 'Lancer le Radar'
  },
  es: {
    hero_title: 'ECONOMÍA GLOBAL', hero_subtitle: 'Análisis macroeconómico profundo, seguimiento de bancos centrales e inteligencia fiscal global.',
    breadcrumb_current: 'Economía', empty_msg: 'Aún no hay informes económicos.',
    live_section: 'SEÑALES MACRO EN VIVO', articles_section: 'INFORMES MACROECONÓMICOS',
    cta_title: 'Análisis del Pulso Macro',
    cta_desc: 'SIA_SENTINEL monitorea cambios fiscales globales e inyecciones de liquidez de bancos centrales en 21 economías.',
    cta_btn: 'Lanzar Radar'
  },
  ru: {
    hero_title: 'МИРОВАЯ ЭКОНОМИКА', hero_subtitle: 'Глубокий макроэкономический анализ, отслеживание политики центральных банков и глобальная финансовая разведка.',
    breadcrumb_current: 'Экономика', empty_msg: 'Пока нет экономических отчётов.',
    live_section: 'ЖИВЫЕ МАКРО-СИГНАЛЫ', articles_section: 'МАКРО-ОТЧЁТЫ',
    cta_title: 'Анализ Макро-Пульса',
    cta_desc: 'SIA_SENTINEL отслеживает глобальные фискальные изменения и ликвидные инъекции центральных банков.',
    cta_btn: 'Запустить Радар'
  },
  ar: {
    hero_title: 'الاقتصاد العالمي', hero_subtitle: 'تحليل اقتصادي كلي عميق وتتبع سياسات البنوك المركزية والاستخبارات المالية العالمية.',
    breadcrumb_current: 'الاقتصاد', empty_msg: 'لا توجد تقارير اقتصادية بعد.',
    live_section: 'إشارات الاقتصاد الكلي المباشرة', articles_section: 'تقارير الاقتصاد الكلي',
    cta_title: 'تحليل النبض الكلي',
    cta_desc: 'يراقب SIA_SENTINEL التحولات المالية العالمية وضخ السيولة من البنوك المركزية.',
    cta_btn: 'تشغيل الرادار'
  },
  jp: {
    hero_title: '世界経済', hero_subtitle: '機関投資家向けの深いマクロ経済分析、中央銀行政策追跡、グローバル財政インテリジェンス。',
    breadcrumb_current: '経済', empty_msg: '経済レポートはまだありません。',
    live_section: 'ライブマクロシグナル', articles_section: 'マクロインテリジェンスレポート',
    cta_title: 'マクロパルス分析',
    cta_desc: 'SIA_SENTINELは21の経済圏で世界的な財政変化と中央銀行の流動性注入をリアルタイムで監視します。',
    cta_btn: 'レーダー起動'
  },
  zh: {
    hero_title: '全球经济', hero_subtitle: '深度宏观经济分析、央行政策追踪和机构投资者全球财政情报。',
    breadcrumb_current: '经济', empty_msg: '暂无经济情报报告。',
    live_section: '实时宏观信号', articles_section: '宏观情报报告',
    cta_title: '宏观脉冲分析',
    cta_desc: 'SIA_SENTINEL实时监控21个经济体的全球财政变化和央行流动性注入。',
    cta_btn: '启动雷达'
  },
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = params.lang || 'en'
  const l = LABELS[lang] || LABELS.en
  return {
    title: `${l.hero_title} | SIA Intelligence`,
    description: l.hero_subtitle,
    alternates: { canonical: `https://siaintel.com/${lang}/economy` }
  }
}

export default async function EconomyPage({ params }: { params: { lang: string } }) {
  const articles = await getArticlesByCategory('ECONOMY')

  const formatted = articles.map((a: any) => ({
    id: a.id,
    slug: buildArticleSlug(a.id, a.titleEn || a.titleTr || a.id),
    titleEn: a.titleEn, titleTr: a.titleTr, titleDe: a.titleDe, titleFr: a.titleFr,
    titleEs: a.titleEs, titleRu: a.titleRu, titleAr: a.titleAr, titleJp: a.titleJp, titleZh: a.titleZh,
    summaryEn: a.summaryEn, summaryTr: a.summaryTr, summaryDe: a.summaryDe, summaryFr: a.summaryFr,
    summaryEs: a.summaryEs, summaryRu: a.summaryRu, summaryAr: a.summaryAr, summaryJp: a.summaryJp, summaryZh: a.summaryZh,
    category: a.category,
    sentiment: a.sentiment,
    impact: a.marketImpact,
    confidence: a.confidence,
    publishedAt: a.publishedAt.toISOString(),
    image: a.imageUrl || undefined
  }))

  return (
    <CategoryPageTemplate
      params={params}
      initialArticles={formatted}
      config={{
        categoryKey: 'ECONOMY',
        category: 'ECONOMY',
        accentColor: 'blue',
        icon: 'globe',
        badgeLabel: 'MACRO_NODE',
        nodeLabel: 'FISCAL_SENTINEL_V14',
        streamLabel: 'Macro Stream: Active',
        labels: LABELS,
      }}
    />
  )
}
