/**
 * Verification script for Task 6 post-5C boundaries.
 */

import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILURE: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

function readIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function countMatches(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function findMatchingParen(source: string, openParenIndex: number): number {
  let depth = 0;
  for (let i = openParenIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractUseEffectCalls(source: string): string[] {
  const calls: string[] = [];
  let idx = 0;
  while (idx < source.length) {
    const start = source.indexOf('useEffect', idx);
    if (start === -1) break;
    const openParen = source.indexOf('(', start);
    if (openParen === -1) break;
    const closeParen = findMatchingParen(source, openParen);
    if (closeParen === -1) break;
    calls.push(source.slice(start, closeParen + 1));
    idx = closeParen + 1;
  }
  return calls;
}

function extractCanonicalPanelPropsBlock(source: string): string | null {
  const match = source.match(/<CanonicalReAuditPanel([\s\S]*?)\/>/m);
  if (!match) return null;
  return match[1] || '';
}

function assertReadOnlyPageWiring(pageSource: string): void {
  // Core: still forbid direct startCanonicalReAudit usage
  assert(!pageSource.includes('startCanonicalReAudit'), 'page.tsx does not call startCanonicalReAudit');

  // If Task 7B wiring is present, enforce strict read-only constraints.
  const referencesHook = pageSource.includes('useCanonicalReAudit');
  if (!referencesHook) {
    assert(true, 'page.tsx does not reference useCanonicalReAudit');
    return;
  }

  assert(true, 'page.tsx references useCanonicalReAudit (phase-aware allowance)');

  // Ensure hook is instantiated exactly once.
  const hookCallCount = countMatches(pageSource, /useCanonicalReAudit\s*\(/g);
  assert(hookCallCount === 1, `page.tsx instantiates useCanonicalReAudit exactly once (found ${hookCallCount})`);

  // No execution or state mutation calls
  const forbiddenCalls = [
    'canonicalReAudit.run(', 
    'canonicalReAudit.reset(', 
    'canonicalReAudit.clearError(',
  ];
  for (const token of forbiddenCalls) {
    assert(!pageSource.includes(token), `page.tsx does not call ${token}`);
  }

  // No auto-trigger patterns
  const effects = extractUseEffectCalls(pageSource);
  let hasEffectWithCanonical = false;
  for (const effect of effects) {
    if (effect.includes('canonicalReAudit')) {
      hasEffectWithCanonical = true;
      break;
    }
  }
  assert(!hasEffectWithCanonical, 'page.tsx does not useEffect auto-trigger canonicalReAudit');

  // No forbidden props passed to CanonicalReAuditPanel (read-only wiring only)
  const panelProps = extractCanonicalPanelPropsBlock(pageSource);
  assert(panelProps !== null, 'page.tsx renders CanonicalReAuditPanel');
  const forbiddenPanelPropTokens = [
    'run=',
    'reset=',
    'clearError=',
    'onStatusChange=',
    'onResult=',
    'onRun=',
    'onReset=',
    'onAccept=',
    'onPromote=',
    'onDeploy=',
    'onSave=',
  ];
  for (const token of forbiddenPanelPropTokens) {
    assert(!panelProps!.includes(token), `CanonicalReAuditPanel does not receive forbidden prop ${token}`);
  }

  // No trigger UI tied to canonical re-audit
  assert(!/onClick\s*=\s*\{[^}]*canonicalReAudit[^}]*\}/m.test(pageSource), 'page.tsx does not introduce onClick tied to canonicalReAudit');
  assert(!/<button[^>]*canonicalReAudit[^>]*>/m.test(pageSource), 'page.tsx does not introduce button tied to canonicalReAudit');

  // No deploy unlock introduced by canonical re-audit wiring
  assert(!pageSource.includes('deployUnlockAllowed: true'), 'page.tsx does not introduce deployUnlockAllowed: true');

  // Guardrails: canonical re-audit wiring must not mutate global audit or vault.
  // page.tsx already legitimately contains setGlobalAudit/setVault for other workflows; we only
  // enforce that canonicalReAudit itself is not coupled to these setters.
  assert(!/setGlobalAudit\s*\(\s*canonicalReAudit/m.test(pageSource), 'page.tsx does not couple canonicalReAudit to setGlobalAudit');
  assert(!/setVault\s*\(\s*canonicalReAudit/m.test(pageSource), 'page.tsx does not couple canonicalReAudit to setVault');
}

function walkFiles(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TASK 6: POST-5C BOUNDARIES VERIFICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const repoRoot = process.cwd();
const hookPath = path.join(repoRoot, 'app/admin/warroom/hooks/useCanonicalReAudit.ts');
const pagePath = path.join(repoRoot, 'app/admin/warroom/page.tsx');
const componentsDir = path.join(repoRoot, 'app/admin/warroom/components');
const handlerPath = path.join(repoRoot, 'app/admin/warroom/handlers/canonical-reaudit-handler.ts');

// 1. Phase-aware page.tsx canonical re-audit wiring policy
const pageSource = readIfExists(pagePath);
assertReadOnlyPageWiring(pageSource);

// 2. No UI component canonical re-audit wiring
const componentFiles = walkFiles(componentsDir, ['.ts', '.tsx']);
for (const file of componentFiles) {
  const source = readIfExists(file);
  assert(!source.includes('useCanonicalReAudit'), `UI component ${path.basename(file)} does not reference useCanonicalReAudit`);
  assert(!source.includes('startCanonicalReAudit'), `UI component ${path.basename(file)} does not call startCanonicalReAudit`);
}

// 3. No production UI/page call sites of startCanonicalReAudit
const warroomRoot = path.join(repoRoot, 'app/admin/warroom');
const warroomFiles = walkFiles(warroomRoot, ['.ts', '.tsx']);
for (const file of warroomFiles) {
  const normalized = path.normalize(file);
  if (normalized === path.normalize(handlerPath)) continue;
  if (normalized === path.normalize(hookPath)) continue;
  const source = readIfExists(file);
  assert(!source.includes('startCanonicalReAudit'), `No startCanonicalReAudit call in ${path.relative(repoRoot, file)}`);
}

// 4. No forbidden patterns in hook (safety boundary)
const hookSource = readIfExists(hookPath);
const forbiddenTokens = [
  'deployUnlockAllowed: true',
  'setGlobalAudit',
  'setVault',
  'localStorage',
  'sessionStorage',
  'fetch(',
  'axios',
  'prisma',
  'libsql',
  'turso'
];
for (const token of forbiddenTokens) {
  assert(!hookSource.includes(token), `Hook does not contain forbidden token ${token}`);
}

// 5. Hook remains memory-only
assert(hookSource.includes('memoryOnly: true'), 'Hook enforces memoryOnly: true');

// 6. No forbidden imports in hook
const forbiddenImports = ['next/server', 'next/headers', 'server-only', 'cookies', 'fs', 'path', 'crypto', 'node:'];
for (const token of forbiddenImports) {
  assert(!hookSource.includes(token), `Hook does not import ${token}`);
}

// 7. Task 5C execution verification script exists (regression requirement)
const execVerifyPath = path.join(repoRoot, 'scripts/verify-canonical-reaudit-handler-execution.ts');
assert(
  fs.existsSync(execVerifyPath),
  'Task 5C execution verification script exists for regression checks'
);

console.log('\n✅ Post-5C boundaries verification complete.');
console.log('NOTE: Run scripts/verify-canonical-reaudit-handler-execution.ts as a regression check.');
