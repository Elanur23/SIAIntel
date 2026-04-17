import type { Language, NeuralSearchRequest } from '@/lib/search/types'

const SUPPORTED_LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitized?: NeuralSearchRequest
}

class RequestValidator {
  validate(input: unknown): ValidationResult {
    const errors: string[] = []

    if (!input || typeof input !== 'object') {
      return {
        valid: false,
        errors: ['Request body must be a JSON object'],
      }
    }

    const body = input as Partial<NeuralSearchRequest>

    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query) {
      errors.push('query is required')
    }

    const userLanguage = body.userLanguage
    if (!userLanguage || !SUPPORTED_LANGUAGES.includes(userLanguage)) {
      errors.push(`userLanguage must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
    }

    const limit = Number(body.options?.limit ?? 50)
    const offset = Number(body.options?.offset ?? 0)

    if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
      errors.push('options.limit must be a number between 1 and 100')
    }

    if (!Number.isFinite(offset) || offset < 0) {
      errors.push('options.offset must be a non-negative number')
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return {
      valid: true,
      errors: [],
      sanitized: {
        query,
        userLanguage: userLanguage as Language,
        filters: body.filters || {},
        options: {
          ...(body.options || {}),
          limit,
          offset,
        },
      },
    }
  }
}

let globalValidator: RequestValidator | null = null

export function getRequestValidator(): RequestValidator {
  if (!globalValidator) {
    globalValidator = new RequestValidator()
  }
  return globalValidator
}
