/**
 * Verification script for Controlled Remediation Phase 3A - Apply Protocol Types
 *
 * Validates the safety contract, eligibility rules, and hard-coded invariants.
 */

import {
  RemediationApplyStatus,
  isApplyEligibleSuggestion,
  getApplyBlockReason,
  containsForbiddenApplyWording,
  CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY,
  type AppliedRemediationEvent,
  type RollbackEvent
} from '../lib/editorial/remediation-apply-types';

import {
  RemediationCategory,
  RemediationSeverity,
  RemediationSafetyLevel,
  RemediationSource,
  RemediationFixType,
  type RemediationSuggestion
} from '../lib/editorial/remediation-types';

// ============================================================================
// TEST HARNESS
// ============================================================================

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message} (Expected ${expected}, got ${actual})`);
    process.exit(1);
  }
}

function runTest(name: string, fn: () => void) {
  console.log(`🧪 Running: ${name}`);
  try {
    fn();
    console.log(`  ✅ PASS`);
  } catch (e: any) {
    console.error(`  ❌ ERROR: ${e.message}`);
    process.exit(1);
  }
}

// ============================================================================
// FIXTURES
// ============================================================================

function createMockSuggestion(overrides: Partial<RemediationSuggestion> = {}): RemediationSuggestion {
  return {
    id: 'test-suggestion-id',
    source: RemediationSource.globalAudit,
    category: RemediationCategory.FORMAT_REPAIR,
    severity: RemediationSeverity.WARNING,
    safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    issueType: 'residue',
    issueDescription: 'Mock residue detected',
    originalText: 'residue text',
    suggestedText: 'clean text',
    rationale: 'Testing purposes',
    fixType: RemediationFixType.remove,
    requiresHumanApproval: true,
    canApplyToDraft: true,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: true,
    preservesNumbers: true,
    preservesProvenance: true,
    requiresSourceVerification: false,
    validationTests: [],
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log("=== Phase 3A Apply Protocol Verification ===\n");

runTest("Eligible Category Matrix", () => {
  // Current strict policy (Phase 3C-3C-3B-2B): Only FORMAT_REPAIR is eligible
  assert(isApplyEligibleSuggestion(createMockSuggestion({ category: RemediationCategory.FORMAT_REPAIR })), "Format repair should be eligible");

  // Previously safe but now blocked categories (Tier-1 hardening)
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.RESIDUE_REMOVAL })), RemediationApplyStatus.BLOCKED_CATEGORY_NOT_TIER1, "Residue removal must be blocked in current phase");
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.FOOTER_REPAIR })), RemediationApplyStatus.BLOCKED_CATEGORY_NOT_TIER1, "Footer repair must be blocked in current phase");

  // Blocked categories
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.SOURCE_REVIEW })), RemediationApplyStatus.BLOCKED_SOURCE_REVIEW, "Source review must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.PROVENANCE_REVIEW })), RemediationApplyStatus.BLOCKED_PROVENANCE_REVIEW, "Provenance review must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.PARITY_REVIEW })), RemediationApplyStatus.BLOCKED_PARITY_REVIEW, "Parity review must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ category: RemediationCategory.HUMAN_REVIEW_REQUIRED })), RemediationApplyStatus.BLOCKED_HUMAN_ONLY, "Human review required must be blocked");
});

runTest("Safety Level Restrictions", () => {
  assertEqual(getApplyBlockReason(createMockSuggestion({ safetyLevel: RemediationSafetyLevel.HUMAN_ONLY })), RemediationApplyStatus.BLOCKED_HUMAN_ONLY, "HUMAN_ONLY must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ safetyLevel: RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX })), RemediationApplyStatus.BLOCKED_FORBIDDEN_TO_AUTOFIX, "FORBIDDEN_TO_AUTOFIX must be blocked");
});

runTest("Suggested Text Null/Empty Blocked", () => {
  assertEqual(getApplyBlockReason(createMockSuggestion({ suggestedText: null })), RemediationApplyStatus.BLOCKED_MISSING_SUGGESTED_TEXT, "Null text must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ suggestedText: '' })), RemediationApplyStatus.BLOCKED_MISSING_SUGGESTED_TEXT, "Empty text must be blocked");
});

runTest("Risk Metadata Sensitivity", () => {
  assertEqual(getApplyBlockReason(createMockSuggestion({ preservesFacts: false })), RemediationApplyStatus.BLOCKED_FACT_SENSITIVE, "Fact sensitive must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ preservesNumbers: false })), RemediationApplyStatus.BLOCKED_NUMERIC_OR_ENTITY_RISK, "Numeric risk must be blocked");
  assertEqual(getApplyBlockReason(createMockSuggestion({ requiresSourceVerification: true })), RemediationApplyStatus.BLOCKED_SOURCE_REVIEW, "Source verification requirement must be blocked");
});

runTest("AppliedRemediationEvent Hard-coded Invariants", () => {
  const event: AppliedRemediationEvent = {
    eventId: 'evt-123',
    suggestionId: 'sug-123',
    articleId: 'art-123',
    packageId: 'pkg-123',
    operatorId: 'op-123',
    category: RemediationCategory.FORMAT_REPAIR,
    originalText: 'a',
    appliedText: 'b',
    diff: { from: 'a', to: 'b' },
    auditInvalidated: true,
    reAuditRequired: true,
    createdAt: new Date().toISOString(),
    approvalTextAccepted: ["accepted"],
    confirmationMethod: "manual",
    phase: CONTROLLED_REMEDIATION_PHASE_3A_PROTOCOL_ONLY
  };

  assertEqual(event.auditInvalidated, true, "Applied event must have auditInvalidated: true");
  assertEqual(event.reAuditRequired, true, "Applied event must have reAuditRequired: true");
});

runTest("RollbackEvent Hard-coded Invariants", () => {
  const event: RollbackEvent = {
    rollbackId: 'roll-123',
    linkedApplyEventId: 'evt-123',
    linkedSnapshotId: 'snap-123',
    articleId: 'art-123',
    packageId: 'pkg-123',
    restoredText: 'a',
    auditInvalidated: true,
    reAuditRequired: true,
    createdAt: new Date().toISOString()
  };

  assertEqual(event.auditInvalidated, true, "Rollback event must have auditInvalidated: true");
  assertEqual(event.reAuditRequired, true, "Rollback event must have reAuditRequired: true");
});

runTest("Forbidden Wording Detection", () => {
  assert(containsForbiddenApplyWording("This is an Auto-fix"), "Should detect 'Auto-fix'");
  assert(containsForbiddenApplyWording("Fix & Publish enabled"), "Should detect 'Fix & Publish'");
  assert(containsForbiddenApplyWording("Safe to Deploy verified"), "Should detect 'Safe to Deploy'");
  assert(!containsForbiddenApplyWording("Suggested changes applied"), "Should not flag safe wording");
});

console.log("\n✨ CONTROLLED_REMEDIATION_APPLY_PROTOCOL_VERIFICATION_PASS");
