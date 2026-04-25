/**
 * Controlled Remediation Phase 1 - Type Contract Verification Script
 * 
 * This script validates that the remediation type contract enforces all safety invariants.
 * It constructs representative suggestions and validates fail-closed behavior.
 * 
 * CONSTRAINTS:
 * - No network access
 * - No file system mutations
 * - No external service calls (git, Vercel, publish APIs)
 * - No Warroom vault modifications
 * - Pure validation only
 * 
 * EXIT CODES:
 * - 0: All tests pass
 * - 1: One or more tests fail
 */

import {
  RemediationSource,
  RemediationCategory,
  RemediationSafetyLevel,
  RemediationSeverity,
  RemediationFixType,
  RemediationSuggestion,
  RemediationPlan,
  isHumanOnlySuggestion,
  requiresApproval,
  canOnlySuggest,
  assertNoForbiddenAutomation,
  validateRemediationPlan
} from '../lib/editorial/remediation-types';

// Test failure tracking
const failures: string[] = [];

/**
 * Assertion helper that collects failures instead of throwing immediately.
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures.push(`✗ ${message}`);
  }
}

/**
 * Test Case 1: Residue Removal Suggestion
 * 
 * Validates that residue removal suggestions:
 * - Have REQUIRES_HUMAN_APPROVAL safety level
 * - Require human approval
 * - Have all automation flags set to forbidden
 */
function testResidueRemoval(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-residue-1',
    issueId: 'issue-residue-1',
    source: RemediationSource.globalAudit,
    category: RemediationCategory.RESIDUE_REMOVAL,
    severity: RemediationSeverity.WARNING,
    safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    affectedLanguage: 'en',
    affectedField: 'body',
    issueType: 'residue_detected',
    issueDescription: 'Detected residual text from previous version',
    originalText: 'This is residual text that should be removed.',
    suggestedText: '',
    rationale: 'Remove residual text to maintain content integrity',
    fixType: RemediationFixType.remove,
    confidence: 0.95,
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
    validationTests: ['residue_removal_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.safetyLevel === RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    'Test 1: Residue removal has REQUIRES_HUMAN_APPROVAL safety level'
  );
  assert(
    suggestion.requiresHumanApproval === true,
    'Test 1: Residue removal requires human approval'
  );
  assert(
    suggestion.cannotAutoPublish === true,
    'Test 1: Residue removal has cannotAutoPublish true'
  );
  assert(
    suggestion.cannotAutoCommit === true,
    'Test 1: Residue removal has cannotAutoCommit true'
  );
  assert(
    suggestion.cannotAutoPush === true,
    'Test 1: Residue removal has cannotAutoPush true'
  );
  assert(
    suggestion.cannotAutoDeploy === true,
    'Test 1: Residue removal has cannotAutoDeploy true'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 1: Residue Removal Suggestion');
  } catch (error) {
    failures.push(`✗ Test 1: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 2: Formatting-Only Suggestion
 * 
 * Validates that formatting-only suggestions:
 * - Have SAFE_FORMAT_ONLY safety level
 * - May have canApplyToDraft true
 * - Still have all automation flags set to forbidden
 */
function testFormattingOnly(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-format-1',
    source: RemediationSource.pandaValidator,
    category: RemediationCategory.FORMAT_REPAIR,
    severity: RemediationSeverity.INFO,
    safetyLevel: RemediationSafetyLevel.SAFE_FORMAT_ONLY,
    affectedLanguage: 'en',
    affectedField: 'headline',
    issueType: 'formatting_issue',
    issueDescription: 'Extra whitespace detected',
    originalText: 'Breaking  News',
    suggestedText: 'Breaking News',
    rationale: 'Remove extra whitespace for consistency',
    fixType: RemediationFixType.format,
    confidence: 1.0,
    requiresHumanApproval: false,
    canApplyToDraft: true,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: true,
    preservesNumbers: true,
    preservesProvenance: true,
    requiresSourceVerification: false,
    validationTests: ['whitespace_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.safetyLevel === RemediationSafetyLevel.SAFE_FORMAT_ONLY,
    'Test 2: Formatting-only has SAFE_FORMAT_ONLY safety level'
  );
  assert(
    suggestion.cannotAutoPublish === true,
    'Test 2: Formatting-only still has cannotAutoPublish true'
  );
  assert(
    suggestion.cannotAutoCommit === true,
    'Test 2: Formatting-only still has cannotAutoCommit true'
  );
  assert(
    suggestion.cannotAutoPush === true,
    'Test 2: Formatting-only still has cannotAutoPush true'
  );
  assert(
    suggestion.cannotAutoDeploy === true,
    'Test 2: Formatting-only still has cannotAutoDeploy true'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 2: Formatting-Only Suggestion');
  } catch (error) {
    failures.push(`✗ Test 2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 3: Fake Verification Removal
 * 
 * Validates that fake claim removal suggestions:
 * - Require human approval
 * - Preserve provenance or require source verification
 * - Have all automation flags set to forbidden
 */
function testFakeVerificationRemoval(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-fake-1',
    source: RemediationSource.sentinel,
    category: RemediationCategory.FAKE_CLAIM_REMOVAL,
    severity: RemediationSeverity.CRITICAL,
    safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    affectedLanguage: 'en',
    affectedField: 'body',
    issueType: 'fake_verification_detected',
    issueDescription: 'Detected unverified claim presented as fact',
    originalText: 'This has been verified by experts.',
    suggestedText: 'This claim requires verification.',
    rationale: 'Remove unverified claim to maintain editorial integrity',
    fixType: RemediationFixType.rewrite,
    confidence: 0.85,
    requiresHumanApproval: true,
    canApplyToDraft: true,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: false,
    preservesNumbers: true,
    preservesProvenance: true,
    requiresSourceVerification: true,
    validationTests: ['fake_claim_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.requiresHumanApproval === true,
    'Test 3: Fake claim removal requires human approval'
  );
  assert(
    suggestion.preservesProvenance === true || suggestion.requiresSourceVerification === true,
    'Test 3: Fake claim removal preserves provenance or requires source verification'
  );
  assert(
    suggestion.cannotAutoPublish === true,
    'Test 3: Fake claim removal has cannotAutoPublish true'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 3: Fake Verification Removal');
  } catch (error) {
    failures.push(`✗ Test 3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 4: Deterministic Finance Neutralization
 * 
 * Validates that deterministic language neutralization:
 * - Requires human approval
 * - Either does not preserve facts OR requires source verification
 * - Has all automation flags set to forbidden
 */
function testDeterministicFinanceNeutralization(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-finance-1',
    source: RemediationSource.globalAudit,
    category: RemediationCategory.DETERMINISTIC_LANGUAGE_NEUTRALIZATION,
    severity: RemediationSeverity.HIGH,
    safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    affectedLanguage: 'en',
    affectedField: 'body',
    issueType: 'deterministic_language_detected',
    issueDescription: 'Detected deterministic financial prediction',
    originalText: 'The stock will definitely rise tomorrow.',
    suggestedText: 'The stock may rise tomorrow, according to analysts.',
    rationale: 'Neutralize deterministic language to maintain editorial standards',
    fixType: RemediationFixType.neutralize,
    confidence: 0.90,
    requiresHumanApproval: true,
    canApplyToDraft: true,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: false,
    preservesNumbers: true,
    preservesProvenance: true,
    requiresSourceVerification: true,
    validationTests: ['deterministic_language_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.requiresHumanApproval === true,
    'Test 4: Finance neutralization requires human approval'
  );
  assert(
    suggestion.preservesFacts === false || suggestion.requiresSourceVerification === true,
    'Test 4: Finance neutralization does not preserve facts OR requires source verification'
  );
  assert(
    suggestion.cannotAutoPublish === true,
    'Test 4: Finance neutralization has cannotAutoPublish true'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 4: Deterministic Finance Neutralization');
  } catch (error) {
    failures.push(`✗ Test 4: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 5: Missing Provenance/Source
 * 
 * Validates that provenance/source review suggestions:
 * - Have HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX safety level
 * - Have canApplyToDraft false
 * - Have suggestedText null (no automated suggestion possible)
 * - Require source verification
 */
function testMissingProvenanceSource(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-provenance-1',
    source: RemediationSource.globalAudit,
    category: RemediationCategory.PROVENANCE_REVIEW,
    severity: RemediationSeverity.CRITICAL,
    safetyLevel: RemediationSafetyLevel.HUMAN_ONLY,
    affectedLanguage: 'en',
    affectedField: 'metadata',
    issueType: 'missing_provenance',
    issueDescription: 'Article missing provenance data',
    originalText: undefined,
    suggestedText: null,
    rationale: 'Provenance data must be manually verified and added by human editor',
    fixType: RemediationFixType.request_source,
    confidence: undefined,
    requiresHumanApproval: true,
    canApplyToDraft: false,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: true,
    preservesNumbers: true,
    preservesProvenance: false,
    requiresSourceVerification: true,
    validationTests: ['provenance_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.safetyLevel === RemediationSafetyLevel.HUMAN_ONLY ||
    suggestion.safetyLevel === RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX,
    'Test 5: Provenance review has HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX safety level'
  );
  assert(
    suggestion.canApplyToDraft === false,
    'Test 5: Provenance review has canApplyToDraft false'
  );
  assert(
    suggestion.suggestedText === null,
    'Test 5: Provenance review has suggestedText null'
  );
  assert(
    suggestion.requiresSourceVerification === true,
    'Test 5: Provenance review requires source verification'
  );
  assert(
    isHumanOnlySuggestion(suggestion) === true,
    'Test 5: isHumanOnlySuggestion returns true for provenance review'
  );
  assert(
    canOnlySuggest(suggestion) === true,
    'Test 5: canOnlySuggest returns true for provenance review'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 5: Missing Provenance/Source');
  } catch (error) {
    failures.push(`✗ Test 5: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 6: Numeric Parity Mismatch
 * 
 * Validates that parity review suggestions:
 * - Have HUMAN_ONLY safety level
 * - Have canApplyToDraft false
 * - Have suggestedText null (no automated suggestion possible)
 */
function testNumericParityMismatch(): void {
  const suggestion: RemediationSuggestion = {
    id: 'test-parity-1',
    source: RemediationSource.pandaValidator,
    category: RemediationCategory.PARITY_REVIEW,
    severity: RemediationSeverity.CRITICAL,
    safetyLevel: RemediationSafetyLevel.HUMAN_ONLY,
    affectedLanguage: 'es',
    affectedField: 'body',
    issueType: 'numeric_parity_mismatch',
    issueDescription: 'Numeric value differs between English and Spanish versions',
    originalText: 'El precio es $100',
    suggestedText: null,
    rationale: 'Numeric parity mismatch requires human verification of correct value',
    fixType: RemediationFixType.request_human_review,
    confidence: undefined,
    requiresHumanApproval: true,
    canApplyToDraft: false,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: true,
    preservesNumbers: false,
    preservesProvenance: true,
    requiresSourceVerification: true,
    validationTests: ['parity_validation'],
    createdAt: new Date().toISOString()
  };

  assert(
    suggestion.category === RemediationCategory.PARITY_REVIEW,
    'Test 6: Suggestion is PARITY_REVIEW category'
  );
  assert(
    suggestion.safetyLevel === RemediationSafetyLevel.HUMAN_ONLY,
    'Test 6: Parity review has HUMAN_ONLY safety level'
  );
  assert(
    suggestion.canApplyToDraft === false,
    'Test 6: Parity review has canApplyToDraft false'
  );
  assert(
    suggestion.suggestedText === null,
    'Test 6: Parity review has suggestedText null'
  );
  assert(
    isHumanOnlySuggestion(suggestion) === true,
    'Test 6: isHumanOnlySuggestion returns true for parity review'
  );

  try {
    assertNoForbiddenAutomation(suggestion);
    console.log('✓ Test 6: Numeric Parity Mismatch');
  } catch (error) {
    failures.push(`✗ Test 6: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 7: RemediationPlan Validation
 * 
 * Validates that RemediationPlan:
 * - Has publishStillBlocked === true
 * - Has totalIssues === suggestions.length
 * - Has counts matching actual suggestion categories
 */
function testRemediationPlanValidation(): void {
  const suggestions: RemediationSuggestion[] = [
    {
      id: 'plan-test-1',
      source: RemediationSource.globalAudit,
      category: RemediationCategory.FORMAT_REPAIR,
      severity: RemediationSeverity.INFO,
      safetyLevel: RemediationSafetyLevel.SAFE_FORMAT_ONLY,
      affectedField: 'headline',
      issueType: 'formatting',
      issueDescription: 'Extra whitespace',
      suggestedText: 'Fixed text',
      rationale: 'Format fix',
      fixType: RemediationFixType.format,
      requiresHumanApproval: false,
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'plan-test-2',
      source: RemediationSource.pandaValidator,
      category: RemediationCategory.PARITY_REVIEW,
      severity: RemediationSeverity.CRITICAL,
      safetyLevel: RemediationSafetyLevel.HUMAN_ONLY,
      affectedField: 'body',
      issueType: 'parity',
      issueDescription: 'Parity mismatch',
      suggestedText: null,
      rationale: 'Human review required',
      fixType: RemediationFixType.request_human_review,
      requiresHumanApproval: true,
      canApplyToDraft: false,
      cannotAutoPublish: true,
      cannotAutoCommit: true,
      cannotAutoPush: true,
      cannotAutoDeploy: true,
      preservesFacts: true,
      preservesNumbers: false,
      preservesProvenance: true,
      requiresSourceVerification: true,
      validationTests: [],
      createdAt: new Date().toISOString()
    }
  ];

  const plan: RemediationPlan = {
    articleId: 'test-article-1',
    suggestions,
    totalIssues: 2,
    safeSuggestionCount: 1,
    requiresApprovalCount: 1,
    humanOnlyCount: 1,
    criticalCount: 1,
    createdAt: new Date().toISOString(),
    publishStillBlocked: true
  };

  assert(
    plan.publishStillBlocked === true,
    'Test 7: RemediationPlan has publishStillBlocked === true'
  );
  assert(
    plan.totalIssues === plan.suggestions.length,
    'Test 7: RemediationPlan totalIssues matches suggestions.length'
  );

  try {
    validateRemediationPlan(plan);
    console.log('✓ Test 7: RemediationPlan Validation');
  } catch (error) {
    failures.push(`✗ Test 7: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test Case 8: No Forbidden Automation
 * 
 * Validates that all sample suggestions have:
 * - cannotAutoPublish === true
 * - cannotAutoCommit === true
 * - cannotAutoPush === true
 * - cannotAutoDeploy === true
 */
function testNoForbiddenAutomation(): void {
  const samples: RemediationSuggestion[] = [
    {
      id: 'auto-test-1',
      source: RemediationSource.globalAudit,
      category: RemediationCategory.RESIDUE_REMOVAL,
      severity: RemediationSeverity.WARNING,
      safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
      affectedField: 'body',
      issueType: 'residue',
      issueDescription: 'Residue detected',
      suggestedText: '',
      rationale: 'Remove residue',
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'auto-test-2',
      source: RemediationSource.pandaValidator,
      category: RemediationCategory.FORMAT_REPAIR,
      severity: RemediationSeverity.INFO,
      safetyLevel: RemediationSafetyLevel.SAFE_FORMAT_ONLY,
      affectedField: 'headline',
      issueType: 'format',
      issueDescription: 'Format issue',
      suggestedText: 'Fixed',
      rationale: 'Format fix',
      fixType: RemediationFixType.format,
      requiresHumanApproval: false,
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'auto-test-3',
      source: RemediationSource.sentinel,
      category: RemediationCategory.PROVENANCE_REVIEW,
      severity: RemediationSeverity.CRITICAL,
      safetyLevel: RemediationSafetyLevel.HUMAN_ONLY,
      affectedField: 'metadata',
      issueType: 'provenance',
      issueDescription: 'Missing provenance',
      suggestedText: null,
      rationale: 'Human review required',
      fixType: RemediationFixType.request_source,
      requiresHumanApproval: true,
      canApplyToDraft: false,
      cannotAutoPublish: true,
      cannotAutoCommit: true,
      cannotAutoPush: true,
      cannotAutoDeploy: true,
      preservesFacts: true,
      preservesNumbers: true,
      preservesProvenance: false,
      requiresSourceVerification: true,
      validationTests: [],
      createdAt: new Date().toISOString()
    }
  ];

  let allPass = true;
  for (const suggestion of samples) {
    if (suggestion.cannotAutoPublish !== true) {
      failures.push(`✗ Test 8: Suggestion ${suggestion.id} missing cannotAutoPublish === true`);
      allPass = false;
    }
    if (suggestion.cannotAutoCommit !== true) {
      failures.push(`✗ Test 8: Suggestion ${suggestion.id} missing cannotAutoCommit === true`);
      allPass = false;
    }
    if (suggestion.cannotAutoPush !== true) {
      failures.push(`✗ Test 8: Suggestion ${suggestion.id} missing cannotAutoPush === true`);
      allPass = false;
    }
    if (suggestion.cannotAutoDeploy !== true) {
      failures.push(`✗ Test 8: Suggestion ${suggestion.id} missing cannotAutoDeploy === true`);
      allPass = false;
    }
  }

  if (allPass) {
    console.log('✓ Test 8: No Forbidden Automation');
  }
}

/**
 * Main test runner
 */
function main(): void {
  console.log('\n=== Controlled Remediation Phase 1 - Type Contract Verification ===\n');

  // Run all test cases
  testResidueRemoval();
  testFormattingOnly();
  testFakeVerificationRemoval();
  testDeterministicFinanceNeutralization();
  testMissingProvenanceSource();
  testNumericParityMismatch();
  testRemediationPlanValidation();
  testNoForbiddenAutomation();

  // Report results
  console.log('\n=== Test Results ===\n');
  
  if (failures.length === 0) {
    console.log('✓ All 8 test cases passed\n');
    console.log('CONTROLLED_REMEDIATION_TYPES_VERIFICATION_PASS\n');
    process.exit(0);
  } else {
    console.log(`✗ ${failures.length} test failure(s):\n`);
    failures.forEach(failure => console.log(failure));
    console.log('\nCONTROLLED_REMEDIATION_TYPES_VERIFICATION_FAIL\n');
    process.exit(1);
  }
}

// Run tests
main();
