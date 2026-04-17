/**
 * SINK_VERIFIER.TEST.TS
 * L6-BLK-004: Complete Last-Mile Authorization Enforcement Tests
 * 
 * Proves complete authorization verification with fail-closed enforcement:
 * - Signature validity
 * - Token expiry
 * - Scope authorization
 * - Provenance binding
 * - Manifest hash binding
 * - Sink payload verification
 */

import { verifySinkPayload, extractManifestHash } from '../sink-verifier';
import { Ed25519Provider, EnvironmentKeyProvider, resetGlobalCryptoProvider } from '../crypto-provider';
import { computeProvenanceDigests } from '../provenance-binder';
import crypto from 'crypto';

// Mock the config module to force ENFORCE mode
jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  PECL_DEPLOYMENT_MODE: 'ENFORCE'
}));

describe('Sink Verifier - L6-BLK-004 Complete Authorization', () => {
  let provider: Ed25519Provider;
  let keyProvider: EnvironmentKeyProvider;
  let testPrivateKey: string;
  let testPublicKey: string;
  let testKeyId: string;

  beforeEach(() => {
    resetGlobalCryptoProvider();
    
    // Generate test key pair
    keyProvider = new EnvironmentKeyProvider();
    const keyPair = keyProvider.generateKeyPair();
    
    testPrivateKey = keyPair.privateKey.toString('base64');
    testPublicKey = keyPair.publicKey.toString('base64');
    testKeyId = 'test_key_sink';
    
    // Set environment variable for key provider
    process.env[`PECL_PUBLIC_KEY_${testKeyId}`] = testPublicKey;
    
    // Reset to pick up new key
    resetGlobalCryptoProvider();
    
    provider = new Ed25519Provider(keyProvider);
  });

  afterEach(() => {
    delete process.env[`PECL_PUBLIC_KEY_${testKeyId}`];
    resetGlobalCryptoProvider();
  });

  function createSignedToken(payload: any, manifestHash: string, options?: {
    expired?: boolean;
    futureIssued?: boolean;
    wrongSignature?: boolean;
    missingProvenance?: boolean;
    micOverride?: ReturnType<typeof createMockMIC>;
  }): string {
    const activeMIC = options?.micOverride ?? createMockMIC();
    const provenanceDigests = computeProvenanceDigests(activeMIC as any);

    const now = Date.now();
    const signedClaims = {
      payload_id: 'test-payload-001',
      manifest_hash: manifestHash,
      authorized_languages: ['en', 'tr'],
      keyId: testKeyId,
      algorithm: 'Ed25519' as const,
      issuedAt: options?.futureIssued ? now + 120000 : now - 1000,
      expiresAt: options?.expired ? now - 1000 : now + 30 * 60 * 1000,
      claimGraphDigest: options?.missingProvenance ? '' : provenanceDigests.claimGraphDigest,
      evidenceLedgerDigest: options?.missingProvenance ? '' : provenanceDigests.evidenceLedgerDigest
    };
    
    const signature = options?.wrongSignature 
      ? 'invalid-signature-base64'
      : provider.sign(signedClaims, testPrivateKey);
    
    return JSON.stringify({
      signedClaims,
      signature
    });
  }

  function createMockMIC() {
    return {
      id: 'mic-test-001',
      version: 1,
      truth_nucleus: {
        facts: [
          {
            id: 'fact-001',
            statement: 'Test fact',
            confidence: 0.95,
            sources: ['https://example.com/source1']
          }
        ],
        claims: [
          {
            id: 'claim-001',
            statement: 'Test claim',
            verification_status: 'verified' as const
          }
        ],
        impact_analysis: 'Test impact analysis',
        geopolitical_context: 'Test geopolitical context'
      },
      structural_atoms: {
        core_thesis: 'Test thesis',
        key_entities: ['Entity1'],
        temporal_markers: ['2026'],
        numerical_data: []
      },
      metadata: {
        category: 'Test',
        urgency: 'standard',
        target_regions: ['US']
      },
      created_at: Date.now(),
      updated_at: Date.now()
    };
  }

  describe('Complete Authorization Pass', () => {
    it('should accept valid authorization with all checks passing', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        payload_id: 'test-payload-001',
        trace_id: 'trace-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash);
      const mic = createMockMIC();
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload,
        mic,
        language: 'en'
      });
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.frozen_payload).toBeDefined();
    });
  });

  describe('Signature Verification Failures', () => {
    it('should reject invalid signature', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash, { wrongSignature: true });
      const mic = createMockMIC();
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload,
        mic
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });

  describe('Expiry Verification Failures', () => {
    it('should reject expired token', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash, { expired: true });
      const mic = createMockMIC();
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload,
        mic
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTHORIZATION_EXPIRED');
    });

    it('should reject future-issued token', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash, { futureIssued: true });
      const mic = createMockMIC();
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload,
        mic
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTHORIZATION_ISSUED_IN_FUTURE');
    });
  });

  describe('Scope Verification Failures', () => {
    it('should reject unauthorized language', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash);
      const mic = createMockMIC();
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload,
        mic,
        language: 'de' // Not in authorized_languages
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('UNAUTHORIZED_LANGUAGE');
    });
  });

  describe('Provenance Verification Failures', () => {
    it('should reject missing MIC provenance material', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const sinkPayload = {
        audit_id: 'audit-001',
        data: { test: 'value' }
      };
      
      const canonical = canonicalizeJSON(sinkPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(sinkPayload, manifestHash);
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload
        // mic missing
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_PROVENANCE_MATERIAL');
    });
  });

  describe('Sink Payload Tamper Fail', () => {
    it('should reject tampered sink payload', async () => {
      const { canonicalizeJSON } = require('../crypto-provider');
      
      const originalPayload = {
        audit_id: 'audit-001',
        payload_id: 'test-payload-001',
        data: { test: 'original' }
      };
      
      const canonical = canonicalizeJSON(originalPayload);
      const manifestHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      
      const p2p_token = createSignedToken(originalPayload, manifestHash);
      const mic = createMockMIC();
      
      // Tamper with payload after token creation
      const tamperedPayload = {
        audit_id: 'audit-001',
        payload_id: 'test-payload-001',
        data: { test: 'tampered' }
      };
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: tamperedPayload,
        mic
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('SINK_PAYLOAD_HASH_MISMATCH');
    });
  });

  describe('Missing Manifest Hash Fail', () => {
    it('should reject token without manifest_hash', async () => {
      const sinkPayload = {
        id: 'batch-001',
        data: 'test'
      };
      
      const signedClaims = {
        payload_id: 'test-payload-001',
        // manifest_hash missing
        authorized_languages: ['en'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        claimGraphDigest: 'test',
        evidenceLedgerDigest: 'test'
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      const p2p_token = JSON.stringify({
        signedClaims,
        signature
      });
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: sinkPayload
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing manifest_hash');
    });
  });

  describe('Malformed Payload Fail', () => {
    it('should reject malformed P2P token', async () => {
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token: 'not-valid-json',
        payload: { test: 'data' }
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Malformed P2P token');
    });

    it('should reject token without signedClaims', async () => {
      const p2p_token = JSON.stringify({
        signature: 'some-signature'
      });
      
      const result = await verifySinkPayload({
        sink_name: 'testSink',
        p2p_token,
        payload: { test: 'data' }
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing signedClaims or signature');
    });
  });

  describe('Extract Manifest Hash Utility', () => {
    it('should extract manifest hash from valid token', () => {
      const manifestHash = 'test-manifest-hash-123';
      const p2p_token = createSignedToken({}, manifestHash);
      
      const extracted = extractManifestHash(p2p_token);
      
      expect(extracted).toBe(manifestHash);
    });

    it('should return null for invalid token', () => {
      const extracted = extractManifestHash('invalid-token');
      
      expect(extracted).toBeNull();
    });
  });
});
