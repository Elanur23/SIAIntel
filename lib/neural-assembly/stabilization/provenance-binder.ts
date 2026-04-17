/**
 * PROVENANCE_BINDER.TS
 * Cryptographic Provenance Binding for Claim Graph and Evidence Ledger
 * 
 * L6-BLK-002 & L6-BLK-003 REMEDIATION:
 * Implements deterministic canonicalization and hashing of raw provenance material
 * to create tamper-evident bindings inside the signed authorization boundary.
 * 
 * SECURITY GUARANTEES:
 * - Deterministic canonicalization of claim graph and evidence ledger
 * - SHA-256 cryptographic hashing
 * - Recomputation from authoritative raw material at verification time
 * - Fail-closed on missing, malformed, or mismatched provenance
 */

import crypto from 'crypto';
import { canonicalizeJSON } from './crypto-provider';
import { MasterIntelligenceCore } from '../core-types';

export interface ClaimGraphMaterial {
  facts: Array<{
    id: string;
    statement: string;
    confidence: number;
    sources: string[];
  }>;
  claims: Array<{
    id: string;
    statement: string;
    verification_status: 'verified' | 'unverified' | 'disputed';
  }>;
  impact_analysis: string;
  geopolitical_context: string;
}

export interface EvidenceLedgerMaterial {
  facts: Array<{
    id: string;
    sources: string[];
  }>;
  claims: Array<{
    id: string;
    verification_status: 'verified' | 'unverified' | 'disputed';
  }>;
}

export interface ProvenanceDigests {
  claimGraphDigest: string;
  evidenceLedgerDigest: string;
}

export function extractClaimGraphMaterial(mic: MasterIntelligenceCore): ClaimGraphMaterial {
  return {
    facts: mic.truth_nucleus.facts.map(f => ({
      id: f.id,
      statement: f.statement,
      confidence: f.confidence,
      sources: f.sources
    })),
    claims: mic.truth_nucleus.claims.map(c => ({
      id: c.id,
      statement: c.statement,
      verification_status: c.verification_status
    })),
    impact_analysis: mic.truth_nucleus.impact_analysis,
    geopolitical_context: mic.truth_nucleus.geopolitical_context
  };
}

export function extractEvidenceLedgerMaterial(mic: MasterIntelligenceCore): EvidenceLedgerMaterial {
  return {
    facts: mic.truth_nucleus.facts.map(f => ({
      id: f.id,
      sources: f.sources
    })),
    claims: mic.truth_nucleus.claims.map(c => ({
      id: c.id,
      verification_status: c.verification_status
    }))
  };
}

export function computeClaimGraphDigest(claimGraph: ClaimGraphMaterial): string {
  const canonical = canonicalizeJSON(claimGraph);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function computeEvidenceLedgerDigest(evidenceLedger: EvidenceLedgerMaterial): string {
  const canonical = canonicalizeJSON(evidenceLedger);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function computeProvenanceDigests(mic: MasterIntelligenceCore): ProvenanceDigests {
  const claimGraph = extractClaimGraphMaterial(mic);
  const evidenceLedger = extractEvidenceLedgerMaterial(mic);
  
  return {
    claimGraphDigest: computeClaimGraphDigest(claimGraph),
    evidenceLedgerDigest: computeEvidenceLedgerDigest(evidenceLedger)
  };
}

export function verifyClaimGraphDigest(
  claimGraph: ClaimGraphMaterial,
  expectedDigest: string
): boolean {
  const recomputedDigest = computeClaimGraphDigest(claimGraph);
  return recomputedDigest === expectedDigest;
}

export function verifyEvidenceLedgerDigest(
  evidenceLedger: EvidenceLedgerMaterial,
  expectedDigest: string
): boolean {
  const recomputedDigest = computeEvidenceLedgerDigest(evidenceLedger);
  return recomputedDigest === expectedDigest;
}

export function verifyProvenanceDigests(
  mic: MasterIntelligenceCore,
  expectedDigests: ProvenanceDigests
): { claimGraphValid: boolean; evidenceLedgerValid: boolean } {
  const claimGraph = extractClaimGraphMaterial(mic);
  const evidenceLedger = extractEvidenceLedgerMaterial(mic);
  
  return {
    claimGraphValid: verifyClaimGraphDigest(claimGraph, expectedDigests.claimGraphDigest),
    evidenceLedgerValid: verifyEvidenceLedgerDigest(evidenceLedger, expectedDigests.evidenceLedgerDigest)
  };
}
