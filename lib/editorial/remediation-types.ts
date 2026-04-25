/**
 * Controlled Autonomous Remediation Phase 1 - Types-Only Foundation
 * 
 * This module provides a fail-closed type contract for structured content remediation
 * in the Warroom system. Phase 1 creates ONLY type definitions and pure helper functions.
 * 
 * CRITICAL SAFETY RULES:
 * - All remediation suggestions are purely advisory
 * - cannotAutoPublish/Commit/Push/Deploy must always be true
 * - publishStillBlocked is literal type `true` (not boolean)
 * - HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX suggestions cannot be applied to draft
 * - Source/provenance must never be fabricated
 * - E-E-A-T credentials must never be generated
 * - Numeric parity mismatches require human verification
 * 
 * Phase 1 does NOT include:
 * - Warroom UI modifications
 * - Apply to Draft functionality
 * - Runtime remediation generator
 * - Vault content mutation
 * - Any automation (auto-fix, auto-publish, auto-commit, auto-push, auto-deploy)
 */

/**
 * Identifies the origin system that detected the content issue.
 */
export enum RemediationSource {
  globalAudit = 'globalAudit',
  pandaValidator = 'pandaValidator',
  sentinel = 'sentinel',
  seo = 'seo',
  deployGate = 'deployGate',
  manualReview = 'manualReview'
}

/**
 * Classifies the type of remediation action required.
 */
export enum RemediationCategory {
  RESIDUE_REMOVAL = 'RESIDUE_REMOVAL',
  LENGTH_ADJUSTMENT = 'LENGTH_ADJUSTMENT',
  FAKE_CLAIM_REMOVAL = 'FAKE_CLAIM_REMOVAL',
  DETERMINISTIC_LANGUAGE_NEUTRALIZATION = 'DETERMINISTIC_LANGUAGE_NEUTRALIZATION',
  MISSING_FIELD_GENERATION = 'MISSING_FIELD_GENERATION',
  FOOTER_REPAIR = 'FOOTER_REPAIR',
  RISK_NOTE_ADDITION = 'RISK_NOTE_ADDITION',
  SEO_DESCRIPTION_REWRITE = 'SEO_DESCRIPTION_REWRITE',
  HEADLINE_REWRITE = 'HEADLINE_REWRITE',
  PARITY_REVIEW = 'PARITY_REVIEW',
  PROVENANCE_REVIEW = 'PROVENANCE_REVIEW',
  SOURCE_REVIEW = 'SOURCE_REVIEW',
  FORMAT_REPAIR = 'FORMAT_REPAIR',
  HUMAN_REVIEW_REQUIRED = 'HUMAN_REVIEW_REQUIRED'
}

/**
 * Defines the degree of automation safety for a remediation action.
 * 
 * - SAFE_FORMAT_ONLY: Formatting changes only (whitespace, punctuation)
 * - SAFE_TEXTUAL_SUGGESTION: Textual suggestions that preserve facts
 * - REQUIRES_HUMAN_APPROVAL: Requires explicit human approval before application
 * - HUMAN_ONLY: Can only be fixed by a human (no draft application allowed)
 * - FORBIDDEN_TO_AUTOFIX: Must never be automatically fixed
 */
export enum RemediationSafetyLevel {
  SAFE_FORMAT_ONLY = 'SAFE_FORMAT_ONLY',
  SAFE_TEXTUAL_SUGGESTION = 'SAFE_TEXTUAL_SUGGESTION',
  REQUIRES_HUMAN_APPROVAL = 'REQUIRES_HUMAN_APPROVAL',
  HUMAN_ONLY = 'HUMAN_ONLY',
  FORBIDDEN_TO_AUTOFIX = 'FORBIDDEN_TO_AUTOFIX'
}

/**
 * Indicates the severity of the issue being remediated.
 */
export enum RemediationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Specifies the type of fix operation.
 */
export enum RemediationFixType {
  remove = 'remove',
  rewrite = 'rewrite',
  truncate = 'truncate',
  expand = 'expand',
  neutralize = 'neutralize',
  format = 'format',
  add_missing_generic_text = 'add_missing_generic_text',
  request_source = 'request_source',
  request_human_review = 'request_human_review'
}

/**
 * A structured proposal for fixing a specific content issue with comprehensive safety constraints.
 * 
 * SAFETY INVARIANTS:
 * - cannotAutoPublish must always be true
 * - cannotAutoCommit must always be true
 * - cannotAutoPush must always be true
 * - cannotAutoDeploy must always be true
 * - requiresHumanApproval defaults to true unless safetyLevel is SAFE_FORMAT_ONLY
 * - If safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX, canApplyToDraft must be false
 * - suggestedText null indicates human-only review required (no automated suggestion possible)
 */
export interface RemediationSuggestion {
  // Identification
  /** Unique identifier for this remediation suggestion */
  id: string;
  /** Optional reference to the original issue that triggered this suggestion */
  issueId?: string;
  
  // Classification
  /** The origin system that detected the content issue */
  source: RemediationSource;
  /** The classification of the remediation action required */
  category: RemediationCategory;
  /** The severity of the issue being remediated */
  severity: RemediationSeverity;
  /** The degree of automation safety for this remediation action */
  safetyLevel: RemediationSafetyLevel;
  
  // Context
  /** The language code of the affected content (e.g., 'en', 'es', 'ar') */
  affectedLanguage?: string;
  /** The specific field or section affected (e.g., 'headline', 'body', 'footer') */
  affectedField?: string;
  /** The type of issue detected */
  issueType: string;
  /** Human-readable description of the issue */
  issueDescription: string;
  
  // Content
  /** The original text that needs remediation */
  originalText?: string;
  /** 
   * The suggested replacement text. 
   * null indicates human-only review required (no automated suggestion possible).
   * CRITICAL: Must be null for PROVENANCE_REVIEW, SOURCE_REVIEW, and PARITY_REVIEW.
   * CRITICAL: Must never contain fabricated sources, provenance, or E-E-A-T credentials.
   */
  suggestedText?: string | null;
  /** Explanation of why this remediation is suggested */
  rationale: string;
  
  // Fix Metadata
  /** The type of fix operation */
  fixType: RemediationFixType;
  /** Confidence score (0-1) in the suggested remediation */
  confidence?: number;
  
  // Safety Flags (Fail-Closed Defaults)
  /** 
   * Whether this suggestion requires explicit human approval before application.
   * MUST default to true unless safetyLevel is SAFE_FORMAT_ONLY.
   */
  requiresHumanApproval: boolean;
  /** 
   * Whether this suggestion can be applied to draft content.
   * MUST be false if safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX.
   */
  canApplyToDraft: boolean;
  /** 
   * Whether this suggestion can trigger automated publishing.
   * MUST always be true (fail-closed).
   */
  cannotAutoPublish: boolean;
  /** 
   * Whether this suggestion can trigger automated git commits.
   * MUST always be true (fail-closed).
   */
  cannotAutoCommit: boolean;
  /** 
   * Whether this suggestion can trigger automated git pushes.
   * MUST always be true (fail-closed).
   */
  cannotAutoPush: boolean;
  /** 
   * Whether this suggestion can trigger automated deployments.
   * MUST always be true (fail-closed).
   */
  cannotAutoDeploy: boolean;
  
  // Content Integrity Flags
  /** Whether the suggestion maintains factual accuracy */
  preservesFacts: boolean;
  /** Whether the suggestion maintains numeric accuracy */
  preservesNumbers: boolean;
  /** Whether the suggestion maintains provenance data */
  preservesProvenance: boolean;
  /** Whether the fix requires verified source material */
  requiresSourceVerification: boolean;
  
  // Validation
  /** List of validation tests that must pass before applying this suggestion */
  validationTests: string[];
  
  // Audit Trail
  /** ISO 8601 timestamp when the suggestion was created */
  createdAt: string;
  /** ISO 8601 timestamp when the suggestion was applied (null if not applied) */
  appliedAt?: string | null;
  /** User ID or identifier of who approved the suggestion (null if not approved) */
  approvedBy?: string | null;
  /** ISO 8601 timestamp when the suggestion was rejected (null if not rejected) */
  rejectedAt?: string | null;
}

/**
 * A collection of remediation suggestions with publish-blocking status.
 * 
 * CRITICAL DESIGN DECISION:
 * - publishStillBlocked is typed as literal `true` (not boolean)
 * - This enforces at compile-time that remediation suggestions NEVER unlock publish
 * - Publish gates remain controlled by existing audit systems
 * - Remediation is purely advisory and human-controlled
 */
export interface RemediationPlan {
  // Identification
  /** The article ID this plan applies to (if applicable) */
  articleId?: string;
  /** The package ID this plan applies to (if applicable) */
  packageId?: string;
  
  // Suggestions
  /** Array of remediation suggestions for this content */
  suggestions: RemediationSuggestion[];
  
  // Counts
  /** Total number of issues detected */
  totalIssues: number;
  /** Number of suggestions that are safe to apply (SAFE_FORMAT_ONLY or SAFE_TEXTUAL_SUGGESTION) */
  safeSuggestionCount: number;
  /** Number of suggestions that require human approval */
  requiresApprovalCount: number;
  /** Number of suggestions that are human-only (HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX) */
  humanOnlyCount: number;
  /** Number of critical severity issues */
  criticalCount: number;
  
  // Timestamps
  /** ISO 8601 timestamp when the plan was created */
  createdAt: string;
  
  // Publish Blocking (Literal Type)
  /**
   * Whether publish is still blocked after applying all suggestions.
   * CRITICAL: This is literal type `true`, not `boolean`.
   * Remediation suggestions NEVER unlock publish gates.
   * Publish decisions remain controlled by existing audit systems.
   */
  publishStillBlocked: true;
}

/**
 * Type guard to check if a suggestion is human-only.
 * 
 * @param suggestion - The remediation suggestion to check
 * @returns true if the suggestion has safetyLevel of HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
 * 
 * INVARIANT: If this returns true, canApplyToDraft must be false.
 */
export function isHumanOnlySuggestion(suggestion: RemediationSuggestion): boolean {
  return (
    suggestion.safetyLevel === RemediationSafetyLevel.HUMAN_ONLY ||
    suggestion.safetyLevel === RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX
  );
}

/**
 * Type guard to check if a suggestion requires human approval.
 * 
 * @param suggestion - The remediation suggestion to check
 * @returns true if the suggestion requires human approval before application
 */
export function requiresApproval(suggestion: RemediationSuggestion): boolean {
  return suggestion.requiresHumanApproval;
}

/**
 * Type guard to check if a suggestion can only be displayed (not applied to draft).
 * 
 * @param suggestion - The remediation suggestion to check
 * @returns true if the suggestion cannot be applied to draft
 */
export function canOnlySuggest(suggestion: RemediationSuggestion): boolean {
  return !suggestion.canApplyToDraft;
}

/**
 * Asserts that a suggestion does not violate fail-closed safety invariants.
 * Throws an error if any safety invariant is violated.
 * 
 * @param suggestion - The remediation suggestion to validate
 * @throws Error if any safety invariant is violated
 * 
 * CHECKS:
 * - cannotAutoPublish must be true
 * - cannotAutoCommit must be true
 * - cannotAutoPush must be true
 * - cannotAutoDeploy must be true
 * - If safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX, canApplyToDraft must be false
 */
export function assertNoForbiddenAutomation(suggestion: RemediationSuggestion): void {
  if (suggestion.cannotAutoPublish !== true) {
    throw new Error(
      `Safety violation: cannotAutoPublish must be true for suggestion ${suggestion.id}`
    );
  }
  
  if (suggestion.cannotAutoCommit !== true) {
    throw new Error(
      `Safety violation: cannotAutoCommit must be true for suggestion ${suggestion.id}`
    );
  }
  
  if (suggestion.cannotAutoPush !== true) {
    throw new Error(
      `Safety violation: cannotAutoPush must be true for suggestion ${suggestion.id}`
    );
  }
  
  if (suggestion.cannotAutoDeploy !== true) {
    throw new Error(
      `Safety violation: cannotAutoDeploy must be true for suggestion ${suggestion.id}`
    );
  }
  
  if (isHumanOnlySuggestion(suggestion) && suggestion.canApplyToDraft !== false) {
    throw new Error(
      `Safety violation: HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX suggestions must have canApplyToDraft false for suggestion ${suggestion.id}`
    );
  }
}

/**
 * Validates that a remediation plan satisfies all safety invariants.
 * Throws an error if any invariant is violated.
 * 
 * @param plan - The remediation plan to validate
 * @throws Error if any safety invariant is violated
 * 
 * CHECKS:
 * - publishStillBlocked must be true
 * - totalIssues must equal suggestions.length
 * - Counts must match actual suggestion categories/safety levels
 * - All suggestions must pass assertNoForbiddenAutomation
 */
export function validateRemediationPlan(plan: RemediationPlan): void {
  // Validate publishStillBlocked
  if (plan.publishStillBlocked !== true) {
    throw new Error(
      'Safety violation: publishStillBlocked must be literal true'
    );
  }
  
  // Validate totalIssues
  if (plan.totalIssues !== plan.suggestions.length) {
    throw new Error(
      `Plan validation error: totalIssues (${plan.totalIssues}) does not match suggestions.length (${plan.suggestions.length})`
    );
  }
  
  // Validate counts
  let actualSafeCount = 0;
  let actualRequiresApprovalCount = 0;
  let actualHumanOnlyCount = 0;
  let actualCriticalCount = 0;
  
  for (const suggestion of plan.suggestions) {
    // Validate each suggestion
    assertNoForbiddenAutomation(suggestion);
    
    // Count categories
    if (
      suggestion.safetyLevel === RemediationSafetyLevel.SAFE_FORMAT_ONLY ||
      suggestion.safetyLevel === RemediationSafetyLevel.SAFE_TEXTUAL_SUGGESTION
    ) {
      actualSafeCount++;
    }
    
    if (suggestion.requiresHumanApproval) {
      actualRequiresApprovalCount++;
    }
    
    if (isHumanOnlySuggestion(suggestion)) {
      actualHumanOnlyCount++;
    }
    
    if (suggestion.severity === RemediationSeverity.CRITICAL) {
      actualCriticalCount++;
    }
  }
  
  // Validate counts match
  if (plan.safeSuggestionCount !== actualSafeCount) {
    throw new Error(
      `Plan validation error: safeSuggestionCount (${plan.safeSuggestionCount}) does not match actual count (${actualSafeCount})`
    );
  }
  
  if (plan.requiresApprovalCount !== actualRequiresApprovalCount) {
    throw new Error(
      `Plan validation error: requiresApprovalCount (${plan.requiresApprovalCount}) does not match actual count (${actualRequiresApprovalCount})`
    );
  }
  
  if (plan.humanOnlyCount !== actualHumanOnlyCount) {
    throw new Error(
      `Plan validation error: humanOnlyCount (${plan.humanOnlyCount}) does not match actual count (${actualHumanOnlyCount})`
    );
  }
  
  if (plan.criticalCount !== actualCriticalCount) {
    throw new Error(
      `Plan validation error: criticalCount (${plan.criticalCount}) does not match actual count (${actualCriticalCount})`
    );
  }
}
