import { describe, expect, test } from '@jest/globals'
import {
  HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX,
  HIOL_FP_FN_TUNING_PREPARATION_CASES,
  HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS,
  HIOL_TUNING_PREP_FULL_LANGUAGE_TARGET,
  HIOL_TUNING_PREP_FUTURE_EXTENSION_LANGUAGES,
  HIOL_TUNING_PREP_REDUCED_LANGUAGE_SET,
  HIOL_TUNING_PREP_REQUIRED_FP_FN_BUCKETS,
  HIOL_TUNING_PREP_REQUIRED_SCENARIO_TYPES
} from './fixtures/hiol-multilingual-adversarial-parity-corpus'
import {
  HIOL_ACCEPTABLE_ADAPTATION_NOTES,
  HIOL_CERTAINTY_AMPLIFICATION_WATCHPOINTS,
  HIOL_FUTURE_LANGUAGE_EXTENSION_SLOTS,
  HIOL_INVARIANT_FACT_CHECKLIST,
  HIOL_LOCAL_EXAGGERATION_WATCHPOINTS,
  HIOL_REDUCED_LANGUAGE_REVIEW_NOTES,
  HIOL_SOURCE_VS_LOCALIZED_COMPARISON_CHECKLIST,
  HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES,
  HIOL_TITLE_SURFACE_PREPARATION_NOTES,
  HIOL_UNACCEPTABLE_DRIFT_NOTES
} from './fixtures/hiol-tuning-review-checklists'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function looksLikePlaceholder(value: string): boolean {
  const lowered = normalize(value)
  return lowered.includes('todo') || lowered.includes('tbd') || lowered.includes('placeholder')
}

describe('HIOL Tuning Preparation Pack - Multilingual Adversarial and Parity Corpus', () => {
  test('covers all required multilingual scenario families', () => {
    const coverage = new Set(HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS.map((item) => item.scenario_type))

    for (const requiredScenarioType of HIOL_TUNING_PREP_REQUIRED_SCENARIO_TYPES) {
      expect(coverage.has(requiredScenarioType)).toBe(true)
    }

    expect(HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS.length).toBeGreaterThanOrEqual(9)
  })

  test('keeps EN as source anchor while activating only ES/JP in reduced validation preparation', () => {
    for (const caseFixture of HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS) {
      expect(caseFixture.source_language).toBe('en')
      expect(caseFixture.source_headline_anchor.length).toBeGreaterThan(20)
      expect(caseFixture.source_lede_anchor.length).toBeGreaterThan(20)
      expect(caseFixture.source_summary_anchor.length).toBeGreaterThan(20)
      expect(caseFixture.invariant_facts.length).toBeGreaterThanOrEqual(3)

      const active = caseFixture.localized_expectations
        .filter((variant) => variant.preparation_status === 'ACTIVE_REDUCED_VALIDATION')
        .map((variant) => variant.language)
        .sort()

      expect(active).toEqual(['es', 'jp'])

      const planned = caseFixture.localized_expectations
        .filter((variant) => variant.preparation_status === 'PLANNED_FULL_TARGET_EXTENSION')
        .map((variant) => variant.language)
        .sort()

      expect(planned).toEqual([...HIOL_TUNING_PREP_FUTURE_EXTENSION_LANGUAGES].sort())

      for (const activeVariant of caseFixture.localized_expectations.filter((variant) => variant.preparation_status === 'ACTIVE_REDUCED_VALIDATION')) {
        expect(activeVariant.localized_headline).not.toBeNull()
        expect((activeVariant.localized_headline || '').length).toBeGreaterThan(10)
        expect(activeVariant.invariant_fact_ids.length).toBeGreaterThan(0)
        expect(activeVariant.allowed_adaptation_notes.length).toBeGreaterThan(0)
        expect(activeVariant.expected_correction_direction.length).toBeGreaterThan(15)
      }
    }
  })

  test('retains full-target scalability scaffolding for all 9 product languages', () => {
    expect(HIOL_TUNING_PREP_FULL_LANGUAGE_TARGET.length).toBe(9)
    expect(HIOL_TUNING_PREP_REDUCED_LANGUAGE_SET).toEqual(['en', 'es', 'jp'])

    const mergedCoverage = new Set<string>()
    for (const caseFixture of HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS) {
      mergedCoverage.add(caseFixture.source_language)
      for (const variant of caseFixture.localized_expectations) {
        mergedCoverage.add(variant.language)
      }
    }

    for (const language of HIOL_TUNING_PREP_FULL_LANGUAGE_TARGET) {
      expect(mergedCoverage.has(language)).toBe(true)
    }
  })

  test('keeps semantic anchors, invariant facts, and adaptation notes materially non-trivial', () => {
    for (const caseFixture of HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS) {
      expect(caseFixture.source_headline_anchor.length).toBeGreaterThan(25)
      expect(caseFixture.source_lede_anchor.length).toBeGreaterThan(25)
      expect(caseFixture.source_summary_anchor.length).toBeGreaterThan(25)

      expect(caseFixture.source_title_surfaces.editorial?.length || 0).toBeGreaterThan(10)
      expect(caseFixture.source_title_surfaces.seo?.length || 0).toBeGreaterThan(10)
      expect(caseFixture.source_title_surfaces.social?.length || 0).toBeGreaterThan(10)
      expect(caseFixture.source_title_surfaces.homepage?.length || 0).toBeGreaterThan(8)

      const invariantIds = caseFixture.invariant_facts.map((fact) => fact.id)
      expect(new Set(invariantIds).size).toBe(caseFixture.invariant_facts.length)
      expect(caseFixture.invariant_facts.some((fact) => fact.severity_if_broken === 'HIGH')).toBe(true)

      for (const fact of caseFixture.invariant_facts) {
        expect(fact.statement.length).toBeGreaterThan(20)
        expect(looksLikePlaceholder(fact.statement)).toBe(false)
      }

      for (const variant of caseFixture.localized_expectations) {
        for (const note of variant.allowed_adaptation_notes) {
          expect(note.length).toBeGreaterThan(25)
          expect(looksLikePlaceholder(note)).toBe(false)
        }
      }
    }
  })

  test('keeps expected drift/routing/escalation/rule-hit signals coherent for active reduced-language variants', () => {
    const strictScenarioTypes = new Set([
      'MILD_DRIFT',
      'SEVERE_DRIFT',
      'CERTAINTY_AMPLIFICATION',
      'LOCAL_EXAGGERATION',
      'LEGAL_RISK_TRANSLATION_DRIFT',
      'MARKET_MOVING_TRANSLATION_DRIFT',
      'TITLE_SURFACE_LOCALIZED_CONFLICT'
    ])

    const permissiveScenarioTypes = new Set([
      'FAITHFUL_TRANSLATION',
      'ACCEPTABLE_TRANSCREATION'
    ])

    for (const caseFixture of HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS) {
      const invariantIds = new Set(caseFixture.invariant_facts.map((fact) => fact.id))
      const activeVariants = caseFixture.localized_expectations.filter(
        (variant) => variant.preparation_status === 'ACTIVE_REDUCED_VALIDATION'
      )

      for (const activeVariant of activeVariants) {
        expect(activeVariant.invariant_fact_ids.every((id) => invariantIds.has(id))).toBe(true)
        expect(activeVariant.expected_correction_direction.length).toBeGreaterThan(20)

        if (strictScenarioTypes.has(caseFixture.scenario_type)) {
          expect(activeVariant.expected_routing).not.toBe('PASS')
          expect(activeVariant.expected_escalation_class).not.toBe('NONE')
          expect(activeVariant.expected_rule_hits.length).toBeGreaterThan(0)
        }

        if (permissiveScenarioTypes.has(caseFixture.scenario_type)) {
          expect(activeVariant.expected_routing).toBe('PASS')
          expect(activeVariant.expected_escalation_class).toBe('NONE')
        }
      }
    }
  })

  test('marks future-language entries as scaffold-only extension state, not active parity', () => {
    for (const caseFixture of HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS) {
      const plannedVariants = caseFixture.localized_expectations.filter(
        (variant) => variant.preparation_status === 'PLANNED_FULL_TARGET_EXTENSION'
      )

      expect(plannedVariants.length).toBe(HIOL_TUNING_PREP_FUTURE_EXTENSION_LANGUAGES.length)

      for (const plannedVariant of plannedVariants) {
        expect(plannedVariant.localized_headline).toBeNull()
        expect(plannedVariant.localized_title_surfaces?.editorial).toBeNull()
        expect(plannedVariant.localized_title_surfaces?.seo).toBeNull()
        expect(plannedVariant.localized_title_surfaces?.social).toBeNull()
        expect(plannedVariant.localized_title_surfaces?.homepage).toBeNull()
        expect(plannedVariant.expected_routing).toBe('HUMAN_REVIEW_REQUIRED')
        expect(plannedVariant.expected_escalation_class).toBe('MULTILINGUAL_EDITOR_REVIEW')
        expect(normalize(plannedVariant.expected_correction_direction)).toContain('scaffold-only')
        expect(normalize(plannedVariant.expected_correction_direction)).toContain('before activation')
        expect(plannedVariant.expected_rule_hits.length).toBe(0)
      }
    }
  })

  test('requires concrete localized title-surface conflict payloads where scenario demands it', () => {
    const conflictCase = HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS.find(
      (item) => item.scenario_type === 'TITLE_SURFACE_LOCALIZED_CONFLICT'
    )

    expect(conflictCase).toBeDefined()

    const activeVariants = (conflictCase?.localized_expectations || []).filter(
      (variant) => variant.preparation_status === 'ACTIVE_REDUCED_VALIDATION'
    )

    for (const variant of activeVariants) {
      expect(variant.localized_title_surfaces).toBeDefined()

      const surfaces = variant.localized_title_surfaces!
      expect(surfaces.editorial).not.toBeNull()
      expect(surfaces.seo).not.toBeNull()
      expect(surfaces.social).not.toBeNull()
      expect(surfaces.homepage).not.toBeNull()

      // Conflict case should provide at least one channel surface diverging from editorial anchor.
      const diverges =
        surfaces.editorial !== surfaces.seo ||
        surfaces.editorial !== surfaces.social ||
        surfaces.editorial !== surfaces.homepage
      expect(diverges).toBe(true)
    }
  })
})

describe('HIOL Tuning Preparation Pack - False Positive and False Negative Preparation', () => {
  test('covers all required false-positive/false-negative preparation buckets', () => {
    const bucketCoverage = new Set(HIOL_FP_FN_TUNING_PREPARATION_CASES.map((item) => item.bucket))

    for (const requiredBucket of HIOL_TUNING_PREP_REQUIRED_FP_FN_BUCKETS) {
      expect(bucketCoverage.has(requiredBucket)).toBe(true)
    }

    expect(HIOL_FP_FN_TUNING_PREPARATION_CASES.length).toBeGreaterThanOrEqual(6)
  })

  test('keeps each FP/FN prep case actionable for tuning design', () => {
    for (const prepCase of HIOL_FP_FN_TUNING_PREPARATION_CASES) {
      expect(prepCase.source_headline_anchor.length).toBeGreaterThan(20)
      expect(prepCase.source_context_anchor.length).toBeGreaterThan(20)
      expect(prepCase.likely_missed_failure_mode.length).toBeGreaterThan(20)
      expect(prepCase.tuning_objective.length).toBeGreaterThan(20)
    }
  })

  test('separates category ambiguity from article-type ambiguity with distinct prep intents', () => {
    const categoryAmbiguityCases = HIOL_FP_FN_TUNING_PREPARATION_CASES.filter(
      (item) => item.bucket === 'CATEGORY_AMBIGUITY'
    )
    const articleTypeAmbiguityCases = HIOL_FP_FN_TUNING_PREPARATION_CASES.filter(
      (item) => item.bucket === 'ARTICLE_TYPE_AMBIGUITY'
    )

    expect(categoryAmbiguityCases.length).toBeGreaterThan(0)
    expect(articleTypeAmbiguityCases.length).toBeGreaterThan(0)

    for (const item of categoryAmbiguityCases) {
      expect(normalize(item.tuning_objective)).toContain('category')
    }

    for (const item of articleTypeAmbiguityCases) {
      expect(normalize(item.tuning_objective)).toContain('article-type')
    }
  })
})

describe('HIOL Tuning Preparation Pack - Category and Article Type Preparation', () => {
  test('covers all target article types and category labels required for tuning prep', () => {
    const requiredArticleTypes = [
      'BREAKING_NEWS',
      'ANALYSIS',
      'EXPLAINER',
      'MARKET_REPORT',
      'MACRO_ECONOMY',
      'CRYPTO',
      'AI_TECH',
      'POLICY_REGULATION',
      'LEGAL_ENFORCEMENT',
      'COMPANY_EARNINGS',
      'DATA_DRIVEN_REPORT',
      'PANIC_SENSITIVE'
    ]

    const requiredCategoryLabels = [
      'breaking news',
      'analysis',
      'explainer',
      'market report',
      'macro/economy',
      'crypto',
      'ai/technology',
      'policy/regulation',
      'legal/enforcement',
      'company/earnings',
      'data-driven report',
      'panic-prone/sensitive stories'
    ]

    const articleTypeCoverage = new Set(HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX.map((item) => item.article_type))
    const categoryCoverage = new Set(HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX.map((item) => normalize(item.category)))

    for (const articleType of requiredArticleTypes) {
      expect(articleTypeCoverage.has(articleType as any)).toBe(true)
    }

    for (const categoryLabel of requiredCategoryLabels) {
      expect(categoryCoverage.has(normalize(categoryLabel))).toBe(true)
    }

    expect(HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX.length).toBe(12)
  })

  test('links each category/article prep entry to concrete preparation case IDs', () => {
    const knownCaseIds = new Set([
      ...HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS.map((item) => item.id),
      ...HIOL_FP_FN_TUNING_PREPARATION_CASES.map((item) => item.id)
    ])

    for (const prepEntry of HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX) {
      expect(prepEntry.preparation_objective.length).toBeGreaterThan(20)
      expect(prepEntry.reviewer_focus.length).toBeGreaterThan(0)
      expect(prepEntry.linked_preparation_case_ids.length).toBeGreaterThan(0)

      for (const linkedId of prepEntry.linked_preparation_case_ids) {
        expect(knownCaseIds.has(linkedId)).toBe(true)
      }
    }
  })
})

describe('HIOL Tuning Preparation Pack - Multilingual Review Checklist Layer', () => {
  test('provides required source-vs-localized and invariant review checklists', () => {
    expect(HIOL_SOURCE_VS_LOCALIZED_COMPARISON_CHECKLIST.length).toBeGreaterThanOrEqual(8)
    expect(HIOL_INVARIANT_FACT_CHECKLIST.length).toBeGreaterThanOrEqual(4)
    expect(HIOL_CERTAINTY_AMPLIFICATION_WATCHPOINTS.length).toBeGreaterThanOrEqual(4)
    expect(HIOL_LOCAL_EXAGGERATION_WATCHPOINTS.length).toBeGreaterThanOrEqual(4)
    expect(HIOL_ACCEPTABLE_ADAPTATION_NOTES.length).toBeGreaterThanOrEqual(4)
    expect(HIOL_UNACCEPTABLE_DRIFT_NOTES.length).toBeGreaterThanOrEqual(6)
  })

  test('includes language-specific reviewer notes for EN, ES, and JP', () => {
    const languageCoverage = new Set(HIOL_REDUCED_LANGUAGE_REVIEW_NOTES.map((item) => item.language))

    expect(languageCoverage.has('en')).toBe(true)
    expect(languageCoverage.has('es')).toBe(true)
    expect(languageCoverage.has('jp')).toBe(true)

    for (const notes of HIOL_REDUCED_LANGUAGE_REVIEW_NOTES) {
      expect(notes.source_vs_localized_watchpoints.length).toBeGreaterThan(0)
      expect(notes.certainty_amplification_watchpoints.length).toBeGreaterThan(0)
      expect(notes.local_exaggeration_watchpoints.length).toBeGreaterThan(0)
      expect(notes.quick_revision_prompts.length).toBeGreaterThan(0)
    }
  })

  test('provides structured extension slots for full-target language return', () => {
    const extensionLanguages = new Set(HIOL_FUTURE_LANGUAGE_EXTENSION_SLOTS.map((item) => item.language))

    for (const language of ['tr', 'de', 'fr', 'ru', 'ar', 'zh']) {
      expect(extensionLanguages.has(language as any)).toBe(true)
    }

    for (const slot of HIOL_FUTURE_LANGUAGE_EXTENSION_SLOTS) {
      expect(slot.required_parity_checks.length).toBeGreaterThanOrEqual(3)
      expect(slot.required_title_surface_checks.length).toBeGreaterThanOrEqual(3)
    }
  })

  test('keeps reviewer checklist assets actionable rather than placeholder-level', () => {
    for (const item of HIOL_SOURCE_VS_LOCALIZED_COMPARISON_CHECKLIST) {
      expect(item.prompt.length).toBeGreaterThan(25)
      expect(item.why_it_matters.length).toBeGreaterThan(25)
      expect(looksLikePlaceholder(item.prompt)).toBe(false)
      expect(looksLikePlaceholder(item.why_it_matters)).toBe(false)
    }

    for (const prompt of HIOL_CERTAINTY_AMPLIFICATION_WATCHPOINTS) {
      expect(prompt.length).toBeGreaterThan(20)
      expect(looksLikePlaceholder(prompt)).toBe(false)
    }

    for (const prompt of HIOL_LOCAL_EXAGGERATION_WATCHPOINTS) {
      expect(prompt.length).toBeGreaterThan(20)
      expect(looksLikePlaceholder(prompt)).toBe(false)
    }

    for (const notes of HIOL_REDUCED_LANGUAGE_REVIEW_NOTES) {
      for (const prompt of notes.quick_revision_prompts) {
        expect(prompt.length).toBeGreaterThan(20)
        expect(looksLikePlaceholder(prompt)).toBe(false)
      }
    }
  })
})

describe('HIOL Tuning Preparation Pack - Title Surface Preparation Layer', () => {
  test('includes required title-surface review notes and bait-switch criteria', () => {
    expect(HIOL_TITLE_SURFACE_PREPARATION_NOTES.editorial_vs_seo_review_notes.length).toBeGreaterThanOrEqual(2)
    expect(HIOL_TITLE_SURFACE_PREPARATION_NOTES.editorial_vs_social_review_notes.length).toBeGreaterThanOrEqual(2)
    expect(HIOL_TITLE_SURFACE_PREPARATION_NOTES.editorial_vs_homepage_review_notes.length).toBeGreaterThanOrEqual(2)
    expect(HIOL_TITLE_SURFACE_PREPARATION_NOTES.bait_and_switch_warning_criteria.length).toBeGreaterThanOrEqual(4)
  })

  test('includes acceptable and unacceptable localized divergence examples', () => {
    const classes = new Set(HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES.map((item) => item.divergence_class))
    const exampleIds = new Set(HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES.map((item) => item.id))

    expect(classes.has('ACCEPTABLE')).toBe(true)
    expect(classes.has('UNACCEPTABLE')).toBe(true)
    expect(exampleIds.has('surface_example_acceptable_es')).toBe(true)
    expect(exampleIds.has('surface_example_acceptable_jp_homepage_simplification')).toBe(true)
    expect(exampleIds.has('surface_example_unacceptable_jp')).toBe(true)
    expect(exampleIds.has('surface_example_unacceptable_en_homepage_caveat_loss')).toBe(true)
    expect(exampleIds.has('surface_example_unacceptable_es_panic')).toBe(true)

    for (const example of HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES) {
      expect(example.localized_notes.length).toBeGreaterThan(0)
      expect(example.editorial_title.length).toBeGreaterThan(10)
      expect(example.seo_title.length).toBeGreaterThan(10)
      expect(example.social_title.length).toBeGreaterThanOrEqual(10)
      expect(example.homepage_title.length).toBeGreaterThan(5)

      if (example.divergence_class === 'UNACCEPTABLE') {
        expect(example.expected_outcome).not.toBe('ALLOW')
      }
    }
  })

  test('covers SEO, social, and homepage divergence axes with explicit outcome handling', () => {
    let hasSeoAxis = false
    let hasSocialAxis = false
    let hasHomepageAxis = false

    for (const example of HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES) {
      if (example.editorial_title !== example.seo_title) {
        hasSeoAxis = true
      }
      if (example.editorial_title !== example.social_title) {
        hasSocialAxis = true
      }
      if (example.editorial_title !== example.homepage_title) {
        hasHomepageAxis = true
      }
    }

    expect(hasSeoAxis).toBe(true)
    expect(hasSocialAxis).toBe(true)
    expect(hasHomepageAxis).toBe(true)
  })
})
