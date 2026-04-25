/**
 * Controlled Remediation Phase 2A - Generator Verification Script
 * 
 * This script verifies that the remediation generator correctly maps
 * audit and validation findings to RemediationSuggestion objects.
 * 
 * Tests:
 * 1. Empty input returns valid empty plan
 * 2. Residue finding maps to RESIDUE_REMOVAL
 * 3. Fake verification maps to FAKE_CLAIM_REMOVAL
 * 4. Deterministic finance maps to DETERMINISTIC_LANGUAGE_NEUTRALIZATION
 * 5. Missing source maps to SOURCE_REVIEW with suggestedText null
 * 6. Missing provenance maps to PROVENANCE_REVIEW with suggestedText null
 * 7. Numeric parity maps to PARITY_REVIEW with suggestedText null
 * 8. Panda RESIDUE_DETECTED maps correctly
 * 9. Panda FAKE_VERIFICATION maps correctly
 * 10. Input immutability test
 * 11. Counts correctness test
 * 12. No forbidden automation flags
 * 13. publishStillBlocked is literal true
 */

import {
  generateRemediationPlan,
  suggestionsFromGlobalAudit,
  suggestionsFromPandaValidation
} from '../lib/editorial/remediation-engine';
import {
  RemediationCategory,
  RemediationSafetyLevel,
  RemediationSource,
  RemediationSeverity
} from '../lib/editorial/remediation-types';

// Test tracking
let passCount = 0;
let failCount = 0;
const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

/**
 * Runs a test and tracks the result.
 */
function runTest(name: string, testFn: () => void): void {
  try {
    testFn();
    passCount++;
    testResults.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    failCount++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, passed: false, error: errorMessage });
    console.log(`✗ ${name} - ${errorMessage}`);
  }
}

/**
 * Assertion helper.
 */
function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

/**
 * Assertion helper for null checks.
 */
function assertNotNull<T>(value: T | null | undefined, message: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${message}: value is null or undefined`);
  }
}

/**
 * Deep equality check for objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ============================================================================
// TEST 1: EMPTY INPUT
// ============================================================================

runTest('Test 1: Empty Input', () => {
  const plan1 = generateRemediationPlan(null as any);
  assertEqual(plan1.totalIssues, 0, 'Empty input (null) should have 0 issues');
  assertEqual(plan1.publishStillBlocked, true, 'Empty input (null) should have publishStillBlocked true');

  const plan2 = generateRemediationPlan(undefined as any);
  assertEqual(plan2.totalIssues, 0, 'Empty input (undefined) should have 0 issues');
  assertEqual(plan2.publishStillBlocked, true, 'Empty input (undefined) should have publishStillBlocked true');

  const plan3 = generateRemediationPlan({});
  assertEqual(plan3.totalIssues, 0, 'Empty input ({}) should have 0 issues');
  assertEqual(plan3.publishStillBlocked, true, 'Empty input ({}) should have publishStillBlocked true');
});

// ============================================================================
// TEST 2: RESIDUE FINDING
// ============================================================================

runTest('Test 2: Residue Finding', () => {
  const globalAudit = {
    en: {
      residueFindings: [
        {
          message: 'Editorial residue detected',
          type: 'residue',
          field: 'body',
          severity: 'WARNING'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.RESIDUE_REMOVAL, 'Category should be RESIDUE_REMOVAL');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL, 'Safety level should be REQUIRES_HUMAN_APPROVAL');
  assertEqual(suggestion.cannotAutoPublish, true, 'cannotAutoPublish should be true');
  assertEqual(suggestion.cannotAutoCommit, true, 'cannotAutoCommit should be true');
  assertEqual(suggestion.cannotAutoPush, true, 'cannotAutoPush should be true');
  assertEqual(suggestion.cannotAutoDeploy, true, 'cannotAutoDeploy should be true');
});

// ============================================================================
// TEST 3: FAKE VERIFICATION
// ============================================================================

runTest('Test 3: Fake Verification', () => {
  const globalAudit = {
    en: {
      provenanceFindings: [
        {
          message: 'Unsupported verification score detected',
          type: 'verification',
          field: 'provenance',
          severity: 'CRITICAL'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.FAKE_CLAIM_REMOVAL, 'Category should be FAKE_CLAIM_REMOVAL');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL, 'Safety level should be REQUIRES_HUMAN_APPROVAL');
});

// ============================================================================
// TEST 4: DETERMINISTIC FINANCE
// ============================================================================

runTest('Test 4: Deterministic Finance', () => {
  const globalAudit = {
    en: {
      criticalIssues: [
        {
          message: 'Deterministic financial prediction detected',
          type: 'critical',
          field: 'body',
          severity: 'CRITICAL'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.DETERMINISTIC_LANGUAGE_NEUTRALIZATION, 'Category should be DETERMINISTIC_LANGUAGE_NEUTRALIZATION');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL, 'Safety level should be REQUIRES_HUMAN_APPROVAL');
});

// ============================================================================
// TEST 5: MISSING SOURCE
// ============================================================================

runTest('Test 5: Missing Source', () => {
  const globalAudit = {
    en: {
      criticalIssues: [
        {
          message: 'Missing source attribution',
          type: 'critical',
          field: 'body',
          severity: 'CRITICAL'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.SOURCE_REVIEW, 'Category should be SOURCE_REVIEW');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.HUMAN_ONLY, 'Safety level should be HUMAN_ONLY');
  assertEqual(suggestion.suggestedText, null, 'suggestedText MUST be null for SOURCE_REVIEW');
  assertEqual(suggestion.canApplyToDraft, false, 'canApplyToDraft should be false for HUMAN_ONLY');
});

// ============================================================================
// TEST 6: MISSING PROVENANCE
// ============================================================================

runTest('Test 6: Missing Provenance', () => {
  const globalAudit = {
    en: {
      provenanceFindings: [
        {
          message: 'Missing provenance data',
          type: 'provenance',
          field: 'provenance',
          severity: 'CRITICAL'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.PROVENANCE_REVIEW, 'Category should be PROVENANCE_REVIEW');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.HUMAN_ONLY, 'Safety level should be HUMAN_ONLY');
  assertEqual(suggestion.suggestedText, null, 'suggestedText MUST be null for PROVENANCE_REVIEW');
  assertEqual(suggestion.canApplyToDraft, false, 'canApplyToDraft should be false for HUMAN_ONLY');
});

// ============================================================================
// TEST 7: NUMERIC PARITY
// ============================================================================

runTest('Test 7: Numeric Parity', () => {
  const globalAudit = {
    en: {
      parityFindings: [
        {
          message: 'Numeric parity mismatch detected',
          type: 'parity',
          field: 'body',
          severity: 'HIGH'
        }
      ]
    }
  };

  const suggestions = suggestionsFromGlobalAudit(globalAudit);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.PARITY_REVIEW, 'Category should be PARITY_REVIEW');
  assertEqual(suggestion.safetyLevel, RemediationSafetyLevel.HUMAN_ONLY, 'Safety level should be HUMAN_ONLY');
  assertEqual(suggestion.suggestedText, null, 'suggestedText MUST be null for PARITY_REVIEW');
  assertEqual(suggestion.canApplyToDraft, false, 'canApplyToDraft should be false for HUMAN_ONLY');
});

// ============================================================================
// TEST 8: PANDA RESIDUE_DETECTED
// ============================================================================

runTest('Test 8: Panda RESIDUE_DETECTED', () => {
  const errors = [
    {
      code: 'RESIDUE_DETECTED',
      message: 'Residue detected in content',
      lang: 'en',
      field: 'body',
      severity: 'WARNING'
    }
  ];

  const suggestions = suggestionsFromPandaValidation(errors);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.RESIDUE_REMOVAL, 'Category should be RESIDUE_REMOVAL');
  assertEqual(suggestion.source, RemediationSource.pandaValidator, 'Source should be pandaValidator');
  assertEqual(suggestion.affectedLanguage, 'en', 'Language should be preserved');
  assertEqual(suggestion.affectedField, 'body', 'Field should be preserved');
});

// ============================================================================
// TEST 9: PANDA FAKE_VERIFICATION
// ============================================================================

runTest('Test 9: Panda FAKE_VERIFICATION', () => {
  const errors = [
    {
      code: 'FAKE_VERIFICATION',
      message: 'Fake verification detected',
      lang: 'es',
      field: 'provenance',
      severity: 'CRITICAL'
    }
  ];

  const suggestions = suggestionsFromPandaValidation(errors);
  assertEqual(suggestions.length, 1, 'Should have 1 suggestion');
  
  const suggestion = suggestions[0];
  assertEqual(suggestion.category, RemediationCategory.FAKE_CLAIM_REMOVAL, 'Category should be FAKE_CLAIM_REMOVAL');
  assertEqual(suggestion.source, RemediationSource.pandaValidator, 'Source should be pandaValidator');
  assertEqual(suggestion.affectedLanguage, 'es', 'Language should be preserved');
});

// ============================================================================
// TEST 10: INPUT IMMUTABILITY
// ============================================================================

runTest('Test 10: Input Immutability', () => {
  const input = {
    articleId: 'test-123',
    globalAudit: {
      en: {
        residueFindings: [
          { message: 'Test', type: 'residue' }
        ]
      }
    },
    pandaValidationErrors: [
      { code: 'RESIDUE_DETECTED', message: 'Test' }
    ]
  };

  const inputCopy = JSON.parse(JSON.stringify(input));
  
  generateRemediationPlan(input);
  
  if (!deepEqual(input, inputCopy)) {
    throw new Error('Input was mutated');
  }
});

// ============================================================================
// TEST 11: COUNTS CORRECTNESS
// ============================================================================

runTest('Test 11: Counts Correctness', () => {
  const input = {
    articleId: 'test-123',
    globalAudit: {
      en: {
        residueFindings: [
          { message: 'Residue 1', type: 'residue', severity: 'WARNING' }
        ],
        criticalIssues: [
          { message: 'Missing source', type: 'critical', severity: 'CRITICAL' }
        ]
      }
    },
    pandaValidationErrors: [
      { code: 'RESIDUE_DETECTED', message: 'Residue 2', severity: 'WARNING' }
    ]
  };

  const plan = generateRemediationPlan(input);
  
  assertEqual(plan.totalIssues, 3, 'Total issues should be 3');
  assertEqual(plan.requiresApprovalCount, 3, 'Requires approval count should be 3 (all require approval)');
  assertEqual(plan.humanOnlyCount, 1, 'Human only count should be 1 (1 SOURCE_REVIEW)');
  assertEqual(plan.criticalCount, 1, 'Critical count should be 1');
});

// ============================================================================
// TEST 12: NO FORBIDDEN AUTOMATION
// ============================================================================

runTest('Test 12: No Forbidden Automation', () => {
  const input = {
    globalAudit: {
      en: {
        residueFindings: [
          { message: 'Test', type: 'residue' }
        ]
      }
    }
  };

  const plan = generateRemediationPlan(input);
  
  for (const suggestion of plan.suggestions) {
    assertEqual(suggestion.cannotAutoPublish, true, 'cannotAutoPublish must be true');
    assertEqual(suggestion.cannotAutoCommit, true, 'cannotAutoCommit must be true');
    assertEqual(suggestion.cannotAutoPush, true, 'cannotAutoPush must be true');
    assertEqual(suggestion.cannotAutoDeploy, true, 'cannotAutoDeploy must be true');
  }
});

// ============================================================================
// TEST 13: PUBLISHSTILLBLOCKED IS LITERAL TRUE
// ============================================================================

runTest('Test 13: publishStillBlocked is Literal True', () => {
  const plan1 = generateRemediationPlan({});
  assertEqual(plan1.publishStillBlocked, true, 'publishStillBlocked must be literal true (empty plan)');

  const plan2 = generateRemediationPlan({
    globalAudit: {
      en: {
        residueFindings: [{ message: 'Test', type: 'residue' }]
      }
    }
  });
  assertEqual(plan2.publishStillBlocked, true, 'publishStillBlocked must be literal true (with suggestions)');
});

// ============================================================================
// PRINT RESULTS
// ============================================================================

console.log('\n' + '='.repeat(60));
if (failCount === 0) {
  console.log(`All ${passCount} tests passed`);
  console.log('\nCONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS');
  console.log('='.repeat(60));
  process.exit(0);
} else {
  console.log(`${failCount} test(s) failed`);
  console.log('\nCONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_FAIL');
  console.log('='.repeat(60));
  process.exit(1);
}
