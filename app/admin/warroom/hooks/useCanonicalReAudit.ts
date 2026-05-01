'use client'

import { useCallback, useRef, useState } from 'react';
import { startCanonicalReAudit } from '../handlers/canonical-reaudit-handler';
import type { CanonicalVaultInput } from '@/lib/editorial/canonical-reaudit-adapter';
import type {
  CanonicalReAuditRequest,
  CanonicalReAuditResult,
  CanonicalReAuditSnapshotIdentity,
  CanonicalReAuditStatus,
  CanonicalReAuditBlockReason
} from '@/lib/editorial/canonical-reaudit-types';

type RunCanonicalReAuditInput = {
  articleId: string;
  operatorId: string;
  canonicalSnapshot: CanonicalReAuditSnapshotIdentity;
  vault: CanonicalVaultInput;
  promotionId?: string;
  promotionArchiveId?: string;
  requestedAt?: string;
};

const STATUS_NOT_RUN = 'NOT_RUN' as CanonicalReAuditStatus;
const STATUS_RUNNING = 'RUNNING' as CanonicalReAuditStatus;
const STATUS_BLOCKED = 'BLOCKED' as CanonicalReAuditStatus;

const REASON_UNKNOWN = 'UNKNOWN' as CanonicalReAuditBlockReason;
const REASON_AUDIT_UNAVAILABLE = 'AUDIT_RUNNER_UNAVAILABLE' as CanonicalReAuditBlockReason;
const REASON_AUDIT_FAILED = 'AUDIT_RUNNER_FAILED' as CanonicalReAuditBlockReason;

const createFallbackSnapshot = (
  snapshot?: CanonicalReAuditSnapshotIdentity | null
): CanonicalReAuditSnapshotIdentity =>
  snapshot ?? {
    contentHash: 'MISSING_CANONICAL_SNAPSHOT',
    ledgerSequence: -1,
    capturedAt: new Date().toISOString(),
    source: 'canonical-vault'
  };

const createSafeBlockedResult = (input: {
  request?: CanonicalReAuditRequest;
  snapshot?: CanonicalReAuditSnapshotIdentity | null;
  reason?: CanonicalReAuditBlockReason;
  message?: string;
  auditor?: string;
}): CanonicalReAuditResult => {
  const auditedSnapshot = createFallbackSnapshot(
    input.snapshot ?? input.request?.canonicalSnapshot
  );
  const auditor =
    input.request?.operatorId?.trim().length
      ? input.request.operatorId
      : input.auditor ?? 'UNKNOWN';
  const errors = input.message ? [input.message] : undefined;

  return {
    status: STATUS_BLOCKED,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot,
    auditedAt: new Date().toISOString(),
    auditor,
    promotionId: input.request?.promotionId,
    blockReason: input.reason ?? REASON_UNKNOWN,
    errors
  };
};

const validateResultSafety = (
  result: CanonicalReAuditResult
): { ok: true } | { ok: false; message: string } => {
  if (result.deployRemainsLocked !== true) {
    return { ok: false, message: 'Unsafe result: deployRemainsLocked must be true.' };
  }
  if (result.globalAuditOverwriteAllowed !== false) {
    return { ok: false, message: 'Unsafe result: globalAuditOverwriteAllowed must be false.' };
  }
  if (result.backendPersistenceAllowed !== false) {
    return { ok: false, message: 'Unsafe result: backendPersistenceAllowed must be false.' };
  }
  if (result.memoryOnly !== true) {
    return { ok: false, message: 'Unsafe result: memoryOnly must be true.' };
  }
  if (result.sessionAuditInherited !== false) {
    return { ok: false, message: 'Unsafe result: sessionAuditInherited must be false.' };
  }
  return { ok: true };
};

export function useCanonicalReAudit() {
  const [status, setStatus] = useState<CanonicalReAuditStatus>(STATUS_NOT_RUN);
  const [result, setResult] = useState<CanonicalReAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [snapshotIdentity, setSnapshotIdentity] =
    useState<CanonicalReAuditSnapshotIdentity | null>(null);

  const lockRef = useRef(false);

  const run = useCallback((input: RunCanonicalReAuditInput): CanonicalReAuditResult => {
    if (lockRef.current || isRunning) {
      const blocked = createSafeBlockedResult({
        snapshot: input.canonicalSnapshot,
        reason: REASON_AUDIT_UNAVAILABLE,
        message: 'Canonical re-audit is already running.'
      });
      setStatus(STATUS_BLOCKED);
      setError(blocked.errors?.[0] ?? 'Canonical re-audit is already running.');
      setResult(blocked);
      setSnapshotIdentity(blocked.auditedSnapshot);
      return blocked;
    }

    lockRef.current = true;
    setIsRunning(true);
    setError(null);
    setStatus(STATUS_RUNNING);

    const request: CanonicalReAuditRequest = {
      articleId: input.articleId,
      operatorId: input.operatorId,
      requestedAt: input.requestedAt ?? new Date().toISOString(),
      canonicalSnapshot: input.canonicalSnapshot,
      promotionId: input.promotionId,
      promotionArchiveId: input.promotionArchiveId,
      manualTrigger: true,
      memoryOnly: true,
      deployUnlockAllowed: false,
      backendPersistenceAllowed: false,
      sessionAuditInheritanceAllowed: false
    };

    try {
      const handlerResult = startCanonicalReAudit(request, input.vault);
      const safety = validateResultSafety(handlerResult);

      let safeResult = handlerResult;
      if (!safety.ok) {
        safeResult = createSafeBlockedResult({
          request,
          snapshot: request.canonicalSnapshot,
          reason: REASON_UNKNOWN,
          message: safety.message
        });
        setError(safety.message);
      }

      setStatus(safeResult.status);
      setResult(safeResult);
      setSnapshotIdentity(safeResult.auditedSnapshot);
      return safeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error.';
      const blocked = createSafeBlockedResult({
        request,
        snapshot: request.canonicalSnapshot,
        reason: REASON_AUDIT_FAILED,
        message
      });
      setStatus(STATUS_BLOCKED);
      setError(message);
      setResult(blocked);
      setSnapshotIdentity(blocked.auditedSnapshot);
      return blocked;
    } finally {
      lockRef.current = false;
      setIsRunning(false);
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    setStatus(STATUS_NOT_RUN);
    setResult(null);
    setError(null);
    setIsRunning(false);
    setSnapshotIdentity(null);
    lockRef.current = false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    isRunning,
    snapshotIdentity,
    run,
    reset,
    clearError
  };
}
