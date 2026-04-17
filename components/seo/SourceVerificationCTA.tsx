'use client'

import React from 'react'
import { Language } from '@/lib/store/language-store'
import { generateSourceVerificationUrl, trackCTAClick } from '@/lib/seo/cta-link-integration'

interface SourceVerificationCTAProps {
  articleId: string
  lang: Language
  variant?: 'primary' | 'secondary' | 'outline'
  position?: 'bottom' | 'top' | 'inline'
  customLabel?: string
  customIcon?: string
}

const DEFAULT_LABELS: Record<Language, string> = {
  en: 'Verify Source & Full Analysis',
  tr: 'Kaynağı Doğrula & Tam Analiz',
  de: 'Quelle überprüfen & Vollständige Analyse',
  fr: 'Vérifier la source & Analyse complète',
  es: 'Verificar fuente & Análisis completo',
  ru: 'Проверить источник и полный анализ',
  ar: 'التحقق من المصدر والتحليل الكامل',
  jp: 'ソースを確認 & 完全な分析',
  zh: '验证来源 & 完整分析',
}

const DESCRIPTIONS: Record<Language, string> = {
  en: 'Click to view full analysis with on-chain data and risk assessment',
  tr: 'Zincir üstü veri ve risk değerlendirmesi ile tam analizi görüntülemek için tıklayın',
  de: 'Klicken Sie hier für die vollständige Analyse mit On-Chain-Daten und Risikobewertung',
  fr: 'Cliquez pour voir l\'analyse complète avec les données on-chain et l\'évaluation des risques',
  es: 'Haga clic para ver el análisis completo con datos on-chain y evaluación de riesgos',
  ru: 'Нажмите, чтобы просмотреть полный анализ с данными on-chain и оценкой рисков',
  ar: 'انقر لعرض التحليل الكامل مع بيانات السلسلة وتقييم المخاطر',
  jp: 'オンチェーンデータとリスク評価を含む完全な分析を表示するにはクリックしてください',
  zh: '点击查看包含链上数据和风险评估的完整分析',
}

export default function SourceVerificationCTA({
  articleId,
  lang,
  variant = 'primary',
  position = 'bottom',
  customLabel,
  customIcon = '🔍',
}: SourceVerificationCTAProps) {
  const url = generateSourceVerificationUrl(articleId, lang, {
    source: 'article_cta',
    medium: 'internal_link',
    campaign: 'source_verification',
  })

  const label = customLabel || DEFAULT_LABELS[lang]
  const description = DESCRIPTIONS[lang]

  const handleClick = () => {
    trackCTAClick(articleId, lang, `cta_${variant}`, {
      position,
      referrer: typeof window !== 'undefined' ? document.referrer : '',
    })
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    outline: 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 border-blue-600',
  }

  const positionClasses = {
    bottom: 'mt-8 mb-4',
    top: 'mb-8 mt-4',
    inline: 'my-4',
  }

  return (
    <div className={`source-verification-cta text-center py-8 border-t border-b border-white/10 ${positionClasses[position]}`}>
      <a
        href={url}
        onClick={handleClick}
        className={`cta-button inline-flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${variantClasses[variant]}`}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics="source-verification-click"
      >
        <span className="text-xl">{customIcon}</span>
        <span>{label}</span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </a>
      <p className="text-xs text-gray-500 mt-3 max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  )
}
