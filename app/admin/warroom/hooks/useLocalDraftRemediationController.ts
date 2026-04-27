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
  RollbackEvent
} from '@/lib/editorial/remediation-apply-types';
import { RemediationSuggestion } from '@/lib/editorial/remediation-types';

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
  }, []);

  /**
   * Clears the current remediation session.
   */
  const clearLocalDraftSession = useCallback(() => {
    setLocalDraftCopy(null);
    setSessionRemediationLedger([]);
    setLatestRollbackEvent(null);
    setSessionAuditInvalidation(null);
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

    return { rollbackEvent };
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

    // Functions
    initializeLocalDraftFromVault,
    clearLocalDraftSession,
    applyToLocalDraftController,
    rollbackLastLocalDraftChange
  };
}
