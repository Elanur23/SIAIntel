#!/usr/bin/env npx tsx

/**
 * Verification Script: Task 7C-2B-2 Modal Run Wiring
 * 
 * Verifies that the canonical re-audit modal execute button is properly wired
 * to trigger canonicalReAudit.run() through the approved controlled path only.
 * 
 * CRITICAL VERIFICATION POINTS:
 * - Single approved execution path exists
 * - Modal execute button is properly gated
 * - Page-level handler exists and is wired correctly
 * - Modal lifecycle is safe (no auto-close, proper state reset)
 * - Result display is memory-only with proper warnings
 * - All forbidden behaviors are absent
 * 
 * @version 7C-2B-2.0.0
 */

import * as fs from 'fs'
import * as path from 'path'

interface VerificationResult {
  passed: boolean
  message: string
  details?: string[]
}

class Task7C2B2ModalRunWiringVerifier {
  private results: VerificationResult[] = []

  private readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to read ${filePath}: ${error}`)
    }
  }

  private addResult(passed: boolean, message: string, details?: string[]): void {
    this.results.push({ passed, message, details })
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${message}`)
    if (details && details.length > 0) {
      details.forEach(detail => console.log(`   ${detail}`))
    }
  }

  private countMatches(content: string, pattern: RegExp): number {
    const matches = content.match(pattern)
    return matches ? matches.length : 0
  }

  public verify(): boolean {
    console.log('🔍 Verifying Task 7C-2B-2: Modal Run Wiring Implementation...\n')

    try {
      this.verifyApprovedExecutionPath()
      this.verifyModalExecuteGating()
      this.verifyPageLevelHandler()
      this.verifyModalLifecycle()
      this.verifyResultDisplay()
      this.verifyForbiddenBehaviors()
      this.verifyCloseModalSafety()

      const allPassed = this.results.every(r => r.passed)
      const passedCount = this.results.filter(r => r.passed).length
      const totalCount = this.results.length

      console.log(`\n📊 Verification Summary: ${passedCount}/${totalCount} checks passed`)
      
      if (allPassed) {
        console.log('🎉 Task 7C-2B-2 Modal Run Wiring: VERIFICATION PASSED')
        return true
      } else {
        console.log('💥 Task 7C-2B-2 Modal Run Wiring: VERIFICATION FAILED')
        return false
      }
    } catch (error) {
      console.error('💥 Verification failed with error:', error)
      return false
    }
  }

  private verifyApprovedExecutionPath(): void {
    console.log('📋 Verifying Approved Execution Path...')

    try {
      const pageContent = this.readFile('app/admin/warroom/page.tsx')
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      const controllerContent = this.readFile('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')

      // 1. Page has confirmed run handler
      const hasConfirmedRunHandler = pageContent.includes('handleConfirmedCanonicalReAuditRun') &&
                                   pageContent.includes('const handleConfirmedCanonicalReAuditRun = useCallback')

      this.addResult(hasConfirmedRunHandler, 'Page has confirmed run handler',
        hasConfirmedRunHandler ? [] : ['Missing handleConfirmedCanonicalReAuditRun handler'])

      // 2. Handler calls canonicalReAudit.run with proper input
      const handlerCallsRun = pageContent.includes('canonicalReAudit.run(runInput)') &&
                             pageContent.includes('articleId: selectedNews.id') &&
                             pageContent.includes('operatorId: \'warroom-operator\'')

      this.addResult(handlerCallsRun, 'Handler calls canonicalReAudit.run with proper input',
        handlerCallsRun ? [] : ['Handler does not call canonicalReAudit.run or missing required input fields'])

      // 3. Modal receives onConfirmedRun prop
      const modalReceivesHandler = pageContent.includes('onConfirmedRun={handleConfirmedCanonicalReAuditRun}')

      this.addResult(modalReceivesHandler, 'Modal receives onConfirmedRun handler',
        modalReceivesHandler ? [] : ['Modal does not receive handleConfirmedCanonicalReAuditRun as onConfirmedRun prop'])

      // 4. Modal execute button calls onConfirmedRun
      const modalCallsHandler = modalContent.includes('onClick={handleExecute}') &&
                               modalContent.includes('onConfirmedRun()')

      this.addResult(modalCallsHandler, 'Modal execute button calls onConfirmedRun',
        modalCallsHandler ? [] : ['Modal execute button does not call onConfirmedRun'])

      // 5. canonicalReAudit.run is NOT called directly by modal
      const modalCodeOnly = modalContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
      const modalDoesNotCallRunDirectly = !modalCodeOnly.includes('canonicalReAudit.run')

      this.addResult(modalDoesNotCallRunDirectly, 'Modal does not call canonicalReAudit.run directly',
        modalDoesNotCallRunDirectly ? [] : ['Modal calls canonicalReAudit.run directly - should use onConfirmedRun prop'])

      // 6. TriggerButton does not call run
      const triggerContent = this.readFile('app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx')
      const triggerCodeOnly = triggerContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
      const triggerDoesNotCallRun = !triggerCodeOnly.includes('canonicalReAudit.run') &&
                                   !triggerCodeOnly.includes('executeConfirmedRun')

      this.addResult(triggerDoesNotCallRun, 'TriggerButton does not call run methods',
        triggerDoesNotCallRun ? [] : ['TriggerButton calls run methods - should only open modal'])

      // 7. Panel does not call run
      const panelContent = this.readFile('app/admin/warroom/components/CanonicalReAuditPanel.tsx')
      const panelCodeOnly = panelContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
      const panelDoesNotCallRun = !panelCodeOnly.includes('canonicalReAudit.run') &&
                                 !panelCodeOnly.includes('executeConfirmedRun')

      this.addResult(panelDoesNotCallRun, 'Panel does not call run methods',
        panelDoesNotCallRun ? [] : ['Panel calls run methods - should be display-only'])

    } catch (error) {
      this.addResult(false, 'Failed to verify approved execution path', [String(error)])
    }
  }

  private verifyModalExecuteGating(): void {
    console.log('📋 Verifying Modal Execute Gating...')

    try {
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      const pageContent = this.readFile('app/admin/warroom/page.tsx')

      // 1. Execute button is gated by canExecute
      const buttonGatedByCanExecute = modalContent.includes('disabled={!canExecute || isRunning}') &&
                                     modalContent.includes('const canExecute = Boolean(gateResult?.canExecute)')

      this.addResult(buttonGatedByCanExecute, 'Execute button is gated by canExecute',
        buttonGatedByCanExecute ? [] : ['Execute button is not properly gated by canExecute'])

      // 2. Gate evaluation includes all required checks
      const gateEvaluationComplete = pageContent.includes('allAcknowledgementsChecked: allAcknowledged') &&
                                   pageContent.includes('attestationMatches: attestationMatches') &&
                                   pageContent.includes('preflightCanRun: canonicalReAuditPreflight.canRun') &&
                                   pageContent.includes('hasComputedInput: Boolean(canonicalReAuditPreflight.computedInput)')

      this.addResult(gateEvaluationComplete, 'Gate evaluation includes all required checks',
        gateEvaluationComplete ? [] : ['Gate evaluation missing required checks'])

      // 3. Button text changes based on state
      const buttonTextChanges = modalContent.includes('gateResult?.uiLabel') &&
                               modalContent.includes('Running Re-Audit…') &&
                               modalContent.includes('Complete Confirmations')

      this.addResult(buttonTextChanges, 'Button text changes based on state',
        buttonTextChanges ? [] : ['Button text does not change based on state'])

      // 4. Modal has acknowledgement state management
      const hasAcknowledgementState = pageContent.includes('canonicalReAuditAcknowledgements') &&
                                     pageContent.includes('handleCanonicalReAuditAcknowledgementToggle')

      this.addResult(hasAcknowledgementState, 'Modal has acknowledgement state management',
        hasAcknowledgementState ? [] : ['Missing acknowledgement state management'])

      // 5. Modal has typed attestation state
      const hasAttestationState = pageContent.includes('canonicalReAuditTypedAttestation') &&
                                 pageContent.includes('setCanonicalReAuditTypedAttestation')

      this.addResult(hasAttestationState, 'Modal has typed attestation state',
        hasAttestationState ? [] : ['Missing typed attestation state'])

    } catch (error) {
      this.addResult(false, 'Failed to verify modal execute gating', [String(error)])
    }
  }

  private verifyPageLevelHandler(): void {
    console.log('📋 Verifying Page Level Handler...')

    try {
      const pageContent = this.readFile('app/admin/warroom/page.tsx')

      // 1. Handler re-checks gate state before run
      const handlerRechecksGate = pageContent.includes('if (!canonicalReAuditGateResult?.canExecute)') &&
                                 pageContent.includes('Re-check gate state immediately before run')

      this.addResult(handlerRechecksGate, 'Handler re-checks gate state before run',
        handlerRechecksGate ? [] : ['Handler does not re-check gate state before run'])

      // 2. Handler validates preflight and computed input
      const handlerValidatesInput = pageContent.includes('if (!canonicalReAuditPreflight?.canRun || !canonicalReAuditPreflight.computedInput)') &&
                                   pageContent.includes('Preflight validation failed or computed input missing')

      this.addResult(handlerValidatesInput, 'Handler validates preflight and computed input',
        handlerValidatesInput ? [] : ['Handler does not validate preflight and computed input'])

      // 3. Handler validates selected article
      const handlerValidatesArticle = pageContent.includes('if (!selectedNews?.id)') &&
                                     pageContent.includes('No article selected')

      this.addResult(handlerValidatesArticle, 'Handler validates selected article',
        handlerValidatesArticle ? [] : ['Handler does not validate selected article'])

      // 4. Handler constructs proper run input
      const handlerConstructsInput = pageContent.includes('const runInput = {') &&
                                    pageContent.includes('canonicalSnapshot: canonicalReAuditPreflight.computedInput.canonicalSnapshot') &&
                                    pageContent.includes('vault: canonicalReAuditPreflight.computedInput.vault')

      this.addResult(handlerConstructsInput, 'Handler constructs proper run input',
        handlerConstructsInput ? [] : ['Handler does not construct proper run input'])

      // 5. Handler has error handling
      const handlerHasErrorHandling = pageContent.includes('try {') &&
                                     pageContent.includes('} catch (error) {') &&
                                     pageContent.includes('console.error')

      this.addResult(handlerHasErrorHandling, 'Handler has error handling',
        handlerHasErrorHandling ? [] : ['Handler missing error handling'])

    } catch (error) {
      this.addResult(false, 'Failed to verify page level handler', [String(error)])
    }
  }

  private verifyModalLifecycle(): void {
    console.log('📋 Verifying Modal Lifecycle...')

    try {
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      const pageContent = this.readFile('app/admin/warroom/page.tsx')

      // 1. Modal cannot close while running
      const cannotCloseWhileRunning = modalContent.includes('const canClose = !isRunning') &&
                                     modalContent.includes('disabled={!canClose}')

      this.addResult(cannotCloseWhileRunning, 'Modal cannot close while running',
        cannotCloseWhileRunning ? [] : ['Modal can close while running'])

      // 2. No auto-close after result
      const modalCodeOnly = modalContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
      
      // Check for auto-close patterns (not manual close button)
      const hasAutoClose = modalCodeOnly.includes('setTimeout(') ||
                          modalCodeOnly.includes('setInterval(') ||
                          modalCodeOnly.includes('useEffect(') ||
                          // Check for onClose() calls outside of handleClose function
                          (modalCodeOnly.includes('onClose()') && 
                           !modalCodeOnly.includes('const handleClose = () => {') &&
                           !modalCodeOnly.includes('onClick={canClose ? handleClose : undefined}'))

      this.addResult(!hasAutoClose, 'No auto-close after result',
        !hasAutoClose ? [] : ['Modal has auto-close behavior'])

      // 3. Result shown inside modal
      const resultShownInModal = modalContent.includes('hasTerminalResult && resultDisplay') &&
                                modalContent.includes('Re-Audit Result')

      this.addResult(resultShownInModal, 'Result shown inside modal',
        resultShownInModal ? [] : ['Result not shown inside modal'])

      // 4. Close Review button used for result close
      const closeReviewButton = modalContent.includes('Close Review') &&
                               !modalContent.includes('Done') &&
                               !modalContent.includes('Proceed') &&
                               !modalContent.includes('Continue') &&
                               !modalContent.includes('Finish')

      this.addResult(closeReviewButton, 'Close Review button used (forbidden labels absent)',
        closeReviewButton ? [] : ['Using forbidden close button labels'])

      // 5. Modal state resets on close
      const stateResetsOnClose = pageContent.includes('handleCanonicalReAuditModalClose') &&
                                pageContent.includes('setCanonicalReAuditAcknowledgements') &&
                                pageContent.includes('setCanonicalReAuditTypedAttestation(\'\')') &&
                                pageContent.includes('inMemoryOnly: false')

      this.addResult(stateResetsOnClose, 'Modal state resets on close',
        stateResetsOnClose ? [] : ['Modal state does not reset on close'])

    } catch (error) {
      this.addResult(false, 'Failed to verify modal lifecycle', [String(error)])
    }
  }

  private verifyResultDisplay(): void {
    console.log('📋 Verifying Result Display...')

    try {
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')

      // 1. PASSED result has memory-only warning
      const passedHasMemoryWarning = modalContent.includes('This result exists only in this session\'s memory') &&
                                    modalContent.includes('Deploy remains locked') &&
                                    modalContent.includes('Global audit has not been updated')

      this.addResult(passedHasMemoryWarning, 'PASSED result has memory-only warning',
        passedHasMemoryWarning ? [] : ['PASSED result missing memory-only warning'])

      // 2. FAILED result has memory-only warning
      const failedHasMemoryWarning = modalContent.includes('No state has changed. This result is memory-only')

      this.addResult(failedHasMemoryWarning, 'FAILED result has memory-only warning',
        failedHasMemoryWarning ? [] : ['FAILED result missing memory-only warning'])

      // 3. BLOCKED result has memory-only warning
      const blockedHasMemoryWarning = modalContent.includes('No state changed. This result is memory-only. Deploy remains locked. Global audit has not been updated.')

      this.addResult(blockedHasMemoryWarning, 'BLOCKED result has memory-only warning',
        blockedHasMemoryWarning ? [] : ['BLOCKED result missing memory-only warning'])

      // 4. STALE result has memory-only warning
      const staleHasMemoryWarning = modalContent.includes('No state changed. This result is memory-only')

      this.addResult(staleHasMemoryWarning, 'STALE result has memory-only warning',
        staleHasMemoryWarning ? [] : ['STALE result missing memory-only warning'])

      // 5. PASSED result does not use deploy-ready wording
      const passedNotDeployReady = !modalContent.includes('deploy-ready') &&
                                  !modalContent.includes('production-ready') &&
                                  !modalContent.includes('approved') &&
                                  !modalContent.includes('clear to deploy')

      this.addResult(passedNotDeployReady, 'PASSED result does not use deploy-ready wording',
        passedNotDeployReady ? [] : ['PASSED result uses forbidden deploy-ready wording'])

      // 6. PASSED result uses provisional/pending language
      const passedUsesProvisionalLanguage = modalContent.includes('Acceptance review is required in a later phase')

      this.addResult(passedUsesProvisionalLanguage, 'PASSED result uses provisional/pending language',
        passedUsesProvisionalLanguage ? [] : ['PASSED result missing provisional/pending language'])

    } catch (error) {
      this.addResult(false, 'Failed to verify result display', [String(error)])
    }
  }

  private verifyForbiddenBehaviors(): void {
    console.log('📋 Verifying Forbidden Behaviors...')

    try {
      const pageContent = this.readFile('app/admin/warroom/page.tsx')
      const modalContent = this.readFile('app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx')
      const controllerContent = this.readFile('app/admin/warroom/controllers/canonical-reaudit-run-controller.ts')

      // 1. No setGlobalAudit calls in canonical re-audit handler
      const canonicalHandlerStart = pageContent.indexOf('handleConfirmedCanonicalReAuditRun')
      const canonicalHandlerEnd = pageContent.indexOf('})', canonicalHandlerStart) + 2
      const canonicalHandlerCode = canonicalHandlerStart !== -1 && canonicalHandlerEnd > canonicalHandlerStart ? 
                         pageContent.substring(canonicalHandlerStart, canonicalHandlerEnd) : ''
      const noSetGlobalAuditInHandler = !canonicalHandlerCode.includes('setGlobalAudit')

      this.addResult(noSetGlobalAuditInHandler, 'No setGlobalAudit calls in canonical re-audit handler',
        noSetGlobalAuditInHandler ? [] : ['Found setGlobalAudit calls in canonical re-audit handler'])

      // 2. No setVault calls in handler
      const noSetVaultInHandler = !canonicalHandlerCode.includes('setVault')

      this.addResult(noSetVaultInHandler, 'No setVault calls in canonical re-audit handler',
        noSetVaultInHandler ? [] : ['Found setVault calls in canonical re-audit handler'])

      // 3. No deploy unlock
      const noDeployUnlock = !pageContent.includes('deployUnlockAllowed: true') &&
                            !modalContent.includes('deployUnlockAllowed: true') &&
                            !controllerContent.includes('deployUnlockAllowed: true')

      this.addResult(noDeployUnlock, 'No deploy unlock behavior',
        noDeployUnlock ? [] : ['Found deploy unlock behavior'])

      // 4. No save/publish/promote/rollback
      const noSavePublishPromote = !canonicalHandlerCode.includes('save') &&
                                  !canonicalHandlerCode.includes('publish') &&
                                  !canonicalHandlerCode.includes('promote') &&
                                  !canonicalHandlerCode.includes('rollback')

      this.addResult(noSavePublishPromote, 'No save/publish/promote/rollback in handler',
        noSavePublishPromote ? [] : ['Found save/publish/promote/rollback in handler'])

      // 5. No fetch/axios persistence
      const noPersistence = !canonicalHandlerCode.includes('fetch(') &&
                           !canonicalHandlerCode.includes('axios') &&
                           !canonicalHandlerCode.includes('localStorage') &&
                           !canonicalHandlerCode.includes('sessionStorage')

      this.addResult(noPersistence, 'No persistence calls in handler',
        noPersistence ? [] : ['Found persistence calls in handler'])

      // 6. No run in useEffect
      const noRunInUseEffect = !pageContent.includes('useEffect') ||
                              !pageContent.includes('canonicalReAudit.run') ||
                              pageContent.indexOf('canonicalReAudit.run') > pageContent.lastIndexOf('useEffect')

      this.addResult(noRunInUseEffect, 'No canonicalReAudit.run in useEffect',
        noRunInUseEffect ? [] : ['Found canonicalReAudit.run in useEffect'])

    } catch (error) {
      this.addResult(false, 'Failed to verify forbidden behaviors', [String(error)])
    }
  }

  private verifyCloseModalSafety(): void {
    console.log('📋 Verifying Close Modal Safety...')

    try {
      const pageContent = this.readFile('app/admin/warroom/page.tsx')

      // 1. Closing modal resets acknowledgement state
      const resetsAcknowledgements = pageContent.includes('handleCanonicalReAuditModalClose') &&
                                    pageContent.includes('setCanonicalReAuditAcknowledgements({') &&
                                    pageContent.includes('inMemoryOnly: false')

      this.addResult(resetsAcknowledgements, 'Closing modal resets acknowledgement state',
        resetsAcknowledgements ? [] : ['Closing modal does not reset acknowledgement state'])

      // 2. Closing modal resets attestation state
      const resetsAttestation = pageContent.includes('setCanonicalReAuditTypedAttestation(\'\')') &&
                               pageContent.includes('handleCanonicalReAuditModalClose')

      this.addResult(resetsAttestation, 'Closing modal resets attestation state',
        resetsAttestation ? [] : ['Closing modal does not reset attestation state'])

      // 3. Closing modal does not unlock deploy
      const doesNotUnlockDeploy = !pageContent.includes('setIsDeployBlocked(false)') ||
                                 pageContent.indexOf('setIsDeployBlocked(false)') < 
                                 pageContent.indexOf('handleCanonicalReAuditModalClose')

      this.addResult(doesNotUnlockDeploy, 'Closing modal does not unlock deploy',
        doesNotUnlockDeploy ? [] : ['Closing modal unlocks deploy'])

      // 4. Closing modal does not update globalAudit
      const doesNotUpdateGlobalAudit = !pageContent.includes('setGlobalAudit') ||
                                      pageContent.indexOf('setGlobalAudit') < 
                                      pageContent.indexOf('handleCanonicalReAuditModalClose')

      this.addResult(doesNotUpdateGlobalAudit, 'Closing modal does not update globalAudit',
        doesNotUpdateGlobalAudit ? [] : ['Closing modal updates globalAudit'])

      // 5. Modal close handler prevents stale ready-to-run state
      const preventsStaleState = pageContent.includes('// Reset modal-local state on close') &&
                                pageContent.includes('setIsCanonicalReAuditConfirmOpen(false)')

      this.addResult(preventsStaleState, 'Modal close handler prevents stale ready-to-run state',
        preventsStaleState ? [] : ['Modal close handler does not prevent stale state'])

    } catch (error) {
      this.addResult(false, 'Failed to verify close modal safety', [String(error)])
    }
  }
}

// Execute verification
const verifier = new Task7C2B2ModalRunWiringVerifier()
const success = verifier.verify()
process.exit(success ? 0 : 1)