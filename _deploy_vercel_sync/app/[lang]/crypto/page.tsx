/**
 * SIA CRYPTO NODE - V14.0 (SSR OPTIMIZED)
 */
import { Bitcoin } from 'lucide-react'
import CategoryPageTemplate from '@/components/CategoryPageTemplate'
import { getArticlesByCategory } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const LABELS: Record<string, any> = {
  en: {
    hero_title: 'CRYPTO INTELLIGENCE', hero_subtitle: 'Deep blockchain analysis, real-time whale tracking, and institutional crypto-asset intelligence.',
    breadcrumb_current: 'Cryptocurrency', empty_msg: 'No crypto intelligence reports available yet.',
    live_section: 'LIVE ON-CHAIN SIGNALS', articles_section: 'CRYPTO INTELLIGENCE REPORTS',
    cta_title: 'Track the Whales',
    cta_desc: 'SIA_SENTINEL monitors on-chain movements across 14 networks, identifying institutional accumulation phases before they manifest in price.',
    cta_btn: 'Launch Radar'
  },
  tr: {
    hero_title: 'KRİPTO İSTİHBARATI', hero_subtitle: 'Derin blockchain analizi, gerçek zamanlı balina takibi ve kurumsal kripto varlık istihbaratı.',
    breadcrumb_current: 'Kripto Para', empty_msg: 'Henüz kripto istihbarat raporu bulunmuyor.',
    live_section: 'CANLI ON-CHAIN SİNYALLERİ', articles_section: 'KRİPTO İSTİHBARAT RAPORLARI',
    cta_title: 'Balinaları Takip Edin',
    cta_desc: 'SIA_SENTINEL, 14 ağdaki on-chain hareketleri izleyerek kurumsal birikim aşamalarını tespit eder.',
    cta_btn: 'Radarı Başlat'
  },
  de: {
    hero_title: 'KRYPTO-INTELLIGENZ', hero_subtitle: 'Tiefe Blockchain-Analyse, Echtzeit-Wal-Tracking und institutionelle Krypto-Asset-Intelligenz.',
    breadcrumb_current: 'Kryptowährung', empty_msg: 'Noch keine Krypto-Berichte verfügbar.',
    live_section: 'LIVE ON-CHAIN SIGNALE', articles_section: 'KRYPTO-INTELLIGENCE-BERICHTE',
    cta_title: 'Wale Verfolgen',
    cta_desc: 'SIA_SENTINEL überwacht On-Chain-Bewegungen in 14 Netzwerken und erkennt Akkumulationsphasen.',
    cta_btn: 'Radar Starten'
  },
  fr: {
    hero_title: 'INTELLIGENCE CRYPTO', hero_subtitle: 'Analyse blockchain approfondie, suivi des baleines en temps réel ve intelligence institutionnelle.',
    breadcrumb_current: 'Cryptomonnaie', empty_msg: 'Aucun rapport crypto disponible pour l\'instant.',
    live_section: 'SIGNAUX ON-CHAIN EN DIRECT', articles_section: 'RAPPORTS CRYPTO',
    cta_title: 'Suivre les Baleines',
    cta_desc: 'SIA_SENTINEL surveille les mouvements on-chain sur 14 réseaux, identifiant les phases d\'accumulation institutionnelle.',
    cta_btn: 'Lancer le Radar'
  },
  es: {
    hero_title: 'INTELIGENCIA CRIPTO', hero_subtitle: 'Análisis blockchain profundo, seguimiento de ballenas en tiempo real e inteligencia institucional.',
    breadcrumb_current: 'Criptomonedas', empty_msg: 'Aún no hay informes de inteligencia cripto.',
    live_section: 'SEÑALES ON-CHAIN EN VIVO', articles_section: 'INFORMES CRIPTO',
    cta_title: 'Rastrear las Ballenas',
    cta_desc: 'SIA_SENTINEL monitorea movimientos on-chain en 14 redes, identificando fases de acumulación institucional.',
    cta_btn: 'Lanzar Radar'
  },
  ru: {
    hero_title: 'КРИПТО-ИНТЕЛЛЕКТ', hero_subtitle: 'Глубокий анализ блокчейна, отслеживание китов в реальном времени и институциональная крипто-аналитика.',
    breadcrumb_current: 'Криптовалюта', empty_msg: 'Пока нет крипто-отчётов.',
    live_section: 'ЖИВЫЕ ON-CHAIN СИГНАЛЫ', articles_section: 'КРИПТО-ОТЧЁТЫ',
    cta_title: 'Отслеживайте Китов',
    cta_desc: 'SIA_SENTINEL отслеживает on-chain движения в 14 сетях, выявляя фазы институционального накопления.',
    cta_btn: 'Запустить Радар'
  },
  ar: {
    hero_title: 'استخبارات التشفير', hero_subtitle: 'تحليل blockchain عميق وتتبع الحيتان في الوقت الفعلي.',
    breadcrumb_current: 'العملات الرقمية', empty_msg: 'لا توجد تقارير تشفير بعد.',
    live_section: 'إشارات on-chain المباشرة', articles_section: 'تقارير التشفير',
    cta_title: 'تتبع الحيتان',
    cta_desc: 'يراقب SIA_SENTINEL حركات on-chain عبر 14 شبكة.',
    cta_btn: 'تشغيل الرادار'
  },
  jp: {
    hero_title: '暗号資産インテリジェンス', hero_subtitle: '深いブロックチェーン分析、リアルタイムクジラ追跡、機関投資家向け暗号資産情報。',
    breadcrumb_current: '仮想通貨', empty_msg: '暗号資産レポートはまだありません。',
    live_section: 'ライブOn-Chainシグナル', articles_section: '暗号資産レポート',
    cta_title: 'クジラを追跡',
    cta_desc: 'SIA_SENTINELは14ネットワーク全体のon-chain動向を監視し、機関投資家の蓄積フェーズを検出します。',
    cta_btn: 'レーダー起動'
  },
  zh: {
    hero_title: '加密货币情报', hero_subtitle: '深度区块链分析、实时鲸鱼追踪和机构加密资产情报。',
    breadcrumb_current: '加密货币', empty_msg: '暂无加密情报报告。',
    live_section: '实时链上信号', articles_section: '加密情报报告',
    cta_title: '追踪鲸鱼',
    cta_desc: 'SIA_SENTINEL监控14个网络的链上动向，识别机构积累阶段。',
    cta_btn: '启动雷达'
  },
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = params.lang || 'en'
  const l = LABELS[lang] || LABELS.en
  return {
    title: `${l.hero_title} | SIA Intelligence`,
    description: l.hero_subtitle,
    alternates: { canonical: `https://siaintel.com/${lang}/crypto` }
  }
}

export default async function CryptoPage({ params }: { params: { lang: string } }) {
  const articles = await getArticlesByCategory('CRYPTO')

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
        categoryKey: 'CRYPTO',
        category: 'CRYPTO',
        accentColor: 'orange',
        icon: 'bitcoin',
        badgeLabel: 'CRYPTO_NODE',
        nodeLabel: 'ON-CHAIN_VERIFIED_V14',
        streamLabel: 'Whale Stream: Active',
        labels: LABELS,
      }}
    />
  )
}
