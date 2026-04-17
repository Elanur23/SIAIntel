import type {
  HeadlineArticleType,
  HeadlineDimensionThresholds,
  HeadlineEscalationCalibration,
  HeadlineMultilingualCalibration,
  HeadlineOperationalMode,
  HeadlineScoreDimension,
  HeadlineTitleSurfaceCalibration
} from '../core-types'

export interface HeadlineDimensionCalibrationOverride {
  thresholds?: Partial<HeadlineDimensionThresholds>
  weight?: number
}

export interface HeadlineCalibrationProfile {
  id: string
  categories: string[]
  articleTypes: HeadlineArticleType[]
  dimensionOverrides: Partial<Record<HeadlineScoreDimension, HeadlineDimensionCalibrationOverride>>
  titleSurface: HeadlineTitleSurfaceCalibration
  multilingual: HeadlineMultilingualCalibration
  escalation: HeadlineEscalationCalibration
}

export interface ResolvedHeadlineCalibrationProfile {
  id: string
  dimensionOverrides: Partial<Record<HeadlineScoreDimension, HeadlineDimensionCalibrationOverride>>
  titleSurface: HeadlineTitleSurfaceCalibration
  multilingual: HeadlineMultilingualCalibration
  escalation: HeadlineEscalationCalibration
}

const DEFAULT_TITLE_SURFACE_CALIBRATION: HeadlineTitleSurfaceCalibration = {
  minLexicalOverlap: 0.32,
  certaintySkewOverlapGuard: 0.62,
  maxAllowedInconsistentPairs: 2
}

const DEFAULT_MULTILINGUAL_CALIBRATION: HeadlineMultilingualCalibration = {
  semanticVarianceThreshold: 0.48,
  certaintyAmplificationDelta: 0,
  localExaggerationDelta: 1,
  languagePairVarianceThresholds: {
    'en-tr': 0.42,
    'en-de': 0.44,
    'en-fr': 0.44,
    'en-es': 0.36,
    'en-ru': 0.4,
    'en-ar': 0.4,
    'en-jp': 0.31,
    'en-zh': 0.38
  }
}

const DEFAULT_ESCALATION_CALIBRATION: HeadlineEscalationCalibration = {
  hardBlockCompositeThreshold: 42,
  highConfidenceHardBlockScore: 24,
  highConfidenceHardBlockRuleHits: 3
}

const GENERAL_PROFILE: HeadlineCalibrationProfile = {
  id: 'general_standard',
  categories: ['general', 'technology', 'ai', 'analysis'],
  articleTypes: ['ANALYSIS', 'EXPLAINER', 'AI_TECH', 'DATA_DRIVEN_REPORT'],
  dimensionOverrides: {},
  titleSurface: DEFAULT_TITLE_SURFACE_CALIBRATION,
  multilingual: DEFAULT_MULTILINGUAL_CALIBRATION,
  escalation: DEFAULT_ESCALATION_CALIBRATION
}

const BREAKING_SENSITIVE_PROFILE: HeadlineCalibrationProfile = {
  id: 'breaking_sensitive',
  categories: ['breaking'],
  articleTypes: ['BREAKING_NEWS', 'PANIC_SENSITIVE'],
  dimensionOverrides: {
    platformSafety: {
      thresholds: {
        passThreshold: 88,
        softCorrectionThreshold: 76,
        blockThreshold: 62,
        escalationThreshold: 45
      }
    },
    emotionalRestraint: {
      thresholds: {
        passThreshold: 85,
        softCorrectionThreshold: 72,
        blockThreshold: 58,
        escalationThreshold: 44
      }
    },
    titleIntegrity: {
      thresholds: {
        passThreshold: 86,
        softCorrectionThreshold: 74,
        blockThreshold: 60,
        escalationThreshold: 44
      }
    }
  },
  titleSurface: {
    minLexicalOverlap: 0.38,
    certaintySkewOverlapGuard: 0.68,
    maxAllowedInconsistentPairs: 1
  },
  multilingual: {
    ...DEFAULT_MULTILINGUAL_CALIBRATION,
    semanticVarianceThreshold: 0.35,
    localExaggerationDelta: 0,
    languagePairVarianceThresholds: {
      ...DEFAULT_MULTILINGUAL_CALIBRATION.languagePairVarianceThresholds,
      'en-tr': 0.32,
      'en-es': 0.28,
      'en-ru': 0.3,
      'en-ar': 0.3,
      'en-jp': 0.24
    }
  },
  escalation: {
    hardBlockCompositeThreshold: 48,
    highConfidenceHardBlockScore: 24,
    highConfidenceHardBlockRuleHits: 2
  }
}

const MARKET_REGULATORY_PROFILE: HeadlineCalibrationProfile = {
  id: 'market_regulatory_strict',
  categories: [
    'macro markets',
    'macro',
    'economy',
    'crypto',
    'policy',
    'regulation',
    'public companies',
    'company earnings',
    'legal',
    'enforcement'
  ],
  articleTypes: [
    'MARKET_REPORT',
    'MACRO_ECONOMY',
    'CRYPTO',
    'POLICY_REGULATION',
    'LEGAL_ENFORCEMENT',
    'COMPANY_EARNINGS'
  ],
  dimensionOverrides: {
    thesisFidelity: {
      thresholds: {
        passThreshold: 86,
        softCorrectionThreshold: 74,
        blockThreshold: 60,
        escalationThreshold: 44
      }
    },
    evidenceAlignment: {
      thresholds: {
        passThreshold: 88,
        softCorrectionThreshold: 76,
        blockThreshold: 62,
        escalationThreshold: 45
      }
    },
    numberDateAccuracy: {
      thresholds: {
        passThreshold: 90,
        softCorrectionThreshold: 78,
        blockThreshold: 64,
        escalationThreshold: 46
      }
    },
    attributionQuality: {
      thresholds: {
        passThreshold: 86,
        softCorrectionThreshold: 74,
        blockThreshold: 60,
        escalationThreshold: 44
      }
    },
    categoryAppropriateness: {
      thresholds: {
        passThreshold: 87,
        softCorrectionThreshold: 75,
        blockThreshold: 61,
        escalationThreshold: 45
      }
    }
  },
  titleSurface: {
    minLexicalOverlap: 0.4,
    certaintySkewOverlapGuard: 0.72,
    maxAllowedInconsistentPairs: 1
  },
  multilingual: {
    ...DEFAULT_MULTILINGUAL_CALIBRATION,
    semanticVarianceThreshold: 0.34,
    localExaggerationDelta: 0,
    languagePairVarianceThresholds: {
      ...DEFAULT_MULTILINGUAL_CALIBRATION.languagePairVarianceThresholds,
      'en-tr': 0.3,
      'en-de': 0.32,
      'en-fr': 0.32,
      'en-es': 0.27,
      'en-ru': 0.28,
      'en-ar': 0.28,
      'en-jp': 0.23,
      'en-zh': 0.3
    }
  },
  escalation: {
    hardBlockCompositeThreshold: 50,
    highConfidenceHardBlockScore: 24,
    highConfidenceHardBlockRuleHits: 2
  }
}

const ALL_PROFILES: ReadonlyArray<HeadlineCalibrationProfile> = [
  MARKET_REGULATORY_PROFILE,
  BREAKING_SENSITIVE_PROFILE,
  GENERAL_PROFILE
]

export function normalizeCategoryKey(category: string): string {
  return String(category || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function cloneProfile(profile: HeadlineCalibrationProfile): ResolvedHeadlineCalibrationProfile {
  return {
    id: profile.id,
    dimensionOverrides: { ...profile.dimensionOverrides },
    titleSurface: { ...profile.titleSurface },
    multilingual: {
      ...profile.multilingual,
      languagePairVarianceThresholds: { ...profile.multilingual.languagePairVarianceThresholds }
    },
    escalation: { ...profile.escalation }
  }
}

function profileMatches(profile: HeadlineCalibrationProfile, categoryKey: string, articleType: HeadlineArticleType): boolean {
  const categoryMatch = profile.categories.some(category => normalizeCategoryKey(category) === categoryKey)
  const articleTypeMatch = profile.articleTypes.includes(articleType)
  return categoryMatch || articleTypeMatch
}

export function resolveHeadlineCalibrationProfile(
  category: string,
  articleType: HeadlineArticleType
): ResolvedHeadlineCalibrationProfile {
  const categoryKey = normalizeCategoryKey(category)
  const matched = ALL_PROFILES.find(profile => profileMatches(profile, categoryKey, articleType))
  if (matched) {
    return cloneProfile(matched)
  }
  return cloneProfile(GENERAL_PROFILE)
}

function normalizeOperationalMode(value: string | undefined): HeadlineOperationalMode | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (
    normalized === 'SHADOW_ONLY' ||
    normalized === 'LOG_AND_SCORE' ||
    normalized === 'SOFT_ENFORCEMENT' ||
    normalized === 'HARD_BLOCK_FOR_HIGH_CONFIDENCE_ONLY'
  ) {
    return normalized
  }

  return null
}

export function resolveHeadlineOperationalMode(): HeadlineOperationalMode {
  const primary = normalizeOperationalMode(process.env.HEADLINE_INTELLIGENCE_OPERATIONAL_MODE)
  if (primary) {
    return primary
  }

  const secondary = normalizeOperationalMode(process.env.HEADLINE_INTELLIGENCE_MODE)
  if (secondary) {
    return secondary
  }

  return 'SOFT_ENFORCEMENT'
}
