/**
 * Canonical Re-Audit Run Controller
 * 
 * TASK 7C-2B-1 SCOPE:
 * - Controlled execution controller/handler contract
 * - Client-safe gate evaluation logic
 * - No UI path invocation in 7C-2B-1
 * - Execute button remains disabled/inert
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - Client-safe only - no server imports
 * - No fs/path/crypto/node: imports
 * - No process.env, Buffer, next/server, next/headers
 * - No cookies, prisma/libsql/turso
 * - No fetch/axios, localStorage/sessionStorage
 * - No React imports
 * - No backend/API/database/provider calls
 * - Pure functions and async wrapper types only
 * 
 * @version 7C-2B-1.0.0
 */

// Import only pure types - no runtime logic
import type { 
  CanonicalReAuditResult,
  CanonicalReAuditSnapshotIdentity 
} from '@/lib/editorial/canonical-reaudit-types';
import type { RunCanonicalReAuditInput } from '@/lib/editorial/canonical-reaudit-input-builder';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Gate state fields for canonical re-audit run evaluation
 */
export interface CanonicalReAuditRunGateStateFields {
  preflightCanRun: boolean;
  hasComputedInput: boolean;
  allAcknowledgementsChecked: boolean;
  attestationMatches: boolean;
  isRunning: boolean;
  draftSource: string | null | undefined;
  hasSessionDraft: boolean;
  selectedArticleId: string | null | undefined;
  computedInputArticleId: string | null | undefined;
}

/**
 * Gate result fields for canonical re-audit run evaluation
 */
export interface CanonicalReAuditRunGateResultFields {
  canExecute: boolean;
  blockReasons: string[];
  uiLabel: string;
}

/**
 * Controller options for canonical re-audit run
 */
export interface CanonicalReAuditRunControllerOptions {
  run: (input: RunCanonicalReAuditInput) => Promise<CanonicalReAuditResult> | CanonicalReAuditResult;
  getGateState: () => CanonicalReAuditRunGateStateFields;
  getComputedInput: () => RunCanonicalReAuditInput | null;
}

/**
 * Controller interface for canonical re-audit run
 */
export interface CanonicalReAuditRunController {
  canExecute: () => boolean;
  executeConfirmedRun: () => Promise<CanonicalReAuditResult> | CanonicalReAuditResult;
}

// ============================================================================
// GATE EVALUATION LOGIC
// ============================================================================

/**
 * Evaluates canonical re-audit run gate with fail-closed logic
 * 
 * FAIL-CLOSED GATES:
 * - preflightCanRun === true
 * - hasComputedInput === true
 * - allAcknowledgementsChecked === true
 * - attestationMatches === true
 * - isRunning === false
 * - draftSource === "canonical"
 * - hasSessionDraft === false
 * - selectedArticleId exists
 * - computedInputArticleId exists
 * - selectedArticleId === computedInputArticleId
 * 
 * @param state - Gate state fields
 * @returns Gate result with execution permission and block reasons
 */
export function evaluateCanonicalReAuditRunGate(
  state: CanonicalReAuditRunGateStateFields
): CanonicalReAuditRunGateResultFields {
  const blockReasons: string[] = [];

  // GATE 1: Preflight must pass
  if (!state.preflightCanRun) {
    blockReasons.push('Preflight validation failed');
  }

  // GATE 2: Must have computed input
  if (!state.hasComputedInput) {
    blockReasons.push('Computed input missing');
  }

  // GATE 3: All acknowledgements must be checked
  if (!state.allAcknowledgementsChecked) {
    blockReasons.push('Required acknowledgements not completed');
  }

  // GATE 4: Attestation must match
  if (!state.attestationMatches) {
    blockReasons.push('Attestation phrase does not match');
  }

  // GATE 5: Must not be running
  if (state.isRunning) {
    blockReasons.push('Canonical re-audit already running');
  }

  // GATE 6: Must be viewing canonical vault
  if (state.draftSource !== "canonical") {
    blockReasons.push('Must be viewing canonical vault');
  }

  // GATE 7: No session draft must exist
  if (state.hasSessionDraft) {
    blockReasons.push('Session draft exists - clear session first');
  }

  // GATE 8: Selected article must exist
  if (!state.selectedArticleId) {
    blockReasons.push('No article selected');
  }

  // GATE 9: Computed input article must exist
  if (!state.computedInputArticleId) {
    blockReasons.push('Computed input article ID missing');
  }

  // GATE 10: Article IDs must match
  if (state.selectedArticleId && state.computedInputArticleId && 
      state.selectedArticleId !== state.computedInputArticleId) {
    blockReasons.push('Selected article does not match computed input');
  }

  // Determine execution permission
  const canExecute = blockReasons.length === 0;

  // Determine UI label
  let uiLabel: string;
  if (state.isRunning) {
    uiLabel = 'Running Re-Audit…';
  } else if (canExecute) {
    uiLabel = 'Run Canonical Re-Audit';
  } else {
    uiLabel = 'Complete Confirmations';
  }

  return {
    canExecute,
    blockReasons,
    uiLabel
  };
}

// ============================================================================
// CONTROLLER FACTORY
// ============================================================================

/**
 * Creates a canonical re-audit run controller
 * 
 * TASK 7C-2B-1 CONSTRAINTS:
 * - Controller defines shape of future run invocation
 * - Must remain inert unless explicitly called by tests
 * - executeConfirmedRun evaluates gate before run
 * - Throws/returns blocked if gate fails
 * - Never mutates globalAudit/vault
 * - Never persists/networks
 * - Never deploys/unlocks
 * 
 * @param options - Controller options
 * @returns Canonical re-audit run controller
 */
export function createCanonicalReAuditRunController(
  options: CanonicalReAuditRunControllerOptions
): CanonicalReAuditRunController {
  
  const canExecute = (): boolean => {
    const gateState = options.getGateState();
    const gateResult = evaluateCanonicalReAuditRunGate(gateState);
    return gateResult.canExecute;
  };

  const executeConfirmedRun = (): Promise<CanonicalReAuditResult> | CanonicalReAuditResult => {
    // PHASE 1: Evaluate gate immediately before run
    const gateState = options.getGateState();
    const gateResult = evaluateCanonicalReAuditRunGate(gateState);

    // PHASE 2: Block if gate fails
    if (!gateResult.canExecute) {
      const blockMessage = `Canonical re-audit blocked: ${gateResult.blockReasons.join(', ')}`;
      throw new Error(blockMessage);
    }

    // PHASE 3: Get computed input
    const computedInput = options.getComputedInput();
    if (!computedInput) {
      throw new Error('Canonical re-audit blocked: Computed input not available');
    }

    // PHASE 4: Call provided run function when gate passes
    // IMPORTANT: This is the only place where run() is called
    // In Task 7C-2B-1, there is no UI path invoking executeConfirmedRun
    return options.run(computedInput);
  };

  return {
    canExecute,
    executeConfirmedRun
  };
}