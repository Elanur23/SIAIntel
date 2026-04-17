import type { HIOLValidationCorpusCase } from './hiol-validation-corpus-types'

export const HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS: ReadonlyArray<HIOLValidationCorpusCase> = [
  {
    id: 'surface_alignment_control_market_close',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'Acceptable control: all title surfaces remain thesis-aligned',
    articleType: 'MARKET_REPORT',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Index committee'],
    sourceArticle: {
      summary: 'Indexes closed mixed and bond yields remained range-bound in late trading.',
      lede: 'No emergency policy signal or deterministic market call appeared in desk notes.',
      bodySummary: 'Coverage keeps a measured close summary and avoids directional hype.'
    },
    proposedHeadline: 'Indexes close mixed as yields remain range-bound in late trade',
    titleSurfaces: {
      canonicalTitle: 'Indexes close mixed as yields remain range-bound in late trade',
      seoTitle: 'Indexes close mixed while yields stay range-bound',
      ogTitle: 'Mixed close: indexes and yields remain stable',
      socialTitle: 'Closing bell update: mixed indexes, stable yields',
      homepageTitle: 'Mixed close with stable yields'
    },
    expected: {
      classification: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      routing: 'PASS',
      expectedTriggeredRules: [],
      expectedEscalationClass: 'NONE'
    },
    notes: 'Control case to prevent overfitting against harmless channel-specific phrasing changes.',
    tags: ['title-surface', 'control', 'acceptable-divergence'],
    surfacePattern: 'ACCEPTABLE_ALIGNMENT_CONTROL',
    surfaceDivergenceClass: 'ACCEPTABLE_ALIGNMENT'
  },
  {
    id: 'surface_editorial_vs_seo_divergence_policy',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'Editorial vs SEO divergence introduces unsupported certainty',
    articleType: 'POLICY_REGULATION',
    category: 'regulation / policy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Policy commission'],
    sourceArticle: {
      summary: 'Commission opened a consultation period with no final implementation date.',
      lede: 'Officials repeated that the text remains draft-only during review.',
      bodySummary: 'No final approval or immediate enforcement language appears in source documentation.'
    },
    proposedHeadline: 'Commission opens consultation on cross-border payment disclosures',
    titleSurfaces: {
      canonicalTitle: 'Commission opens consultation on cross-border payment disclosures',
      seoTitle: 'Commission confirms immediate cross-border disclosure enforcement',
      ogTitle: 'Consultation opens for payment disclosure draft',
      socialTitle: 'Draft disclosure consultation now open',
      homepageTitle: 'Disclosure draft enters consultation'
    },
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Highlights SEO-layer certainty inflation risk in policy/regulatory topics.',
    tags: ['title-surface', 'seo-divergence', 'policy'],
    surfacePattern: 'EDITORIAL_VS_SEO_DIVERGENCE',
    surfaceDivergenceClass: 'BORDERLINE_DIVERGENCE'
  },
  {
    id: 'surface_editorial_vs_og_exaggeration_ai',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'OG title exaggeration beyond measured AI release thesis',
    articleType: 'AI_TECH',
    category: 'AI',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Model lab'],
    sourceArticle: {
      summary: 'A model lab released a new version with benchmark notes and known limitations.',
      lede: 'The article emphasizes external audit context rather than breakthrough claims.',
      bodySummary: 'No source evidence supports a market-disruption narrative.'
    },
    proposedHeadline: 'Model lab releases audited update with expanded multilingual support',
    titleSurfaces: {
      canonicalTitle: 'Model lab releases audited update with expanded multilingual support',
      seoTitle: 'Audited model update expands multilingual support',
      ogTitle: 'Model lab unleashes unstoppable AI leap that reshapes every industry',
      socialTitle: 'Audited multilingual model update is now live',
      homepageTitle: 'Audited model update goes live'
    },
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Supports governance tuning for OG copy inflation in high-attention AI coverage.',
    tags: ['title-surface', 'og-exaggeration', 'ai-tech'],
    surfacePattern: 'EDITORIAL_VS_OG_EXAGGERATION',
    surfaceDivergenceClass: 'BORDERLINE_DIVERGENCE'
  },
  {
    id: 'surface_social_overstatement_security',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'Social title overstates risk beyond restrained editorial narrative',
    articleType: 'LEGAL_ENFORCEMENT',
    category: 'security-sensitive topics',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceEntities: ['National agency'],
    sourceArticle: {
      summary: 'An agency briefing reported a contained incident with no nationwide emergency order.',
      lede: 'Officials instructed standard vigilance and rejected citywide shutdown rumors.',
      bodySummary: 'The article keeps a measured operational update and discourages panic framing.'
    },
    proposedHeadline: 'Agency briefs on contained incident and ongoing monitoring measures',
    titleSurfaces: {
      canonicalTitle: 'Agency briefs on contained incident and ongoing monitoring measures',
      seoTitle: 'Agency briefing confirms contained incident and monitoring plan',
      ogTitle: 'Contained incident update from agency briefing',
      socialTitle: 'Nationwide collapse warning after agency emergency briefing',
      homepageTitle: 'Contained incident update'
    },
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'SUPERVISOR_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY', 'PANIC_FRAMING'],
      expectedEscalationClass: 'PUBLIC_PANIC_REVIEW'
    },
    notes: 'Designed for social-surface governance in panic-prone or security-sensitive flows.',
    tags: ['title-surface', 'social-overstatement', 'security-sensitive'],
    surfacePattern: 'SOCIAL_OVERSTATEMENT',
    surfaceDivergenceClass: 'UNACCEPTABLE_DIVERGENCE'
  },
  {
    id: 'surface_homepage_oversimplification_macro',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'Homepage simplification strips qualifying evidence context',
    articleType: 'MACRO_ECONOMY',
    category: 'economy',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Statistics bureau'],
    sourceArticle: {
      summary: 'Bureau data shows inflation easing, but confidence intervals remain wide across sectors.',
      lede: 'Researchers caution that one-month changes should not be read as a structural trend shift.',
      bodySummary: 'Coverage includes caveats and distribution-level detail for interpretation.'
    },
    proposedHeadline: 'Inflation eases while sector dispersion keeps policy outlook cautious',
    titleSurfaces: {
      canonicalTitle: 'Inflation eases while sector dispersion keeps policy outlook cautious',
      seoTitle: 'Inflation eases as policy outlook stays cautious',
      ogTitle: 'Inflation cools but sector spread remains wide',
      socialTitle: 'Inflation update: easing trend with mixed sector data',
      homepageTitle: 'Inflation solved'
    },
    expected: {
      classification: 'AMBER',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Captures homepage simplification risk where nuance collapse creates factual overreach.',
    tags: ['title-surface', 'homepage-oversimplification', 'macro'],
    surfacePattern: 'HOMEPAGE_OVERSIMPLIFICATION',
    surfaceDivergenceClass: 'BORDERLINE_DIVERGENCE'
  },
  {
    id: 'surface_unacceptable_multi_channel_contradiction',
    family: 'TITLE_SURFACE_DIVERGENCE',
    title: 'Unacceptable cross-channel contradiction for earnings coverage',
    articleType: 'COMPANY_EARNINGS',
    category: 'public companies',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceEntities: ['Vertex Mobile'],
    sourceArticle: {
      summary: 'Vertex reported stable margins and maintained full-year guidance.',
      lede: 'Management reiterated demand softness but did not revise strategic plans.',
      bodySummary: 'Filings contain no bankruptcy disclosure and no guaranteed rally language.'
    },
    proposedHeadline: 'Vertex maintains guidance after stable quarterly margin',
    titleSurfaces: {
      canonicalTitle: 'Vertex maintains guidance after stable quarterly margin',
      seoTitle: 'Vertex files bankruptcy paperwork after margin collapse',
      ogTitle: 'Vertex delivers historic profit surge this quarter',
      socialTitle: 'Guaranteed stock moonshot starts now after filing shock',
      homepageTitle: 'Vertex update'
    },
    expected: {
      classification: 'RED',
      overallDecision: 'HEADLINE_REVIEW_REQUIRED',
      routing: 'HUMAN_REVIEW_REQUIRED',
      expectedTriggeredRules: ['TITLE_SURFACE_INCONSISTENCY'],
      expectedEscalationClass: 'SENIOR_EDITOR_REVIEW'
    },
    notes: 'Extreme contradiction fixture for upper-bound title-surface tuning and editor explainability.',
    tags: ['title-surface', 'unacceptable-divergence', 'public-companies'],
    surfacePattern: 'EDITORIAL_VS_SEO_DIVERGENCE',
    surfaceDivergenceClass: 'UNACCEPTABLE_DIVERGENCE'
  }
]
