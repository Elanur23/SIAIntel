/**
 * Controlled Autonomous Remediation Phase 3A - Apply Protocol Types
 *
 * This module defines the foundation for human-approved draft apply events.
 * It is strictly types-only and does not implement runtime mutation.
 *
 * CRITICAL SAFETY RULES:
 * - auditInvalidated is hard-coded to `true`
 * - reAuditRequired is hard-coded to `true`
 * - No fields implying "publish ready" or "verified fix" are allowed
 * - Eligibility rules enforce human-only for high-risk categories
 */

import {
  RemediationCategory,
  RemediationSuggestion,
  RemediationSafetyLevel
} from './remediation-types';

export const CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY = "3A_PROTOCOL_ONLY" as const;

/**
 * Reasons why a previous audit is no longer valid.
 */
export enum AuditInvalidationReason {
  DRAFT_TEXT_CHANGED = 'DRAFT_TEXT_CHANGED',
  LANGUAGE_NODE_CHANGED = 'LANGUAGE_NODE_CHANGED',
  REMEDIATION_APPLIED = 'REMEDIATION_APPLIED',
  ROLLBACK_PERFORMED = 'ROLLBACK_PERFORMED',
  PARITY_RISK_CREATED = 'PARITY_RISK_CREATED',
  AUDIT_CONTEXT_STALE = 'AUDIT_CONTEXT_STALE'
}

/**
 * Result status of an attempt to transition from preview to applied.
 */
export enum RemediationApplyStatus {
  APPROVED_FOR_DRAFT_CHANGE = 'APPROVED_FOR_DRAFT_CHANGE',
  BLOCKED_CATEGORY_NOT_TIER1 = 'BLOCKED_CATEGORY_NOT_TIER1',
  BLOCKED_HUMAN_ONLY = 'BLOCKED_HUMAN_ONLY',
  BLOCKED_FORBIDDEN_TO_AUTOFIX = 'BLOCKED_FORBIDDEN_TO_AUTOFIX',
  BLOCKED_MISSING_SUGGESTED_TEXT = 'BLOCKED_MISSING_SUGGESTED_TEXT',
  BLOCKED_SOURCE_REVIEW = 'BLOCKED_SOURCE_REVIEW',
  BLOCKED_PROVENANCE_REVIEW = 'BLOCKED_PROVENANCE_REVIEW',
  BLOCKED_PARITY_REVIEW = 'BLOCKED_PARITY_REVIEW',
  BLOCKED_FACT_SENSITIVE = 'BLOCKED_FACT_SENSITIVE',
  BLOCKED_NUMERIC_OR_ENTITY_RISK = 'BLOCKED_NUMERIC_OR_ENTITY_RISK',
  BLOCKED_REQUIRES_REAUDIT = 'BLOCKED_REQUIRES_REAUDIT',
  ERROR_INVALID_INPUT = 'ERROR_INVALID_INPUT'
}

/**
 * Record of a successful (future) remediation application.
 */
export interface AppliedRemediationEvent {
  eventId: string;
  suggestionId: string;
  articleId: string;
  packageId: string;
  operatorId: string;
  category: RemediationCategory;
  affectedLanguage?: string;
  affectedField?: string;
  originalText: string;
  appliedText: string;
  diff: { from: string; to: string };
  auditInvalidated: true; // Hard-coded safety invariant
  reAuditRequired: true; // Hard-coded safety invariant
  createdAt: string;
  approvalTextAccepted: string[];
  confirmationMethod: string;
  phase: typeof CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY;
}

/**
 * Scoped record of content state before a remediation is applied.
 */
export interface DraftSnapshot {
  snapshotId: string;
  articleId: string;
  packageId: string;
  affectedLanguage?: string;
  affectedField?: string;
  beforeValue: string;
  createdAt: string;
  reason: string;
  linkedSuggestionId: string;
}

/**
 * Record of a successful (future) rollback operation.
 */
export interface RollbackEvent {
  rollbackId: string;
  linkedApplyEventId: string;
  linkedSnapshotId: string;
  articleId: string;
  packageId: string;
  affectedLanguage?: string;
  affectedField?: string;
  restoredText: string;
  auditInvalidated: true;
  reAuditRequired: true;
  createdAt: string;
}

/**
 * Discriminated union for apply results.
 */
export type RemediationApplyResult =
  | {
      status: RemediationApplyStatus.APPROVED_FOR_DRAFT_CHANGE;
      suggestionId: string;
      auditInvalidated: true;
      reAuditRequired: true;
      reason: string;
    }
  | {
      status: Exclude<RemediationApplyStatus, RemediationApplyStatus.APPROVED_FOR_DRAFT_CHANGE | RemediationApplyStatus.ERROR_INVALID_INPUT>;
      suggestionId?: string;
      reason: string;
      auditInvalidated: false;
      reAuditRequired: false;
    }
  | {
      status: RemediationApplyStatus.ERROR_INVALID_INPUT;
      reason: string;
      auditInvalidated: false;
      reAuditRequired: false;
    };

/**
 * Minimal state required to enforce audit invalidation safety gates.
 * This is protocol scaffolding only and does not mutate draft/vault content.
 */
export interface AuditInvalidationState {
  auditInvalidated: boolean;
  reAuditRequired: boolean;
  invalidationReason?: AuditInvalidationReason;
  invalidatedAt?: string;
}

/**
 * Request object for applying a remediation to a local draft (Phase 3C-3B-2).
 * Strictly dry-run only in this phase.
 */
export interface LocalDraftApplyRequest {
  suggestionId: string;
  language: string;
  fieldPath: string;
  category: RemediationCategory;
  requestedAt: string;
  dryRunOnly: true;
}

/**
 * Result object for a local draft apply request (Phase 3C-3B-2).
 * Confirms that no mutation occurred.
 */
export interface LocalDraftApplyRequestResult {
  accepted: boolean;
  blocked: boolean;
  reason: string;
  dryRunOnly: true;
  noMutation: true;
}

/**
 * Reasons why a real local draft apply request might be blocked (Phase 3C-3C-3A).
 */
export enum RealLocalApplyBlockReason {
  BLOCKED_NOT_FORMAT_REPAIR = 'BLOCKED_NOT_FORMAT_REPAIR',
  BLOCKED_NON_BODY_FIELD = 'BLOCKED_NON_BODY_FIELD',
  BLOCKED_MISSING_LANGUAGE = 'BLOCKED_MISSING_LANGUAGE',
  BLOCKED_MISSING_SUGGESTION_ID = 'BLOCKED_MISSING_SUGGESTION_ID',
  BLOCKED_MISSING_SUGGESTED_TEXT = 'BLOCKED_MISSING_SUGGESTED_TEXT',
  BLOCKED_ACKNOWLEDGEMENT_MISMATCH = 'BLOCKED_ACKNOWLEDGEMENT_MISMATCH',
  BLOCKED_HIGH_RISK_CATEGORY = 'BLOCKED_HIGH_RISK_CATEGORY',
  BLOCKED_DUPLICATE_CLIENT_NONCE = 'BLOCKED_DUPLICATE_CLIENT_NONCE',
  BLOCKED_TARGET_TEXT_MISMATCH = 'BLOCKED_TARGET_TEXT_MISMATCH',
  BLOCKED_REAL_APPLY_NOT_ACTIVE = 'BLOCKED_REAL_APPLY_NOT_ACTIVE'
}

/**
 * Request object for applying a remediation to a local draft (Phase 3C-3C-3A).
 * This represents a future real local apply request.
 */
export interface RealLocalDraftApplyRequest {
  suggestionId: string;
  articleId?: string;
  packageId?: string;
  language: string;
  category: RemediationCategory;
  fieldPath: 'body';
  suggestedText: string;
  originalText?: string;
  operatorAcknowledgement: {
    typedPhrase: string;
    requiredPhrase: string;
    acknowledgedAt: string;
  };
  requestedAt: string;
  clientNonce?: string;
  sessionOnly: true;
  dryRunOnly: false;
}

/**
 * Result object for a real local draft apply request (Phase 3C-3C-3A).
 * Hard-codes safety invariants for the future real apply flow.
 */
export interface RealLocalDraftApplyResult {
  success: boolean;
  blocked: boolean;
  reason: string;
  snapshotId?: string;
  appliedEventId?: string;
  affectedLanguage?: string;
  affectedField?: 'body';
  auditInvalidated: true;
  reAuditRequired: true;
  deployBlocked: true;
  noBackendMutation: true;
  vaultUnchanged: true;
  sessionOnly: true;
  dryRunOnly: false;
}

// ============================================================================
// HUMAN APPROVAL CONSTANTS
// ============================================================================

export const APPLY_APPROVAL_TEXT_DRAFT_CHANGE = "I understand this changes the draft and requires re-audit.";
export const APPLY_APPROVAL_TEXT_DIFF_REVIEWED = "I have reviewed the before/after diff.";
export const APPLY_APPROVAL_TEXT_DOES_NOT_UNLOCK_DEPLOY = "I understand this does not unlock Deploy.";

// ============================================================================
// FORBIDDEN WORDING
// ============================================================================

export const FORBIDDEN_APPLY_WORDING = [
  "Auto-fix",
  "Fix & Publish",
  "Resolve Gate",
  "Make Ready",
  "Verified Fix",
  "Safe to Deploy",
  "Source Added",
  "Provenance Verified",
  "Publish Ready"
];

/**
 * Pure helper to detect forbidden terminology in remediation labels or logs.
 */
export function containsForbiddenApplyWording(text: string): boolean {
  const normalized = text.toLowerCase();
  return FORBIDDEN_APPLY_WORDING.some(word => normalized.includes(word.toLowerCase()));
}

// ============================================================================
// ELIGIBILITY HELPERS
// ============================================================================

/**
 * Pure helper to determine if a suggestion is eligible for future draft application.
 */
export function isApplyEligibleSuggestion(suggestion: RemediationSuggestion): boolean {
  return getApplyBlockReason(suggestion) === null;
}

/**
 * Pure helper to identify the reason a suggestion is blocked from draft application.
 */
export function getApplyBlockReason(suggestion: RemediationSuggestion): RemediationApplyStatus | null {
  // Tier-1 scaffold: only FORMAT_REPAIR can be considered for future apply flow.
  switch (suggestion.category) {
    case RemediationCategory.FORMAT_REPAIR:
      break;
    case RemediationCategory.SOURCE_REVIEW:
      return RemediationApplyStatus.BLOCKED_SOURCE_REVIEW;
    case RemediationCategory.PROVENANCE_REVIEW:
      return RemediationApplyStatus.BLOCKED_PROVENANCE_REVIEW;
    case RemediationCategory.PARITY_REVIEW:
      return RemediationApplyStatus.BLOCKED_PARITY_REVIEW;
    case RemediationCategory.HUMAN_REVIEW_REQUIRED:
      return RemediationApplyStatus.BLOCKED_HUMAN_ONLY;
    default:
      return RemediationApplyStatus.BLOCKED_CATEGORY_NOT_TIER1;
  }

  // Check safety levels
  if (suggestion.safetyLevel === RemediationSafetyLevel.HUMAN_ONLY) return RemediationApplyStatus.BLOCKED_HUMAN_ONLY;
  if (suggestion.safetyLevel === RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX) return RemediationApplyStatus.BLOCKED_FORBIDDEN_TO_AUTOFIX;

  // Check content presence
  if (!suggestion.suggestedText || suggestion.suggestedText.trim() === '') return RemediationApplyStatus.BLOCKED_MISSING_SUGGESTED_TEXT;

  // Check for risk metadata (e.g., E-E-A-T or factual sensitivity)
  if (!suggestion.preservesFacts) return RemediationApplyStatus.BLOCKED_FACT_SENSITIVE;
  if (!suggestion.preservesNumbers) return RemediationApplyStatus.BLOCKED_NUMERIC_OR_ENTITY_RISK;
  if (suggestion.requiresSourceVerification) return RemediationApplyStatus.BLOCKED_SOURCE_REVIEW;

  return null; // Eligible
}

/**
 * Pure helper to determine if a real local apply request is eligible for processing.
 */
export function isRealLocalDraftApplyRequestEligible(request: RealLocalDraftApplyRequest): boolean {
  return getRealLocalDraftApplyBlockReason(request) === null;
}

/**
 * Pure helper to identify why a real local apply request is blocked.
 */
export function getRealLocalDraftApplyBlockReason(request: RealLocalDraftApplyRequest): RealLocalApplyBlockReason | null {
  // Phase 3C-3C-3A: Real apply is NOT yet active at runtime.
  // This helper is for contract hardening only.

  if (request.category !== RemediationCategory.FORMAT_REPAIR) return RealLocalApplyBlockReason.BLOCKED_NOT_FORMAT_REPAIR;
  if (request.fieldPath !== 'body') return RealLocalApplyBlockReason.BLOCKED_NON_BODY_FIELD;
  if (!request.language) return RealLocalApplyBlockReason.BLOCKED_MISSING_LANGUAGE;
  if (!request.suggestionId) return RealLocalApplyBlockReason.BLOCKED_MISSING_SUGGESTION_ID;
  if (!request.suggestedText) return RealLocalApplyBlockReason.BLOCKED_MISSING_SUGGESTED_TEXT;

  if (request.operatorAcknowledgement.typedPhrase !== request.operatorAcknowledgement.requiredPhrase) {
    return RealLocalApplyBlockReason.BLOCKED_ACKNOWLEDGEMENT_MISMATCH;
  }

  // Safety categories check (redundant but good for defense-in-depth)
  if ([
    RemediationCategory.SOURCE_REVIEW,
    RemediationCategory.PROVENANCE_REVIEW,
    RemediationCategory.PARITY_REVIEW,
    RemediationCategory.HUMAN_REVIEW_REQUIRED
  ].includes(request.category)) {
    return RealLocalApplyBlockReason.BLOCKED_HIGH_RISK_CATEGORY;
  }

  return null;
}

/**
 * Pure creator for blocked real local apply results.
 */
export function createBlockedRealLocalApplyResult(reason: RealLocalApplyBlockReason): RealLocalDraftApplyResult {
  return {
    success: false,
    blocked: true,
    reason,
    auditInvalidated: true,
    reAuditRequired: true,
    deployBlocked: true,
    noBackendMutation: true,
    vaultUnchanged: true,
    sessionOnly: true,
    dryRunOnly: false
  };
}

/**
 * Pure creator for successful real local apply results.
 */
export function createSuccessfulRealLocalApplyResult(fields: {
  snapshotId: string;
  appliedEventId: string;
  language: string;
  reason?: string;
}): RealLocalDraftApplyResult {
  return {
    success: true,
    blocked: false,
    reason: fields.reason || 'SUCCESS_LOCAL_APPLY',
    snapshotId: fields.snapshotId,
    appliedEventId: fields.appliedEventId,
    affectedLanguage: fields.language,
    affectedField: 'body',
    auditInvalidated: true,
    reAuditRequired: true,
    deployBlocked: true,
    noBackendMutation: true,
    vaultUnchanged: true,
    sessionOnly: true,
    dryRunOnly: false
  };
}

/**
 * Developer-time assertion for apply safety.
 */
export function assertApplyProtocolSafe(suggestion: RemediationSuggestion): void {
  const blockReason = getApplyBlockReason(suggestion);
  if (blockReason !== null) {
    throw new Error(`Remediation apply protocol violation: ${blockReason}`);
  }
}

/**
 * Pure helper that produces an invalidated audit state snapshot.
 * Never mutates application state; callers decide how/where to store it.
 */
export function markAuditInvalidated(
  reason: AuditInvalidationReason,
  invalidatedAt: string = new Date().toISOString()
): AuditInvalidationState {
  return {
    auditInvalidated: true,
    reAuditRequired: true,
    invalidationReason: reason,
    invalidatedAt
  };
}

/**
 * Re-audit is mandatory once auditInvalidated or reAuditRequired is true.
 */
export function requiresReAudit(state: AuditInvalidationState): boolean {
  return state.auditInvalidated || state.reAuditRequired;
}

/**
 * Deploy must remain blocked when audit state is invalidated/re-audit is required.
 */
export function isDeployBlockedByInvalidatedAudit(state: AuditInvalidationState): boolean {
  return requiresReAudit(state);
}

/**
 * Strict phase-3C protocol assertion. Throws if any safety precondition is violated.
 */
export function assertRemediationApplySafety(suggestion: RemediationSuggestion): void {
  const blockReason = getApplyBlockReason(suggestion);
  if (blockReason) {
    throw new Error(`Remediation apply protocol violation: ${blockReason}`);
  }

  assertApplyProtocolSafe(suggestion);
}

/**
 * Always returns true as per fail-closed requirement.
 */
export function requiresReAuditAfterApply(): true {
  return true;
}

/**
 * Pure creator for blocked results.
 */
export function createApplyBlockedResult(
  status: Exclude<RemediationApplyStatus, RemediationApplyStatus.APPROVED_FOR_DRAFT_CHANGE | RemediationApplyStatus.ERROR_INVALID_INPUT>,
  reason: string,
  suggestionId?: string
): RemediationApplyResult {
  return {
    status,
    suggestionId,
    reason,
    auditInvalidated: false,
    reAuditRequired: false
  };
}

/**
 * Pure creator for approved results.
 */
export function createApplyApprovedResult(
  suggestionId: string,
  reason: string
): RemediationApplyResult {
  return {
    status: RemediationApplyStatus.APPROVED_FOR_DRAFT_CHANGE,
    suggestionId,
    auditInvalidated: true,
    reAuditRequired: true,
    reason
  };
}
