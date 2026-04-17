/**
 * PECL_ENFORCER_L6.TEST.TS
 * L6-BLK-001 Remediation Tests
 * 
 * Proves real asymmetric signature verification with fail-closed behavior.
 * Tests all metadata tampering scenarios to prove signed boundary integrity.
 */

import { verifyPECLAuthorization, SignedClaimsEnvelope } from '../pecl-enforcer';
import { Ed25519Provider, EnvironmentKeyProvider, resetGlobalCryptoProvider } from '../crypto-provider';
import { computeProvenanceDigests } from '../provenance-binder';

// Mock the config module to force ENFORCE mode
jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  PECL_DEPLOYMENT_MODE: 'ENFORCE'
}));

describe('PECL Enforcer - L6-BLK-001 Asymmetric Verification', () => {
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
    testKeyId = 'test_key_l6';
    
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

  function createValidSignedEnvelope(overrides?: Partial<SignedClaimsEnvelope['signedClaims']>): SignedClaimsEnvelope {
    const provenanceDigests = computeProvenanceDigests(mockMic as any);

    const signedClaims = {
      payload_id: 'batch-test-123',
      manifest_hash: 'hash-abc123',
      authorized_languages: ['en', 'tr', 'de'] as any[],
      keyId: testKeyId,
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 30 * 60 * 1000,
      claimGraphDigest: provenanceDigests.claimGraphDigest,
      evidenceLedgerDigest: provenanceDigests.evidenceLedgerDigest,
      ...overrides
    };
    
    const signature = provider.sign(signedClaims, testPrivateKey);
    
    return {
      signedClaims,
      signature
    };
  }

  const mockMic: any = {
    id: 'mic-123',
    truth_nucleus: {
      facts: [{ id: 'f1', statement: 'fact 1', confidence: 0.9, sources: [] }],
      claims: [],
      impact_analysis: 'low',
      geopolitical_context: 'none'
    },
    structural_atoms: {
      core_thesis: 'thesis',
      key_entities: ['entity'],
      temporal_markers: [],
      numerical_data: []
    }
  };

  function createVerificationContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sink_name: 'test_sink',
      manifest_hash: 'hash-abc123',
      mic: mockMic,
      ...overrides
    };
  }

  describe('Valid Signed Claims Pass', () => {
    it('should accept valid signed claims with correct signature', async () => {
      const envelope = createValidSignedEnvelope();
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid signed claims without manifest context', async () => {
      const envelope = createValidSignedEnvelope();
      
      const result = await verifyPECLAuthorization(
        envelope,
        createVerificationContext({ manifest_hash: undefined })
      );
      
      expect(result.valid).toBe(true);
    });

    it('should accept valid signed claims with language scope check', async () => {
      const envelope = createValidSignedEnvelope();
      
      const result = await verifyPECLAuthorization(
        envelope,
        createVerificationContext({ language: 'en' as any })
      );
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Signature Fail', () => {
    it('should reject envelope with invalid signature', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signature = 'aW52YWxpZHNpZ25hdHVyZQ==';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });

    it('should reject envelope with corrupted signature', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signature = envelope.signature.slice(0, -5) + 'XXXXX';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });

  describe('Unknown Key ID Fail', () => {
    it('should reject envelope with unknown key id', async () => {
      const envelope = createValidSignedEnvelope({ keyId: 'unknown_key_999' });
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });

  describe('Missing Signature Fail', () => {
    it('should reject envelope without signature', async () => {
      const envelope = createValidSignedEnvelope();
      delete (envelope as any).signature;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_SIGNED_CLAIMS_OR_SIGNATURE');
    });

    it('should reject envelope without signedClaims', async () => {
      const envelope = createValidSignedEnvelope();
      delete (envelope as any).signedClaims;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_SIGNED_CLAIMS_OR_SIGNATURE');
    });
  });

  describe('Expired Envelope Fail', () => {
    it('should reject expired envelope', async () => {
      const envelope = createValidSignedEnvelope({
        issuedAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000
      });
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTHORIZATION_EXPIRED');
    });
  });

  describe('Malformed Envelope Fail', () => {
    it('should reject null authorization', async () => {
      const result = await verifyPECLAuthorization(null, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_AUTHORIZATION');
    });

    it('should reject undefined authorization', async () => {
      const result = await verifyPECLAuthorization(undefined, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_AUTHORIZATION');
    });

    it('should reject malformed JSON string', async () => {
      const result = await verifyPECLAuthorization('{ invalid json', createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MALFORMED_AUTHORIZATION_ENVELOPE');
    });

    it('should reject envelope with missing payload_id', async () => {
      const envelope = createValidSignedEnvelope();
      delete (envelope.signedClaims as any).payload_id;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNED_CLAIMS_STRUCTURE');
    });

    it('should reject envelope with missing manifest_hash', async () => {
      const envelope = createValidSignedEnvelope();
      delete (envelope.signedClaims as any).manifest_hash;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNED_CLAIMS_STRUCTURE');
    });
  });

  describe('Unsupported Algorithm Fail', () => {
    it('should reject envelope with unsupported algorithm', async () => {
      const envelope = createValidSignedEnvelope({ algorithm: 'HS256' as any });
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('UNSUPPORTED_ALGORITHM');
    });
  });

  describe('Payload Tamper Fail', () => {
    it('should reject envelope with tampered payload_id', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.payload_id = 'tampered-batch-999';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });

    it('should reject envelope with tampered manifest_hash', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.manifest_hash = 'tampered-hash-xyz';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      // Manifest mismatch is detected before signature verification
      expect(result.error).toMatch(/MANIFEST_MISMATCH|INVALID_SIGNATURE/);
    });
  });

  describe('IssuedAt Tamper Fail', () => {
    it('should reject envelope with tampered issuedAt', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.issuedAt = Date.now() - 999999;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });

    it('should reject envelope with future issuedAt', async () => {
      const envelope = createValidSignedEnvelope({
        issuedAt: Date.now() + 120000 // 2 minutes in future
      });
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTHORIZATION_ISSUED_IN_FUTURE');
    });
  });

  describe('ExpiresAt Tamper Fail', () => {
    it('should reject envelope with tampered expiresAt (extended)', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.expiresAt = Date.now() + 999999999;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });

  describe('KeyId Tamper Fail', () => {
    it('should reject envelope with tampered keyId', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.keyId = 'different_key_id';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });

  describe('Algorithm Tamper Fail', () => {
    it('should reject envelope with tampered algorithm', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signedClaims.algorithm = 'RSA' as any;
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('UNSUPPORTED_ALGORITHM');
    });
  });

  describe('Manifest Mismatch Fail', () => {
    it('should reject envelope with manifest mismatch', async () => {
      const envelope = createValidSignedEnvelope({ manifest_hash: 'hash-abc123' });
      
      const result = await verifyPECLAuthorization(
        envelope,
        createVerificationContext({ manifest_hash: 'hash-different' })
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MANIFEST_MISMATCH');
    });
  });

  describe('Unauthorized Language Fail', () => {
    it('should reject envelope with unauthorized language', async () => {
      const envelope = createValidSignedEnvelope({
        authorized_languages: ['en', 'tr']
      });
      
      const result = await verifyPECLAuthorization(
        envelope,
        createVerificationContext({ language: 'de' as any })
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('UNAUTHORIZED_LANGUAGE');
    });
  });

  describe('Helper Semantics', () => {
    it('should pass verification for valid envelope', async () => {
      const envelope = createValidSignedEnvelope();
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(true);
    });

    it('should fail verification for invalid envelope', async () => {
      const envelope = createValidSignedEnvelope();
      envelope.signature = 'invalid';
      
      const result = await verifyPECLAuthorization(envelope, createVerificationContext());
      
      expect(result.valid).toBe(false);
    });
  });
});
