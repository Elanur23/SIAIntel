/**
 * Canonical Re-Audit Input Builder
 * 
 * Pure client-safe input builder and preflight validation for canonical re-audit.
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - Pure functions only - no side effects
 * - No server-only imports (fs, path, crypto, node:, process.env, Buffer)
 * - No network calls (fetch, axios)
 * - No storage (localStorage, sessionStorage)
 * - No React imports
 * - No handler/server boundary imports
 * - Fail-closed for all validation
 * - No UNKNOWN_ARTICLE fallbacks
 * 
 * @version 7C-2A.0.0
 */

// Import only pure types - no runtime logic from handlers
import type {
  CanonicalReAuditSnapshotIdentity,
  CanonicalReAuditRequest
} from './canonical-reaudit-types';
import type { CanonicalVaultInput } from './canonical-reaudit-adapter';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Block reasons for canonical re-audit preflight validation
 */
export type CanonicalReAuditPreflightBlockReason =
  | 'MISSING_ARTICLE_ID'
  | 'MISSING_OPERATOR_ID'
  | 'MISSING_CANONICAL_VAULT'
  | 'EMPTY_CANONICAL_VAULT'
  | 'SNAPSHOT_UNAVAILABLE'
  | 'SESSION_DRAFT_ACTIVE'
  | 'NON_CANONICAL_VIEW'
  | 'ALREADY_RUNNING';

/**
 * Input fields for preflight validation
 */
export interface CanonicalReAuditPreflightInputFields {
  articleId: string | null | undefined;
  operatorId: string | null | undefined;
  vault: unknown;
  draftSource: string | null | undefined;
  hasSessionDraft: boolean;
  isRunning: boolean;
  promotionId?: string | null;
  promotionArchiveId?: string | null;
  requestedAt?: string;
}

/**
 * Sanitized input preview (no raw content exposure)
 */
export interface CanonicalReAuditInputPreview {
  articleIdSuffix: string;
  operatorId: string;
  languageCount: number;
  snapshotShort: string;
  promotionIdPresent: boolean;
  promotionArchiveIdPresent: boolean;
}

/**
 * Run input type matching hook contract
 */
export interface RunCanonicalReAuditInput {
  articleId: string;
  operatorId: string;
  canonicalSnapshot: CanonicalReAuditSnapshotIdentity;
  vault: CanonicalVaultInput;
  promotionId?: string;
  promotionArchiveId?: string;
  requestedAt?: string;
}

/**
 * Preflight validation result
 */
export interface CanonicalReAuditPreflightResult {
  canRun: boolean;
  blockReasons: CanonicalReAuditPreflightBlockReason[];
  inputPreview: CanonicalReAuditInputPreview | null;
  attestationPhrase: string | null;
  warnings: string[];
  computedInput: RunCanonicalReAuditInput | null;
}

// ============================================================================
// PURE SNAPSHOT COMPUTATION (CLIENT-SAFE)
// ============================================================================

/**
 * Computes a deterministic canonical snapshot identity from vault data.
 * 
 * SAFETY RULES:
 * - Pure function - no mutation, no I/O, no network, no storage
 * - Client-safe - no server-only imports
 * - Deterministic - same input produces same output
 * - No crypto dependencies - uses JSON serialization only
 * 
 * @param vault - Canonical vault input
 * @param articleId - Article identifier
 * @returns Canonical snapshot identity
 */
function computeCanonicalSnapshotIdentity(
  vault: CanonicalVaultInput,
  articleId: string
): CanonicalReAuditSnapshotIdentity {
  // Stable serialization: sort vault keys for determinism
  const vaultRecord = vault.vault ?? {};
  const sortedLangs = Object.keys(vaultRecord).sort();

  const stablePayload = sortedLangs.map((lang) => {
    const node = vaultRecord[lang];
    return {
      lang,
      title: node?.title ?? '',
      desc: node?.desc ?? '',
      ready: node?.ready ?? false,
    };
  });

  // Include articleId for unique hashing per article
  const serialized = JSON.stringify({ articleId, vault: stablePayload });

  // Deterministic content hash using stable string serialization
  const contentHash = serialized;

  return {
    contentHash,
    ledgerSequence: 0, // Canonical vault has no remediation ledger
    capturedAt: new Date().toISOString(),
    source: 'canonical-vault',
    promotionId: vault.metadata?.promotionId,
  };
}

// ============================================================================
// VAULT VALIDATION
// ============================================================================

/**
 * Validates canonical vault structure
 * 
 * @param vault - Vault to validate
 * @returns true if valid, false if invalid
 */
function isValidCanonicalVault(vault: unknown): vault is Record<string, { title: string; desc: string; ready: boolean }> {
  if (!vault || typeof vault !== 'object') {
    return false;
  }

  const vaultRecord = vault as Record<string, unknown>;
  const langKeys = Object.keys(vaultRecord);

  if (langKeys.length === 0) {
    return false;
  }

  // Validate each language node
  for (const lang of langKeys) {
    const node = vaultRecord[lang];
    if (!node || typeof node !== 'object') {
      return false;
    }

    const nodeRecord = node as Record<string, unknown>;
    if (
      typeof nodeRecord.title !== 'string' ||
      typeof nodeRecord.desc !== 'string' ||
      typeof nodeRecord.ready !== 'boolean'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Converts page vault to CanonicalVaultInput format
 * 
 * @param vault - Page vault state
 * @param articleId - Article identifier
 * @param promotionId - Optional promotion identifier
 * @returns CanonicalVaultInput or null if invalid
 */
function buildCanonicalVaultInput(
  vault: unknown,
  articleId: string,
  promotionId?: string | null
): CanonicalVaultInput | null {
  if (!isValidCanonicalVault(vault)) {
    return null;
  }

  return {
    vault,
    articleId,
    metadata: {
      promotionId: promotionId || undefined,
    },
  };
}

// ============================================================================
// ATTESTATION PHRASE GENERATION
// ============================================================================

/**
 * Generates dynamic attestation phrase for canonical re-audit
 * 
 * @param articleId - Article identifier
 * @param snapshotIdentity - Snapshot identity
 * @returns Dynamic attestation phrase
 */
export function generateCanonicalReAuditAttestationPhrase(
  articleId: string,
  snapshotIdentity: CanonicalReAuditSnapshotIdentity
): string {
  // Extract masked article suffix (last 6 chars, uppercase)
  const articleSuffix = articleId.slice(-6).toUpperCase();
  
  // Extract masked snapshot hash (first 8 chars, uppercase)
  const snapshotShort = snapshotIdentity.contentHash.slice(0, 8).toUpperCase();
  
  return `REAUDIT-${articleSuffix}-${snapshotShort}`;
}

// ============================================================================
// INPUT PREVIEW CREATION
// ============================================================================

/**
 * Creates sanitized input preview (no raw content exposure)
 * 
 * @param computedInput - Computed input
 * @returns Sanitized preview
 */
export function createSanitizedCanonicalReAuditInputPreview(
  computedInput: RunCanonicalReAuditInput
): CanonicalReAuditInputPreview {
  const vaultRecord = computedInput.vault.vault ?? {};
  const languageCount = Object.keys(vaultRecord).length;

  return {
    articleIdSuffix: computedInput.articleId.slice(-6).toUpperCase(),
    operatorId: computedInput.operatorId,
    languageCount,
    snapshotShort: computedInput.canonicalSnapshot.contentHash.slice(0, 8).toUpperCase(),
    promotionIdPresent: !!computedInput.promotionId,
    promotionArchiveIdPresent: !!computedInput.promotionArchiveId,
  };
}

// ============================================================================
// MAIN PREFLIGHT FUNCTION
// ============================================================================

/**
 * Builds canonical re-audit preflight validation result
 * 
 * FAIL-CLOSED VALIDATION:
 * - Missing articleId → MISSING_ARTICLE_ID (no fallback)
 * - Missing operatorId → MISSING_OPERATOR_ID
 * - Non-canonical draftSource → NON_CANONICAL_VIEW
 * - Active session draft → SESSION_DRAFT_ACTIVE
 * - Already running → ALREADY_RUNNING
 * - Missing/empty vault → MISSING_CANONICAL_VAULT / EMPTY_CANONICAL_VAULT
 * - Snapshot computation failure → SNAPSHOT_UNAVAILABLE
 * 
 * @param input - Preflight input fields
 * @returns Preflight validation result
 */
export function buildCanonicalReAuditPreflight(
  input: CanonicalReAuditPreflightInputFields
): CanonicalReAuditPreflightResult {
  const blockReasons: CanonicalReAuditPreflightBlockReason[] = [];
  const warnings: string[] = [];

  // FAIL-CLOSED CHECK 1: Missing articleId (no UNKNOWN_ARTICLE fallback)
  if (!input.articleId || input.articleId.trim().length === 0) {
    blockReasons.push('MISSING_ARTICLE_ID');
  }

  // FAIL-CLOSED CHECK 2: Missing operatorId
  if (!input.operatorId || input.operatorId.trim().length === 0) {
    blockReasons.push('MISSING_OPERATOR_ID');
  }

  // FAIL-CLOSED CHECK 3: Non-canonical draft source
  if (input.draftSource !== 'canonical') {
    blockReasons.push('NON_CANONICAL_VIEW');
  }

  // FAIL-CLOSED CHECK 4: Active session draft
  if (input.hasSessionDraft) {
    blockReasons.push('SESSION_DRAFT_ACTIVE');
  }

  // FAIL-CLOSED CHECK 5: Already running
  if (input.isRunning) {
    blockReasons.push('ALREADY_RUNNING');
  }

  // FAIL-CLOSED CHECK 6: Missing vault
  if (!input.vault) {
    blockReasons.push('MISSING_CANONICAL_VAULT');
  }

  // FAIL-CLOSED CHECK 7: Empty vault
  if (input.vault && !isValidCanonicalVault(input.vault)) {
    blockReasons.push('EMPTY_CANONICAL_VAULT');
  }

  // Early return if blocked
  if (blockReasons.length > 0) {
    return {
      canRun: false,
      blockReasons,
      inputPreview: null,
      attestationPhrase: null,
      warnings,
      computedInput: null,
    };
  }

  // Safe to proceed - all required fields validated
  const articleId = input.articleId!.trim();
  const operatorId = input.operatorId!.trim();

  try {
    // Build canonical vault input
    const canonicalVaultInput = buildCanonicalVaultInput(
      input.vault,
      articleId,
      input.promotionId
    );

    if (!canonicalVaultInput) {
      return {
        canRun: false,
        blockReasons: ['EMPTY_CANONICAL_VAULT'],
        inputPreview: null,
        attestationPhrase: null,
        warnings,
        computedInput: null,
      };
    }

    // Compute canonical snapshot
    const canonicalSnapshot = computeCanonicalSnapshotIdentity(
      canonicalVaultInput,
      articleId
    );

    // Build computed input with safety posture
    const computedInput: RunCanonicalReAuditInput = {
      articleId,
      operatorId,
      canonicalSnapshot,
      vault: canonicalVaultInput,
      promotionId: input.promotionId || undefined,
      promotionArchiveId: input.promotionArchiveId || undefined,
      requestedAt: input.requestedAt || new Date().toISOString(),
    };

    // Create sanitized preview
    const inputPreview = createSanitizedCanonicalReAuditInputPreview(computedInput);

    // Generate dynamic attestation phrase
    const attestationPhrase = generateCanonicalReAuditAttestationPhrase(
      articleId,
      canonicalSnapshot
    );

    // Add warnings for fallback operator ID
    if (operatorId === 'warroom-operator') {
      warnings.push('Using fallback operator ID - no authentication context available');
    }

    return {
      canRun: true,
      blockReasons: [],
      inputPreview,
      attestationPhrase,
      warnings,
      computedInput,
    };

  } catch (error) {
    // Snapshot computation or other error
    return {
      canRun: false,
      blockReasons: ['SNAPSHOT_UNAVAILABLE'],
      inputPreview: null,
      attestationPhrase: null,
      warnings,
      computedInput: null,
    };
  }
}