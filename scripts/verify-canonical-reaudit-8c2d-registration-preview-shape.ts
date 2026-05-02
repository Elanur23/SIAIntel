/**
 * Verification Script for Task 8C-2D
 * Type-Only Dry Registration Preview Shape Contract
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - READ-ONLY VERIFICATION ONLY
 * - NO FILE MODIFICATIONS
 * - NO ARTIFACT WRITES
 * - NO GIT OPERATIONS
 * - NO DEPLOY OPERATIONS
 * - STDOUT OUTPUT ONLY
 * 
 * @version 8C-2D.0.0
 * @author SIA Intelligence Systems
 */

import * as fs from 'fs';
import * as path from 'path';

const PREVIEW_SHAPE_FILE = path.join(
  process.cwd(),
  'lib/editorial/canonical-reaudit-registration-preview-shape.ts'
);

let checkCount = 0;
let failureCount = 0;
const failures: string[] = [];

function log(msg: string): void {
  console.log(`[VERIFY-8C2D] ${msg}`);
}

function error(msg: string): void {
  console.error(`[VERIFY-8C2D] ERROR: ${msg}`);
  failures.push(msg);
  failureCount++;
}

function check(name: string, condition: boolean, failureMessage: string): void {
  checkCount++;
  if (!condition) {
    error(`[CHECK ${checkCount}] ${name}: ${failureMessage}`);
  } else {
    log(`✅ [CHECK ${checkCount}] ${name}`);
  }
}

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

function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  const typeExportRegex = /export\s+(?:type|interface)\s+(\w+)/g;
  let match;
  while ((match = typeExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
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

function containsToken(content: string, token: string): boolean {
  return content.includes(token);
}

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
}

function verifyReadonlyFields(content: string): boolean {
  const strippedContent = stripComments(content);
  
  const interfaceBlocks: string[] = [];
  const interfaceRegex = /export\s+interface\s+\w+\s*{([^}]*)}/g;
  let match;
  while ((match = interfaceRegex.exec(strippedContent)) !== null) {
    interfaceBlocks.push(match[1]);
  }
  
  for (const block of interfaceBlocks) {
    const fieldLines = block.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('*');
    });
    
    for (const line of fieldLines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':') && !trimmed.startsWith('readonly')) {
        return false;
      }
    }
  }
  
  return true;
}

async function verify(): Promise<void> {
  log('Starting Task 8C-2D Verification...');
  
  log('\n=== CHECK 1: File Existence ===\n');
  check(
    'Preview shape file exists',
    fileExists(PREVIEW_SHAPE_FILE),
    `File not found: ${PREVIEW_SHAPE_FILE}`
  );
  
  if (!fileExists(PREVIEW_SHAPE_FILE)) {
    log('\n❌ VERIFICATION FAILED: Preview shape file missing\n');
    process.exit(1);
  }
  
  const content = readFileContent(PREVIEW_SHAPE_FILE);
  if (!content) {
    error('Failed to read preview shape file');
    process.exit(1);
  }
  
  log('\n=== CHECK 2: Export Checks ===\n');
  const exports = extractExports(content);
  const requiredExports = [
    'CanonicalReAuditRegistrationPreviewKind',
    'CanonicalReAuditRegistrationPreviewSafety',
    'CanonicalReAuditRegistrationPreviewChangeSummary',
    'CanonicalReAuditRegistrationPreviewShape',
    'CanonicalReAuditRegistrationPreviewBoundary'
  ];
  
  for (const expectedExport of requiredExports) {
    check(
      `Exports ${expectedExport}`,
      exports.includes(expectedExport),
      `Missing export: ${expectedExport}`
    );
  }
  
  log('\n=== CHECK 3: Type-Only Enforcement ===\n');
  const strippedContent = stripComments(content);
  
  const forbiddenPatterns = [
    { pattern: 'export function', name: 'export function' },
    { pattern: 'export class', name: 'export class' },
    { pattern: 'export const', name: 'export const' },
    { pattern: 'export let', name: 'export let' },
    { pattern: 'export var', name: 'export var' },
    { pattern: 'export enum', name: 'export enum' }
  ];
  
  for (const { pattern, name } of forbiddenPatterns) {
    check(
      `No ${name} declarations`,
      !strippedContent.includes(pattern),
      `Found forbidden ${name} declaration`
    );
  }
  
  log('\n=== CHECK 4: Import Safety ===\n');
  const imports = extractImports(content);
  
  const typeOnlyImportRegex = /import\s+type\s+/g;
  const allImportRegex = /import\s+/g;
  const typeOnlyCount = (content.match(typeOnlyImportRegex) || []).length;
  const allImportCount = (content.match(allImportRegex) || []).length;
  
  check(
    'All imports use import type',
    typeOnlyCount === allImportCount,
    `Found ${allImportCount - typeOnlyCount} non-type imports`
  );
  
  const allowedImports = [
    './canonical-reaudit-registration-state-types',
    './canonical-reaudit-registration-eligibility-types',
    './canonical-reaudit-registration-readiness-explanation'
  ];
  
  for (const imp of imports) {
    const isAllowed = allowedImports.some(allowed => imp.includes(allowed));
    check(
      `Import ${imp} is from allowed module`,
      isAllowed,
      `Forbidden import: ${imp}`
    );
  }
  
  const forbiddenImports = [
    'react', 'next', 'app/', 'components/', 'hooks/', 'handlers/', 'api/',
    'canonical-reaudit-adapter', 'canonical-reaudit-input-builder',
    'prisma', 'turso', 'libsql', 'axios', 'provider', 'database', 'storage', 'persistence'
  ];
  
  for (const forbidden of forbiddenImports) {
    check(
      `No import from ${forbidden}`,
      !imports.some(imp => imp.includes(forbidden)),
      `Found forbidden import: ${forbidden}`
    );
  }
  
  log('\n=== CHECK 5: Readonly Enforcement ===\n');
  check(
    'All interface fields are readonly',
    verifyReadonlyFields(content),
    'Found non-readonly fields in exported interfaces'
  );
  
  log('\n=== CHECK 6: Branded Discriminant Check ===\n');
  check(
    'Has __kind field',
    containsToken(content, '__kind'),
    'Missing __kind branded discriminant'
  );
  
  check(
    'Has CanonicalReAuditRegistrationPreviewKind type',
    containsToken(content, 'CanonicalReAuditRegistrationPreviewKind'),
    'Missing CanonicalReAuditRegistrationPreviewKind type'
  );
  
  check(
    'Has "registration-preview-shape" literal',
    containsToken(content, '"registration-preview-shape"'),
    'Missing "registration-preview-shape" literal'
  );
  
  log('\n=== CHECK 7: Safety Invariant Check ===\n');
  const safetyInvariants = [
    'readonly typeOnly: true',
    'readonly previewOnly: true',
    'readonly informationalOnly: true',
    'readonly memoryOnly: true',
    'readonly executionAllowed: false',
    'readonly registrationExecutionAllowed: false',
    'readonly persistenceAllowed: false',
    'readonly mutationAllowed: false',
    'readonly deployRemainsLocked: true',
    'readonly globalAuditOverwriteAllowed: false',
    'readonly vaultMutationAllowed: false',
    'readonly productionAuthorizationAllowed: false',
    'readonly promotionRequired: true'
  ];
  
  for (const invariant of safetyInvariants) {
    check(
      `Has safety invariant: ${invariant}`,
      containsToken(content, invariant),
      `Missing safety invariant: ${invariant}`
    );
  }
  
  log('\n=== CHECK 8: Boundary Invariant Check ===\n');
  const boundaryInvariants = [
    'readonly runtimeBuilderAllowed: false',
    'readonly factoryAllowed: false',
    'readonly generatorAllowed: false',
    'readonly handlerIntegrationAllowed: false',
    'readonly uiIntegrationAllowed: false',
    'readonly adapterIntegrationAllowed: false',
    'readonly deployUnlockAllowed: false'
  ];
  
  for (const invariant of boundaryInvariants) {
    check(
      `Has boundary invariant: ${invariant}`,
      containsToken(content, invariant),
      `Missing boundary invariant: ${invariant}`
    );
  }
  
  log('\n=== CHECK 9: Forbidden Active Runtime Token Check ===\n');
  const forbiddenTokens = [
    'fetch(', 'axios.', 'prisma.', 'turso.', 'libsql.',
    'localStorage.', 'sessionStorage.', 'indexedDB.',
    'document.', 'window.', 'process.env', 'child_process',
    'exec(', 'spawn(',
    'setGlobalAudit(', 'setVault(', 'setIsDeployBlocked(',
    'registerCanonicalReAudit(', 'transitionToRegistered(',
    'promote(', 'deployUnlock(', 'save(', 'publish(',
    'fs.writeFile', 'fs.appendFile', 'fs.createWriteStream'
  ];
  
  for (const token of forbiddenTokens) {
    check(
      `No forbidden token: ${token}`,
      !strippedContent.includes(token),
      `Found forbidden token: ${token}`
    );
  }
  
  log('\n=== CHECK 10: Forbidden Naming Check ===\n');
  const forbiddenNames = [
    'Payload', 'Transition', 'RegisteredPreview', 'RegisteredStatePreview',
    'Execute', 'Executor', 'Builder', 'Factory', 'Generator',
    'Persist', 'Save', 'Publish', 'DeployUnlock', 'Promote', 'Commit', 'Apply'
  ];
  
  for (const name of forbiddenNames) {
    const exportPattern = new RegExp(`export\\s+(?:type|interface)\\s+\\w*${name}\\w*`, 'g');
    check(
      `No forbidden name in exports: ${name}`,
      !exportPattern.test(content),
      `Found forbidden name in export: ${name}`
    );
  }
  
  check(
    'targetStageLabel is allowed',
    containsToken(content, 'targetStageLabel'),
    'targetStageLabel should be present as label field'
  );
  
  check(
    'targetStateStageLabel is allowed',
    containsToken(content, 'targetStateStageLabel'),
    'targetStateStageLabel should be present as label field'
  );
  
  log('\n=== CHECK 11: No Structural Methods Check ===\n');
  const methodPatterns = [
    /\w+\s*\([^)]*\)\s*:/,
    /readonly\s+\w+\s*:\s*\([^)]*\)\s*=>/,
    /readonly\s+\w+\s*:\s*Promise</
  ];
  
  for (const pattern of methodPatterns) {
    check(
      `No method signatures matching ${pattern}`,
      !pattern.test(strippedContent),
      `Found method signature matching ${pattern}`
    );
  }
  
  log('\n=== CHECK 12: No Object Instance / No Shape Builder Check ===\n');
  const objectInstancePatterns = [
    'new ', 'return ', 'createPreview', 'makePreview', 'buildPreview', 'generatePreview'
  ];
  
  for (const pattern of objectInstancePatterns) {
    check(
      `No object instance pattern: ${pattern}`,
      !strippedContent.includes(pattern),
      `Found object instance pattern: ${pattern}`
    );
  }
  
  log('\n=== CHECK 13: Boundary Compliance / Consumer Isolation Check ===\n');
  const consumerPatterns = ['app/', 'handlers/', 'hooks/', 'components/', 'api/'];
  
  log('Note: Consumer isolation check requires full codebase scan.');
  log('This check verifies the preview shape file does not import from consumer locations.');
  
  for (const pattern of consumerPatterns) {
    check(
      `No imports from consumer location: ${pattern}`,
      !imports.some(imp => imp.includes(pattern)),
      `Found import from consumer location: ${pattern}`
    );
  }
  
  log('\n=== CHECK 14: Scope Check ===\n');
  log('Note: Scope check requires git integration.');
  log('Manual verification: Only preview shape file and verifier should be changed.');
  
  check(
    'Preview shape file exists',
    fileExists(PREVIEW_SHAPE_FILE),
    'Preview shape file should exist'
  );
  
  check(
    'Verifier file exists',
    fileExists(__filename),
    'Verifier file should exist'
  );
  
  log('\n' + '='.repeat(80));
  log('TASK 8C-2D VERIFICATION REPORT');
  log('='.repeat(80));
  log(`\nTotal Checks: ${checkCount}`);
  log(`Passed: ${checkCount - failureCount}`);
  log(`Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    log('\n❌ VERIFICATION FAILED\n');
    log('Failures:');
    failures.forEach(failure => log(`  ${failure}`));
    process.exit(1);
  } else {
    log('\n✅ VERIFICATION PASSED\n');
    log('All type-only preview shape checks passed.');
    log('The registration preview shape is properly isolated and hardened.');
    process.exit(0);
  }
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
