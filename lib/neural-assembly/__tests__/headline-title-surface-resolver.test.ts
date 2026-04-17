import { describe, expect, test } from '@jest/globals'
import type { LanguageEdition } from '../core-types'
import { resolveHeadlineTitleSurfaceAssessment } from '../headline-intelligence/title-surface-resolver'

function createEdition(language: 'en' | 'es' | 'jp', title: string, schema: Record<string, unknown>): LanguageEdition {
  return {
    id: `edition_${language}_surface`,
    language,
    mic_version: 1,
    status: 'APPROVED',
    content: {
      title,
      lead: title,
      body: {
        summary: title,
        full: title
      },
      schema
    },
    metadata: {
      keywords: ['surface', 'resolver'],
      region: 'GLOBAL',
      category: 'analysis'
    },
    entities: ['Primary Actor'],
    audit_results: {
      overall_score: 90,
      cell_scores: {
        title_cell: 90,
        body_cell: 90,
        seo_cell: 90,
        schema_cell: 90,
        meta_cell: 90,
        fact_check_cell: 90,
        policy_cell: 90,
        discover_cell: 90,
        cross_lang_cell: 90,
        tone_cell: 90,
        readability_cell: 90,
        link_cell: 90,
        sovereign_cell: 90,
        visual_cell: 90
      },
      issues: []
    },
    healing_history: [],
    stale: false
  }
}

describe('Headline Title Surface Resolver - Unicode and Certainty Controls', () => {
  test('keeps Japanese title surfaces aligned when wording remains semantically parallel', () => {
    const edition = createEdition('jp', '日銀が政策を据え置き、物価鈍化を注視', {
      '@type': 'NewsArticle',
      headline: '日銀が政策を据え置き、物価鈍化を注視',
      seoTitle: '日銀は政策据え置きで物価鈍化を監視',
      openGraph: { title: '日銀が政策を据え置き、物価鈍化を監視' },
      social: { title: '日銀は政策据え置き、物価鈍化を注視' },
      homepageTitle: '日銀は政策据え置き'
    })

    const assessment = resolveHeadlineTitleSurfaceAssessment(edition)

    expect(assessment.inconsistentPairs.length).toBe(0)
    expect(assessment.sharedThesisScore).toBeGreaterThan(0.5)
  })

  test('allows thesis-aligned editorial, SEO, social and homepage simplification', () => {
    const edition = createEdition('en', 'Fed holds rates steady as inflation cools and labor market stays resilient', {
      '@type': 'NewsArticle',
      headline: 'Fed holds rates steady as inflation cools and labor market stays resilient',
      seoTitle: 'Fed holds rates steady while inflation cools',
      openGraph: { title: 'Fed holds rates steady as inflation cools' },
      social: { title: 'Fed holds rates steady with a resilient labor backdrop' },
      homepageTitle: 'Fed holds rates steady as inflation cools'
    })

    const assessment = resolveHeadlineTitleSurfaceAssessment(edition)

    expect(assessment.inconsistentPairs.length).toBe(0)
    expect(assessment.sharedThesisScore).toBeGreaterThan(0.55)
  })

  test('flags certainty-skew divergence on Spanish title surfaces', () => {
    const edition = createEdition('es', 'Regulador abre consulta de stablecoins con borrador preliminar', {
      '@type': 'NewsArticle',
      headline: 'Regulador abre consulta de stablecoins con borrador preliminar',
      seoTitle: 'Regulador garantiza consulta de stablecoins sin riesgo y aprobacion segura',
      openGraph: { title: 'Regulador abre consulta de stablecoins en fase preliminar' },
      social: { title: 'Regulador garantiza consulta de stablecoins sin riesgo y aprobacion segura' },
      homepageTitle: 'Consulta de stablecoins en fase preliminar'
    })

    const assessment = resolveHeadlineTitleSurfaceAssessment(edition)

    expect(assessment.inconsistentPairs.length).toBeGreaterThan(0)
    expect(
      assessment.inconsistentPairs.some(pair =>
        pair.reason.includes('Certainty amplification mismatch') ||
        pair.reason.includes('Low thesis overlap')
      )
    ).toBe(true)
  })
})
