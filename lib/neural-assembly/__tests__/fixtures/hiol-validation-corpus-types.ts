import type {
  HeadlineArticleType,
  HeadlineCalibrationBand,
  HeadlineEscalationClass,
  HeadlineOverallDecision,
  HeadlineRuleFamily,
  Language
} from '../../core-types'

export type HIOLCorpusFamily = 'GOLDEN' | 'ADVERSARIAL' | 'TITLE_SURFACE_DIVERGENCE'

export type HIOLRoutingExpectation =
  | 'PASS'
  | 'CORRECTION_REQUIRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'SUPERVISOR_REVIEW_REQUIRED'

export type HIOLAdversarialChallenge =
  | 'SUBTLE_CURIOSITY_GAP'
  | 'MINOR_CERTAINTY_INFLATION'
  | 'POLISHED_TITLE_BODY_MISMATCH'
  | 'MISLEADING_NUMBER_DATE_EMPHASIS'
  | 'LEGAL_RISK_EUPHEMISM'
  | 'MARKET_MOVING_ANALYSIS_DISGUISE'
  | 'MULTILINGUAL_SEVERITY_SHIFT'
  | 'LOCAL_LANGUAGE_EXAGGERATION'
  | 'SEO_EDITORIAL_BAIT_SWITCH'
  | 'LOW_REGEX_EMOTIONAL_VERBS'

export type HIOLMultilingualDriftClass =
  | 'FAITHFUL_TRANSLATION'
  | 'ACCEPTABLE_TRANSCREATION'
  | 'MILD_DRIFT'
  | 'SEVERE_DRIFT'
  | 'LOCAL_EXAGGERATION'
  | 'CERTAINTY_AMPLIFICATION'
  | 'CULTURAL_IDIOMATIC_DISTORTION'

export type HIOLSurfaceDivergenceClass =
  | 'ACCEPTABLE_ALIGNMENT'
  | 'BORDERLINE_DIVERGENCE'
  | 'UNACCEPTABLE_DIVERGENCE'

export type HIOLTitleSurfacePattern =
  | 'ACCEPTABLE_ALIGNMENT_CONTROL'
  | 'EDITORIAL_VS_SEO_DIVERGENCE'
  | 'EDITORIAL_VS_OG_EXAGGERATION'
  | 'SOCIAL_OVERSTATEMENT'
  | 'HOMEPAGE_OVERSIMPLIFICATION'

export interface HIOLSourceArticleAnchor {
  summary: string
  lede: string
  bodySummary: string
}

export interface HIOLTitleSurfacePack {
  canonicalTitle?: string
  seoTitle?: string
  ogTitle?: string
  socialTitle?: string
  homepageTitle?: string
}

export interface HIOLLocalizedHeadlineVariant {
  language: Language
  headline: string
  entities?: string[]
  notes: string
}

export interface HIOLEditorialExpectation {
  classification: HeadlineCalibrationBand
  overallDecision: HeadlineOverallDecision
  routing: HIOLRoutingExpectation
  expectedTriggeredRules: HeadlineRuleFamily[]
  expectedEscalationClass: HeadlineEscalationClass
}

export interface HIOLValidationCorpusCase {
  id: string
  family: HIOLCorpusFamily
  title: string
  articleType: HeadlineArticleType
  category: string
  urgency: 'breaking' | 'standard' | 'evergreen'
  sourceLanguage: Language
  sourceEntities: string[]
  sourceArticle: HIOLSourceArticleAnchor
  proposedHeadline: string
  titleSurfaces?: HIOLTitleSurfacePack
  multilingualVariants?: HIOLLocalizedHeadlineVariant[]
  expected: HIOLEditorialExpectation
  notes: string
  tags: string[]
  challengeType?: HIOLAdversarialChallenge
  surfacePattern?: HIOLTitleSurfacePattern
  surfaceDivergenceClass?: HIOLSurfaceDivergenceClass
}

export interface HIOLMultilingualSimulationVariant {
  language: Language
  localizedHeadline: string
  localizedEntities: string[]
  driftClass: HIOLMultilingualDriftClass
  expectedRuleHits: HeadlineRuleFamily[]
  expectedRouting: HIOLRoutingExpectation
  expectedEscalationClass: HeadlineEscalationClass
  notes: string
}

export interface HIOLMultilingualSimulationCase {
  id: string
  title: string
  articleType: HeadlineArticleType
  category: string
  sourceLanguage: Language
  sourceEntities: string[]
  sourceHeadline: string
  sourceLede: string
  sourceSummary: string
  variants: HIOLMultilingualSimulationVariant[]
  notes: string
  tags: string[]
}

export const REQUIRED_HIOL_ARTICLE_TYPES: ReadonlyArray<HeadlineArticleType> = [
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

export const REQUIRED_HIOL_CATEGORIES: ReadonlyArray<string> = [
  'economy',
  'macro markets',
  'crypto',
  'ai',
  'technology',
  'regulation / policy',
  'public companies',
  'security-sensitive topics',
  'fear-prone topics'
]

export const REQUIRED_ADVERSARIAL_CHALLENGES: ReadonlyArray<HIOLAdversarialChallenge> = [
  'SUBTLE_CURIOSITY_GAP',
  'MINOR_CERTAINTY_INFLATION',
  'POLISHED_TITLE_BODY_MISMATCH',
  'MISLEADING_NUMBER_DATE_EMPHASIS',
  'LEGAL_RISK_EUPHEMISM',
  'MARKET_MOVING_ANALYSIS_DISGUISE',
  'MULTILINGUAL_SEVERITY_SHIFT',
  'LOCAL_LANGUAGE_EXAGGERATION',
  'SEO_EDITORIAL_BAIT_SWITCH',
  'LOW_REGEX_EMOTIONAL_VERBS'
]

export const REQUIRED_MULTILINGUAL_DRIFT_CLASSES: ReadonlyArray<HIOLMultilingualDriftClass> = [
  'FAITHFUL_TRANSLATION',
  'ACCEPTABLE_TRANSCREATION',
  'MILD_DRIFT',
  'SEVERE_DRIFT',
  'LOCAL_EXAGGERATION',
  'CERTAINTY_AMPLIFICATION',
  'CULTURAL_IDIOMATIC_DISTORTION'
]

export const REQUIRED_TITLE_SURFACE_PATTERNS: ReadonlyArray<HIOLTitleSurfacePattern> = [
  'ACCEPTABLE_ALIGNMENT_CONTROL',
  'EDITORIAL_VS_SEO_DIVERGENCE',
  'EDITORIAL_VS_OG_EXAGGERATION',
  'SOCIAL_OVERSTATEMENT',
  'HOMEPAGE_OVERSIMPLIFICATION'
]
