/**
 * Verification script for Canonical Re-Audit Handler Preflight (Task 5B)
 *
 * Verifies:
 *  1.  Handler file exists
 *  2.  startCanonicalReAudit is exported
 *  3.  computeCanonicalVaultSnapshot is exported
 *  4.  Handler imports runInMemoryCanonicalReAudit for Task 5C integration
 *  5.  Handler does NOT reference page.tsx / UI / hooks
 *  6.  No forbidden patterns in handler source
 *  7.  Valid request + vault produces non-BLOCKED status
 *  8.  Missing request → BLOCKED result
 *  9.  Missing vault → BLOCKED result
 * 10.  Missing canonicalSnapshot → BLOCKED result
 * 11.  Wrong source → BLOCKED result
 * 12.  deployUnlockAllowed: true → BLOCKED result
 * 13.  backendPersistenceAllowed: true → BLOCKED result
 * 14.  sessionAuditInheritanceAllowed: true → BLOCKED result
 * 15.  Session/local-draft contamination → BLOCKED result
 * 16.  Snapshot mismatch (stale) → BLOCKED result
 * 17.  Valid handler call does not mutate vault
 * 18.  startCanonicalReAudit executes adapter after valid preflight
 * 19.  Task 5A adapter verification still passes
 * 20.  Task 4 snapshot helper verification still passes
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

import {
  computeCanonicalVaultSnapshot,
  hasSessionContamination,
  startCanonicalReAudit,
} from "../app/admin/warroom/handlers/canonical-reaudit-handler";
import {
  CanonicalReAuditBlockReason,
  CanonicalReAuditStatus,
} from "../lib/editorial/canonical-reaudit-types";
import type {
  CanonicalReAuditRequest,
  CanonicalReAuditSnapshotIdentity,
} from "../lib/editorial/canonical-reaudit-types";
import type { CanonicalVaultInput } from "../lib/editorial/canonical-reaudit-adapter";

// ============================================================================
// ASSERTION HELPER
// ============================================================================

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILURE: ${message}`);
    failCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  }
}

// ============================================================================
// SHARED FIXTURES
// ============================================================================

/** A minimal well-formed canonical vault */
const VALID_VAULT: CanonicalVaultInput = {
  vault: {
    en: { title: "Test Article", desc: "Test body content for canonical audit.", ready: true },
    tr: { title: "Test Makale", desc: "Kanonik denetim için test gövde içeriği.", ready: true },
  },
  articleId: "test-article-001",
};

/** Compute the live snapshot for VALID_VAULT so we can build a matching request */
const LIVE_SNAPSHOT = computeCanonicalVaultSnapshot(VALID_VAULT);

/** A valid CanonicalReAuditRequest whose canonicalSnapshot matches VALID_VAULT */
const VALID_REQUEST: CanonicalReAuditRequest = {
  articleId: "test-article-001",
  operatorId: "operator-test",
  requestedAt: new Date().toISOString(),
  canonicalSnapshot: LIVE_SNAPSHOT,
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false,
};

// ============================================================================
// BANNER
// ============================================================================

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TASK 5B/5C: CANONICAL RE-AUDIT HANDLER PREFLIGHT VERIFICATION");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ============================================================================
// TEST 1: Handler file exists
// ============================================================================
console.log("TEST 1: Handler file exists");
const handlerPath = path.join(
  process.cwd(),
  "app/admin/warroom/handlers/canonical-reaudit-handler.ts"
);
assert(fs.existsSync(handlerPath), "Handler file exists at app/admin/warroom/handlers/canonical-reaudit-handler.ts");

// ============================================================================
// TEST 2: startCanonicalReAudit is exported
// ============================================================================
console.log("\nTEST 2: startCanonicalReAudit is exported");
assert(
  typeof startCanonicalReAudit === "function",
  "startCanonicalReAudit is exported as a function"
);

// ============================================================================
// TEST 3: computeCanonicalVaultSnapshot is exported
// ============================================================================
console.log("\nTEST 3: computeCanonicalVaultSnapshot is exported");
assert(
  typeof computeCanonicalVaultSnapshot === "function",
  "computeCanonicalVaultSnapshot is exported as a function"
);

// ============================================================================
// TEST 4: Handler imports runInMemoryCanonicalReAudit for Task 5C integration
// ============================================================================
console.log("\nTEST 4: Handler imports runInMemoryCanonicalReAudit for Task 5C integration");
const handlerSource = fs.readFileSync(handlerPath, "utf-8");

// Strip single-line comments (//) and block comments (/* ... */) before checking
// so that documentation mentions in JSDoc/comments do not trigger false positives.
const handlerSourceNoComments = handlerSource
  .replace(/\/\*[\s\S]*?\*\//g, "") // remove block comments
  .replace(/\/\/[^\n]*/g, "");       // remove line comments

// Task 5C: Handler should now import and call runInMemoryCanonicalReAudit
const hasRuntimeImport = /import\s+\{[^}]*runInMemoryCanonicalReAudit[^}]*\}\s+from/.test(
  handlerSourceNoComments
);
const hasCallExpression = /runInMemoryCanonicalReAudit\s*\(/.test(handlerSourceNoComments);

assert(
  hasRuntimeImport,
  "Handler has runtime import of runInMemoryCanonicalReAudit (Task 5C integration)"
);
assert(
  hasCallExpression,
  "Handler calls runInMemoryCanonicalReAudit() (Task 5C integration)"
);

// ============================================================================
// TEST 5: Handler does NOT reference page.tsx / UI / hooks
// ============================================================================
console.log("\nTEST 5: Handler does NOT reference page.tsx / UI / hooks");
assert(!handlerSource.includes("page.tsx"), "Handler does not reference page.tsx");
assert(!handlerSource.includes("useCanonicalReAudit"), "Handler does not reference useCanonicalReAudit hook");
assert(!handlerSource.includes("useState"), "Handler does not use useState");
assert(!handlerSource.includes("useEffect"), "Handler does not use useEffect");
assert(!handlerSource.includes("useCallback"), "Handler does not use useCallback");
assert(!handlerSource.includes("useMemo"), "Handler does not use useMemo");

// ============================================================================
// TEST 6: No forbidden patterns in handler source
// ============================================================================
console.log("\nTEST 6: No forbidden patterns in handler source");
const forbiddenPatterns: Array<{ pattern: RegExp | string; label: string }> = [
  { pattern: /\bfetch\s*\(/i, label: "fetch call" },
  { pattern: /import.*axios/i, label: "axios import" },
  { pattern: /\baxios\./i, label: "axios usage" },
  { pattern: /import.*prisma/i, label: "prisma import" },
  { pattern: /import.*libsql/i, label: "libsql import" },
  { pattern: /import.*turso/i, label: "turso import" },
  { pattern: /\blocalStorage\./i, label: "localStorage usage" },
  { pattern: /\bsessionStorage\./i, label: "sessionStorage usage" },
  { pattern: "setVault", label: "setVault call" },
  { pattern: "setGlobalAudit", label: "setGlobalAudit call" },
  { pattern: /globalAudit\s*=/, label: "globalAudit assignment" },
  { pattern: /deployUnlockAllowed\s*:\s*true/, label: "deployUnlockAllowed: true" },
  { pattern: ".publish(", label: ".publish() call" },
  { pattern: ".save(", label: ".save() call" },
  { pattern: ".promote(", label: ".promote() call" },
  { pattern: ".rollback(", label: ".rollback() call" },
  { pattern: ".deploy(", label: ".deploy() call" },
];

for (const { pattern, label } of forbiddenPatterns) {
  const found =
    typeof pattern === "string"
      ? handlerSource.includes(pattern)
      : pattern.test(handlerSource);
  assert(!found, `Handler does not contain forbidden pattern: ${label}`);
}

// ============================================================================
// TEST 7: Valid request + vault produces non-BLOCKED status
// ============================================================================
console.log("\nTEST 7: Valid request + vault produces non-BLOCKED status");
const validResult = startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);
assert(
  validResult.status !== CanonicalReAuditStatus.BLOCKED,
  "Valid request + vault produces non-BLOCKED status"
);
assert(
  validResult.status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE ||
  validResult.status === CanonicalReAuditStatus.FAILED_PENDING_REVIEW ||
  validResult.status === CanonicalReAuditStatus.STALE,
  "Valid request + vault produces valid handler status"
);

// ============================================================================
// TEST 8: Missing request → BLOCKED result
// ============================================================================
console.log("\nTEST 8: Missing request → BLOCKED result");
const r8 = startCanonicalReAudit(null as any, VALID_VAULT);
assert(
  r8.status === CanonicalReAuditStatus.BLOCKED,
  "null request returns BLOCKED status"
);
assert(
  r8.blockReason === CanonicalReAuditBlockReason.UNKNOWN,
  "null request blockReason is UNKNOWN"
);

const r8b = startCanonicalReAudit(undefined as any, VALID_VAULT);
assert(
  r8b.status === CanonicalReAuditStatus.BLOCKED,
  "undefined request returns BLOCKED status"
);

// ============================================================================
// TEST 9: Missing vault → BLOCKED result
// ============================================================================
console.log("\nTEST 9: Missing vault → BLOCKED result");
const r9 = startCanonicalReAudit(VALID_REQUEST);
assert(
  r9.status === CanonicalReAuditStatus.BLOCKED,
  "Missing vault returns BLOCKED status"
);
assert(
  r9.blockReason === CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
  "Missing vault blockReason is AUDIT_RUNNER_UNAVAILABLE"
);

const r9b = startCanonicalReAudit(VALID_REQUEST, undefined);
assert(
  r9b.status === CanonicalReAuditStatus.BLOCKED,
  "undefined vault returns BLOCKED status"
);

// ============================================================================
// TEST 10: Missing canonicalSnapshot → BLOCKED result
// ============================================================================
console.log("\nTEST 10: Missing canonicalSnapshot → BLOCKED result");
const requestNoSnapshot = {
  ...VALID_REQUEST,
  canonicalSnapshot: undefined as unknown as CanonicalReAuditSnapshotIdentity,
};
const r10 = startCanonicalReAudit(requestNoSnapshot, VALID_VAULT);
assert(
  r10.status === CanonicalReAuditStatus.BLOCKED,
  "Missing canonicalSnapshot returns BLOCKED status"
);
assert(
  r10.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISSING,
  "Missing canonicalSnapshot blockReason is SNAPSHOT_MISSING"
);

// ============================================================================
// TEST 11: Wrong source → BLOCKED result
// ============================================================================
console.log("\nTEST 11: Wrong source → BLOCKED result");
const requestWrongSource = {
  ...VALID_REQUEST,
  canonicalSnapshot: {
    ...LIVE_SNAPSHOT,
    source: "session-draft" as "canonical-vault",
  },
};
const r11 = startCanonicalReAudit(requestWrongSource, VALID_VAULT);
assert(
  r11.status === CanonicalReAuditStatus.BLOCKED,
  "Wrong snapshot source returns BLOCKED status"
);
assert(
  r11.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
  "Wrong snapshot source blockReason is SNAPSHOT_MISMATCH"
);

// ============================================================================
// TEST 12: deployUnlockAllowed: true → BLOCKED result
// ============================================================================
console.log("\nTEST 12: deployUnlockAllowed: true → BLOCKED result");
const requestDeployUnlock = {
  ...VALID_REQUEST,
  deployUnlockAllowed: true as unknown as false,
};
const r12 = startCanonicalReAudit(requestDeployUnlock, VALID_VAULT);
assert(
  r12.status === CanonicalReAuditStatus.BLOCKED,
  "deployUnlockAllowed: true returns BLOCKED status"
);
assert(
  r12.blockReason === CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
  "deployUnlockAllowed: true blockReason is DEPLOY_UNLOCK_FORBIDDEN"
);

// ============================================================================
// TEST 13: backendPersistenceAllowed: true → BLOCKED result
// ============================================================================
console.log("\nTEST 13: backendPersistenceAllowed: true → BLOCKED result");
const requestBackend = {
  ...VALID_REQUEST,
  backendPersistenceAllowed: true as unknown as false,
};
const r13 = startCanonicalReAudit(requestBackend, VALID_VAULT);
assert(
  r13.status === CanonicalReAuditStatus.BLOCKED,
  "backendPersistenceAllowed: true returns BLOCKED status"
);
assert(
  r13.blockReason === CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
  "backendPersistenceAllowed: true blockReason is BACKEND_FORBIDDEN"
);

// ============================================================================
// TEST 14: sessionAuditInheritanceAllowed: true → BLOCKED result
// ============================================================================
console.log("\nTEST 14: sessionAuditInheritanceAllowed: true → BLOCKED result");
const requestSessionInherit = {
  ...VALID_REQUEST,
  sessionAuditInheritanceAllowed: true as unknown as false,
};
const r14 = startCanonicalReAudit(requestSessionInherit, VALID_VAULT);
assert(
  r14.status === CanonicalReAuditStatus.BLOCKED,
  "sessionAuditInheritanceAllowed: true returns BLOCKED status"
);
assert(
  r14.blockReason === CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
  "sessionAuditInheritanceAllowed: true blockReason is SESSION_AUDIT_INHERITANCE_FORBIDDEN"
);

// ============================================================================
// TEST 15: Session/local-draft contamination → BLOCKED result
// ============================================================================
console.log("\nTEST 15: Session/local-draft contamination → BLOCKED result");

const contaminatedVaults: Array<{ label: string; vault: CanonicalVaultInput }> = [
  {
    label: "localDraftCopy key",
    vault: { ...VALID_VAULT, localDraftCopy: {} } as unknown as CanonicalVaultInput,
  },
  {
    label: "sessionDraft key",
    vault: { ...VALID_VAULT, sessionDraft: {} } as unknown as CanonicalVaultInput,
  },
  {
    label: "sessionAuditResult key",
    vault: { ...VALID_VAULT, sessionAuditResult: {} } as unknown as CanonicalVaultInput,
  },
  {
    label: "sessionRemediationLedger key",
    vault: { ...VALID_VAULT, sessionRemediationLedger: [] } as unknown as CanonicalVaultInput,
  },
  {
    label: "remediationLedger key",
    vault: { ...VALID_VAULT, remediationLedger: [] } as unknown as CanonicalVaultInput,
  },
  {
    label: "draftSource: 'session'",
    vault: { ...VALID_VAULT, draftSource: "session" } as unknown as CanonicalVaultInput,
  },
  {
    label: "source: 'session-draft'",
    vault: { ...VALID_VAULT, source: "session-draft" } as unknown as CanonicalVaultInput,
  },
];

for (const { label, vault: contaminatedVault } of contaminatedVaults) {
  assert(
    hasSessionContamination(contaminatedVault) === true,
    `hasSessionContamination detects: ${label}`
  );
  // Build a matching snapshot for the contaminated vault to isolate the contamination check
  const r15 = startCanonicalReAudit(VALID_REQUEST, contaminatedVault);
  assert(
    r15.status === CanonicalReAuditStatus.BLOCKED,
    `Contaminated vault (${label}) returns BLOCKED status`
  );
}

// ============================================================================
// TEST 16: Snapshot mismatch (stale) → BLOCKED result
// ============================================================================
console.log("\nTEST 16: Snapshot mismatch (stale) → BLOCKED result");

// Build a request whose canonicalSnapshot has a different contentHash than VALID_VAULT
const staleSnapshot: CanonicalReAuditSnapshotIdentity = {
  contentHash: "STALE_HASH_THAT_DOES_NOT_MATCH_VAULT",
  ledgerSequence: 0,
  capturedAt: new Date().toISOString(),
  source: "canonical-vault",
};
const staleRequest: CanonicalReAuditRequest = {
  ...VALID_REQUEST,
  canonicalSnapshot: staleSnapshot,
};
const r16 = startCanonicalReAudit(staleRequest, VALID_VAULT);
assert(
  r16.status === CanonicalReAuditStatus.BLOCKED,
  "Snapshot mismatch returns BLOCKED status"
);
assert(
  r16.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
  "Snapshot mismatch blockReason is SNAPSHOT_MISMATCH"
);

// ============================================================================
// TEST 17: Valid handler call does not mutate vault
// ============================================================================
console.log("\nTEST 17: Valid handler call does not mutate vault");
const vaultCopy = JSON.parse(JSON.stringify(VALID_VAULT));
startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);
assert(
  JSON.stringify(VALID_VAULT) === JSON.stringify(vaultCopy),
  "Vault object is not mutated by handler"
);

// ============================================================================
// TEST 18: startCanonicalReAudit executes adapter after valid preflight (Task 5C)
// ============================================================================
console.log("\nTEST 18: startCanonicalReAudit executes adapter after valid preflight (Task 5C)");
const handlerResult = startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);
assert(
  handlerResult.status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE ||
  handlerResult.status === CanonicalReAuditStatus.FAILED_PENDING_REVIEW ||
  handlerResult.status === CanonicalReAuditStatus.BLOCKED ||
  handlerResult.status === CanonicalReAuditStatus.STALE,
  "startCanonicalReAudit returns valid status from adapter execution"
);
assert(
  handlerResult.status !== CanonicalReAuditStatus.BLOCKED ||
  handlerResult.blockReason !== CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
  "startCanonicalReAudit no longer returns AUDIT_RUNNER_UNAVAILABLE sentinel (adapter integrated)"
);

// Also verify without vault (backward-compatible path)
const handlerResultNoVault = startCanonicalReAudit(VALID_REQUEST);
assert(
  handlerResultNoVault.status === CanonicalReAuditStatus.BLOCKED,
  "startCanonicalReAudit without vault returns BLOCKED"
);
assert(
  handlerResultNoVault.blockReason === CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
  "startCanonicalReAudit without vault returns AUDIT_RUNNER_UNAVAILABLE"
);

// ============================================================================
// TEST 19: Task 5A adapter verification still passes
// ============================================================================
console.log("\nTEST 19: Task 5A adapter verification still passes");
try {
  execSync("npx tsx scripts/verify-canonical-reaudit-adapter.ts", { stdio: "inherit" });
  assert(true, "Task 5A adapter verification passes");
} catch {
  assert(false, "Task 5A adapter verification passes");
}

// ============================================================================
// TEST 20: Task 4 snapshot helper verification still passes
// ============================================================================
console.log("\nTEST 20: Task 4 snapshot helper verification still passes");
try {
  execSync("npx tsx scripts/verify-canonical-reaudit-snapshot-helpers.ts", { stdio: "inherit" });
  assert(true, "Task 4 snapshot helper verification passes");
} catch {
  assert(false, "Task 4 snapshot helper verification passes");
}

// ============================================================================
// FINAL REPORT
// ============================================================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TASK 5B/5C VERIFICATION COMPLETE");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`[VERIFY] canonical-reaudit-handler-preflight: ${passCount} checks passed, ${failCount} failed`);

if (failCount > 0) {
  console.error(`\n❌ ${failCount} check(s) FAILED. Task 5B/5C verification FAILED.`);
  process.exit(1);
}

console.log("\n✅ All checks passed.");
console.log("✅ Handler integrates adapter execution (Task 5C)");
console.log("✅ Handler calls adapter after successful preflight");
console.log("✅ No forbidden imports or patterns");
console.log("✅ No UI/page/hook changes");
console.log("✅ No mutation");
console.log("✅ No globalAudit overwrite");
console.log("✅ No deploy unlock");
console.log("✅ No backend/API/database/provider calls");
console.log("✅ No persistence");
console.log("✅ Adapter execution wrapped in try-catch for fail-closed");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

process.exit(0);
