import type {
  BatchJob,
  HeadlineArticleType,
  HeadlineControlAction,
  HeadlineMultilingualCalibration,
  HeadlineMultilingualAssessment,
  HeadlineMultilingualDriftRecord,
  Language
} from '../core-types'

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

const RUNTIME_TUNING_LANGUAGES: ReadonlySet<Language> = new Set(['en', 'es', 'jp'])
const RUNTIME_TUNING_MAX_PAIR_THRESHOLD = 0.3

const CERTAINTY_MARKERS: Record<string, string[]> = {
  en: ['guaranteed', 'certain', 'certainly', 'definitive', 'no risk', 'risk-free', '100%', 'inevitable'],
  tr: ['kesin', 'garanti', 'mutlaka', '%100'],
  de: ['sicher', 'garantiert', 'definitiv'],
  fr: ['certain', 'garanti', 'definitif'],
  es: ['seguro', 'garantizado', 'garantiza', 'definitivo', 'certeza', 'sin riesgo', '100%', 'inevitable'],
  ru: ['garant', 'tochno', 'opredelenno'],
  ar: ['muakad', 'daman', 'akid'],
  jp: ['kakujitsu', 'hosho', '確実', '保証', '必ず', '断定', '絶対', 'リスクゼロ'],
  zh: ['queding', 'baozheng', 'biran']
}

const PANIC_MARKERS: Record<string, string[]> = {
  en: ['panic', 'meltdown', 'collapse', 'catastrophic', 'crash'],
  tr: ['panik', 'cokus', 'kriz', 'felaket'],
  de: ['panik', 'zusammenbruch', 'katastrophe'],
  fr: ['panique', 'effondrement', 'catastrophe'],
  es: ['panico', 'pánico', 'colapso', 'derrumbe', 'catastrofe', 'catástrofe', 'crisis'],
  ru: ['panika', 'krah', 'katastrof'],
  ar: ['zaar', 'inhiyar', 'karitha'],
  jp: ['panikku', 'hokai', 'boraku', 'パニック', '暴落', '崩壊', '大混乱', '緊急事態'],
  zh: ['konghuang', 'bengpan', 'zainan']
}

const EMOTION_MARKERS: Record<string, string[]> = {
  en: ['shocking', 'explosive', 'bombshell', 'stunning'],
  tr: ['sok', 'patlayici', 'sarsici'],
  de: ['schockierend', 'explosiv'],
  fr: ['choquant', 'explosif'],
  es: ['impactante', 'explosivo', 'dramatico', 'dramático', 'sorprendente'],
  ru: ['shok', 'vzryv'],
  ar: ['sadem', 'mudaw'],
  jp: ['shogeki', 'bakuhatsuteki', '衝撃', '爆発的', '驚愕', '騒然'],
  zh: ['zhenjing', 'baozhaxing']
}

const REGULATORY_MARKERS = [
  'regulation', 'regulatory', 'policy', 'ban', 'approved', 'court', 'lawsuit', 'enforcement',
  'regulator', 'filing',
  'duzenleme', 'mahkeme', 'dava', 'policy-law',
  'regulador', 'regulacion', 'tribunal', 'demanda', 'cumplimiento',
  '規制', '規制当局', '当局', '裁判所', '法案', '施行', '草案', '協議', '承認'
]

const MARKET_MARKERS = [
  'market', 'markets', 'stock', 'equity', 'crypto', 'bitcoin', 'yield', 'inflation', 'index', 'futures', 'volatility',
  'borsa', 'piyasa', 'mercado', 'mercados', 'indice', 'índice', 'acciones', 'bolsa', 'volatilidad',
  'markt', 'rynok', 'shichang',
  '市場', '株式', '指数', '先物', 'ボラティリティ', '暗号資産', 'ビットコイン', 'インフレ'
]

function normalizeText(value: string): string {
  return String(value || '').trim().toLowerCase().normalize('NFKC')
}

function normalizeLookupText(value: string): string {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function isRuntimeTuningPair(sourceLanguage: Language, targetLanguage: Language): boolean {
  return RUNTIME_TUNING_LANGUAGES.has(sourceLanguage) && RUNTIME_TUNING_LANGUAGES.has(targetLanguage)
}

function normalizeEntity(value: string): string {
  return normalizeText(value).replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

function extractNumericTokens(value: string): string[] {
  return (value.match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(token => token.toUpperCase())
}

function extractDateTokens(value: string): string[] {
  const matches = value.match(/\b(?:20\d{2}|19\d{2}|Q[1-4]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/gi)
  return (matches || []).map(token => token.toUpperCase())
}

function markerScore(value: string, language: Language, dictionary: Record<string, string[]>): number {
  const normalized = normalizeLookupText(value)
  const markers = dictionary[language] || dictionary.en || []
  let score = 0
  for (const marker of markers) {
    if (normalized.includes(normalizeLookupText(marker))) {
      score += 1
    }
  }
  return score
}

function detectActionClass(value: string): 'REGULATORY' | 'MARKET' | 'GENERAL' {
  const normalized = normalizeLookupText(value)
  if (REGULATORY_MARKERS.some(marker => normalized.includes(normalizeLookupText(marker)))) {
    return 'REGULATORY'
  }
  if (MARKET_MARKERS.some(marker => normalized.includes(normalizeLookupText(marker)))) {
    return 'MARKET'
  }
  return 'GENERAL'
}

function resolveVarianceThreshold(articleType: HeadlineArticleType): number {
  if (
    articleType === 'BREAKING_NEWS' ||
    articleType === 'MARKET_REPORT' ||
    articleType === 'CRYPTO' ||
    articleType === 'POLICY_REGULATION' ||
    articleType === 'LEGAL_ENFORCEMENT' ||
    articleType === 'PANIC_SENSITIVE'
  ) {
    return 0.35
  }

  return 0.5
}

function resolvePairThreshold(
  sourceLanguage: Language,
  targetLanguage: Language,
  semanticVarianceThreshold: number,
  calibration: HeadlineMultilingualCalibration
): number {
  const direct = `${sourceLanguage}-${targetLanguage}`
  const reverse = `${targetLanguage}-${sourceLanguage}`

  if (typeof calibration.languagePairVarianceThresholds[direct] === 'number') {
    return calibration.languagePairVarianceThresholds[direct]
  }

  if (typeof calibration.languagePairVarianceThresholds[reverse] === 'number') {
    return calibration.languagePairVarianceThresholds[reverse]
  }

  return semanticVarianceThreshold
}

type DriftInvariant =
  | 'coreActor'
  | 'coreAction'
  | 'numberDateFacts'
  | 'thesisPolarity'
  | 'legalRegulatoryMeaning'
  | 'marketMovingMeaning'
  | 'localExaggeration'

const INVARIANT_WEIGHTS: Record<DriftInvariant, number> = {
  coreActor: 18,
  coreAction: 14,
  numberDateFacts: 20,
  thesisPolarity: 12,
  legalRegulatoryMeaning: 18,
  marketMovingMeaning: 18,
  localExaggeration: 16
}

const FOCUS_PAIR_BONUS: Record<DriftInvariant, number> = {
  coreActor: 4,
  coreAction: 3,
  numberDateFacts: 4,
  thesisPolarity: 3,
  legalRegulatoryMeaning: 5,
  marketMovingMeaning: 5,
  localExaggeration: 4
}

function computeDriftScore(violatedInvariants: DriftInvariant[], runtimeFocusPair: boolean): number {
  const unique = Array.from(new Set(violatedInvariants))

  let score = 0
  for (const invariant of unique) {
    score += INVARIANT_WEIGHTS[invariant]
    if (runtimeFocusPair) {
      score += FOCUS_PAIR_BONUS[invariant]
    }
  }

  return Math.min(100, score)
}

function resolveAction(
  driftScore: number,
  pairThreshold: number,
  invariantViolation: boolean,
  runtimeFocusPair: boolean
): HeadlineControlAction {
  const reviewFloor = runtimeFocusPair
    ? Math.max(58, Math.round((pairThreshold * 100) + 10))
    : Math.max(70, Math.round((pairThreshold * 100) + 18))

  const correctionFloor = runtimeFocusPair
    ? Math.max(34, Math.round((pairThreshold * 100) - 2))
    : Math.max(45, Math.round((pairThreshold * 100) + 4))

  if (invariantViolation || driftScore >= reviewFloor) {
    return 'REVIEW'
  }

  if (driftScore >= correctionFloor) {
    return 'CORRECT'
  }

  return 'ALLOW'
}

function resolveDriftClass(driftScore: number): HeadlineMultilingualDriftRecord['driftClass'] {
  if (driftScore >= 70) {
    return 'HIGH'
  }

  if (driftScore >= 40) {
    return 'MEDIUM'
  }

  return 'LOW'
}

export function evaluateHeadlineMultilingualAssessment(
  batch: BatchJob,
  sourceLanguage: Language,
  articleType: HeadlineArticleType,
  calibration?: HeadlineMultilingualCalibration
): HeadlineMultilingualAssessment {
  const articleTypeThreshold = resolveVarianceThreshold(articleType)
  const activeCalibration: HeadlineMultilingualCalibration = {
    ...DEFAULT_MULTILINGUAL_CALIBRATION,
    ...(calibration || {}),
    languagePairVarianceThresholds: {
      ...DEFAULT_MULTILINGUAL_CALIBRATION.languagePairVarianceThresholds,
      ...(calibration?.languagePairVarianceThresholds || {})
    }
  }

  const semanticVarianceThreshold = typeof activeCalibration.semanticVarianceThreshold === 'number'
    ? Math.min(articleTypeThreshold, activeCalibration.semanticVarianceThreshold)
    : articleTypeThreshold

  const editions = batch.editions || {}
  const sourceEdition = editions[sourceLanguage]
  const sourceHeadline = normalizeText(sourceEdition?.content?.title || '')
  const sourceEntities = new Set((sourceEdition?.entities || []).map(normalizeEntity).filter(Boolean))
  const sourceNumbers = new Set(extractNumericTokens(sourceHeadline))
  const sourceDates = new Set(extractDateTokens(sourceHeadline))
  const sourceCertainty = markerScore(sourceHeadline, sourceLanguage, CERTAINTY_MARKERS)
  const sourcePanic = markerScore(sourceHeadline, sourceLanguage, PANIC_MARKERS)
  const sourceEmotion = markerScore(sourceHeadline, sourceLanguage, EMOTION_MARKERS)
  const sourceActionClass = detectActionClass(sourceHeadline)

  const driftByLanguage: HeadlineMultilingualDriftRecord[] = []

  for (const language of Object.keys(editions) as Language[]) {
    const edition = editions[language]
    const headline = normalizeText(edition?.content?.title || '')

    if (language === sourceLanguage) {
      driftByLanguage.push({
        language,
        driftScore: 0,
        driftClass: 'LOW',
        violatedInvariants: [],
        certaintyAmplification: false,
        localExaggeration: false,
        pairThreshold: semanticVarianceThreshold,
        action: 'ALLOW'
      })
      continue
    }

    const runtimeFocusPair = isRuntimeTuningPair(sourceLanguage, language)
    const pairThresholdRaw = resolvePairThreshold(
      sourceLanguage,
      language,
      semanticVarianceThreshold,
      activeCalibration
    )
    const pairThreshold = runtimeFocusPair
      ? Math.min(pairThresholdRaw, RUNTIME_TUNING_MAX_PAIR_THRESHOLD)
      : pairThresholdRaw

    const violatedInvariants: DriftInvariant[] = []

    const targetEntities = new Set((edition?.entities || []).map(normalizeEntity).filter(Boolean))
    const targetNumbers = new Set(extractNumericTokens(headline))
    const targetDates = new Set(extractDateTokens(headline))

    const sharedEntity = sourceEntities.size === 0
      ? true
      : targetEntities.size === 0
        ? false
        : Array.from(sourceEntities).some(entity => targetEntities.has(entity))

    if (!sharedEntity) {
      violatedInvariants.push('coreActor')
    }

    const numericStable = Array.from(sourceNumbers).every(token => targetNumbers.has(token))
    if (!numericStable) {
      violatedInvariants.push('numberDateFacts')
    }

    const dateStable = Array.from(sourceDates).every(token => targetDates.has(token))
    if (!dateStable) {
      violatedInvariants.push('numberDateFacts')
    }

    const targetActionClass = detectActionClass(headline)
    if (sourceActionClass !== targetActionClass) {
      violatedInvariants.push('coreAction')
    }

    const legalRegulatoryStable =
      (sourceActionClass === 'REGULATORY' && targetActionClass === 'REGULATORY') ||
      (sourceActionClass !== 'REGULATORY' && targetActionClass !== 'REGULATORY')

    if (!legalRegulatoryStable) {
      violatedInvariants.push('legalRegulatoryMeaning')
    }

    const marketMeaningStable =
      (sourceActionClass === 'MARKET' && targetActionClass === 'MARKET') ||
      (sourceActionClass !== 'MARKET' && targetActionClass !== 'MARKET')

    if (!marketMeaningStable) {
      violatedInvariants.push('marketMovingMeaning')
    }

    const targetCertainty = markerScore(headline, language, CERTAINTY_MARKERS)
    const targetPanic = markerScore(headline, language, PANIC_MARKERS)
    const targetEmotion = markerScore(headline, language, EMOTION_MARKERS)

    const certaintyAmplification = targetCertainty > sourceCertainty + activeCalibration.certaintyAmplificationDelta
    const localExaggeration =
      targetCertainty > sourceCertainty + activeCalibration.localExaggerationDelta ||
      targetPanic > sourcePanic + activeCalibration.localExaggerationDelta ||
      targetEmotion > sourceEmotion + activeCalibration.localExaggerationDelta

    if (certaintyAmplification) {
      violatedInvariants.push('thesisPolarity')
    }

    if (localExaggeration) {
      violatedInvariants.push('localExaggeration')
    }

    const driftScore = computeDriftScore(violatedInvariants, runtimeFocusPair)

    const invariantViolation =
      violatedInvariants.includes('coreActor') ||
      violatedInvariants.includes('numberDateFacts') ||
      violatedInvariants.includes('legalRegulatoryMeaning') ||
      violatedInvariants.includes('marketMovingMeaning')

    driftByLanguage.push({
      language,
      driftScore,
      driftClass: resolveDriftClass(driftScore),
      violatedInvariants: Array.from(new Set(violatedInvariants)),
      certaintyAmplification,
      localExaggeration,
      pairThreshold,
      action: resolveAction(driftScore, pairThreshold, invariantViolation, runtimeFocusPair)
    })
  }

  const allInvariantViolations = new Set(
    driftByLanguage.flatMap(record => record.violatedInvariants)
  )

  return {
    sourceLanguage,
    invariants: {
      coreActor: !allInvariantViolations.has('coreActor'),
      coreAction: !allInvariantViolations.has('coreAction'),
      numberDateFacts: !allInvariantViolations.has('numberDateFacts'),
      thesisPolarity: !allInvariantViolations.has('thesisPolarity'),
      legalRegulatoryMeaning: !allInvariantViolations.has('legalRegulatoryMeaning'),
      marketMovingMeaning: !allInvariantViolations.has('marketMovingMeaning')
    },
    driftByLanguage,
    semanticVarianceThreshold,
    calibration: {
      ...activeCalibration,
      semanticVarianceThreshold,
      languagePairVarianceThresholds: { ...activeCalibration.languagePairVarianceThresholds }
    }
  }
}
