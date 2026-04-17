/**
 * TERMINAL_SINK_ENFORCER.TEST.TS
 * Proof of Last-Mile Integrity Enforcement
 */

import { enforceSinkGate } from '../terminal-sink-enforcer';
import { Ed25519Provider, EnvironmentKeyProvider, resetGlobalCryptoProvider, canonicalizeJSON } from '../crypto-provider';
import { computeProvenanceDigests } from '../provenance-binder';
import crypto from 'crypto';

// Force ENFORCE mode for testing
jest.mock('../config', () => ({
  PECL_DEPLOYMENT_MODE: 'ENFORCE'
}));

describe('Terminal Sink Enforcer [L6-BLK-004]', () => {
  let provider: Ed25519Provider;
  let testPrivateKey: string;
  let testKeyId = 'test_gate_key';

  const mockManifest: any = {
    payload_id: 'batch-123',
    manifest_id: 'man-456',
    manifest_version: "1.0.0",
    timestamp: "2024-01-01T00:00:00Z",
    base_language: "en",
    expected_languages: ['en'],
    content: {
      headlines: { en: 'Authorized Title' },
      slugs: { en: 'auth-slug' },
      leads: { en: 'Lead' },
      bodies: { en: 'Body' },
      summaries: { en: 'Summary' }
    },
    intelligence: { claim_graph_hash: 'dg1', evidence_ledger_ref: 'dg2', trust_score_upstream: 80 },
    metadata: { topic_sensitivity: "STANDARD", category: "ECONOMY", urgency: "STANDARD" }
  };

  const mockMic: any = {
    id: 'mic-123',
    truth_nucleus: { facts: [], claims: [], impact_analysis: '', geopolitical_context: '' },
    structural_atoms: { core_thesis: '', key_entities: [], temporal_markers: [], numerical_data: [] }
  };

  // Re-calculate real digests for mock MIC to pass enforcer
  const digests = computeProvenanceDigests(mockMic);
  const cgDigest = digests.claimGraphDigest;
  const elDigest = digests.evidenceLedgerDigest;

  const manifestHash = crypto.createHash('sha256').update(canonicalizeJSON(mockManifest)).digest('hex');

  beforeEach(() => {
    resetGlobalCryptoProvider();
    const kp = new EnvironmentKeyProvider();
    const keyPair = kp.generateKeyPair();
    testPrivateKey = keyPair.privateKey.toString('base64');
    process.env[`PECL_PUBLIC_KEY_${testKeyId}`] = keyPair.publicKey.toString('base64');
    resetGlobalCryptoProvider();
    provider = new Ed25519Provider(kp);
  });

  function createAuth(overrides?: any) {
    const signedClaims = {
      payload_id: 'batch-123',
      manifest_hash: manifestHash,
      authorized_languages: ['en'],
      keyId: testKeyId,
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 3600000,
      claimGraphDigest: cgDigest,
      evidenceLedgerDigest: elDigest,
      ...overrides
    };
    const signature = provider.sign(signedClaims, testPrivateKey);
    return { signedClaims, signature };
  }

  it('should PASS valid sink request and return immutable representation', async () => {
    const auth = createAuth();
    const payload = {
      title: 'Authorized Title',
      slug: 'auth-slug',
      content: 'Body',
      excerpt: 'Summary',
      language: 'en',
      category: 'ECONOMY',
      author: 'SIA',
      status: 'published',
      batch_id: 'batch-123'
    };

    const { verifiedPayloadRaw } = await enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, payload);

    expect(JSON.parse(verifiedPayloadRaw)).toEqual(payload);
  });

  it('should FAIL on invalid signature', async () => {
    const auth = createAuth();
    auth.signature = 'bad-sig';
    const payload = { title: 'Authorized Title', slug: 'auth-slug', content: 'Body', excerpt: 'Summary', language: 'en', category: 'ECONOMY', author: 'SIA', status: 'published', batch_id: 'batch-123' };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, payload)).rejects.toThrow('INVALID_SIGNATURE');
  });

  it('should FAIL on expired authorization', async () => {
    const auth = createAuth({ expiresAt: Date.now() - 1000 });
    const payload = { title: 'Authorized Title', slug: 'auth-slug', content: 'Body', excerpt: 'Summary', language: 'en', category: 'ECONOMY', author: 'SIA', status: 'published', batch_id: 'batch-123' };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, payload)).rejects.toThrow('EXPIRED_AUTH');
  });

  it('should FAIL on unauthorized scope (language)', async () => {
    const auth = createAuth({ authorized_languages: ['tr'] });
    const payload = { title: 'Authorized Title', slug: 'auth-slug', content: 'Body', excerpt: 'Summary', language: 'en', category: 'ECONOMY', author: 'SIA', status: 'published', batch_id: 'batch-123' };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, payload)).rejects.toThrow('UNAUTHORIZED_SCOPE');
  });

  it('should FAIL with PROVENANCE_UNAVAILABLE when MIC is missing but token claims provenance digests', async () => {
    const auth = createAuth();
    const payload = {
      title: 'Authorized Title',
      slug: 'auth-slug',
      content: 'Body',
      excerpt: 'Summary',
      language: 'en',
      category: 'ECONOMY',
      author: 'SIA',
      status: 'published',
      batch_id: 'batch-123'
    };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest
    }, payload)).rejects.toThrow('PROVENANCE_UNAVAILABLE');
  });

  it('should FAIL on projection mismatch (tampered content)', async () => {
    const auth = createAuth();
    const tamperedPayload = {
      title: 'TAMPERED TITLE',
      slug: 'auth-slug',
      content: 'Body',
      excerpt: 'Summary',
      language: 'en',
      category: 'ECONOMY',
      author: 'SIA',
      status: 'published',
      batch_id: 'batch-123'
    };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, tamperedPayload)).rejects.toThrow('PROJECTION_MISMATCH');
  });

  it('should FAIL on manifest contract mismatch (hash mismatch)', async () => {
    const auth = createAuth();
    // Tamper with the manifest pre-image provided to the enforcer
    const tamperedManifest = { ...mockManifest, payload_id: 'malicious-id' };
    const payload = { title: 'Authorized Title', slug: 'auth-slug', content: 'Body', excerpt: 'Summary', language: 'en', category: 'ECONOMY', author: 'SIA', status: 'published', batch_id: 'batch-123' };

    await expect(enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: tamperedManifest,
      mic: mockMic
    }, payload)).rejects.toThrow('HASH_MISMATCH');
  });

  it('should guarantee immutability by ignoring mutation of original payload object after gate entry', async () => {
    const auth = createAuth();
    const payload = {
      title: 'Authorized Title',
      slug: 'auth-slug',
      content: 'Body',
      excerpt: 'Summary',
      language: 'en',
      category: 'ECONOMY',
      author: 'SIA',
      status: 'published',
      batch_id: 'batch-123'
    };

    // We start the gate process
    const promise = enforceSinkGate(auth, {
      sinkName: 'createNews',
      language: 'en',
      manifest: mockManifest,
      mic: mockMic
    }, payload);

    // DANGER: Mutate the object immediately after passing it to the enforcer
    (payload as any).title = 'EVIL MUTATION';

    const { verifiedPayloadRaw } = await promise;
    const verified = JSON.parse(verifiedPayloadRaw);

    // The verified payload MUST still have the original authorized title
    expect(verified.title).toBe('Authorized Title');
    expect(verified.title).not.toBe('EVIL MUTATION');
  });
});
