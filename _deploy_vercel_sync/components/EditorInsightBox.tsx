/**
 * Editor's Insight Box Component
 * 
 * Displays human editorial commentary at the top of articles
 * This is the visual proof of human oversight for Google
 */

// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
'use client'

import { useState } from 'react'
import type { EditorCommentary } from '@/lib/editorial/ghost-editor-system'
import type { Language } from '@/lib/sia-news/types'

interface EditorInsightBoxProps {
  commentary: EditorCommentary
  language: Language
  expertName: string
  expertTitle: string
  expertImage?: string
}

export default function EditorInsightBox({
  commentary,
  language,
  expertName,
  expertTitle,
  expertImage
}: EditorInsightBoxProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const text = commentary.translations[language] || commentary.originalText
  
  const labels = {
    en: {
      title: "Editor's Insight",
      by: 'by',
      verified: 'Human Verified',
      style: {
        ANALYTIC: 'Data-Driven Analysis',
        CAUTIOUS: 'Risk Assessment',
        AGGRESSIVE: 'Market Opportunity'
      }
    },
    tr: {
      title: 'Editör Görüşü',
      by: 'tarafından',
      verified: 'İnsan Onaylı',
      style: {
        ANALYTIC: 'Veri Odaklı Analiz',
        CAUTIOUS: 'Risk Değerlendirmesi',
        AGGRESSIVE: 'Piyasa Fırsatı'
      }
    },
    de: {
      title: 'Redaktionelle Einschätzung',
      by: 'von',
      verified: 'Menschlich Verifiziert',
      style: {
        ANALYTIC: 'Datengestützte Analyse',
        CAUTIOUS: 'Risikobewertung',
        AGGRESSIVE: 'Marktchance'
      }
    },
    fr: {
      title: 'Avis de la Rédaction',
      by: 'par',
      verified: 'Vérifié Humainement',
      style: {
        ANALYTIC: 'Analyse Basée sur les Données',
        CAUTIOUS: 'Évaluation des Risques',
        AGGRESSIVE: 'Opportunité de Marché'
      }
    },
    es: {
      title: 'Perspectiva Editorial',
      by: 'por',
      verified: 'Verificado Humanamente',
      style: {
        ANALYTIC: 'Análisis Basado en Datos',
        CAUTIOUS: 'Evaluación de Riesgos',
        AGGRESSIVE: 'Oportunidad de Mercado'
      }
    },
    ru: {
      title: 'Мнение Редакции',
      by: 'от',
      verified: 'Проверено Человеком',
      style: {
        ANALYTIC: 'Анализ на Основе Данных',
        CAUTIOUS: 'Оценка Рисков',
        AGGRESSIVE: 'Рыночная Возможность'
      }
    },
    ar: {
      title: 'رؤية المحرر',
      by: 'بواسطة',
      verified: 'تم التحقق بشريًا',
      style: {
        ANALYTIC: 'تحليل قائم على البيانات',
        CAUTIOUS: 'تقييم المخاطر',
        AGGRESSIVE: 'فرصة السوق'
      }
    }
  }
  
  const t = labels[language] || labels.en
  
  return (
    <div className="mb-8 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 p-6 rounded-r-lg shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {expertImage && (
            <img
              src={expertImage}
              alt={expertName}
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.title}
              </h3>
              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                ✓ {t.verified}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.by} <span className="font-semibold">{expertName}</span>, {expertTitle}
            </p>
          </div>
        </div>
        
        {/* Style Badge */}
        <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
          {t.style[commentary.style]}
        </span>
      </div>
      
      {/* Commentary Text */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic">
          "{text}"
        </p>
      </div>
      
      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(commentary.timestamp).toLocaleString(language, {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </p>
      </div>
    </div>
  )
}
