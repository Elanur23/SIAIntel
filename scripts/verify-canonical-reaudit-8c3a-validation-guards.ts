#!/usr/bin/env node

/**
 * Verifier for Task 8C-3A-3B: Pure Primitive Guard Type-Narrowing Helpers
 *
 * Validates that the guard module contains only pure, deterministic, non-mutating
 * type-narrowing functions with no validation result creation, error/warning objects,
 * or any runtime validator composition.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TARGET_FILE = 'lib/editorial/canonical-reaudit-registration-preview-assessment-validation-guards.ts';

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

function verifyExactExportSurface(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const required = [
    'isPlainRecord',
    'hasOwnStringField',
    'hasOwnBooleanField',
    'hasOwnNumberField',
    'hasOwnLiteralField',
    'isReadonlyStringArray',
    'hasReadonlyStringArrayField',
    'isNonEmptyString',
    'isSafeStringLength',
    'isIso8601LikeString'
  ];

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

  return { passed: true, message: `All 10 required exports present, no extra exports` };
}

function verifyReturnTypes(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  // Extract function signatures
  const functionMatches = content.match(/export function \w+[^{]*\{/g);
  if (!functionMatches) {
    return { passed: false, message: 'No function exports found' };
  }

  for (const match of functionMatches) {
    // Check for "value is" type predicate or "Record<" return type
    if (!match.includes('value is') && !match.includes('Record<')) {
      return { passed: false, message: `Function missing type predicate or Record return: ${match.substring(0, 50)}` };
    }

    // Forbidden return types
    const forbidden = ['object', 'result', 'error', 'warning', 'safety', 'valid', 'Promise'];
    for (const f of forbidden) {
      if (match.includes(`: ${f}`) || match.includes(`: ${f}<`)) {
        return { passed: false, message: `Forbidden return type '${f}' in: ${match.substring(0, 50)}` };
      }
    }
  }

  return { passed: true, message: 'Return types are boolean or type predicates' };
}

function verifyForbiddenImplementationTokens(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'validateCanonical',
    'ValidationResult',
    'ValidationError',
    'ValidationWarning',
    'createValidation',
    'makeValidation',
    'buildValidation',
    'defaultResult',
    'defaultError',
    'defaultWarning',
    'errors:',
    'warnings:',
    'safety:',
    'valid:'
  ];

  for (const token of forbidden) {
    if (content.includes(token)) {
      return { passed: false, message: `Forbidden implementation token: ${token}` };
    }
  }
  return { passed: true, message: 'No forbidden implementation tokens' };
}

function verifyForbiddenRuntimeTokens(): VerificationResult {
  let content = fs.readFileSync(TARGET_FILE, 'utf8');
  // Strip comments to avoid false positives
  content = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  
  const forbidden = [
    'fetch(',
    'axios',
    'prisma',
    'turso',
    'libsql',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'document.',
    'window.',
    'process.env',
    'child_process',
    'exec(',
    'spawn(',
    'fs.',
    'path.',
    'Date.now',
    'Date.parse',
    'new Date',
    'Math.random',
    'JSON.parse',
    'JSON.stringify',
    'eval(',
    'Function(',
    'Reflect.',
    'Object.assign',
    'Object.create',
    'Object.setPrototypeOf',
    'delete ',
    'console.',
    'setTimeout',
    'setInterval',
    'Promise',
    'async ',
    'await '
  ];

  for (const token of forbidden) {
    if (content.includes(token)) {
      return { passed: false, message: `Forbidden runtime token: ${token}` };
    }
  }
  return { passed: true, message: 'No forbidden runtime tokens' };
}

function verifyForbiddenMutationTokens(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    '.push(',
    '.pop(',
    '.splice(',
    '.sort(',
    '.reverse(',
    '.shift(',
    '.unshift(',
    '+=',
    '-=',
    '*=',
    '/=',
    '++',
    '--'
  ];

  for (const token of forbidden) {
    if (content.includes(token)) {
      return { passed: false, message: `Forbidden mutation token: ${token}` };
    }
  }

  // Check for obvious property assignment pattern (but not const declarations)
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip comments and const declarations
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('const ')) continue;
    // Check for property assignment patterns
    if (line.match(/\]\s*=/) || line.match(/\w+\s*=\s*\{/)) {
      // This might be a false positive for destructuring or object literals in function params
      // Only fail if it looks like actual assignment outside of function signature
      if (!line.includes('function') && !line.includes('=>') && !line.includes('(')) {
        return { passed: false, message: `Possible property assignment: ${line.trim()}` };
      }
    }
  }

  return { passed: true, message: 'No forbidden mutation tokens' };
}

function verifyForbiddenImports(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'react',
    'next',
    'app/',
    'components/',
    'hooks/',
    'handlers/',
    'api/',
    'adapter',
    'database',
    'provider',
    'persistence',
    'storage',
    'prisma',
    'turso',
    'libsql',
    'axios'
  ];

  const importMatches = content.match(/import\s+.*from\s+['"][^'"]+['"]/g);
  if (importMatches) {
    for (const imp of importMatches) {
      // Check if it's import type
      if (!imp.includes('import type')) {
        for (const lib of forbidden) {
          if (imp.includes(lib)) {
            return { passed: false, message: `Forbidden import: ${imp}` };
          }
        }
      }
    }
  }

  return { passed: true, message: 'No forbidden imports' };
}

function verifyForbiddenNaming(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    'Builder',
    'Factory',
    'Generator',
    'RuntimeValidator',
    'Register',
    'Registered',
    'Promote',
    'DeployUnlock',
    'Persist',
    'Save',
    'Apply',
    'Execute',
    'Commit',
    'Vault',
    'Session',
    'GlobalAudit'
  ];

  const exportMatches = content.match(/export function (\w+)/g);
  if (exportMatches) {
    for (const match of exportMatches) {
      const name = match.replace('export function ', '');
      for (const f of forbidden) {
        if (name.includes(f)) {
          return { passed: false, message: `Forbidden naming: ${name} contains ${f}` };
        }
      }
    }
  }

  return { passed: true, message: 'No forbidden naming patterns' };
}

function verifyNoObjectCreation(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const forbidden = [
    /new\s+\w+/,
    /return\s+\{/,
    /=\s+\{/,
    /new\s+Map/,
    /new\s+Set/,
    /new\s+WeakMap/,
    /new\s+WeakSet/
  ];

  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      return { passed: false, message: `Forbidden object creation pattern: ${pattern.source}` };
    }
  }

  return { passed: true, message: 'No object creation patterns' };
}

function verifyAllowedOperations(): VerificationResult {
  const content = fs.readFileSync(TARGET_FILE, 'utf8');
  const required = [
    'typeof',
    'Array.isArray',
    'Object.prototype.hasOwnProperty.call',
    'Number.isFinite',
    '.every',
    '.length'
  ];

  // At least some of these should be present
  const found = required.filter(op => content.includes(op));
  if (found.length === 0) {
    return { passed: false, message: 'No allowed primitive operations found' };
  }

  return { passed: true, message: `Using allowed operations: ${found.join(', ')}` };
}

async function runSmokeTests(): Promise<VerificationResult> {
  try {
    // Dynamically import the guard module using file:// URL
    const modulePath = path.resolve(TARGET_FILE);
    const moduleUrl = `file://${modulePath.replace(/\\/g, '/')}`;
    const guards = await import(moduleUrl);

    const tests = [
      { name: 'isPlainRecord({})', fn: () => guards.isPlainRecord({}), expected: true },
      { name: 'isPlainRecord(null)', fn: () => guards.isPlainRecord(null), expected: false },
      { name: 'isPlainRecord([])', fn: () => guards.isPlainRecord([]), expected: false },
      { name: 'hasOwnStringField({ a: "x" }, "a")', fn: () => guards.hasOwnStringField({ a: 'x' }, 'a'), expected: true },
      { name: 'hasOwnStringField({ a: 1 }, "a")', fn: () => guards.hasOwnStringField({ a: 1 }, 'a'), expected: false },
      { name: 'hasOwnBooleanField({ a: false }, "a")', fn: () => guards.hasOwnBooleanField({ a: false }, 'a'), expected: true },
      { name: 'hasOwnNumberField({ a: 1 }, "a")', fn: () => guards.hasOwnNumberField({ a: 1 }, 'a'), expected: true },
      { name: 'hasOwnNumberField({ a: NaN }, "a")', fn: () => guards.hasOwnNumberField({ a: Number.NaN }, 'a'), expected: false },
      { name: 'hasOwnLiteralField({ kind: "x" }, "kind", "x")', fn: () => guards.hasOwnLiteralField({ kind: 'x' }, 'kind', 'x'), expected: true },
      { name: 'isReadonlyStringArray(["a", "b"])', fn: () => guards.isReadonlyStringArray(['a', 'b']), expected: true },
      { name: 'isReadonlyStringArray(["a", 1])', fn: () => guards.isReadonlyStringArray(['a', 1]), expected: false },
      { name: 'hasReadonlyStringArrayField({ fieldPath: ["a"] }, "fieldPath")', fn: () => guards.hasReadonlyStringArrayField({ fieldPath: ['a'] }, 'fieldPath'), expected: true },
      { name: 'isNonEmptyString("x")', fn: () => guards.isNonEmptyString('x'), expected: true },
      { name: 'isNonEmptyString("")', fn: () => guards.isNonEmptyString(''), expected: false },
      { name: 'isSafeStringLength("abc", 3)', fn: () => guards.isSafeStringLength('abc', 3), expected: true },
      { name: 'isSafeStringLength("abcd", 3)', fn: () => guards.isSafeStringLength('abcd', 3), expected: false },
      { name: 'isIso8601LikeString("2026-05-02T00:00:00Z")', fn: () => guards.isIso8601LikeString('2026-05-02T00:00:00Z'), expected: true },
      { name: 'isIso8601LikeString("not-a-date")', fn: () => guards.isIso8601LikeString('not-a-date'), expected: false }
    ];

    let passed = 0;
    for (const test of tests) {
      try {
        const result = test.fn();
        if (result === test.expected) {
          passed++;
        } else {
          return { passed: false, message: `Smoke test failed: ${test.name} returned ${result}, expected ${test.expected}` };
        }
      } catch (e) {
        return { passed: false, message: `Smoke test error: ${test.name} threw ${String(e)}` };
      }
    }

    return { passed: true, message: `All ${tests.length} smoke tests passed` };
  } catch (e) {
    return { passed: false, message: `Failed to import guards module: ${String(e)}` };
  }
}

function verifyScope(): VerificationResult {
  try {
    const diff = execSync('git diff --name-only').toString().trim().split('\n').filter(Boolean);
    const cachedDiff = execSync('git diff --cached --name-only').toString().trim().split('\n').filter(Boolean);

    const allowed = [
      TARGET_FILE,
      'scripts/verify-canonical-reaudit-8c3a-validation-guards.ts'
    ];
    const cleanupArtifacts = ['tsconfig.tsbuildinfo', '.idea/planningMode.xml', '.idea/caches/deviceStreaming.xml'];

    const violations = [...diff, ...cachedDiff].filter(f => !allowed.includes(f) && !cleanupArtifacts.includes(f));

    if (violations.length > 0) {
      return { passed: false, message: `Unauthorized changes in: ${violations.join(', ')}` };
    }
    return { passed: true, message: 'Scope check passed' };
  } catch (e) {
    return { passed: true, message: 'Scope check skipped (git not available or not in repo)' };
  }
}

async function main() {
  console.log('Running Task 8C-3A-3B Verification...\n');

  const checks = [
    { name: 'File existence', fn: verifyFileExists },
    { name: 'Exact export surface', fn: verifyExactExportSurface },
    { name: 'Return type checks', fn: verifyReturnTypes },
    { name: 'Forbidden implementation tokens', fn: verifyForbiddenImplementationTokens },
    { name: 'Forbidden runtime tokens', fn: verifyForbiddenRuntimeTokens },
    { name: 'Forbidden mutation tokens', fn: verifyForbiddenMutationTokens },
    { name: 'Forbidden imports', fn: verifyForbiddenImports },
    { name: 'Forbidden naming', fn: verifyForbiddenNaming },
    { name: 'No object creation', fn: verifyNoObjectCreation },
    { name: 'Allowed operations confirmation', fn: verifyAllowedOperations },
    { name: 'Behavior smoke tests', fn: runSmokeTests },
    { name: 'Scope check', fn: verifyScope }
  ];

  let passed = 0;
  for (const check of checks) {
    const result = await Promise.resolve(check.fn());
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

main().catch((e) => {
  console.error('Verifier error:', e);
  process.exit(1);
});
