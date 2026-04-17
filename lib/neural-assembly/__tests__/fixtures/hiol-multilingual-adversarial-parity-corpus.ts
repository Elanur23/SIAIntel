import type {
  HeadlineArticleType,
  HeadlineEscalationClass,
  HeadlineRuleFamily,
  Language
} from '../../core-types'
import type {
  HIOLMultilingualDriftClass,
  HIOLRoutingExpectation
} from './hiol-validation-corpus-types'

export type HIOLMultilingualPreparationScenarioType =
  | 'FAITHFUL_TRANSLATION'
  | 'ACCEPTABLE_TRANSCREATION'
  | 'MILD_DRIFT'
  | 'SEVERE_DRIFT'
  | 'CERTAINTY_AMPLIFICATION'
  | 'LOCAL_EXAGGERATION'
  | 'LEGAL_RISK_TRANSLATION_DRIFT'
  | 'MARKET_MOVING_TRANSLATION_DRIFT'
  | 'TITLE_SURFACE_LOCALIZED_CONFLICT'

export type HIOLLanguagePreparationStatus =
  | 'ACTIVE_REDUCED_VALIDATION'
  | 'PLANNED_FULL_TARGET_EXTENSION'

export interface HIOLInvariantFactExpectation {
  id: string
  statement: string
  severity_if_broken: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface HIOLLocalizedTitleSurfaceExpectation {
  editorial: string | null
  seo: string | null
  social: string | null
  homepage: string | null
}

export interface HIOLLocalizedParityExpectation {
  language: Language
  preparation_status: HIOLLanguagePreparationStatus
  localized_headline: string | null
  localized_title_surfaces?: HIOLLocalizedTitleSurfaceExpectation
  invariant_fact_ids: string[]
  allowed_adaptation_notes: string[]
  expected_drift_class: HIOLMultilingualDriftClass
  expected_routing: HIOLRoutingExpectation
  expected_escalation_class: HeadlineEscalationClass
  expected_correction_direction: string
  expected_rule_hits: HeadlineRuleFamily[]
}

export interface HIOLMultilingualAdversarialParityCase {
  id: string
  title: string
  scenario_type: HIOLMultilingualPreparationScenarioType
  article_type: HeadlineArticleType
  category: string
  source_language: 'en'
  source_headline_anchor: string
  source_lede_anchor: string
  source_summary_anchor: string
  source_title_surfaces: HIOLLocalizedTitleSurfaceExpectation
  invariant_facts: ReadonlyArray<HIOLInvariantFactExpectation>
  localized_expectations: ReadonlyArray<HIOLLocalizedParityExpectation>
  notes: string
  tags: string[]
}

export type HIOLFalsePositiveFalseNegativeBucket =
  | 'BORDERLINE_AMBER'
  | 'SUBTLE_FALSE_NEGATIVE_TRAP'
  | 'MISLEADING_BUT_POLISHED'
  | 'EVIDENCE_INSUFFICIENT_FAST_MOVING'
  | 'CATEGORY_AMBIGUITY'
  | 'ARTICLE_TYPE_AMBIGUITY'

export interface HIOLFalsePositiveFalseNegativePreparationCase {
  id: string
  bucket: HIOLFalsePositiveFalseNegativeBucket
  article_type: HeadlineArticleType
  category: string
  source_headline_anchor: string
  source_context_anchor: string
  likely_missed_failure_mode: string
  expected_editorial_action: HIOLRoutingExpectation
  tuning_objective: string
}

export interface HIOLCategoryArticleTypePreparationEntry {
  article_type: HeadlineArticleType
  category: string
  preparation_objective: string
  linked_preparation_case_ids: string[]
  reviewer_focus: string[]
}

export const HIOL_TUNING_PREP_FULL_LANGUAGE_TARGET: readonly Language[] = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'ru',
  'ar',
  'jp',
  'zh'
] as const

export const HIOL_TUNING_PREP_REDUCED_LANGUAGE_SET: readonly Language[] = [
  'en',
  'es',
  'jp'
] as const

export const HIOL_TUNING_PREP_FUTURE_EXTENSION_LANGUAGES: readonly Language[] = [
  'tr',
  'de',
  'fr',
  'ru',
  'ar',
  'zh'
] as const

function buildPlannedExpectations(
  invariantFactIds: readonly string[]
): ReadonlyArray<HIOLLocalizedParityExpectation> {
  return HIOL_TUNING_PREP_FUTURE_EXTENSION_LANGUAGES.map((language) => ({
    language,
    preparation_status: 'PLANNED_FULL_TARGET_EXTENSION',
    localized_headline: null,
    localized_title_surfaces: {
      editorial: null,
      seo: null,
      social: null,
      homepage: null
    },
    invariant_fact_ids: [...invariantFactIds],
    allowed_adaptation_notes: [
      'Scaffold-only: reserve semantic slot for language-specific idiom only after source-fact parity checks pass.',
      'Scaffold-only: do not inject certainty or severity upgrades while localizing before activation.'
    ],
    expected_drift_class: 'FAITHFUL_TRANSLATION',
    expected_routing: 'HUMAN_REVIEW_REQUIRED',
    expected_escalation_class: 'MULTILINGUAL_EDITOR_REVIEW',
    expected_correction_direction: 'Scaffold-only: populate localized draft, then validate against invariant facts before activation.',
    expected_rule_hits: []
  }))
}

function activeExpectation(input: {
  language: 'es' | 'jp'
  localizedHeadline: string
  localizedTitleSurfaces?: HIOLLocalizedTitleSurfaceExpectation
  invariantFactIds: readonly string[]
  allowedAdaptationNotes: readonly string[]
  expectedDriftClass: HIOLMultilingualDriftClass
  expectedRouting: HIOLRoutingExpectation
  expectedEscalationClass: HeadlineEscalationClass
  expectedCorrectionDirection: string
  expectedRuleHits: readonly HeadlineRuleFamily[]
}): HIOLLocalizedParityExpectation {
  return {
    language: input.language,
    preparation_status: 'ACTIVE_REDUCED_VALIDATION',
    localized_headline: input.localizedHeadline,
    localized_title_surfaces: input.localizedTitleSurfaces,
    invariant_fact_ids: [...input.invariantFactIds],
    allowed_adaptation_notes: [...input.allowedAdaptationNotes],
    expected_drift_class: input.expectedDriftClass,
    expected_routing: input.expectedRouting,
    expected_escalation_class: input.expectedEscalationClass,
    expected_correction_direction: input.expectedCorrectionDirection,
    expected_rule_hits: [...input.expectedRuleHits]
  }
}

export const HIOL_MULTILINGUAL_ADVERSARIAL_PARITY_CORPUS: ReadonlyArray<HIOLMultilingualAdversarialParityCase> = [
  {
    id: 'ml_parity_faithful_translation_control',
    title: 'Faithful translation control for market stability reporting',
    scenario_type: 'FAITHFUL_TRANSLATION',
    article_type: 'MARKET_REPORT',
    category: 'market report',
    source_language: 'en',
    source_headline_anchor: 'Index futures trade mixed as liquidity remains balanced',
    source_lede_anchor: 'Desks reported two-sided flows and no emergency policy move in overnight trading.',
    source_summary_anchor: 'Coverage remains directional-neutral and does not claim a deterministic move.',
    source_title_surfaces: {
      editorial: 'Index futures trade mixed as liquidity remains balanced',
      seo: 'Index futures mixed while liquidity remains balanced',
      social: 'Mixed index futures session with balanced liquidity',
      homepage: 'Mixed futures, balanced liquidity'
    },
    invariant_facts: [
      {
        id: 'fact_liquidity_balanced',
        statement: 'Liquidity is balanced, not one-way.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_emergency_policy_shift',
        statement: 'No emergency policy move was announced.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_direction_uncertain',
        statement: 'Direction remains uncertain and two-sided.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Los futuros del indice cotizan mixtos con liquidez equilibrada',
        invariantFactIds: [
          'fact_liquidity_balanced',
          'fact_no_emergency_policy_shift',
          'fact_direction_uncertain'
        ],
        allowedAdaptationNotes: [
          'Natural Spanish phrasing is allowed when the uncertainty posture is preserved.',
          'Light stylistic smoothing is allowed if no deterministic certainty is added.'
        ],
        expectedDriftClass: 'FAITHFUL_TRANSLATION',
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        expectedCorrectionDirection: 'No correction required; maintain parity in future title surfaces.',
        expectedRuleHits: []
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '指数先物はまちまち、流動性は均衡を維持',
        invariantFactIds: [
          'fact_liquidity_balanced',
          'fact_no_emergency_policy_shift',
          'fact_direction_uncertain'
        ],
        allowedAdaptationNotes: [
          'Concise Japanese title style is allowed if neutrality and uncertainty are preserved.',
          'Do not add urgency particles that imply one-way certainty.'
        ],
        expectedDriftClass: 'FAITHFUL_TRANSLATION',
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        expectedCorrectionDirection: 'No correction required; retain anchor parity across updates.',
        expectedRuleHits: []
      }),
      ...buildPlannedExpectations([
        'fact_liquidity_balanced',
        'fact_no_emergency_policy_shift',
        'fact_direction_uncertain'
      ])
    ],
    notes: 'Primary parity control for reduced EN/ES/JP runtime with extension slots preserved for full-target rollout.',
    tags: ['multilingual', 'parity-control', 'market-report', 'reduced-language-active']
  },
  {
    id: 'ml_parity_acceptable_transcreation_control',
    title: 'Acceptable transcreation control for AI explainer framing',
    scenario_type: 'ACCEPTABLE_TRANSCREATION',
    article_type: 'EXPLAINER',
    category: 'AI/technology',
    source_language: 'en',
    source_headline_anchor: 'Explainer: how the model audit process validates multilingual safety claims',
    source_lede_anchor: 'The audit process remains iterative and does not certify universal model infallibility.',
    source_summary_anchor: 'The story explains process mechanics and caveats, not breakthrough certainty.',
    source_title_surfaces: {
      editorial: 'Explainer: how the model audit process validates multilingual safety claims',
      seo: 'Explainer on multilingual model audit process and safety caveats',
      social: 'How multilingual model audits validate safety claims',
      homepage: 'Multilingual model audit explainer'
    },
    invariant_facts: [
      {
        id: 'fact_iterative_audit',
        statement: 'Audit is iterative, not a one-time absolute proof.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_universal_infallibility',
        statement: 'No universal infallibility claim is supported.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_process_focus',
        statement: 'Headline must remain process-focused, not hype-focused.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Explicador: como la auditoria del modelo valida reclamos de seguridad multilingue',
        invariantFactIds: [
          'fact_iterative_audit',
          'fact_no_universal_infallibility',
          'fact_process_focus'
        ],
        allowedAdaptationNotes: [
          'Transcreated wording is allowed if caveat-preserving language remains explicit.',
          'Headline can prioritize readability over literal token order.'
        ],
        expectedDriftClass: 'ACCEPTABLE_TRANSCREATION',
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        expectedCorrectionDirection: 'No correction needed; keep explanatory framing.',
        expectedRuleHits: []
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '解説: 多言語安全性の主張を検証するモデル監査の流れ',
        invariantFactIds: [
          'fact_iterative_audit',
          'fact_no_universal_infallibility',
          'fact_process_focus'
        ],
        allowedAdaptationNotes: [
          'Japanese transcreation can compress wording while preserving caveat posture.',
          'Do not convert process wording into performance-superiority claims.'
        ],
        expectedDriftClass: 'ACCEPTABLE_TRANSCREATION',
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        expectedCorrectionDirection: 'No correction required; keep process language stable.',
        expectedRuleHits: []
      }),
      ...buildPlannedExpectations([
        'fact_iterative_audit',
        'fact_no_universal_infallibility',
        'fact_process_focus'
      ])
    ],
    notes: 'Prepares transcreation tolerance boundaries so future tuning can separate healthy adaptation from semantic drift.',
    tags: ['multilingual', 'acceptable-transcreation', 'ai-tech', 'parity-control']
  },
  {
    id: 'ml_drift_mild_needs_correction',
    title: 'Mild drift case for correction-first routing calibration',
    scenario_type: 'MILD_DRIFT',
    article_type: 'ANALYSIS',
    category: 'analysis',
    source_language: 'en',
    source_headline_anchor: 'Analysis: inflation cools unevenly as sector dispersion remains wide',
    source_lede_anchor: 'Researchers warned that trend confidence is limited by uneven sector behavior.',
    source_summary_anchor: 'The article avoids certainty and keeps scenario language explicit.',
    source_title_surfaces: {
      editorial: 'Analysis: inflation cools unevenly as sector dispersion remains wide',
      seo: 'Analysis: inflation cools unevenly across sectors',
      social: 'Inflation cooling is uneven across sectors, analysis says',
      homepage: 'Inflation cooling remains uneven'
    },
    invariant_facts: [
      {
        id: 'fact_dispersion_still_wide',
        statement: 'Sector dispersion remains wide.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_trend_certainty',
        statement: 'No deterministic trend claim is supported.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_analysis_not_breaking',
        statement: 'This is analysis context, not breaking certainty.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Analisis: la inflacion se enfria y el giro definitivo ya esta en marcha',
        invariantFactIds: [
          'fact_dispersion_still_wide',
          'fact_no_trend_certainty'
        ],
        allowedAdaptationNotes: [
          'Localized syntax may vary, but deterministic final-turn claims are not allowed.',
          'Keep uncertainty modifiers visible in headline framing.'
        ],
        expectedDriftClass: 'MILD_DRIFT',
        expectedRouting: 'CORRECTION_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Replace deterministic closing phrase with uncertainty-preserving wording.',
        expectedRuleHits: ['MULTILINGUAL_DRIFT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '分析: インフレ鈍化で転換はほぼ確実に進行',
        invariantFactIds: [
          'fact_dispersion_still_wide',
          'fact_no_trend_certainty'
        ],
        allowedAdaptationNotes: [
          'Tight Japanese phrasing is allowed if certainty remains probabilistic.',
          'Do not remove dispersion caveat from headline premise.'
        ],
        expectedDriftClass: 'MILD_DRIFT',
        expectedRouting: 'CORRECTION_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Reinsert caveat language and soften certainty marker.',
        expectedRuleHits: ['MULTILINGUAL_DRIFT']
      }),
      ...buildPlannedExpectations([
        'fact_dispersion_still_wide',
        'fact_no_trend_certainty',
        'fact_analysis_not_breaking'
      ])
    ],
    notes: 'Supports tighter AMBER correction boundaries where drift is recoverable without immediate supervisor escalation.',
    tags: ['multilingual', 'mild-drift', 'amber-boundary', 'analysis']
  },
  {
    id: 'ml_drift_severe_regulatory_flip',
    title: 'Severe drift case that flips draft consultation into final law',
    scenario_type: 'SEVERE_DRIFT',
    article_type: 'POLICY_REGULATION',
    category: 'policy/regulation',
    source_language: 'en',
    source_headline_anchor: 'Regulator opens consultation on cross-border disclosure draft',
    source_lede_anchor: 'Officials confirmed no final legal adoption date and no immediate sanctions.',
    source_summary_anchor: 'Coverage is explicitly draft-stage and consultation-bound.',
    source_title_surfaces: {
      editorial: 'Regulator opens consultation on cross-border disclosure draft',
      seo: 'Consultation opens for cross-border disclosure draft',
      social: 'Draft disclosure consultation opens',
      homepage: 'Disclosure draft consultation begins'
    },
    invariant_facts: [
      {
        id: 'fact_draft_status',
        statement: 'Policy status remains draft, not final law.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_immediate_sanctions',
        statement: 'No immediate sanctions were announced.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_consultation_window_active',
        statement: 'Consultation window is active and open feedback remains possible.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'El regulador aprobo la ley final y activa sanciones inmediatas',
        invariantFactIds: [
          'fact_draft_status',
          'fact_no_immediate_sanctions'
        ],
        allowedAdaptationNotes: [
          'No adaptation may convert draft state into final legal state.',
          'No adaptation may add immediate sanction language absent from source.'
        ],
        expectedDriftClass: 'SEVERE_DRIFT',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'REGULATORY_REVIEW',
        expectedCorrectionDirection: 'Restore draft-stage framing and remove sanction language.',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'REGULATORY_MISSTATEMENT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '規制当局が最終法を承認、即時制裁を開始',
        invariantFactIds: [
          'fact_draft_status',
          'fact_no_immediate_sanctions'
        ],
        allowedAdaptationNotes: [
          'Local wording cannot infer final adoption from consultation milestone.',
          'Sanction language requires explicit source support, otherwise prohibited.'
        ],
        expectedDriftClass: 'SEVERE_DRIFT',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'REGULATORY_REVIEW',
        expectedCorrectionDirection: 'Re-anchor to consultation status and remove legal-finality claims.',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'REGULATORY_MISSTATEMENT']
      }),
      ...buildPlannedExpectations([
        'fact_draft_status',
        'fact_no_immediate_sanctions',
        'fact_consultation_window_active'
      ])
    ],
    notes: 'High-impact legal/regulatory drift anchor for future strict escalation threshold tuning.',
    tags: ['multilingual', 'severe-drift', 'policy-regulation', 'regulatory-risk']
  },
  {
    id: 'ml_certainty_amplification_data_case',
    title: 'Certainty amplification case for probabilistic data reporting',
    scenario_type: 'CERTAINTY_AMPLIFICATION',
    article_type: 'DATA_DRIVEN_REPORT',
    category: 'data-driven report',
    source_language: 'en',
    source_headline_anchor: 'Survey signals possible wage easing while confidence intervals stay wide',
    source_lede_anchor: 'Analysts warn that one-quarter direction remains probabilistic, not guaranteed.',
    source_summary_anchor: 'Data confidence is moderate and includes large scenario variance.',
    source_title_surfaces: {
      editorial: 'Survey signals possible wage easing while confidence intervals stay wide',
      seo: 'Survey suggests possible wage easing with wide confidence intervals',
      social: 'Possible wage easing emerges in survey with wide intervals',
      homepage: 'Survey points to possible wage easing'
    },
    invariant_facts: [
      {
        id: 'fact_probabilistic_signal',
        statement: 'Signal is probabilistic, not deterministic.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_wide_intervals',
        statement: 'Confidence intervals remain wide.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_guaranteed_timeline',
        statement: 'No guaranteed timeline is supported.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'La encuesta confirma con certeza la baja salarial inmediata',
        invariantFactIds: [
          'fact_probabilistic_signal',
          'fact_wide_intervals',
          'fact_no_guaranteed_timeline'
        ],
        allowedAdaptationNotes: [
          'Spanish fluency adaptation cannot remove uncertainty qualifiers.',
          'Any deterministic timeline insertion is disallowed.'
        ],
        expectedDriftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'SENIOR_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Restore probabilistic modality and interval caveats.',
        expectedRuleHits: ['UNSUPPORTED_CERTAINTY', 'MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '調査で賃金低下が確実、直ちに進行',
        invariantFactIds: [
          'fact_probabilistic_signal',
          'fact_wide_intervals',
          'fact_no_guaranteed_timeline'
        ],
        allowedAdaptationNotes: [
          'Japanese compression must keep possibility framing explicit.',
          'Immediate-progress certainty claims are not allowed without source evidence.'
        ],
        expectedDriftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'SENIOR_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Re-add uncertainty and remove immediate certainty language.',
        expectedRuleHits: ['UNSUPPORTED_CERTAINTY', 'MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION']
      }),
      ...buildPlannedExpectations([
        'fact_probabilistic_signal',
        'fact_wide_intervals',
        'fact_no_guaranteed_timeline'
      ])
    ],
    notes: 'Targets subtle certainty uplift that can become false negatives in polished multilingual copy.',
    tags: ['multilingual', 'certainty-amplification', 'data-driven', 'false-negative-trap']
  },
  {
    id: 'ml_local_exaggeration_panic_sensitive',
    title: 'Local exaggeration case for panic-prone public safety updates',
    scenario_type: 'LOCAL_EXAGGERATION',
    article_type: 'PANIC_SENSITIVE',
    category: 'panic-prone/sensitive stories',
    source_language: 'en',
    source_headline_anchor: 'Agency reports localized outage and routine monitoring remains active',
    source_lede_anchor: 'Officials stated no citywide emergency order and no evacuation directive.',
    source_summary_anchor: 'The event remains contained with standard operating posture.',
    source_title_surfaces: {
      editorial: 'Agency reports localized outage and routine monitoring remains active',
      seo: 'Localized outage update with routine monitoring still active',
      social: 'Localized outage remains under routine monitoring',
      homepage: 'Localized outage monitoring update'
    },
    invariant_facts: [
      {
        id: 'fact_contained_scope',
        statement: 'Incident scope is localized and contained.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_evacuation_order',
        statement: 'No evacuation directive was issued.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_routine_monitoring',
        statement: 'Monitoring posture is routine, not catastrophic.',
        severity_if_broken: 'HIGH'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Alerta total: colapso inminente tras fallo masivo nacional',
        invariantFactIds: [
          'fact_contained_scope',
          'fact_no_evacuation_order',
          'fact_routine_monitoring'
        ],
        allowedAdaptationNotes: [
          'No adaptation may introduce national-collapse framing.',
          'Panic-inducing urgency must remain prohibited unless source supports it.'
        ],
        expectedDriftClass: 'LOCAL_EXAGGERATION',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'PUBLIC_PANIC_REVIEW',
        expectedCorrectionDirection: 'Remove panic amplification and restore contained-scope language.',
        expectedRuleHits: ['LOCAL_LANGUAGE_EXAGGERATION', 'PANIC_FRAMING', 'MULTILINGUAL_DRIFT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '全国崩壊が迫る緊急警報、即時避難へ',
        invariantFactIds: [
          'fact_contained_scope',
          'fact_no_evacuation_order',
          'fact_routine_monitoring'
        ],
        allowedAdaptationNotes: [
          'Urgency markers must not imply nationwide collapse without source evidence.',
          'Evacuation language is forbidden unless explicitly present in source reporting.'
        ],
        expectedDriftClass: 'LOCAL_EXAGGERATION',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'PUBLIC_PANIC_REVIEW',
        expectedCorrectionDirection: 'Re-anchor to localized, contained incident framing.',
        expectedRuleHits: ['LOCAL_LANGUAGE_EXAGGERATION', 'PANIC_FRAMING', 'MULTILINGUAL_DRIFT']
      }),
      ...buildPlannedExpectations([
        'fact_contained_scope',
        'fact_no_evacuation_order',
        'fact_routine_monitoring'
      ])
    ],
    notes: 'Prepares panic-sensitive multilingual safeguards before broad language re-expansion.',
    tags: ['multilingual', 'local-exaggeration', 'panic-sensitive', 'public-safety']
  },
  {
    id: 'ml_legal_risk_translation_drift',
    title: 'Legal-risk translation drift case for enforcement headlines',
    scenario_type: 'LEGAL_RISK_TRANSLATION_DRIFT',
    article_type: 'LEGAL_ENFORCEMENT',
    category: 'legal/enforcement',
    source_language: 'en',
    source_headline_anchor: 'Court hearing continues as allegations remain contested',
    source_lede_anchor: 'Proceedings are active and no final verdict has been issued.',
    source_summary_anchor: 'All allegations remain disputed under active court process.',
    source_title_surfaces: {
      editorial: 'Court hearing continues as allegations remain contested',
      seo: 'Court hearing continues while allegations remain contested',
      social: 'Hearing continues, allegations still contested',
      homepage: 'Court hearing remains active'
    },
    invariant_facts: [
      {
        id: 'fact_no_final_verdict',
        statement: 'No final verdict has been issued.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_allegations_disputed',
        statement: 'Allegations remain disputed and unadjudicated.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_active_proceeding',
        statement: 'Proceeding status is active, not closed.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'El tribunal confirma al acusado culpable en el caso final',
        invariantFactIds: [
          'fact_no_final_verdict',
          'fact_allegations_disputed'
        ],
        allowedAdaptationNotes: [
          'Localization cannot convert allegation to adjudicated guilt.',
          'Final-verdict language requires explicit source confirmation.'
        ],
        expectedDriftClass: 'SEVERE_DRIFT',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'LEGAL_REVIEW',
        expectedCorrectionDirection: 'Restore contested-allegation framing and remove guilt assertion.',
        expectedRuleHits: ['LEGAL_RISK_LANGUAGE', 'MULTILINGUAL_DRIFT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: '裁判所が被告の有罪を最終確定',
        invariantFactIds: [
          'fact_no_final_verdict',
          'fact_allegations_disputed'
        ],
        allowedAdaptationNotes: [
          'Japanese legal wording must preserve procedural uncertainty when verdict is absent.',
          'Do not use finality verbs without source adjudication evidence.'
        ],
        expectedDriftClass: 'SEVERE_DRIFT',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'LEGAL_REVIEW',
        expectedCorrectionDirection: 'Rephrase to procedural status and contested allegations.',
        expectedRuleHits: ['LEGAL_RISK_LANGUAGE', 'MULTILINGUAL_DRIFT']
      }),
      ...buildPlannedExpectations([
        'fact_no_final_verdict',
        'fact_allegations_disputed',
        'fact_active_proceeding'
      ])
    ],
    notes: 'Critical legal-safe translation anchor for false-negative prevention before wider language activation.',
    tags: ['multilingual', 'legal-risk', 'translation-drift', 'enforcement']
  },
  {
    id: 'ml_market_moving_translation_drift',
    title: 'Market-moving translation drift with deterministic claim injection',
    scenario_type: 'MARKET_MOVING_TRANSLATION_DRIFT',
    article_type: 'CRYPTO',
    category: 'crypto',
    source_language: 'en',
    source_headline_anchor: 'Bitcoin remains range-bound as liquidity stays mixed',
    source_lede_anchor: 'Analysts describe two-sided conditions and avoid one-day certainty calls.',
    source_summary_anchor: 'No exchange bulletin supports guaranteed upside or downside outcomes.',
    source_title_surfaces: {
      editorial: 'Bitcoin remains range-bound as liquidity stays mixed',
      seo: 'Bitcoin range-bound while liquidity remains mixed',
      social: 'Bitcoin stays range-bound in mixed liquidity session',
      homepage: 'Bitcoin range remains mixed'
    },
    invariant_facts: [
      {
        id: 'fact_range_bound',
        statement: 'Price action is range-bound, not deterministic breakout.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_guaranteed_move',
        statement: 'No guaranteed directional move is supported.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_liquidity_mixed',
        statement: 'Liquidity remains mixed and two-sided.',
        severity_if_broken: 'MEDIUM'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Bitcoin subira con certeza extrema y sin riesgo en horas',
        invariantFactIds: [
          'fact_range_bound',
          'fact_no_guaranteed_move',
          'fact_liquidity_mixed'
        ],
        allowedAdaptationNotes: [
          'No adaptation can add risk-free certainty framing.',
          'Do not convert range-bound analysis into deterministic trade call.'
        ],
        expectedDriftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'MARKET_RISK_REVIEW',
        expectedCorrectionDirection: 'Remove deterministic trade claim and restore range-bound framing.',
        expectedRuleHits: ['MARKET_MOVING_RISK', 'UNSUPPORTED_CERTAINTY', 'MULTILINGUAL_DRIFT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: 'ビットコインは数時間で確実急騰、リスクなし',
        invariantFactIds: [
          'fact_range_bound',
          'fact_no_guaranteed_move',
          'fact_liquidity_mixed'
        ],
        allowedAdaptationNotes: [
          'Japanese copy may be concise but cannot imply guaranteed no-risk returns.',
          'Directional certainty claims require explicit source proof.'
        ],
        expectedDriftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'MARKET_RISK_REVIEW',
        expectedCorrectionDirection: 'Restore mixed-liquidity and uncertainty language.',
        expectedRuleHits: ['MARKET_MOVING_RISK', 'UNSUPPORTED_CERTAINTY', 'MULTILINGUAL_DRIFT']
      }),
      ...buildPlannedExpectations([
        'fact_range_bound',
        'fact_no_guaranteed_move',
        'fact_liquidity_mixed'
      ])
    ],
    notes: 'High-priority market-risk localization fixture for multilingual false-negative hardening.',
    tags: ['multilingual', 'market-moving', 'crypto', 'certainty-risk']
  },
  {
    id: 'ml_title_surface_localized_conflict',
    title: 'Localized title-surface conflict case for bait-and-switch prevention',
    scenario_type: 'TITLE_SURFACE_LOCALIZED_CONFLICT',
    article_type: 'COMPANY_EARNINGS',
    category: 'company/earnings',
    source_language: 'en',
    source_headline_anchor: 'Vertex keeps annual guidance after stable quarterly margin',
    source_lede_anchor: 'Management reiterated guidance and reported no extraordinary filing event.',
    source_summary_anchor: 'No bankruptcy filing or guaranteed rally signal appears in source documents.',
    source_title_surfaces: {
      editorial: 'Vertex keeps annual guidance after stable quarterly margin',
      seo: 'Vertex keeps guidance after stable quarterly margin',
      social: 'Vertex guidance remains unchanged after stable quarter',
      homepage: 'Vertex quarterly guidance update'
    },
    invariant_facts: [
      {
        id: 'fact_guidance_unchanged',
        statement: 'Guidance remains unchanged.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_bankruptcy_signal',
        statement: 'No bankruptcy event is present in source filing.',
        severity_if_broken: 'HIGH'
      },
      {
        id: 'fact_no_guaranteed_rally',
        statement: 'No guaranteed rally claim is supported.',
        severity_if_broken: 'HIGH'
      }
    ],
    localized_expectations: [
      activeExpectation({
        language: 'es',
        localizedHeadline: 'Vertex mantiene guia anual tras margen trimestral estable',
        localizedTitleSurfaces: {
          editorial: 'Vertex mantiene guia anual tras margen trimestral estable',
          seo: 'Quiebra de Vertex confirmada tras colapso del margen',
          social: 'Rally garantizado de Vertex empieza hoy',
          homepage: 'Actualizacion trimestral de Vertex'
        },
        invariantFactIds: [
          'fact_guidance_unchanged',
          'fact_no_bankruptcy_signal',
          'fact_no_guaranteed_rally'
        ],
        allowedAdaptationNotes: [
          'Localized SEO and social surfaces must preserve editorial thesis equivalence.',
          'No channel may introduce bankruptcy or guaranteed-rally claims without source proof.'
        ],
        expectedDriftClass: 'MILD_DRIFT',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'SENIOR_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Align SEO/social surfaces to editorial anchor and remove sensational claims.',
        expectedRuleHits: ['TITLE_SURFACE_INCONSISTENCY', 'MULTILINGUAL_DRIFT']
      }),
      activeExpectation({
        language: 'jp',
        localizedHeadline: 'Vertexは安定した四半期後も通期見通しを維持',
        localizedTitleSurfaces: {
          editorial: 'Vertexは安定した四半期後も通期見通しを維持',
          seo: 'Vertex破綻申請で見通し崩壊',
          social: '本日確実に株価急騰',
          homepage: 'Vertex四半期更新'
        },
        invariantFactIds: [
          'fact_guidance_unchanged',
          'fact_no_bankruptcy_signal',
          'fact_no_guaranteed_rally'
        ],
        allowedAdaptationNotes: [
          'Japanese channel-specific brevity cannot alter thesis or certainty posture.',
          'Editorial, SEO, social, and homepage surfaces must remain semantically aligned.'
        ],
        expectedDriftClass: 'MILD_DRIFT',
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'SENIOR_EDITOR_REVIEW',
        expectedCorrectionDirection: 'Reconcile localized title surfaces and remove bait-switch language.',
        expectedRuleHits: ['TITLE_SURFACE_INCONSISTENCY', 'MULTILINGUAL_DRIFT']
      }),
      ...buildPlannedExpectations([
        'fact_guidance_unchanged',
        'fact_no_bankruptcy_signal',
        'fact_no_guaranteed_rally'
      ])
    ],
    notes: 'Prepares title-surface parity tuning so multilingual channels cannot bypass editorial thesis control.',
    tags: ['multilingual', 'title-surface', 'bait-switch', 'company-earnings']
  }
]

export const HIOL_FP_FN_TUNING_PREPARATION_CASES: ReadonlyArray<HIOLFalsePositiveFalseNegativePreparationCase> = [
  {
    id: 'fpfn_borderline_amber_breaking_context_drop',
    bucket: 'BORDERLINE_AMBER',
    article_type: 'BREAKING_NEWS',
    category: 'breaking news',
    source_headline_anchor: 'Breaking: rail service pauses on two lines pending safety checks',
    source_context_anchor: 'Service pause is localized and temporary with no citywide shutdown order.',
    likely_missed_failure_mode: 'Urgency language can erase locality qualifier and force unnecessary panic posture.',
    expected_editorial_action: 'CORRECTION_REQUIRED',
    tuning_objective: 'Tighten borderline AMBER threshold where urgency amplification strips key scope qualifiers.'
  },
  {
    id: 'fpfn_subtle_false_negative_macro_caveat_loss',
    bucket: 'SUBTLE_FALSE_NEGATIVE_TRAP',
    article_type: 'MACRO_ECONOMY',
    category: 'macro/economy',
    source_headline_anchor: 'Macro note points to uneven cooling while confidence intervals remain broad',
    source_context_anchor: 'The source keeps probability framing and warns against deterministic quarter-ahead calls.',
    likely_missed_failure_mode: 'Polished copy can hide certainty inflation while retaining analytical tone.',
    expected_editorial_action: 'HUMAN_REVIEW_REQUIRED',
    tuning_objective: 'Improve detection of polished deterministic language in otherwise neutral macro analysis.'
  },
  {
    id: 'fpfn_misleading_polished_ai_benchmark_spin',
    bucket: 'MISLEADING_BUT_POLISHED',
    article_type: 'AI_TECH',
    category: 'AI/technology',
    source_headline_anchor: 'Model benchmark update shows gains in selected multilingual tasks',
    source_context_anchor: 'Benchmark gains are task-limited and accompanied by explicit failure caveats.',
    likely_missed_failure_mode: 'Fluent wording can over-generalize narrow benchmark wins into universal superiority.',
    expected_editorial_action: 'HUMAN_REVIEW_REQUIRED',
    tuning_objective: 'Strengthen evidence-to-claim proportionality checks for polished AI performance headlines.'
  },
  {
    id: 'fpfn_evidence_insufficient_fast_moving_policy_event',
    bucket: 'EVIDENCE_INSUFFICIENT_FAST_MOVING',
    article_type: 'POLICY_REGULATION',
    category: 'policy/regulation',
    source_headline_anchor: 'Officials signal pending statement after emergency policy meeting',
    source_context_anchor: 'No formal communique is published and only preliminary remarks are available.',
    likely_missed_failure_mode: 'Fast-cycle updates may overstate legal status before primary documents are published.',
    expected_editorial_action: 'HUMAN_REVIEW_REQUIRED',
    tuning_objective: 'Prepare evidence sufficiency gating for fast-moving policy stories under incomplete documentation.'
  },
  {
    id: 'fpfn_category_ambiguity_legal_policy_overlap',
    bucket: 'CATEGORY_AMBIGUITY',
    article_type: 'LEGAL_ENFORCEMENT',
    category: 'legal/enforcement',
    source_headline_anchor: 'Oversight hearing reviews enforcement draft and compliance pathway',
    source_context_anchor: 'Story mixes legal process language with policy consultation milestones.',
    likely_missed_failure_mode: 'Classifier can misroute escalation when legal and policy signals overlap in one headline.',
    expected_editorial_action: 'SUPERVISOR_REVIEW_REQUIRED',
    tuning_objective: 'Create clear tuning probes for category ambiguity in legal-policy overlap routing and escalation consistency.'
  },
  {
    id: 'fpfn_category_ambiguity_company_data_overlap',
    bucket: 'ARTICLE_TYPE_AMBIGUITY',
    article_type: 'DATA_DRIVEN_REPORT',
    category: 'company/earnings',
    source_headline_anchor: 'Earnings dashboard shows stable margin with mixed segment-level demand',
    source_context_anchor: 'Data emphasizes segment heterogeneity and avoids immediate growth guarantees.',
    likely_missed_failure_mode: 'Company earnings framing can hide data caveats and slip into deterministic investor claims.',
    expected_editorial_action: 'CORRECTION_REQUIRED',
    tuning_objective: 'Sharpen article-type ambiguity distinction between descriptive dashboard language and investor-certainty language.'
  }
]

export const HIOL_CATEGORY_AND_ARTICLE_TYPE_PREPARATION_MATRIX: ReadonlyArray<HIOLCategoryArticleTypePreparationEntry> = [
  {
    article_type: 'BREAKING_NEWS',
    category: 'breaking news',
    preparation_objective: 'Preserve scope qualifiers and avoid panic over-amplification during fast updates.',
    linked_preparation_case_ids: ['fpfn_borderline_amber_breaking_context_drop'],
    reviewer_focus: ['scope qualifiers', 'urgency framing', 'hold-from-publish threshold']
  },
  {
    article_type: 'ANALYSIS',
    category: 'analysis',
    preparation_objective: 'Separate evidence-based interpretation from deterministic analytical framing.',
    linked_preparation_case_ids: ['ml_drift_mild_needs_correction'],
    reviewer_focus: ['probabilistic language', 'thesis fidelity', 'correction-first routing']
  },
  {
    article_type: 'EXPLAINER',
    category: 'explainer',
    preparation_objective: 'Protect process-focused explainers from hype conversion in localization.',
    linked_preparation_case_ids: ['ml_parity_acceptable_transcreation_control'],
    reviewer_focus: ['process wording', 'caveat retention', 'semantic parity']
  },
  {
    article_type: 'MARKET_REPORT',
    category: 'market report',
    preparation_objective: 'Keep market headlines neutral and prevent directional certainty injection.',
    linked_preparation_case_ids: ['ml_parity_faithful_translation_control'],
    reviewer_focus: ['market certainty control', 'evidence proportionality', 'surface parity']
  },
  {
    article_type: 'MACRO_ECONOMY',
    category: 'macro/economy',
    preparation_objective: 'Detect polished certainty inflation where caveat language is partially removed.',
    linked_preparation_case_ids: ['fpfn_subtle_false_negative_macro_caveat_loss'],
    reviewer_focus: ['confidence interval caveats', 'trend certainty', 'borderline AMBER handling']
  },
  {
    article_type: 'CRYPTO',
    category: 'crypto',
    preparation_objective: 'Block deterministic and risk-free claims in multilingual market-sensitive copy.',
    linked_preparation_case_ids: ['ml_market_moving_translation_drift'],
    reviewer_focus: ['market-moving certainty', 'localized exaggeration', 'supervisor escalation trigger']
  },
  {
    article_type: 'AI_TECH',
    category: 'AI/technology',
    preparation_objective: 'Prevent benchmark over-generalization and unsupported superiority claims.',
    linked_preparation_case_ids: ['fpfn_misleading_polished_ai_benchmark_spin'],
    reviewer_focus: ['benchmark caveats', 'claim scope control', 'polished false-negative traps']
  },
  {
    article_type: 'POLICY_REGULATION',
    category: 'policy/regulation',
    preparation_objective: 'Prevent draft-consultation language from drifting into final-law certainty.',
    linked_preparation_case_ids: [
      'ml_drift_severe_regulatory_flip',
      'fpfn_evidence_insufficient_fast_moving_policy_event'
    ],
    reviewer_focus: ['legal status precision', 'evidence sufficiency', 'regulatory escalation consistency']
  },
  {
    article_type: 'LEGAL_ENFORCEMENT',
    category: 'legal/enforcement',
    preparation_objective: 'Protect legal-safe wording and preserve contested-status framing.',
    linked_preparation_case_ids: [
      'ml_legal_risk_translation_drift',
      'fpfn_category_ambiguity_legal_policy_overlap'
    ],
    reviewer_focus: ['defamation-safe phrasing', 'adjudication status', 'legal escalation thresholds']
  },
  {
    article_type: 'COMPANY_EARNINGS',
    category: 'company/earnings',
    preparation_objective: 'Prevent title-surface bait-switch patterns in localized distribution channels.',
    linked_preparation_case_ids: ['ml_title_surface_localized_conflict'],
    reviewer_focus: ['editorial vs SEO parity', 'social overstatement', 'surface contradiction']
  },
  {
    article_type: 'DATA_DRIVEN_REPORT',
    category: 'data-driven report',
    preparation_objective: 'Protect probabilistic findings from certainty amplification and category confusion.',
    linked_preparation_case_ids: [
      'ml_certainty_amplification_data_case',
      'fpfn_category_ambiguity_company_data_overlap'
    ],
    reviewer_focus: ['statistical caveats', 'numeric claim framing', 'routing under ambiguity']
  },
  {
    article_type: 'PANIC_SENSITIVE',
    category: 'panic-prone/sensitive stories',
    preparation_objective: 'Suppress panic escalation wording when source indicates contained impact.',
    linked_preparation_case_ids: ['ml_local_exaggeration_panic_sensitive'],
    reviewer_focus: ['panic framing markers', 'scope preservation', 'public-risk escalation discipline']
  }
]

export const HIOL_TUNING_PREP_REQUIRED_SCENARIO_TYPES: ReadonlyArray<HIOLMultilingualPreparationScenarioType> = [
  'FAITHFUL_TRANSLATION',
  'ACCEPTABLE_TRANSCREATION',
  'MILD_DRIFT',
  'SEVERE_DRIFT',
  'CERTAINTY_AMPLIFICATION',
  'LOCAL_EXAGGERATION',
  'LEGAL_RISK_TRANSLATION_DRIFT',
  'MARKET_MOVING_TRANSLATION_DRIFT',
  'TITLE_SURFACE_LOCALIZED_CONFLICT'
]

export const HIOL_TUNING_PREP_REQUIRED_FP_FN_BUCKETS: ReadonlyArray<HIOLFalsePositiveFalseNegativeBucket> = [
  'BORDERLINE_AMBER',
  'SUBTLE_FALSE_NEGATIVE_TRAP',
  'MISLEADING_BUT_POLISHED',
  'EVIDENCE_INSUFFICIENT_FAST_MOVING',
  'CATEGORY_AMBIGUITY',
  'ARTICLE_TYPE_AMBIGUITY'
]
