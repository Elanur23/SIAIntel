/**
 * Controlled Autonomous Remediation Phase 2A - Read-Only Generator
 * 
 * This module provides a pure, deterministic, read-only remediation suggestion generator
 * that maps audit and validation findings into structured RemediationSuggestion objects.
 * 
 * CRITICAL SAFETY RULES:
 * - Generator is pure (no side effects, no mutations, deterministic)
 * - No input mutation
 * - No network calls
 * - No filesystem writes
 * - No git/Vercel/publish API calls
 * - No UI imports
 * - No Warroom page imports
 * - All suggestions have cannotAutoPublish/Commit/Push/Deploy === true
 * - publishStillBlocked is literal type `true`
 * - PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW have suggestedText === null
 * - No source/provenance/E-E-A-T/fact/number fabrication
 * - Conservative fallback to HUMAN_REVIEW_REQUIRED when uncertain
 * 
 * Phase 2A does NOT include:
 * - Warroom UI integration
 * - RemediationPanel component
 * - Apply to Draft functionality
 * - API routes
 * - Vault content mutation
 * - Runtime remediation application
 * - Auto-fix/publish/commit/push/deploy capabilities
 */

import crypto from 'crypto';
import {
  RemediationSuggestion,
  RemediationPlan,
  RemediationSource,
  RemediationCategory,
  RemediationSeverity,
  RemediationSafetyLevel,
  RemediationFixType,
  assertNoForbiddenAutomation,
  validateRemediationPlan,
  isHumanOnlySuggestion
} from './remediation-types';

/**
 * Input interface for the remediation generator.
 * All fields are optional to support partial input and graceful degradation.
 */
export interface GeneratorInput {
  /** Article ID (optional) */
  articleId?: string;
  /** Package ID (optional) */
  packageId?: string;
  /** Global Governance Audit result (optional, structure unknown) */
  globalAudit?: unknown;
  /** Panda Intake Validator errors (optional, structure unknown) */
  pandaValidationErrors?: unknown[];
  /** Deploy lock reasons (optional, may be used in future) */
  deployLockReasons?: unknown[];
  /** Generic audit result (optional, may be used in future) */
  auditResult?: unknown;
}

/**
 * Internal type for base suggestion parameters.
 */
interface BaseSuggestionParams {
  articleId?: string;
  source: RemediationSource;
  category: RemediationCategory;
  severity: RemediationSeverity;
  safetyLevel: RemediationSafetyLevel;
  affectedLanguage?: string;
  affectedField?: string;
  issueType: string;
  issueDescription: string;
  originalText?: string;
  suggestedText?: string | null;
  rationale: string;
  fixType: RemediationFixType;
  confidence?: number;
}

/**
 * Internal type for plan counts.
 */
interface PlanCounts {
  totalIssues: number;
  safeSuggestionCount: number;
  requiresApprovalCount: number;
  humanOnlyCount: number;
  criticalCount: number;
}

// ============================================================================
// SAFE ACCESS HELPERS
// ============================================================================

/**
 * Safely extracts a string from an unknown value.
 * @param value - The unknown value to extract from
 * @param fallback - Fallback value if extraction fails (default: '')
 * @returns The extracted string or fallback
 */
function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}

/**
 * Safely extracts an array from an unknown value.
 * @param value - The unknown value to extract from
 * @returns The extracted array or empty array
 */
function safeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Safely extracts an object from an unknown value.
 * @param value - The unknown value to extract from
 * @returns The extracted object or null
 */
function safeObject(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Normalizes severity input to RemediationSeverity enum.
 * @param input - The unknown severity value
 * @returns Normalized RemediationSeverity (fallback: WARNING)
 */
function normalizeSeverity(input: unknown): RemediationSeverity {
  const str = safeString(input).toUpperCase();
  if (str === 'INFO') return RemediationSeverity.INFO;
  if (str === 'WARNING') return RemediationSeverity.WARNING;
  if (str === 'HIGH') return RemediationSeverity.HIGH;
  if (str === 'CRITICAL') return RemediationSeverity.CRITICAL;
  return RemediationSeverity.WARNING; // Conservative fallback
}

// ============================================================================
// DETERMINISTIC ID GENERATION
// ============================================================================

/**
 * Generates a stable, deterministic ID for a remediation suggestion.
 * Uses SHA-256 hash of (articleId + category + field + language).
 * 
 * @param articleId - Article ID
 * @param category - Remediation category
 * @param field - Affected field
 * @param language - Affected language
 * @returns 16-character hex string ID
 */
function stableSuggestionId(
  articleId: string,
  category: string,
  field: string,
  language: string
): string {
  const input = `${articleId || 'unknown'}:${category}:${field || 'unknown'}:${language || 'unknown'}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// ============================================================================
// BASE SUGGESTION CREATOR
// ============================================================================

/**
 * Creates a RemediationSuggestion with all required fields and safety flags.
 * Ensures all fail-closed invariants are set correctly.
 * 
 * @param params - Base suggestion parameters
 * @returns Complete RemediationSuggestion
 * @throws Error if safety invariants are violated
 */
function createBaseSuggestion(params: BaseSuggestionParams): RemediationSuggestion {
  const {
    articleId,
    source,
    category,
    severity,
    safetyLevel,
    affectedLanguage,
    affectedField,
    issueType,
    issueDescription,
    originalText,
    suggestedText,
    rationale,
    fixType,
    confidence
  } = params;

  // Generate deterministic ID
  const id = stableSuggestionId(
    articleId || 'unknown',
    category,
    affectedField || 'unknown',
    affectedLanguage || 'unknown'
  );

  // Set requiresHumanApproval (true except for SAFE_FORMAT_ONLY)
  const requiresHumanApproval = safetyLevel !== RemediationSafetyLevel.SAFE_FORMAT_ONLY;

  // Set canApplyToDraft (false for HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX)
  const canApplyToDraft = safetyLevel !== RemediationSafetyLevel.HUMAN_ONLY &&
                          safetyLevel !== RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX;

  // Set content integrity flags based on category
  const preservesFacts = category === RemediationCategory.FORMAT_REPAIR ||
                         category === RemediationCategory.RESIDUE_REMOVAL;
  
  const preservesNumbers = category !== RemediationCategory.PARITY_REVIEW &&
                           !issueType.toLowerCase().includes('numeric');
  
  const preservesProvenance = category !== RemediationCategory.PROVENANCE_REVIEW;
  
  const requiresSourceVerification = category === RemediationCategory.SOURCE_REVIEW ||
                                     category === RemediationCategory.PROVENANCE_REVIEW;

  const suggestion: RemediationSuggestion = {
    id,
    source,
    category,
    severity,
    safetyLevel,
    affectedLanguage,
    affectedField,
    issueType,
    issueDescription,
    originalText,
    suggestedText,
    rationale,
    fixType,
    confidence,
    requiresHumanApproval,
    canApplyToDraft,
    // Fail-closed safety flags (MUST always be true)
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    // Content integrity flags
    preservesFacts,
    preservesNumbers,
    preservesProvenance,
    requiresSourceVerification,
    // Validation tests
    validationTests: ['assertNoForbiddenAutomation', 'validateRemediationPlan'],
    // Audit trail
    createdAt: new Date().toISOString()
  };

  // Validate safety invariants before returning
  assertNoForbiddenAutomation(suggestion);

  return suggestion;
}


// ============================================================================
// FINDING CLASSIFICATION
// ============================================================================

/**
 * Classifies a finding into a RemediationCategory.
 * Returns null for unclassifiable findings (conservative fallback).
 * 
 * @param finding - The unknown finding object
 * @returns RemediationCategory or null if unclassifiable
 */
function classifyFinding(finding: unknown): RemediationCategory | null {
  const obj = safeObject(finding);
  if (!obj) return null;

  const message = safeString(obj.message || obj.description || obj.issue).toLowerCase();
  const type = safeString(obj.type || obj.code || obj.issueType).toLowerCase();
  const combined = `${type} ${message}`;

  // Check for residue patterns
  if (combined.includes('residue') || type.includes('residue')) {
    return RemediationCategory.RESIDUE_REMOVAL;
  }

  // Check for fake verification/score patterns
  if (combined.includes('verification') || combined.includes('unsupported score') || 
      combined.includes('fake') && (combined.includes('verification') || combined.includes('score'))) {
    return RemediationCategory.FAKE_CLAIM_REMOVAL;
  }

  // Check for deterministic finance patterns
  if (combined.includes('deterministic financial') || combined.includes('deterministic') && combined.includes('financial')) {
    return RemediationCategory.DETERMINISTIC_LANGUAGE_NEUTRALIZATION;
  }

  // Check for missing source patterns
  if ((combined.includes('missing') || combined.includes('no source')) && combined.includes('source')) {
    return RemediationCategory.SOURCE_REVIEW;
  }

  // Check for missing provenance patterns
  if ((combined.includes('missing') || combined.includes('no provenance')) && combined.includes('provenance')) {
    return RemediationCategory.PROVENANCE_REVIEW;
  }

  // Check for parity patterns
  if (combined.includes('parity') || combined.includes('numeric') && combined.includes('mismatch')) {
    return RemediationCategory.PARITY_REVIEW;
  }

  // Check for malformed markdown patterns
  if (combined.includes('malformed markdown') || combined.includes('markdown') && combined.includes('malformed')) {
    return RemediationCategory.FORMAT_REPAIR;
  }

  // Check for duplicate footer patterns
  if (combined.includes('duplicate footer') || combined.includes('footer') && combined.includes('duplicate')) {
    return RemediationCategory.FOOTER_REPAIR;
  }

  // Unclassifiable - return null for conservative fallback
  return null;
}

// ============================================================================
// GLOBAL AUDIT MAPPING
// ============================================================================

/**
 * Maps a Global Governance Audit finding to a RemediationSuggestion.
 * Returns null if the finding cannot be mapped.
 * 
 * @param finding - The unknown finding object
 * @param source - The remediation source
 * @returns RemediationSuggestion or null
 */
function mapFindingToSuggestion(
  finding: unknown,
  source: RemediationSource
): RemediationSuggestion | null {
  const obj = safeObject(finding);
  if (!obj) {
    console.warn('Skipping malformed finding:', finding);
    return null;
  }

  try {
    // Extract finding metadata
    const message = safeString(obj.message || obj.description || obj.issue);
    const type = safeString(obj.type || obj.code || obj.issueType);
    const language = safeString(obj.language || obj.lang);
    const field = safeString(obj.field || obj.affectedField);
    const severityInput = obj.severity || 'WARNING';
    const severity = normalizeSeverity(severityInput);
    const originalText = safeString(obj.originalText || obj.text || '');

    // Classify finding
    let category = classifyFinding(finding);
    let safetyLevel: RemediationSafetyLevel;
    let suggestedText: string | null = null;
    let rationale: string;
    let fixType: RemediationFixType;

    // If unclassifiable, use HUMAN_REVIEW_REQUIRED
    if (category === null) {
      category = RemediationCategory.HUMAN_REVIEW_REQUIRED;
      safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
      rationale = 'Unable to classify finding; human review required';
      fixType = RemediationFixType.request_human_review;
    } else {
      // Determine safety level and suggested text based on category
      switch (category) {
        case RemediationCategory.RESIDUE_REMOVAL:
          safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
          if (originalText) {
            const excerpt = originalText.substring(0, 50);
            suggestedText = `Remove residual text: "${excerpt}${originalText.length > 50 ? '...' : ''}"`;
          }
          rationale = 'Detected editorial residue from previous version';
          fixType = RemediationFixType.remove;
          break;

        case RemediationCategory.FAKE_CLAIM_REMOVAL:
          safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
          suggestedText = null; // Conservative: no automated suggestion for fake claims
          rationale = 'Detected unsupported verification claim or score';
          fixType = RemediationFixType.remove;
          break;

        case RemediationCategory.DETERMINISTIC_LANGUAGE_NEUTRALIZATION:
          safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
          suggestedText = "Replace deterministic claim with neutral language (e.g., 'may', 'could', 'according to')";
          rationale = 'Deterministic financial prediction detected';
          fixType = RemediationFixType.neutralize;
          break;

        case RemediationCategory.SOURCE_REVIEW:
          safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
          suggestedText = null; // MUST be null - cannot fabricate sources
          rationale = 'Missing or insufficient source attribution';
          fixType = RemediationFixType.request_source;
          break;

        case RemediationCategory.PROVENANCE_REVIEW:
          safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
          suggestedText = null; // MUST be null - cannot fabricate provenance
          rationale = 'Missing or insufficient provenance data';
          fixType = RemediationFixType.request_source;
          break;

        case RemediationCategory.PARITY_REVIEW:
          safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
          suggestedText = null; // MUST be null - cannot fabricate numbers
          rationale = 'Numeric or entity parity mismatch detected';
          fixType = RemediationFixType.request_human_review;
          break;

        case RemediationCategory.FORMAT_REPAIR:
          safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
          suggestedText = 'Remove extra whitespace and fix markdown syntax';
          rationale = 'Malformed markdown prefixes detected';
          fixType = RemediationFixType.format;
          break;

        case RemediationCategory.FOOTER_REPAIR:
          safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
          suggestedText = 'Remove duplicate footer content';
          rationale = 'Duplicate footer detected';
          fixType = RemediationFixType.remove;
          break;

        case RemediationCategory.HUMAN_REVIEW_REQUIRED:
        default:
          safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
          suggestedText = null;
          rationale = 'Issue requires human review';
          fixType = RemediationFixType.request_human_review;
          break;
      }
    }

    // Create suggestion
    return createBaseSuggestion({
      source,
      category,
      severity,
      safetyLevel,
      affectedLanguage: language || undefined,
      affectedField: field || undefined,
      issueType: type || 'unknown',
      issueDescription: message || 'No description provided',
      originalText: originalText || undefined,
      suggestedText,
      rationale,
      fixType,
      confidence: category === RemediationCategory.FORMAT_REPAIR ? 0.90 : 0.75
    });
  } catch (error) {
    console.warn('Error mapping finding to suggestion:', error);
    return null;
  }
}


// ============================================================================
// PANDA VALIDATION MAPPING
// ============================================================================

/**
 * Maps a Panda Intake Validator error to a RemediationSuggestion.
 * Returns null if the error cannot be mapped.
 * 
 * @param error - The unknown error object
 * @returns RemediationSuggestion or null
 */
function mapPandaErrorToSuggestion(error: unknown): RemediationSuggestion | null {
  const obj = safeObject(error);
  if (!obj) {
    console.warn('Skipping malformed Panda error:', error);
    return null;
  }

  try {
    // Extract error metadata
    const code = safeString(obj.code || obj.errorCode);
    const message = safeString(obj.message || obj.description);
    const lang = safeString(obj.lang || obj.language);
    const field = safeString(obj.field || obj.affectedField);
    const severityInput = obj.severity || 'WARNING';
    const severity = normalizeSeverity(severityInput);

    let category: RemediationCategory;
    let safetyLevel: RemediationSafetyLevel;
    let suggestedText: string | null = null;
    let rationale: string;
    let fixType: RemediationFixType;

    // Map error codes to categories
    switch (code) {
      case 'RESIDUE_DETECTED':
        category = RemediationCategory.RESIDUE_REMOVAL;
        safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
        suggestedText = 'Remove detected residual content';
        rationale = 'Panda validator detected editorial residue';
        fixType = RemediationFixType.remove;
        break;

      case 'FAKE_VERIFICATION':
        category = RemediationCategory.FAKE_CLAIM_REMOVAL;
        safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
        suggestedText = null; // Conservative: no automated suggestion
        rationale = 'Panda validator detected fake verification claim';
        fixType = RemediationFixType.remove;
        break;

      case 'UNSUPPORTED_SCORE':
        category = RemediationCategory.FAKE_CLAIM_REMOVAL;
        safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
        suggestedText = null; // Conservative: no automated suggestion
        rationale = 'Panda validator detected unsupported score';
        fixType = RemediationFixType.remove;
        break;

      case 'PROVENANCE_FAILURE':
        category = RemediationCategory.PROVENANCE_REVIEW;
        safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
        suggestedText = null; // MUST be null - cannot fabricate provenance
        rationale = 'Panda validator detected provenance failure';
        fixType = RemediationFixType.request_source;
        break;

      case 'LANGUAGE_MISSING':
        category = RemediationCategory.HUMAN_REVIEW_REQUIRED;
        safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
        suggestedText = null;
        rationale = 'Panda validator detected missing language';
        fixType = RemediationFixType.request_human_review;
        break;

      case 'LANGUAGE_MISMATCH':
        category = RemediationCategory.HUMAN_REVIEW_REQUIRED;
        safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
        suggestedText = null;
        rationale = 'Panda validator detected language mismatch';
        fixType = RemediationFixType.request_human_review;
        break;

      case 'FOOTER_INTEGRITY_FAILURE':
        category = RemediationCategory.FOOTER_REPAIR;
        safetyLevel = RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL;
        suggestedText = 'Repair footer integrity';
        rationale = 'Panda validator detected footer integrity failure';
        fixType = RemediationFixType.format;
        break;

      case 'MALFORMED_JSON':
        category = RemediationCategory.HUMAN_REVIEW_REQUIRED;
        safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
        suggestedText = null;
        rationale = 'Panda validator detected malformed JSON';
        fixType = RemediationFixType.request_human_review;
        break;

      default:
        // Unknown error code - conservative fallback
        category = RemediationCategory.HUMAN_REVIEW_REQUIRED;
        safetyLevel = RemediationSafetyLevel.HUMAN_ONLY;
        suggestedText = null;
        rationale = `Panda validator error: ${code || 'unknown'}`;
        fixType = RemediationFixType.request_human_review;
        break;
    }

    // Create suggestion
    return createBaseSuggestion({
      source: RemediationSource.pandaValidator,
      category,
      severity,
      safetyLevel,
      affectedLanguage: lang || undefined,
      affectedField: field || undefined,
      issueType: code || 'unknown',
      issueDescription: message || 'No description provided',
      suggestedText,
      rationale,
      fixType,
      confidence: 0.75
    });
  } catch (error) {
    console.warn('Error mapping Panda error to suggestion:', error);
    return null;
  }
}

// ============================================================================
// PUBLIC API: SUGGESTIONS FROM GLOBAL AUDIT
// ============================================================================

/**
 * Extracts remediation suggestions from Global Governance Audit results.
 * Iterates through language-specific audit results and maps findings to suggestions.
 * 
 * @param globalAudit - The unknown global audit result object
 * @returns Array of RemediationSuggestion objects (empty if input is malformed)
 * 
 * @example
 * const suggestions = suggestionsFromGlobalAudit(auditResult);
 */
export function suggestionsFromGlobalAudit(globalAudit: unknown): RemediationSuggestion[] {
  const obj = safeObject(globalAudit);
  if (!obj) {
    return [];
  }

  const suggestions: RemediationSuggestion[] = [];

  try {
    // Iterate through language-specific audit results
    for (const [lang, langResult] of Object.entries(obj)) {
      const langObj = safeObject(langResult);
      if (!langObj) continue;

      // Extract finding arrays
      const residueFindings = safeArray(langObj.residueFindings);
      const provenanceFindings = safeArray(langObj.provenanceFindings);
      const criticalIssues = safeArray(langObj.criticalIssues);
      const warnings = safeArray(langObj.warnings);
      const parityFindings = safeArray(langObj.parityFindings);

      // Map residue findings
      for (const finding of residueFindings) {
        const suggestion = mapFindingToSuggestion(
          { ...safeObject(finding), language: lang, type: 'residue' },
          RemediationSource.globalAudit
        );
        if (suggestion) suggestions.push(suggestion);
      }

      // Map provenance findings
      for (const finding of provenanceFindings) {
        const suggestion = mapFindingToSuggestion(
          { ...safeObject(finding), language: lang, type: 'provenance' },
          RemediationSource.globalAudit
        );
        if (suggestion) suggestions.push(suggestion);
      }

      // Map critical issues
      for (const finding of criticalIssues) {
        const suggestion = mapFindingToSuggestion(
          { ...safeObject(finding), language: lang, type: 'critical' },
          RemediationSource.globalAudit
        );
        if (suggestion) suggestions.push(suggestion);
      }

      // Map warnings
      for (const finding of warnings) {
        const suggestion = mapFindingToSuggestion(
          { ...safeObject(finding), language: lang, type: 'warning' },
          RemediationSource.globalAudit
        );
        if (suggestion) suggestions.push(suggestion);
      }

      // Map parity findings
      for (const finding of parityFindings) {
        const suggestion = mapFindingToSuggestion(
          { ...safeObject(finding), language: lang, type: 'parity' },
          RemediationSource.globalAudit
        );
        if (suggestion) suggestions.push(suggestion);
      }
    }
  } catch (error) {
    console.warn('Error processing global audit:', error);
  }

  return suggestions;
}

// ============================================================================
// PUBLIC API: SUGGESTIONS FROM PANDA VALIDATION
// ============================================================================

/**
 * Extracts remediation suggestions from Panda Intake Validator errors.
 * Maps error codes to appropriate remediation categories.
 * 
 * @param errors - Array of unknown error objects
 * @returns Array of RemediationSuggestion objects (empty if input is malformed)
 * 
 * @example
 * const suggestions = suggestionsFromPandaValidation(validationErrors);
 */
export function suggestionsFromPandaValidation(errors: unknown[]): RemediationSuggestion[] {
  const errorsArray = safeArray(errors);
  const suggestions: RemediationSuggestion[] = [];

  for (const error of errorsArray) {
    const suggestion = mapPandaErrorToSuggestion(error);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}


// ============================================================================
// PLAN ASSEMBLY HELPERS
// ============================================================================

/**
 * Builds an empty RemediationPlan with all counts set to zero.
 * 
 * @param articleId - Optional article ID
 * @param packageId - Optional package ID
 * @returns Empty RemediationPlan with publishStillBlocked: true
 */
function buildEmptyPlan(articleId?: string, packageId?: string): RemediationPlan {
  return {
    articleId,
    packageId,
    suggestions: [],
    totalIssues: 0,
    safeSuggestionCount: 0,
    requiresApprovalCount: 0,
    humanOnlyCount: 0,
    criticalCount: 0,
    createdAt: new Date().toISOString(),
    publishStillBlocked: true // Literal type true
  };
}

/**
 * Calculates plan counts from an array of suggestions.
 * 
 * @param suggestions - Array of RemediationSuggestion objects
 * @returns PlanCounts object with all calculated counts
 */
function calculatePlanCounts(suggestions: RemediationSuggestion[]): PlanCounts {
  let safeSuggestionCount = 0;
  let requiresApprovalCount = 0;
  let humanOnlyCount = 0;
  let criticalCount = 0;

  for (const suggestion of suggestions) {
    // Count safe suggestions
    if (
      suggestion.safetyLevel === RemediationSafetyLevel.SAFE_FORMAT_ONLY ||
      suggestion.safetyLevel === RemediationSafetyLevel.SAFE_TEXTUAL_SUGGESTION
    ) {
      safeSuggestionCount++;
    }

    // Count suggestions requiring approval
    if (suggestion.requiresHumanApproval) {
      requiresApprovalCount++;
    }

    // Count human-only suggestions
    if (isHumanOnlySuggestion(suggestion)) {
      humanOnlyCount++;
    }

    // Count critical severity suggestions
    if (suggestion.severity === RemediationSeverity.CRITICAL) {
      criticalCount++;
    }
  }

  return {
    totalIssues: suggestions.length,
    safeSuggestionCount,
    requiresApprovalCount,
    humanOnlyCount,
    criticalCount
  };
}

/**
 * Deduplicates suggestions by ID, preserving first occurrence.
 * 
 * @param suggestions - Array of RemediationSuggestion objects
 * @returns Deduplicated array
 */
function deduplicateById(suggestions: RemediationSuggestion[]): RemediationSuggestion[] {
  const seen = new Set<string>();
  const deduplicated: RemediationSuggestion[] = [];

  for (const suggestion of suggestions) {
    if (!seen.has(suggestion.id)) {
      seen.add(suggestion.id);
      deduplicated.push(suggestion);
    }
  }

  return deduplicated;
}

// ============================================================================
// PUBLIC API: GENERATE REMEDIATION PLAN
// ============================================================================

/**
 * Generates a complete RemediationPlan from audit and validation results.
 * This is the main entry point for the remediation generator.
 * 
 * The generator is pure, deterministic, and read-only:
 * - No input mutation
 * - No side effects
 * - No network calls
 * - No filesystem writes
 * - No git/Vercel/publish API calls
 * 
 * @param input - GeneratorInput with optional audit/validation results
 * @returns RemediationPlan with suggestions and counts
 * 
 * @example
 * const plan = generateRemediationPlan({
 *   articleId: 'article-123',
 *   globalAudit: auditResult,
 *   pandaValidationErrors: validationErrors
 * });
 */
export function generateRemediationPlan(input: GeneratorInput): RemediationPlan {
  // Handle null/undefined input
  if (!input) {
    return buildEmptyPlan();
  }

  try {
    const { articleId, packageId, globalAudit, pandaValidationErrors } = input;

    // Collect suggestions from all sources
    const globalSuggestions = suggestionsFromGlobalAudit(globalAudit);
    const pandaSuggestions = suggestionsFromPandaValidation(pandaValidationErrors || []);

    // Combine all suggestions
    let allSuggestions = [...globalSuggestions, ...pandaSuggestions];

    // Deduplicate by ID
    allSuggestions = deduplicateById(allSuggestions);

    // If no suggestions, return empty plan
    if (allSuggestions.length === 0) {
      return buildEmptyPlan(articleId, packageId);
    }

    // Calculate counts
    const counts = calculatePlanCounts(allSuggestions);

    // Assemble plan
    const plan: RemediationPlan = {
      articleId,
      packageId,
      suggestions: allSuggestions,
      totalIssues: counts.totalIssues,
      safeSuggestionCount: counts.safeSuggestionCount,
      requiresApprovalCount: counts.requiresApprovalCount,
      humanOnlyCount: counts.humanOnlyCount,
      criticalCount: counts.criticalCount,
      createdAt: new Date().toISOString(),
      publishStillBlocked: true // Literal type true
    };

    // Validate plan before returning
    validateRemediationPlan(plan);

    return plan;
  } catch (error) {
    console.error('Error generating remediation plan:', error);
    // Return empty plan on error (graceful degradation)
    return buildEmptyPlan(input.articleId, input.packageId);
  }
}
