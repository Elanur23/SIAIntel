#!/usr/bin/env tsx

/**
 * TASK 7C-1 BOUNDARY VERIFICATION SCRIPT
 * 
 * Verifies that Task 7C-1 implementation follows strict boundaries:
 * - Trigger button component exists and is properly constrained
 * - Confirm modal component exists with required warnings and acknowledgements
 * - CanonicalReAuditPanel remains unchanged/read-only
 * - page.tsx properly wires components without calling canonicalReAudit.run()
 * - No forbidden behavior (deploy unlock, global audit overwrite, etc.)
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface VerificationResult {
  success: boolean
  message: string
  details?: string[]
}

class Task7C1BoundaryVerifier {
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

  private verifyTriggerButtonComponent(): void {
    try {
      const content = this.readFile('app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx')
      
      // 1. Component exists
      this.addResult(true, '✅ Trigger button component exists')

      // 2. Has required props interface
      const hasPropsInterface = content.includes('CanonicalReAuditTriggerButtonProps') &&
                               content.includes('visible: boolean') &&
                               content.includes('disabled: boolean') &&
                               content.includes('isRunning: boolean') &&
                               content.includes('disabledReason?: string | null') &&
                               content.includes('onOpenConfirmModal: () => void')
      
      this.addResult(hasPropsInterface, '✅ Trigger button has required props interface', 
        hasPropsInterface ? undefined : ['Missing required props in interface'])

      // 3. Button labeled exactly "Run Canonical Re-Audit"
      const hasCorrectLabel = content.includes('Run Canonical Re-Audit')
      this.addResult(hasCorrectLabel, '✅ Button has correct label "Run Canonical Re-Audit"',
        hasCorrectLabel ? undefined : ['Button label not found or incorrect'])

      // 4. Returns null when not visible
      const hasVisibilityCheck = content.includes('if (!visible) return null')
      this.addResult(hasVisibilityCheck, '✅ Returns null when not visible',
        hasVisibilityCheck ? undefined : ['Missing visibility check'])

      // 5. Button onClick only calls onOpenConfirmModal
      const hasOnClickHandler = content.includes('onClick={onOpenConfirmModal}')
      this.addResult(hasOnClickHandler, '✅ Button onClick calls onOpenConfirmModal',
        hasOnClickHandler ? undefined : ['onClick handler not found or incorrect'])

      // 6. No forbidden props/behavior
      const forbiddenPatterns = [
        /\bonRun\s*[=:]/,
        /\bonExecute\s*[=:]/,
        /\bonAudit\s*[=:]/,
        /canonicalReAudit\.run\s*\(/,
        /fetch\s*\(/,
        /axios\./,
        /localStorage\./,
        /sessionStorage\./,
        /\bpublish\s*\(/,
        /\bsave\s*\(/,
        /\bpromote\s*\(/,
        /\brollback\s*\(/,
        /\bdeploy\s*\(/
      ]
      
      const foundForbidden = forbiddenPatterns.filter(pattern => pattern.test(content))
      this.addResult(foundForbidden.length === 0, '✅ No forbidden patterns in trigger button',
        foundForbidden.length > 0 ? [`Found forbidden patterns: ${foundForbidden.map(p => p.source).join(', ')}`] : undefined)

    } catch (error) {
      this.addResult(false, '❌ Trigger button component verification failed', 
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyConfirmModalComponent(): void {
    try {
      const content = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      
      // 1. Component exists
      this.addResult(true, '✅ Confirm modal component exists')

      // 2. Has required props interface
      const hasPropsInterface = content.includes('CanonicalReAuditConfirmModalProps') &&
                               content.includes('isOpen: boolean') &&
                               content.includes('onClose: () => void')
      
      this.addResult(hasPropsInterface, '✅ Confirm modal has required props interface',
        hasPropsInterface ? undefined : ['Missing required props in interface'])

      // 3. Required warning copy exists
      const requiredWarnings = [
        'In-memory only',
        'Deploy remains locked',
        'Global audit has not been updated',
        'Acceptance is a later phase',
        'No save, publish, or deploy occurs',
        'Result may be STALE or BLOCKED'
      ]
      
      const missingWarnings = requiredWarnings.filter(warning => !content.includes(warning))
      this.addResult(missingWarnings.length === 0, '✅ All required warning copy present',
        missingWarnings.length > 0 ? [`Missing warnings: ${missingWarnings.join(', ')}`] : undefined)

      // 4. Required acknowledgement copy exists
      const requiredAcknowledgements = [
        'I understand this is an in-memory only canonical re-audit',
        'I understand deploy remains locked after re-audit',
        'I understand global audit will not be updated automatically',
        'I understand acceptance is a later phase',
        'I understand no save, publish, or deploy occurs during this action'
      ]
      
      const missingAcknowledgements = requiredAcknowledgements.filter(ack => !content.includes(ack))
      this.addResult(missingAcknowledgements.length === 0, '✅ All required acknowledgement copy present',
        missingAcknowledgements.length > 0 ? [`Missing acknowledgements: ${missingAcknowledgements.join(', ')}`] : undefined)

      // 5. Final execute button is disabled or inert
      const hasDisabledExecuteButton = content.includes('disabled={true}') || 
                                      content.includes('Execute Re-Audit (Disabled)')
      this.addResult(hasDisabledExecuteButton, '✅ Final execute button is disabled/inert',
        hasDisabledExecuteButton ? undefined : ['Execute button not properly disabled'])

      // 6. No canonicalReAudit.run() call
      // Remove all comments (both /* */ and //) and JSDoc to avoid false positives
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, '') // Remove // comments
        .replace(/^\s*\*.*$/gm, '') // Remove JSDoc lines starting with *
      
      const hasNoRunCall = !/canonicalReAudit\.run\s*\(/.test(codeOnly)
      this.addResult(hasNoRunCall, '✅ No canonicalReAudit.run() call in modal',
        hasNoRunCall ? undefined : ['Found canonicalReAudit.run() call in code (not comments)'])

      // 7. No forbidden wording (but allow in comments)
      const forbiddenWording = [
        /\bDeploy Ready\b/,
        /\bApproved\b/,
        /\bAccepted\b/,
        /\bSaved\b/,
        /\bPromoted\b/,
        /\bPublished\b/,
        /\bUnlocked\b/,
        /\bFinalized\b/,
        /\bLive\b/
      ]
      
      // Remove comments and JSDoc to avoid false positives
      const modalCodeOnly = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      const foundForbiddenWording = forbiddenWording.filter(pattern => pattern.test(modalCodeOnly))
      this.addResult(foundForbiddenWording.length === 0, '✅ No forbidden wording in modal',
        foundForbiddenWording.length > 0 ? [`Found forbidden wording: ${foundForbiddenWording.map(p => p.source).join(', ')}`] : undefined)

    } catch (error) {
      this.addResult(false, '❌ Confirm modal component verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyCanonicalReAuditPanelUnchanged(): void {
    try {
      const content = this.readFile('app/admin/warroom/components/CanonicalReAuditPanel.tsx')
      
      // 1. Component exists and is read-only
      const isReadOnly = content.includes('Read-only display component (no callbacks, no triggers)') &&
                        !content.includes('onRun') &&
                        !content.includes('onExecute') &&
                        !content.includes('onTrigger')
      
      this.addResult(isReadOnly, '✅ CanonicalReAuditPanel remains read-only',
        isReadOnly ? undefined : ['Panel appears to have been modified with callbacks'])

      // 2. No trigger functionality added
      const hasNoTrigger = !content.includes('button') || 
                          content.includes('Read-only display component')
      
      this.addResult(hasNoTrigger, '✅ CanonicalReAuditPanel has no trigger functionality',
        hasNoTrigger ? undefined : ['Panel appears to have trigger functionality added'])

    } catch (error) {
      this.addResult(false, '❌ CanonicalReAuditPanel verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyPageWiring(): void {
    try {
      const content = this.readFile('app/admin/warroom/page.tsx')
      
      // 1. Imports trigger button and modal
      const hasImports = content.includes("import CanonicalReAuditTriggerButton from './components/CanonicalReAuditTriggerButton'") &&
                        content.includes("import CanonicalReAuditConfirmModal from './components/CanonicalReAuditConfirmModal'")
      
      this.addResult(hasImports, '✅ Page imports trigger button and modal components',
        hasImports ? undefined : ['Missing component imports'])

      // 2. Has modal state
      const hasModalState = content.includes('isCanonicalReAuditConfirmOpen') &&
                           content.includes('setIsCanonicalReAuditConfirmOpen')
      
      this.addResult(hasModalState, '✅ Page has modal open state',
        hasModalState ? undefined : ['Missing modal state'])

      // 3. Renders trigger button near panel
      const rendersTriggerButton = content.includes('<CanonicalReAuditTriggerButton') &&
                                  content.includes('onOpenConfirmModal={() => setIsCanonicalReAuditConfirmOpen(true)}')
      
      this.addResult(rendersTriggerButton, '✅ Page renders trigger button with correct props',
        rendersTriggerButton ? undefined : ['Trigger button not rendered or props incorrect'])

      // 4. Renders modal once
      const rendersModal = content.includes('<CanonicalReAuditConfirmModal') &&
                          content.includes('onClose={() => setIsCanonicalReAuditConfirmOpen(false)}')
      
      this.addResult(rendersModal, '✅ Page renders confirm modal with correct props',
        rendersModal ? undefined : ['Confirm modal not rendered or props incorrect'])

      // 5. No canonicalReAudit.run() call in page
      const hasNoRunCall = !content.includes('canonicalReAudit.run(')
      this.addResult(hasNoRunCall, '✅ No canonicalReAudit.run() call in page',
        hasNoRunCall ? undefined : ['Found canonicalReAudit.run() call in page'])

      // 6. Disabled state computation exists
      const hasDisabledLogic = content.includes('canonicalReAuditTriggerDisabled') &&
                              content.includes('canonicalReAuditTriggerDisabledReason')
      
      this.addResult(hasDisabledLogic, '✅ Page has trigger disabled state computation',
        hasDisabledLogic ? undefined : ['Missing disabled state computation'])

    } catch (error) {
      this.addResult(false, '❌ Page wiring verification failed',
        [error instanceof Error ? error.message : String(error)])
    }
  }

  private verifyNoForbiddenBehavior(): void {
    // Only check Task 7C-1 components for forbidden behavior
    const filesToCheck = [
      'app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx',
      'app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx'
    ]

    // Patterns that indicate actual violations in Task 7C-1 components
    const forbiddenPatterns = [
      /canonicalReAudit\.run\s*\(/,
      /canonicalReAudit\.reset\s*\(/,
      /canonicalReAudit\.clearError\s*\(/,
      /setGlobalAudit\s*\(/, // Task 7C-1 components should not call setGlobalAudit
      /setVault\s*\(/, // Task 7C-1 components should not modify vault
      /fetch\s*\(/, // No network calls
      /axios\./, // No network calls
      /localStorage\./, // No local storage
      /sessionStorage\./, // No session storage
      /\bonRun\s*[=:]/,
      /\bonExecute\s*[=:]/,
      /\bonAudit\s*[=:]/
    ]

    let foundViolations: string[] = []

    filesToCheck.forEach(filePath => {
      try {
        const content = this.readFile(filePath)
        // Remove comments more thoroughly to avoid false positives
        const codeOnly = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
          .replace(/\/\/.*$/gm, '') // Remove // comments
          .replace(/^\s*\*.*$/gm, '') // Remove JSDoc lines starting with *
        
        forbiddenPatterns.forEach(pattern => {
          if (pattern.test(codeOnly)) {
            foundViolations.push(`${filePath}: ${pattern.source}`)
          }
        })
      } catch (error) {
        // File not found is a violation for required Task 7C-1 components
        foundViolations.push(`${filePath}: File not found`)
      }
    })

    this.addResult(foundViolations.length === 0, '✅ No forbidden behavior patterns found',
      foundViolations.length > 0 ? foundViolations : undefined)
  }

  public async verify(): Promise<void> {
    console.log('🔍 TASK 7C-1 BOUNDARY VERIFICATION')
    console.log('=====================================\n')

    // Run all verifications
    this.verifyTriggerButtonComponent()
    this.verifyConfirmModalComponent()
    this.verifyCanonicalReAuditPanelUnchanged()
    this.verifyPageWiring()
    this.verifyNoForbiddenBehavior()

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

    console.log('\n=====================================')
    console.log(`📊 VERIFICATION SUMMARY`)
    console.log(`✅ Passed: ${passCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`📋 Total:  ${this.results.length}`)

    if (failCount > 0) {
      console.log('\n🚨 TASK 7C-1 BOUNDARY VIOLATIONS DETECTED')
      console.log('Please fix the issues above before proceeding.')
      process.exit(1)
    } else {
      console.log('\n🎉 TASK 7C-1 BOUNDARIES VERIFIED')
      console.log('All components properly implement UI scaffold without forbidden behavior.')
    }
  }
}

// Run verification
const verifier = new Task7C1BoundaryVerifier()
verifier.verify().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})