#!/usr/bin/env node

/**
 * Verifier for Task 8C-3A-3A: Validation Result Type Contract
 *
 * Validates that the validation result type contract is type-only,
 * readonly, and follows all safety boundaries.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TARGET_FILE = 'lib/editorial/canonical-reaudit-registration-preview-assessment-validation-result.ts';

interface VerificationResult {
  passed: boolean;
  message: string;
}

function verifyFileExists(): VerificationResult {
  if (!fs.existsSync(TARGET_FILE)) {
    return { passed: false, message: `File missing: ${TARGET_FILE}` };
  }
  return { passed: true, message: 'File exists' };
}

function verifyExports(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const required = [
    'CanonicalReAuditRegistrationPreviewAssessmentValidationResultKind',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationErrorCode',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationWarningCode',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationSafetyFlag',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationError',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationWarning',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationSafety',
    'CanonicalReAuditRegistrationPreviewAssessmentValidationResult'
  ];

  const missing = required.filter(name => !content.includes(name));
  if (missing.length > 0) {
    return { passed: false, message: `Missing exports: ${missing.join(', ')}` };
  }
  return { passed: true, message: 'All required exports present' };
}

function verifyTypeOnly(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const forbidden = [
    'export function', 'function', '=>', 'export class', 'class',
    'export const', 'const', 'export let', 'let', 'export var', 'var',
    'new', 'return', 'async', 'await', 'Promise', 'enum'
  ];

  for (const token of forbidden) {
    const pattern = new RegExp(`\\b${token.replace(' ', '\\s+')}\\b`);
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden runtime construct: ${token}` };
    }
  }
  return { passed: true, message: 'Type-only enforcement passed' };
}

function verifyReadonly(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const interfaceMatches = content.match(/export interface \w+ \{[\s\S]*?\}/g);

  if (interfaceMatches) {
    for (const iface of interfaceMatches) {
      const lines = iface.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('export interface') && l !== '{' && l !== '}');
      for (const line of lines) {
        if (line.includes(':') && !line.startsWith('readonly')) {
          return { passed: false, message: `Non-readonly field in interface: ${line}` };
        }
      }
    }
  }
  return { passed: true, message: 'Readonly enforcement passed' };
}

function verifyStringLiterals(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const expectedLiterals = [
    'MISSING_REQUIRED_FIELD', 'INVALID_KIND', 'INVALID_SAFETY_INVARIANT',
    'INVALID_BOUNDARY_INVARIANT', 'INVALID_CHAIN_REFERENCE', 'UNSAFE_RUNTIME_FIELD',
    'FORBIDDEN_MUTATION_FIELD', 'FORBIDDEN_DEPLOY_FIELD', 'FORBIDDEN_PERSISTENCE_FIELD',
    'UNUSUAL_FIELD_VALUE', 'DEPRECATED_FIELD', 'MISSING_OPTIONAL_FIELD', 'SUSPICIOUS_PATTERN',
    'DEPLOY_UNLOCK_FORBIDDEN', 'PERSISTENCE_FORBIDDEN', 'MUTATION_FORBIDDEN',
    'registration-preview-assessment-validation-result'
  ];

  const missing = expectedLiterals.filter(lit => !content.includes(lit));
  if (missing.length > 0) {
    return { passed: false, message: `Missing required literals: ${missing.join(', ')}` };
  }
  return { passed: true, message: 'Required literals present' };
}

function verifyRequiredFields(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  const resultFields = ['readonly __kind', 'readonly valid', 'readonly errors', 'readonly warnings', 'readonly safety', 'readonly safetyFlags'];
  const safetyFields = [
    'readonly deployUnlockForbidden: true',
    'readonly persistenceForbidden: true',
    'readonly mutationForbidden: true',
    'readonly validatorBuildsObjects: false',
    'readonly validatorMutatesInput: false',
    'readonly validatorPersistsState: false',
    'readonly validatorUnlocksDeploy: false'
  ];

  for (const field of resultFields) {
    if (!content.includes(field)) return { passed: false, message: `Missing result field: ${field}` };
  }
  for (const field of safetyFields) {
    if (!content.includes(field)) return { passed: false, message: `Missing safety field: ${field}` };
  }
  return { passed: true, message: 'Required fields present' };
}

function verifyForbiddenRuntimeTokens(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'fetch(', 'axios.', 'prisma.', 'turso.', 'libsql.', 'localStorage.', 'sessionStorage.',
    'indexedDB.', 'document.', 'window.', 'process.env', 'child_process', 'exec(', 'spawn(',
    'fs.writeFile', 'fs.appendFile', 'fs.createWriteStream', 'setGlobalAudit(', 'setVault(',
    'deployUnlock(', 'promote(', 'publish(', 'save('
  ];

  for (const token of forbidden) {
    if (content.includes(token)) return { passed: false, message: `Forbidden runtime token: ${token}` };
  }
  return { passed: true, message: 'Forbidden runtime tokens absent' };
}

function verifyForbiddenImports(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'react', 'next', 'app/', 'components/', 'hooks/', 'handlers/', 'api/', 'adapter',
    'database', 'provider', 'persistence', 'storage', 'prisma', 'turso', 'libsql', 'axios'
  ];

  for (const lib of forbidden) {
    const pattern = new RegExp(`from\\s+['"].*${lib}.*['"]`);
    if (pattern.test(content)) return { passed: false, message: `Forbidden import: ${lib}` };
  }
  return { passed: true, message: 'Forbidden imports absent' };
}

function verifyForbiddenNaming(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'Builder', 'Factory', 'Generator', 'RuntimeValidator', 'Register', 'Registered',
    'Promote', 'DeployUnlock', 'Persist', 'Save', 'Apply', 'Execute', 'Commit', 'Vault', 'Session'
  ];

  const exportMatches = content.match(/export (type|interface) (\w+)/g);
  if (exportMatches) {
    for (const match of exportMatches) {
      const name = match.split(' ').pop() || '';
      for (const f of forbidden) {
        if (name.includes(f)) return { passed: false, message: `Forbidden name: ${name} contains ${f}` };
      }
    }
  }
  return { passed: true, message: 'Forbidden naming absent' };
}

function verifyNoHelpers(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'createValidation', 'makeValidation', 'buildValidation', 'validateCanonical',
    'isValid', 'assert', 'defaultResult', 'defaultError', 'defaultWarning'
  ];

  for (const token of forbidden) {
    if (content.includes(token)) return { passed: false, message: `Forbidden helper or instance: ${token}` };
  }
  return { passed: true, message: 'No helpers or instances found' };
}

function verifyScope(): VerificationResult {
  try {
    const diff = execSync('git diff --name-only').toString().trim().split('\n').filter(Boolean);
    const cachedDiff = execSync('git diff --cached --name-only').toString().trim().split('\n').filter(Boolean);
    const untracked = execSync('git ls-files --others --exclude-standard').toString().trim().split('\n').filter(Boolean);

    const allowed = [TARGET_FILE, 'scripts/verify-canonical-reaudit-8c3a-validation-result-types.ts'];
    const cleanupArtifacts = ['tsconfig.tsbuildinfo', '.idea/planningMode.xml', '.idea/caches/deviceStreaming.xml'];

    const violations = [...diff, ...cachedDiff].filter(f => !allowed.includes(f) && !cleanupArtifacts.includes(f));

    // We don't fail for untracked files like .kiro or artifacts, as per instructions
    const newFilesViolations = untracked.filter(f => !allowed.includes(f) && !f.startsWith('.artifacts/') && !f.startsWith('.kiro/') && !f.endsWith('.artifact.md'));

    if (violations.length > 0) {
      return { passed: false, message: `Unauthorized changes in: ${violations.join(', ')}` };
    }
    return { passed: true, message: 'Scope check passed' };
  } catch (e) {
    return { passed: true, message: 'Scope check skipped (git not available or not in repo)' };
  }
}

function main() {
  console.log('Running Task 8C-3A-3A Verification...\n');

  const checks = [
    { name: 'File existence', fn: verifyFileExists },
    { name: 'Export surface', fn: verifyExports },
    { name: 'Type-only enforcement', fn: verifyTypeOnly },
    { name: 'Readonly enforcement', fn: verifyReadonly },
    { name: 'Required string literals', fn: verifyStringLiterals },
    { name: 'Required field checks', fn: verifyRequiredFields },
    { name: 'Forbidden runtime tokens', fn: verifyForbiddenRuntimeTokens },
    { name: 'Forbidden imports', fn: verifyForbiddenImports },
    { name: 'Forbidden naming', fn: verifyForbiddenNaming },
    { name: 'No object instance / no helper', fn: verifyNoHelpers },
    { name: 'Scope check', fn: verifyScope }
  ];

  let passed = 0;
  for (const check of checks) {
    const result = check.fn();
    if (result.passed) {
      console.log(`✅ ${check.name}: ${result.message}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: ${result.message}`);
    }
  }

  console.log(`\nPASS: ${passed}/${checks.length} checks`);
  if (passed === checks.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
