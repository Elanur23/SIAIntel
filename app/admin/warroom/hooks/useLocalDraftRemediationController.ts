'use client'

import { useState, useCallback, useMemo } from 'react';
import {
  LocalDraft,
  cloneLocalDraftForRemediation,
  applyRemediationToLocalDraft,
  rollbackLocalDraftFromSnapshot
} from '@/lib/editorial/remediation-local-draft';
import {
  AppliedRemediationEvent,
  DraftSnapshot,
  AuditInvalidationState,
  AuditInvalidationReason,
  RollbackEvent,
  SnapshotIdentity,
  SessionAuditLifecycle,
  SessionAuditResult,
  computeSnapshotIdentity,
  SESSION_DRAFT_AUDIT,
  SESSION_DRAFT_PANDA_CHECK
} from '@/lib/editorial/remediation-apply-types';
import {
  PromotionBlockReason,
  OperatorAcknowledgementState,
  PromotionSnapshotBinding
} from '@/lib/editorial/session-draft-promotion-types';
import {
  checkPromotionPreconditions,
  PreconditionCheckInput
} from '@/lib/editorial/session-draft-promotion-preconditions';
import { RemediationSuggestion } from '@/lib/editorial/remediation-types';
import { buildSessionDraftGlobalAuditPayload } from '@/lib/editorial/session-draft-global-audit-adapter';
import { buildSessionDraftPandaPackage } from '@/lib/editorial/session-draft-panda-adapter';
import { runGlobalGovernanceAudit } from '@/lib/editorial/global-governance-audit';
import { validatePandaPackage } from '@/lib/editorial/panda-intake-validator';

/**
 * Entry in the session remediation ledger tracking what was applied.
 */
export interface RemediationLedgerEntry {
  appliedEvent: AppliedRemediationEvent;
  snapshot: DraftSnapshot;
}

/**
 * Controller hook for managing in-memory local draft copies during remediation.
 *
 * CRITICAL SAFETY RULES:
 * - Session-scoped memory only.
 * - No persistence (no browser storage, no backend writes).
 * - No network calls (fetch, axios).
 * - Hard-coded audit invalidation logic.
 */
export function useLocalDraftRemediationController() {
  const [localDraftCopy, setLocalDraftCopy] = useState<LocalDraft | null>(null);
  const [sessionRemediationLedger, setSessionRemediationLedger] = useState<RemediationLedgerEntry[]>([]);
  const [latestRollbackEvent, setLatestRollbackEvent] = useState<RollbackEvent | null>(null);
  const [sessionAuditInvalidation, setSessionAuditInvalidation] = useState<AuditInvalidationState | null>(null);

  // PHASE 3C-3C-3B-2: Session Re-Audit State
  const [sessionAuditResult, setSessionAuditResult] = useState<SessionAuditResult | null>(null);
  const [sessionAuditLifecycle, setSessionAuditLifecycle] = useState<SessionAuditLifecycle>(SessionAuditLifecycle.NOT_RUN);

  /**
   * Initializes a local draft session from a canonical vault article.
   */
  const initializeLocalDraftFromVault = useCallback((vault: LocalDraft) => {
    // Ensure we have a deep clone to prevent accidental mutation of the vault state
    const cloned = cloneLocalDraftForRemediation(vault);
    setLocalDraftCopy(cloned);
    // Clear ledger and invalidation for a fresh session
    setSessionRemediationLedger([]);
    setLatestRollbackEvent(null);
    setSessionAuditInvalidation(null);
    // Clear session audit
    setSessionAuditResult(null);
    setSessionAuditLifecycle(SessionAuditLifecycle.NOT_RUN);
  }, []);

  /**
   * Clears the current remediation session.
   */
  const clearLocalDraftSession = useCallback(() => {
    setLocalDraftCopy(null);
    setSessionRemediationLedger([]);
    setLatestRollbackEvent(null);
    setSessionAuditInvalidation(null);
    // Clear session audit
    setSessionAuditResult(null);
    setSessionAuditLifecycle(SessionAuditLifecycle.NOT_RUN);
  }, []);

  /**
   * Internal logic to apply a remediation to the local controller state.
   * This is NOT connected to the UI button yet.
   */
  const applyToLocalDraftController = useCallback((input: {
    suggestion: RemediationSuggestion;
    language: string;
    fieldPath: string;
    operatorId?: string;
  }) => {
    if (!localDraftCopy) {
      throw new Error('Local draft session not initialized');
    }

    // PHASE 3C-3C-3B-2B: Controller internal revalidation
    // Revalidate category constraint
    if (input.suggestion.category !== 'FORMAT_REPAIR') {
      throw new Error('CONTROLLER_REVALIDATION_FAILED: Only FORMAT_REPAIR category is allowed');
    }

    // Revalidate field constraint
    if (input.fieldPath !== 'body') {
      throw new Error('CONTROLLER_REVALIDATION_FAILED: Only body field is allowed');
    }

    // Revalidate duplicate detection
    const isDuplicate = sessionRemediationLedger.some(
      entry => entry.appliedEvent.suggestionId === input.suggestion.id
    );
    if (isDuplicate) {
      throw new Error('CONTROLLER_REVALIDATION_FAILED: Duplicate apply detected for suggestion ' + input.suggestion.id);
    }

    // Call pure helper to compute the next state
    const {
      nextLocalDraft,
      snapshot,
      appliedEvent,
      auditInvalidation
    } = applyRemediationToLocalDraft({
      localDraft: localDraftCopy,
      suggestion: input.suggestion,
      language: input.language,
      fieldPath: input.fieldPath,
      operatorId: input.operatorId
    });

    // Update session state
    setLocalDraftCopy(nextLocalDraft);
    setSessionRemediationLedger(prev => [...prev, { appliedEvent, snapshot }]);
    setSessionAuditInvalidation(auditInvalidation);
    // Clearing rollback since we just moved forward
    setLatestRollbackEvent(null);

    // Any change to local draft invalidates current session audit
    if (sessionAuditResult) {
      setSessionAuditResult(prev => prev ? { ...prev, isStale: true } : null);
      setSessionAuditLifecycle(SessionAuditLifecycle.STALE);
    }

    return { appliedEvent, snapshot };
  }, [localDraftCopy, sessionRemediationLedger]);

  /**
   * Internal logic to rollback the last remediation in the session.
   * This is NOT connected to the UI button yet.
   */
  const rollbackLastLocalDraftChange = useCallback((input: {
    operatorId?: string;
  }) => {
    if (!localDraftCopy || sessionRemediationLedger.length === 0) {
      throw new Error('Nothing to rollback');
    }

    // Get the latest snapshot from the ledger
    const lastEntry = sessionRemediationLedger[sessionRemediationLedger.length - 1];

    // Call pure helper to compute restored state
    const {
      restoredLocalDraft,
      rollbackEvent
    } = rollbackLocalDraftFromSnapshot({
      localDraft: localDraftCopy,
      snapshot: lastEntry.snapshot,
      operatorId: input.operatorId
    });

    // Update session state
    setLocalDraftCopy(restoredLocalDraft);
    setSessionRemediationLedger(prev => prev.slice(0, -1));
    setLatestRollbackEvent(rollbackEvent as RollbackEvent);

    // Rollback MUST keep audit invalidated and re-audit required
    setSessionAuditInvalidation({
      auditInvalidated: true,
      reAuditRequired: true,
      invalidationReason: AuditInvalidationReason.ROLLBACK_PERFORMED,
      invalidatedAt: new Date().toISOString()
    });

    // Rollback invalidates session audit
    if (sessionAuditResult) {
      setSessionAuditResult(prev => prev ? { ...prev, isStale: true } : null);
      setSessionAuditLifecycle(SessionAuditLifecycle.STALE);
    }

    return { rollbackEvent };
  }, [localDraftCopy, sessionRemediationLedger]);

  /**
   * Executes a read-only session re-audit (Global Audit + Panda validation)
   * against the current localDraftCopy.
   */
  const runSessionDraftReAudit = useCallback(async (articleId: string) => {
    if (!localDraftCopy) {
      console.warn('[CONTROLLER] Cannot run audit: No local draft exists.');
      return;
    }

    try {
      setSessionAuditLifecycle(SessionAuditLifecycle.RUNNING);

      // 1. Compute Snapshot Identity
      const contentHash = JSON.stringify(
        Object.keys(localDraftCopy).sort().map(l => localDraftCopy[l].desc)
      );
      const ledgerSequence = sessionRemediationLedger.length;
      const latestAppliedEventId = sessionRemediationLedger.length > 0
        ? sessionRemediationLedger[sessionRemediationLedger.length - 1].appliedEvent.eventId
        : null;

      const identity = computeSnapshotIdentity(contentHash, ledgerSequence, latestAppliedEventId);

      // 2. Global Audit Flow
      const globalAuditAdapterResult = buildSessionDraftGlobalAuditPayload(
        articleId,
        localDraftCopy,
        identity
      );

      let globalAuditResult: any = null;
      let globalAuditPass = false;

      if (globalAuditAdapterResult.ok && globalAuditAdapterResult.payload) {
        globalAuditResult = runGlobalGovernanceAudit(
          articleId,
          localDraftCopy
        );
        globalAuditPass = globalAuditResult.publishable;
      }

      // 3. Panda Validation Flow
      const pandaAdapterResult = buildSessionDraftPandaPackage(
        articleId,
        localDraftCopy,
        identity
      );

      let pandaCheckResult: any = null;
      let pandaCheckPass = false;

      if (pandaAdapterResult.ok && pandaAdapterResult.package) {
        pandaCheckResult = validatePandaPackage(pandaAdapterResult.package);
        pandaCheckPass = pandaCheckResult.ok;
      }

      // 4. Assemble Findings
      const findings: string[] = [];
      if (globalAuditResult) {
        findings.push(...(globalAuditResult.globalFindings || []));
      }
      if (pandaCheckResult && !pandaCheckResult.ok) {
        findings.push(...(pandaCheckResult.errors?.map((e: any) =>
          `${e.lang?.toUpperCase() || 'CORE'}: ${e.message}`
        ) || []));
      }

      // 5. Store Result in Session Memory Only
      const result: SessionAuditResult = {
        identity,
        lifecycle: (globalAuditPass && pandaCheckPass) ? SessionAuditLifecycle.PASSED : SessionAuditLifecycle.FAILED,
        globalAuditPass,
        pandaCheckPass,
        findings,
        globalAuditResult,
        pandaCheckResult,
        pandaStructuralErrors: pandaAdapterResult.errorType === 'PANDA_PACKAGE_STRUCTURE_ERROR'
          ? [pandaAdapterResult.error || 'Unknown structural error']
          : undefined,
        timestamp: new Date().toISOString(),
        isStale: false,
        memoryOnly: true,
        deployUnlockAllowed: false,
        canonicalAuditOverwriteAllowed: false,
        vaultMutationAllowed: false
      };

      setSessionAuditResult(result);
      setSessionAuditLifecycle(result.lifecycle);

    } catch (err) {
      console.error('[CONTROLLER] Session re-audit failed:', err);
      setSessionAuditLifecycle(SessionAuditLifecycle.FAILED);
      setSessionAuditResult(null);
    }
  }, [localDraftCopy, sessionRemediationLedger]);

  // Derived state helpers
  const hasLocalDraftChanges = useMemo(() => sessionRemediationLedger.length > 0, [sessionRemediationLedger]);
  const latestSnapshot = useMemo(() =>
    sessionRemediationLedger.length > 0 ? sessionRemediationLedger[sessionRemediationLedger.length - 1].snapshot : null
  , [sessionRemediationLedger]);
  const latestAppliedEvent = useMemo(() =>
    sessionRemediationLedger.length > 0 ? sessionRemediationLedger[sessionRemediationLedger.length - 1].appliedEvent : null
  , [sessionRemediationLedger]);

  const reAuditRequired = useMemo(() =>
    sessionAuditInvalidation?.reAuditRequired ?? false
  , [sessionAuditInvalidation]);

  const deployBlockedByLocalDraft = useMemo(() =>
    sessionAuditInvalidation?.auditInvalidated ?? false
  , [sessionAuditInvalidation]);

  /**
   * Snapshot Identity of current session draft.
   */
  const currentSnapshotIdentity = useMemo(() => {
    if (!localDraftCopy) return null;
    const contentHash = JSON.stringify(
      Object.keys(localDraftCopy).sort().map(l => localDraftCopy[l].desc)
    );
    const ledgerSequence = sessionRemediationLedger.length;
    const latestAppliedEventId = sessionRemediationLedger.length > 0
      ? sessionRemediationLedger[sessionRemediationLedger.length - 1].appliedEvent.eventId
      : null;

    return computeSnapshotIdentity(contentHash, ledgerSequence, latestAppliedEventId);
  }, [localDraftCopy, sessionRemediationLedger]);

  /**
   * Read-only exposure of promotion snapshot binding.
   * Uses default (non-acknowledged) state for read-only precondition check.
   */
  const snapshotBinding = useMemo(() => {
    const defaultAck: OperatorAcknowledgementState = {
      vaultReplacementAcknowledged: false,
      auditInvalidationAcknowledged: false,
      deployLockAcknowledged: false,
      reAuditRequiredAcknowledged: false
    };

    const input: PreconditionCheckInput = {
      hasSessionDraft: localDraftCopy !== null,
      sessionAuditResult,
      sessionAuditLifecycle,
      currentSnapshotIdentity,
      transformError: null,
      hasSelectedArticle: localDraftCopy !== null,
      hasLocalDraftCopy: localDraftCopy !== null,
      acknowledgement: defaultAck
    };

    return checkPromotionPreconditions(input).snapshotBinding;
  }, [localDraftCopy, sessionAuditResult, sessionAuditLifecycle, currentSnapshotIdentity]);

  // ============================================================================
  // SESSION VIEW MODEL HELPERS (Task 2 - Session Preview / Session State UI)
  // ============================================================================
  // Pure derived state for UI consumption - read-only, no side effects

  /**
   * True when a session draft exists (localDraftCopy is not null).
   */
  const hasSessionDraft = useMemo(() => 
    localDraftCopy !== null
  , [localDraftCopy]);

  /**
   * True when audit is stale due to session changes or audit invalidation.
   */
  const isAuditStale = useMemo(() =>
    sessionAuditInvalidation?.auditInvalidated ?? false
  , [sessionAuditInvalidation]);

  /**
   * Count of remediations applied in this session.
   */
  const sessionRemediationCount = useMemo(() =>
    sessionRemediationLedger.length
  , [sessionRemediationLedger]);

  /**
   * True when session remediation ledger has entries.
   */
  const hasSessionRemediationLedger = useMemo(() =>
    sessionRemediationLedger.length > 0
  , [sessionRemediationLedger]);

  /**
   * True when session draft has body content available.
   * Checks if localDraftCopy exists and has at least one language node with body content.
   */
  const sessionDraftBodyAvailable = useMemo(() => {
    if (!localDraftCopy) return false;
    // Check if any language node has body content (desc field contains body)
    return Object.values(localDraftCopy).some(node => 
      node.desc && node.desc.trim().length > 0
    );
  }, [localDraftCopy]);

  /**
   * List of fields modified in session draft.
   * Currently only 'body' is supported for session modifications.
   */
  const sessionDraftModifiedFields = useMemo(() => {
    if (!localDraftCopy || sessionRemediationLedger.length === 0) return [];
    // Extract unique affected fields from ledger
    const fields = new Set<string>();
    sessionRemediationLedger.forEach(entry => {
      if (entry.appliedEvent.affectedField) {
        fields.add(entry.appliedEvent.affectedField);
      }
    });
    return Array.from(fields);
  }, [localDraftCopy, sessionRemediationLedger]);

  /**
   * Human-readable deploy block reason when session draft exists or audit is stale.
   * Returns null when no session-related blocking exists.
   */
  const deployBlockReason = useMemo(() => {
    if (localDraftCopy !== null) {
      return "Local session draft exists — full protocol re-audit required.";
    }
    if (sessionAuditInvalidation?.auditInvalidated) {
      return "Audit invalidated by session changes — re-audit required.";
    }
    return null;
  }, [localDraftCopy, sessionAuditInvalidation]);

  /**
   * Primary session warning copy for banner display.
   * Returns null when no session draft exists.
   */
  const sessionWarningCopy = useMemo(() => {
    if (localDraftCopy === null) return null;
    return "Session Draft Active — Not Saved to Vault — Not Deployed";
  }, [localDraftCopy]);

  /**
   * Audit stale warning copy for banner/chip display.
   * Returns null when audit is not stale.
   */
  const auditStaleCopy = useMemo(() => {
    if (!sessionAuditInvalidation?.auditInvalidated) return null;
    return "Full re-audit required before deploy.";
  }, [sessionAuditInvalidation]);

  /**
   * Volatility warning copy for banner display.
   * Returns null when no session draft exists.
   */
  const volatilityWarningCopy = useMemo(() => {
    if (localDraftCopy === null) return null;
    return "Session changes are volatile and may be lost on refresh.";
  }, [localDraftCopy]);

  /**
   * Archives promotion session evidence before clearing.
   * TASK 10: Archive-Before-Clear design
   * 
   * This function creates an in-memory archive of session state before
   * clearLocalDraftSession is called. It preserves traceability by capturing:
   * - Session remediation ledger
   * - Session audit result
   * - Snapshot identity
   * - Rollback events
   * - Audit invalidation state
   * 
   * CRITICAL SAFETY RULES:
   * - Memory-only operation (no persistence)
   * - No mutations (read-only archive creation)
   * - No backend/API/database/provider calls
   * - No localStorage/sessionStorage writes
   * - Must be called BEFORE clearLocalDraftSession
   * 
   * @param metadata - Execution metadata (executionId, operatorId, promotedLanguages)
   * @returns Archive summary or throws error
   */
  const archivePromotionSession = useCallback((metadata: {
    executionId: string;
    operatorId: string;
    promotedLanguages: string[];
  }) => {
    // Generate unique archive ID
    const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const archivedAt = new Date().toISOString();

    // Capture session state (deep-clone to prevent mutation)
    const archivedLedger = sessionRemediationLedger.length > 0
      ? JSON.parse(JSON.stringify(sessionRemediationLedger))
      : [];

    const archivedSessionAudit = sessionAuditResult
      ? JSON.parse(JSON.stringify(sessionAuditResult))
      : null;

    const archivedSnapshotIdentity = currentSnapshotIdentity
      ? JSON.parse(JSON.stringify(currentSnapshotIdentity))
      : null;

    const archivedRollbackEvent = latestRollbackEvent
      ? JSON.parse(JSON.stringify(latestRollbackEvent))
      : null;

    const archivedAuditInvalidation = sessionAuditInvalidation
      ? JSON.parse(JSON.stringify(sessionAuditInvalidation))
      : null;

    // Build archive summary
    const archive = {
      archiveId,
      archivedAt,
      executionId: metadata.executionId,
      operatorId: metadata.operatorId,
      promotedLanguages: metadata.promotedLanguages,
      promotedLanguageCount: metadata.promotedLanguages.length,
      localDraftWasPresent: localDraftCopy !== null,
      archivedLedgerLength: archivedLedger.length,
      archivedSessionAuditPresent: archivedSessionAudit !== null,
      archivedSessionAuditLifecycle: sessionAuditLifecycle,
      archivedSessionAuditInvalidationPresent: archivedAuditInvalidation !== null,
      archivedLatestRollbackEventPresent: archivedRollbackEvent !== null,
      archivedSnapshotIdentity: archivedSnapshotIdentity,
      memoryOnly: true as const,
      backendPersistencePerformed: false as const,
      deployRemainedLocked: true as const,
      rollbackImplemented: false as const
    };

    return archive;
  }, [
    localDraftCopy,
    sessionRemediationLedger,
    sessionAuditResult,
    sessionAuditLifecycle,
    sessionAuditInvalidation,
    latestRollbackEvent,
    currentSnapshotIdentity
  ]);

  return {
    // State
    localDraftCopy,
    hasLocalDraftChanges,
    sessionRemediationLedger,
    latestSnapshot,
    latestAppliedEvent,
    latestRollbackEvent,
    sessionAuditInvalidation,
    reAuditRequired,
    deployBlockedByLocalDraft,
    sessionAuditResult,
    sessionAuditLifecycle,
    snapshotBinding,

    // Session View Model Helpers (Task 2)
    hasSessionDraft,
    isAuditStale,
    sessionRemediationCount,
    hasSessionRemediationLedger,
    sessionDraftBodyAvailable,
    sessionDraftModifiedFields,
    deployBlockReason,
    sessionWarningCopy,
    auditStaleCopy,
    volatilityWarningCopy,

    // Functions
    initializeLocalDraftFromVault,
    clearLocalDraftSession,
    archivePromotionSession,
    applyToLocalDraftController,
    rollbackLastLocalDraftChange,
    runSessionDraftReAudit
  };
}
