'use client'

import Image from 'next/image'
import type { Language } from '@/lib/sia-news/types'

interface SiaAuthorBoxProps {
  language: Language
  articleId?: string
  publishedAt?: string
}

/**
 * SIA Author Box - E-E-A-T Authority Layer
 * 
 * Displays professional author information with:
 * - Institutional branding
 * - Regulatory verification badges
 * - Schema.org Person/Organization markup
 * - Multilingual support
 */
export default function SiaAuthorBox({ 
  language, 
  articleId,
  publishedAt 
}: SiaAuthorBoxProps) {
  const authorData = getAuthorData(language)
  
  return (
    <div className="sia-author-box mt-12 mb-8 p-6 bg-gradient-to-r from-slate-900 to-black border-l-4 border-gold-500 rounded-xl shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Author Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 p-1">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-gold-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
          </div>
          {/* Verification Badge */}
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
            <svg 
              className="w-5 h-5 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">
              {authorData.name}
            </h3>
            <span className="px-2 py-1 bg-gold-500/20 text-gold-500 text-xs font-semibold rounded-full border border-gold-500/30">
              {authorData.badge}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            {authorData.bio}
          </p>
          
          {/* Regulatory Verification */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              {authorData.verificationLabel}:
            </span>
            <div className="flex flex-wrap gap-2">
              {authorData.regulators.map((regulator, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-slate-800 text-gray-400 text-[10px] font-mono rounded border border-slate-700"
                >
                  {regulator}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex md:flex-col gap-4 md:gap-2 text-center">
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-gold-500">21</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {authorData.statsLabel1}
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">7</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {authorData.statsLabel2}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-gray-500 italic">
          {authorData.disclaimer}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthorData(language: Language) {
  const data: Record<Language, {
    name: string
    badge: string
    bio: string
    verificationLabel: string
    regulators: string[]
    statsLabel1: string
    statsLabel2: string
    disclaimer: string
  }> = {
    en: {
      name: 'SIA Financial Sentinel',
      badge: 'Institutional Intelligence Unit',
      bio: 'Global financial intelligence unit processing data from 21 regulatory institutions through autonomous SIA algorithms. Provides data sovereignty, not investment advice.',
      verificationLabel: 'Data Sources',
      regulators: ['SEC', 'BaFin', 'VARA', 'AMF', 'CNMV', 'CBR', 'TCMB'],
      statsLabel1: 'Regulators',
      statsLabel2: 'Languages',
      disclaimer: 'This analysis is provided for informational purposes only and does not constitute investment advice. Always conduct your own research and consult qualified financial advisors before making investment decisions.'
    },
    tr: {
      name: 'SIA Finansal Sentinel',
      badge: 'Kurumsal İstihbarat Birimi',
      bio: '21 farklı regülatör kurumdan gelen verileri otonom SIA algoritmalarıyla işleyen global finansal istihbarat birimi. Yatırım tavsiyesi içermez, veri egemenliği sağlar.',
      verificationLabel: 'Veri Kaynakları',
      regulators: ['SPK', 'TCMB', 'KVKK', 'SEC', 'BaFin', 'VARA', 'AMF'],
      statsLabel1: 'Regülatör',
      statsLabel2: 'Dil',
      disclaimer: 'Bu analiz yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. Yatırım kararı vermeden önce her zaman kendi araştırmanızı yapın ve yetkili finansal danışmanlara başvurun.'
    },
    de: {
      name: 'SIA Financial Sentinel',
      badge: 'Institutionelle Intelligence-Einheit',
      bio: 'Globale Finanzintelligenz-Einheit, die Daten von 21 Regulierungsbehörden durch autonome SIA-Algorithmen verarbeitet. Bietet Datensouveränität, keine Anlageberatung.',
      verificationLabel: 'Datenquellen',
      regulators: ['BaFin', 'EZB', 'SEC', 'VARA', 'AMF', 'CNMV', 'CBR'],
      statsLabel1: 'Regulierer',
      statsLabel2: 'Sprachen',
      disclaimer: 'Diese Analyse dient nur zu Informationszwecken und stellt keine Anlageberatung dar. Führen Sie immer Ihre eigene Recherche durch und konsultieren Sie qualifizierte Finanzberater, bevor Sie Anlageentscheidungen treffen.'
    },
    fr: {
      name: 'SIA Financial Sentinel',
      badge: 'Unité de Renseignement Institutionnel',
      bio: 'Unité mondiale de renseignement financier traitant les données de 21 institutions réglementaires via des algorithmes SIA autonomes. Fournit la souveraineté des données, pas de conseil en investissement.',
      verificationLabel: 'Sources de Données',
      regulators: ['AMF', 'BCE', 'SEC', 'BaFin', 'VARA', 'CNMV', 'CBR'],
      statsLabel1: 'Régulateurs',
      statsLabel2: 'Langues',
      disclaimer: 'Cette analyse est fournie à titre informatif uniquement et ne constitue pas un conseil en investissement. Effectuez toujours vos propres recherches et consultez des conseillers financiers qualifiés avant de prendre des décisions d\'investissement.'
    },
    es: {
      name: 'SIA Financial Sentinel',
      badge: 'Unidad de Inteligencia Institucional',
      bio: 'Unidad global de inteligencia financiera que procesa datos de 21 instituciones reguladoras mediante algoritmos SIA autónomos. Proporciona soberanía de datos, no asesoramiento de inversión.',
      verificationLabel: 'Fuentes de Datos',
      regulators: ['CNMV', 'BCE', 'SEC', 'BaFin', 'VARA', 'AMF', 'CBR'],
      statsLabel1: 'Reguladores',
      statsLabel2: 'Idiomas',
      disclaimer: 'Este análisis se proporciona solo con fines informativos y no constituye asesoramiento de inversión. Siempre realice su propia investigación y consulte a asesores financieros calificados antes de tomar decisiones de inversión.'
    },
    ru: {
      name: 'SIA Financial Sentinel',
      badge: 'Институциональное Разведывательное Подразделение',
      bio: 'Глобальное подразделение финансовой разведки, обрабатывающее данные от 21 регулирующего органа с помощью автономных алгоритмов SIA. Обеспечивает суверенитет данных, а не инвестиционные консультации.',
      verificationLabel: 'Источники Данных',
      regulators: ['ЦБ РФ', 'Минфин', 'SEC', 'BaFin', 'VARA', 'AMF', 'CNMV'],
      statsLabel1: 'Регуляторов',
      statsLabel2: 'Языков',
      disclaimer: 'Этот анализ предоставляется только в информационных целях и не является инвестиционной консультацией. Всегда проводите собственное исследование и консультируйтесь с квалифицированными финансовыми консультантами перед принятием инвестиционных решений.'
    },
    ar: {
      name: 'SIA Financial Sentinel',
      badge: 'وحدة الاستخبارات المؤسسية',
      bio: 'وحدة استخبارات مالية عالمية تعالج البيانات من 21 مؤسسة تنظيمية من خلال خوارزميات SIA المستقلة. توفر سيادة البيانات، وليس المشورة الاستثمارية.',
      verificationLabel: 'مصادر البيانات',
      regulators: ['VARA', 'DFSA', 'CBUAE', 'SEC', 'BaFin', 'AMF', 'CNMV'],
      statsLabel1: 'جهة تنظيمية',
      statsLabel2: 'لغات',
      disclaimer: 'يتم توفير هذا التحليل لأغراض إعلامية فقط ولا يشكل نصيحة استثمارية. قم دائمًا بإجراء البحث الخاص بك واستشر المستشارين الماليين المؤهلين قبل اتخاذ قرارات الاستثمار.'
    },
    jp: {
      name: 'SIA Financial Sentinel',
      badge: '機関向けインテリジェンスユニット',
      bio: '21の規制機関からのデータを自律型SIAアルゴリズムで処理するグローバル金融インテリジェンスユニット。データ主権を提供し、投資助言は行いません。',
      verificationLabel: 'データソース',
      regulators: ['JFSA', 'SEC', 'BaFin', 'VARA', 'AMF', 'CNMV', 'CBR'],
      statsLabel1: '規制機関',
      statsLabel2: '言語',
      disclaimer: '本分析は情報提供のみを目的としており、投資助言を構成するものではありません。投資判断の前に、必ずご自身で調査し、資格のある金融アドバイザーにご相談ください。'
    },
    zh: {
      name: 'SIA Financial Sentinel',
      badge: '机构情报部门',
      bio: '通过自主 SIA 算法处理来自 21 家监管机构数据的全球金融情报部门。提供数据主权，非投资建议。',
      verificationLabel: '数据来源',
      regulators: ['CSRC', 'PBOC', 'SEC', 'BaFin', 'VARA', 'AMF', 'CNMV'],
      statsLabel1: '监管机构',
      statsLabel2: '语言',
      disclaimer: '本分析仅供信息参考，不构成投资建议。在做出投资决定前，请务必自行研究并咨询合格金融顾问。'
    }
  }
  
  return data[language]
}

/**
 * Generate Author Schema for JSON-LD
 */
export function generateAuthorSchema(language: Language) {
  const authorData = getAuthorData(language)
  
  return {
    '@type': 'Organization',
    '@id': 'https://siaintel.com/#organization',
    name: authorData.name,
    description: authorData.bio,
    url: 'https://siaintel.com/about',
    logo: {
      '@type': 'ImageObject',
      url: 'https://siaintel.com/logo.png',
      width: 600,
      height: 60
    },
    sameAs: [
      'https://twitter.com/siaintel',
      'https://linkedin.com/company/siaintel',
      'https://github.com/siaintel'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: 'editorial@siaintel.com',
      availableLanguage: ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar']
    }
  }
}
