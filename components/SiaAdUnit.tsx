/**
 * SIA Ad Unit Component
 *
 * Contextual ad placement component that integrates with AdSense Placement Optimizer.
 * Places ads at psychological "hot spots" in content for maximum CPC/CPM.
 *
 * Placement Strategy:
 * - POST_SIA_INSIGHT: After SIA_INSIGHT section (20% CPC premium)
 * - POST_RISK_DISCLAIMER: After DYNAMIC_RISK_SHIELD section (10% CPC premium)
 */

'use client'

import { useEffect } from 'react'

interface SiaAdUnitProps {
  slotType: 'INSIGHT' | 'SHIELD' | 'SIDEBAR' | 'FEED'
  language?: string
  region?: string
}

/**
 * Ad slot configuration by type
 */
const AD_SLOTS = {
  INSIGHT: {
    id: '1234567890',
    label: {
      en: 'SIA Global Partner Content',
      tr: 'SIA Global Partner İçeriği',
      de: 'SIA Global Partner-Inhalt',
      fr: 'Contenu Partenaire SIA Global',
      es: 'Contenido de Socio Global SIA',
      ru: 'Контент Глобального Партнера SIA',
      ar: 'محتوى شريك SIA العالمي'
    },
    description: 'High-value ad placement after SIA_INSIGHT'
  },
  SHIELD: {
    id: '0987654321',
    label: {
      en: 'Financial Disclosure & Partners',
      tr: 'Finansal Açıklama ve Ortaklar',
      de: 'Finanzielle Offenlegung und Partner',
      fr: 'Divulgation Financière et Partenaires',
      es: 'Divulgación Financiera y Socios',
      ru: 'Финансовое Раскрытие и Партнеры',
      ar: 'الإفصاح المالي والشركاء'
    },
    description: 'Strategic ad placement after DYNAMIC_RISK_SHIELD'
  },
  SIDEBAR: {
    id: '1122334455',
    label: {
      en: 'Institutional Sponsors',
      tr: 'Kurumsal Sponsorlar',
      de: 'Institutionelle Sponsoren',
      fr: 'Sponsors Institutionnels',
      es: 'Patrocinadores Institucionales',
      ru: 'Институциональные Спонсоры',
      ar: 'الرعاة المؤسسيون'
    },
    description: 'Sidebar vertical ad unit'
  },
  FEED: {
    id: '5544332211',
    label: {
      en: 'Market Intelligence Partners',
      tr: 'Piyasa İstihbarat Ortakları',
      de: 'Marktintelligenz-Partner',
      fr: 'Partenaires d\'Intelligence Marché',
      es: 'Socios de Inteligencia de Mercado',
      ru: 'Партнеры по анализу рынка',
      ar: 'شركاء استخبارات السوق'
    },
    description: 'In-feed native ad unit'
  }
}

/**
 * Get AdSense client ID from environment
 */
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXX'

export default function SiaAdUnit({
  slotType,
  language = 'en',
  region = 'US'
}: SiaAdUnitProps) {
  // Defensive check for slotType
  const adConfig = AD_SLOTS[slotType] || AD_SLOTS.INSIGHT

  // Safe label extraction
  const labelObj = adConfig.label as Record<string, string>
  const label = labelObj[language] || labelObj.en || 'SIA Global Partners'

  // Get LSI keyword cloud for Smart Pricing
  const lsiKeywords = getLSIKeywordCloud(region, language)
  const authorityLabel = getAuthorityLabel(language)

  useEffect(() => {
    // Initialize AdSense ads after component mount
    try {
      if (typeof window !== 'undefined') {
        // @ts-ignore - AdSense global variable
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense initialization error:', error)
    }
  }, [])

  // Log ad placement for monitoring (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💰 SIA AD UNIT - RECOVERY MODE ACTIVE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📍 Slot Type:', slotType)
      console.log('🗣️ Language:', language)
      console.log('🔋 Slot ID:', adConfig.id)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
  }, [slotType, language, adConfig.id])

  return (
    <div
      className="sia-ad-wrapper border-y border-white/5 my-4 py-4 bg-white/[0.01]"
      data-slot-type={slotType}
      data-ad-category="premium-finance"
    >
      {/* Authority Label */}
      <div className="flex items-center justify-center mb-2 text-center px-4">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
          {authorityLabel}
        </span>
      </div>

      {/* Ad Label */}
      <div className="flex items-center justify-center mb-3">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
          {label}
        </span>
      </div>

      {/* AdSense Ad Unit */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          minHeight: '250px'
        }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adConfig.id}
        data-full-width-responsive="true"
      />

      {/* Financial Disclosure */}
      <div className="flex items-center justify-center mt-3">
        <span className="text-[9px] text-gray-500 font-mono text-center px-4">
          {getFinancialDisclosure(language)}
        </span>
      </div>

      {/* Hidden LSI Context */}
      <div className="mt-2 opacity-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <span className="text-[1px]">{lsiKeywords.join(' • ')}</span>
      </div>
    </div>
  )
}

function getFinancialDisclosure(language: string): string {
  const disclosures: Record<string, string> = {
    en: 'Advertisement • Revenue supports independent financial analysis',
    tr: 'Reklam • Gelir bağımsız finansal analizi destekler',
    de: 'Werbung • Einnahmen unterstützen unabhängige Finanzanalyse',
    fr: 'Publicité • Les revenus soutiennent l\'analyse financière indépendante',
    es: 'Publicidad • Los ingresos apoyan el análisis financiero independiente',
    ru: 'Реклама • Доход поддерживает независимый финансовый анализ',
    ar: 'إعلان • الإيرادات تدعم التحليل المالي المستقل'
  }
  return disclosures[language] || disclosures.en
}

function getAuthorityLabel(language: string): string {
  const labels: Record<string, string> = {
    en: 'Market Analysis Provided by SIA Internal Data',
    tr: 'Piyasa Analizi SIA İç Verileri Tarafından Sağlanmıştır',
    de: 'Marktanalyse Bereitgestellt durch SIA Interne Daten',
    fr: 'Analyse de Marché Fournie par les Données Internes SIA',
    es: 'Análisis de Mercado Proporcionado por Datos Internos SIA',
    ru: 'Анализ Рынка Предоставлен Внутренними Данными SIA',
    ar: 'تحليل السوق المقدم من بيانات SIA الداخلية'
  }
  return labels[language] || labels.en
}

function getLSIKeywordCloud(region: string, language: string): string[] {
  const baseKeywords = ['Asset Management', 'Institutional Compliance', 'Liquidity Analysis', 'Risk Management']
  return baseKeywords
}

export function SiaAdUnitSimple() {
  useEffect(() => {
    try { if (typeof window !== 'undefined') { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}) } } catch {}
  }, [])
  return (
    <div className="sia-ad-wrapper my-8">
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-format="auto" data-ad-client={ADSENSE_CLIENT_ID} data-full-width-responsive="true" />
    </div>
  )
}
