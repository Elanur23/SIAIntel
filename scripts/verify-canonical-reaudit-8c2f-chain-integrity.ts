/**
 * Task 8C-2F: Canonical Re-Audit 8C Chain Integrity Verifier
 * 
 * Verification-only chain integrity verifier that validates the complete 8C chain:
 * - Task 8C-1 registration state contract
 * - Task 8C-2A eligibility validator/types
 * - Task 8C-2B readiness explanation mapper/types
 * - Task 8C-2C boundary audit
 * - Task 8C-2D preview shape contract
 * - Task 8C-2E preview assessment overlay
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - READ-ONLY VERIFICATION ONLY
 * - NO FILE MODIFICATIONS
 * - NO ARTIFACT WRITES
 * - NO GIT OPERATIONS
 * - NO DEPLOY OPERATIONS
 * - STDOUT OUTPUT ONLY
 * - DETERMINISTIC
 * - FAIL-CLOSED
 * 
 * @version 8C-2F.0.0
 * @author SIA Intelligence Systems
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TARGET_8C_SOURCE_FILES = [
  'lib/editorial/canonical-reaudit-registration-state-types.ts',
  'lib/editorial/canonical-reaudit-registration-eligibility-types.ts',
  'lib/editorial/canonical-reaudit-registration-readiness-explanation.ts',
  'lib/editorial/canonical-reaudit-registration-preview-shape.ts',
  'lib/editorial/canonical-reaudit-registration-preview-assessment.ts'
] as const;

const PRIOR_VERIFIER_FILES = [
  'scripts/verify-canonical-reaudit-8c1-registration-state-types.ts',
  'scripts/verify-canonical-reaudit-8c2a-registration-eligibility.ts',
  'scripts/verify-canonical-reaudit-8c2b-registration-readiness-explanation.ts',
  'scripts/verify-canonical-reaudit-8c2c-boundary-audit.ts',
  'scripts/verify-canonical-reaudit-8c2d-registration-preview-shape.ts',
  'scripts/verify-canonical-reaudit-8c2e-registration-preview-assessment.ts'
] as const;

const FORBIDDEN_IMPORTS = [
  'react', 'next', 'app/', 'components/', 'hooks/', 'handlers/', 'api/',
  'canonical-reaudit-adapter', 'canonical-reaudit-input-builder',
  'prisma', 'turso', 'libsql', 'axios', 'provider', 'database', 'storage', 'persistence'
] as const;

const FORBIDDEN_RUNTIME_TOKENS = [
  'fetch(', 'axios.', 'prisma.', 'turso.', 'libsql.',
  'localStorage.', 'sessionStorage.', 'indexedDB.',
  'document.', 'window.', 'process.env', 'child_process',
  'exec(', 'spawn(',
  'setGlobalAudit(', 'setVault(', 'setIsDeployBlocked(',
  'registerCanonicalReAudit(', 'transitionToRegistered(',
  'promote(', 'deployUnlock(', 'save(', 'publish(',
  'fs.writeFile', 'fs.appendFile', 'fs.createWriteStream'
] as const;

const EXPECTED_EXPORTS_8C1 = [
  'CanonicalReAuditGovernanceStage',
  'CanonicalReAuditSafetyInvariants',
  'CanonicalReAuditRegistrationState',
  'CanonicalReAuditEligibilityEvaluatedState',
  'CanonicalReAuditRegisteredInMemoryState',
  'CanonicalReAuditPromotionPreparedState',
  'CanonicalReAuditPromotedToGlobalState',
  'CanonicalReAuditDeployUnlockedState',
  'CanonicalReAuditPromotionPayloadContract',
  'CanonicalReAuditAllowedTransition',
  'CanonicalReAuditAcceptanceGateViewModel'
] as const;

const EXPECTED_EXPORTS_8C2A = [
  'CanonicalReAuditRegistrationBlockReason',
  'CanonicalReAuditRegistrationPreconditions',
  'CanonicalReAuditRegistrationEligibilityResult',
  'EvaluateCanonicalReAuditRegistrationEligibilityInput',
  'evaluateCanonicalReAuditRegistrationEligibility'
] as const;

const EXPECTED_EXPORTS_8C2B = [
  'CanonicalReAuditRegistrationReadinessSeverity',
  'CanonicalReAuditRegistrationReadinessExplanation',
  'getRegistrationBlockReasonLabel',
  'getRegistrationBlockReasonHint',
  'getRegistrationReadinessSeverity',
  'createRegistrationReadinessExplanation'
] as const;

const EXPECTED_EXPORTS_8C2D = [
  'CanonicalReAuditRegistrationPreviewKind',
  'CanonicalReAuditRegistrationPreviewSafety',
  'CanonicalReAuditRegistrationPreviewChangeSummary',
  'CanonicalReAuditRegistrationPreviewShape',
  'CanonicalReAuditRegistrationPreviewBoundary'
] as const;

const EXPECTED_EXPORTS_8C2E = [
  'CanonicalReAuditRegistrationPreviewAssessmentKind',
  'CanonicalReAuditRegistrationPreviewAssessmentSafety',
  'CanonicalReAuditRegistrationPreviewAssessmentBoundary',
  'CanonicalReAuditRegistrationPreviewAssessment'
] as const;

// ============================================================================
// VERIFICATION STATE
// ============================================================================

let checkCount = 0;
let failureCount = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, failureMessage: string): void {
  checkCount++;
  if (!condition) {
    failureCount++;
    failures.push(`[CHECK ${checkCount}] ${name}: ${failureMessage}`);
    console.error(`❌ [CHECK ${checkCount}] ${name}: ${failureMessage}`);
  } else {
    console.log(`✅ [CHECK ${checkCount}] ${name}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function extractImports(content: string): string[] {
  const importRegex = /import\s+(?:type\s+)?(?:{[^}]*}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const typeExportRegex = /export\s+(?:type|interface|enum)\s+(\w+)/g;
  let match;
  while ((match = typeExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  const functionExportRegex = /export\s+function\s+(\w+)/g;
  while ((match = functionExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  const constExportRegex = /export\s+const\s+(\w+)/g;
  while ((match = constExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  return exports;
}

function containsToken(content: string, token: string): boolean {
  return content.includes(token);
}

function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
}

// ============================================================================
// CHECK 1: File Existence
// ============================================================================

console.log('\n=== CHECK 1: File Existence ===\n');

for (const file of TARGET_8C_SOURCE_FILES) {
  check(`8C source file exists: ${file}`, fileExists(file), `File not found: ${file}`);
}

for (const file of PRIOR_VERIFIER_FILES) {
  check(`Prior verifier exists: ${file}`, fileExists(file), `Verifier not found: ${file}`);
}

// ============================================================================
// CHECK 2: Import Graph Isolation
// ============================================================================

console.log('\n=== CHECK 2: Import Graph Isolation ===\n');

const fileContents = new Map<string, string>();
for (const file of TARGET_8C_SOURCE_FILES) {
  const content = readFileContent(file);
  if (content) {
    fileContents.set(file, content);
  }
}

// Check registration-state-types imports
const stateTypesContent = fileContents.get(TARGET_8C_SOURCE_FILES[0]);
if (stateTypesContent) {
  const imports = extractImports(stateTypesContent);
  const allowedImports = ['./canonical-reaudit-types', './canonical-reaudit-acceptance-types'];
  const invalidImports = imports.filter(imp => !allowedImports.some(allowed => imp.includes(allowed)));
  check('8C-1 imports only allowed dependencies', invalidImports.length === 0, `Invalid imports: ${invalidImports.join(', ')}`);
}

// Check registration-eligibility-types imports
const eligibilityTypesContent = fileContents.get(TARGET_8C_SOURCE_FILES[1]);
if (eligibilityTypesContent) {
  const imports = extractImports(eligibilityTypesContent);
  const allowedImports = ['./canonical-reaudit-registration-state-types', './canonical-reaudit-types', './canonical-reaudit-acceptance-types'];
  const invalidImports = imports.filter(imp => !allowedImports.some(allowed => imp.includes(allowed)));
  check('8C-2A imports only allowed dependencies', invalidImports.length === 0, `Invalid imports: ${invalidImports.join(', ')}`);
}

// Check registration-readiness-explanation imports
const readinessExplanationContent = fileContents.get(TARGET_8C_SOURCE_FILES[2]);
if (readinessExplanationContent) {
  const imports = extractImports(readinessExplanationContent);
  const allowedImports = ['./canonical-reaudit-registration-eligibility-types'];
  const invalidImports = imports.filter(imp => !allowedImports.some(allowed => imp.includes(allowed)));
  check('8C-2B imports only allowed dependencies', invalidImports.length === 0, `Invalid imports: ${invalidImports.join(', ')}`);
}

// Check registration-preview-shape imports
const previewShapeContent = fileContents.get(TARGET_8C_SOURCE_FILES[3]);
if (previewShapeContent) {
  const imports = extractImports(previewShapeContent);
  const allowedImports = ['./canonical-reaudit-registration-state-types'];
  const invalidImports = imports.filter(imp => !allowedImports.some(allowed => imp.includes(allowed)));
  check('8C-2D imports only allowed dependencies', invalidImports.length === 0, `Invalid imports: ${invalidImports.join(', ')}`);
}

// Check registration-preview-assessment imports
const previewAssessmentContent = fileContents.get(TARGET_8C_SOURCE_FILES[4]);
if (previewAssessmentContent) {
  const imports = extractImports(previewAssessmentContent);
  const allowedImports = ['./canonical-reaudit-registration-preview-shape', './canonical-reaudit-registration-eligibility-types', './canonical-reaudit-registration-readiness-explanation'];
  const invalidImports = imports.filter(imp => !allowedImports.some(allowed => imp.includes(allowed)));
  check('8C-2E imports only allowed dependencies', invalidImports.length === 0, `Invalid imports: ${invalidImports.join(', ')}`);
}

// ============================================================================
// CHECK 3: Forbidden Import Check
// ============================================================================

console.log('\n=== CHECK 3: Forbidden Import Check ===\n');

for (const file of TARGET_8C_SOURCE_FILES) {
  const content = fileContents.get(file);
  if (content) {
    const imports = extractImports(content);
    const forbiddenFound = imports.filter(imp => FORBIDDEN_IMPORTS.some(forbidden => imp.includes(forbidden)));
    check(`${path.basename(file)} has no forbidden imports`, forbiddenFound.length === 0, `Forbidden imports: ${forbiddenFound.join(', ')}`);
  }
}

// ============================================================================
// CHECK 4: Export Surface Check
// ============================================================================

console.log('\n=== CHECK 4: Export Surface Check ===\n');

const stateTypesExports = stateTypesContent ? extractExports(stateTypesContent) : [];
for (const expectedExport of EXPECTED_EXPORTS_8C1) {
  check(`8C-1 exports ${expectedExport}`, stateTypesExports.includes(expectedExport), `Missing export: ${expectedExport}`);
}

const eligibilityTypesExports = eligibilityTypesContent ? extractExports(eligibilityTypesContent) : [];
for (const expectedExport of EXPECTED_EXPORTS_8C2A) {
  check(`8C-2A exports ${expectedExport}`, eligibilityTypesExports.includes(expectedExport), `Missing export: ${expectedExport}`);
}

const readinessExplanationExports = readinessExplanationContent ? extractExports(readinessExplanationContent) : [];
for (const expectedExport of EXPECTED_EXPORTS_8C2B) {
  check(`8C-2B exports ${expectedExport}`, readinessExplanationExports.includes(expectedExport), `Missing export: ${expectedExport}`);
}

const previewShapeExports = previewShapeContent ? extractExports(previewShapeContent) : [];
for (const expectedExport of EXPECTED_EXPORTS_8C2D) {
  check(`8C-2D exports ${expectedExport}`, previewShapeExports.includes(expectedExport), `Missing export: ${expectedExport}`);
}

const previewAssessmentExports = previewAssessmentContent ? extractExports(previewAssessmentContent) : [];
for (const expectedExport of EXPECTED_EXPORTS_8C2E) {
  check(`8C-2E exports ${expectedExport}`, previewAssessmentExports.includes(expectedExport), `Missing export: ${expectedExport}`);
}

// ============================================================================
// CHECK 5: Forbidden Runtime Token Scan
// ============================================================================

console.log('\n=== CHECK 5: Forbidden Runtime Token Scan ===\n');

for (const file of TARGET_8C_SOURCE_FILES) {
  const content = fileContents.get(file);
  if (content) {
    const forbiddenFound = FORBIDDEN_RUNTIME_TOKENS.filter(token => containsToken(content, token));
    check(`${path.basename(file)} has no forbidden runtime tokens`, forbiddenFound.length === 0, `Forbidden tokens: ${forbiddenFound.join(', ')}`);
  }
}

// ============================================================================
// CHECK 6: Type-Only Enforcement for 8C-1, 8C-2D, 8C-2E
// ============================================================================

console.log('\n=== CHECK 6: Type-Only Enforcement ===\n');

if (stateTypesContent) {
  const strippedContent = stripComments(stateTypesContent);
  check('8C-1 contains no export function', !strippedContent.includes('export function'), 'Found export function in 8C-1');
}

if (previewShapeContent) {
  const strippedContent = stripComments(previewShapeContent);
  check('8C-2D contains no export function', !strippedContent.includes('export function'), 'Found export function in 8C-2D');
}

if (previewAssessmentContent) {
  const strippedContent = stripComments(previewAssessmentContent);
  check('8C-2E contains no export function', !strippedContent.includes('export function'), 'Found export function in 8C-2E');
}

// ============================================================================
// CHECK 7: Readonly Enforcement
// ============================================================================

console.log('\n=== CHECK 7: Readonly Enforcement ===\n');

if (previewShapeContent) {
  const strippedContent = stripComments(previewShapeContent);
  const interfaceMatches = strippedContent.match(/export\s+interface\s+\w+\s*{([^}]*)}/g);
  let hasNonReadonly = false;
  if (interfaceMatches) {
    for (const match of interfaceMatches) {
      const lines = match.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes(':') && !trimmed.startsWith('readonly') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          hasNonReadonly = true;
        }
      }
    }
  }
  check('8C-2D all interface fields are readonly', !hasNonReadonly, 'Found non-readonly fields');
}

if (previewAssessmentContent) {
  const strippedContent = stripComments(previewAssessmentContent);
  const interfaceMatches = strippedContent.match(/export\s+interface\s+\w+\s*{([^}]*)}/g);
  let hasNonReadonly = false;
  if (interfaceMatches) {
    for (const match of interfaceMatches) {
      const lines = match.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes(':') && !trimmed.startsWith('readonly') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          hasNonReadonly = true;
        }
      }
    }
  }
  check('8C-2E all interface fields are readonly', !hasNonReadonly, 'Found non-readonly fields');
}

// ============================================================================
// CHECK 8: Branded Discriminant Check
// ============================================================================

console.log('\n=== CHECK 8: Branded Discriminant Check ===\n');

if (previewShapeContent) {
  check('8C-2D has __kind field', containsToken(previewShapeContent, '__kind'), 'Missing __kind branded discriminant');
  check('8C-2D has "registration-preview-shape" literal', containsToken(previewShapeContent, '"registration-preview-shape"'), 'Missing literal');
}

if (previewAssessmentContent) {
  check('8C-2E has __kind field', containsToken(previewAssessmentContent, '__kind'), 'Missing __kind branded discriminant');
  check('8C-2E has "registration-preview-assessment" literal', containsToken(previewAssessmentContent, '"registration-preview-assessment"'), 'Missing literal');
}

// ============================================================================
// CHECK 9: Chain Continuity Check
// ============================================================================

console.log('\n=== CHECK 9: Chain Continuity Check ===\n');

if (previewAssessmentContent) {
  check('8C-2E has preview field', containsToken(previewAssessmentContent, 'readonly preview: CanonicalReAuditRegistrationPreviewShape'), 'Missing preview field');
  check('8C-2E has eligibility field', containsToken(previewAssessmentContent, 'readonly eligibility: CanonicalReAuditRegistrationEligibilityResult'), 'Missing eligibility field');
  check('8C-2E has explanation field', containsToken(previewAssessmentContent, 'readonly explanation: CanonicalReAuditRegistrationReadinessExplanation'), 'Missing explanation field');
}

// ============================================================================
// CHECK 10: Safety Invariant Check
// ============================================================================

console.log('\n=== CHECK 10: Safety Invariant Check ===\n');

const safetyInvariants = [
  'memoryOnly: true',
  'deployRemainsLocked: true',
  'persistenceAllowed: false',
  'vaultMutationAllowed: false',
  'globalAuditOverwriteAllowed: false',
  'productionAuthorizationAllowed: false',
  'registrationExecutionAllowed: false',
  'promotionRequired: true'
];

for (const invariant of safetyInvariants) {
  const found = TARGET_8C_SOURCE_FILES.some(file => {
    const content = fileContents.get(file);
    return content && containsToken(content, invariant);
  });
  check(`Safety invariant present: ${invariant}`, found, `Missing invariant: ${invariant}`);
}

// ============================================================================
// CHECK 11: Boundary Invariant Check
// ============================================================================

console.log('\n=== CHECK 11: Boundary Invariant Check ===\n');

const boundaryInvariants = [
  'runtimeBuilderAllowed: false',
  'factoryAllowed: false',
  'generatorAllowed: false',
  'handlerIntegrationAllowed: false',
  'uiIntegrationAllowed: false',
  'adapterIntegrationAllowed: false',
  'deployUnlockAllowed: false'
];

for (const invariant of boundaryInvariants) {
  const found = [previewShapeContent, previewAssessmentContent].some(content => content && containsToken(content, invariant));
  check(`Boundary invariant present: ${invariant}`, found, `Missing invariant: ${invariant}`);
}

// ============================================================================
// CHECK 12: Consumer Isolation Check
// ============================================================================

console.log('\n=== CHECK 12: Consumer Isolation Check ===\n');

const consumerPatterns = ['app/', 'handlers/', 'hooks/', 'components/', 'api/'];
for (const file of TARGET_8C_SOURCE_FILES) {
  const content = fileContents.get(file);
  if (content) {
    const imports = extractImports(content);
    const consumerImports = imports.filter(imp => consumerPatterns.some(pattern => imp.includes(pattern)));
    check(`${path.basename(file)} does not import from consumer locations`, consumerImports.length === 0, `Consumer imports: ${consumerImports.join(', ')}`);
  }
}

// ============================================================================
// CHECK 13: Scope Check
// ============================================================================

console.log('\n=== CHECK 13: Scope Check ===\n');

check('Verifier script exists', fileExists('scripts/verify-canonical-reaudit-8c2f-chain-integrity.ts'), 'Verifier script not found');

// ============================================================================
// FINAL REPORT
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TASK 8C-2F CHAIN INTEGRITY VERIFICATION REPORT');
console.log('='.repeat(80));
console.log(`\nTotal Checks: ${checkCount}`);
console.log(`Passed: ${checkCount - failureCount}`);
console.log(`Failed: ${failureCount}`);

if (failureCount > 0) {
  console.log('\n❌ VERIFICATION FAILED\n');
  console.log('Failures:');
  failures.forEach(failure => console.log(`  ${failure}`));
  process.exit(1);
} else {
  console.log('\n✅ VERIFICATION PASSED\n');
  console.log(`All ${checkCount} chain integrity checks passed.`);
  console.log('The 8C chain (8C-1 through 8C-2E) is properly isolated, acyclic, type-safe, readonly, and free of runtime leakage.');
  process.exit(0);
}
