/**
 * PROVENANCE_BINDER.TEST.TS
 * L6-BLK-002 & L6-BLK-003 Remediation Tests
 * 
 * Proves real cryptographic provenance binding with deterministic canonicalization
 * and SHA-256 hashing of claim graph and evidence ledger material.
 */

import {
  extractClaimGraphMaterial,
  extractEvidenceLedgerMaterial,
  computeClaimGraphDigest,
  computeEvidenceLedgerDigest,
  computeProvenanceDigests,
  verifyClaimGraphDigest,
  verifyEvidenceLedgerDigest,
  verifyProvenanceDigests
} from '../provenance-binder';
import { MasterIntelligenceCore } from '../../core-types';

describe('Provenance Binder - L6-BLK-002 & L6-BLK-003', () => {
  const mockMIC: MasterIntelligenceCore = {
    id: 'mic-test-001',
    version: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    truth_nucleus: {
      facts: [
        {
          id: 'fact-001',
          statement: 'Bitcoin price reached $67,500',
          confidence: 0.95,
          sources: ['https://example.com/source1', 'https://example.com/source2']
        },
        {
          id: 'fact-002',
          statement: 'Trading volume increased 25%',
          confidence: 0.88,
          sources: ['https://example.com/source3']
        }
      ],
      claims: [
        {
          id: 'claim-001',
          statement: 'Institutional buying pressure drove the rally',
          verification_status: 'verified'
        },
        {
          id: 'claim-002',
          statement: 'Retail participation remains low',
          verification_status: 'unverified'
        }
      ],
      impact_analysis: 'Significant market movement with institutional participation',
      geopolitical_context: 'US regulatory clarity improving'
    },
    structural_atoms: {
      core_thesis: 'Bitcoin rally driven by institutional demand',
      key_entities: ['Bitcoin', 'Institutional Investors', 'Exchanges'],
      temporal_markers: ['March 2026', 'Q1 2026'],
      numerical_data: [
        { value: 67500, unit: 'USD', context: 'Bitcoin price' },
        { value: 25, unit: 'percent', context: 'Volume increase' }
      ]
    },
    metadata: {
      category: 'Cryptocurrency',
      urgency: 'breaking',
      target_regions: ['US', 'EU', 'ASIA']
    }
  };

  describe('Claim Graph Extraction', () => {
    it('should extract claim graph material from MIC', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      
      expect(claimGraph.facts).toHaveLength(2);
      expect(claimGraph.claims).toHaveLength(2);
      expect(claimGraph.impact_analysis).toBe('Significant market movement with institutional participation');
      expect(claimGraph.geopolitical_context).toBe('US regulatory clarity improving');
    });

    it('should include all required fields in claim graph', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      
      expect(claimGraph.facts[0]).toHaveProperty('id');
      expect(claimGraph.facts[0]).toHaveProperty('statement');
      expect(claimGraph.facts[0]).toHaveProperty('confidence');
      expect(claimGraph.facts[0]).toHaveProperty('sources');
      
      expect(claimGraph.claims[0]).toHaveProperty('id');
      expect(claimGraph.claims[0]).toHaveProperty('statement');
      expect(claimGraph.claims[0]).toHaveProperty('verification_status');
    });
  });

  describe('Evidence Ledger Extraction', () => {
    it('should extract evidence ledger material from MIC', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      
      expect(evidenceLedger.facts).toHaveLength(2);
      expect(evidenceLedger.claims).toHaveLength(2);
    });

    it('should include only evidence-relevant fields', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      
      expect(evidenceLedger.facts[0]).toHaveProperty('id');
      expect(evidenceLedger.facts[0]).toHaveProperty('sources');
      expect(evidenceLedger.facts[0]).not.toHaveProperty('statement');
      expect(evidenceLedger.facts[0]).not.toHaveProperty('confidence');
      
      expect(evidenceLedger.claims[0]).toHaveProperty('id');
      expect(evidenceLedger.claims[0]).toHaveProperty('verification_status');
      expect(evidenceLedger.claims[0]).not.toHaveProperty('statement');
    });
  });

  describe('Claim Graph Digest Computation', () => {
    it('should compute deterministic SHA-256 digest', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      const digest1 = computeClaimGraphDigest(claimGraph);
      const digest2 = computeClaimGraphDigest(claimGraph);
      
      expect(digest1).toBe(digest2);
      expect(digest1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it('should produce different digests for different claim graphs', () => {
      const claimGraph1 = extractClaimGraphMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        impact_analysis: 'Different analysis'
      };
      const claimGraph2 = extractClaimGraphMaterial(modifiedMIC);
      
      const digest1 = computeClaimGraphDigest(claimGraph1);
      const digest2 = computeClaimGraphDigest(claimGraph2);
      
      expect(digest1).not.toBe(digest2);
    });

    it('should be sensitive to fact tampering', () => {
      const claimGraph1 = extractClaimGraphMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          ...mockMIC.truth_nucleus.facts,
          {
            id: 'fact-003',
            statement: 'Tampered fact',
            confidence: 0.5,
            sources: []
          }
        ]
      };
      const claimGraph2 = extractClaimGraphMaterial(modifiedMIC);
      
      const digest1 = computeClaimGraphDigest(claimGraph1);
      const digest2 = computeClaimGraphDigest(claimGraph2);
      
      expect(digest1).not.toBe(digest2);
    });

    it('should be sensitive to claim tampering', () => {
      const claimGraph1 = extractClaimGraphMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        claims: [
          {
            id: 'claim-001',
            statement: 'Tampered claim',
            verification_status: 'disputed'
          }
        ]
      };
      const claimGraph2 = extractClaimGraphMaterial(modifiedMIC);
      
      const digest1 = computeClaimGraphDigest(claimGraph1);
      const digest2 = computeClaimGraphDigest(claimGraph2);
      
      expect(digest1).not.toBe(digest2);
    });
  });

  describe('Evidence Ledger Digest Computation', () => {
    it('should compute deterministic SHA-256 digest', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      const digest1 = computeEvidenceLedgerDigest(evidenceLedger);
      const digest2 = computeEvidenceLedgerDigest(evidenceLedger);
      
      expect(digest1).toBe(digest2);
      expect(digest1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it('should produce different digests for different evidence ledgers', () => {
      const evidenceLedger1 = extractEvidenceLedgerMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          {
            id: 'fact-001',
            statement: 'Bitcoin price reached $67,500',
            confidence: 0.95,
            sources: ['https://example.com/different-source']
          }
        ]
      };
      const evidenceLedger2 = extractEvidenceLedgerMaterial(modifiedMIC);
      
      const digest1 = computeEvidenceLedgerDigest(evidenceLedger1);
      const digest2 = computeEvidenceLedgerDigest(evidenceLedger2);
      
      expect(digest1).not.toBe(digest2);
    });

    it('should be sensitive to source tampering', () => {
      const evidenceLedger1 = extractEvidenceLedgerMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          {
            ...mockMIC.truth_nucleus.facts[0],
            sources: ['https://example.com/tampered-source']
          },
          ...mockMIC.truth_nucleus.facts.slice(1)
        ]
      };
      const evidenceLedger2 = extractEvidenceLedgerMaterial(modifiedMIC);
      
      const digest1 = computeEvidenceLedgerDigest(evidenceLedger1);
      const digest2 = computeEvidenceLedgerDigest(evidenceLedger2);
      
      expect(digest1).not.toBe(digest2);
    });

    it('should be sensitive to verification status tampering', () => {
      const evidenceLedger1 = extractEvidenceLedgerMaterial(mockMIC);
      
      const modifiedMIC = { ...mockMIC };
      modifiedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        claims: [
          {
            ...mockMIC.truth_nucleus.claims[0],
            verification_status: 'disputed'
          },
          ...mockMIC.truth_nucleus.claims.slice(1)
        ]
      };
      const evidenceLedger2 = extractEvidenceLedgerMaterial(modifiedMIC);
      
      const digest1 = computeEvidenceLedgerDigest(evidenceLedger1);
      const digest2 = computeEvidenceLedgerDigest(evidenceLedger2);
      
      expect(digest1).not.toBe(digest2);
    });
  });

  describe('Combined Provenance Digest Computation', () => {
    it('should compute both digests from MIC', () => {
      const digests = computeProvenanceDigests(mockMIC);
      
      expect(digests).toHaveProperty('claimGraphDigest');
      expect(digests).toHaveProperty('evidenceLedgerDigest');
      expect(digests.claimGraphDigest).toMatch(/^[a-f0-9]{64}$/);
      expect(digests.evidenceLedgerDigest).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different digests for claim graph and evidence ledger', () => {
      const digests = computeProvenanceDigests(mockMIC);
      
      expect(digests.claimGraphDigest).not.toBe(digests.evidenceLedgerDigest);
    });
  });

  describe('Claim Graph Digest Verification', () => {
    it('should verify valid claim graph digest', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      const expectedDigest = computeClaimGraphDigest(claimGraph);
      
      const valid = verifyClaimGraphDigest(claimGraph, expectedDigest);
      
      expect(valid).toBe(true);
    });

    it('should reject tampered claim graph', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      const expectedDigest = computeClaimGraphDigest(claimGraph);
      
      // Tamper with claim graph
      claimGraph.impact_analysis = 'Tampered analysis';
      
      const valid = verifyClaimGraphDigest(claimGraph, expectedDigest);
      
      expect(valid).toBe(false);
    });

    it('should reject invalid digest', () => {
      const claimGraph = extractClaimGraphMaterial(mockMIC);
      const invalidDigest = 'invalid-digest-string';
      
      const valid = verifyClaimGraphDigest(claimGraph, invalidDigest);
      
      expect(valid).toBe(false);
    });
  });

  describe('Evidence Ledger Digest Verification', () => {
    it('should verify valid evidence ledger digest', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      const expectedDigest = computeEvidenceLedgerDigest(evidenceLedger);
      
      const valid = verifyEvidenceLedgerDigest(evidenceLedger, expectedDigest);
      
      expect(valid).toBe(true);
    });

    it('should reject tampered evidence ledger', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      const expectedDigest = computeEvidenceLedgerDigest(evidenceLedger);
      
      // Tamper with evidence ledger
      evidenceLedger.facts[0].sources = ['https://example.com/tampered'];
      
      const valid = verifyEvidenceLedgerDigest(evidenceLedger, expectedDigest);
      
      expect(valid).toBe(false);
    });

    it('should reject invalid digest', () => {
      const evidenceLedger = extractEvidenceLedgerMaterial(mockMIC);
      const invalidDigest = 'invalid-digest-string';
      
      const valid = verifyEvidenceLedgerDigest(evidenceLedger, invalidDigest);
      
      expect(valid).toBe(false);
    });
  });

  describe('Combined Provenance Verification', () => {
    it('should verify both valid digests', () => {
      const expectedDigests = computeProvenanceDigests(mockMIC);
      
      const result = verifyProvenanceDigests(mockMIC, expectedDigests);
      
      expect(result.claimGraphValid).toBe(true);
      expect(result.evidenceLedgerValid).toBe(true);
    });

    it('should detect claim graph tampering', () => {
      const expectedDigests = computeProvenanceDigests(mockMIC);
      
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        impact_analysis: 'Tampered'
      };
      
      const result = verifyProvenanceDigests(tamperedMIC, expectedDigests);
      
      expect(result.claimGraphValid).toBe(false);
      expect(result.evidenceLedgerValid).toBe(true);
    });

    it('should detect evidence ledger tampering', () => {
      const expectedDigests = computeProvenanceDigests(mockMIC);
      
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        facts: [
          {
            ...mockMIC.truth_nucleus.facts[0],
            sources: ['https://tampered.com']
          },
          ...mockMIC.truth_nucleus.facts.slice(1)
        ]
      };
      
      const result = verifyProvenanceDigests(tamperedMIC, expectedDigests);
      
      // Both will fail because facts are shared between claim graph and evidence ledger
      expect(result.claimGraphValid).toBe(false);
      expect(result.evidenceLedgerValid).toBe(false);
    });

    it('should detect both tampering', () => {
      const expectedDigests = computeProvenanceDigests(mockMIC);
      
      const tamperedMIC = { ...mockMIC };
      tamperedMIC.truth_nucleus = {
        ...mockMIC.truth_nucleus,
        impact_analysis: 'Tampered',
        facts: [
          {
            ...mockMIC.truth_nucleus.facts[0],
            sources: ['https://tampered.com']
          },
          ...mockMIC.truth_nucleus.facts.slice(1)
        ]
      };
      
      const result = verifyProvenanceDigests(tamperedMIC, expectedDigests);
      
      expect(result.claimGraphValid).toBe(false);
      expect(result.evidenceLedgerValid).toBe(false);
    });
  });
});

