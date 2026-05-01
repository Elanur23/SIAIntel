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

// 1. No page.tsx canonical re-audit wiring
const pageSource = readIfExists(pagePath);
assert(!pageSource.includes('useCanonicalReAudit'), 'page.tsx does not reference useCanonicalReAudit');
assert(!pageSource.includes('startCanonicalReAudit'), 'page.tsx does not call startCanonicalReAudit');

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
