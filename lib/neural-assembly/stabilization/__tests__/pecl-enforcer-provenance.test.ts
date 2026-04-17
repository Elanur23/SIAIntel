/**
 * PECL_ENFORCER_PROVENANCE.TEST.TS
 * L6-BLK-002 & L6-BLK-003 Integration Tests
 * 
 * Proves provenance binding enforcement in the live PECL verification path.
 * Tests fail-closed behavior on missing, malformed, and mismatched provenance.
 */

import { verifyPECLAuthorization, SignedClaimsEnvelope } from '../pecl-enforcer';
import { Ed25519Provider, EnvironmentKeyProvider, resetGlobalCryptoProvider } from '../crypto-provider';
import { computeProvenanceDigests } from '../provenance-binder';
import { MasterIntelligenceCore } from '../../core-types';

// Mock the config module to force ENFORCE mode
jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  PECL_DEPLOYMENT_MODE: 'ENFORCE'
}));

describe('PECL Enforcer - Provenance Binding (L6-BLK-002 & L6-BLK-003)', () => {
  let provider: Ed25519Provider;
  let keyProvider: EnvironmentKeyProvider;
  let testPrivateKey: string;
  let testPublicKey: string;
  let testKeyId: string;
  let mockMIC: MasterIntelligenceCore;

  beforeEach(() => {
    resetGlobalCryptoProvider();
    
    // Generate test key pair
    keyProvider = new EnvironmentKeyProvider();
    const keyPair = keyProvider.generateKeyPair();
    
    testPrivateKey = keyPair.privateKey.toString('base64');
    testPublicKey = keyPair.publicKey.toString('base64');
    testKeyId = 'test_key_provenance';
    
    // Set environment variable for key provider
    process.env[`PECL_PUBLIC_KEY_${testKeyId}`] = testPublicKey;
    
    // Reset to pick up new key
    resetGlobalCryptoProvider();
    
    provider = new Ed25519Provider(keyProvider);
    
    // Create mock MIC
    mockMIC = {
      id: 'mic-test-001',
      version: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
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
            verification_status: 'verified'
          }
        ],
        impact_analysis: 'Test impact',
        geopolitical_context: 'Test context'
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
      }
    };
  });

  afterEach(() => {
    delete process.env[`PECL_PUBLIC_KEY_${testKeyId}`];
    resetGlobalCryptoProvider();
  });

  function createValidSignedEnvelopeWithProvenance(
    mic: MasterIntelligenceCore,
    overrides?: Partial<SignedClaimsEnvelope['signedClaims']>
  ): SignedClaimsEnvelope {
    const provenanceDigests = computeProvenanceDigests(mic);
    
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

  describe('Valid Provenance Pass', () => {
    it('should accept valid provenance with matching digests', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid provenance without manifest context', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Missing Provenance Material Fail', () => {
    it('should reject when MIC is not provided', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123'
        // mic is missing
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MISSING_PROVENANCE_MATERIAL');
    });
  });

  describe('Missing Claim Graph Digest Fail', () => {
    it('should reject envelope without claimGraphDigest', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      delete (envelope.signedClaims as any).claimGraphDigest;
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNED_CLAIMS_STRUCTURE');
    });
  });

  describe('Missing Evidence Ledger Digest Fail', () => {
    it('should reject envelope without evidenceLedgerDigest', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      delete (envelope.signedClaims as any).evidenceLedgerDigest;
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNED_CLAIMS_STRUCTURE');
    });
  });

  describe('Claim Graph Digest Mismatch Fail', () => {
    it('should reject when claim graph is tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with MIC claim graph
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        impact_analysis: 'Tampered impact analysis'
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CLAIM_GRAPH_DIGEST_MISMATCH');
    });

    it('should reject when facts are tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with facts
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          {
            id: 'fact-001',
            statement: 'Tampered fact statement',
            confidence: 0.95,
            sources: ['https://example.com/source1']
          }
        ]
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CLAIM_GRAPH_DIGEST_MISMATCH');
    });

    it('should reject when claims are tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with claims
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        claims: [
          {
            id: 'claim-001',
            statement: 'Tampered claim',
            verification_status: 'disputed'
          }
        ]
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CLAIM_GRAPH_DIGEST_MISMATCH');
    });

    it('should reject when claimGraphDigest is manually tampered in envelope', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      envelope.signedClaims.claimGraphDigest = 'tampered-digest-string';
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      // Signature will be invalid OR claim graph mismatch will be detected
      expect(result.error).toMatch(/INVALID_SIGNATURE|CLAIM_GRAPH_DIGEST_MISMATCH/);
    });
  });

  describe('Evidence Ledger Digest Mismatch Fail', () => {
    it('should reject when evidence sources are tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with evidence sources
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          {
            id: 'fact-001',
            statement: 'Test fact',
            confidence: 0.95,
            sources: ['https://tampered.com/source']
          }
        ]
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      // Both claim graph and evidence ledger will fail because facts are shared
      expect(result.error).toMatch(/CLAIM_GRAPH_DIGEST_MISMATCH|EVIDENCE_LEDGER_DIGEST_MISMATCH/);
    });

    it('should reject when verification status is tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with verification status
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        claims: [
          {
            id: 'claim-001',
            statement: 'Test claim',
            verification_status: 'unverified'
          }
        ]
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      // Both claim graph and evidence ledger will fail because claims are shared
      expect(result.error).toMatch(/CLAIM_GRAPH_DIGEST_MISMATCH|EVIDENCE_LEDGER_DIGEST_MISMATCH/);
    });

    it('should reject when evidenceLedgerDigest is manually tampered in envelope', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      envelope.signedClaims.evidenceLedgerDigest = 'tampered-digest-string';
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      // Signature will be invalid OR evidence ledger mismatch will be detected
      expect(result.error).toMatch(/INVALID_SIGNATURE|EVIDENCE_LEDGER_DIGEST_MISMATCH/);
    });
  });

  describe('Malformed Provenance Binding Fail', () => {
    it('should reject when malformed claimGraphDigest is provided', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC, {
        claimGraphDigest: ''
      });
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      // Will fail on structure validation or digest mismatch
      expect(result.error).toMatch(/INVALID_SIGNED_CLAIMS_STRUCTURE|CLAIM_GRAPH_DIGEST_MISMATCH|INVALID_SIGNATURE/);
    });

    it('should reject when malformed evidenceLedgerDigest is provided', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC, {
        evidenceLedgerDigest: ''
      });
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      // Will fail on structure validation or digest mismatch
      expect(result.error).toMatch(/INVALID_SIGNED_CLAIMS_STRUCTURE|EVIDENCE_LEDGER_DIGEST_MISMATCH|INVALID_SIGNATURE/);
    });
  });

  describe('Combined Provenance and Signature Verification', () => {
    it('should verify both signature and provenance for valid envelope', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(true);
    });

    it('should reject if signature is valid but provenance is tampered', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      
      // Tamper with MIC after signing
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        impact_analysis: 'Tampered after signing'
      };
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: tamperedMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CLAIM_GRAPH_DIGEST_MISMATCH');
    });

    it('should reject if provenance is valid but signature is invalid', async () => {
      const envelope = createValidSignedEnvelopeWithProvenance(mockMIC);
      envelope.signature = 'invalid-signature';
      
      const result = await verifyPECLAuthorization(envelope, {
        sink_name: 'test_sink',
        manifest_hash: 'hash-abc123',
        mic: mockMIC
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_SIGNATURE');
    });
  });
});

