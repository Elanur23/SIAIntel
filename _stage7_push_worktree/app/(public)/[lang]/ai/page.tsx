/**
 * SIA AI NODE - V14.0 (SSR OPTIMIZED)
 */
import { Brain } from 'lucide-react'
import CategoryPageTemplate from '@/components/CategoryPageTemplate'
import { getArticlesByCategory } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { Metadata } from 'next'
import {
  buildLanguageAlternates,
  NON_PT_BR_ROUTE_LOCALES,
  normalizePublicRouteLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

export const dynamic = 'force-dynamic'

const LABELS: Record<string, any> = {
  en: {
    hero_title: 'AI INTELLIGENCE',
    hero_subtitle:
      'Autonomous neural analysis of global technology trends and machine learning breakthroughs.',
    breadcrumb_current: 'AI Intelligence',
    empty_msg: 'No AI intelligence reports available yet.',
    live_section: 'LIVE RADAR SIGNALS',
    articles_section: 'INTELLIGENCE REPORTS',
    cta_title: 'Unleash Neural Insights',
    cta_desc:
      'Our SIA_SENTINEL system scans 21 global nodes in real-time, detecting AI valuation anomalies before they hit mainstream media.',
    cta_btn: 'Launch Radar',
  },
  tr: {
    hero_title: 'YAPAY ZEKA İSTİHBARATI',
    hero_subtitle:
      'Küresel teknoloji trendlerinin ve makine öğrenimi devrimlerinin otonom sinirsel analizi.',
    breadcrumb_current: 'Yapay Zeka',
    empty_msg: 'Henüz yapay zeka istihbarat raporu bulunmuyor.',
    live_section: 'CANLI RADAR SİNYALLERİ',
    articles_section: 'İSTİHBARAT RAPORLARI',
    cta_title: 'Sinirsel İçgörüleri Serbest Bırakın',
    cta_desc:
      'SIA_SENTINEL sistemimiz 21 küresel düğümü gerçek zamanlı tarayarak yapay zeka değerlemelerindeki anomalileri tespit eder.',
    cta_btn: 'Radarı Başlat',
  },
  de: {
    hero_title: 'KI-INTELLIGENZ',
    hero_subtitle: 'Autonome neuronale Analyse globaler Technologietrends und KI-Durchbrüche.',
    breadcrumb_current: 'KI-Intelligenz',
    empty_msg: 'Noch keine KI-Berichte verfügbar.',
    live_section: 'LIVE-RADAR-SIGNALE',
    articles_section: 'INTELLIGENCE-BERICHTE',
    cta_title: 'Neuronale Einblicke Freischalten',
    cta_desc: 'SIA_SENTINEL scannt 21 globale Knoten in Echtzeit und erkennt KI-Anomalien.',
    cta_btn: 'Radar Starten',
  },
  fr: {
    hero_title: 'INTELLIGENCE IA',
    hero_subtitle:
      'Analyse neuronale autonome des tendances technologiques mondiales et des avancées IA.',
    breadcrumb_current: 'Intelligence IA',
    empty_msg: "Aucun rapport IA disponible pour l'instant.",
    live_section: 'SIGNAUX RADAR EN DIRECT',
    articles_section: 'RAPPORTS DE RENSEIGNEMENT',
    cta_title: 'Libérez les Insights Neuronaux',
    cta_desc: 'SIA_SENTINEL scanne 21 nœuds mondiaux en temps réel, détectant les anomalies IA.',
    cta_btn: 'Lancer le Radar',
  },
  es: {
    hero_title: 'INTELIGENCIA IA',
    hero_subtitle:
      'Análisis neuronal autónomo de tendencias tecnológicas globales e innovaciones de IA.',
    breadcrumb_current: 'Inteligencia IA',
    empty_msg: 'Aún no hay informes de inteligencia IA.',
    live_section: 'SEÑALES DE RADAR EN VIVO',
    articles_section: 'INFORMES DE INTELIGENCIA',
    cta_title: 'Desata los Insights Neuronales',
    cta_desc: 'SIA_SENTINEL escanea 21 nodos globales en tiempo real, detectando anomalías de IA.',
    cta_btn: 'Lanzar Radar',
  },
  ru: {
    hero_title: 'ИИ-ИНТЕЛЛЕКТ',
    hero_subtitle: 'Автономный нейронный анализ мировых технологических тенденций и прорывов ИИ.',
    breadcrumb_current: 'ИИ-Интеллект',
    empty_msg: 'Пока нет отчётов по ИИ.',
    live_section: 'ЖИВЫЕ РАДАР-СИГНАЛЫ',
    articles_section: 'РАЗВЕДЫВАТЕЛЬНЫЕ ОТЧЁТЫ',
    cta_title: 'Раскройте Нейронные Инсайты',
    cta_desc: 'SIA_SENTINEL сканирует 21 глобальный узел в реальном времени, выявляя аномалии ИИ.',
    cta_btn: 'Запустить Радар',
  },
  ar: {
    hero_title: 'استخبارات الذكاء الاصطناعي',
    hero_subtitle: 'تحليل عصبي ذاتي لاتجاهات التكنولوجيا العالمية وإنجازات الذكاء الاصطناعي.',
    breadcrumb_current: 'ذكاء اصطناعي',
    empty_msg: 'لا توجد تقارير ذكاء اصطناعي بعد.',
    live_section: 'إشارات الرادار المباشرة',
    articles_section: 'تقارير الاستخبارات',
    cta_title: 'أطلق الرؤى العصبية',
    cta_desc: 'يفحص SIA_SENTINEL 21 عقدة عالمية في الوقت الفعلي للكشف عن الشذوذات.',
    cta_btn: 'تشغيل الرادار',
  },
  jp: {
    hero_title: 'AIインテリジェンス',
    hero_subtitle: 'グローバル技術トレンドとAIブレークスルーの自律型ニューラル分析。',
    breadcrumb_current: 'AIインテリジェンス',
    empty_msg: 'AIレポートはまだありません。',
    live_section: 'ライブレーダーシグナル',
    articles_section: 'インテリジェンスレポート',
    cta_title: 'ニューラルインサイトを解放',
    cta_desc: 'SIA_SENTINELは21のグローバルノードをリアルタイムでスキャンし、AI異常を検出します。',
    cta_btn: 'レーダー起動',
  },
  zh: {
    hero_title: 'AI情报',
    hero_subtitle: '对全球技术趋势和AI突破的自主神经分析。',
    breadcrumb_current: 'AI情报',
    empty_msg: '暂无AI情报报告。',
    live_section: '实时雷达信号',
    articles_section: '情报报告',
    cta_title: '释放神经洞察',
    cta_desc: 'SIA_SENTINEL实时扫描21个全球节点，检测AI异常。',
    cta_btn: '启动雷达',
  },
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const routeLang = normalizePublicRouteLocale(params.lang)
  const canonicalLocale = routeLang === 'pt-br' ? 'en' : routeLang
  const lang = toDictionaryLocale(routeLang)
  const l = LABELS[lang] || LABELS.en
  return {
    title: `${l.hero_title} | SIA Intelligence`,
    description: l.hero_subtitle,
    alternates: {
      canonical: `https://siaintel.com/${canonicalLocale}/ai`,
      languages: buildLanguageAlternates('/ai', {
        baseUrl: 'https://siaintel.com',
        locales: NON_PT_BR_ROUTE_LOCALES,
      }),
    },
  }
}

export default async function AIPage({ params }: { params: { lang: string } }) {
  const articles = await getArticlesByCategory('AI')

  const formatted = articles.map((a: any) => ({
    id: a.id,
    slug: buildArticleSlug(a.id, a.titleEn || a.titleTr || a.id),
    titleEn: a.titleEn,
    titleTr: a.titleTr,
    titleDe: a.titleDe,
    titleFr: a.titleFr,
    titleEs: a.titleEs,
    titleRu: a.titleRu,
    titleAr: a.titleAr,
    titleJp: a.titleJp,
    titleZh: a.titleZh,
    summaryEn: a.summaryEn,
    summaryTr: a.summaryTr,
    summaryDe: a.summaryDe,
    summaryFr: a.summaryFr,
    summaryEs: a.summaryEs,
    summaryRu: a.summaryRu,
    summaryAr: a.summaryAr,
    summaryJp: a.summaryJp,
    summaryZh: a.summaryZh,
    category: a.category,
    sentiment: a.sentiment,
    impact: a.marketImpact,
    confidence: a.confidence,
    publishedAt: a.publishedAt.toISOString(),
    image: a.imageUrl || undefined,
  }))

  return (
    <CategoryPageTemplate
      params={params}
      initialArticles={formatted}
      config={{
        categoryKey: 'AI',
        category: 'AI',
        accentColor: 'purple',
        icon: 'brain',
        badgeLabel: 'AI_CORE',
        nodeLabel: 'SIA_SENTINEL_V14',
        streamLabel: 'Neural Pulse: Stable',
        labels: LABELS,
      }}
    />
  )
}
