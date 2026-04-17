/**
 * SIA INTELLIGENCE RADAR V18.0 - MASTER PROTOCOL EDITION (SSR OPTIMIZED)
 */
import IntelligenceClient from '@/components/IntelligenceClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface IntelligenceReport {
  id: string
  category: string
  region: string
  flag: string
  impact: number
  confidence: number
  publishDate: string
  readTime: string
  featured: boolean
  data: Record<
    string,
    {
      title: string
      summary: string
      content: string
      siaInsight?: string
      riskShield?: string
      socialSnippet?: string
    }
  >
  metrics: Array<{
    labels: Record<string, string>
    value: string
  }>
}

const STATIC_REPORTS: IntelligenceReport[] = [
  {
    id: 'mbridge-2026',
    category: 'MACRO',
    region: 'GLOBAL',
    flag: '🌐',
    impact: 9,
    confidence: 94,
    publishDate: 'Feb 12, 2026',
    readTime: '12 min',
    featured: true,
    data: {
      en: {
        title: "The 2026 Financial Paradigm Shift: Global 'Code-War' and the Rise of mBridge",
        summary:
          'The global economy faces its most radical structural overhaul since 2008. Programmable Finance and mBridge are rewriting the rules of money.',
        content: '...',
        siaInsight:
          "The convergence of programmable finance and carbon-weighted trade creates a new 'Green Alpha' for institutional investors.",
        riskShield:
          "Monitor on-chain collateral health in real-time. The risk of a 'Digital Flash Freeze' is low but non-zero.",
        socialSnippet:
          '🚨 GLOBAL LIQUIDITY SHIFT: mBridge is rewriting the $100T global economy. #SIAIntel #mBridge',
      },
      tr: {
        title: '2026 Finansal Paradigma Kayması: mBridge ve Küresel Kod Savaşları',
        summary:
          '2026 ekonomik dönüşümünün derin analizi. mBridge gibi Merkez Bankası protokollerinin trilyonlarca Dolarlık likiditeyi nasıl serbest bırakabileceğine dair rapor.',
        content: '...',
        siaInsight:
          "Programlanabilir finans ve karbon ağırlıklı ticaretin birleşimi, kurumsal yatırımcılar için yeni bir 'Yeşil Alfa' yaratıyor.",
        riskShield:
          'On-chain teminat sağlığını gerçek zamanlı olarak izleyin. Dijital Donma riski düşük ancak mevcuttur.',
        socialSnippet:
          '🚨 KÜRESEL LİKİDİTE KAYMASI: mBridge 100 trilyon dolarlık ekonomiyi yeniden yazıyor. #SIAIntel #mBridge',
      },
    },
    metrics: [
      { labels: { en: 'Liquidity', tr: 'Likidite', de: 'Liquidität' }, value: '$4.2T' },
      { labels: { en: 'Settlement', tr: 'Takas', de: 'Abwicklung' }, value: '< 2s' },
      { labels: { en: 'GDP Impact', tr: 'GSYİH Etkisi', de: 'BIP-Effekt' }, value: '+2.1%' },
    ],
  },
]

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const lang = params.lang || 'en'
  const titles: Record<string, string> = {
    en: 'Intelligence Radar | SIA Intelligence',
    tr: 'İstihbarat Radarı | SIA Intelligence',
    zh: '情报雷达 | SIA Intelligence',
  }
  return {
    title: titles[lang] || titles.en,
    description:
      'Real-time predictive analysis of global market shocks and institutional-grade market signals.',
    alternates: { canonical: `https://siaintel.com/${lang}/intelligence` },
  }
}

export default async function IntelligencePage({ params }: { params: { lang: string } }) {
  const lang = params.lang || 'en'

  return <IntelligenceClient lang={lang} reports={STATIC_REPORTS} />
}
