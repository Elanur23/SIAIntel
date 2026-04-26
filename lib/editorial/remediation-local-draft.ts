/**
 * Controlled Autonomous Remediation Phase 3C-3A - Local Draft Apply Scaffold
 *
 * This module provides pure, side-effect-free helpers for transforming local draft
 * copies in the Warroom during the remediation flow.
 *
 * CRITICAL SAFETY RULES:
 * - Pure functions only (no side effects, no mutation of inputs)
 * - auditInvalidated is hard-coded to `true`
 * - reAuditRequired is hard-coded to `true`
 * - deployBlocked is hard-coded to `true`
 * - Tier-1 gating: Only FORMAT_REPAIR is allowed
 * - Scope: 'body' field path only
 * - No network, storage, or backend calls
 */

import {
  AppliedRemediationEvent,
  DraftSnapshot,
  AuditInvalidationState,
  AuditInvalidationReason,
  CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY,
  isApplyEligibleSuggestion,
  getApplyBlockReason
} from './remediation-apply-types';
import { RemediationSuggestion, RemediationCategory } from './remediation-types';

/**
 * The shape of the vault as used in Warroom UI state.
 */
export type LocalDraft = Record<string, { title: string; desc: string; ready: boolean }>;

export interface ApplyRemediationInput {
  localDraft: LocalDraft;
  suggestion: RemediationSuggestion;
  language: string;
  fieldPath: string;
  operatorId?: string;
  articleId?: string;
  packageId?: string;
  now?: string;
}

export interface ApplyRemediationOutput {
  nextLocalDraft: LocalDraft;
  snapshot: DraftSnapshot;
  appliedEvent: AppliedRemediationEvent;
  auditInvalidation: AuditInvalidationState;
  auditInvalidated: true;
  reAuditRequired: true;
  deployBlocked: true;
  noVaultMutation: true;
  noBackendMutation: true;
}

export interface RollbackLocalDraftInput {
  localDraft: LocalDraft;
  snapshot: DraftSnapshot;
  operatorId?: string;
  now?: string;
}

export interface RollbackLocalDraftOutput {
  restoredLocalDraft: LocalDraft;
  rollbackEvent: any; // Using any for RollbackEvent to avoid strictly importing the interface if it has issues
  auditInvalidated: true;
  reAuditRequired: true;
  deployBlocked: true;
  noVaultMutation: true;
  noBackendMutation: true;
}

/**
 * Deep clones a local draft object to ensure immutability.
 */
export function cloneLocalDraftForRemediation(draft: LocalDraft): LocalDraft {
  return JSON.parse(JSON.stringify(draft));
}

/**
 * Pure helper to apply a remediation suggestion to a local draft copy.
 */
export function applyRemediationToLocalDraft(input: ApplyRemediationInput): ApplyRemediationOutput {
  const { localDraft, suggestion, language, fieldPath, operatorId, articleId, packageId, now = new Date().toISOString() } = input;

  // 1. Validate eligibility
  const blockReason = getApplyBlockReason(suggestion);
  if (blockReason !== null) {
    throw new Error(`Remediation apply blocked: ${blockReason}`);
  }

  // 2. Strict Category Gating (FORMAT_REPAIR only for Tier-1)
  if (suggestion.category !== RemediationCategory.FORMAT_REPAIR) {
    throw new Error(`Remediation apply blocked: Category ${suggestion.category} not eligible for Tier-1 local apply`);
  }

  // 3. Scope Check (body only for Phase 3C-3A)
  if (fieldPath !== 'body') {
    throw new Error(`Remediation apply blocked: Field path ${fieldPath} not supported in Phase 3C-3A`);
  }

  // 4. Language Check
  if (!language) {
    throw new Error('Remediation apply blocked: Missing language');
  }

  const langNode = localDraft[language];
  if (!langNode) {
    throw new Error(`Remediation apply blocked: Language node ${language} not found in draft`);
  }

  // 5. Transform Content (Pure)
  const originalFullDesc = langNode.desc;
  const marker = '[BODY]';
  const startIndex = originalFullDesc.indexOf(marker);

  if (startIndex === -1) {
    throw new Error('Remediation apply blocked: [BODY] structural marker missing in draft content');
  }

  const contentStart = startIndex + marker.length;
  // Look for the next block starting with [
  const nextBlockIndex = originalFullDesc.indexOf('\n\n[', contentStart);

  let nextFullDesc: string;
  const suggestedText = suggestion.suggestedText || '';

  if (nextBlockIndex === -1) {
    // It's the last block
    nextFullDesc = originalFullDesc.substring(0, contentStart) + '\n' + suggestedText;
  } else {
    nextFullDesc = originalFullDesc.substring(0, contentStart) + '\n' + suggestedText + originalFullDesc.substring(nextBlockIndex);
  }

  // 6. Create Snapshot
  const snapshotId = `snapshot-${Math.random().toString(36).substring(2, 11)}`;
  const snapshot: DraftSnapshot = {
    snapshotId,
    articleId: articleId || 'unknown',
    packageId: packageId || 'unknown',
    affectedLanguage: language,
    affectedField: fieldPath,
    beforeValue: originalFullDesc,
    createdAt: now,
    reason: AuditInvalidationReason.REMEDIATION_APPLIED,
    linkedSuggestionId: suggestion.id
  };

  // 7. Create Event
  const eventId = `event-${Math.random().toString(36).substring(2, 11)}`;
  const appliedEvent: AppliedRemediationEvent = {
    eventId,
    suggestionId: suggestion.id,
    articleId: articleId || 'unknown',
    packageId: packageId || 'unknown',
    operatorId: operatorId || 'system',
    category: suggestion.category,
    affectedLanguage: language,
    affectedField: fieldPath,
    originalText: suggestion.originalText || '',
    appliedText: suggestedText,
    diff: { from: suggestion.originalText || '', to: suggestedText },
    auditInvalidated: true,
    reAuditRequired: true,
    createdAt: now,
    approvalTextAccepted: [
      "I understand this changes the draft and requires re-audit.",
      "I have reviewed the before/after diff.",
      "I understand this does not unlock Deploy."
    ],
    confirmationMethod: 'PURE_LOCAL_HELPER',
    phase: CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY
  };

  // 8. Create Invalidation State
  const auditInvalidation: AuditInvalidationState = {
    auditInvalidated: true,
    reAuditRequired: true,
    invalidationReason: AuditInvalidationReason.REMEDIATION_APPLIED,
    invalidatedAt: now
  };

  // 9. Return Next Draft (Cloned)
  const nextLocalDraft = cloneLocalDraftForRemediation(localDraft);
  nextLocalDraft[language].desc = nextFullDesc;

  return {
    nextLocalDraft,
    snapshot,
    appliedEvent,
    auditInvalidation,
    auditInvalidated: true,
    reAuditRequired: true,
    deployBlocked: true,
    noVaultMutation: true,
    noBackendMutation: true
  };
}

/**
 * Pure helper to restore a local draft from a snapshot.
 */
export function rollbackLocalDraftFromSnapshot(input: RollbackLocalDraftInput): RollbackLocalDraftOutput {
  const { localDraft, snapshot, operatorId, now = new Date().toISOString() } = input;
  const { affectedLanguage, beforeValue } = snapshot;

  if (!affectedLanguage) {
    throw new Error('Rollback failed: Missing affected language in snapshot');
  }

  const langNode = localDraft[affectedLanguage];
  if (!langNode) {
    throw new Error(`Rollback failed: Language node ${affectedLanguage} not found in draft`);
  }

  // Restore the whole desc from beforeValue (which was the full desc at time of snapshot)
  const nextLocalDraft = cloneLocalDraftForRemediation(localDraft);
  nextLocalDraft[affectedLanguage].desc = beforeValue;

  const rollbackId = `rollback-${Math.random().toString(36).substring(2, 11)}`;
  const rollbackEvent = {
    rollbackId,
    linkedApplyEventId: 'unknown', // Would ideally come from input if tracked
    linkedSnapshotId: snapshot.snapshotId,
    articleId: snapshot.articleId,
    packageId: snapshot.packageId,
    affectedLanguage: snapshot.affectedLanguage,
    affectedField: snapshot.affectedField,
    restoredText: beforeValue,
    auditInvalidated: true,
    reAuditRequired: true,
    createdAt: now
  };

  return {
    restoredLocalDraft: nextLocalDraft,
    rollbackEvent,
    auditInvalidated: true,
    reAuditRequired: true,
    deployBlocked: true,
    noVaultMutation: true,
    noBackendMutation: true
  };
}
