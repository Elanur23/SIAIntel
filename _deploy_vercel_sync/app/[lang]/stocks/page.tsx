/**
 * SIA STOCKS NODE - V14.0 (SSR OPTIMIZED)
 */
import { BarChart3 } from 'lucide-react'
import CategoryPageTemplate from '@/components/CategoryPageTemplate'
import { getArticlesByCategory } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const LABELS: Record<string, any> = {
  en: {
    hero_title: 'STOCK INTELLIGENCE', hero_subtitle: 'Professional equity analysis, institutional market insights, and real-time global exchange monitoring.',
    breadcrumb_current: 'Stock Market', empty_msg: 'No stock market intelligence reports available yet.',
    live_section: 'LIVE MARKET SIGNALS', articles_section: 'EQUITY INTELLIGENCE REPORTS',
    cta_title: 'Uncover Market Alpha',
    cta_desc: 'SIA_SENTINEL analyzes institutional order flow and dark pool activities, identifying high-probability equity rotations across global indices.',
    cta_btn: 'Launch Radar'
  },
  tr: {
    hero_title: 'BORSA İSTİHBARATI', hero_subtitle: 'Profesyonel hisse analizi, kurumsal piyasa içgörüleri ve gerçek zamanlı küresel borsa takibi.',
    breadcrumb_current: 'Borsa', empty_msg: 'Henüz borsa istihbarat raporu bulunmuyor.',
    live_section: 'CANLI PİYASA SİNYALLERİ', articles_section: 'BORSA İSTİHBARAT RAPORLARI',
    cta_title: 'Piyasa Alfalarını Keşfedin',
    cta_desc: 'SIA_SENTINEL, kurumsal emir akışlarını ve dark pool aktivitelerini analiz ederek küresel endekslerdeki hisse rotasyonlarını tespit eder.',
    cta_btn: 'Radarı Başlat'
  },
  de: {
    hero_title: 'BÖRSEN-INTELLIGENZ', hero_subtitle: 'Professionelle Aktienanalyse, institutionelle Markteinblicke und globale Börsenüberwachung.',
    breadcrumb_current: 'Aktienmarkt', empty_msg: 'Noch keine Börsenberichte verfügbar.',
    live_section: 'LIVE-MARKTSIGNALE', articles_section: 'BÖRSEN-INTELLIGENCE-BERICHTE',
    cta_title: 'Markt-Alpha Entdecken',
    cta_desc: 'SIA_SENTINEL analysiert institutionellen Orderflow und Dark-Pool-Aktivitäten.',
    cta_btn: 'Radar Starten'
  },
  fr: {
    hero_title: 'INTELLIGENCE BOURSE', hero_subtitle: 'Analyse d\'actions professionnelle, insights de marché institutionnels et surveillance mondiale.',
    breadcrumb_current: 'Bourse', empty_msg: 'Aucun rapport boursier disponible pour l\'instant.',
    live_section: 'SIGNAUX DE MARCHÉ EN DIRECT', articles_section: 'RAPPORTS BOURSIERS',
    cta_title: 'Découvrir l\'Alpha de Marché',
    cta_desc: 'SIA_SENTINEL analyse les flux institutionnels et les activités de dark pool.',
    cta_btn: 'Lancer le Radar'
  },
  es: {
    hero_title: 'INTELIGENCIA BURSÁTIL', hero_subtitle: 'Análisis de acciones profesional, insights institucionales y monitoreo global en tiempo real.',
    breadcrumb_current: 'Mercado de Valores', empty_msg: 'Aún no hay informes bursátiles.',
    live_section: 'SEÑALES DE MERCADO EN VIVO', articles_section: 'INFORMES BURSÁTILES',
    cta_title: 'Descubrir Alpha de Mercado',
    cta_desc: 'SIA_SENTINEL analiza el flujo institucional y actividades de dark pool.',
    cta_btn: 'Lanzar Radar'
  },
  ru: {
    hero_title: 'ФОНДОВЫЙ ИНТЕЛЛЕКТ', hero_subtitle: 'Профессиональный анализ акций, институциональные рыночные инсайты и мониторинг бирж.',
    breadcrumb_current: 'Фондовый рынок', empty_msg: 'Пока нет биржевых отчётов.',
    live_section: 'ЖИВЫЕ РЫНОЧНЫЕ СИГНАЛЫ', articles_section: 'БИРЖЕВЫЕ ОТЧЁТЫ',
    cta_title: 'Найти Рыночную Альфу',
    cta_desc: 'SIA_SENTINEL анализирует институциональный поток ордеров и активность dark pool.',
    cta_btn: 'Запустить Радар'
  },
  ar: {
    hero_title: 'استخبارات سوق الأسهم', hero_subtitle: 'تحليل احترافي للأسهم ورؤى مؤسسية ومراقبة عالمية في الوقت الفعلي.',
    breadcrumb_current: 'سوق الأسهم', empty_msg: 'لا توجد تقارير سوق الأسهم بعد.',
    live_section: 'إشارات السوق المباشرة', articles_section: 'تقارير سوق الأسهم',
    cta_title: 'اكتشف ألفا السوق',
    cta_desc: 'يحلل SIA_SENTINEL تدفق الأوامر المؤسسية وأنشطة dark pool.',
    cta_btn: 'تشغيل الرادار'
  },
  jp: {
    hero_title: '株式インテリジェンス', hero_subtitle: 'プロの株式分析、機関投資家のマーケットインサイト、リアルタイム世界取引所監視。',
    breadcrumb_current: '株式市場', empty_msg: '株式レポートはまだありません。',
    live_section: 'ライブ市場シグナル', articles_section: '株式インテリジェンスレポート',
    cta_title: 'マーケットアルファを発見',
    cta_desc: 'SIA_SENTINELは機関投資家のオーダーフローとダークプール活动を分析します。',
    cta_btn: 'レーダー起動'
  },
  zh: {
    hero_title: '股市情报', hero_subtitle: '专业股票分析、机构市场洞察和全球交易所实时监控。',
    breadcrumb_current: '股票市场', empty_msg: '暂无股市情报报告。',
    live_section: '实时市场信号', articles_section: '股市情报报告',
    cta_title: '发现市场Alpha',
    cta_desc: 'SIA_SENTINEL分析机构订单流和暗池活动，识别高概率股票轮动。',
    cta_btn: '启动雷达'
  },
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = params.lang || 'en'
  const l = LABELS[lang] || LABELS.en
  return {
    title: `${l.hero_title} | SIA Intelligence`,
    description: l.hero_subtitle,
    alternates: { canonical: `https://siaintel.com/${lang}/stocks` }
  }
}

export default async function StocksPage({ params }: { params: { lang: string } }) {
  const articles = await getArticlesByCategory('STOCKS')

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
        categoryKey: 'STOCKS',
        category: 'STOCKS',
        accentColor: 'emerald',
        icon: 'bar-chart',
        badgeLabel: 'EQUITY_NODE',
        nodeLabel: 'MARKET_SENTINEL_V14',
        streamLabel: 'Order Flow: Active',
        labels: LABELS,
      }}
    />
  )
}
