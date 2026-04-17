import type { Language } from '../../core-types'

export interface HIOLReviewerChecklistItem {
  id: string
  prompt: string
  why_it_matters: string
}

export interface HIOLLanguageSpecificReviewNotes {
  language: 'en' | 'es' | 'jp'
  source_vs_localized_watchpoints: string[]
  certainty_amplification_watchpoints: string[]
  local_exaggeration_watchpoints: string[]
  quick_revision_prompts: string[]
}

export interface HIOLFutureLanguageExtensionSlot {
  language: Exclude<Language, 'en' | 'es' | 'jp'>
  required_parity_checks: string[]
  required_title_surface_checks: string[]
}

export interface HIOLTitleSurfaceDivergenceExample {
  id: string
  divergence_class: 'ACCEPTABLE' | 'UNACCEPTABLE'
  editorial_title: string
  seo_title: string
  social_title: string
  homepage_title: string
  localized_notes: string[]
  expected_outcome: 'ALLOW' | 'CORRECTION_REQUIRED' | 'HUMAN_REVIEW_REQUIRED'
}

export const HIOL_SOURCE_VS_LOCALIZED_COMPARISON_CHECKLIST: ReadonlyArray<HIOLReviewerChecklistItem> = [
  {
    id: 'compare_core_actor',
    prompt: 'Does each localized title preserve the same core actor/entity as the source title?',
    why_it_matters: 'Actor drift can invert accountability and create legal or trust failures.'
  },
  {
    id: 'compare_core_action',
    prompt: 'Does each localized title preserve the same action and event status as the source?',
    why_it_matters: 'Action drift can flip consultation into approval or rumor into confirmed fact.'
  },
  {
    id: 'compare_time_scope',
    prompt: 'Are time qualifiers and scope boundaries preserved without expansion?',
    why_it_matters: 'Scope inflation is a common driver of panic framing and regulatory misstatement.'
  },
  {
    id: 'compare_evidence_posture',
    prompt: 'Does the localized title keep probabilistic wording when source evidence is probabilistic?',
    why_it_matters: 'Certainty amplification can create unsupported claims and escalation risk.'
  },
  {
    id: 'compare_legal_status',
    prompt: 'If the source is procedural or contested, do localized titles avoid adjudicated-final wording?',
    why_it_matters: 'Legal status drift can trigger defamation and compliance exposure.'
  },
  {
    id: 'compare_market_claims',
    prompt: 'Do localized titles avoid deterministic market-moving direction calls unless explicitly supported?',
    why_it_matters: 'Deterministic market claims are high-risk and require strict evidence alignment.'
  },
  {
    id: 'compare_panic_language',
    prompt: 'Do localized titles avoid panic lexicon when source context is contained and routine?',
    why_it_matters: 'Panic amplification can materially distort public-risk posture.'
  },
  {
    id: 'compare_title_surface_equivalence',
    prompt: 'Are editorial, SEO, social, and homepage surfaces semantically equivalent in each language?',
    why_it_matters: 'Cross-surface contradictions create bait-and-switch behavior and trust failures.'
  }
]

export const HIOL_INVARIANT_FACT_CHECKLIST: ReadonlyArray<HIOLReviewerChecklistItem> = [
  {
    id: 'invariant_draft_vs_final',
    prompt: 'Draft/consultation status must not be converted to final legal adoption.',
    why_it_matters: 'Regulatory misstatement risk is severe when legal state changes in translation.'
  },
  {
    id: 'invariant_contested_vs_proven',
    prompt: 'Contested allegations must not be translated as proven guilt.',
    why_it_matters: 'Legal-risk language is high severity and usually requires escalation.'
  },
  {
    id: 'invariant_probabilistic_vs_certain',
    prompt: 'Probabilistic findings must not become deterministic certainty in localization.',
    why_it_matters: 'Unsupported certainty is a recurrent false-negative source in polished copy.'
  },
  {
    id: 'invariant_localized_scope',
    prompt: 'Localized incident scope must remain localized unless source confirms broader spread.',
    why_it_matters: 'Scope expansion can produce panic framing and public-harm amplification.'
  }
]

export const HIOL_CERTAINTY_AMPLIFICATION_WATCHPOINTS: ReadonlyArray<string> = [
  'Guaranteed, certain, inevitable, risk-free, no doubt, confirmed outcome, unstoppable.',
  'Time-compression certainty such as today for sure, within hours with certainty, immediate guaranteed move.',
  'Translation particles that intensify certainty while dropping source caveat language.',
  'Headline structures that convert likely or possible into will or must.'
]

export const HIOL_LOCAL_EXAGGERATION_WATCHPOINTS: ReadonlyArray<string> = [
  'Panic verbs that imply collapse, catastrophe, or irreversible failure when source says contained.',
  'Local idioms that amplify threat posture beyond source evidence.',
  'Emotion-heavy wording that changes neutral update into alarmist framing.',
  'Channel-specific social phrasing that injects urgency absent from editorial surface.'
]

export const HIOL_ACCEPTABLE_ADAPTATION_NOTES: ReadonlyArray<string> = [
  'Lexical localization is acceptable when actor, action, and risk posture remain equivalent.',
  'Syntactic compression is acceptable if caveat and uncertainty framing remain explicit.',
  'Culture-native readability is acceptable when no legal or market certainty uplift is introduced.',
  'Headline length adaptation is acceptable if title-surface semantic parity is preserved.'
]

export const HIOL_UNACCEPTABLE_DRIFT_NOTES: ReadonlyArray<string> = [
  'Converting draft consultation to final legal adoption.',
  'Converting contested allegation to adjudicated guilt.',
  'Converting probabilistic scenario into deterministic certainty.',
  'Converting localized contained incident into widespread panic narrative.',
  'Converting balanced market report into guaranteed directional trade call.',
  'Cross-surface channel contradiction where SEO or social headline says materially different claim.'
]

export const HIOL_REDUCED_LANGUAGE_REVIEW_NOTES: ReadonlyArray<HIOLLanguageSpecificReviewNotes> = [
  {
    language: 'en',
    source_vs_localized_watchpoints: [
      'Treat English source as invariant anchor for actor/action/legal status.',
      'Check whether caveat language in source is explicit enough to survive localization.'
    ],
    certainty_amplification_watchpoints: [
      'Replace deterministic modal verbs with probabilistic alternatives when source is uncertain.',
      'Avoid certainty adjectives in SEO/social variants unless evidence is explicit.'
    ],
    local_exaggeration_watchpoints: [
      'Watch for emotional packaging that overstates risk in social title variants.',
      'Do not let homepage simplification remove critical safety qualifiers.'
    ],
    quick_revision_prompts: [
      'What word in this title overstates certainty versus source?',
      'Which scope qualifier must be reintroduced to match source evidence?'
    ]
  },
  {
    language: 'es',
    source_vs_localized_watchpoints: [
      'Watch certainty-heavy verbs and adverbs that can overstate probabilistic findings.',
      'Confirm legal/process terms stay procedural and do not imply final adjudication.'
    ],
    certainty_amplification_watchpoints: [
      'Avoid certainty clusters such as con certeza, garantizado, inevitable when source is caveated.',
      'Check timeline compression terms that force immediate-outcome framing.'
    ],
    local_exaggeration_watchpoints: [
      'Flag panic vocabulary that reframes contained incidents as national collapse.',
      'Review social and SEO Spanish variants for hidden bait-switch wording.'
    ],
    quick_revision_prompts: [
      'Can this certainty phrase be replaced with a probabilistic equivalent?',
      'Does this Spanish variant preserve source legal status and timeline?'
    ]
  },
  {
    language: 'jp',
    source_vs_localized_watchpoints: [
      'Concise Japanese wording must still preserve uncertainty and procedural status.',
      'Check that compressed phrasing does not infer finality not present in source.'
    ],
    certainty_amplification_watchpoints: [
      'Flag finality markers that imply certainty without explicit source support.',
      'Watch for aggressive outcome phrasing in social title variants.'
    ],
    local_exaggeration_watchpoints: [
      'Identify idiomatic intensifiers that increase threat posture beyond source evidence.',
      'Ensure public-safety stories keep contained-scope framing in all channels.'
    ],
    quick_revision_prompts: [
      'Which Japanese phrase implies final certainty and should be softened?',
      'Does this title preserve source scope and avoid panic amplification?'
    ]
  }
]

export const HIOL_FUTURE_LANGUAGE_EXTENSION_SLOTS: ReadonlyArray<HIOLFutureLanguageExtensionSlot> = [
  {
    language: 'tr',
    required_parity_checks: [
      'Actor/action parity',
      'Certainty amplification check',
      'Local exaggeration check',
      'Legal status parity check'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'Editorial vs social risk parity',
      'Homepage simplification safety'
    ]
  },
  {
    language: 'de',
    required_parity_checks: [
      'Actor/action parity',
      'Regulatory wording precision',
      'Market certainty parity',
      'Caveat retention check'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'OG/social overstatement check',
      'Homepage simplification safety'
    ]
  },
  {
    language: 'fr',
    required_parity_checks: [
      'Actor/action parity',
      'Probabilistic modality preservation',
      'Legal process wording parity',
      'Drift severity check'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'Social urgency drift check',
      'Homepage simplification safety'
    ]
  },
  {
    language: 'ru',
    required_parity_checks: [
      'Actor/action parity',
      'Deterministic market call suppression',
      'Legal finality drift check',
      'Escalation threshold mapping'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'Social certainty amplification check',
      'Homepage simplification safety'
    ]
  },
  {
    language: 'ar',
    required_parity_checks: [
      'Actor/action parity',
      'Certainty particle amplification check',
      'Scope inflation check',
      'Risk posture parity'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'Social panic framing check',
      'Homepage simplification safety'
    ]
  },
  {
    language: 'zh',
    required_parity_checks: [
      'Actor/action parity',
      'Finality wording suppression',
      'Policy/legal stage parity',
      'Market certainty parity'
    ],
    required_title_surface_checks: [
      'Editorial vs SEO semantic parity',
      'Social overstatement check',
      'Homepage simplification safety'
    ]
  }
]

export const HIOL_TITLE_SURFACE_PREPARATION_NOTES = {
  editorial_vs_seo_review_notes: [
    'SEO title may optimize discoverability but cannot introduce new certainty, legal status, or market direction claims.',
    'If SEO includes stronger claim than editorial headline, treat as divergence requiring correction or escalation.'
  ],
  editorial_vs_social_review_notes: [
    'Social title must not trade factual parity for engagement hooks that alter risk posture.',
    'Emotional and panic-trigger wording in social channels requires immediate review in sensitive categories.'
  ],
  editorial_vs_homepage_review_notes: [
    'Homepage simplification is acceptable only when core thesis and caveats remain intact.',
    'Removing scope qualifiers in homepage title can create false certainty and must be corrected.'
  ],
  bait_and_switch_warning_criteria: [
    'Editorial says consultation/draft while SEO or social says final approval.',
    'Editorial is uncertainty-aware while SEO or social claims guaranteed outcome.',
    'Editorial is contained-scope while social implies widespread collapse.',
    'Editorial states stable guidance while SEO or social injects bankruptcy or moonshot claims.'
  ]
} as const

export const HIOL_TITLE_SURFACE_DIVERGENCE_EXAMPLES: ReadonlyArray<HIOLTitleSurfaceDivergenceExample> = [
  {
    id: 'surface_example_acceptable_es',
    divergence_class: 'ACCEPTABLE',
    editorial_title: 'Regulador abre consulta sobre norma de divulgacion',
    seo_title: 'Consulta regulatoria sobre divulgacion entra en nueva fase',
    social_title: 'Nueva fase de consulta regulatoria sobre divulgacion',
    homepage_title: 'Consulta regulatoria de divulgacion',
    localized_notes: [
      'Spanish channel variants preserve consultation status and avoid deterministic claims.',
      'Semantic parity is maintained across surfaces.'
    ],
    expected_outcome: 'ALLOW'
  },
  {
    id: 'surface_example_acceptable_jp_homepage_simplification',
    divergence_class: 'ACCEPTABLE',
    editorial_title: '当局は開示草案の協議を開始、期限内に意見募集を継続',
    seo_title: '開示草案の協議開始、意見募集を継続',
    social_title: '開示草案の協議が開始、意見募集は継続中',
    homepage_title: '開示草案の協議開始',
    localized_notes: [
      'Homepage title is simplified but preserves consultation-stage status without introducing finality.',
      'Editorial, SEO, and social surfaces remain semantically aligned on procedural posture.'
    ],
    expected_outcome: 'ALLOW'
  },
  {
    id: 'surface_example_unacceptable_jp',
    divergence_class: 'UNACCEPTABLE',
    editorial_title: '規制当局は開示案の協議を開始',
    seo_title: '規制当局が最終法を即時施行',
    social_title: '本日確実に市場が急騰',
    homepage_title: '開示案の協議開始',
    localized_notes: [
      'SEO and social surfaces inject final-law and guaranteed-outcome claims absent in editorial anchor.',
      'This is a direct bait-and-switch conflict requiring review escalation.'
    ],
    expected_outcome: 'HUMAN_REVIEW_REQUIRED'
  },
  {
    id: 'surface_example_unacceptable_en_homepage_caveat_loss',
    divergence_class: 'UNACCEPTABLE',
    editorial_title: 'Survey signals possible wage easing while confidence intervals stay wide',
    seo_title: 'Survey signals possible wage easing with wide confidence intervals',
    social_title: 'Possible wage easing emerges in survey with broad uncertainty',
    homepage_title: 'Wage easing is now underway',
    localized_notes: [
      'Homepage simplification removes probabilistic caveat and implies deterministic onset.',
      'This is not a panic case but still violates parity and should be corrected before publication.'
    ],
    expected_outcome: 'CORRECTION_REQUIRED'
  },
  {
    id: 'surface_example_unacceptable_es_panic',
    divergence_class: 'UNACCEPTABLE',
    editorial_title: 'Actualizacion de incidente localizado con monitoreo activo',
    seo_title: 'Incidente localizado bajo monitoreo rutinario',
    social_title: 'Colapso nacional inminente tras alerta oficial',
    homepage_title: 'Actualizacion de incidente localizado',
    localized_notes: [
      'Social channel introduces panic framing and expands scope from localized to national.',
      'Requires escalation under panic-sensitive controls.'
    ],
    expected_outcome: 'HUMAN_REVIEW_REQUIRED'
  }
]
