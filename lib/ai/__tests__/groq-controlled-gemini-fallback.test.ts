import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

const mockWithQuotaGuard = jest.fn(async (_provider: string, fn: () => Promise<unknown>) => fn())
const mockIsCoolingDown = jest.fn((_provider: string) => false)
const mockCooldownSecondsLeft = jest.fn((_provider: string) => 0)
const mockRegisterQuotaHit = jest.fn()
const mockCallGeminiCentral = jest.fn(async (_request: any) => ({
  text: 'gemini-fallback-default',
  tokensUsed: 32,
  processingTime: 20,
  model: 'gemini-2.5-flash',
  shadowMode: false
}))

jest.mock('../quota-guard', () => ({
  withQuotaGuard: mockWithQuotaGuard,
  isCoolingDown: mockIsCoolingDown,
  registerQuotaHit: mockRegisterQuotaHit,
  cooldownSecondsLeft: mockCooldownSecondsLeft,
  getRollingTPMUsage: jest.fn(() => 1000),
  recordTPMUsage: jest.fn(),
  getTPMTelemetry: jest.fn(() => ({
    rolling_usage: 1000,
    estimated_next: 1200,
    projected_usage: 2200,
    safe_threshold: 8400,
    tpm_limit: 12000,
    delay_needed: false,
    delay_ms: 0,
    pacing_decision: 'NO_DELAY_NEEDED'
  }))
}))

jest.mock('../../neural-assembly/gemini-central-provider', () => ({
  callGeminiCentral: mockCallGeminiCentral
}))

import { generateQuality } from '../groq-provider'

function makeRateLimitedResponse(message: string): any {
  return {
    ok: false,
    status: 429,
    headers: {
      get: () => null
    },
    json: async () => ({
      error: {
        message
      }
    })
  }
}

function makeJsonContractFailureResponse(): any {
  return {
    ok: false,
    status: 400,
    headers: {
      get: () => null
    },
    json: async () => ({
      error: {
        message: 'Failed to generate JSON. Please adjust your prompt.'
      }
    })
  }
}

function makeNormalizedGeminiQuotaError(): any {
  const error: any = new Error('Central Gemini provider error: resource exhausted')
  error.normalizedErrorKind = 'RATE_LIMIT'
  error.providerCode = 'RESOURCE_EXHAUSTED'
  error.providerMessage = 'Daily quota exhausted. Retry after 181s.'
  error.retry_after_seconds = 181
  error.quotaMetric = 'tokens_per_day'
  return error
}

describe('Groq controlled Gemini fallback policy', () => {
  const usageContext = {
    caller_module: 'llm-provider',
    caller_function: 'generateEditionWithLLM',
    purpose: 'multilingual_news_generation' as const,
    batch_id: 'batch-fallback-policy-001'
  }

  const originalEnv = {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GA4_GEMINI_API_KEY: process.env.GA4_GEMINI_API_KEY,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    SHADOW_MODE: process.env.SHADOW_MODE
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    delete process.env.GA4_GEMINI_API_KEY
    delete process.env.GEMINI_FALLBACK_MODEL
    process.env.SHADOW_MODE = 'false'

    mockIsCoolingDown.mockReturnValue(false)
    mockCooldownSecondsLeft.mockReturnValue(0)
    mockWithQuotaGuard.mockImplementation(async (_provider: string, fn: () => Promise<unknown>) => fn())
    mockCallGeminiCentral.mockResolvedValue({
      text: 'gemini-fallback-ok',
      tokensUsed: 64,
      processingTime: 20,
      model: 'gemini-2.5-flash',
      shadowMode: false
    })

    ;(global as any).fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: {
        get: () => null
      },
      json: async () => ({
        choices: [{ message: { content: 'groq-ok' } }],
        usage: { total_tokens: 42 }
      })
    }))

    jest.clearAllMocks()
  })

  afterEach(() => {
    if (originalEnv.GROQ_API_KEY === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalEnv.GROQ_API_KEY

    if (originalEnv.GEMINI_API_KEY === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY

    if (originalEnv.GA4_GEMINI_API_KEY === undefined) delete process.env.GA4_GEMINI_API_KEY
    else process.env.GA4_GEMINI_API_KEY = originalEnv.GA4_GEMINI_API_KEY

    if (originalEnv.GEMINI_FALLBACK_MODEL === undefined) delete process.env.GEMINI_FALLBACK_MODEL
    else process.env.GEMINI_FALLBACK_MODEL = originalEnv.GEMINI_FALLBACK_MODEL

    if (originalEnv.SHADOW_MODE === undefined) delete process.env.SHADOW_MODE
    else process.env.SHADOW_MODE = originalEnv.SHADOW_MODE
  })

  test('keeps Groq as primary when available', async () => {
    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('groq')
    expect(mockCallGeminiCentral).not.toHaveBeenCalled()
  })

  test('falls back to Gemini on Groq TPD exhaustion with default model and routes through central boundary', async () => {
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Tokens per day quota exceeded. Try again tomorrow.')
    )

    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('gemini')
    expect(response.model).toBe('gemini-2.5-flash')
    expect(mockCallGeminiCentral).toHaveBeenCalledTimes(1)
    expect(mockCallGeminiCentral).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        context: expect.objectContaining({
          module: 'groq-provider',
          function: 'callGeminiAPI',
          purpose: 'other'
        })
      })
    )
  })

  test('falls back to Gemini on Groq TPM exhaustion', async () => {
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Rate limit reached, try again in 2.0s')
    )

    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('gemini')
    expect(mockCallGeminiCentral).toHaveBeenCalledTimes(1)
  })

  test('registers Gemini cooldown and preserves quota metadata when fallback hits Gemini 429', async () => {
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Rate limit reached, try again in 2.0s')
    )

    const geminiRateLimitError: any = new Error('Central Gemini provider error: 429 Too Many Requests. Try again in 11.2s')
    geminiRateLimitError.status = 429
    geminiRateLimitError.retryAfter = 12
    geminiRateLimitError.quotaType = 'TPM'
    mockCallGeminiCentral.mockRejectedValueOnce(geminiRateLimitError)

    await expect(
      generateQuality('prompt', 'system', 0.3, undefined, usageContext)
    ).rejects.toMatchObject({
      code: 'PROVIDER_FALLBACK_FAILED',
      status: 429,
      quotaType: 'TPM',
      retryAfter: 12,
      failureClass: 'TPM_EXHAUSTION'
    })

    expect(mockRegisterQuotaHit).toHaveBeenCalledWith('gemini', 12, 'TPM')
  })

  test('classifies normalized Gemini quota signals without explicit status into deterministic quota cooldown path', async () => {
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Rate limit reached, try again in 2.0s')
    )

    mockCallGeminiCentral.mockRejectedValueOnce(makeNormalizedGeminiQuotaError())

    await expect(
      generateQuality('prompt', 'system', 0.3, undefined, usageContext)
    ).rejects.toMatchObject({
      code: 'PROVIDER_FALLBACK_FAILED',
      quotaType: 'TPD',
      failureClass: 'TPD_EXHAUSTION',
      retryAfter: 181
    })

    expect(mockRegisterQuotaHit).toHaveBeenCalledWith('gemini', 181, 'TPD')
  })

  test('skips Gemini fallback when Gemini cooldown is already active', async () => {
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Rate limit reached, try again in 2.0s')
    )

    mockIsCoolingDown.mockImplementation((provider: string) => provider === 'gemini')
    mockCooldownSecondsLeft.mockImplementation((provider: string) => (provider === 'gemini' ? 45 : 0))

    await expect(
      generateQuality('prompt', 'system', 0.3, undefined, usageContext)
    ).rejects.toMatchObject({
      code: 'PROVIDER_FALLBACK_SKIPPED_GEMINI_COOLDOWN',
      status: 429,
      quotaType: 'TPM',
      retryAfter: 45,
      failureClass: 'COOLDOWN_ACTIVE'
    })

    expect(mockCallGeminiCentral).not.toHaveBeenCalled()
    expect(mockRegisterQuotaHit.mock.calls.some((call) => call[0] === 'gemini')).toBe(false)
  })

  test('falls back to Gemini when Groq is cooling down', async () => {
    mockIsCoolingDown.mockImplementation((provider: string) => provider === 'groq')
    mockCooldownSecondsLeft.mockImplementation((provider: string) => (provider === 'groq' ? 33 : 0))

    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('gemini')
    expect(mockCallGeminiCentral).toHaveBeenCalledTimes(1)
  })

  test('falls back to Gemini when Groq key is unavailable', async () => {
    delete process.env.GROQ_API_KEY

    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('gemini')
    expect(mockCallGeminiCentral).toHaveBeenCalledTimes(1)
  })

  test('respects GEMINI_FALLBACK_MODEL override when set', async () => {
    process.env.GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash'
    ;(global as any).fetch = jest.fn(async () =>
      makeRateLimitedResponse('Tokens per day quota exceeded. Try again tomorrow.')
    )

    const response = await generateQuality('prompt', 'system', 0.3, undefined, usageContext)

    expect(response.provider).toBe('gemini')
    expect(response.model).toBe('gemini-1.5-flash')
    expect(mockCallGeminiCentral).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-1.5-flash'
      })
    )
  })

  test('does not fallback for JSON-contract/content-path failures', async () => {
    ;(global as any).fetch = jest.fn(async () => makeJsonContractFailureResponse())

    await expect(
      generateQuality('prompt', 'system', 0.3, { type: 'json_object' }, usageContext)
    ).rejects.toThrow('Failed to generate JSON')

    expect(mockCallGeminiCentral).not.toHaveBeenCalled()
  })

  test('does not fallback for sink/provenance/trust failures', async () => {
    const blockedMessages = [
      'TERMINAL_SINK_ENFORCER: publish denied',
      'PROVENANCE_UNAVAILABLE: missing signature',
      'TRUST_GATE_FAILURE: threshold not met',
      'NARRATIVE_GATE_FAILURE: causal chain unresolved',
      'EVIDENCE_GATE_FAILURE: citation provenance missing',
      'EDITORIAL POLICY BLOCK: compliance hold',
      'MANUAL_REVIEW_REQUIRED: unresolved policy checkpoint'
    ]

    for (const message of blockedMessages) {
      mockCallGeminiCentral.mockClear()
      mockWithQuotaGuard.mockImplementationOnce(async () => {
        throw new Error(message)
      })

      await expect(generateQuality('prompt', 'system', 0.3, undefined, usageContext)).rejects.toThrow(message)
      expect(mockCallGeminiCentral).not.toHaveBeenCalled()
    }
  })

  test('does not fallback on status-only failures without Groq availability signature', async () => {
    mockWithQuotaGuard.mockImplementationOnce(async () => {
      const internalError: any = new Error('INTERNAL_PIPELINE_FAILURE: deterministic quality regression')
      internalError.status = 500
      throw internalError
    })

    await expect(generateQuality('prompt', 'system', 0.3, undefined, usageContext)).rejects.toMatchObject({
      code: 'PROVIDER_FALLBACK_POLICY_BLOCKED',
      failureClass: 'NON_AVAILABILITY_FAILURE',
      fallbackAllowed: false
    })

    expect(mockCallGeminiCentral).not.toHaveBeenCalled()
  })
})
