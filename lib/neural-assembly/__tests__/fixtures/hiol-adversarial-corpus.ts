import type { HIOLValidationCorpusCase } from './hiol-validation-corpus-types'

export const HIOL_ADVERSARIAL_CORPUS: ReadonlyArray<HIOLValidationCorpusCase> = [
  {
    id: 'adv_subtle_curiosity_gap_professional',
    family: 'ADVERSARIAL',
    title: 'Professional-sounding curiosity gap that withholds core fact',
    articleType: 'ANALYSIS',
    category: 'technology',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Cloud policy desk'],
    sourceArticle: {
      summary: 'The article explains concrete procurement criteria before next-quarter renewals.',
      lede: 'Editors list threshold metrics and decision checkpoints used by enterprise teams.',
      bodySummary: 'The key finding is a straightforward cost-benefit tradeoff, not a hidden surprise.'
    },
    proposedHeadline: 'What policy desks are watching before tomorrow\'s renewal vote',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_CORRECTION_REQUIRED',
      routing: 'CORRECTION_REQUIRED',
      expectedTriggeredRules: ['CURIOSITY_GAP'],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Adversarial because it appears sober while still deferring the central fact.',
    tags: ['adversarial', 'false-negative-probe', 'curiosity-gap'],
    challengeType: 'SUBTLE_CURIOSITY_GAP'
  },
  {
    id: 'adv_minor_certainty_inflation_macro',
    family: 'ADVERSARIAL',
    title: 'Minor certainty inflation that can slip through copy review',
    articleType: 'MACRO_ECONOMY',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Policy committee'],
    sourceArticle: {
      summary: 'Committee notes outline multiple inflation pathways over the next two quarters.',
      lede: 'The report emphasizes confidence intervals and scenario-sensitive outcomes.',
      bodySummary: 'No single deterministic path is endorsed by the source material.'
    },
    proposedHeadline: 'Policy path now points to clearly lower inflation by year-end',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_CORRECTION_REQUIRED',
      routing: 'CORRECTION_REQUIRED',
      expectedTriggeredRules: ['UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Targets low-amplitude certainty language that often escapes regex-only checks.',
    tags: ['adversarial', 'certainty-inflation', 'macro'],
    challengeType: 'MINOR_CERTAINTY_INFLATION'
  },
  {
    id: 'adv_polished_title_body_mismatch',
    family: 'ADVERSARIAL',
    title: 'Polished phrasing masks title-body mismatch',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Regional banks'],
    sourceArticle: {
      summary: 'Funding costs widened and liquidity buffers were rebuilt after a risk-off session.',
      lede: 'Treasury desks reported tighter conditions and reduced appetite for lower-quality credit.',
      bodySummary: 'No section describes easing funding stress or broad liquidity recovery.'
    },
    proposedHeadline: 'Liquidity returns across regional banks as funding pressure eases',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_BODY_MISMATCH', 'THESIS_DRIFT'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Designed to reveal false negatives when language is fluent but semantically inverted.',
    tags: ['adversarial', 'title-body-mismatch', 'polished-copy'],
    challengeType: 'POLISHED_TITLE_BODY_MISMATCH'
  },
  {
    id: 'adv_misleading_number_date_emphasis',
    family: 'ADVERSARIAL',
    title: 'Date and number emphasis mismatch hidden in otherwise neutral copy',
    articleType: 'DATA_DRIVEN_REPORT',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Fiscal council'],
    sourceArticle: {
      summary: 'The fiscal council projects a 1.8% deficit ratio in 2026.',
      lede: 'Researchers describe a gradual consolidation path with no 2028 projection release yet.',
      bodySummary: 'Tables do not include a 0.8% figure and do not contain a Q4 2028 target.'
    },
    proposedHeadline: 'Council projects 0.8% deficit by Q4 2028 in baseline outlook',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MISLEADING_NUMBER_OR_DATE'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Probes precision framing errors that can alter policy interpretation materially.',
    tags: ['adversarial', 'number-date', 'data-integrity'],
    challengeType: 'MISLEADING_NUMBER_DATE_EMPHASIS'
  },
  {
    id: 'adv_legal_risk_euphemism',
    family: 'ADVERSARIAL',
    title: 'Legal-risk framing that avoids obvious banned trigger words',
    articleType: 'LEGAL_ENFORCEMENT',
    category: 'security-sensitive topics',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Metro prosecutor'],
    sourceArticle: {
      summary: 'Proceedings remain open and all allegations are disputed by counsel.',
      lede: 'Court minutes show evidentiary disputes and no final liability determination.',
      bodySummary: 'Editors are instructed to avoid adjudicative phrasing before judgment.'
    },
    proposedHeadline: 'Executive tied to a deceptive transfer network, probe records indicate',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['LEGAL_RISK_LANGUAGE'],
      expectedEscalationClass: 'LEGAL_REVIEW'
    },
    notes: 'Useful for legal tuning because risk can persist even when overt banned words are absent.',
    tags: ['adversarial', 'legal-risk', 'euphemism'],
    challengeType: 'LEGAL_RISK_EUPHEMISM'
  },
  {
    id: 'adv_market_claim_disguised_analysis',
    family: 'ADVERSARIAL',
    title: 'Market-moving claim camouflaged as analytical commentary',
    articleType: 'ANALYSIS',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Index futures'],
    sourceArticle: {
      summary: 'The article outlines three downside scenarios with probabilistic weighting.',
      lede: 'Analysts stress scenario uncertainty and reject deterministic day-trading predictions.',
      bodySummary: 'No cited model states an inevitable selloff within hours.'
    },
    proposedHeadline: 'Analysis: current setup points to an inevitable selloff in hours',
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MARKET_MOVING_RISK', 'UNSUPPORTED_CERTAINTY'],
      expectedEscalationClass: 'MARKET_RISK_REVIEW'
    },
    notes: 'High-value false-negative probe for market-sensitive analytical content.',
    tags: ['adversarial', 'market-moving', 'analysis-disguise'],
    challengeType: 'MARKET_MOVING_ANALYSIS_DISGUISE'
  },
  {
    id: 'adv_multilingual_severity_shift',
    family: 'ADVERSARIAL',
    title: 'Localized rewrite preserves nouns but escalates severity',
    articleType: 'POLICY_REGULATION',
    category: 'regulation / policy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Regulator'],
    sourceArticle: {
      summary: 'The regulator opened consultation and requested market feedback.',
      lede: 'Officials said no final decision was made and implementation details remain open.',
      bodySummary: 'The legal status remains draft-only during the comment period.'
    },
    proposedHeadline: 'Regulator opens consultation on derivatives disclosure draft',
    multilingualVariants: [
      {
        language: 'ru',
        headline: 'Regulyator utverdil obyazatelnyi zakon i nemedlennye sanktsii',
        entities: ['Regulator'],
        notes: 'Preserves actor but shifts draft consultation into final legal enforcement.'
      }
    ],
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MULTILINGUAL_DRIFT'],
      expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
    },
    notes: 'Designed to expose semantic severity shifts in cross-language production flows.',
    tags: ['adversarial', 'multilingual', 'severity-shift'],
    challengeType: 'MULTILINGUAL_SEVERITY_SHIFT'
  },
  {
    id: 'adv_local_language_exaggeration',
    family: 'ADVERSARIAL',
    title: 'Local-language exaggeration just below obvious template cues',
    articleType: 'CRYPTO',
    category: 'crypto',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Bitcoin'],
    sourceArticle: {
      summary: 'The desk note describes mixed momentum and cautions against directional certainty.',
      lede: 'Risk managers advise balanced positioning due uneven liquidity depth.',
      bodySummary: 'No exchange statement supports guaranteed upside claims.'
    },
    proposedHeadline: 'Bitcoin range trading continues as liquidity stays mixed',
    multilingualVariants: [
      {
        language: 'tr',
        headline: 'Bitcoin kesin garanti yukselisle tum riski sifirliyor',
        entities: ['Bitcoin'],
        notes: 'Adds strong certainty markers in local variant while source remains measured.'
      }
    ],
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION'],
      expectedEscalationClass: 'MULTILINGUAL_EDITOR_REVIEW'
    },
    notes: 'Targets threshold weakness where local certainty spikes are normalized by newsroom habit.',
    tags: ['adversarial', 'local-exaggeration', 'crypto'],
    challengeType: 'LOCAL_LANGUAGE_EXAGGERATION'
  },
  {
    id: 'adv_seo_editorial_bait_switch',
    family: 'ADVERSARIAL',
    title: 'SEO-title bait-and-switch against restrained editorial headline',
    articleType: 'COMPANY_EARNINGS',
    category: 'public companies',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Nova Retail'],
    sourceArticle: {
      summary: 'Nova Retail kept guidance unchanged and reported flat margins.',
      lede: 'Management cited cautious demand and said no strategic transaction is announced.',
      bodySummary: 'The filing includes no bankruptcy language and no extraordinary profit revision.'
    },
    proposedHeadline: 'Nova Retail keeps guidance after flat quarterly margin',
    titleSurfaces: {
      canonicalTitle: 'Nova Retail keeps guidance after flat quarterly margin',
      seoTitle: 'Nova Retail bankruptcy shock: stock set to triple overnight',
      ogTitle: 'Nova Retail posts stable quarter with unchanged guidance',
      socialTitle: 'Guidance unchanged in Nova quarterly filing',
      homepageTitle: 'Nova quarterly update'
    },
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'A classic bait-switch adversarial sample for surface divergence false-negative analysis.',
    tags: ['adversarial', 'seo-vs-editorial', 'surface-divergence'],
    challengeType: 'SEO_EDITORIAL_BAIT_SWITCH'
  },
  {
    id: 'adv_low_regex_emotional_verbs',
    family: 'ADVERSARIAL',
    title: 'Emotionally loaded verbs likely to evade simple lexical lists',
    articleType: 'PANIC_SENSITIVE',
    category: 'fear-prone topics',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceEntities: ['Emergency agency'],
    sourceArticle: {
      summary: 'The agency published routine readiness guidance after a contained incident.',
      lede: 'Officials advised calm monitoring and did not issue mass-alert instructions.',
      bodySummary: 'The event remained localized and no systemic failure indicators were reported.'
    },
    proposedHeadline: 'New outage update hammers confidence as city nerves fray overnight',
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['EMOTIONAL_INFLATION', 'PANIC_FRAMING'],
      expectedEscalationClass: 'PUBLIC_PANIC_REVIEW'
    },
    notes: 'Designed to expose lexical blind spots where loaded verbs fall below explicit marker lists.',
    tags: ['adversarial', 'emotional-verbs', 'panic-sensitive'],
    challengeType: 'LOW_REGEX_EMOTIONAL_VERBS'
  }
]
