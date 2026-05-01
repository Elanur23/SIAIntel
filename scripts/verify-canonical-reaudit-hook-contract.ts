/**
 * Verification script for Task 6: useCanonicalReAudit hook contract.
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

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TASK 6: CANONICAL RE-AUDIT HOOK CONTRACT VERIFICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const hookPath = path.join(
  process.cwd(),
  'app/admin/warroom/hooks/useCanonicalReAudit.ts'
);

assert(fs.existsSync(hookPath), 'Hook file exists at app/admin/warroom/hooks/useCanonicalReAudit.ts');

const hookSource = fs.readFileSync(hookPath, 'utf-8');

// 1. Hook is client-only
assert(/['"]use client['"]/.test(hookSource), 'Hook has "use client" directive');

// 2. Hook exports useCanonicalReAudit
assert(
  /export\s+(function|const)\s+useCanonicalReAudit/.test(hookSource),
  'Hook exports useCanonicalReAudit'
);

// 3. Hook imports startCanonicalReAudit
assert(
  hookSource.includes('startCanonicalReAudit') &&
    hookSource.includes('canonical-reaudit-handler'),
  'Hook imports startCanonicalReAudit directly'
);

// 4. No callbacks in contract
const forbiddenCallbacks = ['onStatusChange', 'onResult', 'onError', 'onComplete'];
for (const cb of forbiddenCallbacks) {
  assert(!hookSource.includes(cb), `Hook does not include ${cb}`);
}

// 5. No lastInput / lastVault retention
assert(!hookSource.includes('lastInput'), 'Hook does not store lastInput');
assert(!hookSource.includes('lastVault'), 'Hook does not store lastVault');

// 6. No storage or network usage
const forbiddenRuntime = [
  'localStorage',
  'sessionStorage',
  'fetch(',
  'axios',
  'prisma',
  'libsql',
  'turso'
];
for (const token of forbiddenRuntime) {
  assert(!hookSource.includes(token), `Hook does not use ${token}`);
}

// 7. No Node/server-only imports
const forbiddenNode = [
  'fs',
  'path',
  'crypto',
  'process.env',
  'Buffer',
  'node:',
  'next/server',
  'next/headers',
  'cookies',
  'server-only'
];
for (const token of forbiddenNode) {
  assert(!hookSource.includes(token), `Hook does not reference ${token}`);
}

// 8. No forbidden state setters or global mutations
assert(!hookSource.includes('setGlobalAudit'), 'Hook does not call setGlobalAudit');
assert(!hookSource.includes('setVault'), 'Hook does not call setVault');

// 9. No publish/save/promote/rollback/deploy patterns
const forbiddenActions = ['.publish(', '.save(', '.promote(', '.rollback(', '.deploy('];
for (const token of forbiddenActions) {
  assert(!hookSource.includes(token), `Hook does not include ${token}`);
}

// 10. No imports from page.tsx or UI components
assert(!hookSource.includes('page.tsx'), 'Hook does not import page.tsx');
assert(!/components\//.test(hookSource), 'Hook does not import UI components');

// 11. Strict request flags
const requiredFlags = [
  'manualTrigger: true',
  'memoryOnly: true',
  'deployUnlockAllowed: false',
  'backendPersistenceAllowed: false',
  'sessionAuditInheritanceAllowed: false'
];
for (const flag of requiredFlags) {
  assert(hookSource.includes(flag), `Hook sets ${flag}`);
}

// 12. Safety invariant validation exists
const invariantChecks = [
  'deployRemainsLocked',
  'globalAuditOverwriteAllowed',
  'backendPersistenceAllowed',
  'memoryOnly',
  'sessionAuditInherited'
];
for (const key of invariantChecks) {
  assert(hookSource.includes(key), `Hook validates ${key} before state write`);
}

// 13. Unsafe result is not stored directly
assert(!/setResult\(\s*handlerResult\s*\)/.test(hookSource), 'Hook does not store unsafe handlerResult directly');

// 14. try/catch/finally around handler call
assert(hookSource.includes('try {'), 'Hook uses try block');
assert(hookSource.includes('catch'), 'Hook uses catch block');
assert(hookSource.includes('finally'), 'Hook uses finally block');

// 15. Concurrency guard exists
assert(hookSource.includes('useRef'), 'Hook uses useRef for concurrency guard');
assert(hookSource.includes('lockRef.current'), 'Hook uses lockRef.current');

// 16. reset clears local state only
assert(hookSource.includes('const reset'), 'Hook exposes reset');
assert(hookSource.includes('setStatus'), 'Hook resets status');
assert(hookSource.includes('setResult(null)'), 'Hook resets result');
assert(hookSource.includes('setError(null)'), 'Hook resets error');
assert(hookSource.includes('setIsRunning(false)'), 'Hook resets running state');

// 17. clearError clears error only
assert(hookSource.includes('const clearError'), 'Hook exposes clearError');

// 18. Setters are not returned
const forbiddenReturnKeys = ['setStatus:', 'setResult:', 'setError:', 'setIsRunning:', 'setSnapshotIdentity:'];
for (const key of forbiddenReturnKeys) {
  assert(!hookSource.includes(key), `Hook does not return ${key}`);
}

// 19. No automatic useEffect trigger
assert(!hookSource.includes('useEffect('), 'Hook does not use useEffect');

console.log('\n✅ Hook contract verification complete.');
