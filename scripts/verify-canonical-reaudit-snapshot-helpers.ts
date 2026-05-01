/**
 * Verification script for Canonical Re-Audit Snapshot Helpers
 */

import {
  createCanonicalSnapshotIdentity,
  verifyCanonicalSnapshotIdentityMatch,
  getCanonicalSnapshot,
  CanonicalReAuditSnapshotIdentity,
  CanonicalReAuditRequest
} from '../lib/editorial/canonical-reaudit-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILURE: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('--- Starting Canonical Re-Audit Snapshot Helpers Verification ---\n');

// 1. createCanonicalSnapshotIdentity returns source "canonical-vault"
const id1 = createCanonicalSnapshotIdentity('hash1', 100);
assert(id1.source === 'canonical-vault', 'createCanonicalSnapshotIdentity returns source "canonical-vault"');

// 2. capturedAt override is respected
const fixedTime = '2025-01-01T00:00:00.000Z';
const id2 = createCanonicalSnapshotIdentity('hash1', 100, undefined, fixedTime);
assert(id2.capturedAt === fixedTime, 'capturedAt override is respected');

// 3. verifyCanonicalSnapshotIdentityMatch returns true for identical identities
const id3 = createCanonicalSnapshotIdentity('hash1', 100, 'promo1', fixedTime);
const id4 = createCanonicalSnapshotIdentity('hash1', 100, 'promo1', fixedTime);
assert(verifyCanonicalSnapshotIdentityMatch(id3, id4) === true, 'verifyCanonicalSnapshotIdentityMatch returns true for identical identities');

// 4. verifyCanonicalSnapshotIdentityMatch returns false for contentHash mismatch
const id5 = createCanonicalSnapshotIdentity('hash2', 100, 'promo1', fixedTime);
assert(verifyCanonicalSnapshotIdentityMatch(id3, id5) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for contentHash mismatch');

// 5. verifyCanonicalSnapshotIdentityMatch returns false for ledgerSequence mismatch
const id6 = createCanonicalSnapshotIdentity('hash1', 101, 'promo1', fixedTime);
assert(verifyCanonicalSnapshotIdentityMatch(id3, id6) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for ledgerSequence mismatch');

// 6. verifyCanonicalSnapshotIdentityMatch returns false for capturedAt mismatch
const id7 = createCanonicalSnapshotIdentity('hash1', 100, 'promo1', '2025-01-02T00:00:00.000Z');
assert(verifyCanonicalSnapshotIdentityMatch(id3, id7) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for capturedAt mismatch');

// 7. verifyCanonicalSnapshotIdentityMatch returns false for promotionId mismatch
const id8 = createCanonicalSnapshotIdentity('hash1', 100, 'promo2', fixedTime);
assert(verifyCanonicalSnapshotIdentityMatch(id3, id8) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for promotionId mismatch');

// 8. verifyCanonicalSnapshotIdentityMatch returns false for null/undefined inputs
assert(verifyCanonicalSnapshotIdentityMatch(id3, null as any) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for null input');
assert(verifyCanonicalSnapshotIdentityMatch(undefined as any, id3) === false, 'verifyCanonicalSnapshotIdentityMatch returns false for undefined input');

// 9. getCanonicalSnapshot returns request.canonicalSnapshot when present
const mockRequest: CanonicalReAuditRequest = {
  articleId: 'art1',
  operatorId: 'op1',
  requestedAt: 'now',
  canonicalSnapshot: id3,
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
};
assert(getCanonicalSnapshot(mockRequest) === id3, 'getCanonicalSnapshot returns request.canonicalSnapshot when present');

// 10. getCanonicalSnapshot returns fail-closed fallback when missing
const fallback = getCanonicalSnapshot(null);
assert(fallback.contentHash === 'MISSING_CANONICAL_SNAPSHOT', 'getCanonicalSnapshot returns fail-closed fallback when missing (null)');
assert(fallback.ledgerSequence === -1, 'fallback ledgerSequence is -1');
assert(fallback.source === 'canonical-vault', 'fallback source is "canonical-vault"');

console.log('\n--- Verification Completed Successfully ---');
