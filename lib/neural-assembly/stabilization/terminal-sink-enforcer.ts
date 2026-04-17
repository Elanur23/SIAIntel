/**
 * TERMINAL_SINK_ENFORCER.TS
 * Final-Mile Integrity Architecture for Sovereign Neural Assembly
 *
 * This architecture replaces all fragmented verification helpers with a single
 * mandatory gate that guarantees cryptographic validity, time-validity,
 * scope-validity, and content-binding before ANY protected I/O.
 *
 * SECURITY PROPERTIES:
 * 1. MANDATORY: All protected sinks MUST call enforceSinkGate.
 * 2. HOLISTIC: Verifies Signature, Expiry, Scope, Provenance, and Hash.
 * 3. ANTI-TOCTOU: Serializes input payload to an immutable buffer BEFORE verification.
 * 4. DETERMINISTIC: Uses RFC 8785 (JCS) principles and NFC normalization.
 * 5. FAIL-CLOSED: Any mismatch or invalidity results in a terminal exception.
 */

import crypto from 'crypto';
import {
  Language,
  LockedContentPackage,
  MasterIntelligenceCore
} from '../core-types';
import { PECL_DEPLOYMENT_MODE } from './config';
import { getGlobalCryptoProvider, canonicalizeJSON } from './crypto-provider';
import { logOperation } from '../observability';
import {
  extractClaimGraphMaterial,
  extractEvidenceLedgerMaterial,
  verifyClaimGraphDigest,
  verifyEvidenceLedgerDigest
} from './provenance-binder';

/**
 * Explicit Sink Names for Scope Enforcement
 */
export type ProtectedSinkName =
  | 'createNews'               // Database Content Persistence
  | 'saveBatch'                // Batch Job State Persistence
  | 'saveDecisionDNA'          // Audit/DNA Persistence
  | 'postTweet'                // Twitter/X Publication
  | 'notifyGoogleIndexingAPI'  // Google Search Indexing
  | 'notifyGoogleIndexing'     // Alternative Google Indexing
  | 'notifyIndexNow'           // Bing/Yandex Indexing
  | 'notifyBaidu';             // Baidu Indexing

/**
 * Sink Authorization Context
 */
export interface SinkAuthorizationContext {
  sinkName: ProtectedSinkName;
  language?: Language;         // Scope constraint
  mic?: MasterIntelligenceCore; // For provenance recomputation
  manifest: LockedContentPackage; // Authoritative Pre-image
}

/**
 * TERMINAL SINK GATE
 * Clean rewrite of the final-mile verification logic.
 *
 * order: Verify Auth -> Canonicalize Payload -> Verify Projection -> Verify Manifest Binding -> Freeze -> Return
 */
export async function enforceSinkGate<T>(
  auth: any,
  context: SinkAuthorizationContext,
  payload: T
): Promise<{ verifiedPayloadRaw: string }> {
  const startTime = Date.now();
  const traceId = `sink-${context.sinkName}-${Date.now()}`;

  const manifestHashPreview = crypto.createHash('sha256')
    .update(canonicalizeJSON(context.manifest))
    .digest('hex');

  logOperation(
    'TERMINAL_SINK_ENFORCER',
    'TERMINAL_SINK_ENFORCER.verificationContext',
    'INFO',
    `[TERMINAL_SINK_ENFORCER] verification context ready for sink ${context.sinkName}`,
    {
      trace_id: traceId,
      batch_id: context.manifest?.payload_id,
      language: context.language,
      metadata: {
        sink_name: context.sinkName,
        canonical_batch_id: context.manifest?.payload_id,
        manifest_id: context.manifest?.manifest_id,
        manifest_hash_prefix: manifestHashPreview.substring(0, 16),
        manifest_present: !!context.manifest,
        auth_present: !!auth,
        mic_present: !!context.mic,
        mic_id: context.mic?.id || null
      }
    }
  );

  // LEGACY BYPASS ERADICATION: No verification allowed if OFF is not explicitly set in config
  if (PECL_DEPLOYMENT_MODE === 'OFF') {
    return { verifiedPayloadRaw: JSON.stringify(payload) };
  }

  // 1. ANTI-TOCTOU: IMMEDIATE SERIALIZATION
  // We freeze the mutable input object into a deterministic string buffer immediately.
  // ALL subsequent checks and the final I/O MUST use this buffer.
  const verifiedPayloadRaw = canonicalizeJSON(payload);

  // 2. HOLISTIC AUTHORIZATION VERIFICATION
  // Signature, Expiry, Scope, Provenance
  const authValidation = await verifyHolisticAuthorization(auth, context);
  if (!authValidation.valid) {
    const reason = authValidation.error || "AUTHORIZATION_INVALID";
    emitTelemetry(context, "FAIL", reason, startTime);
    throw new Error(`[TERMINAL_SINK_ENFORCER] Denied publish: ${reason}`);
  }

  const { signedClaims } = authValidation;

  // 3. HONEST PROTOCOL PROJECTION VERIFICATION
  // Prove that the frozen sink payload matches the signed manifest pre-image.
  const projectionCheck = verifyProtocolProjection(
    context.manifest,
    verifiedPayloadRaw,
    context.sinkName,
    context.language
  );

  if (!projectionCheck.valid) {
    const reason = projectionCheck.error || "PROJECTION_MISMATCH";
    emitTelemetry(context, "FAIL", reason, startTime);
    throw new Error(`[TERMINAL_SINK_ENFORCER] Denied publish: ${reason}`);
  }

  // 4. LAST-MILE HASH RECOMPUTATION (MANIFEST BINDING)
  // Ensure the manifest pre-image matches the hash inside the signed token.
  const recomputedManifestHash = crypto.createHash('sha256')
    .update(canonicalizeJSON(context.manifest))
    .digest('hex');

  if (recomputedManifestHash !== signedClaims.manifest_hash) {
    const reason = "HASH_MISMATCH";
    emitTelemetry(context, "FAIL", reason, startTime, {
      recomputed: recomputedManifestHash,
      token_hash: signedClaims.manifest_hash
    });
    throw new Error(`[TERMINAL_SINK_ENFORCER] Denied publish: ${reason}`);
  }

  // 5. SUCCESS TELEMETRY
  emitTelemetry(context, "PASS", "SUCCESS", startTime, {
    payload_id: signedClaims.payload_id,
    manifest_hash_prefix: signedClaims.manifest_hash.substring(0, 16),
    keyId: signedClaims.keyId
  });

  return { verifiedPayloadRaw };
}

/**
 * Holistic Auth Verifier
 */
async function verifyHolisticAuthorization(
  auth: any,
  context: SinkAuthorizationContext
): Promise<{ valid: boolean; error?: string; signedClaims?: any }> {
  if (!auth) return { valid: false, error: "MISSING_AUTH" };

  let envelope: any;
  try {
    envelope = typeof auth === 'string' ? JSON.parse(auth) : auth;
  } catch (e) {
    return { valid: false, error: "MALFORMED_PAYLOAD" };
  }

  if (!envelope.signedClaims || !envelope.signature) {
    return { valid: false, error: "MISSING_SIGNED_CLAIMS" };
  }

  const { signedClaims, signature } = envelope;

  // A. Signature Validity
  const cryptoProvider = getGlobalCryptoProvider();
  const sigValid = await cryptoProvider.verify(signedClaims, signature, signedClaims.keyId);
  if (!sigValid) return { valid: false, error: "INVALID_SIGNATURE" };

  // B. Expiry Validity
  if (Date.now() > signedClaims.expiresAt) return { valid: false, error: "EXPIRED_AUTH" };

  // C. Scope Validity (Language)
  if (context.language && !signedClaims.authorized_languages.includes(context.language)) {
    return { valid: false, error: "UNAUTHORIZED_SCOPE" };
  }

  // D. Provenance Validity (L6-BLK-002/003)
  if (context.mic) {
    const cgValid = verifyClaimGraphDigest(extractClaimGraphMaterial(context.mic), signedClaims.claimGraphDigest);
    const elValid = verifyEvidenceLedgerDigest(extractEvidenceLedgerMaterial(context.mic), signedClaims.evidenceLedgerDigest);
    if (!cgValid || !elValid) return { valid: false, error: "PROVENANCE_MISMATCH" };
  } else if (signedClaims.claimGraphDigest || signedClaims.evidenceLedgerDigest) {
    // FORENSIC-4-ENFORCER: Prove why PROVENANCE_UNAVAILABLE is triggered
    console.log(`🔬 [FORENSIC-4-ENFORCER] PROVENANCE_UNAVAILABLE branch:`)
    console.log(`   signedClaims.claimGraphDigest: ${signedClaims.claimGraphDigest ? signedClaims.claimGraphDigest.substring(0, 16) + '...' : 'undefined'}`)
    console.log(`   signedClaims.evidenceLedgerDigest: ${signedClaims.evidenceLedgerDigest ? signedClaims.evidenceLedgerDigest.substring(0, 16) + '...' : 'undefined'}`)
    console.log(`   context.mic: ${context.mic ? 'VALID_OBJECT' : 'UNDEFINED'}`)
    console.log(`   Reason: Token claims provenance but context.mic is missing`)
    
    // If provenance is claimed in token, it MUST be verifiable at sink time.
    return { valid: false, error: "PROVENANCE_UNAVAILABLE" };
  }

  return { valid: true, signedClaims };
}

/**
 * Projection Verifier
 * Defines EXACT rules for how manifest maps to sink payload.
 */
function verifyProtocolProjection(
  manifest: LockedContentPackage,
  rawPayload: string,
  sinkName: ProtectedSinkName,
  language?: Language
): { valid: boolean; error?: string } {
  const payload = JSON.parse(rawPayload);
  const baseUrl = "https://siaintel.com";

  switch (sinkName) {
    case 'createNews':
      if (!language) return { valid: false, error: "MISSING_PROJECTION_ID" };
      if (payload.title !== manifest.content.headlines[language]) return { valid: false, error: "PROJECTION_MISMATCH" };
      if (payload.slug !== manifest.content.slugs[language]) return { valid: false, error: "PROJECTION_MISMATCH" };
      if (payload.content !== manifest.content.bodies[language]) return { valid: false, error: "PROJECTION_MISMATCH" };
      if (payload.excerpt !== manifest.content.summaries[language]) return { valid: false, error: "PROJECTION_MISMATCH" };
      return { valid: true };

    case 'postTweet':
      if (payload.titleEn !== manifest.content.headlines['en']) return { valid: false, error: "PROJECTION_MISMATCH" };
      if (payload.summaryEn !== manifest.content.summaries['en']) return { valid: false, error: "PROJECTION_MISMATCH" };
      if (payload.category !== manifest.metadata.category) return { valid: false, error: "PROJECTION_MISMATCH" };
      const expectedTweetUrl = `${baseUrl}/en/news/${manifest.payload_id}-${manifest.content.slugs['en']}`;
      if (payload.articleUrl !== expectedTweetUrl) return { valid: false, error: "PROJECTION_MISMATCH" };
      return { valid: true };

    case 'notifyGoogleIndexingAPI':
    case 'notifyGoogleIndexing':
    case 'notifyIndexNow':
    case 'notifyBaidu':
      if (!language) return { valid: false, error: "MISSING_PROJECTION_ID" };
      const expectedIdxUrl = `${baseUrl}/${language}/news/${manifest.payload_id}-${manifest.content.slugs[language]}`;
      if (payload.url !== expectedIdxUrl) return { valid: false, error: "PROJECTION_MISMATCH" };
      return { valid: true };

    case 'saveDecisionDNA':
    case 'saveBatch':
      // Verify that the payload claims the same payload_id as the manifest
      const payloadId = payload.payload_id || payload.id;
      if (payloadId !== manifest.payload_id) {
        return { valid: false, error: `PROJECTION_MISMATCH: payload_id="${payloadId}", manifest="${manifest.payload_id}"` };
      }
      return { valid: true };

    default:
      return { valid: false, error: "UNRESOLVED_SINK" };
  }
}

/**
 * Observability Helper
 */
function emitTelemetry(
  context: SinkAuthorizationContext,
  result: "PASS" | "FAIL",
  reason: string,
  startTime: number,
  metadata?: any
): void {
  logOperation(
    "TERMINAL_SINK_ENFORCER",
    result === "PASS" ? "VERIFICATION_PASS" : "VERIFICATION_FAIL",
    result === "PASS" ? "INFO" : "ERROR",
    `[TERMINAL_SINK_ENFORCER] ${result} for sink ${context.sinkName}: ${reason}`,
    {
      metadata: {
        sink_name: context.sinkName,
        verification_result: result,
        verification_reason: reason,
        verification_time_ms: Date.now() - startTime,
        mode: PECL_DEPLOYMENT_MODE,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }
  );
}
