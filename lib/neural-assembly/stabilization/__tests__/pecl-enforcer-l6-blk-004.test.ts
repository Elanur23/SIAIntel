/**
 * PECL_ENFORCER_L6_BLK_004.TEST.TS
 * L6-BLK-004: True Sink-Side Content Binding Tests
 */

import { verifyPECLAuthorization } from '../pecl-enforcer';
import { Ed25519Provider, EnvironmentKeyProvider, resetGlobalCryptoProvider, canonicalizeJSON } from '../crypto-provider';
import { extractClaimGraphMaterial, extractEvidenceLedgerMaterial, verifyClaimGraphDigest, verifyEvidenceLedgerDigest } from '../provenance-binder';
import crypto from 'crypto';

// Mock the config module to force ENFORCE mode
jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  PECL_DEPLOYMENT_MODE: 'ENFORCE'
}));

describe('PECL Enforcer - L6-BLK-004 Sink-Side Binding', () => {
  let provider: Ed25519Provider;
  let keyProvider: EnvironmentKeyProvider;
  let testPrivateKey: string;
  let testPublicKey: string;
  let testKeyId: string;

  const mockMic: any = {
    id: 'mic-123',
    truth_nucleus: { facts: [], claims: [], impact_analysis: '', geopolitical_context: '' },
    structural_atoms: { core_thesis: '', key_entities: [], temporal_markers: [], numerical_data: [] }
  };

  // Recompute REAL digests for the mock MIC to pass L6-BLK-002/003 checks
  const cgMaterial = extractClaimGraphMaterial(mockMic);
  const elMaterial = extractEvidenceLedgerMaterial(mockMic);
  const cgDigest = crypto.createHash('sha256').update(canonicalizeJSON(cgMaterial)).digest('hex');
  const elDigest = crypto.createHash('sha256').update(canonicalizeJSON(elMaterial)).digest('hex');

  const mockManifest: any = {
    payload_id: 'batch-123',
    manifest_id: 'man-456',
    manifest_version: "1.0.0",
    timestamp: new Date().toISOString(),
    base_language: "en",
    expected_languages: ['en'],
    content: {
      headlines: { en: 'Authorized Title' },
      slugs: { en: 'authorized-slug' },
      leads: { en: 'Authorized Lead' },
      bodies: { en: 'Authorized Body' },
      summaries: { en: 'Authorized Summary' },
    },
    intelligence: {
      claim_graph_hash: cgDigest,
      evidence_ledger_ref: elDigest,
      trust_score_upstream: 80,
    },
    metadata: {
      topic_sensitivity: "STANDARD",
      category: "ECONOMY",
      urgency: "STANDARD",
    }
  };

  const manifestHash = crypto.createHash('sha256').update(canonicalizeJSON(mockManifest)).digest('hex');

  beforeEach(() => {
    resetGlobalCryptoProvider();
    keyProvider = new EnvironmentKeyProvider();
    const keyPair = keyProvider.generateKeyPair();
    testPrivateKey = keyPair.privateKey.toString('base64');
    testPublicKey = keyPair.publicKey.toString('base64');
    testKeyId = 'test_key_l6_004';
    process.env[`PECL_PUBLIC_KEY_${testKeyId}`] = testPublicKey;
    resetGlobalCryptoProvider();
    provider = new Ed25519Provider(keyProvider);
  });

  afterEach(() => {
    delete process.env[`PECL_PUBLIC_KEY_${testKeyId}`];
    resetGlobalCryptoProvider();
  });

  function createEnvelope(overrides?: any) {
    const signedClaims = {
      payload_id: 'batch-123',
      manifest_hash: manifestHash,
      authorized_languages: ['en'],
      keyId: testKeyId,
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 30 * 60 * 1000,
      claimGraphDigest: cgDigest,
      evidenceLedgerDigest: elDigest,
      ...overrides
    };
    const signature = provider.sign(signedClaims, testPrivateKey);
    return { signedClaims, signature };
  }

  it('should PASS when manifest recomputation matches token hash', async () => {
    const envelope = createEnvelope();
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'test_sink',
      manifest: mockManifest,
      mic: mockMic
    });
    expect(result.valid).toBe(true);
  });

  it('should FAIL when manifest recomputation diverges from token hash', async () => {
    const envelope = createEnvelope();
    const tamperedManifest = { ...mockManifest, payload_id: 'TAMPERED' };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'test_sink',
      manifest: tamperedManifest,
      mic: mockMic
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SINK_SIDE_MANIFEST_HASH_MISMATCH');
  });

  it('should PASS when protocol projection (createNews) matches manifest', async () => {
    const envelope = createEnvelope();
    const newsPayload = {
      title: 'Authorized Title',
      slug: 'authorized-slug',
      content: 'Authorized Body',
      excerpt: 'Authorized Summary',
      language: 'en'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'createNews',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(newsPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(true);
  });

  it('should FAIL when protocol projection (createNews) content is tampered', async () => {
    const envelope = createEnvelope();
    const tamperedPayload = {
      title: 'TAMPERED TITLE',
      slug: 'authorized-slug',
      content: 'Authorized Body',
      excerpt: 'Authorized Summary',
      language: 'en'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'createNews',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(tamperedPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PROTOCOL_PROJECTION_MISMATCH');
    expect(result.error).toContain('Title mismatch');
  });

  it('should FAIL when protocol projection (createNews) slug is tampered', async () => {
    const envelope = createEnvelope();
    const tamperedPayload = {
      title: 'Authorized Title',
      slug: 'tampered-slug',
      content: 'Authorized Body',
      excerpt: 'Authorized Summary',
      language: 'en'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'createNews',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(tamperedPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PROTOCOL_PROJECTION_MISMATCH');
    expect(result.error).toContain('Slug mismatch');
  });

  it('should PASS when protocol projection (postTweet) matches manifest', async () => {
    const envelope = createEnvelope();
    const tweetPayload = {
      titleEn: 'Authorized Title',
      summaryEn: 'Authorized Summary',
      category: 'ECONOMY',
      articleUrl: 'https://siaintel.com/en/news/batch-123-authorized-slug'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'postTweet',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(tweetPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(true);
  });

  it('should FAIL when protocol projection (postTweet) URL is tampered', async () => {
    const envelope = createEnvelope();
    const tamperedPayload = {
      titleEn: 'Authorized Title',
      summaryEn: 'Authorized Summary',
      category: 'ECONOMY',
      articleUrl: 'https://malicious.com/fake-news'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'postTweet',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(tamperedPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Twitter URL mismatch');
  });

  it('should PASS when protocol projection (Google Indexing) matches manifest', async () => {
    const envelope = createEnvelope();
    const indexingPayload = {
      url: 'https://siaintel.com/en/news/batch-123-authorized-slug'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'notifyGoogleIndexingAPI',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(indexingPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(true);
  });

  it('should FAIL when protocol projection (Google Indexing) URL is tampered', async () => {
    const envelope = createEnvelope();
    const tamperedPayload = {
      url: 'https://siaintel.com/en/news/wrong-slug'
    };
    const result = await verifyPECLAuthorization(envelope, {
      sink_name: 'notifyGoogleIndexingAPI',
      manifest: mockManifest,
      expected_payload_raw: JSON.stringify(tamperedPayload),
      language: 'en',
      mic: mockMic
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PROTOCOL_PROJECTION_MISMATCH');
    expect(result.error).toContain('notifyGoogleIndexingAPI URL mismatch');
  });
});
