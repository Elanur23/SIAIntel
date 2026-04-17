import * as quotaGuard from './quota-guard'
import { callGeminiCentral } from '../neural-assembly/gemini-central-provider'

type QuotaType = 'TPM' | 'TPD' | 'UNKNOWN'
type FailureClass = 'TPM_EXHAUSTION' | 'TPD_EXHAUSTION' | 'COOLDOWN_ACTIVE' | 'NON_AVAILABILITY_FAILURE'

interface UsageContext {
  caller_module: string
  caller_function: string
  purpose: string
  batch_id?: string
}

interface ResponseFormat {
  type?: string
  [key: string]: unknown
}

interface GenerationResult {
  text: string
  provider: 'groq' | 'gemini'
  model: string
  tokensUsed: number
  processingTime: number
  shadowMode: boolean
}

interface AvailabilitySignal {
  availabilityFailure: boolean
  status: number
  quotaType: QuotaType
  retryAfter: number
  failureClass: FailureClass
  message: string
}

interface ErrorMetadata {
  code: string
  status: number
  quotaType?: QuotaType
  retryAfter?: number
  failureClass?: FailureClass
  fallbackAllowed?: boolean
}

interface QuotaGuardCompat {
  withQuotaGuard: typeof quotaGuard.withQuotaGuard
  isCoolingDown: typeof quotaGuard.isCoolingDown
  cooldownSecondsLeft: typeof quotaGuard.cooldownSecondsLeft
  registerQuotaHit: (provider: string, retryAfterSeconds?: number, quotaType?: QuotaType) => void
  getTPMTelemetry?: (provider: string, estimatedTokens: number) => unknown
  recordTPMUsage?: (provider: string, tokens: number) => void
}

const qg = quotaGuard as unknown as QuotaGuardCompat

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash'

const POLICY_BLOCK_MARKERS = [
  'terminal_sink_enforcer',
  'provenance_unavailable',
  'trust_gate_failure',
  'narrative_gate_failure',
  'evidence_gate_failure',
  'editorial policy block',
  'manual_review_required',
]

function parseNumericEnv(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function isStrictValidationMode(): boolean {
  const envValue = String(process.env.VALIDATION_STRICT_MODE ?? 'true').trim().toLowerCase()
  return envValue !== 'false'
}

function getMaxTokensForRequest(): number {
  if (!isStrictValidationMode()) return 2048
  return Math.floor(parseNumericEnv(process.env.GROQ_VALIDATION_MAX_TOKENS, 900))
}

function estimateTokens(prompt: string, maxTokens: number): number {
  const charBasedEstimate = Math.ceil(prompt.length / 4)
  const strictMultiplier = parseNumericEnv(process.env.GROQ_VALIDATION_TOKEN_MULTIPLIER, 1)
  const rawEstimate = Math.ceil(charBasedEstimate * strictMultiplier)
  return Math.max(1, Math.min(maxTokens, rawEstimate))
}

function parseRetryAfterSeconds(source: string): number {
  const match = source.match(/retry\s+after\s+([0-9]+(?:\.[0-9]+)?)s?/i) || source.match(/([0-9]+(?:\.[0-9]+)?)s\b/i)
  if (!match) return 0
  const parsed = Number(match[1])
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.ceil(parsed)
}

function asError(input: unknown): Error {
  if (input instanceof Error) return input
  return new Error(String(input ?? 'Unknown provider error'))
}

function readString(obj: unknown, key: string): string {
  if (!obj || typeof obj !== 'object') return ''
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

function readNumber(obj: unknown, key: string): number {
  if (!obj || typeof obj !== 'object') return 0
  const value = (obj as Record<string, unknown>)[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return value
}

function hasPolicyBlockMarker(message: string): boolean {
  const lowered = message.toLowerCase()
  return POLICY_BLOCK_MARKERS.some((marker) => lowered.includes(marker))
}

function classifyQuotaType(message: string, metricHint?: string): QuotaType {
  const lowered = message.toLowerCase()
  const metric = (metricHint || '').toLowerCase()

  if (
    lowered.includes('tokens per day') ||
    lowered.includes('try again tomorrow') ||
    lowered.includes('daily quota') ||
    metric.includes('tokens_per_day') ||
    metric.includes('daily')
  ) {
    return 'TPD'
  }

  if (
    lowered.includes('rate limit') ||
    lowered.includes('too many requests') ||
    lowered.includes('tokens per minute') ||
    metric.includes('tokens_per_minute') ||
    metric.includes('minute')
  ) {
    return 'TPM'
  }

  return 'UNKNOWN'
}

function toFailureClass(quotaType: QuotaType): FailureClass {
  if (quotaType === 'TPD') return 'TPD_EXHAUSTION'
  return 'TPM_EXHAUSTION'
}

function createProviderError(message: string, metadata: ErrorMetadata): Error {
  const error = new Error(message)
  Object.assign(error, metadata)
  return error
}

function createPolicyBlockedError(message: string): Error {
  return createProviderError(message, {
    code: 'PROVIDER_FALLBACK_POLICY_BLOCKED',
    status: 500,
    failureClass: 'NON_AVAILABILITY_FAILURE',
    fallbackAllowed: false,
  })
}

function classifyAvailabilityFailure(input: unknown): AvailabilitySignal {
  const error = asError(input)
  const message = error.message || 'Provider call failed'
  const errorRecord = error as unknown as Record<string, unknown>
  const normalizedErrorKind = readString(errorRecord, 'normalizedErrorKind').toUpperCase()
  const providerCode = readString(errorRecord, 'providerCode').toUpperCase()
  const providerMessage = readString(errorRecord, 'providerMessage')
  const quotaMetric = readString(errorRecord, 'quotaMetric')
  const status = readNumber(errorRecord, 'status')
  const retryAfterFromMeta = readNumber(errorRecord, 'retryAfter') || readNumber(errorRecord, 'retry_after_seconds')

  const sourceText = [message, providerMessage, providerCode].join(' ').trim()
  const lower = sourceText.toLowerCase()
  const hasAvailabilityKeywords =
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('resource exhausted') ||
    lower.includes('429') ||
    normalizedErrorKind === 'RATE_LIMIT'

  const availabilityFailure = status === 429 || hasAvailabilityKeywords
  const quotaType = classifyQuotaType(sourceText, quotaMetric)
  const retryAfter = retryAfterFromMeta > 0 ? retryAfterFromMeta : parseRetryAfterSeconds(sourceText)

  return {
    availabilityFailure,
    status,
    quotaType,
    retryAfter,
    failureClass: toFailureClass(quotaType),
    message,
  }
}

async function extractProviderMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (payload && typeof payload === 'object') {
      const payloadObject = payload as Record<string, unknown>
      const errorObject = payloadObject.error
      if (errorObject && typeof errorObject === 'object') {
        const message = readString(errorObject, 'message')
        if (message) return message
      }
      const topMessage = readString(payloadObject, 'message')
      if (topMessage) return topMessage
    }
  } catch {
    // Ignore JSON parse failures and fall back to status text.
  }

  if (response.statusText) return response.statusText
  return `Groq request failed with status ${response.status}`
}

function resolveGeminiModel(): string {
  const raw = String(process.env.GEMINI_FALLBACK_MODEL || '').trim()
  return raw || DEFAULT_GEMINI_FALLBACK_MODEL
}

async function callGroqAPI(params: {
  prompt: string
  systemInstruction: string
  temperature: number
  responseFormat?: ResponseFormat
}): Promise<GenerationResult> {
  const maxTokens = getMaxTokensForRequest()
  const estimatedTokens = estimateTokens(params.prompt, maxTokens)

  if (typeof qg.getTPMTelemetry === 'function') {
    qg.getTPMTelemetry('groq', estimatedTokens)
  }

  const minDelayMs = Math.floor(parseNumericEnv(process.env.GROQ_VALIDATION_MIN_DELAY_MS, 0))
  if (minDelayMs > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, minDelayMs))
  }

  const groqApiKey = String(process.env.GROQ_API_KEY || '').trim()
  const requestBody: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: params.systemInstruction },
      { role: 'user', content: params.prompt },
    ],
    temperature: params.temperature,
    max_tokens: maxTokens,
  }

  if (params.responseFormat) {
    requestBody.response_format = params.responseFormat
  }

  const start = Date.now()
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const message = await extractProviderMessage(response)
    throw createProviderError(message, {
      code: 'GROQ_HTTP_ERROR',
      status: response.status,
    })
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { total_tokens?: number }
  }

  const text = String(payload?.choices?.[0]?.message?.content || '').trim()
  if (!text) {
    throw createProviderError('Groq empty response', {
      code: 'GROQ_EMPTY_RESPONSE',
      status: 502,
    })
  }

  const usageTokens = payload?.usage?.total_tokens
  const tokensUsed = typeof usageTokens === 'number' && Number.isFinite(usageTokens)
    ? usageTokens
    : estimatedTokens

  if (typeof qg.recordTPMUsage === 'function') {
    qg.recordTPMUsage('groq', estimatedTokens)
  }

  return {
    text,
    provider: 'groq',
    model: GROQ_MODEL,
    tokensUsed,
    processingTime: Math.max(1, Date.now() - start),
    shadowMode: String(process.env.SHADOW_MODE || 'false').toLowerCase() === 'true',
  }
}

async function callGeminiAPI(params: {
  prompt: string
  systemInstruction: string
  temperature: number
  usageContext?: UsageContext
  sourceSignal: AvailabilitySignal
}): Promise<GenerationResult> {
  if (qg.isCoolingDown('gemini')) {
    const retryAfter = qg.cooldownSecondsLeft('gemini')
    throw createProviderError('Gemini fallback skipped because cooldown is active', {
      code: 'PROVIDER_FALLBACK_SKIPPED_GEMINI_COOLDOWN',
      status: 429,
      quotaType: params.sourceSignal.quotaType,
      retryAfter,
      failureClass: 'COOLDOWN_ACTIVE',
    })
  }

  const model = resolveGeminiModel()
  const start = Date.now()

  try {
    const response = await callGeminiCentral({
      context: {
        module: 'groq-provider',
        function: 'callGeminiAPI',
        purpose: 'other',
        metadata: {
          usageContext: params.usageContext,
          source_failure: params.sourceSignal.failureClass,
        },
      },
      model,
      prompt: params.prompt,
      systemInstruction: params.systemInstruction,
      generationConfig: {
        temperature: params.temperature,
      },
    })

    const responseObject = response as unknown as Record<string, unknown>
    const text = readString(responseObject, 'text') || readString(responseObject, 'content')
    if (!text) {
      throw createProviderError('Gemini fallback empty response', {
        code: 'GEMINI_EMPTY_RESPONSE',
        status: 502,
      })
    }

    const tokensUsed = readNumber(responseObject, 'tokensUsed') || estimateTokens(params.prompt, 1024)
    const responseModel = model

    return {
      text,
      provider: 'gemini',
      model: responseModel,
      tokensUsed,
      processingTime: Math.max(1, Date.now() - start),
      shadowMode: String(process.env.SHADOW_MODE || 'false').toLowerCase() === 'true',
    }
  } catch (error: unknown) {
    const signal = classifyAvailabilityFailure(error)
    if (signal.availabilityFailure) {
      const retryAfter = signal.retryAfter > 0 ? signal.retryAfter : 60
      qg.registerQuotaHit('gemini', retryAfter, signal.quotaType)

      throw createProviderError('Gemini fallback failed due quota exhaustion', {
        code: 'PROVIDER_FALLBACK_FAILED',
        status: 429,
        quotaType: signal.quotaType,
        retryAfter,
        failureClass: signal.failureClass,
      })
    }

    throw createProviderError('Gemini fallback failed', {
      code: 'PROVIDER_FALLBACK_FAILED',
      status: signal.status || 500,
      quotaType: 'UNKNOWN',
      retryAfter: signal.retryAfter,
      failureClass: 'NON_AVAILABILITY_FAILURE',
    })
  }
}

function shouldBypassFallbackForResponseFormat(message: string, responseFormat?: ResponseFormat): boolean {
  if (!responseFormat || responseFormat.type !== 'json_object') return false
  return message.toLowerCase().includes('failed to generate json')
}

export async function generateQuality(
  prompt: string,
  systemInstruction: string,
  temperature: number,
  responseFormat?: ResponseFormat,
  usageContext?: UsageContext
): Promise<GenerationResult> {
  const groqApiKey = String(process.env.GROQ_API_KEY || '').trim()

  if (!groqApiKey || qg.isCoolingDown('groq')) {
    return callGeminiAPI({
      prompt,
      systemInstruction,
      temperature,
      usageContext,
      sourceSignal: {
        availabilityFailure: true,
        status: 429,
        quotaType: 'TPM',
        retryAfter: qg.cooldownSecondsLeft('groq'),
        failureClass: 'TPM_EXHAUSTION',
        message: 'Groq unavailable',
      },
    })
  }

  try {
    const guarded = await qg.withQuotaGuard('groq', async () =>
      callGroqAPI({
        prompt,
        systemInstruction,
        temperature,
        responseFormat,
      })
    )

    if (guarded) return guarded

    return callGeminiAPI({
      prompt,
      systemInstruction,
      temperature,
      usageContext,
      sourceSignal: {
        availabilityFailure: true,
        status: 429,
        quotaType: 'TPM',
        retryAfter: qg.cooldownSecondsLeft('groq'),
        failureClass: 'TPM_EXHAUSTION',
        message: 'Groq cooldown active',
      },
    })
  } catch (error: unknown) {
    const err = asError(error)

    if (hasPolicyBlockMarker(err.message)) {
      throw err
    }

    if (shouldBypassFallbackForResponseFormat(err.message, responseFormat)) {
      throw err
    }

    const sourceSignal = classifyAvailabilityFailure(err)
    if (!sourceSignal.availabilityFailure) {
      throw createPolicyBlockedError(err.message)
    }

    return callGeminiAPI({
      prompt,
      systemInstruction,
      temperature,
      usageContext,
      sourceSignal,
    })
  }
}