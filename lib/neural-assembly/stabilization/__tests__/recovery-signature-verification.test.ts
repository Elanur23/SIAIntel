import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import crypto from 'crypto'
import { enforceSinkGate } from '../terminal-sink-enforcer'
import {
  Ed25519Provider,
  EnvironmentKeyProvider,
  canonicalizeJSON,
  resetGlobalCryptoProvider
} from '../crypto-provider'
import { computeProvenanceDigests } from '../provenance-binder'

describe('Recovery signature verification remediation', () => {
  const testKeyId = 'recovery_trust_root_001'
  let testPrivateKey = ''

  const mic: any = {
    id: 'mic-recovery-trust-root-001',
    truth_nucleus: {
      facts: [],
      claims: [],
      impact_analysis: 'impact',
      geopolitical_context: 'context'
    },
    structural_atoms: {
      core_thesis: 'thesis',
      key_entities: [],
      temporal_markers: [],
      numerical_data: []
    }
  }

  const manifest: any = {
    payload_id: 'batch-recovery-trust-root-001',
    manifest_id: 'manifest-recovery-trust-root-001',
    manifest_version: '1.0.0',
    timestamp: new Date().toISOString(),
    base_language: 'en',
    expected_languages: ['en'],
    content: {
      headlines: { en: 'Title EN' },
      slugs: { en: 'title-en' },
      leads: { en: 'Lead EN' },
      bodies: { en: 'Body EN' },
      summaries: { en: 'Summary EN' }
    },
    intelligence: {
      claim_graph_hash: 'cg',
      evidence_ledger_ref: 'el',
      trust_score_upstream: 90
    },
    metadata: {
      topic_sensitivity: 'STANDARD',
      category: 'TEST',
      urgency: 'STANDARD'
    }
  }

  beforeEach(() => {
    delete process.env.PECL_ALLOW_DEV_EPHEMERAL

    const keyProvider = new EnvironmentKeyProvider()
    const keyPair = keyProvider.generateKeyPair()

    testPrivateKey = keyPair.privateKey.toString('base64')
    process.env[`PECL_PUBLIC_KEY_${testKeyId}`] = keyPair.publicKey.toString('base64')

    resetGlobalCryptoProvider()
  })

  afterEach(() => {
    delete process.env[`PECL_PUBLIC_KEY_${testKeyId}`]
    resetGlobalCryptoProvider()
  })

  test('recovery-style saveBatch payload verifies under active trust root', async () => {
    const digests = computeProvenanceDigests(mic)
    const manifestHash = crypto.createHash('sha256').update(canonicalizeJSON(manifest)).digest('hex')

    const signedClaims = {
      payload_id: manifest.payload_id,
      manifest_hash: manifestHash,
      authorized_languages: ['en'],
      keyId: testKeyId,
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 60_000,
      claimGraphDigest: digests.claimGraphDigest,
      evidenceLedgerDigest: digests.evidenceLedgerDigest
    }

    const provider = new Ed25519Provider(new EnvironmentKeyProvider())
    const signature = provider.sign(signedClaims, testPrivateKey)

    const payload = {
      id: manifest.payload_id,
      mic_id: mic.id,
      user_id: 'system-operator',
      status: 'ABANDONED',
      approved_languages: [],
      pending_languages: [],
      rejected_languages: [],
      budget: {
        total: 10,
        spent: 0,
        remaining: 10
      },
      recirculation_count: 0,
      escalation_depth: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      is_mock: false,
      shadow_run: false
    }

    const { verifiedPayloadRaw } = await enforceSinkGate({ signedClaims, signature }, {
      sinkName: 'saveBatch',
      language: 'en',
      manifest,
      mic
    }, payload)

    const verifiedPayload = JSON.parse(verifiedPayloadRaw)
    expect(verifiedPayload.id).toBe(manifest.payload_id)
  })
})
