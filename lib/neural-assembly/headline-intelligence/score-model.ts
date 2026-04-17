import type {
  HeadlineArticleType,
  HeadlineDimensionMeasurement,
  HeadlineDimensionStatus,
  HeadlineDimensionThresholds,
  HeadlineScoreDimension
} from '../core-types'
import type { HeadlineDimensionCalibrationOverride } from './calibration-config'

export interface HeadlineDimensionDefinition {
  dimension: HeadlineScoreDimension
  description: string
  measuredBy: HeadlineDimensionMeasurement
  thresholds: HeadlineDimensionThresholds
  weight: number
}

const DEFAULT_THRESHOLDS: HeadlineDimensionThresholds = {
  passThreshold: 80,
  softCorrectionThreshold: 65,
  blockThreshold: 50,
  escalationThreshold: 35
}

const SENSITIVE_THRESHOLDS: HeadlineDimensionThresholds = {
  passThreshold: 85,
  softCorrectionThreshold: 72,
  blockThreshold: 58,
  escalationThreshold: 42
}

const BASE_DIMENSIONS: ReadonlyArray<HeadlineDimensionDefinition> = [
  {
    dimension: 'thesisFidelity',
    description: 'Measures whether title preserves article thesis and polarity.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.2
  },
  {
    dimension: 'evidenceAlignment',
    description: 'Measures claim support against lede/body/claim anchors.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.25
  },
  {
    dimension: 'entityAccuracy',
    description: 'Measures consistency of key entities across title and article.',
    measuredBy: 'RULE_BASED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.0
  },
  {
    dimension: 'numberDateAccuracy',
    description: 'Measures numeric/date fact parity with article evidence.',
    measuredBy: 'RULE_BASED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.15
  },
  {
    dimension: 'attributionQuality',
    description: 'Measures whether title certainty is properly attributed.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.0
  },
  {
    dimension: 'clarity',
    description: 'Measures readability and directness without ambiguity games.',
    measuredBy: 'MODEL_JUDGED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 0.8
  },
  {
    dimension: 'specificity',
    description: 'Measures concrete information density without over-claiming.',
    measuredBy: 'MODEL_JUDGED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 0.8
  },
  {
    dimension: 'credibility',
    description: 'Measures trustworthiness and non-deceptive confidence framing.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.1
  },
  {
    dimension: 'emotionalRestraint',
    description: 'Measures emotional inflation and panic avoidance.',
    measuredBy: 'RULE_BASED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.0
  },
  {
    dimension: 'platformSafety',
    description: 'Measures Google News/Discover/Search title safety integrity.',
    measuredBy: 'MIXED',
    thresholds: SENSITIVE_THRESHOLDS,
    weight: 1.25
  },
  {
    dimension: 'curiosityWithoutDeception',
    description: 'Measures curiosity while preventing clickbait deception.',
    measuredBy: 'RULE_BASED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 0.9
  },
  {
    dimension: 'titleIntegrity',
    description: 'Measures cross-surface consistency and contradiction control.',
    measuredBy: 'RULE_BASED',
    thresholds: SENSITIVE_THRESHOLDS,
    weight: 1.15
  },
  {
    dimension: 'multilingualPortability',
    description: 'Measures source-anchor portability across localized variants.',
    measuredBy: 'MIXED',
    thresholds: SENSITIVE_THRESHOLDS,
    weight: 1.1
  },
  {
    dimension: 'categoryAppropriateness',
    description: 'Measures category-specific framing hygiene and risk posture.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.0
  },
  {
    dimension: 'articleTypeAppropriateness',
    description: 'Measures article-type-aware threshold and framing compliance.',
    measuredBy: 'MIXED',
    thresholds: DEFAULT_THRESHOLDS,
    weight: 1.0
  }
]

function toUpperText(value: string): string {
  return String(value || '').trim().toUpperCase()
}

function mergeThresholds(
  baseThresholds: HeadlineDimensionThresholds,
  overrideThresholds?: Partial<HeadlineDimensionThresholds>
): HeadlineDimensionThresholds {
  return {
    passThreshold: overrideThresholds?.passThreshold ?? baseThresholds.passThreshold,
    softCorrectionThreshold: overrideThresholds?.softCorrectionThreshold ?? baseThresholds.softCorrectionThreshold,
    blockThreshold: overrideThresholds?.blockThreshold ?? baseThresholds.blockThreshold,
    escalationThreshold: overrideThresholds?.escalationThreshold ?? baseThresholds.escalationThreshold
  }
}

function applyCalibrationOverride(
  definition: HeadlineDimensionDefinition,
  override?: HeadlineDimensionCalibrationOverride
): HeadlineDimensionDefinition {
  return {
    ...definition,
    thresholds: mergeThresholds(definition.thresholds, override?.thresholds),
    weight: typeof override?.weight === 'number' ? override.weight : definition.weight
  }
}

export function resolveHeadlineArticleType(
  category: string,
  urgency: string,
  headline: string,
  body: string
): HeadlineArticleType {
  const categoryUpper = toUpperText(category)
  const urgencyUpper = toUpperText(urgency)
  const full = `${toUpperText(headline)} ${toUpperText(body)} ${categoryUpper}`

  if (urgencyUpper === 'BREAKING') {
    return 'BREAKING_NEWS'
  }

  if (/(PANIC|OUTBREAK|EMERGENCY|EVACUATION|CRASH|COLLAPSE)/.test(full)) {
    return 'PANIC_SENSITIVE'
  }

  if (/(CRYPTO|BITCOIN|ETHEREUM|TOKEN|BLOCKCHAIN)/.test(full)) {
    return 'CRYPTO'
  }

  if (/(EARNINGS|GUIDANCE|REVENUE|Q[1-4]|NASDAQ|NYSE|PUBLIC COMPANY)/.test(full)) {
    return 'COMPANY_EARNINGS'
  }

  if (/(REGULATION|REGULATORY|POLICY|BILL|SENATE|CONGRESS|COMMISSION)/.test(full)) {
    return 'POLICY_REGULATION'
  }

  if (/(LAWSUIT|COURT|ENFORCEMENT|PROSECUTOR|DOJ|SEC CHARGE)/.test(full)) {
    return 'LEGAL_ENFORCEMENT'
  }

  if (/(MACRO|INFLATION|UNEMPLOYMENT|GDP|FED|ECB|BOE|ECONOMY)/.test(full)) {
    return 'MACRO_ECONOMY'
  }

  if (/(MARKET|EQUITY|BOND|YIELD|S&P|DOW|INDEX)/.test(full)) {
    return 'MARKET_REPORT'
  }

  if (/(AI|ARTIFICIAL INTELLIGENCE|MODEL|LLM|SEMICONDUCTOR|TECHNOLOGY)/.test(full)) {
    return 'AI_TECH'
  }

  if (/(EXPLAINER|HOW|WHY|GUIDE)/.test(full)) {
    return 'EXPLAINER'
  }

  if (/(DATA|SURVEY|INDEX|REPORT|METHODOLOGY)/.test(full)) {
    return 'DATA_DRIVEN_REPORT'
  }

  if (/(ANALYSIS|OUTLOOK|FORECAST|SCENARIO)/.test(full)) {
    return 'ANALYSIS'
  }

  if (/(ECONOMY|MACRO)/.test(categoryUpper)) {
    return 'MACRO_ECONOMY'
  }

  return 'ANALYSIS'
}

export function getHeadlineDimensionDefinitions(
  articleType: HeadlineArticleType,
  category: string,
  calibrationOverrides: Partial<Record<HeadlineScoreDimension, HeadlineDimensionCalibrationOverride>> = {}
): HeadlineDimensionDefinition[] {
  const categoryUpper = toUpperText(category)
  const sensitiveArticleType = new Set<HeadlineArticleType>([
    'BREAKING_NEWS',
    'MARKET_REPORT',
    'MACRO_ECONOMY',
    'CRYPTO',
    'POLICY_REGULATION',
    'LEGAL_ENFORCEMENT',
    'PANIC_SENSITIVE'
  ]).has(articleType)

  const sensitiveCategory = /(ECONOMY|MACRO|CRYPTO|POLICY|REGULATION|SECURITY|LEGAL|PUBLIC COMPANY)/.test(categoryUpper)

  return BASE_DIMENSIONS.map(definition => {
    const needsSensitiveThreshold =
      sensitiveArticleType ||
      sensitiveCategory ||
      definition.dimension === 'platformSafety' ||
      definition.dimension === 'titleIntegrity' ||
      definition.dimension === 'multilingualPortability'

    const override = calibrationOverrides[definition.dimension]

    const baseDefinition = {
      ...definition,
      thresholds: { ...definition.thresholds }
    }

    if (!needsSensitiveThreshold) {
      return applyCalibrationOverride(baseDefinition, override)
    }

    const threshold =
      definition.dimension === 'clarity' || definition.dimension === 'specificity'
        ? definition.thresholds
        : SENSITIVE_THRESHOLDS

    return applyCalibrationOverride({
      ...baseDefinition,
      thresholds: { ...threshold }
    }, override)
  })
}

export function resolveHeadlineDimensionStatus(
  score: number,
  thresholds: HeadlineDimensionThresholds
): HeadlineDimensionStatus {
  if (score >= thresholds.passThreshold) {
    return 'PASS'
  }

  if (score >= thresholds.softCorrectionThreshold) {
    return 'SOFT_CORRECTION'
  }

  if (score >= thresholds.blockThreshold) {
    return 'BLOCK'
  }

  return 'ESCALATE'
}

export function computeWeightedCompositeScore(
  scoredDimensions: Array<{ score: number; weight: number }>
): number {
  if (scoredDimensions.length === 0) {
    return 0
  }

  let weightSum = 0
  let weightedScore = 0

  for (const dimension of scoredDimensions) {
    weightSum += dimension.weight
    weightedScore += dimension.score * dimension.weight
  }

  if (weightSum <= 0) {
    return 0
  }

  return Number((weightedScore / weightSum).toFixed(2))
}
