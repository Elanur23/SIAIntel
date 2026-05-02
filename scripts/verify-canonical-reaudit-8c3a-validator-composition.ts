#!/usr/bin/env node

/**
 * Verifier for Task 8C-3A-3C-2: Core Pure Runtime Validator Composition
 *
 * Validates that the validator composition module:
 * 1. Exists and exports the correct function
 * 2. Contains no forbidden imports (React, Next.js, handlers, hooks, adapters, etc.)
 * 3. Contains no forbidden side-effect patterns (async, Promise, fetch, Date, timers, etc.)
 * 4. Contains no mutation/persistence/deploy unlock logic
 * 5. Imports existing guards and factories
 * 6. Does not manually create validation result objects when factories are available
 * 7. Validates correctly on positive and negative fixtures
 * 8. Remains synchronous and deterministic
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TARGET_FILE = 'lib/editorial/canonical-reaudit-registration-preview-assessment-validator.ts';

interface VerificationResult {
  passed: boolean;
  message: string;
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

function verifyFileExists(): VerificationResult {
  if (!fs.existsSync(TARGET_FILE)) {
    return { passed: false, message: `File missing: ${TARGET_FILE}` };
  }
  return { passed: true, message: 'File exists' };
}

function verifyExactExportSurface(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const required = ['validateCanonicalReAuditRegistrationPreviewAssessment'];

  // Extract all exported function names
  const exportMatches = content.match(/export function (\w+)/g);
  const exported = exportMatches ? exportMatches.map(m => m.replace('export function ', '')) : [];

  // Check all required exports exist
  const missing = required.filter(name => !exported.includes(name));
  if (missing.length > 0) {
    return { passed: false, message: `Missing required exports: ${missing.join(', ')}` };
  }

  // Check no extra exports exist
  const extra = exported.filter(name => !required.includes(name));
  if (extra.length > 0) {
    return { passed: false, message: `Unexpected extra exports: ${extra.join(', ')}` };
  }

  // Check no exported class/const/let/var/default export
  const forbiddenExports = [
    /export\s+class\s+\w+/,
    /export\s+const\s+\w+/,
    /export\s+let\s+\w+/,
    /export\s+var\s+\w+/,
    /export\s+default\s+/
  ];

  for (const pattern of forbiddenExports) {
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden export type found: ${pattern.source}` };
    }
  }

  return { passed: true, message: `All required exports present, no extra exports` };
}

function verifyForbiddenImports(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const forbiddenImports = [
    /import.*from\s+['"]react['"]/i,
    /import.*from\s+['"]next['"]/i,
    /import.*from\s+['"]app\//i,
    /import.*from\s+['"].*handlers['"]/i,
    /import.*from\s+['"].*hooks['"]/i,
    /import.*from\s+['"].*adapters['"]/i,
    /import.*from\s+['"].*route['"]/i,
    /import.*from\s+['"].*api['"]/i,
    /import.*from\s+['"].*panda['"]/i,
    /import.*from\s+['"].*runtime['"]/i,
  ];

  for (const pattern of forbiddenImports) {
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden import found: ${pattern.source}` };
    }
  }

  return { passed: true, message: 'No forbidden imports detected' };
}

function verifyForbiddenSideEffectPatterns(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const forbiddenPatterns = [
    { pattern: /\basync\s+function/, name: 'async function' },
    { pattern: /\basync\s+\(/, name: 'async arrow function' },
    { pattern: /\bawait\s+/, name: 'await' },
    { pattern: /new\s+Promise/, name: 'Promise constructor' },
    { pattern: /\.then\(/, name: '.then()' },
    { pattern: /\.catch\(/, name: '.catch()' },
    { pattern: /fetch\s*\(/, name: 'fetch' },
    { pattern: /new\s+Date/, name: 'Date constructor' },
    { pattern: /Date\.now/, name: 'Date.now' },
    { pattern: /setTimeout/, name: 'setTimeout' },
    { pattern: /setInterval/, name: 'setInterval' },
    { pattern: /localStorage/, name: 'localStorage' },
    { pattern: /sessionStorage/, name: 'sessionStorage' },
    { pattern: /window\./, name: 'window object' },
    { pattern: /document\./, name: 'document object' },
    { pattern: /process\.env/, name: 'process.env' },
    { pattern: /Math\.random/, name: 'Math.random' },
  ];

  for (const { pattern, name } of forbiddenPatterns) {
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden side-effect pattern found: ${name}` };
    }
  }

  return { passed: true, message: 'No forbidden side-effect patterns detected' };
}

function verifyForbiddenMutationPatterns(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const forbiddenPatterns = [
    { pattern: /deploy\s+unlock/i, name: 'deploy unlock' },
    { pattern: /unlockDeploy/, name: 'unlockDeploy' },
    { pattern: /setVault/, name: 'setVault' },
    { pattern: /globalAudit\s*=/, name: 'globalAudit mutation' },
    { pattern: /localDraft/, name: 'localDraft' },
    { pattern: /writeFile/, name: 'writeFile' },
    { pattern: /database/, name: 'database' },
    { pattern: /provider/, name: 'provider' },
  ];

  for (const { pattern, name } of forbiddenPatterns) {
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden mutation pattern found: ${name}` };
    }
  }

  return { passed: true, message: 'No forbidden mutation patterns detected' };
}

function verifyImportsExistingGuards(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const requiredGuards = [
    'isPlainRecord',
    'hasOwnStringField',
    'hasOwnBooleanField',
    'hasOwnLiteralField',
    'hasReadonlyStringArrayField',
  ];

  for (const guard of requiredGuards) {
    if (!content.includes(guard)) {
      return { passed: false, message: `Missing import or usage of guard: ${guard}` };
    }
  }

  // Check that guards are imported from the correct module
  if (!content.includes('from "./canonical-reaudit-registration-preview-assessment-validation-guards"')) {
    return { passed: false, message: 'Guards not imported from correct module' };
  }

  return { passed: true, message: 'All required guards imported and used' };
}

function verifyImportsExistingFactories(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const requiredFactories = [
    'createCanonicalReAuditRegistrationPreviewAssessmentValidationError',
    'createCanonicalReAuditRegistrationPreviewAssessmentValidationResult',
  ];

  for (const factory of requiredFactories) {
    if (!content.includes(factory)) {
      return { passed: false, message: `Missing import or usage of factory: ${factory}` };
    }
  }

  // Check that factories are imported from the correct module
  if (!content.includes('from "./canonical-reaudit-registration-preview-assessment-validation-factories"')) {
    return { passed: false, message: 'Factories not imported from correct module' };
  }

  return { passed: true, message: 'All required factories imported and used' };
}

function verifyNoManualResultConstruction(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  // Check for manual object construction patterns that should use factories
  const forbiddenPatterns = [
    /{\s*__kind:\s*["']registration-preview-assessment-validation-result["']/,
    /{\s*valid:\s*(?:true|false),\s*errors:/,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return { passed: false, message: 'Manual validation result construction detected; use factory instead' };
    }
  }

  return { passed: true, message: 'No manual result construction detected' };
}

function verifyReturnType(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  // Check that the main function returns the correct type
  if (!content.includes('CanonicalReAuditRegistrationPreviewAssessmentValidationResult')) {
    return { passed: false, message: 'Function does not return correct validation result type' };
  }

  return { passed: true, message: 'Function returns correct validation result type' };
}

function verifySynchronousDeterministic(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  // Check that function is not async
  const mainFunctionMatch = content.match(/export function validateCanonicalReAuditRegistrationPreviewAssessment[^{]*\{/);
  if (!mainFunctionMatch) {
    return { passed: false, message: 'Main function not found' };
  }

  if (mainFunctionMatch[0].includes('async')) {
    return { passed: false, message: 'Main function must not be async' };
  }

  return { passed: true, message: 'Function is synchronous' };
}

// ============================================================================
// SMOKE TESTS
// ============================================================================

async function runSmokeTests(): Promise<VerificationResult> {
  try {
    // Import the validator
    const resolvedPath = path.resolve(TARGET_FILE);
    const fileUrl = new URL(`file:///${resolvedPath.replace(/\\/g, '/')}`).href;
    const validatorModule = await import(fileUrl);
    const validator = validatorModule.validateCanonicalReAuditRegistrationPreviewAssessment;

    if (typeof validator !== 'function') {
      return { passed: false, message: 'Validator is not a function' };
    }

    // Test 1: Positive fixture - valid assessment
    const validFixture = {
      __kind: "registration-preview-assessment",
      assessmentStage: "REGISTRATION_PREVIEW_ASSESSMENT",
      preview: {
        __kind: "registration-preview-shape",
        previewStage: "REGISTRATION_PREVIEW_SHAPE",
        sourceStage: "ELIGIBILITY_EVALUATED",
        targetStageLabel: "REGISTERED_IN_MEMORY",
        sourceStateStage: "ELIGIBILITY_EVALUATED",
        targetStateStageLabel: "REGISTERED_IN_MEMORY",
        safety: {
          typeOnly: true,
          previewOnly: true,
          informationalOnly: true,
          memoryOnly: true,
          executionAllowed: false,
          registrationExecutionAllowed: false,
          persistenceAllowed: false,
          mutationAllowed: false,
          deployRemainsLocked: true,
          globalAuditOverwriteAllowed: false,
          vaultMutationAllowed: false,
          productionAuthorizationAllowed: false,
          promotionRequired: true,
        },
        changeSummary: {
          affectedFields: [],
          unchangedFields: [],
          blockedFields: [],
          summary: "No changes",
        },
        eligibilityCanRegister: true,
        readinessEligible: true,
        blockReasonCount: 0,
        previewNotes: [],
      },
      eligibility: {
        canRegister: true,
        blockReasons: [],
        preconditions: {
          allPreconditionsMet: true,
          preconditionDetails: [],
        },
        memoryOnly: true,
        deployRemainsLocked: true,
        persistenceAllowed: false,
        vaultMutationAllowed: false,
        globalAuditOverwriteAllowed: false,
        productionAuthorizationAllowed: false,
        registrationExecutionAllowed: false,
        promotionRequired: true,
        evaluatedStage: "ELIGIBILITY_EVALUATED",
      },
      explanation: {
        eligible: true,
        readyForRegistration: true,
        severity: "READY",
        title: "Ready for registration",
        summary: "All conditions met",
        blockReasonLabels: [],
        remediationHints: [],
        preconditionSummary: "All preconditions met",
        blockReasonCount: 0,
        informationalOnly: true,
        registrationExecutionAllowed: false,
        deployRemainsLocked: true,
        persistenceAllowed: false,
        mutationAllowed: false,
      },
      safety: {
        typeOnly: true,
        assessmentOnly: true,
        previewOnly: true,
        informationalOnly: true,
        memoryOnly: true,
        executionAllowed: false,
        registrationExecutionAllowed: false,
        persistenceAllowed: false,
        mutationAllowed: false,
        deployRemainsLocked: true,
        globalAuditOverwriteAllowed: false,
        vaultMutationAllowed: false,
        productionAuthorizationAllowed: false,
        promotionRequired: true,
      },
      boundary: {
        runtimeValidatorAllowed: false,
        runtimeBuilderAllowed: false,
        factoryAllowed: false,
        generatorAllowed: false,
        handlerIntegrationAllowed: false,
        uiIntegrationAllowed: false,
        adapterIntegrationAllowed: false,
        persistenceAllowed: false,
        deployUnlockAllowed: false,
      },
      assessmentNotes: [],
    };

    const validResult = validator(validFixture);
    if (!validResult.valid) {
      return { passed: false, message: `Positive fixture failed: ${JSON.stringify(validResult.errors)}` };
    }

    // Test 2: Invalid top-level input (not a record)
    const invalidTopLevel = null;
    const invalidTopLevelResult = validator(invalidTopLevel);
    if (invalidTopLevelResult.valid) {
      return { passed: false, message: 'Validator should reject non-record input' };
    }

    // Test 3: Wrong __kind
    const wrongKind = { ...validFixture, __kind: "wrong-kind" };
    const wrongKindResult = validator(wrongKind);
    if (wrongKindResult.valid) {
      return { passed: false, message: 'Validator should reject wrong __kind' };
    }

    // Test 4: Wrong assessmentStage
    const wrongStage = { ...validFixture, assessmentStage: "WRONG_STAGE" };
    const wrongStageResult = validator(wrongStage);
    if (wrongStageResult.valid) {
      return { passed: false, message: 'Validator should reject wrong assessmentStage' };
    }

    // Test 5: Missing child object
    const missingChild = { ...validFixture, preview: null };
    const missingChildResult = validator(missingChild);
    if (missingChildResult.valid) {
      return { passed: false, message: 'Validator should reject missing child object' };
    }

    // Test 6: Broken safety invariant
    const brokenSafety = {
      ...validFixture,
      safety: { ...validFixture.safety, executionAllowed: true },
    };
    const brokenSafetyResult = validator(brokenSafety);
    if (brokenSafetyResult.valid) {
      return { passed: false, message: 'Validator should reject broken safety invariant' };
    }

    // Test 7: Broken boundary invariant
    const brokenBoundary = {
      ...validFixture,
      boundary: { ...validFixture.boundary, deployUnlockAllowed: true },
    };
    const brokenBoundaryResult = validator(brokenBoundary);
    if (brokenBoundaryResult.valid) {
      return { passed: false, message: 'Validator should reject broken boundary invariant' };
    }

    // Test 8: Multiple broken fields accumulate errors
    const multipleErrors = {
      ...validFixture,
      __kind: "wrong",
      assessmentStage: "WRONG",
      preview: null,
    };
    const multipleErrorsResult = validator(multipleErrors);
    if (multipleErrorsResult.valid) {
      return { passed: false, message: 'Validator should reject multiple errors' };
    }
    if (multipleErrorsResult.errors.length < 3) {
      return { passed: false, message: `Expected at least 3 errors, got ${multipleErrorsResult.errors.length}` };
    }

    return { passed: true, message: 'All smoke tests passed' };
  } catch (error) {
    return { passed: false, message: `Smoke test error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('TASK 8C-3A-3C-2: Core Pure Runtime Validator Composition Verification');
  console.log('='.repeat(80));
  console.log();

  const checks: Array<[string, () => VerificationResult | Promise<VerificationResult>]> = [
    ['File exists', verifyFileExists],
    ['Export surface correct', verifyExactExportSurface],
    ['No forbidden imports', verifyForbiddenImports],
    ['No forbidden side-effect patterns', verifyForbiddenSideEffectPatterns],
    ['No forbidden mutation patterns', verifyForbiddenMutationPatterns],
    ['Imports existing guards', verifyImportsExistingGuards],
    ['Imports existing factories', verifyImportsExistingFactories],
    ['No manual result construction', verifyNoManualResultConstruction],
    ['Returns correct type', verifyReturnType],
    ['Synchronous and deterministic', verifySynchronousDeterministic],
    ['Smoke tests', runSmokeTests],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, check] of checks) {
    try {
      const result = await check();
      if (result.passed) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.log(`✗ ${name}: ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
