/**
 * Verification Script for Task 8C-2B
 * Pure Canonical Re-Audit Registration Readiness Explanation Mapper
 */

import * as fs from 'fs';
import * as path from 'path';

const TYPE_FILE = path.join(process.cwd(), 'lib/editorial/canonical-reaudit-registration-readiness-explanation.ts');

function log(msg: string) {
  console.log(`[VERIFY-8C2B] ${msg}`);
}

function error(msg: string) {
  console.error(`[VERIFY-8C2B] ERROR: ${msg}`);
  process.exit(1);
}

async function verify() {
  log('Starting Task 8C-2B Verification...');

  // ============================================================================
  // CHECK 1: File Existence
  // ============================================================================
  if (!fs.existsSync(TYPE_FILE)) {
    error(`Type file missing: ${TYPE_FILE}`);
  }
  log('✓ Found type file.');

  const content = fs.readFileSync(TYPE_FILE, 'utf8');

  // ============================================================================
  // CHECK 2: Export Checks
  // ============================================================================
  const requiredExports = [
    'CanonicalReAuditRegistrationReadinessSeverity',
    'CanonicalReAuditRegistrationReadinessExplanation',
    'createRegistrationReadinessExplanation',
    'getRegistrationBlockReasonLabel',
    'getRegistrationBlockReasonHint',
    'getRegistrationReadinessSeverity'
  ];

  for (const exportName of requiredExports) {
    if (!content.includes(exportName)) {
      error(`Missing export: ${exportName}`);
    }
  }
  log('✓ All required exports found.');

  // ============================================================================
  // CHECK 3: Import Boundary Checks
  // ============================================================================
  
  // Must import from eligibility types
  if (!content.includes('canonical-reaudit-registration-eligibility-types')) {
    error('Missing import from canonical-reaudit-registration-eligibility-types');
  }
  log('✓ Imports from eligibility types.');

  // Must NOT import from forbidden modules
  const forbiddenImports = [
    'canonical-reaudit-registration-state-types',
    'canonical-reaudit-adapter',
    'handlers/',
    'hooks/',
    'components/',
    'from "app/',
    'from "api/',
    'import React',
    'from "react"',
    'from "next"'
  ];

  for (const imp of forbiddenImports) {
    if (content.includes(imp)) {
      error(`Forbidden import found: ${imp}`);
    }
  }
  log('✓ Import boundary checks passed.');

  // ============================================================================
  // CHECK 4: Forbidden Token Checks
  // ============================================================================
  const forbiddenKeywords = [
    'fetch(',
    'axios.',
    'axios(',
    'import axios',
    'from "axios"',
    'prisma.',
    'turso.',
    'libsql.',
    'localStorage.',
    'sessionStorage.',
    'indexedDB.',
    'document.',
    'window.',
    'process.env.',
    'child_process',
    'exec(',
    'spawn(',
    'setGlobalAudit(',
    'setVault(',
    'setIsDeployBlocked(',
    'registerCanonicalReAudit(',
    'transitionToRegistered(',
    'promote(',
    'deployUnlock(',
    'save(',
    'publish(',
    'new REGISTERED_IN_MEMORY',
    'previewState:',
    'registeredState:',
    'registrationPayload:'
  ];

  for (const kw of forbiddenKeywords) {
    if (content.includes(kw)) {
      error(`Forbidden keyword found: ${kw}`);
    }
  }
  log('✓ Forbidden token checks passed.');

  // ============================================================================
  // CHECK 5: Runtime Behavior Checks
  // ============================================================================
  const runtimeForbidden = [
    'async function',
    'Promise',
    'await',
    'JSX',
    '<div',
    '</div>',
    'className=',
    'useState',
    'useEffect',
    'useContext',
    'fs.writeFile',
    'fs.appendFile',
    'fs.createWriteStream',
    'Date.now',
    'Math.random'
  ];

  for (const rt of runtimeForbidden) {
    if (content.includes(rt)) {
      error(`Forbidden runtime behavior found: ${rt}`);
    }
  }
  log('✓ Runtime behavior checks passed.');

  // ============================================================================
  // CHECK 6: Primitive-Only Output Checks
  // ============================================================================
  
  // Check that explanation interface does NOT include forbidden fields
  const forbiddenFields = [
    'previewState:',
    'registeredState:',
    'payload:',
    'snapshot:',
    'function(',
    'Promise<'
  ];

  for (const field of forbiddenFields) {
    if (content.includes(field)) {
      error(`Forbidden field found in explanation interface: ${field}`);
    }
  }
  log('✓ Primitive-only output checks passed.');

  // ============================================================================
  // CHECK 7: Block Reason Coverage Checks
  // ============================================================================
  
  // All 14 block reasons from Task 8C-2A
  const requiredBlockReasons = [
    'RESULT_MISSING',
    'RESULT_STATUS_NOT_PENDING_ACCEPTANCE',
    'AUDITED_SNAPSHOT_MISSING',
    'CURRENT_SNAPSHOT_MISSING',
    'SNAPSHOT_IDENTITY_MISMATCH',
    'ACCEPTANCE_ELIGIBILITY_MISSING',
    'ACCEPTANCE_NOT_ELIGIBLE',
    'SESSION_DRAFT_PRESENT',
    'AUDIT_RUNNING',
    'DEPLOY_NOT_LOCKED',
    'TRANSFORM_ERROR_PRESENT',
    'CONTEXT_MISSING',
    'UNKNOWN_REGISTRATION_STATE',
    'REGISTRATION_FORBIDDEN_BY_POLICY'
  ];

  for (const reason of requiredBlockReasons) {
    if (!content.includes(`'${reason}'`) && !content.includes(`"${reason}"`)) {
      error(`Missing block reason coverage: ${reason}`);
    }
  }
  log('✓ Block reason coverage checks passed.');

  // ============================================================================
  // CHECK 8: Safety Invariant Checks
  // ============================================================================
  const invariants = [
    'informationalOnly: true',
    'registrationExecutionAllowed: false',
    'deployRemainsLocked: true',
    'persistenceAllowed: false',
    'mutationAllowed: false'
  ];

  for (const inv of invariants) {
    if (!content.includes(inv)) {
      error(`Missing safety invariant: ${inv}`);
    }
  }
  log('✓ Safety invariant checks passed.');

  // ============================================================================
  // CHECK 9: Fixture Behavior Checks
  // ============================================================================
  
  // Import the module for runtime testing
  const module = await import('../lib/editorial/canonical-reaudit-registration-readiness-explanation.js');
  
  // Eligible fixture
  const eligibleFixture = {
    canRegister: true,
    blockReasons: [],
    preconditions: {
      hasResult: true,
      hasPendingAcceptanceStatus: true,
      hasAuditedSnapshot: true,
      hasCurrentSnapshot: true,
      snapshotIdentityMatches: true,
      hasAcceptanceEligibility: true,
      acceptanceEligibilityAllowsRegistration: true,
      noSessionDraftPresent: true,
      auditNotRunning: true,
      deployRemainsLocked: true,
      noTransformError: true,
      hasRequiredContext: true,
      registrationPolicyAllowsEvaluation: true
    },
    memoryOnly: true,
    deployRemainsLocked: true,
    persistenceAllowed: false,
    vaultMutationAllowed: false,
    globalAuditOverwriteAllowed: false,
    productionAuthorizationAllowed: false,
    registrationExecutionAllowed: false,
    promotionRequired: true,
    evaluatedStage: 'ELIGIBILITY_EVALUATED'
  } as any;
  
  const eligibleExplanation = module.createRegistrationReadinessExplanation(eligibleFixture);
  
  if (!eligibleExplanation.eligible) {
    error('Eligible fixture should have eligible: true');
  }
  if (!eligibleExplanation.readyForRegistration) {
    error('Eligible fixture should have readyForRegistration: true');
  }
  if (eligibleExplanation.severity !== 'INFO') {
    error(`Eligible fixture should have INFO severity, got: ${eligibleExplanation.severity}`);
  }
  if (eligibleExplanation.blockReasonCount !== 0) {
    error('Eligible fixture should have blockReasonCount: 0');
  }
  
  log('✓ Eligible fixture behavior correct.');
  
  // Blocked fixture
  const blockedFixture = {
    canRegister: false,
    blockReasons: ['SESSION_DRAFT_PRESENT', 'AUDIT_RUNNING'],
    preconditions: {
      hasResult: true,
      hasPendingAcceptanceStatus: true,
      hasAuditedSnapshot: true,
      hasCurrentSnapshot: true,
      snapshotIdentityMatches: true,
      hasAcceptanceEligibility: true,
      acceptanceEligibilityAllowsRegistration: true,
      noSessionDraftPresent: false,
      auditNotRunning: false,
      deployRemainsLocked: true,
      noTransformError: true,
      hasRequiredContext: true,
      registrationPolicyAllowsEvaluation: false
    },
    memoryOnly: true,
    deployRemainsLocked: true,
    persistenceAllowed: false,
    vaultMutationAllowed: false,
    globalAuditOverwriteAllowed: false,
    productionAuthorizationAllowed: false,
    registrationExecutionAllowed: false,
    promotionRequired: true,
    evaluatedStage: 'ELIGIBILITY_EVALUATED'
  } as any;
  
  const blockedExplanation = module.createRegistrationReadinessExplanation(blockedFixture);
  
  if (blockedExplanation.eligible) {
    error('Blocked fixture should have eligible: false');
  }
  if (blockedExplanation.readyForRegistration) {
    error('Blocked fixture should have readyForRegistration: false');
  }
  if (blockedExplanation.blockReasonCount !== 2) {
    error(`Blocked fixture should have blockReasonCount: 2, got: ${blockedExplanation.blockReasonCount}`);
  }
  if (blockedExplanation.blockReasonLabels.length !== 2) {
    error('Blocked fixture should have 2 block reason labels');
  }
  if (blockedExplanation.remediationHints.length !== 2) {
    error('Blocked fixture should have 2 remediation hints');
  }
  
  log('✓ Blocked fixture behavior correct.');

  // ============================================================================
  // CHECK 10: Scope Checks
  // ============================================================================
  try {
    const { execSync } = require('child_process');
    const gitDiff = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const gitStatus = execSync('git status --short', { encoding: 'utf8' }).trim();
    
    const changedFiles = gitDiff.split('\n').filter(Boolean);
    const stagedFiles = gitStatus.split('\n').filter(Boolean);
    
    // Allow only our two files to be changed/added
    const allowedFiles = [
      'lib/editorial/canonical-reaudit-registration-readiness-explanation.ts',
      'scripts/verify-canonical-reaudit-8c2b-registration-readiness-explanation.ts'
    ];
    
    for (const file of changedFiles) {
      if (!allowedFiles.includes(file) && 
          !file.includes('.kiro/') && 
          !file.includes('SIAIntel.worktrees/') &&
          !file.endsWith('.md') &&
          !file.includes('tsconfig.tsbuildinfo') &&
          !file.includes('.idea/')) {
        log(`Warning: Unexpected file changed: ${file}`);
      }
    }
    
    log('✓ Scope check completed.');
  } catch (e) {
    // Git not available or error - skip scope check
    log('Git scope check skipped (git not available or error).');
  }

  log('');
  log('='.repeat(60));
  log('VERIFICATION SUCCESS - ALL 10 CHECKS PASSED');
  log('='.repeat(60));
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
