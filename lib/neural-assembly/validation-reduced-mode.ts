import type { Language } from './core-types'

export const LIVE_VALIDATION_LANGUAGE_TARGET: readonly Language[] = [
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

export const REDUCED_VALIDATION_LANGUAGE_TARGET: readonly Language[] = ['en', 'tr', 'jp'] as const

export type ValidationReducedModeSource = 'default' | 'VALIDATION_REDUCED_MODE'

export type ValidationReducedModeResult =
  | 'FULL_LANGUAGE_EXECUTION'
  | 'REDUCED_MODE_APPLIED'
  | 'REDUCED_MODE_IGNORED_NON_STRICT'

export interface ValidationReducedModeSelection {
  enabled: boolean
  strict_validation_mode: boolean
  source: ValidationReducedModeSource
  result: ValidationReducedModeResult
  live_target_languages: Language[]
  execution_languages: Language[]
}

export interface ValidationReducedModeResolutionOptions {
  strictValidationMode?: boolean
  reducedModeEnabled?: boolean
  liveTargetLanguages?: readonly Language[]
}

function parseBooleanEnv(value: string | undefined): boolean {
  return (value || '').trim().toLowerCase() === 'true'
}

export function resolveValidationReducedModeSelection(
  options: ValidationReducedModeResolutionOptions = {}
): ValidationReducedModeSelection {
  const strictValidationMode =
    options.strictValidationMode ?? parseBooleanEnv(process.env.VALIDATION_STRICT_MODE)
  const reducedModeEnabled =
    options.reducedModeEnabled ?? parseBooleanEnv(process.env.VALIDATION_REDUCED_MODE)
  const liveTargetLanguages = [
    ...(options.liveTargetLanguages ?? LIVE_VALIDATION_LANGUAGE_TARGET)
  ] as Language[]

  if (reducedModeEnabled && strictValidationMode) {
    const reducedLanguageSet = liveTargetLanguages.filter((language) =>
      REDUCED_VALIDATION_LANGUAGE_TARGET.includes(language)
    )

    return {
      enabled: true,
      strict_validation_mode: true,
      source: 'VALIDATION_REDUCED_MODE',
      result: 'REDUCED_MODE_APPLIED',
      live_target_languages: liveTargetLanguages,
      execution_languages: reducedLanguageSet
    }
  }

  if (reducedModeEnabled) {
    return {
      enabled: false,
      strict_validation_mode: strictValidationMode,
      source: 'VALIDATION_REDUCED_MODE',
      result: 'REDUCED_MODE_IGNORED_NON_STRICT',
      live_target_languages: liveTargetLanguages,
      execution_languages: liveTargetLanguages
    }
  }

  return {
    enabled: false,
    strict_validation_mode: strictValidationMode,
    source: 'default',
    result: 'FULL_LANGUAGE_EXECUTION',
    live_target_languages: liveTargetLanguages,
    execution_languages: liveTargetLanguages
  }
}