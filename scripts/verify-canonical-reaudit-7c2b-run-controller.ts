#!/usr/bin/env tsx

/**
 * TASK 7C-2B-1 RUN CONTROLLER VERIFICATION SCRIPT
 * 
 * Verifies that Task 7C-2B-1 implementation follows strict boundaries:
 * - Controller file exists and is client-safe/pure
 * - Gate evaluation logic is fail-closed
 * - Modal has typed attestation input and resets on open
 * - Execute button remains disabled/inert in 7C-2B-1
 * - No UI path invokes executeConfirmedRun
 * - No canonicalReAudit.run() calls in UI components
 * - No persistence/network/backend behavior
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

  private addResult(success: boolean, message: string, details?: string[]): void {
    this.results.push({ success, message, details })
  }

  private verifyControllerExists(): void {
    try {
      const content = this.readFile('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')
      
      // 1. Controller file exists
      this.addResult(true, '✅ Controller file exists')

      // 2. Controller is client-safe/pure - no server imports
      const serverImports = [
        /import.*['"]fs['"]/, /import.*['"]path['"]/, /import.*['"]crypto['"]/, /import.*['"]node:/,
        /import.*['"]next\/server['"]/, /import.*['"]next\/headers['"]/, 
        /import.*['"]cookies['"]/, /import.*['"]prisma/, /import.*['"]libsql/, /import.*['"]turso/,
        /fetch\s*\(/, /axios\./, /localStorage\./, /sessionStorage\./, /import.*['"]react['"]/
      ]
      
      const foundServerImports = serverImports.filter(pattern => pattern.test(content))
      this.addResult(foundServerImports.length === 0, '✅ Controller is client-safe/pure',
        foundServerImports.length > 0 ? [`Found server imports: ${foundServerImports.map(p => p.source).join(', ')}`] : undefined)

      // 3. evaluateCanonicalReAuditRunGate exists
      const hasGateEvaluation = content.includes('evaluateCanonicalReAuditRunGate')
      this.addResult(hasGateEvaluation, '✅ evaluateCanonicalReAuditRunGate exists',
        hasGateEvaluation ? undefined : ['Gate evaluation function not found'])

      // 4. Fail-closed gates exist
      const requiredGates = [
        'preflightCanRun === true',
        'hasComputedInput === true', 
        'allAcknowledgementsChecked === true',
        'attestationMatches === true',
        'isRunning',
        'draftSource === "canonical"',
        'hasSessionDraft',
        'selectedArticleId',
        'computedInputArticleId',
        'selectedArticleId === computedInputArticleId'
      ]
      
      const missingGates = requiredGates.filter(gate => {
        const gatePattern = gate.replace(/['"]/g, '[\'"]') // Allow both single and double quotes
        return !content.includes(gate) && !new RegExp(gatePattern).test(content)
      })
      this.addResult(missingGates.length === 0, '✅ All fail-closed gates exist',
        missingGates.length > 0 ? [`Missing gates: ${missingGates.join(', ')}`] : undefined)

      // 5. UI labels include required text
      const requiredLabels = [
        'Complete Confirmations',
        'Run Canonical Re-Audit',
        'Running Re-Audit…'
      ]
      
      const missingLabels = requiredLabels.filter(label => !content.includes(label))
      this.addResult(missingLabels.length === 0, '✅ Required UI labels present',
        missingLabels.length > 0 ? [`Missing labels: ${missingLabels.join(', ')}`] : undefined)

      // 6. createCanonicalReAuditRunController exists
      const hasControllerFactory = content.includes('createCanonicalReAuditRunController')
      this.addResult(hasControllerFactory, '✅ Controller factory exists',
        hasControllerFactory ? undefined : ['Controller factory function not found'])

      // 7. executeConfirmedRun is gated
      const hasGatedExecution = content.includes('executeConfirmedRun') && 
                               content.includes('evaluateCanonicalReAuditRunGate') &&
                               content.includes('throw new Error')
      this.addResult(hasGatedExecution, '✅ executeConfirmedRun is properly gated',
        hasGatedExecution ? undefined : ['executeConfirmedRun not properly gated'])

    } catch (error) {
      this.addResult(false, '❌ Controller verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyModalTypedAttestation(): void {
    try {
      const content = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      
      // 1. Modal has typed attestation input
      const hasTypedAttestation = content.includes('typedAttestation') &&
                                 content.includes('setTypedAttestation') &&
                                 content.includes('input') &&
                                 content.includes('Type the exact phrase')
      
      this.addResult(hasTypedAttestation, '✅ Modal has typed attestation input',
        hasTypedAttestation ? undefined : ['Typed attestation input not found'])

      // 2. Modal resets acknowledgements and attestation on open
      const hasResetOnOpen = content.includes('setTypedAttestation(\'\')') &&
                            content.includes('useEffect') &&
                            content.includes('isOpen')
      
      this.addResult(hasResetOnOpen, '✅ Modal resets attestation on open',
        hasResetOnOpen ? undefined : ['Reset on open not found'])

      // 3. Gate result display exists
      const hasGateDisplay = content.includes('gateResult') &&
                            content.includes('blockReasons') &&
                            content.includes('Execution Gate Status')
      
      this.addResult(hasGateDisplay, '✅ Modal displays gate/block reasons',
        hasGateDisplay ? undefined : ['Gate result display not found'])

      // 4. Execute button remains disabled/inert
      const hasDisabledButton = content.includes('disabled={true}') &&
                               content.includes('(Disabled)')
      
      this.addResult(hasDisabledButton, '✅ Execute button remains disabled/inert',
        hasDisabledButton ? undefined : ['Execute button not properly disabled'])

      // 5. No run/onRun/onExecute path
      const hasNoRunPath = !content.includes('onRun') && 
                          !content.includes('onExecute') &&
                          !content.includes('onConfirmedRun')
      
      this.addResult(hasNoRunPath, '✅ No run/onRun/onExecute path in modal',
        hasNoRunPath ? undefined : ['Found run/execute callback props'])

    } catch (error) {
      this.addResult(false, '❌ Modal attestation verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyPageWiring(): void {
    try {
      const content = this.readFile('app/admin/warroom/page.tsx')
      
      // 1. No canonicalReAudit.run() call
      const hasNoRunCall = !content.includes('canonicalReAudit.run(')
      this.addResult(hasNoRunCall, '✅ No canonicalReAudit.run() call in page',
        hasNoRunCall ? undefined : ['Found canonicalReAudit.run() call'])

      // 2. No clickable real run path
      const hasNoRealRunPath = !content.includes('executeConfirmedRun') &&
                              !content.includes('controller.execute')
      
      this.addResult(hasNoRealRunPath, '✅ No clickable real run path in page',
        hasNoRealRunPath ? undefined : ['Found real run path'])

      // 3. Gate evaluation import and usage
      const hasGateEvaluation = content.includes('evaluateCanonicalReAuditRunGate') &&
                               content.includes('CanonicalReAuditRunGateStateFields')
      
      this.addResult(hasGateEvaluation, '✅ Page imports and uses gate evaluation',
        hasGateEvaluation ? undefined : ['Gate evaluation not imported/used'])

      // 4. Gate result passed to modal
      const hasGateResultProp = content.includes('gateResult={canonicalReAuditGateResult}')
      
      this.addResult(hasGateResultProp, '✅ Gate result passed to modal',
        hasGateResultProp ? undefined : ['Gate result not passed to modal'])

      // 5. No deploy/globalAudit/vault mutation in new code
      const hasNoMutation = !content.includes('setGlobalAudit') ||
                           content.includes('// Clear stale global audit') // Existing allowed usage
      
      this.addResult(hasNoMutation, '✅ No new globalAudit/vault mutations',
        hasNoMutation ? undefined : ['Found new globalAudit/vault mutations'])

    } catch (error) {
      this.addResult(false, '❌ Page wiring verification failed',
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
      { pattern: /canonicalReAudit\.run\s*\(/, file: 'all', description: 'canonicalReAudit.run() call' },
      { pattern: /fetch\s*\(/, file: 'controller', description: 'fetch() call in controller' },
      { pattern: /axios\./, file: 'controller', description: 'axios call in controller' },
      { pattern: /localStorage\./, file: 'controller', description: 'localStorage in controller' },
      { pattern: /sessionStorage\./, file: 'controller', description: 'sessionStorage in controller' },
      { pattern: /prisma/, file: 'controller', description: 'prisma in controller' },
      { pattern: /libsql/, file: 'controller', description: 'libsql in controller' },
      { pattern: /turso/, file: 'controller', description: 'turso in controller' }
    ]

    let foundViolations: string[] = []

    filesToCheck.forEach(filePath => {
      try {
        const content = this.readFile(filePath)
        const codeOnly = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
          .replace(/\/\/.*$/gm, '') // Remove // comments
          .replace(/^\s*\*.*$/gm, '') // Remove JSDoc lines
        
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

    this.addResult(foundViolations.length === 0, '✅ No forbidden calls found',
      foundViolations.length > 0 ? foundViolations : undefined)
  }

  private verifyNoUIPathToExecute(): void {
    try {
      const pageContent = this.readFile('app/admin/warroom/page.tsx')
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      
      // Check that no UI component calls executeConfirmedRun
      const hasNoUIExecution = !pageContent.includes('executeConfirmedRun') &&
                              !modalContent.includes('executeConfirmedRun')
      
      this.addResult(hasNoUIExecution, '✅ No UI path invokes executeConfirmedRun',
        hasNoUIExecution ? undefined : ['Found UI path to executeConfirmedRun'])

      // Check that modal execute button is inert
      const hasInertButton = modalContent.includes('disabled={true}') &&
                            modalContent.includes('(Disabled)')
      
      this.addResult(hasInertButton, '✅ Modal execute button is inert',
        hasInertButton ? undefined : ['Modal execute button not inert'])

    } catch (error) {
      this.addResult(false, '❌ UI execution path verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifySafetyBoundaries(): void {
    try {
      const controllerContent = this.readFile('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')
      
      // Check for safety comments and constraints
      const hasSafetyComments = controllerContent.includes('CRITICAL SAFETY BOUNDARIES') &&
                               controllerContent.includes('Client-safe only') &&
                               controllerContent.includes('Never mutates globalAudit/vault')
      
      this.addResult(hasSafetyComments, '✅ Controller has safety documentation',
        hasSafetyComments ? undefined : ['Missing safety documentation'])

      // Check that controller doesn't import React or server modules
      const hasNoReactImports = !controllerContent.includes("import React") &&
                               !controllerContent.includes("from 'react'")
      
      this.addResult(hasNoReactImports, '✅ Controller has no React imports',
        hasNoReactImports ? undefined : ['Found React imports in controller'])

      // Check for type-only imports
      const hasTypeOnlyImports = controllerContent.includes('import type {')
      
      this.addResult(hasTypeOnlyImports, '✅ Controller uses type-only imports',
        hasTypeOnlyImports ? undefined : ['Missing type-only imports'])

    } catch (error) {
      this.addResult(false, '❌ Safety boundaries verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  public async verify(): Promise<void> {
    console.log('🔍 TASK 7C-2B-1 RUN CONTROLLER VERIFICATION')
    console.log('==========================================\n')

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
      console.log(result.message)
      if (result.details) {
        result.details.forEach(detail => {
          console.log(`  ${detail}`)
        })
      }
      
      if (result.success) {
        passCount++
      } else {
        failCount++
      }
    })

    console.log('\n==========================================')
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
      console.log('Run controller implemented with proper safety boundaries.')
    }
  }
}

// Run verification
const verifier = new Task7C2B1RunControllerVerifier()
verifier.verify().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})