/**
 * Verification Script for Task 8C-1
 * Pure Canonical Re-Audit Registration State Type Contract
 */

import * as fs from 'fs';
import * as path from 'path';

const TYPE_FILE = path.join(process.cwd(), 'lib/editorial/canonical-reaudit-registration-state-types.ts');

function log(msg: string) {
  console.log(`[VERIFY-8C1] ${msg}`);
}

function error(msg: string) {
  console.error(`[VERIFY-8C1] ERROR: ${msg}`);
  process.exit(1);
}

async function verify() {
  log('Starting Task 8C-1 Verification...');

  // 1. File Existence
  if (!fs.existsSync(TYPE_FILE)) {
    error(`Type file missing: ${TYPE_FILE}`);
  }
  log('Found type file.');

  const content = fs.readFileSync(TYPE_FILE, 'utf8');

  // 2. Type Existence Checks
  const requiredTypes = [
    'CanonicalReAuditGovernanceStage',
    'CanonicalReAuditRegistrationState',
    'CanonicalReAuditRegisteredInMemoryState',
    'CanonicalReAuditPromotionPayloadContract',
    'CanonicalReAuditAllowedTransition',
    'CanonicalReAuditAcceptanceGateViewModel'
  ];

  for (const typeName of requiredTypes) {
    if (!content.includes(typeName)) {
      error(`Missing type: ${typeName}`);
    }
  }
  log('All required types found in file.');

  // 3. Stage Separation
  const requiredStages = [
    'AUDIT_PASSED',
    'ELIGIBILITY_EVALUATED',
    'REGISTERED_IN_MEMORY',
    'PROMOTION_PREPARED',
    'PROMOTED_TO_GLOBAL',
    'DEPLOY_UNLOCKED'
  ];

  for (const stage of requiredStages) {
    if (!content.includes(`"${stage}"`)) {
      error(`Missing stage: ${stage}`);
    }
  }
  log('All governance stages found.');

  // 4. Transition Safety
  const allowedTransitions = [
    '{ from: "ELIGIBILITY_EVALUATED"; to: "REGISTERED_IN_MEMORY" }',
    '{ from: "REGISTERED_IN_MEMORY"; to: "PROMOTION_PREPARED" }',
    '{ from: "PROMOTION_PREPARED"; to: "PROMOTED_TO_GLOBAL" }',
    '{ from: "PROMOTED_TO_GLOBAL"; to: "DEPLOY_UNLOCKED" }'
  ];

  for (const transition of allowedTransitions) {
    // Normalize spaces for check
    const normalizedContent = content.replace(/\s+/g, ' ');
    const normalizedTransition = transition.replace(/\s+/g, ' ');
    if (!normalizedContent.includes(normalizedTransition)) {
      error(`Missing allowed transition: ${transition}`);
    }
  }

  const forbiddenTransitions = [
    '{ from: "REGISTERED_IN_MEMORY"; to: "DEPLOY_UNLOCKED" }',
    '{ from: "ELIGIBILITY_EVALUATED"; to: "PROMOTED_TO_GLOBAL" }',
    '{ from: "AUDIT_PASSED"; to: "DEPLOY_UNLOCKED" }'
  ];

  for (const forbidden of forbiddenTransitions) {
    const normalizedContent = content.replace(/\s+/g, ' ');
    const normalizedForbidden = forbidden.replace(/\s+/g, ' ');
    if (normalizedContent.includes(normalizedForbidden)) {
      error(`Forbidden transition found in allowed list: ${forbidden}`);
    }
  }
  log('Transition safety verified.');

  // 5. Safety Invariants
  const invariants = [
    'memoryOnly: true',
    'deployRemainsLocked: true',
    'persistenceAllowed: false',
    'vaultMutationAllowed: false',
    'globalAuditOverwriteAllowed: false',
    'productionAuthorizationAllowed: false',
    'promotionRequired: true',
    'deployUnlockAllowed: false'
  ];

  for (const inv of invariants) {
    if (!content.includes(inv)) {
      error(`Missing safety invariant: ${inv}`);
    }
  }
  log('Safety invariants verified.');

  // 6. Promotion Payload Contract Only
  if (content.includes('function createPromotionPayload')) {
    error('Forbidden function found: createPromotionPayload');
  }
  if (content.includes('function buildPromotionPayload')) {
    error('Forbidden function found: buildPromotionPayload');
  }
  if (content.includes('function applyPromotionPayload')) {
    error('Forbidden function found: applyPromotionPayload');
  }
  log('No runtime builders found.');

  // 7. Forbidden Behavior Audit
  const forbiddenKeywords = [
    'import React',
    'useState',
    'useEffect',
    'setGlobalAudit',
    'setVault',
    'setIsDeployBlocked',
    'fetch(',
    'axios',
    'prisma',
    'turso',
    'libsql',
    'localStorage',
    'sessionStorage',
    'window',
    'document',
    'process.env',
    'publish(',
    'save('
  ];

  for (const kw of forbiddenKeywords) {
    if (content.includes(kw)) {
      error(`Forbidden keyword found: ${kw}`);
    }
  }
  log('Forbidden behavior audit passed.');

  log('VERIFICATION SUCCESS.');
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
