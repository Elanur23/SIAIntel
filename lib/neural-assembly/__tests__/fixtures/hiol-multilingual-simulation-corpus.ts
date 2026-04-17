import type { HIOLMultilingualSimulationCase } from './hiol-validation-corpus-types'

export const HIOL_MULTILINGUAL_SIMULATION_CORPUS: ReadonlyArray<HIOLMultilingualSimulationCase> = [
  {
    id: 'multi_anchor_regulatory_consultation',
    title: 'Regulatory consultation anchor with controlled severity shifts',
    articleType: 'POLICY_REGULATION',
    category: 'regulation / policy',
    sourceLanguage: 'en',
    sourceEntities: ['National regulator'],
    sourceHeadline: 'Regulator opens 30-day consultation on stablecoin disclosure draft',
    sourceLede: 'Officials said the consultation phase remains open and no final enforcement date is set.',
    sourceSummary: 'The article distinguishes consultation, draft text, and final legal adoption pathways.',
    variants: [
      {
        language: 'tr',
        localizedHeadline: 'Duzenleyici stablecoin aciklama taslagi icin 30 gunluk gorus sureci baslatti',
        localizedEntities: ['National regulator'],
        driftClass: 'FAITHFUL_TRANSLATION',
        expectedRuleHits: [],
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        notes: 'Reference-faithful translation preserving legal uncertainty.'
      },
      {
        language: 'de',
        localizedHeadline: 'Aufsicht startet 30-Tage-Konsultation zu Stablecoin-Offenlegung',
        localizedEntities: ['National regulator'],
        driftClass: 'ACCEPTABLE_TRANSCREATION',
        expectedRuleHits: [],
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        notes: 'Natural-language transcreation with unchanged legal meaning.'
      },
      {
        language: 'es',
        localizedHeadline: 'Regulador abre consulta sobre divulgacion de stablecoins antes de julio',
        localizedEntities: ['National regulator'],
        driftClass: 'MILD_DRIFT',
        expectedRuleHits: ['MULTILINGUAL_DRIFT'],
        expectedRouting: 'CORRECTION_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Introduces timing emphasis not present in source but still recoverable.'
      },
      {
        language: 'ru',
        localizedHeadline: 'Regulyator utverdil obyazatelnyi zakon po stablecoin raskrytiyu',
        localizedEntities: ['National regulator'],
        driftClass: 'SEVERE_DRIFT',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'REGULATORY_MISSTATEMENT'],
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'REGULATORY_REVIEW',
        notes: 'Converts draft consultation into final law approval.'
      },
      {
        language: 'tr',
        localizedHeadline: 'Duzenleyici kesin garanti stablecoin kurallarini hemen onayliyor',
        localizedEntities: ['National regulator'],
        driftClass: 'LOCAL_EXAGGERATION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION'],
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Adds local certainty and immediacy absent from source.'
      },
      {
        language: 'ar',
        localizedHeadline: 'Regulator muakad daman stablecoin qawanin tatbiq fawran',
        localizedEntities: ['National regulator'],
        driftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION'],
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Arabic transliteration injects deterministic certainty markers.'
      },
      {
        language: 'jp',
        localizedHeadline: 'Stablecoin kaiji no nami ga ichiya de shijo o nomikomu',
        localizedEntities: ['National regulator'],
        driftClass: 'CULTURAL_IDIOMATIC_DISTORTION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT'],
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Idiomatic wave metaphor implies disruptive force absent in source text.'
      }
    ],
    notes: 'Provides a full drift-spectrum anchor for policy/legal multilingual threshold design.',
    tags: ['multilingual', 'policy', 'drift-spectrum']
  },
  {
    id: 'multi_anchor_market_volatility',
    title: 'Market volatility anchor for certainty and panic amplification checks',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    sourceLanguage: 'en',
    sourceEntities: ['Benchmark index'],
    sourceHeadline: 'Index futures trade mixed as volatility remains elevated',
    sourceLede: 'Desks reported balanced flows and no deterministic one-day direction call.',
    sourceSummary: 'The report frames risk as two-sided with scenario-dependent outcomes.',
    variants: [
      {
        language: 'fr',
        localizedHeadline: 'Les contrats sur indice evoluent de facon mixte avec volatilite elevee',
        localizedEntities: ['Benchmark index'],
        driftClass: 'FAITHFUL_TRANSLATION',
        expectedRuleHits: [],
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        notes: 'Faithful market framing with preserved uncertainty.'
      },
      {
        language: 'es',
        localizedHeadline: 'Futuros del indice mixtos mientras sube la volatilidad intradia',
        localizedEntities: ['Benchmark index'],
        driftClass: 'ACCEPTABLE_TRANSCREATION',
        expectedRuleHits: [],
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        notes: 'Acceptable transcreation preserving thesis and risk balance.'
      },
      {
        language: 'de',
        localizedHeadline: 'Indexfutures bleiben gemischt, Risiko steigt bis Handelsschluss',
        localizedEntities: ['Benchmark index'],
        driftClass: 'MILD_DRIFT',
        expectedRuleHits: ['MULTILINGUAL_DRIFT'],
        expectedRouting: 'CORRECTION_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Slightly increases directional risk language while staying editable.'
      },
      {
        language: 'ru',
        localizedHeadline: 'Indeks tochno upadet segodnya bez varianta rosta',
        localizedEntities: ['Benchmark index'],
        driftClass: 'CERTAINTY_AMPLIFICATION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION', 'MARKET_MOVING_RISK'],
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'MARKET_RISK_REVIEW',
        notes: 'Injects deterministic downside call into probabilistic source anchor.'
      }
    ],
    notes: 'Supports market-sensitive localization tuning where certainty inflation is high impact.',
    tags: ['multilingual', 'macro-markets', 'certainty-amplification']
  },
  {
    id: 'multi_anchor_public_safety_update',
    title: 'Public safety anchor for panic-sensitive localization quality',
    articleType: 'PANIC_SENSITIVE',
    category: 'fear-prone topics',
    sourceLanguage: 'en',
    sourceEntities: ['Emergency agency'],
    sourceHeadline: 'Emergency agency reports localized outage and routine monitoring',
    sourceLede: 'Officials said there is no mass-alert recommendation and no citywide shutdown order.',
    sourceSummary: 'Coverage focuses on operational status and calm guidance for residents.',
    variants: [
      {
        language: 'tr',
        localizedHeadline: 'Acil kurum yerel kesinti icin rutin izleme acikladi',
        localizedEntities: ['Emergency agency'],
        driftClass: 'FAITHFUL_TRANSLATION',
        expectedRuleHits: [],
        expectedRouting: 'PASS',
        expectedEscalationClass: 'NONE',
        notes: 'Faithful safety update retaining restraint.'
      },
      {
        language: 'tr',
        localizedHeadline: 'Acil kurum panik cokus felaket dalgasi uyarisi verdi',
        localizedEntities: ['Emergency agency'],
        driftClass: 'LOCAL_EXAGGERATION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION', 'PANIC_FRAMING'],
        expectedRouting: 'SUPERVISOR_REVIEW_REQUIRED',
        expectedEscalationClass: 'PUBLIC_PANIC_REVIEW',
        notes: 'Localized panic lexicon dramatically escalates threat posture.'
      },
      {
        language: 'zh',
        localizedHeadline: 'Jinji jigou de gengxin yi chengwei chengshi jixu de xuanxuan fengbao',
        localizedEntities: ['Emergency agency'],
        driftClass: 'CULTURAL_IDIOMATIC_DISTORTION',
        expectedRuleHits: ['MULTILINGUAL_DRIFT'],
        expectedRouting: 'HUMAN_REVIEW_REQUIRED',
        expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW',
        notes: 'Idiom-heavy framing changes operational update into dramatic social narrative.'
      }
    ],
    notes: 'Calibrates fear-prone language drift and panic-trigger amplification across locales.',
    tags: ['multilingual', 'panic-sensitive', 'public-safety']
  }
]
