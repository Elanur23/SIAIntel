#!/usr/bin/env tsx

/**
 * TASK 7C-2B-1 RUN CONTROLLER VERIFICATION SCRIPT (UPDATED)
 * 
 * Verifies that Task 7C-2B-1 implementation follows strict boundaries:
 * - Controller file exists and is client-safe/pure
 * - Gate evaluation logic is fail-closed
 * - Modal has typed attestation input and resets on open
 * - Execute button is gated by canExecute and isRunning
 * - UI execution is allowed only through the approved Task 7C-2B-2 modal path
 * - canonicalReAudit.run() is allowed only in the approved page handler
 * - No persistence/network/backend behavior
 * - No globalAudit/vault/deploy mutation
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface VerificationResult {
  success: boolean
  message: string
  details?: string[]
}

class Task7C2B1RunControllerVerifier {
  private workspaceRoot: string
  private results: VerificationResult[] = []

  constructor() {
    this.workspaceRoot = process.cwd()
  }

  private readFile(relativePath: string): string {
    const fullPath = join(this.workspaceRoot, relativePath)
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`)
    }
    return readFileSync(fullPath, 'utf-8')
  }

  private getCleanCode(relativePath: string): string {
    const content = this.readFile(relativePath)
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/^\s*\*.*$/gm, '') // Remove JSDoc lines
  }

  private addResult(success: boolean, message: string, details?: string[]): void {
    this.results.push({ success, message, details })
  }

  private verifyControllerExists(): void {
    try {
      const codeOnly = this.getCleanCode('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')

      // 1. Controller file exists
      this.addResult(true, 'Controller file exists')

      // 2. Controller is client-safe/pure - no server imports
      const serverImports = [
        /import.*['"]fs['"]/, /import.*['"]path['"]/, /import.*['"]crypto['"]/, /import.*['"]node:/,
        /import.*['"]next\/server['"]/, /import.*['"]next\/headers['"]/, 
        /import.*['"]cookies['"]/, /import.*['"]prisma/, /import.*['"]libsql/, /import.*['"]turso/,
        /fetch\s*\(/, /axios\./, /localStorage\./, /sessionStorage\./, /import.*['"]react['"]/
      ]
      
      const foundServerImports = serverImports.filter(pattern => pattern.test(codeOnly))
      this.addResult(foundServerImports.length === 0, 'Controller is client-safe/pure',
        foundServerImports.length > 0 ? [`Found server imports: ${foundServerImports.map(p => p.source).join(', ')}`] : undefined)

      // 3. evaluateCanonicalReAuditRunGate exists
      const hasGateEvaluation = codeOnly.includes('evaluateCanonicalReAuditRunGate')
      this.addResult(hasGateEvaluation, 'evaluateCanonicalReAuditRunGate exists',
        hasGateEvaluation ? undefined : ['Gate evaluation function not found'])

      // 4. Fail-closed gates exist
      const requiredGates = [
        '!state.preflightCanRun',
        '!state.hasComputedInput',
        '!state.allAcknowledgementsChecked',
        '!state.attestationMatches',
        'state.isRunning',
        'state.draftSource !== "canonical"',
        'state.hasSessionDraft',
        '!state.selectedArticleId',
        '!state.computedInputArticleId',
        'state.selectedArticleId !== state.computedInputArticleId'
      ]
      
      const missingGates = requiredGates.filter(gate => !codeOnly.includes(gate))
      this.addResult(missingGates.length === 0, 'All fail-closed gates exist',
        missingGates.length > 0 ? [`Missing gates: ${missingGates.join(', ')}`] : undefined)

      // 5. UI labels include required text
      const requiredLabels = [
        'Complete Confirmations',
        'Run Canonical Re-Audit',
        'Running Re-Audit…'
      ]
      
      const missingLabels = requiredLabels.filter(label => !codeOnly.includes(label))
      this.addResult(missingLabels.length === 0, 'Required UI labels present',
        missingLabels.length > 0 ? [`Missing labels: ${missingLabels.join(', ')}`] : undefined)

      // 6. createCanonicalReAuditRunController exists
      const hasControllerFactory = codeOnly.includes('createCanonicalReAuditRunController')
      this.addResult(hasControllerFactory, 'Controller factory exists',
        hasControllerFactory ? undefined : ['Controller factory function not found'])

      // 7. executeConfirmedRun is gated
      const hasGatedExecution = codeOnly.includes('executeConfirmedRun') &&
                               codeOnly.includes('evaluateCanonicalReAuditRunGate') &&
                               codeOnly.includes('throw new Error')
      this.addResult(hasGatedExecution, 'executeConfirmedRun is properly gated',
        hasGatedExecution ? undefined : ['executeConfirmedRun not properly gated'])

    } catch (error) {
      this.addResult(false, 'Controller verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyModalTypedAttestation(): void {
    try {
      const codeOnly = this.getCleanCode('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      
      // 1. Modal has typed attestation input
      const hasTypedAttestation = codeOnly.includes('typedAttestation') &&
                                 codeOnly.includes('onTypedAttestationChange') &&
                                 codeOnly.includes('input') &&
                                 codeOnly.includes('Type the exact phrase')
      
      this.addResult(hasTypedAttestation, 'Modal has typed attestation input',
        hasTypedAttestation ? undefined : ['Typed attestation input not found'])

      // 2. Modal resets acknowledgements and attestation on close
      const pageCodeOnly = this.getCleanCode('app/admin/warroom/page.tsx')
      const hasResetOnClose = pageCodeOnly.includes('handleCanonicalReAuditModalClose') &&
                             pageCodeOnly.includes('setCanonicalReAuditTypedAttestation(\'\')') &&
                             pageCodeOnly.includes('setCanonicalReAuditAcknowledgements({')
      
      this.addResult(hasResetOnClose, 'Modal resets attestation/acknowledgements on close',
        hasResetOnClose ? undefined : ['Reset on close not found in page.tsx'])

      // 3. Gate result display exists
      const hasGateDisplay = codeOnly.includes('gateResult') &&
                            codeOnly.includes('blockReasons') &&
                            codeOnly.includes('Execution Gate Status')
      
      this.addResult(hasGateDisplay, 'Modal displays gate/block reasons',
        hasGateDisplay ? undefined : ['Gate result display not found'])

      // 4. Execute button is properly gated
      const hasGatedButton = codeOnly.includes('disabled={!canExecute || isRunning}') &&
                            codeOnly.includes('const canExecute = Boolean(gateResult?.canExecute)')
      
      this.addResult(hasGatedButton, 'Execute button is properly gated',
        hasGatedButton ? undefined : ['Execute button gating not found'])

      // 5. Approved onConfirmedRun path
      const hasApprovedRunPath = codeOnly.includes('onConfirmedRun') &&
                                codeOnly.includes('onClick={handleExecute}') &&
                                codeOnly.includes('handleExecute = () => {')
      
      this.addResult(hasApprovedRunPath, 'Modal has approved onConfirmedRun path',
        hasApprovedRunPath ? undefined : ['Approved run callback path not found'])

    } catch (error) {
      this.addResult(false, 'Modal attestation verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyPageWiring(): void {
    try {
      const codeOnly = this.getCleanCode('app/admin/warroom/page.tsx')
      
      // 1. canonicalReAudit.run() only in approved handler
      const matches = codeOnly.match(/canonicalReAudit\.run\(/g) || []
      const hasOneRunCall = matches.length === 1
      const isInsideApprovedHandler = codeOnly.includes('const handleConfirmedCanonicalReAuditRun = useCallback(() => {') &&
                                     codeOnly.includes('canonicalReAudit.run(runInput)')

      this.addResult(hasOneRunCall && isInsideApprovedHandler, 'canonicalReAudit.run() used only in approved handler',
        !hasOneRunCall ? [`Found ${matches.length} calls to canonicalReAudit.run()`] :
        !isInsideApprovedHandler ? ['canonicalReAudit.run() not inside handleConfirmedCanonicalReAuditRun'] : undefined)

      // 2. Controlled run path wired to modal
      const hasModalWiring = codeOnly.includes('onConfirmedRun={handleConfirmedCanonicalReAuditRun}')
      
      this.addResult(hasModalWiring, 'Controlled run path wired to modal',
        hasModalWiring ? undefined : ['Modal not wired to handleConfirmedCanonicalReAuditRun'])

      // 3. Gate evaluation import and usage
      const hasGateEvaluation = codeOnly.includes('evaluateCanonicalReAuditRunGate') &&
                               codeOnly.includes('CanonicalReAuditRunGateStateFields')
      
      this.addResult(hasGateEvaluation, 'Page imports and uses gate evaluation',
        hasGateEvaluation ? undefined : ['Gate evaluation not imported/used'])

      // 4. Gate result passed to modal
      const hasGateResultProp = codeOnly.includes('gateResult={canonicalReAuditGateResult}')
      
      this.addResult(hasGateResultProp, 'Gate result passed to modal',
        hasGateResultProp ? undefined : ['Gate result not passed to modal'])

      // 5. No deploy/globalAudit/vault mutation in confirmed run handler
      const handlerStart = codeOnly.indexOf('handleConfirmedCanonicalReAuditRun')
      const handlerEnd = codeOnly.indexOf('}, [', handlerStart)
      const handlerCode = handlerStart !== -1 && handlerEnd > handlerStart ?
                         codeOnly.substring(handlerStart, handlerEnd) : ''
      
      const forbiddenInHandler = [
        'setGlobalAudit', 'setVault', 'setIsDeployBlocked(false)',
        'fetch(', 'axios', 'localStorage', 'sessionStorage',
        'save', 'publish', 'promote', 'rollback'
      ]

      const foundForbidden = forbiddenInHandler.filter(item => handlerCode.includes(item))

      this.addResult(foundForbidden.length === 0, 'No forbidden mutations in confirmed run handler',
        foundForbidden.length > 0 ? [`Found forbidden calls in handler: ${foundForbidden.join(', ')}`] : undefined)

    } catch (error) {
      this.addResult(false, 'Page wiring verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyNoForbiddenCalls(): void {
    const filesToCheck = [
      'app/admin/warroom/page.tsx',
      'app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx',
      'app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx',
      'app/admin/warroom/components/CanonicalReAuditPanel.tsx',
      'app/admin/warroom/controllers/canonical-reaudit-run-controller.ts'
    ]

    const forbiddenPatterns = [
      { pattern: /fetch\s*\(/, file: 'controller', description: 'fetch() call in controller' },
      { pattern: /axios\./, file: 'controller', description: 'axios call in controller' },
      { pattern: /localStorage\./, file: 'controller', description: 'localStorage in controller' },
      { pattern: /sessionStorage\./, file: 'controller', description: 'sessionStorage in controller' },
      { pattern: /prisma/, file: 'controller', description: 'prisma in controller' },
      { pattern: /libsql/, file: 'controller', description: 'libsql in controller' },
      { pattern: /turso/, file: 'controller', description: 'turso in controller' },
      { pattern: /setVault/, file: 'controller', description: 'setVault in controller' }
    ]

    let foundViolations: string[] = []

    filesToCheck.forEach(filePath => {
      try {
        const codeOnly = this.getCleanCode(filePath)
        
        forbiddenPatterns.forEach(({ pattern, file, description }) => {
          if ((file === 'all' || filePath.includes(file)) && pattern.test(codeOnly)) {
            foundViolations.push(`${filePath}: ${description}`)
          }
        })
      } catch (error) {
        // Only controller is required for this task
        if (filePath.includes('controller')) {
          foundViolations.push(`${filePath}: File not found`)
        }
      }
    })

    this.addResult(foundViolations.length === 0, 'No forbidden calls found',
      foundViolations.length > 0 ? foundViolations : undefined)
  }

  private verifyNoUIPathToExecute(): void {
    try {
      // Check that no other UI component calls executeConfirmedRun or canonicalReAudit.run
      const triggerCodeOnly = this.getCleanCode('app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx')
      const panelCodeOnly = this.getCleanCode('app/admin/warroom/components/CanonicalReAuditPanel.tsx')
      
      const foundInTrigger = triggerCodeOnly.includes('canonicalReAudit.run') || triggerCodeOnly.includes('executeConfirmedRun')
      const foundInPanel = panelCodeOnly.includes('canonicalReAudit.run') || panelCodeOnly.includes('executeConfirmedRun')
      
      this.addResult(!foundInTrigger && !foundInPanel, 'TriggerButton and Panel do not run audit',
        foundInTrigger ? ['TriggerButton contains run call'] : foundInPanel ? ['Panel contains run call'] : undefined)

      // Check that modal execute button is gated
      const modalCodeOnly = this.getCleanCode('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      const hasGatedButton = modalCodeOnly.includes('disabled={!canExecute || isRunning}')
      this.addResult(hasGatedButton, 'Modal execute button is gated',
        hasGatedButton ? undefined : ['Modal execute button not gated'])

    } catch (error) {
      this.addResult(false, 'UI execution path verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifySafetyBoundaries(): void {
    try {
      const controllerCodeOnly = this.getCleanCode('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')
      const pageCodeOnly = this.getCleanCode('app/admin/warroom/page.tsx')

      // Check for safety comments and constraints
      const rawContent = this.readFile('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')
      const hasSafetyComments = rawContent.includes('CRITICAL SAFETY BOUNDARIES') &&
                               rawContent.includes('Client-safe only') &&
                               rawContent.includes('Never mutates globalAudit/vault')
      
      this.addResult(hasSafetyComments, 'Controller has safety documentation',
        hasSafetyComments ? undefined : ['Missing safety documentation'])

      // Check that controller doesn't import React or server modules
      const hasNoReactImports = !controllerCodeOnly.includes("import React") &&
                               !controllerCodeOnly.includes("from 'react'")
      
      this.addResult(hasNoReactImports, 'Controller has no React imports',
        hasNoReactImports ? undefined : ['Found React imports in controller'])

      // Check for no run in useEffect
      const hasNoRunInUseEffect = !pageCodeOnly.includes('useEffect(() => {\n    canonicalReAudit.run') &&
                                 !pageCodeOnly.includes('useEffect(() => {\n    if (.*) {\n      canonicalReAudit.run')
      
      this.addResult(hasNoRunInUseEffect, 'No canonicalReAudit.run in useEffect',
        hasNoRunInUseEffect ? undefined : ['Found canonicalReAudit.run in useEffect'])

      // Check for no deploy unlock/mutation
      const hasNoDeployUnlock = !pageCodeOnly.includes('setIsDeployBlocked(false)') ||
                               pageCodeOnly.lastIndexOf('setIsDeployBlocked(false)') < pageCodeOnly.indexOf('handleConfirmedCanonicalReAuditRun')

      this.addResult(hasNoDeployUnlock, 'No new deploy unlock path found',
        hasNoDeployUnlock ? undefined : ['Found potential deploy unlock path'])

    } catch (error) {
      this.addResult(false, 'Safety boundaries verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  public async verify(): Promise<void> {
    console.log('🔍 TASK 7C-2B-1 RUN CONTROLLER VERIFICATION (MODERNIZED)')
    console.log('======================================================\n')

    // Run all verifications
    this.verifyControllerExists()
    this.verifyModalTypedAttestation()
    this.verifyPageWiring()
    this.verifyNoForbiddenCalls()
    this.verifyNoUIPathToExecute()
    this.verifySafetyBoundaries()

    // Print results
    let passCount = 0
    let failCount = 0

    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌'
      console.log(`${icon} ${result.message}`)
      if (result.details) {
        result.details.forEach(detail => {
          console.log(`  - ${detail}`)
        })
      }
      
      if (result.success) {
        passCount++
      } else {
        failCount++
      }
    })

    console.log('\n======================================================')
    console.log(`📊 VERIFICATION SUMMARY`)
    console.log(`✅ Passed: ${passCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`📋 Total:  ${this.results.length}`)

    if (failCount > 0) {
      console.log('\n🚨 TASK 7C-2B-1 VIOLATIONS DETECTED')
      console.log('Please fix the issues above before proceeding.')
      process.exit(1)
    } else {
      console.log('\n🎉 TASK 7C-2B-1 VERIFIED')
      console.log('Run controller implemented with proper safety boundaries and Task 7C-2B-2 compatibility.')
    }
  }
}

// Run verification
const verifier = new Task7C2B1RunControllerVerifier()
verifier.verify().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})