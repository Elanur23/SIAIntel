/**
 * SESSION DRAFT GLOBAL AUDIT ADAPTER
 *
 * Pure read-only adapter that maps session-scoped draft state into
 * the input shape expected by the Global Governance Audit engine.
 *
 * CRITICAL SAFETY RULES:
 * - Pure and side-effect free.
 * - Never mutates inputs.
 * - Never mutates canonical vault.
 * - Never writes to backend/database/storage.
 * - Hard-codes safety invariants for session-memory execution.
 */

import { PANDA_REQUIRED_LANGS } from '@/lib/content/sia-panda-writing-protocol';
import {
  SESSION_DRAFT_AUDIT,
  SnapshotIdentity
} from './remediation-apply-types';
import { LocalDraft } from './remediation-local-draft';

/**
 * Minimal local adapter payload type mirroring the expected audit input shape.
 * This contract ensures that the audit engine receives the correct context
 * to treat the validation as a session-only informational check.
 */
export interface AuditContext {
  articleId: string;
  auditType: typeof SESSION_DRAFT_AUDIT;
  timestamp: string;
  operatorId: string;
  memoryOnly: true;
}

/**
 * Input payload for Global Governance Audit.
 */
export interface AuditPayload {
  content: Record<string, string>;
  context: AuditContext;
}

/**
 * Result of the session draft global audit adapter mapping.
 * Encapsulates the payload and hard-coded safety invariants.
 */
export interface SessionDraftGlobalAuditAdapterResult {
  ok: boolean;
  payload?: AuditPayload;
  content?: Record<string, string>;
  error?: string;
  snapshotIdentity?: SnapshotIdentity;

  // Hard-coded Safety Invariants
  memoryOnly: true;
  deployUnlockAllowed: false;
  canonicalAuditOverwriteAllowed: false;
  vaultMutationAllowed: false;
}

/**
 * Pure adapter that maps localDraftCopy into a Global Audit compatible content map.
 *
 * Mapping Rules:
 * - localDraftCopy[lang].desc -> content[lang]
 * - Missing/empty desc is preserved as an empty string to maintain 9-language structure.
 */
export function mapLocalDraftToGlobalAuditContent(
  localDraftCopy: LocalDraft
): Record<string, string> {
  const contentMap: Record<string, string> = {};

  PANDA_REQUIRED_LANGS.forEach((lang) => {
    const node = localDraftCopy[lang];
    // Preserve language key with empty string if node or desc is missing
    // Document choice: Audit engine expects a value for each required language
    contentMap[lang] = node?.desc || '';
  });

  return contentMap;
}

/**
 * Pure helper to create the AuditContext for a session draft audit.
 */
export function createSessionDraftAuditContext(
  articleId: string,
  operatorId: string = 'warroom-operator'
): AuditContext {
  return {
    articleId,
    auditType: SESSION_DRAFT_AUDIT,
    timestamp: new Date().toISOString(),
    operatorId,
    memoryOnly: true
  };
}

/**
 * Main adapter function that assembles the session draft audit payload.
 *
 * CRITICAL SAFETY CONSTRAINTS:
 * - Does NOT call runGlobalGovernanceAudit yet.
 * - Does NOT unlock deploy.
 * - Does NOT mutate any state.
 */
export function buildSessionDraftGlobalAuditPayload(
  articleId: string,
  localDraftCopy: LocalDraft | null,
  snapshotIdentity: SnapshotIdentity | null
): SessionDraftGlobalAuditAdapterResult {
  // Safe error handling for missing input
  if (!localDraftCopy) {
    return {
      ok: false,
      error: 'LOCAL_DRAFT_COPY_MISSING',
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  }

  try {
    const content = mapLocalDraftToGlobalAuditContent(localDraftCopy);
    const context = createSessionDraftAuditContext(articleId);

    return {
      ok: true,
      payload: {
        content,
        context
      },
      content,
      snapshotIdentity: snapshotIdentity || undefined,
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'ADAPTER_MAPPING_ERROR',
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  }
}
