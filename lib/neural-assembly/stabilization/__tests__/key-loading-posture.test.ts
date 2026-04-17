import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { Ed25519Provider, EnvironmentKeyProvider, normalizePECLKeyId, resetGlobalCryptoProvider } from '../crypto-provider'

function snapshotAndClearPublicKeyEnv(): Record<string, string> {
  const snapshot: Record<string, string> = {}

  for (const envKey of Object.keys(process.env)) {
    if (envKey.startsWith('PECL_PUBLIC_KEY_')) {
      snapshot[envKey] = process.env[envKey] || ''
      delete process.env[envKey]
    }
  }

  return snapshot
}

describe('Key loading posture remediation', () => {
  let publicKeySnapshot: Record<string, string>
  const originalNodeEnv = process.env.NODE_ENV
  const originalAllowDevEphemeral = process.env.PECL_ALLOW_DEV_EPHEMERAL

  beforeEach(() => {
    publicKeySnapshot = snapshotAndClearPublicKeyEnv()
    delete (global as any).__DEV_PRIVATE_KEY__
    resetGlobalCryptoProvider()
  })

  afterEach(() => {
    for (const envKey of Object.keys(process.env)) {
      if (envKey.startsWith('PECL_PUBLIC_KEY_')) {
        delete process.env[envKey]
      }
    }

    for (const [envKey, value] of Object.entries(publicKeySnapshot)) {
      process.env[envKey] = value
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }

    if (originalAllowDevEphemeral === undefined) {
      delete process.env.PECL_ALLOW_DEV_EPHEMERAL
    } else {
      process.env.PECL_ALLOW_DEV_EPHEMERAL = originalAllowDevEphemeral
    }

    delete (global as any).__DEV_PRIVATE_KEY__
    resetGlobalCryptoProvider()
  })

  test('blocks silent dev_ephemeral fallback when running enforce-mode posture', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.PECL_ALLOW_DEV_EPHEMERAL

    const provider = new EnvironmentKeyProvider()
    const publicKeys = await provider.listPublicKeys()

    expect(publicKeys).toHaveLength(0)
    expect((global as any).__DEV_PRIVATE_KEY__).toBeUndefined()
  })

  test('signing and verification succeed when key id and trust root are consistent', async () => {
    process.env.NODE_ENV = 'development'

    const keyGenProvider = new EnvironmentKeyProvider()
    const keyPair = keyGenProvider.generateKeyPair()

    process.env.PECL_PUBLIC_KEY_STABLE_TRUST_ROOT = keyPair.publicKey.toString('base64')

    const provider = new Ed25519Provider(new EnvironmentKeyProvider())

    const signedClaims = {
      payload_id: 'batch-stable-trust-root-001',
      manifest_hash: 'manifest-stable-trust-root-001',
      authorized_languages: ['en'],
      keyId: 'stable_trust_root',
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 60_000,
      claimGraphDigest: 'claim-graph-digest',
      evidenceLedgerDigest: 'evidence-ledger-digest'
    }

    const signature = provider.sign(signedClaims, keyPair.privateKey.toString('base64'))
    const isValid = await provider.verify(signedClaims, signature, 'stable_trust_root')

    expect(isValid).toBe(true)
  })

  test('loads PECL public key with normalized key id mapping', async () => {
    process.env.NODE_ENV = 'development'

    const keyGenProvider = new EnvironmentKeyProvider()
    const keyPair = keyGenProvider.generateKeyPair()

    process.env.PECL_PUBLIC_KEY_PROD_2026_04 = keyPair.publicKey.toString('base64')

    const provider = new EnvironmentKeyProvider()
    const normalized = normalizePECLKeyId('PROD-2026-04')
    const loaded = await provider.getPublicKey('PROD-2026-04')
    const loadedKeys = await provider.listPublicKeys()

    expect(normalized).toBe('prod_2026_04')
    expect(loaded).not.toBeNull()
    expect(loaded?.keyId).toBe('prod_2026_04')
    expect(loadedKeys.map((key) => key.keyId)).toContain('prod_2026_04')
  })
})
