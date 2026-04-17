import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

jest.mock('../quota-guard', () => ({
  withQuotaGuard: jest.fn(async (_provider: string, fn: () => Promise<unknown>) => fn()),
  isCoolingDown: jest.fn(() => false),
  registerQuotaHit: jest.fn(),
  cooldownSecondsLeft: jest.fn(() => 0),
  getRollingTPMUsage: jest.fn(() => 2000),
  recordTPMUsage: jest.fn(),
  getTPMTelemetry: jest.fn(() => ({
    rolling_usage: 2000,
    estimated_next: 3000,
    projected_usage: 5000,
    safe_threshold: 8400,
    tpm_limit: 12000,
    delay_needed: false,
    delay_ms: 0,
    pacing_decision: 'NO_DELAY_NEEDED'
  }))
}))

import * as quotaGuard from '../quota-guard'
import { generateQuality } from '../groq-provider'

describe('Groq strict validation quota profile remediation', () => {
  const originalEnv = {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    VALIDATION_STRICT_MODE: process.env.VALIDATION_STRICT_MODE,
    GROQ_VALIDATION_MAX_TOKENS: process.env.GROQ_VALIDATION_MAX_TOKENS,
    GROQ_VALIDATION_TOKEN_MULTIPLIER: process.env.GROQ_VALIDATION_TOKEN_MULTIPLIER,
    GROQ_VALIDATION_MIN_DELAY_MS: process.env.GROQ_VALIDATION_MIN_DELAY_MS
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.VALIDATION_STRICT_MODE = 'true'
    delete process.env.GROQ_VALIDATION_MAX_TOKENS
    delete process.env.GROQ_VALIDATION_TOKEN_MULTIPLIER
    process.env.GROQ_VALIDATION_MIN_DELAY_MS = '1'

    ;(global as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: {}
      })
    }))

    jest.clearAllMocks()
  })

  afterEach(() => {
    if (originalEnv.GROQ_API_KEY === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalEnv.GROQ_API_KEY

    if (originalEnv.VALIDATION_STRICT_MODE === undefined) delete process.env.VALIDATION_STRICT_MODE
    else process.env.VALIDATION_STRICT_MODE = originalEnv.VALIDATION_STRICT_MODE

    if (originalEnv.GROQ_VALIDATION_MAX_TOKENS === undefined) delete process.env.GROQ_VALIDATION_MAX_TOKENS
    else process.env.GROQ_VALIDATION_MAX_TOKENS = originalEnv.GROQ_VALIDATION_MAX_TOKENS

    if (originalEnv.GROQ_VALIDATION_TOKEN_MULTIPLIER === undefined) delete process.env.GROQ_VALIDATION_TOKEN_MULTIPLIER
    else process.env.GROQ_VALIDATION_TOKEN_MULTIPLIER = originalEnv.GROQ_VALIDATION_TOKEN_MULTIPLIER

    if (originalEnv.GROQ_VALIDATION_MIN_DELAY_MS === undefined) delete process.env.GROQ_VALIDATION_MIN_DELAY_MS
    else process.env.GROQ_VALIDATION_MIN_DELAY_MS = originalEnv.GROQ_VALIDATION_MIN_DELAY_MS
  })

  test('applies strict validation max token cap and records estimated usage fallback', async () => {
    await generateQuality(
      'prompt text',
      'system text',
      0.3,
      undefined,
      {
        caller_module: 'llm-provider',
        caller_function: 'generateEditionWithLLM',
        purpose: 'multilingual_news_generation',
        batch_id: 'batch-groq-profile-001'
      }
    )

    const fetchMock = (global as any).fetch as jest.Mock
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const firstCallArgs = fetchMock.mock.calls[0] as any[]
    const requestBody = JSON.parse(firstCallArgs[1].body)
    expect(requestBody.max_tokens).toBe(900)

    const tpmTelemetryMock = quotaGuard.getTPMTelemetry as jest.Mock
    const recordUsageMock = quotaGuard.recordTPMUsage as jest.Mock

    const estimatedTokens = tpmTelemetryMock.mock.calls[0][1]
    expect(recordUsageMock).toHaveBeenCalledWith('groq', estimatedTokens)
  })

  test('keeps default max token plan when strict validation mode is disabled', async () => {
    process.env.VALIDATION_STRICT_MODE = 'false'

    await generateQuality(
      'prompt text',
      'system text',
      0.3,
      undefined,
      {
        caller_module: 'llm-provider',
        caller_function: 'generateEditionWithLLM',
        purpose: 'multilingual_news_generation',
        batch_id: 'batch-groq-profile-002'
      }
    )

    const fetchMock = (global as any).fetch as jest.Mock
    const firstCallArgs = fetchMock.mock.calls[0] as any[]
    const requestBody = JSON.parse(firstCallArgs[1].body)
    expect(requestBody.max_tokens).toBe(2048)
  })
})
