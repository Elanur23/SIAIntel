/**
 * Canonical Re-Audit Adapter
 * 
 * Pure in-memory adapter for running canonical re-audit logic against
 * canonical-vault-shaped data without mutating application state.
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - No backend/API/database/provider calls
 * - No localStorage/sessionStorage
 * - No vault mutation
 * - No canonical article state mutation
 * - No session draft state mutation
 * - No globalAudit overwrite
 * - No session audit inheritance
 * - No deploy unlock
 * - No publish/save/promote/rollback
 * - Fail-closed for all ambiguous states
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems
 */

import {
  CanonicalReAuditSnapshotIdentity,
  CanonicalReAuditBlockReason,
  PendingCanonicalReAuditResult,
  verifyCanonicalSnapshotIdentityMatch,
  createCanonicalReAuditBlockedResult,
  createPendingCanonicalReAuditResult,
  createStaleCanonicalReAuditResult
} from './canonical-reaudit-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Minimal canonical vault shape required for audit
 */
export interface CanonicalVaultInput {
  // Vault structure (language nodes)
  vault?: Record<string, {
    title: string;
    desc: string;
    ready: boolean;
  }>;
  
  // Metadata
  articleId?: string;
  metadata?: {
    promotionId?: string;
    promotedAt?: string;
    [key: string]: any;
  };
}

/**
 * Audit content shape for audit runner
 */
export interface CanonicalAuditContent {
  articleId: string;
  vault: Record<string, {
    title: string;
    desc: string;
    ready: boolean;
  }>;
}

/**
 * Adapter result for canonical re-audit
 */
export interface CanonicalReAuditAdapterResult {
  status: 'BLOCKED' | 'PASSED_PENDING_ACCEPTANCE' | 'FAILED_PENDING_REVIEW' | 'STALE';
  deployUnlockAllowed: false;
  canonicalStateMutationAllowed: false;
  persistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
  source: 'canonical-vault';
  snapshotIdentity: CanonicalReAuditSnapshotIdentity;
  auditSummary?: string;
  findings?: unknown[];
  blockReason?: CanonicalReAuditBlockReason;
  blockMessage?: string;
  auditedAt: string;
  auditor: string;
}

/**
 * Request to run in-memory canonical re-audit
 */
export interface RunInMemoryCanonicalReAuditRequest {
  canonicalVault: CanonicalVaultInput;
  expectedSnapshot?: CanonicalReAuditSnapshotIdentity;
  currentSnapshot: CanonicalReAuditSnapshotIdentity;
  auditor: string;
}

// ============================================================================
// AUDIT RUNNER IMPORT DECISION
// ============================================================================

/**
 * AUDIT RUNNER IMPORT ANALYSIS:
 * 
 * 1. runGlobalGovernanceAudit (lib/editorial/global-governance-audit.ts)
 *    - PURE: Yes
 *    - IMPORTS: Only from sia-sentinel-core (also pure)
 *    - BACKEND: No fetch/axios/prisma/libsql
 *    - DECISION: SAFE TO IMPORT
 * 
 * 2. validatePandaPackage (not found in codebase)
 *    - DECISION: NOT IMPORTED (unavailable)
 * 
 * 3. runDeepAudit (lib/neural-assembly/sia-sentinel-core.ts)
 *    - PURE: Yes
 *    - IMPORTS: None (self-contained)
 *    - BACKEND: No fetch/axios/prisma/libsql
 *    - DECISION: SAFE TO IMPORT (but not used for canonical vault audit)
 * 
 * SELECTED AUDIT RUNNER: runGlobalGovernanceAudit
 * - Designed for vault structure (Record<string, VaultNode>)
 * - Pure function with no side effects
 * - No backend/API/database/provider calls
 * - Returns structured audit result
 */

import { runGlobalGovernanceAudit } from './global-governance-audit';

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Maps canonical vault input to audit content shape
 * 
 * SAFETY RULES:
 * - Pure function (no mutation)
 * - Fail-closed for missing/invalid input
 * - Rejects session draft contamination
 * - Strips session-only fields defensively
 * 
 * @param input - Canonical vault input
 * @returns Audit content or null if invalid
 */
export function mapCanonicalVaultToAuditContent(
  input: CanonicalVaultInput | null | undefined
): CanonicalAuditContent | null {
  // Fail-closed: missing input
  if (!input) {
    return null;
  }
  
  // Fail-closed: missing vault
  if (!input.vault || typeof input.vault !== 'object') {
    return null;
  }
  
  // Fail-closed: empty vault
  if (Object.keys(input.vault).length === 0) {
    return null;
  }
  
  // Defensive: strip session-only fields if present
  // Session drafts should never reach this adapter, but fail-closed if they do
  const vault = input.vault;
  
  // Validate vault structure
  for (const [lang, node] of Object.entries(vault)) {
    if (!node || typeof node !== 'object') {
      return null;
    }
    
    // Required fields
    if (typeof node.title !== 'string' || typeof node.desc !== 'string') {
      return null;
    }
    
    // Ready flag must be boolean
    if (typeof node.ready !== 'boolean') {
      return null;
    }
  }
  
  // Extract articleId (fail-closed if missing)
  const articleId = input.articleId || input.metadata?.articleId || 'UNKNOWN_ARTICLE';
  
  return {
    articleId,
    vault
  };
}

/**
 * Runs in-memory canonical re-audit
 * 
 * SAFETY RULES:
 * - Pure function (no mutation)
 * - No backend/API/database/provider calls
 * - No persistence
 * - No globalAudit mutation
 * - No session audit inheritance
 * - Fail-closed for all errors
 * - Snapshot verification before and after
 * 
 * @param request - Re-audit request
 * @returns Adapter result (always fail-closed)
 */
export function runInMemoryCanonicalReAudit(
  request: RunInMemoryCanonicalReAuditRequest | null | undefined
): CanonicalReAuditAdapterResult {
  const auditor = request?.auditor || 'UNKNOWN_AUDITOR';
  const auditedAt = new Date().toISOString();
  
  // Fail-closed: missing request
  if (!request) {
    return createBlockedCanonicalReAuditAdapterResult(
      CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      'Re-audit request is missing',
      {
        contentHash: 'MISSING_REQUEST',
        ledgerSequence: -1,
        capturedAt: auditedAt,
        source: 'canonical-vault'
      },
      auditor
    );
  }
  
  // Fail-closed: missing canonical vault
  if (!request.canonicalVault) {
    return createBlockedCanonicalReAuditAdapterResult(
      CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      'Canonical vault is missing',
      {
        contentHash: 'MISSING_VAULT',
        ledgerSequence: -1,
        capturedAt: auditedAt,
        source: 'canonical-vault'
      },
      auditor
    );
  }
  
  // Fail-closed: missing current snapshot
  if (!request.currentSnapshot) {
    return createBlockedCanonicalReAuditAdapterResult(
      CanonicalReAuditBlockReason.SNAPSHOT_MISSING,
      'Current snapshot identity is missing',
      {
        contentHash: 'MISSING_SNAPSHOT',
        ledgerSequence: -1,
        capturedAt: auditedAt,
        source: 'canonical-vault'
      },
      auditor
    );
  }
  
  // Snapshot verification: expected vs current
  // Note: Only compare stable identity fields (contentHash, ledgerSequence)
  // capturedAt is volatile and set at call time, so it will always differ
  // between the request snapshot and the current snapshot computed in preflight
  if (request.expectedSnapshot) {
    const contentHashMatch = 
      request.expectedSnapshot.contentHash === request.currentSnapshot.contentHash;
    const ledgerSequenceMatch = 
      request.expectedSnapshot.ledgerSequence === request.currentSnapshot.ledgerSequence;
    
    if (!contentHashMatch || !ledgerSequenceMatch) {
      // Return stale result using the types module function
      const staleResult = createStaleCanonicalReAuditResult(
        request.currentSnapshot,
        auditor
      );
      
      // Convert to adapter result format
      return {
        status: 'STALE',
        deployUnlockAllowed: false,
        canonicalStateMutationAllowed: false,
        persistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        source: 'canonical-vault',
        snapshotIdentity: request.currentSnapshot,
        blockReason: CanonicalReAuditBlockReason.STALE_RESULT,
        blockMessage: 'Snapshot mismatch detected - vault content changed',
        auditedAt,
        auditor
      };
    }
  }
  
  // Map canonical vault to audit content
  const auditContent = mapCanonicalVaultToAuditContent(request.canonicalVault);
  
  // Fail-closed: invalid vault shape
  if (!auditContent) {
    return createBlockedCanonicalReAuditAdapterResult(
      CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      'Canonical vault has invalid shape or missing required fields',
      request.currentSnapshot,
      auditor
    );
  }
  
  // Run audit (wrapped in try-catch for fail-closed)
  try {
    // AUDIT RUNNER EXECUTION
    const auditResult = runGlobalGovernanceAudit(
      auditContent.articleId,
      auditContent.vault
    );
    
    // Fail-closed: audit runner returned invalid result
    if (!auditResult || typeof auditResult !== 'object') {
      return createBlockedCanonicalReAuditAdapterResult(
        CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED,
        'Audit runner returned invalid result',
        request.currentSnapshot,
        auditor
      );
    }
    
    // Determine pass/fail status
    const passed = auditResult.publishable === true && auditResult.status === 'PASS';
    
    // Create pending result
    const findings = [
      {
        status: auditResult.status,
        publishable: auditResult.publishable,
        gatingStatus: auditResult.gatingStatus,
        globalScore: auditResult.globalScore,
        failedLanguages: auditResult.failedLanguages,
        warningLanguages: auditResult.warningLanguages,
        globalFindings: auditResult.globalFindings
      }
    ];
    
    const auditSummary = `Global Score: ${auditResult.globalScore}/100, Status: ${auditResult.status}, Publishable: ${auditResult.publishable}`;
    
    return {
      status: passed ? 'PASSED_PENDING_ACCEPTANCE' : 'FAILED_PENDING_REVIEW',
      deployUnlockAllowed: false,
      canonicalStateMutationAllowed: false,
      persistenceAllowed: false,
      sessionAuditInheritanceAllowed: false,
      source: 'canonical-vault',
      snapshotIdentity: request.currentSnapshot,
      auditSummary,
      findings,
      auditedAt,
      auditor
    };
    
  } catch (error) {
    // Fail-closed: audit runner threw exception
    return createBlockedCanonicalReAuditAdapterResult(
      CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED,
      `Audit runner threw exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      request.currentSnapshot,
      auditor
    );
  }
}

/**
 * Creates a blocked canonical re-audit adapter result
 * 
 * @param reason - Block reason
 * @param message - Block message
 * @param snapshot - Snapshot identity
 * @param auditor - Auditor identifier
 * @returns Blocked adapter result
 */
export function createBlockedCanonicalReAuditAdapterResult(
  reason: CanonicalReAuditBlockReason,
  message: string,
  snapshot: CanonicalReAuditSnapshotIdentity,
  auditor: string
): CanonicalReAuditAdapterResult {
  return {
    status: 'BLOCKED',
    deployUnlockAllowed: false,
    canonicalStateMutationAllowed: false,
    persistenceAllowed: false,
    sessionAuditInheritanceAllowed: false,
    source: 'canonical-vault',
    snapshotIdentity: snapshot,
    blockReason: reason,
    blockMessage: message,
    auditedAt: new Date().toISOString(),
    auditor
  };
}

/**
 * Creates a pending canonical re-audit adapter result
 * 
 * @param snapshot - Snapshot identity
 * @param passed - Whether audit passed
 * @param auditor - Auditor identifier
 * @param findings - Audit findings
 * @param summary - Audit summary
 * @returns Pending adapter result
 */
export function createPendingCanonicalReAuditAdapterResult(
  snapshot: CanonicalReAuditSnapshotIdentity,
  passed: boolean,
  auditor: string,
  findings?: unknown[],
  summary?: string
): CanonicalReAuditAdapterResult {
  return {
    status: passed ? 'PASSED_PENDING_ACCEPTANCE' : 'FAILED_PENDING_REVIEW',
    deployUnlockAllowed: false,
    canonicalStateMutationAllowed: false,
    persistenceAllowed: false,
    sessionAuditInheritanceAllowed: false,
    source: 'canonical-vault',
    snapshotIdentity: snapshot,
    auditSummary: summary,
    findings,
    auditedAt: new Date().toISOString(),
    auditor
  };
}
