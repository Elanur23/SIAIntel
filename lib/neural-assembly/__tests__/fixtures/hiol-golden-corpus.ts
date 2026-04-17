import type { HIOLValidationCorpusCase } from './hiol-validation-corpus-types'

export const HIOL_GOLDEN_VALIDATION_CORPUS: ReadonlyArray<HIOLValidationCorpusCase> = [
  {
    id: 'green_breaking_policy_briefing',
    family: 'GOLDEN',
    title: 'Green breaking coverage stays factual during fast policy updates',
    articleType: 'BREAKING_NEWS',
    category: 'economy',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceEntities: ['Treasury Department'],
    sourceArticle: {
      summary: 'Treasury officials held a special briefing and kept the fuel tax schedule unchanged pending a June review.',
      lede: 'Officials said no emergency measure was announced and current tax guidance remains in place.',
      bodySummary: 'The briefing confirmed a process update only. Staff will publish technical revisions next month after a public consultation.'
    },
    proposedHeadline: 'Treasury keeps fuel tax schedule unchanged after special briefing',
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Anchors fast-moving policy reporting without inflating urgency or certainty.',
    tags: ['green', 'breaking', 'economy', 'baseline-precision']
  },
  {
    id: 'green_analysis_multilingual_safe_semiconductor',
    family: 'GOLDEN',
    title: 'Green analysis headline remains thesis-faithful across localized variants',
    articleType: 'ANALYSIS',
    category: 'technology',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Semiconductor suppliers'],
    sourceArticle: {
      summary: 'An analysis of supplier data shows semiconductor lead times normalizing as inventories rebalance across regions.',
      lede: 'Procurement data from three hubs shows narrower delivery windows compared with the prior quarter.',
      bodySummary: 'Analysts note that normalization is uneven, but there is no evidence of a supply shock or immediate price collapse.'
    },
    proposedHeadline: 'Analysis: chip lead times normalize as inventories rebalance across regions',
    multilingualVariants: [
      {
        language: 'tr',
        headline: 'Analiz: cip teslim sureleri bolgeler genelinde dengeleniyor',
        entities: ['Semiconductor suppliers'],
        notes: 'Faithful Turkish rendering keeps thesis and restraint.'
      },
      {
        language: 'de',
        headline: 'Analyse: Chip-Lieferzeiten normalisieren sich regional',
        entities: ['Semiconductor suppliers'],
        notes: 'Acceptable German transcreation preserving neutrality.'
      },
      {
        language: 'es',
        headline: 'Analisis: los plazos de chips se normalizan por region',
        entities: ['Semiconductor suppliers'],
        notes: 'Spanish variant keeps factual posture without certainty uplift.'
      }
    ],
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Acts as a multilingual-safe baseline for later drift threshold calibration.',
    tags: ['green', 'analysis', 'technology', 'multilingual-safe']
  },
  {
    id: 'green_explainer_policy_timeline',
    family: 'GOLDEN',
    title: 'Green explainer framing preserves process and timeline accuracy',
    articleType: 'EXPLAINER',
    category: 'regulation / policy',
    urgency: 'evergreen',
    sourceLanguage: 'en',
    sourceEntities: ['Parliament committee'],
    sourceArticle: {
      summary: 'A draft cyber reporting bill enters committee markup before a final vote window opens.',
      lede: 'Lawmakers published the amendment calendar and confirmed that the current draft is not yet final law.',
      bodySummary: 'The explainer details procedural steps, public comment options, and expected vote sequencing.'
    },
    proposedHeadline: 'Explainer: how the cyber reporting bill moves from markup to vote',
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Provides a clean process explainer anchor for policy-route editorial style.',
    tags: ['green', 'explainer', 'policy', 'process-clarity']
  },
  {
    id: 'green_market_report_bond_yields',
    family: 'GOLDEN',
    title: 'Green market report headline stays evidence-aligned and neutral',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Benchmark index', 'Bond market'],
    sourceArticle: {
      summary: 'Benchmark indexes closed mixed while sovereign yields stayed inside a narrow intraday range.',
      lede: 'Traders reported balanced positioning and no emergency policy signal in the closing session.',
      bodySummary: 'The report attributes moves to routine rebalancing and moderate macro data releases.'
    },
    proposedHeadline: 'Market report: indexes close mixed while yields hold a narrow range',
    titleSurfaces: {
      canonicalTitle: 'Market report: indexes close mixed while yields hold a narrow range',
      seoTitle: 'Indexes close mixed while yields stay in a narrow range',
      ogTitle: 'Market close update: indexes mixed, yields steady',
      socialTitle: 'Closing bell: mixed indexes and stable yields',
      homepageTitle: 'Mixed close as yields remain range-bound'
    },
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Control case for acceptable title-surface variation under market-sensitive profile.',
    tags: ['green', 'market-report', 'macro-markets', 'title-surface-control']
  },
  {
    id: 'green_crypto_liquidity_balance',
    family: 'GOLDEN',
    title: 'Green crypto headline avoids deterministic claims and keeps context',
    articleType: 'CRYPTO',
    category: 'crypto',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Bitcoin'],
    sourceArticle: {
      summary: 'Bitcoin traded in a tight weekly range as ETF inflows stabilized and derivatives leverage stayed moderate.',
      lede: 'Exchange data showed balanced positioning with no abrupt liquidity event.',
      bodySummary: 'Analysts highlighted two-sided risk and emphasized that near-term direction remains uncertain.'
    },
    proposedHeadline: 'Bitcoin trades in a tight range as ETF inflows stabilize',
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Serves as a clean crypto benchmark for non-sensational market language.',
    tags: ['green', 'crypto', 'market-integrity']
  },
  {
    id: 'green_ai_model_audit_release',
    family: 'GOLDEN',
    title: 'Green AI headline emphasizes verification instead of hype',
    articleType: 'AI_TECH',
    category: 'AI',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Atlas Labs'],
    sourceArticle: {
      summary: 'Atlas Labs released a multilingual model and published an external safety audit summary.',
      lede: 'The release note states model limitations and includes third-party benchmark methodology.',
      bodySummary: 'Editors can trace claims to benchmark tables and cited evaluation criteria.'
    },
    proposedHeadline: 'AI startup releases multilingual model with third-party safety audit',
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Useful for AI category baseline where novelty should not replace evidence framing.',
    tags: ['green', 'ai-tech', 'ai', 'evidence-forward']
  },
  {
    id: 'amber_mild_emotional_inflation_market',
    family: 'GOLDEN',
    title: 'Amber case with mild emotional inflation but otherwise accurate thesis',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Bond traders'],
    sourceArticle: {
      summary: 'A routine inflation release prompted moderate repositioning while policy guidance remained unchanged.',
      lede: 'Market desks described the move as notable but within prior quarter volatility bounds.',
      bodySummary: 'No emergency action was announced and analysts characterized the shift as temporary.'
    },
    proposedHeadline: 'Shocking inflation release jolts desks despite steady policy guidance',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_CORRECTION_REQUIRED',
      routing: 'CORRECTION_REQUIRED',
      expectedTriggeredRules: ['EMOTIONAL_INFLATION'],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Captures newsroom pressure where emotional packaging creeps into otherwise factual copy.',
    tags: ['amber', 'emotional-inflation', 'macro-markets']
  },
  {
    id: 'amber_partial_attribution_weakness',
    family: 'GOLDEN',
    title: 'Amber case with attribution weakness hidden behind polished tone',
    articleType: 'COMPANY_EARNINGS',
    category: 'public companies',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Orion Foods'],
    sourceArticle: {
      summary: 'Board members discussed merger timeline scenarios but no formal filing has been submitted.',
      lede: 'Investor materials describe options under review without a binding decision.',
      bodySummary: 'Company spokespeople declined to confirm timing and advised investors to wait for filings.'
    },
    proposedHeadline: 'Insiders reveal board may fast-track Orion merger timetable',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_CORRECTION_REQUIRED',
      routing: 'CORRECTION_REQUIRED',
      expectedTriggeredRules: ['PSEUDO_AUTHORITY_LANGUAGE'],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Targets subtle source-attribution decay common in competitive earnings coverage.',
    tags: ['amber', 'attribution', 'public-companies']
  },
  {
    id: 'amber_subtle_title_surface_mismatch',
    family: 'GOLDEN',
    title: 'Amber case where social packaging overstates policy certainty',
    articleType: 'POLICY_REGULATION',
    category: 'regulation / policy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['National regulator'],
    sourceArticle: {
      summary: 'The regulator extended a consultation window and did not issue a final approval.',
      lede: 'Officials said feedback remains open and final language may still change after review.',
      bodySummary: 'A timetable update was published, but no enforcement date has been confirmed.'
    },
    proposedHeadline: 'Regulator extends consultation window for digital asset disclosures',
    titleSurfaces: {
      canonicalTitle: 'Regulator extends consultation window for digital asset disclosures',
      seoTitle: 'Regulator extends digital asset disclosure consultation into July',
      ogTitle: 'Consultation timeline extended for disclosure rule draft',
      socialTitle: 'Regulator set to approve digital asset disclosure rules in July',
      homepageTitle: 'Disclosure consultation gets extended timeline'
    },
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Designed for title-surface governance where one channel introduces premature certainty.',
    tags: ['amber', 'title-surface', 'policy-regulation']
  },
  {
    id: 'amber_manageable_multilingual_drift',
    family: 'GOLDEN',
    title: 'Amber multilingual case with limited certainty creep in one locale',
    articleType: 'AI_TECH',
    category: 'technology',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Cloud vendors'],
    sourceArticle: {
      summary: 'Cloud vendors announced a phased model rollout with staged capacity checks.',
      lede: 'Teams said rollout speed depends on reliability metrics collected over two weeks.',
      bodySummary: 'The release notes include caveats, fallback plans, and documented limits.'
    },
    proposedHeadline: 'Cloud vendors begin phased model rollout with capacity checkpoints',
    multilingualVariants: [
      {
        language: 'tr',
        headline: 'Bulut sirketleri kesin garanti hizli model dagitimina basladi',
        entities: ['Cloud vendors'],
        notes: 'Introduces local certainty inflation while keeping actor continuity.'
      }
    ],
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION'],
      expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
    },
    notes: 'Helps tune drift thresholds for cases that are risky but still recoverable through editing.',
    tags: ['amber', 'multilingual-drift', 'technology']
  },
  {
    id: 'amber_number_date_framing_needs_correction',
    family: 'GOLDEN',
    title: 'Amber macro case with unsupported number-date framing',
    articleType: 'MACRO_ECONOMY',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Statistics bureau'],
    sourceArticle: {
      summary: 'The statistics bureau reported headline inflation at 2.1% in Q4 2026.',
      lede: 'Analysts said the release confirms cooling momentum but does not change policy guidance yet.',
      bodySummary: 'No 2027 estimate was included in the publication and no 1.2% figure appears in the release tables.'
    },
    proposedHeadline: 'Inflation slowed to 1.2% in Q4 2027, bureau says',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MISLEADING_NUMBER_OR_DATE'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Represents a common correction workload where one wrong numeric frame changes interpretation.',
    tags: ['amber', 'number-date', 'economy']
  },
  {
    id: 'amber_slight_certainty_overstatement',
    family: 'GOLDEN',
    title: 'Amber data-driven case with slight certainty overstatement',
    articleType: 'DATA_DRIVEN_REPORT',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Labor institute'],
    sourceArticle: {
      summary: 'A labor survey suggests wage pressure may ease over the next quarter.',
      lede: 'Researchers highlighted scenario uncertainty and said confidence intervals remain wide.',
      bodySummary: 'The methodology appendix warns against deterministic month-ahead interpretations.'
    },
    proposedHeadline: 'Wage pressure will certainly ease next quarter, survey indicates',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Useful for tuning certainty language where evidence is probabilistic, not definitive.',
    tags: ['amber', 'certainty-overstatement', 'data-driven']
  },
  {
    id: 'red_clear_clickbait_template',
    family: 'GOLDEN',
    title: 'Red case with explicit clickbait template and certainty packaging',
    articleType: 'ANALYSIS',
    category: 'regulation / policy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Regulator'],
    sourceArticle: {
      summary: 'A policy analysis discusses three implementation scenarios for a draft reporting framework.',
      lede: 'The article states that final adoption depends on consultation feedback and committee revisions.',
      bodySummary: 'No guaranteed outcome is available and multiple legal pathways remain open.'
    },
    proposedHeadline: '7 reasons this secret regulator plan is guaranteed to change everything',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['CLICKBAIT_TEMPLATE', 'UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'HIGH_TRAFFIC_HIGH_RISK_REVIEW'
    },
    notes: 'Stress-tests a high-CTR pattern that can evade weak editorial controls in policy reporting.',
    tags: ['red', 'clickbait', 'policy-regulation']
  },
  {
    id: 'red_legal_defamation_risk',
    family: 'GOLDEN',
    title: 'Red case for legal-defamation risk in enforcement reporting',
    articleType: 'LEGAL_ENFORCEMENT',
    category: 'security-sensitive topics',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['City court', 'Helios CEO'],
    sourceArticle: {
      summary: 'The court hearing remains active and no final verdict has been published.',
      lede: 'Both prosecution and defense said arguments are ongoing and records remain under review.',
      bodySummary: 'The filing history lists allegations but no adjudicated guilt finding.'
    },
    proposedHeadline: 'Court confirms Helios CEO certainly guilty of criminal scheme',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['LEGAL_RISK_LANGUAGE', 'UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'LEGAL_REVIEW'
    },
    notes: 'Critical legal-risk benchmark for defamation-safe language enforcement.',
    tags: ['red', 'legal-risk', 'security-sensitive']
  },
  {
    id: 'red_market_moving_certainty',
    family: 'GOLDEN',
    title: 'Red market case with deterministic crash call and unsupported confidence',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceEntities: ['Benchmark index'],
    sourceArticle: {
      summary: 'The morning note describes mixed positioning and elevated but manageable volatility.',
      lede: 'Strategists warned that short-term direction remains uncertain and scenario-dependent.',
      bodySummary: 'No research note supports a deterministic one-day 25% collapse estimate.'
    },
    proposedHeadline: 'Index will crash 25% today with no risk hedge possible',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_BLOCK',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MARKET_MOVING_RISK', 'UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'MARKET_RISK_REVIEW'
    },
    notes: 'Designed for hard-stop behavior around market-moving certainty claims.',
    tags: ['red', 'market-moving', 'macro-markets', 'hard-block-candidate']
  },
  {
    id: 'red_panic_framing_sensitive',
    family: 'GOLDEN',
    title: 'Red panic-prone case amplifying public fear without proportionate evidence',
    articleType: 'PANIC_SENSITIVE',
    category: 'fear-prone topics',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceEntities: ['Health ministry'],
    sourceArticle: {
      summary: 'Officials reported a localized incident and advised standard monitoring protocols.',
      lede: 'Authorities said there is no nationwide alert and no recommendation for public panic response.',
      bodySummary: 'Response teams are conducting routine containment checks under existing guidelines.'
    },
    proposedHeadline: 'Catastrophic collapse will trigger nationwide panic tonight',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['PANIC_FRAMING', 'UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'PUBLIC_PANIC_REVIEW'
    },
    notes: 'Essential panic-governance case for fear-prone editorial surfaces.',
    tags: ['red', 'panic-framing', 'fear-prone']
  },
  {
    id: 'red_title_body_mismatch_security',
    family: 'GOLDEN',
    title: 'Red case where polished headline diverges from body evidence',
    articleType: 'LEGAL_ENFORCEMENT',
    category: 'security-sensitive topics',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Defense ministry'],
    sourceArticle: {
      summary: 'A procurement audit hearing reviewed software vendor controls and contract documentation.',
      lede: 'Officials described the session as procedural and said no emergency directives were issued.',
      bodySummary: 'Minutes show no evacuation order, no border incident, and no immediate public advisory.'
    },
    proposedHeadline: 'Defense ministry orders mass evacuation after border strike',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['THESIS_DRIFT', 'TITLE_BODY_MISMATCH', 'EVIDENCE_MISMATCH'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Built for false-negative prevention where fluent language masks thesis divergence.',
    tags: ['red', 'title-body-mismatch', 'security-sensitive']
  },
  {
    id: 'red_title_surface_contradiction',
    family: 'GOLDEN',
    title: 'Red case with severe contradiction across title surfaces',
    articleType: 'COMPANY_EARNINGS',
    category: 'public companies',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Aster Telecom'],
    sourceArticle: {
      summary: 'Aster Telecom kept guidance unchanged while reporting stable subscriber growth.',
      lede: 'Management said debt metrics remain within prior quarter targets.',
      bodySummary: 'The filing does not mention bankruptcy, emergency financing, or guaranteed share spikes.'
    },
    proposedHeadline: 'Aster Telecom keeps annual guidance after stable quarter',
    titleSurfaces: {
      canonicalTitle: 'Aster Telecom keeps annual guidance after stable quarter',
      seoTitle: 'Aster Telecom files for bankruptcy after guidance collapse',
      ogTitle: 'Aster Telecom doubles profit overnight, analysts stunned',
      socialTitle: 'Guaranteed triple-digit rally today after surprise filing',
      homepageTitle: 'Aster quarter update'
    },
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Supports future threshold tuning for severe cross-surface contradiction governance.',
    tags: ['red', 'title-surface-contradiction', 'public-companies']
  },
  {
    id: 'red_severe_multilingual_exaggeration',
    family: 'GOLDEN',
    title: 'Red multilingual case with local exaggeration and actor drift',
    articleType: 'CRYPTO',
    category: 'crypto',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Bitcoin'],
    sourceArticle: {
      summary: 'A daily crypto desk note describes two-way volatility with balanced inflow data.',
      lede: 'The report warns that directional confidence remains low and sentiment is mixed.',
      bodySummary: 'No filing or exchange bulletin supports guaranteed one-day upside claims.'
    },
    proposedHeadline: 'Bitcoin trades sideways as liquidity remains two-sided',
    multilingualVariants: [
      {
        language: 'tr',
        headline: 'Baska aktor kesin garanti Bitcoin 300 artisla tum riski bitirdi',
        entities: ['Baska Aktor'],
        notes: 'Injects actor drift and certainty amplification in localized headline.'
      },
      {
        language: 'ru',
        headline: 'Bitcoin tochno garant rosta bez riska segodnya',
        entities: ['Bitcoin'],
        notes: 'Adds deterministic no-risk framing not present in source anchor.'
      }
    ],
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION'],
      expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
    },
    notes: 'Primary multilingual red benchmark for drift and local amplification failure analysis.',
    tags: ['red', 'multilingual-severe', 'crypto']
  },
  {
    id: 'red_fabricated_factual_emphasis',
    family: 'GOLDEN',
    title: 'Red data-driven case with fabricated numeric emphasis',
    articleType: 'DATA_DRIVEN_REPORT',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Labor institute'],
    sourceArticle: {
      summary: 'A labor institute report shows unemployment at 4.9% in March 2026.',
      lede: 'Researchers said month-to-month movement remains within expected statistical variance.',
      bodySummary: 'The publication includes no 0.4% reading and no April final estimate.'
    },
    proposedHeadline: 'Data report: unemployment drops to 0.4% in April 2026',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MISLEADING_NUMBER_OR_DATE', 'EVIDENCE_MISMATCH'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Critical false-negative guardrail against fabricated precision in data journalism.',
    tags: ['red', 'fabricated-facts', 'economy', 'data-driven']
  }
]
