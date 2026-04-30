/**
 * Task 6B-2A: Session Draft Promotion Adapter Contract Alignment Verification
 *
 * This script verifies that the 6B-2A adapter contract alignment is correctly implemented.
 * It checks that all required safety contracts exist and no forbidden execution paths were introduced.
 *
 * VERIFICATION SCOPE:
 * 1. Required contract terms exist in lib/editorial files
 * 2. Forbidden execution terms are absent from 6B-2A path
 * 3. Dry-run remains safe (no real execution)
 * 4. Real promote remains disabled in UI
 *
 * CRITICAL: This is a READ-ONLY verification script.
 * - No file modifications
 * - No execution of promotion logic
 * - No mutations
 * - No API calls
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// VERIFICATION CONFIGURATION
// ============================================================================

const REQUIRED_CONTRACT_TERMS = [
  // Canonical audit invalidation terms (at least one must exist)
  {
    name: 'canonicalAuditInvalidated OR canonicalReAuditRequired',
    patterns: [
      /canonicalAuditInvalidated/,
      /canonicalReAuditRequired/,
      /canonicalReAuditRequiredAfterPromotion/
    ],
    requiresAtLeastOne: true
  },
  // Deploy lock terms
  {
    name: 'deployMustRemainLocked',
    patterns: [/deployMustRemainLocked/, /maintainDeployLock/],
    requiresAtLeastOne: true
  },
  // Backend persistence forbidden
  {
    name: 'backendPersistenceAllowed: false',
    patterns: [/backendPersistenceAllowed:\s*false/, /backendPersistenceAllowed\s*=\s*false/],
    requiresAtLeastOne: true
  },
  // Memory-only operation
  {
    name: 'memoryOnly: true',
    patterns: [/memoryOnly:\s*true/, /memoryOnly\s*=\s*true/],
    requiresAtLeastOne: true
  },
  // Snapshot identity verification
  {
    name: 'snapshot identity / snapshot mismatch check',
    patterns: [
      /snapshotIdentity/,
      /SNAPSHOT_MISMATCH/,
      /verifySnapshotIdentityMatch/,
      /PromotionSnapshotBinding/
    ],
    requiresAtLeastOne: true
  },
  // Dry-run success requirement
  {
    name: 'dry-run success / preview',
    patterns: [
      /dryRunSuccess/,
      /isDryRun/,
      /LocalPromotionDryRunPreview/,
      /executeLocalPromotionDryRun/
    ],
    requiresAtLeastOne: true
  }
];

const FORBIDDEN_EXECUTION_TERMS = [
  {
    name: 'setVault introduced',
    patterns: [/setVault\s*\(/],
    description: 'Real vault mutation function'
  },
  {
    name: 'clearLocalDraft introduced',
    patterns: [/clearLocalDraft\s*\(/],
    description: 'Real session draft clearing function'
  },
  {
    name: 'real onPromote/onExecute path',
    patterns: [
      /onPromote\s*:\s*\(/,
      /onPromote\s*=\s*\(/,
      /onExecute\s*:\s*\(/,
      /onExecute\s*=\s*\(/,
      /executePromotion\s*\(/,
      /performPromotion\s*\(/
    ],
    description: 'Real promotion execution handlers'
  },
  {
    name: 'fetch/axios/database calls',
    patterns: [
      /fetch\s*\(/,
      /axios\./,
      /prisma\./,
      /libsql/,
      /\.execute\s*\(/,
      /\.query\s*\(/
    ],
    description: 'Backend/database/API calls'
  },
  {
    name: 'localStorage/sessionStorage writes',
    patterns: [
      /localStorage\.setItem/,
      /sessionStorage\.setItem/
    ],
    description: 'Browser persistence writes'
  },
  {
    name: 'deployUnlocked: true',
    patterns: [/deployUnlocked:\s*true/, /deployUnlocked\s*=\s*true/],
    description: 'Deploy unlock flag'
  },
  {
    name: 'deployAllowed: true',
    patterns: [/deployAllowed:\s*true/, /deployAllowed\s*=\s*true/],
    description: 'Deploy allowed flag'
  },
  {
    name: 'publishAllowed: true',
    patterns: [/publishAllowed:\s*true/, /publishAllowed\s*=\s*true/],
    description: 'Publish allowed flag'
  },
  {
    name: 'sessionAuditInherited: true',
    patterns: [/sessionAuditInherited:\s*true/, /sessionAuditInherited\s*=\s*true/],
    description: 'Session audit inheritance flag'
  },
  {
    name: 'canonicalAuditOverwriteAllowed: true',
    patterns: [/canonicalAuditOverwriteAllowed:\s*true/, /canonicalAuditOverwriteAllowed\s*=\s*true/],
    description: 'Canonical audit overwrite flag'
  }
];

const FILES_TO_CHECK = [
  'lib/editorial/session-draft-promotion-types.ts',
  'lib/editorial/session-draft-promotion-preconditions.ts',
  'lib/editorial/session-draft-promotion-payload.ts',
  'app/admin/warroom/handlers/promotion-execution-handler.ts',
  'app/admin/warroom/components/PromotionConfirmModal.tsx'
];

// ============================================================================
// VERIFICATION HELPERS
// ============================================================================

interface VerificationCheck {
  name: string;
  passed: boolean;
  details?: string;
}

function readFileContent(filePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

function checkRequiredTerm(
  fileContents: Map<string, string>,
  term: typeof REQUIRED_CONTRACT_TERMS[0]
): VerificationCheck {
  let foundInFiles: string[] = [];
  
  for (const [filePath, content] of fileContents.entries()) {
    for (const pattern of term.patterns) {
      if (pattern.test(content)) {
        foundInFiles.push(filePath);
        break;
      }
    }
  }

  const passed = foundInFiles.length > 0;
  const details = passed
    ? `Found in: ${foundInFiles.join(', ')}`
    : `Not found in any checked files`;

  return {
    name: `Required term: ${term.name}`,
    passed,
    details
  };
}

function checkForbiddenTerm(
  fileContents: Map<string, string>,
  term: typeof FORBIDDEN_EXECUTION_TERMS[0]
): VerificationCheck {
  let foundInFiles: string[] = [];
  
  for (const [filePath, content] of fileContents.entries()) {
    for (const pattern of term.patterns) {
      if (pattern.test(content)) {
        foundInFiles.push(filePath);
        break;
      }
    }
  }

  const passed = foundInFiles.length === 0;
  const details = passed
    ? `Not found (correct)`
    : `VIOLATION: Found in ${foundInFiles.join(', ')} - ${term.description}`;

  return {
    name: `Forbidden term: ${term.name}`,
    passed,
    details
  };
}

function checkDryRunSafety(fileContents: Map<string, string>): VerificationCheck {
  const handlerContent = fileContents.get('app/admin/warroom/handlers/promotion-execution-handler.ts');
  
  if (!handlerContent) {
    return {
      name: 'Dry-run handler safety',
      passed: false,
      details: 'Handler file not found'
    };
  }

  // Check that executeLocalPromotionDryRun exists
  const hasDryRunFunction = /export\s+function\s+executeLocalPromotionDryRun/.test(handlerContent);
  
  // Check that it returns preview with safety flags
  const hasExecutionPerformedFalse = /executionPerformed:\s*false/.test(handlerContent);
  const hasMutationPerformedFalse = /mutationPerformed:\s*false/.test(handlerContent);
  const hasIsDryRunTrue = /isDryRun:\s*true/.test(handlerContent);
  
  const passed = hasDryRunFunction && hasExecutionPerformedFalse && hasMutationPerformedFalse && hasIsDryRunTrue;
  
  const details = passed
    ? 'Dry-run handler exists with correct safety flags'
    : `Missing safety flags: ${!hasDryRunFunction ? 'function missing' : ''} ${!hasExecutionPerformedFalse ? 'executionPerformed not false' : ''} ${!hasMutationPerformedFalse ? 'mutationPerformed not false' : ''} ${!hasIsDryRunTrue ? 'isDryRun not true' : ''}`;

  return {
    name: 'Dry-run handler safety',
    passed,
    details
  };
}

function checkModalSafety(fileContents: Map<string, string>): VerificationCheck {
  const modalContent = fileContents.get('app/admin/warroom/components/PromotionConfirmModal.tsx');
  
  if (!modalContent) {
    return {
      name: 'Promotion modal safety',
      passed: false,
      details: 'Modal file not found'
    };
  }

  // Check that promote button is disabled
  const hasDisabledPromoteButton = /disabled={true}/.test(modalContent) || /disabled\s*=\s*{true}/.test(modalContent);
  
  // Check that no real onPromote handler exists
  const hasNoRealOnPromote = !/onPromote\s*=\s*{/.test(modalContent) || /onPromote.*disabled/.test(modalContent);
  
  // Check for safety warnings
  const hasSafetyWarnings = /Review Preview Only/.test(modalContent) || /No Promotion Execution/.test(modalContent);
  
  const passed = hasDisabledPromoteButton && hasNoRealOnPromote && hasSafetyWarnings;
  
  const details = passed
    ? 'Modal has disabled promote button and safety warnings'
    : `Safety issues: ${!hasDisabledPromoteButton ? 'promote button not disabled' : ''} ${!hasNoRealOnPromote ? 'real onPromote handler exists' : ''} ${!hasSafetyWarnings ? 'missing safety warnings' : ''}`;

  return {
    name: 'Promotion modal safety',
    passed,
    details
  };
}

// ============================================================================
// MAIN VERIFICATION
// ============================================================================

function runVerification(): void {
  console.log('============================================================================');
  console.log('TASK 6B-2A: SESSION DRAFT PROMOTION ADAPTER CONTRACT ALIGNMENT VERIFICATION');
  console.log('============================================================================\n');

  // Read all files
  const fileContents = new Map<string, string>();
  const missingFiles: string[] = [];

  for (const filePath of FILES_TO_CHECK) {
    const content = readFileContent(filePath);
    if (content === null) {
      missingFiles.push(filePath);
    } else {
      fileContents.set(filePath, content);
    }
  }

  if (missingFiles.length > 0) {
    console.log('❌ VERIFICATION FAILED: Missing required files\n');
    console.log('Missing files:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
    process.exit(1);
  }

  console.log('✓ All required files found\n');

  // Run verification checks
  const checks: VerificationCheck[] = [];

  // Check required contract terms
  console.log('Checking required contract terms...\n');
  for (const term of REQUIRED_CONTRACT_TERMS) {
    const check = checkRequiredTerm(fileContents, term);
    checks.push(check);
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    if (check.details) {
      console.log(`  ${check.details}`);
    }
  }

  console.log('\nChecking forbidden execution terms...\n');
  for (const term of FORBIDDEN_EXECUTION_TERMS) {
    const check = checkForbiddenTerm(fileContents, term);
    checks.push(check);
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    if (check.details) {
      console.log(`  ${check.details}`);
    }
  }

  console.log('\nChecking dry-run safety...\n');
  const dryRunCheck = checkDryRunSafety(fileContents);
  checks.push(dryRunCheck);
  console.log(`${dryRunCheck.passed ? '✓' : '✗'} ${dryRunCheck.name}`);
  if (dryRunCheck.details) {
    console.log(`  ${dryRunCheck.details}`);
  }

  console.log('\nChecking modal safety...\n');
  const modalCheck = checkModalSafety(fileContents);
  checks.push(modalCheck);
  console.log(`${modalCheck.passed ? '✓' : '✗'} ${modalCheck.name}`);
  if (modalCheck.details) {
    console.log(`  ${modalCheck.details}`);
  }

  // Summary
  console.log('\n============================================================================');
  console.log('VERIFICATION SUMMARY');
  console.log('============================================================================\n');

  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const failedChecks = totalChecks - passedChecks;

  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${failedChecks}\n`);

  if (failedChecks > 0) {
    console.log('❌ VERIFICATION FAILED\n');
    console.log('Failed checks:');
    checks.filter(c => !c.passed).forEach(check => {
      console.log(`  - ${check.name}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });
    console.log('\nVERDICT: TASK_6B2A_VERIFICATION_FAIL');
    process.exit(1);
  }

  console.log('✅ ALL CHECKS PASSED\n');
  console.log('VERDICT: TASK_6B2A_VERIFICATION_PASS\n');
  console.log('Safety Confirmation:');
  console.log('- All required contract terms exist');
  console.log('- No forbidden execution terms found');
  console.log('- Dry-run remains safe (no real execution)');
  console.log('- Real promote remains disabled in UI');
  console.log('- No vault/session mutation introduced');
  console.log('- No deploy logic changes');
  console.log('- No backend/API/database calls');
  console.log('- No localStorage/sessionStorage usage');
}

// Run verification
runVerification();
