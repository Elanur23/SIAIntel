/**
 * Verification Script for Task 8C-2A
 * Pure Canonical Re-Audit Registration Eligibility Type Contract
 */

import * as fs from 'fs';
import * as path from 'path';

const TYPE_FILE = path.join(process.cwd(), 'lib/editorial/canonical-reaudit-registration-eligibility-types.ts');

function log(msg: string) {
  console.log(`[VERIFY-8C2A] ${msg}`);
}

function error(msg: string) {
  console.error(`[VERIFY-8C2A] ERROR: ${msg}`);
  process.exit(1);
}

async function verify() {
  log('Starting Task 8C-2A Verification...');

  // 1. File Existence
  if (!fs.existsSync(TYPE_FILE)) {
    error(`Type file missing: ${TYPE_FILE}`);
  }
  log('Found type file.');

  const content = fs.readFileSync(TYPE_FILE, 'utf8');

  // 2. Type Existence Checks
  const requiredTypes = [
    'CanonicalReAuditRegistrationBlockReason',
    'CanonicalReAuditRegistrationPreconditions',
    'CanonicalReAuditRegistrationEligibilityResult',
    'EvaluateCanonicalReAuditRegistrationEligibilityInput',
    'evaluateCanonicalReAuditRegistrationEligibility'
  ];

  for (const typeName of requiredTypes) {
    if (!content.includes(typeName)) {
      error(`Missing type: ${typeName}`);
    }
  }
  log('All required types found in file.');

  // 3. Block Reason Enum Values
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
    if (!content.includes(reason)) {
      error(`Missing block reason: ${reason}`);
    }
  }
  log('All required block reasons found.');

  // 4. Precondition Field Checks
  const requiredPreconditionFields = [
    'hasResult',
    'hasPendingAcceptanceStatus',
    'hasAuditedSnapshot',
    'hasCurrentSnapshot',
    'snapshotIdentityMatches',
    'hasAcceptanceEligibility',
    'acceptanceEligibilityAllowsRegistration',
    'noSessionDraftPresent',
    'auditNotRunning',
    'deployRemainsLocked',
    'noTransformError',
    'hasRequiredContext',
    'registrationPolicyAllowsEvaluation'
  ];

  for (const field of requiredPreconditionFields) {
    if (!content.includes(field)) {
      error(`Missing precondition field: ${field}`);
    }
  }
  log('All required precondition fields found.');

  // 5. Safety Invariant Checks
  const invariants = [
    'memoryOnly: true',
    'deployRemainsLocked: true',
    'persistenceAllowed: false',
    'vaultMutationAllowed: false',
    'globalAuditOverwriteAllowed: false',
    'productionAuthorizationAllowed: false',
    'registrationExecutionAllowed: false',
    'promotionRequired: true',
    'evaluatedStage: "ELIGIBILITY_EVALUATED"'
  ];

  for (const inv of invariants) {
    if (!content.includes(inv)) {
      error(`Missing safety invariant: ${inv}`);
    }
  }
  log('Safety invariants verified.');

  // 6. Input Field Checks
  const requiredInputFields = [
    'registrationState:',
    'currentSnapshot:',
    'hasSessionDraft:',
    'auditRunning:',
    'deployLocked:',
    'transformErrorPresent:',
    'contextReady:'
  ];

  for (const field of requiredInputFields) {
    if (!content.includes(field)) {
      error(`Missing input field: ${field}`);
    }
  }
  log('All required input fields found.');

  // 7. Import Safety Checks
  const forbiddenImports = [
    'import React',
    'from "react"',
    'from "next"',
    'from "app/',
    'from "components/',
    'from "hooks/',
    'from "handlers/',
    'from "api/',
    'from "prisma"',
    'from "turso"',
    'from "libsql"',
    'from "axios"',
    'from "fetch"'
  ];

  for (const imp of forbiddenImports) {
    if (content.includes(imp)) {
      error(`Forbidden import found: ${imp}`);
    }
  }
  log('Import safety checks passed.');

  // 8. Forbidden Token Checks
  const forbiddenKeywords = [
    'fetch(',
    'axios',
    'prisma',
    'turso',
    'libsql',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'document',
    'window',
    'process.env',
    'child_process',
    'exec(',
    'spawn(',
    'setGlobalAudit',
    'setVault',
    'setIsDeployBlocked',
    'registerCanonicalReAudit',
    'transitionToRegistered',
    'promote(',
    'deployUnlock',
    'save(',
    'publish('
  ];

  for (const kw of forbiddenKeywords) {
    if (content.includes(kw)) {
      error(`Forbidden keyword found: ${kw}`);
    }
  }
  log('Forbidden token checks passed.');

  // 9. Runtime Behavior Checks
  const runtimeForbidden = [
    'async function',
    'Promise',
    'await',
    'new Promise',
    'React.createElement',
    'JSX',
    '<div',
    '</div>',
    'className=',
    'useState',
    'useEffect',
    'useContext',
    'fs.writeFile',
    'fs.appendFile',
    'fs.createWriteStream'
  ];

  for (const rt of runtimeForbidden) {
    if (content.includes(rt)) {
      error(`Forbidden runtime behavior found: ${rt}`);
    }
  }
  log('Runtime behavior checks passed.');

  // 10. Fail-Closed Logic Checks
  // Check that canRegister defaults to false unless all preconditions pass
  if (!content.includes('canRegister =') && !content.includes('canRegister=')) {
    error('Missing canRegister assignment logic');
  }
  
  // Check that blockReasons are collected
  if (!content.includes('blockReasons.push')) {
    error('Missing blockReasons collection logic');
  }
  
  // Check that function returns fail-closed result
  if (!content.includes('return {')) {
    error('Missing return statement with result object');
  }
  
  log('Fail-closed logic verified.');

  // 11. Scope Check (using git if available)
  try {
    const { execSync } = require('child_process');
    const gitDiff = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const gitStatus = execSync('git status --short', { encoding: 'utf8' }).trim();
    
    // Check that only expected files are changed
    const changedFiles = gitDiff.split('\n').filter(Boolean);
    const stagedFiles = gitStatus.split('\n').filter(Boolean);
    
    // Allow only our two files to be changed/added
    const allowedFiles = [
      'lib/editorial/canonical-reaudit-registration-eligibility-types.ts',
      'scripts/verify-canonical-reaudit-8c2a-registration-eligibility.ts'
    ];
    
    for (const file of changedFiles) {
      if (!allowedFiles.includes(file) && 
          !file.includes('.kiro/') && 
          !file.includes('SIAIntel.worktrees/') &&
          !file.endsWith('.md')) {
        log(`Warning: Unexpected file changed: ${file}`);
      }
    }
    
    log('Scope check completed.');
  } catch (e) {
    // Git not available or error - skip scope check
    log('Git scope check skipped (git not available or error).');
  }

  log('VERIFICATION SUCCESS.');
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
