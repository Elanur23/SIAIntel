import fs from 'fs'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { EnvironmentKeyProvider, resetGlobalCryptoProvider } from '../crypto-provider'
import { evaluateOperatorPrecheck } from '../operator-precheck'

describe('Operator precheck remediation', () => {
  const originalEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    originalEnv.PECL_SIGNING_KEY_ID = process.env.PECL_SIGNING_KEY_ID
    originalEnv.PECL_PRIVATE_KEY = process.env.PECL_PRIVATE_KEY
    originalEnv.SHADOW_MODE = process.env.SHADOW_MODE
    originalEnv.VALIDATION_STRICT_MODE = process.env.VALIDATION_STRICT_MODE
    originalEnv.NODE_ENV = process.env.NODE_ENV

    for (const envKey of Object.keys(process.env)) {
      if (envKey.startsWith('PECL_PUBLIC_KEY_')) {
        delete process.env[envKey]
      }
    }

    delete process.env.PECL_SIGNING_KEY_ID
    delete process.env.PECL_PRIVATE_KEY
    process.env.SHADOW_MODE = 'false'
    process.env.VALIDATION_STRICT_MODE = 'true'
    process.env.NODE_ENV = 'development'

    resetGlobalCryptoProvider()
  })

  afterEach(() => {
    for (const envKey of Object.keys(process.env)) {
      if (envKey.startsWith('PECL_PUBLIC_KEY_')) {
        delete process.env[envKey]
      }
    }

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }

    resetGlobalCryptoProvider()
  })

  test('passes when selected signing key id matches loaded public key', async () => {
    const provider = new EnvironmentKeyProvider()
    const keyPair = provider.generateKeyPair()

    process.env.PECL_SIGNING_KEY_ID = 'Prod-2026-04'
    process.env.PECL_PRIVATE_KEY = keyPair.privateKey.toString('base64')
    process.env.PECL_PUBLIC_KEY_PROD_2026_04 = keyPair.publicKey.toString('base64')

    resetGlobalCryptoProvider()

    const summary = await evaluateOperatorPrecheck()

    expect(summary.pass).toBe(true)
    expect(summary.selected_key_id).toBe('prod_2026_04')
    expect(summary.loaded_key_ids).toContain('prod_2026_04')
    expect(summary.matching_public_key).toBe(true)
  })

  test('fails when key material is incomplete', async () => {
    const summary = await evaluateOperatorPrecheck()

    expect(summary.pass).toBe(false)
    expect(summary.loaded_key_count).toBe(0)
    expect(summary.private_key_present).toBe(false)
  })

  test('documents bash-safe strict precheck command in runbook', () => {
    const runbookPath = path.resolve(process.cwd(), 'OPERATOR_RUNBOOK.md')
    const runbookContent = fs.readFileSync(runbookPath, 'utf8')

    expect(runbookContent).toContain('npx tsx scripts/precheck-pecl-runtime.ts')
    expect(runbookContent).not.toContain('if(!kid)')
  })
})
