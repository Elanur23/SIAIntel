#!/usr/bin/env node

/**
 * Verifier for Task 8C-3A-3D: Full Runtime Validator Chain Verifier
 *
 * PROVES the entire 8C-3A validator chain is:
 * - present
 * - correctly exported
 * - properly composed
 * - pure
 * - deterministic
 * - fail-closed
 * - side-effect-free
 * - isolated from runtime/UI/handler/adapter/deploy systems
 */

import * as fs from 'fs';
import * as path from 'path';

const CHAIN_FILES = [
  'lib/editorial/canonical-reaudit-registration-preview-assessment-validation-result.ts',
  'lib/editorial/canonical-reaudit-registration-preview-assessment-validation-guards.ts',
  'lib/editorial/canonical-reaudit-registration-preview-assessment-validation-factories.ts',
  'lib/editorial/canonical-reaudit-registration-preview-assessment-validator.ts',
];

const VALIDATOR_FILE = 'lib/editorial/canonical-reaudit-registration-preview-assessment-validator.ts';

interface VerificationResult {
  passed: boolean;
  message: string;
}

// ============================================================================
// CHECK GROUP 1: FILE EXISTENCE
// ============================================================================

function verifyFilesExist(): VerificationResult {
  for (const file of CHAIN_FILES) {
    if (!fs.existsSync(file)) {
      return { passed: false, message: `File missing: ${file}` };
    }
  }
  return { passed: true, message: 'All chain files exist' };
}

// ============================================================================
// CHECK GROUP 2: EXPORT SURFACE
// ============================================================================

function verifyExportSurface(): VerificationResult {
  const content = fs.readFileSync(VALIDATOR_FILE, 'utf8');
  const required = ['validateCanonicalReAuditRegistrationPreviewAssessment'];

  const exportMatches = content.match(/export function (\w+)/g);
  const exported = exportMatches ? exportMatches.map(m => m.replace('export function ', '')) : [];

  const missing = required.filter(name => !exported.includes(name));
  if (missing.length > 0) {
    return { passed: false, message: `Missing required exports in validator: ${missing.join(', ')}` };
  }

  // Ensure no unrelated runtime functions are exported
  const extra = exported.filter(name => !required.includes(name));
  if (extra.length > 0) {
    return { passed: false, message: `Unexpected extra exports in validator: ${extra.join(', ')}` };
  }

  return { passed: true, message: 'Validator export surface is correct and pure' };
}

// ============================================================================
// CHECK GROUP 3: IMPORT BOUNDARIES
// ============================================================================

function verifyImportBoundaries(): VerificationResult {
  const forbiddenImports = [
    /['"]react['"]/i,
    /['"]next['"]/i,
    /['"]app\//i,
    /['"]pages\//i,
    /['"]components\//i,
    /['"]hooks\//i,
    /['"]handlers\//i,
    /['"]adapters\//i,
    /['"]route['"]/i,
    /['"]api\//i,
    /['"]panda['"]/i,
    /['"]neural['"]/i,
    /['"]runtime['"]/i,
    /['"]deploy['"]/i,
    /['"]vault['"]/i,
    /['"]database['"]/i,
    /['"]db['"]/i,
    /['"]prisma['"]/i,
    /['"]turso['"]/i,
    /['"]libsql['"]/i,
    /['"]provider['"]/i,
    /['"]groq['"]/i,
    /['"]gemini['"]/i,
    /['"]anthropic['"]/i,
    /['"]openai['"]/i,
    /['"]fs['"]/i,
    /['"]path['"]/i,
    /['"]child_process['"]/i,
    /['"]axios['"]/i,
    /['"]fetch['"]/i,
  ];

  for (const file of CHAIN_FILES) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        for (const pattern of forbiddenImports) {
          if (pattern.test(line)) {
            return { passed: false, message: `Forbidden import in ${file}: ${line.trim()}` };
          }
        }
      }
    }
  }

  return { passed: true, message: 'No forbidden imports in the chain' };
}

// ============================================================================
// CHECK GROUP 4: FORBIDDEN SIDE-EFFECT PATTERNS
// ============================================================================

function verifyNoSideEffects(): VerificationResult {
  const forbiddenPatterns = [
    { pattern: /\basync\b/, name: 'async' },
    { pattern: /\bawait\b/, name: 'await' },
    { pattern: /\bPromise\b/, name: 'Promise' },
    { pattern: /\bfetch\b\s*\(/, name: 'fetch' },
    { pattern: /\baxios\b/, name: 'axios' },
    { pattern: /\bXMLHttpRequest\b/, name: 'XMLHttpRequest' },
    { pattern: /\bWebSocket\b/, name: 'WebSocket' },
    { pattern: /\bnew\s+Date\b/, name: 'new Date' },
    { pattern: /\bDate\.now\b\s*\(/, name: 'Date.now' },
    { pattern: /\bMath\.random\b\s*\(/, name: 'Math.random' },
    { pattern: /\bsetTimeout\b\s*\(/, name: 'setTimeout' },
    { pattern: /\bsetInterval\b\s*\(/, name: 'setInterval' },
    { pattern: /\bprocess\.env\b/, name: 'process.env' },
    { pattern: /\blocalStorage\b/, name: 'localStorage' },
    { pattern: /\bsessionStorage\b/, name: 'sessionStorage' },
    { pattern: /\bindexedDB\b/, name: 'indexedDB' },
    { pattern: /\bwindow\b/, name: 'window' },
    { pattern: /\bdocument\b/, name: 'document' },
    { pattern: /\bfs\.\b/, name: 'fs.' },
    { pattern: /\bwriteFile\b/, name: 'writeFile' },
    { pattern: /\bappendFile\b/, name: 'appendFile' },
    { pattern: /\bcreateWriteStream\b/, name: 'createWriteStream' },
    { pattern: /\bchild_process\b/, name: 'child_process' },
    { pattern: /\bexec\b\s*\(/, name: 'exec' },
    { pattern: /\bspawn\b\s*\(/, name: 'spawn' },
    { pattern: /\bprisma\b/, name: 'prisma' },
    { pattern: /\bturso\b/, name: 'turso' },
    { pattern: /\blibsql\b/, name: 'libsql' },
    { pattern: /\bdatabase\b/, name: 'database' },
    { pattern: /\bprovider\b/, name: 'provider' },
    { pattern: /deploy\s+unlock/i, name: 'deploy unlock' },
    { pattern: /\bunlockDeploy\b/, name: 'unlockDeploy' },
    { pattern: /\bsetVault\b/, name: 'setVault' },
    { pattern: /\bglobalAudit\s*=/, name: 'globalAudit mutation' },
    { pattern: /\blocalDraft\s*=/, name: 'localDraft mutation' },
    { pattern: /\bsessionDraft\s*=/, name: 'sessionDraft mutation' },
    { pattern: /\bmutation\b/i, name: 'mutation' },
    { pattern: /\bpersistence\b/i, name: 'persistence' },
  ];

  for (const file of CHAIN_FILES) {
    const content = fs.readFileSync(file, 'utf8');
    // Remove comments before scanning to avoid false positives in docstrings
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    for (const { pattern, name } of forbiddenPatterns) {
      if (pattern.test(cleanContent)) {
        return { passed: false, message: `Forbidden side-effect pattern "${name}" found in ${file}` };
      }
    }
  }

  return { passed: true, message: 'All chain files are pure and side-effect-free' };
}

// ============================================================================
// CHECK GROUP 5: COMPOSITION CHECKS
// ============================================================================

function verifyComposition(): VerificationResult {
  const content = fs.readFileSync(VALIDATOR_FILE, 'utf8');

  const requiredImports = [
    './canonical-reaudit-registration-preview-assessment-validation-guards',
    './canonical-reaudit-registration-preview-assessment-validation-factories',
    './canonical-reaudit-registration-preview-assessment-validation-result',
  ];

  for (const imp of requiredImports) {
    if (!content.includes(imp)) {
      return { passed: false, message: `Validator missing required import: ${imp}` };
    }
  }

  const requiredCalls = [
    'isPlainRecord',
    'createCanonicalReAuditRegistrationPreviewAssessmentValidationResult',
    'createCanonicalReAuditRegistrationPreviewAssessmentValidationError',
  ];

  for (const call of requiredCalls) {
    if (!content.includes(call)) {
      return { passed: false, message: `Validator does not appear to call: ${call}` };
    }
  }

  // Ensure no manual construction of validation result
  if (content.includes('__kind: "registration-preview-assessment-validation-result"') &&
      !content.includes('createCanonicalReAuditRegistrationPreviewAssessmentValidationResult')) {
      return { passed: false, message: 'Validator may be manually constructing validation result' };
  }

  return { passed: true, message: 'Validator composition is correct' };
}

// ============================================================================
// CHECK GROUP 6: RUNTIME ISOLATION SCAN
// ============================================================================

function verifyRuntimeIsolation(): VerificationResult {
  const forbiddenConsumers = [
    'app/',
    'components/',
    'hooks/',
    'handlers/',
    'adapters/',
    'pages/api/',
  ];

  const targetBaseNames = CHAIN_FILES.map(f => path.basename(f, '.ts'));

  // Use a simple recursive file search for unauthorized imports
  function walk(dir: string, callback: (file: string) => void) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);
      if (stat.isDirectory()) {
        walk(filepath, callback);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        callback(filepath);
      }
    }
  }

  let violation: string | null = null;

  const projectRoot = '.';
  const searchDirs = ['app', 'components', 'hooks', 'handlers', 'adapters', 'pages'];

  for (const dir of searchDirs) {
    const fullDir = path.join(projectRoot, dir);
    if (!fs.existsSync(fullDir)) continue;

    walk(fullDir, (file) => {
      if (violation) return;

      const content = fs.readFileSync(file, 'utf8');
      for (const baseName of targetBaseNames) {
        if (content.includes(baseName)) {
          // Check if it's an import
          if (content.includes(`from "./${baseName}"`) ||
              content.includes(`from '../${baseName}"`) ||
              content.includes(`import "${baseName}"`) ||
              content.includes(`import {`) && content.includes(`} from`) && content.includes(baseName)) {
            violation = `Unauthorized import of ${baseName} in ${file}`;
          }
        }
      }
    });
  }

  if (violation) {
    return { passed: false, message: violation };
  }

  return { passed: true, message: 'Chain is correctly isolated from runtime' };
}

// ============================================================================
// CHECK GROUP 8: NON-AUTHORIZATION SEMANTICS
// ============================================================================

function verifyNonAuthorizationSemantics(): VerificationResult {
  const dangerousNames = [
    'deployReady',
    'unlockDeploy',
    'publishReady',
    'executeRegistration',
    'applyRegistration',
    'promote',
    'persist',
    'saveToVault',
    'mutate',
    'canonicalWrite',
  ];

  for (const file of CHAIN_FILES) {
    const content = fs.readFileSync(file, 'utf8');
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    for (const name of dangerousNames) {
      const pattern = new RegExp(`\\b${name}\\b`, 'i');
      if (pattern.test(cleanContent)) {
        return { passed: false, message: `Dangerous semantic name "${name}" found in ${file}` };
      }
    }
  }

  return { passed: true, message: 'Non-authorization semantics verified' };
}

// ============================================================================
// CHECK GROUP 7: STATIC FIXTURE BEHAVIOR TESTS
// ============================================================================

async function runBehaviorTests(): Promise<VerificationResult> {
  try {
    const resolvedPath = path.resolve(VALIDATOR_FILE);
    const fileUrl = new URL(`file:///${resolvedPath.replace(/\\/g, '/')}`).href;
    const module = await import(fileUrl);
    const validate = module.validateCanonicalReAuditRegistrationPreviewAssessment;

    if (typeof validate !== 'function') {
      return { passed: false, message: 'Validator export is not a function' };
    }

    const validFixture = {
      __kind: "registration-preview-assessment",
      assessmentStage: "REGISTRATION_PREVIEW_ASSESSMENT",
      preview: {
        __kind: "registration-preview-shape",
        previewStage: "REGISTRATION_PREVIEW_SHAPE",
      },
      eligibility: {
        canRegister: true,
      },
      explanation: {
        eligible: true,
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

    // 1. Valid fixture
    const result1 = validate(validFixture);
    if (!result1.valid || result1.errors.length > 0) {
      return { passed: false, message: 'Valid fixture failed validation' };
    }

    // 2. Malformed inputs
    const malformed = [null, undefined, "string", 123, []];
    for (const input of malformed) {
      const res = validate(input);
      if (res.valid || res.errors.length === 0) {
        return { passed: false, message: `Failed to reject malformed input: ${JSON.stringify(input)}` };
      }
    }

    // 3. Wrong __kind
    const result3 = validate({ ...validFixture, __kind: "wrong" });
    if (result3.valid) return { passed: false, message: 'Failed to reject wrong __kind' };

    // 4. Wrong assessmentStage
    const result4 = validate({ ...validFixture, assessmentStage: "WRONG" });
    if (result4.valid) return { passed: false, message: 'Failed to reject wrong assessmentStage' };

    // 5. Missing child objects
    const children = ['preview', 'eligibility', 'explanation', 'safety', 'boundary'];
    for (const child of children) {
      const fixture = { ...validFixture };
      delete (fixture as any)[child];
      const res = validate(fixture);
      if (res.valid) return { passed: false, message: `Failed to reject missing ${child}` };
    }

    // 6. Broken safety invariant
    const result6 = validate({
      ...validFixture,
      safety: { ...validFixture.safety, executionAllowed: true }
    });
    if (result6.valid) return { passed: false, message: 'Failed to reject broken safety invariant' };

    // 7. Broken boundary invariant
    const result7 = validate({
      ...validFixture,
      boundary: { ...validFixture.boundary, deployUnlockAllowed: true }
    });
    if (result7.valid) return { passed: false, message: 'Failed to reject broken boundary invariant' };

    // 8. Multiple error accumulation
    const result8 = validate({
      ...validFixture,
      __kind: "wrong",
      assessmentStage: "WRONG"
    });
    if (result8.valid || result8.errors.length <= 1) {
      return { passed: false, message: 'Failed to accumulate multiple errors' };
    }

    // 9. Input immutability
    const frozenFixture = JSON.parse(JSON.stringify(validFixture));
    Object.freeze(frozenFixture);
    Object.freeze(frozenFixture.safety);
    Object.freeze(frozenFixture.boundary);
    try {
      validate(frozenFixture);
    } catch (e) {
      return { passed: false, message: 'Validator mutated frozen input' };
    }

    return { passed: true, message: 'All behavior tests passed' };
  } catch (error) {
    return { passed: false, message: `Behavior test error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('TASK 8C-3A-3D: Full Runtime Validator Chain Verifier');
  console.log('='.repeat(80));
  console.log();

  const checks: Array<[string, () => VerificationResult | Promise<VerificationResult>]> = [
    ['Check Group 1: File Existence', verifyFilesExist],
    ['Check Group 2: Export Surface', verifyExportSurface],
    ['Check Group 3: Import Boundaries', verifyImportBoundaries],
    ['Check Group 4: Forbidden Side-Effects', verifyNoSideEffects],
    ['Check Group 5: Composition Checks', verifyComposition],
    ['Check Group 6: Runtime Isolation', verifyRuntimeIsolation],
    ['Check Group 8: Non-Authorization Semantics', verifyNonAuthorizationSemantics],
    ['Check Group 7: Behavior Tests', runBehaviorTests],
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const [name, check] of checks) {
    try {
      const result = await check();
      if (result.passed) {
        console.log(`[PASS] ${name}: ${result.message}`);
        passedCount++;
      } else {
        console.log(`[FAIL] ${name}: ${result.message}`);
        failedCount++;
      }
    } catch (error) {
      console.log(`[ERROR] ${name}: ${error instanceof Error ? error.message : String(error)}`);
      failedCount++;
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log(`VERDICT: ${failedCount === 0 ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('='.repeat(80));

  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
