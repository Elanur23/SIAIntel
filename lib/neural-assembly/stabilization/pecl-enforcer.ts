/**
 * PECL_ENFORCER.TS
 * Sovereign Pre-Publish Editorial Control - Strict Verifier
 *
 * Provides mandatory structural and cryptographic verification for
 * publication authorization. Replaces legacy string-based marker checks.
 * 
 * L6-BLK-001 REMEDIATION: Real Ed25519 asymmetric signature verification
 * over canonicalized signed claims object with all metadata inside signature boundary.
 */

import { PECLAuthorizationEnvelope, Language, MasterIntelligenceCore, LockedContentPackage } from '../core-types';
import { PECL_DEPLOYMENT_MODE } from './config';
import { getGlobalCryptoProvider, canonicalizeJSON } from './crypto-provider';
import { logOperation } from '../observability';
import crypto from 'crypto';
import {
  extractClaimGraphMaterial,
  extractEvidenceLedgerMaterial,
  verifyClaimGraphDigest,
  verifyEvidenceLedgerDigest
} from './provenance-binder';

export interface VerificationContext {
  sink_name: string;
  manifest_hash?: string;
  manifest?: LockedContentPackage; // L6-BLK-004: Manifest pre-image for recomputation
  expected_payload_raw?: string;   // L6-BLK-004: Frozen sink payload for projection check
  language?: Language;
  mic?: MasterIntelligenceCore;
}

export interface SignedClaimsEnvelope {
  signedClaims: {
    payload_id: string;
    manifest_hash: string;
    authorized_languages: Language[];
    keyId: string;
    algorithm: 'Ed25519';
    issuedAt: number;
    expiresAt: number;
    claimGraphDigest: string;
    evidenceLedgerDigest: string;
  };
  signature: string;
}

/**
 * Strict Authorization Verifier with Asymmetric Cryptography
 *
 * Fails closed in ENFORCE mode.
 * Rejects malformed, mismatched, expired, or cryptographically invalid authorization.
 * 
 * SECURITY GUARANTEES:
 * - All authorization metadata inside signed boundary
 * - Deterministic canonicalization prevents tampering
 * - Ed25519 signature verification
 * - Fail-closed on any verification failure
 */
export async function verifyPECLAuthorization(
  auth: any,
  context: VerificationContext
): Promise<{ valid: boolean; error?: string }> {
  const startTime = Date.now();
  
  if (PECL_DEPLOYMENT_MODE === 'OFF') {
    return { valid: true };
  }

  // Reject Null/Undefined/Empty
  if (!auth) {
    return fail("MISSING_AUTHORIZATION", context, startTime);
  }

  // Parse envelope
  let envelope: SignedClaimsEnvelope;
  try {
    envelope = typeof auth === 'string' ? JSON.parse(auth) : auth;
  } catch (e) {
    return fail("MALFORMED_AUTHORIZATION_ENVELOPE", context, startTime);
  }

  // Structural Validation - Signed Claims Object
  if (!envelope.signedClaims || !envelope.signature) {
    return fail("MISSING_SIGNED_CLAIMS_OR_SIGNATURE", context, startTime);
  }

  const { signedClaims, signature } = envelope;

  // Validate signed claims structure
  if (!signedClaims.payload_id || 
      !signedClaims.manifest_hash || 
      !signedClaims.authorized_languages ||
      !signedClaims.keyId ||
      !signedClaims.algorithm ||
      !signedClaims.issuedAt ||
      !signedClaims.expiresAt ||
      !signedClaims.claimGraphDigest ||
      !signedClaims.evidenceLedgerDigest) {
    return fail("INVALID_SIGNED_CLAIMS_STRUCTURE", context, startTime);
  }

  // Algorithm Validation
  if (signedClaims.algorithm !== 'Ed25519') {
    return fail(`UNSUPPORTED_ALGORITHM: ${signedClaims.algorithm}`, context, startTime);
  }

  // Expiry Verification (inside signed boundary)
  if (Date.now() > signedClaims.expiresAt) {
    return fail("AUTHORIZATION_EXPIRED", context, startTime, {
      expiresAt: signedClaims.expiresAt,
      now: Date.now()
    });
  }

  // IssuedAt Validation (prevent future-dated tokens)
  if (signedClaims.issuedAt > Date.now() + 60000) { // 1 minute clock skew tolerance
    return fail("AUTHORIZATION_ISSUED_IN_FUTURE", context, startTime, {
      issuedAt: signedClaims.issuedAt,
      now: Date.now()
    });
  }

  // Manifest Binding Verification (inside signed boundary)
  if (context.manifest_hash && signedClaims.manifest_hash !== context.manifest_hash) {
    return fail(`MANIFEST_MISMATCH: expected ${context.manifest_hash}, got ${signedClaims.manifest_hash}`, context, startTime);
  }

  // Scope Verification (inside signed boundary)
  if (context.language && !signedClaims.authorized_languages.includes(context.language)) {
    return fail(`UNAUTHORIZED_LANGUAGE: ${context.language} is not in authorized scope`, context, startTime);
  }

  // L6-BLK-004: TRUE SINK-SIDE CONTENT BINDING & RECOMPUTATION
  if (context.manifest) {
    const recomputedManifestHash = crypto.createHash('sha256')
      .update(canonicalizeJSON(context.manifest))
      .digest('hex');

    if (recomputedManifestHash !== signedClaims.manifest_hash) {
      return fail("SINK_SIDE_MANIFEST_HASH_MISMATCH", context, startTime, {
        recomputed: recomputedManifestHash,
        token_hash: signedClaims.manifest_hash
      });
    }

    // Protocol Projection Verification
    if (context.expected_payload_raw) {
      const projectionResult = verifyProtocolProjection(
        context.manifest,
        context.expected_payload_raw,
        context.sink_name,
        context.language
      );

      if (!projectionResult.valid) {
        return fail("PROTOCOL_PROJECTION_MISMATCH", context, startTime, {
          reason: projectionResult.error
        });
      }
    }
  }

  // Provenance Binding Verification (L6-BLK-002 & L6-BLK-003)
  if (context.mic) {
    // Recompute claim graph digest from authoritative raw material
    const claimGraph = extractClaimGraphMaterial(context.mic);
    const claimGraphValid = verifyClaimGraphDigest(claimGraph, signedClaims.claimGraphDigest);
    
    if (!claimGraphValid) {
      return fail("CLAIM_GRAPH_DIGEST_MISMATCH", context, startTime, {
        expected: signedClaims.claimGraphDigest,
        mic_id: context.mic.id
      });
    }
    
    // Recompute evidence ledger digest from authoritative raw material
    const evidenceLedger = extractEvidenceLedgerMaterial(context.mic);
    const evidenceLedgerValid = verifyEvidenceLedgerDigest(evidenceLedger, signedClaims.evidenceLedgerDigest);
    
    if (!evidenceLedgerValid) {
      return fail("EVIDENCE_LEDGER_DIGEST_MISMATCH", context, startTime, {
        expected: signedClaims.evidenceLedgerDigest,
        mic_id: context.mic.id
      });
    }
  } else {
    // MIC is required for provenance verification
    return fail("MISSING_PROVENANCE_MATERIAL", context, startTime, {
      reason: "MasterIntelligenceCore required for provenance verification"
    });
  }

  // Cryptographic Signature Verification
  const cryptoProvider = getGlobalCryptoProvider();
  let signatureValid = false;
  
  try {
    signatureValid = await cryptoProvider.verify(
      signedClaims,
      signature,
      signedClaims.keyId
    );
  } catch (error) {
    console.error('[PECL_ENFORCER] Signature verification error:', error);
    return fail("SIGNATURE_VERIFICATION_ERROR", context, startTime);
  }

  if (!signatureValid) {
    return fail("INVALID_SIGNATURE", context, startTime, {
      keyId: signedClaims.keyId,
      algorithm: signedClaims.algorithm
    });
  }

  // Success - Log telemetry
  const verificationTime = Date.now() - startTime;
  logOperation(
    "PECL_ENFORCER",
    "AUTHORIZATION_VERIFIED",
    "INFO",
    `Authorization verified successfully for ${context.sink_name}`,
    {
      metadata: {
        sink_name: context.sink_name,
        verification_result: "PASS",
        payload_id: signedClaims.payload_id,
        manifest_hash_prefix: signedClaims.manifest_hash.substring(0, 16),
        recomputed_hash_prefix: context.manifest ? crypto.createHash('sha256').update(canonicalizeJSON(context.manifest)).digest('hex').substring(0, 16) : signedClaims.manifest_hash.substring(0, 16),
        keyId: signedClaims.keyId,
        algorithm: signedClaims.algorithm,
        authorized_languages_count: signedClaims.authorized_languages.length,
        verification_time_ms: verificationTime,
        mode: PECL_DEPLOYMENT_MODE,
        timestamp: new Date().toISOString()
      }
    }
  );

  return { valid: true };
}

function fail(
  error: string, 
  context: VerificationContext, 
  startTime: number,
  metadata?: Record<string, any>
): { valid: boolean; error: string } {
  const reasonStr = metadata?.reason ? `: ${metadata.reason}` : '';
  const message = `[PECL_ENFORCER] Denied publish: ${error}${reasonStr}`;
  const verificationTime = Date.now() - startTime;
  
  // Log failure telemetry
  logOperation(
    "PECL_ENFORCER",
    "AUTHORIZATION_FAILED",
    PECL_DEPLOYMENT_MODE === 'ENFORCE' ? "ERROR" : "WARN",
    message,
    {
      metadata: {
        sink_name: context.sink_name,
        verification_result: "FAIL",
        verification_reason: error,
        manifest_hash_prefix: metadata?.token_hash?.substring(0, 16) || "N/A",
        recomputed_hash_prefix: metadata?.recomputed?.substring(0, 16) || "N/A",
        verification_time_ms: verificationTime,
        mode: PECL_DEPLOYMENT_MODE,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }
  );
  
  if (PECL_DEPLOYMENT_MODE === 'ENFORCE') {
    console.error(message);
    return { valid: false, error: message };
  } else {
    // SHADOW mode: log but don't block
    console.warn(`[PECL_SHADOW] Divergence detected: ${message}`);
    return { valid: true, error: '' };
  }
}

/**
 * L6-BLK-004: Protocol Projection Verifier
 *
 * Proves that the outgoing payload (e.g., Database JSON, Twitter JSON)
 * is a deterministic projection of the authorized manifest.
 */
function verifyProtocolProjection(
  manifest: LockedContentPackage,
  rawPayload: string,
  sink_name: string,
  language?: Language
): { valid: boolean; error?: string } {
  let payload: any;
  try {
    payload = JSON.parse(rawPayload);
  } catch (e) {
    return { valid: false, error: "MALFORMED_SINK_PAYLOAD" };
  }

  switch (sink_name) {
    case 'createNews':
      if (!language) return { valid: false, error: "createNews requires language" };

      // Verify title, slug, content (body), excerpt (summary)
      if (payload.title !== manifest.content.headlines[language]) {
        return { valid: false, error: `Title mismatch: payload="${payload.title}", manifest="${manifest.content.headlines[language]}"` };
      }
      if (payload.slug !== manifest.content.slugs[language]) {
        return { valid: false, error: `Slug mismatch: payload="${payload.slug}", manifest="${manifest.content.slugs[language]}"` };
      }
      if (payload.content !== manifest.content.bodies[language]) {
        return { valid: false, error: "Body content mismatch" };
      }
      if (payload.excerpt !== manifest.content.summaries[language]) {
        return { valid: false, error: "Summary excerpt mismatch" };
      }
      return { valid: true };

    case 'postTweet':
      // Verify titleEn, summaryEn, category
      if (payload.titleEn !== manifest.content.headlines['en']) {
        return { valid: false, error: "Twitter Title mismatch" };
      }
      if (payload.summaryEn !== manifest.content.summaries['en']) {
        return { valid: false, error: "Twitter Summary mismatch" };
      }
      if (payload.category !== manifest.metadata.category) {
        return { valid: false, error: "Twitter Category mismatch" };
      }
      // URL verification (derived from payload_id and slug)
      const expectedUrl = `https://siaintel.com/en/news/${manifest.payload_id}-${manifest.content.slugs['en']}`;
      if (payload.articleUrl && payload.articleUrl !== expectedUrl) {
        return { valid: false, error: "Twitter URL mismatch" };
      }
      return { valid: true };

    case 'notifyGoogleIndexingAPI':
    case 'notifyGoogleIndexing':
    case 'notifyIndexNow':
    case 'notifyBaidu':
      // Verify URL
      if (!language) return { valid: false, error: `${sink_name} requires language` };
      const expectedIdxUrl = `https://siaintel.com/${language}/news/${manifest.payload_id}-${manifest.content.slugs[language]}`;
      if (payload.url !== expectedIdxUrl) {
        return { valid: false, error: `${sink_name} URL mismatch` };
      }
      return { valid: true };

    case 'saveDecisionDNA':
      // For DNA, we verify that the manifest_hash in the payload matches the manifest
      const dnaHash = crypto.createHash('sha256').update(canonicalizeJSON(manifest)).digest('hex');
      if (payload.manifest_hash !== dnaHash) {
        return { valid: false, error: "DNA manifest_hash mismatch" };
      }
      return { valid: true };

    default:
      // If sink is unknown but manifest recomputation passed, we still have binding
      return { valid: true };
  }
}
