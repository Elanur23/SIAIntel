/**
 * Verification script for Canonical Re-Audit Handler Preflight (Task 5B)
 *
 * Verifies:
 *  1.  Handler file exists
 *  2.  buildCanonicalReAuditAdapterPreflight is exported
 *  3.  computeCanonicalVaultSnapshot is exported
 *  4.  Handler does NOT import/call runInMemoryCanonicalReAudit
 *  5.  Handler does NOT reference page.tsx / UI / hooks
 *  6.  No forbidden patterns in handler source
 *  7.  Valid preflight returns ok: true with adapterRequest
 *  8.  Missing request fails closed
 *  9.  Missing vault fails closed
 * 10.  Missing canonicalSnapshot fails closed
 * 11.  Wrong source fails closed
 * 12.  deployUnlockAllowed: true fails closed
 * 13.  backendPersistenceAllowed: true fails closed
 * 14.  sessionAuditInheritanceAllowed: true fails closed
 * 15.  Session/local-draft contamination fails closed
 * 16.  Snapshot mismatch (stale) fails closed
 * 17.  Valid preflight does not mutate vault
 * 18.  startCanonicalReAudit still returns AUDIT_RUNNER_UNAVAILABLE after valid preflight
 * 19.  Task 5A adapter verification still passes
 * 20.  Task 4 snapshot helper verification still passes
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

import {
  buildCanonicalReAuditAdapterPreflight,
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
console.log("TASK 5B: CANONICAL RE-AUDIT HANDLER PREFLIGHT VERIFICATION");
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
// TEST 2: buildCanonicalReAuditAdapterPreflight is exported
// ============================================================================
console.log("\nTEST 2: buildCanonicalReAuditAdapterPreflight is exported");
assert(
  typeof buildCanonicalReAuditAdapterPreflight === "function",
  "buildCanonicalReAuditAdapterPreflight is exported as a function"
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
// TEST 4: Handler does NOT import/call runInMemoryCanonicalReAudit as runtime
// ============================================================================
console.log("\nTEST 4: Handler does NOT import/call runInMemoryCanonicalReAudit as runtime");
const handlerSource = fs.readFileSync(handlerPath, "utf-8");

// Strip single-line comments (//) and block comments (/* ... */) before checking
// so that documentation mentions in JSDoc/comments do not trigger false positives.
const handlerSourceNoComments = handlerSource
  .replace(/\/\*[\s\S]*?\*\//g, "") // remove block comments
  .replace(/\/\/[^\n]*/g, "");       // remove line comments

// After stripping comments, the only remaining references should be type-only imports.
// A runtime import would look like: import { runInMemoryCanonicalReAudit } from ...
// A type-only import looks like: import type { ... } from ...
// We check that no non-type import or call expression remains.
const hasRuntimeImport = /import\s+\{[^}]*runInMemoryCanonicalReAudit[^}]*\}\s+from/.test(
  handlerSourceNoComments
);
const hasCallExpression = /runInMemoryCanonicalReAudit\s*\(/.test(handlerSourceNoComments);

assert(
  !hasRuntimeImport,
  "Handler does not have a runtime import of runInMemoryCanonicalReAudit (type-only imports are allowed)"
);
assert(
  !hasCallExpression,
  "Handler does not call runInMemoryCanonicalReAudit()"
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
// TEST 7: Valid preflight returns ok: true with adapterRequest
// ============================================================================
console.log("\nTEST 7: Valid preflight returns ok: true with adapterRequest");
const validResult = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, VALID_VAULT);
assert(validResult.ok === true, "Valid preflight returns ok: true");
if (validResult.ok) {
  assert(
    typeof validResult.adapterRequest === "object" && validResult.adapterRequest !== null,
    "Valid preflight returns adapterRequest object"
  );
  assert(
    validResult.adapterRequest.canonicalVault === VALID_VAULT,
    "adapterRequest.canonicalVault is the provided vault"
  );
  assert(
    typeof validResult.adapterRequest.currentSnapshot === "object",
    "adapterRequest.currentSnapshot is present"
  );
  assert(
    validResult.adapterRequest.currentSnapshot.source === "canonical-vault",
    "adapterRequest.currentSnapshot.source is 'canonical-vault'"
  );
  assert(
    validResult.adapterRequest.expectedSnapshot === LIVE_SNAPSHOT,
    "adapterRequest.expectedSnapshot is request.canonicalSnapshot"
  );
  assert(
    validResult.adapterRequest.auditor === "operator-test",
    "adapterRequest.auditor is taken from request.operatorId"
  );
  assert(
    typeof validResult.liveSnapshot === "object",
    "Valid preflight returns liveSnapshot"
  );
  assert(
    validResult.liveSnapshot.source === "canonical-vault",
    "liveSnapshot.source is 'canonical-vault'"
  );
}

// ============================================================================
// TEST 8: Missing request fails closed
// ============================================================================
console.log("\nTEST 8: Missing request fails closed");
const r8 = buildCanonicalReAuditAdapterPreflight(null, VALID_VAULT);
assert(r8.ok === false, "null request returns ok: false");
if (!r8.ok) {
  assert(
    r8.blockReason === CanonicalReAuditBlockReason.UNKNOWN,
    "null request blockReason is UNKNOWN"
  );
}

const r8b = buildCanonicalReAuditAdapterPreflight(undefined, VALID_VAULT);
assert(r8b.ok === false, "undefined request returns ok: false");

// ============================================================================
// TEST 9: Missing vault fails closed
// ============================================================================
console.log("\nTEST 9: Missing vault fails closed");
const r9 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, null);
assert(r9.ok === false, "null vault returns ok: false");
if (!r9.ok) {
  assert(
    r9.blockReason === CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
    "null vault blockReason is MISSING_CANONICAL_VAULT"
  );
}

const r9b = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, undefined);
assert(r9b.ok === false, "undefined vault returns ok: false");

// ============================================================================
// TEST 10: Missing canonicalSnapshot fails closed
// ============================================================================
console.log("\nTEST 10: Missing canonicalSnapshot fails closed");
const requestNoSnapshot = {
  ...VALID_REQUEST,
  canonicalSnapshot: undefined as unknown as CanonicalReAuditSnapshotIdentity,
};
const r10 = buildCanonicalReAuditAdapterPreflight(requestNoSnapshot, VALID_VAULT);
assert(r10.ok === false, "Missing canonicalSnapshot returns ok: false");
if (!r10.ok) {
  assert(
    r10.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISSING,
    "Missing canonicalSnapshot blockReason is SNAPSHOT_MISSING"
  );
}

// ============================================================================
// TEST 11: Wrong source fails closed
// ============================================================================
console.log("\nTEST 11: Wrong source fails closed");
const requestWrongSource = {
  ...VALID_REQUEST,
  canonicalSnapshot: {
    ...LIVE_SNAPSHOT,
    source: "session-draft" as "canonical-vault",
  },
};
const r11 = buildCanonicalReAuditAdapterPreflight(requestWrongSource, VALID_VAULT);
assert(r11.ok === false, "Wrong snapshot source returns ok: false");
if (!r11.ok) {
  assert(
    r11.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
    "Wrong snapshot source blockReason is SNAPSHOT_MISMATCH"
  );
}

// ============================================================================
// TEST 12: deployUnlockAllowed: true fails closed
// ============================================================================
console.log("\nTEST 12: deployUnlockAllowed: true fails closed");
const requestDeployUnlock = {
  ...VALID_REQUEST,
  deployUnlockAllowed: true as unknown as false,
};
const r12 = buildCanonicalReAuditAdapterPreflight(requestDeployUnlock, VALID_VAULT);
assert(r12.ok === false, "deployUnlockAllowed: true returns ok: false");
if (!r12.ok) {
  assert(
    r12.blockReason === CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
    "deployUnlockAllowed: true blockReason is DEPLOY_UNLOCK_FORBIDDEN"
  );
}

// ============================================================================
// TEST 13: backendPersistenceAllowed: true fails closed
// ============================================================================
console.log("\nTEST 13: backendPersistenceAllowed: true fails closed");
const requestBackend = {
  ...VALID_REQUEST,
  backendPersistenceAllowed: true as unknown as false,
};
const r13 = buildCanonicalReAuditAdapterPreflight(requestBackend, VALID_VAULT);
assert(r13.ok === false, "backendPersistenceAllowed: true returns ok: false");
if (!r13.ok) {
  assert(
    r13.blockReason === CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
    "backendPersistenceAllowed: true blockReason is BACKEND_FORBIDDEN"
  );
}

// ============================================================================
// TEST 14: sessionAuditInheritanceAllowed: true fails closed
// ============================================================================
console.log("\nTEST 14: sessionAuditInheritanceAllowed: true fails closed");
const requestSessionInherit = {
  ...VALID_REQUEST,
  sessionAuditInheritanceAllowed: true as unknown as false,
};
const r14 = buildCanonicalReAuditAdapterPreflight(requestSessionInherit, VALID_VAULT);
assert(r14.ok === false, "sessionAuditInheritanceAllowed: true returns ok: false");
if (!r14.ok) {
  assert(
    r14.blockReason === CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
    "sessionAuditInheritanceAllowed: true blockReason is SESSION_AUDIT_INHERITANCE_FORBIDDEN"
  );
}

// ============================================================================
// TEST 15: Session/local-draft contamination fails closed
// ============================================================================
console.log("\nTEST 15: Session/local-draft contamination fails closed");

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
  const r15 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, contaminatedVault);
  assert(r15.ok === false, `Contaminated vault (${label}) returns ok: false from preflight`);
}

// ============================================================================
// TEST 16: Snapshot mismatch (stale) fails closed
// ============================================================================
console.log("\nTEST 16: Snapshot mismatch (stale) fails closed");

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
const r16 = buildCanonicalReAuditAdapterPreflight(staleRequest, VALID_VAULT);
assert(r16.ok === false, "Snapshot mismatch returns ok: false");
if (!r16.ok) {
  assert(
    r16.blockReason === CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
    "Snapshot mismatch blockReason is SNAPSHOT_MISMATCH"
  );
  assert(
    typeof r16.liveSnapshot === "object",
    "Snapshot mismatch result includes liveSnapshot for traceability"
  );
}

// ============================================================================
// TEST 17: Valid preflight does not mutate vault
// ============================================================================
console.log("\nTEST 17: Valid preflight does not mutate vault");
const vaultCopy = JSON.parse(JSON.stringify(VALID_VAULT));
buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, VALID_VAULT);
assert(
  JSON.stringify(VALID_VAULT) === JSON.stringify(vaultCopy),
  "Vault object is not mutated by preflight"
);

// ============================================================================
// TEST 18: startCanonicalReAudit still returns AUDIT_RUNNER_UNAVAILABLE after valid preflight
// ============================================================================
console.log("\nTEST 18: startCanonicalReAudit returns AUDIT_RUNNER_UNAVAILABLE after valid preflight");
const handlerResult = startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);
assert(
  handlerResult.status === CanonicalReAuditStatus.BLOCKED,
  "startCanonicalReAudit returns BLOCKED status"
);
assert(
  handlerResult.blockReason === CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
  "startCanonicalReAudit returns AUDIT_RUNNER_UNAVAILABLE after valid preflight (sentinel preserved)"
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
console.log("TASK 5B VERIFICATION COMPLETE");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`[VERIFY] canonical-reaudit-handler-preflight: ${passCount} checks passed, ${failCount} failed`);

if (failCount > 0) {
  console.error(`\n❌ ${failCount} check(s) FAILED. Task 5B verification FAILED.`);
  process.exit(1);
}

console.log("\n✅ All checks passed.");
console.log("✅ Handler is bridge-only — no adapter execution");
console.log("✅ No forbidden imports or patterns");
console.log("✅ No UI/page/hook changes");
console.log("✅ No mutation");
console.log("✅ No globalAudit overwrite");
console.log("✅ No deploy unlock");
console.log("✅ No backend/API/database/provider calls");
console.log("✅ No persistence");
console.log("✅ Scaffold sentinel AUDIT_RUNNER_UNAVAILABLE preserved");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

process.exit(0);
