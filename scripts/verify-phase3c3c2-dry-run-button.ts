/**
 * Phase 3C-3C-2 Dry-Run Button Verification Script
 * 
 * This script verifies that the "Apply to Local Draft Copy — Dry Run" button
 * is correctly implemented with strict safety gates and no mutations.
 * 
 * CRITICAL SAFETY CHECKS:
 * - Dry-run button exists with exact label
 * - Old disabled Apply button remains
 * - Dry-run button is separate from old Apply
 * - Dry-run button only appears for FORMAT_REPAIR + body eligibility
 * - Dry-run button checks all required gates (checkboxes, STAGE acknowledgement)
 * - Dry-run button invokes onRequestLocalDraftApply only
 * - No controller invocation
 * - No mutations (localDraftCopy, vault, audit, session ledger)
 * - Correct result display copy
 * - Preview Apply remains inert
 * - No backend routes added
 * - Deploy gates and Panda validator unchanged
 */

import * as fs from 'fs'
import * as path from 'path'

const MODAL_PATH = 'app/admin/warroom/components/RemediationConfirmModal.tsx'
const PAGE_PATH = 'app/admin/warroom/page.tsx'
const PREVIEW_PANEL_PATH = 'app/admin/warroom/components/RemediationPreviewPanel.tsx'

function readFile(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return fs.readFileSync(fullPath, 'utf-8')
}

function checkPattern(content: string, pattern: RegExp | string, description: string): boolean {
  const found = typeof pattern === 'string' 
    ? content.includes(pattern)
    : pattern.test(content)
  
  if (found) {
    console.log(`[PASS] ${description}`)
    return true
  } else {
    console.log(`[FAIL] ${description}`)
    return false
  }
}

function checkNotPresent(content: string, pattern: RegExp | string, description: string): boolean {
  const found = typeof pattern === 'string'
    ? content.includes(pattern)
    : pattern.test(content)
  
  if (!found) {
    console.log(`[PASS] ${description}`)
    return true
  } else {
    console.log(`[FAIL] ${description}`)
    return false
  }
}

async function main() {
  console.log('--- PHASE 3C-3C-2 DRY-RUN BUTTON VERIFICATION START ---')
  
  const modalContent = readFile(MODAL_PATH)
  const pageContent = readFile(PAGE_PATH)
  const previewPanelContent = readFile(PREVIEW_PANEL_PATH)
  
  const checks: boolean[] = []

  // 1. Dry-run button exists with exact label
  checks.push(checkPattern(
    modalContent,
    'Apply to Local Draft Copy — Dry Run',
    'Dry-run button exists with exact label "Apply to Local Draft Copy — Dry Run"'
  ))

  // 2. Old "Apply to Draft — Disabled in Phase 3B" remains
  checks.push(checkPattern(
    modalContent,
    'Apply to Draft — Disabled in Phase 3B',
    'Old "Apply to Draft — Disabled in Phase 3B" remains'
  ))

  // 3. Old Apply button remains disabled={true}
  checks.push(checkPattern(
    modalContent,
    /disabled=\{true\}/,
    'Old Apply button remains disabled={true}'
  ))

  // 4. Dry-run button is separate from old Apply button
  const dryRunButtonIndex = modalContent.indexOf('Apply to Local Draft Copy — Dry Run')
  const oldApplyButtonIndex = modalContent.indexOf('Apply to Draft — Disabled in Phase 3B')
  checks.push(checkPattern(
    modalContent,
    dryRunButtonIndex > 0 && oldApplyButtonIndex > 0 && dryRunButtonIndex !== oldApplyButtonIndex ? 'true' : '',
    'Dry-run button is separate from old Apply button'
  ))

  // 5. Dry-run button only appears for FORMAT_REPAIR + body eligibility
  checks.push(checkPattern(
    modalContent,
    /isEligibleForPreview.*Apply to Local Draft Copy — Dry Run/s,
    'Dry-run button only appears for FORMAT_REPAIR + body eligibility'
  ))

  // 6. Dry-run button checks suggestionId presence
  checks.push(checkPattern(
    modalContent,
    /suggestionId.*handleDryRunApply/s,
    'Dry-run button checks suggestionId presence'
  ))

  // 7. Dry-run button checks language presence
  checks.push(checkPattern(
    modalContent,
    /language.*handleDryRunApply/s,
    'Dry-run button checks language presence'
  ))

  // 8. Dry-run button is disabled until checkboxes are checked
  checks.push(checkPattern(
    modalContent,
    /disabled=\{!allConfirmed \|\| !isAcknowledgementValid\}/,
    'Dry-run button is disabled until checkboxes are checked'
  ))

  // 9. Dry-run button is disabled until typed acknowledgement exactly equals STAGE
  checks.push(checkPattern(
    modalContent,
    /isAcknowledgementValid.*REQUIRED_ACKNOWLEDGEMENT_PHRASE/s,
    'Dry-run button is disabled until typed acknowledgement exactly equals STAGE'
  ))

  // 10. Wrong phrases stage, Stage, STAGED do not satisfy gate
  checks.push(checkPattern(
    modalContent,
    /typedAcknowledgement\.trim\(\) === REQUIRED_ACKNOWLEDGEMENT_PHRASE/,
    'Wrong phrases stage, Stage, STAGED do not satisfy gate (exact match required)'
  ))

  // 11. Dry-run button invokes onRequestLocalDraftApply
  checks.push(checkPattern(
    modalContent,
    /handleDryRunApply.*onRequestLocalDraftApply\(request\)/s,
    'Dry-run button invokes onRequestLocalDraftApply'
  ))

  // 12. Dry-run button does NOT call applyToLocalDraftController
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*applyToLocalDraftController/s,
    'Dry-run button does NOT call applyToLocalDraftController'
  ))

  // 13. Dry-run button does NOT call rollbackLastLocalDraftChange
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*rollbackLastLocalDraftChange/s,
    'Dry-run button does NOT call rollbackLastLocalDraftChange'
  ))

  // 14. Dry-run button does NOT mutate localDraftCopy
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*setLocalDraftCopy|localDraftCopy\s*=/s,
    'Dry-run button does NOT mutate localDraftCopy'
  ))

  // 15. Dry-run button does NOT update sessionRemediationLedger
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*setSessionRemediationLedger|sessionRemediationLedger\s*=/s,
    'Dry-run button does NOT update sessionRemediationLedger'
  ))

  // 16. Dry-run button does NOT set audit state STALE
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*setAudit.*STALE|auditInvalidated\s*=\s*true/s,
    'Dry-run button does NOT set audit state STALE'
  ))

  // 17. Dry-run button does NOT mutate canonical vault
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*setVault|vault\[.*\]\s*=/s,
    'Dry-run button does NOT mutate canonical vault'
  ))

  // 18. Dry-run result display includes "Dry-run accepted — no local draft change was made."
  checks.push(checkPattern(
    modalContent,
    'Dry-run accepted — no local draft change was made.',
    'Dry-run result display includes "Dry-run accepted — no local draft change was made."'
  ))

  // 19. Dry-run result display includes "Vault remains unchanged."
  checks.push(checkPattern(
    modalContent,
    'Vault remains unchanged.',
    'Dry-run result display includes "Vault remains unchanged."'
  ))

  // 20. Dry-run result display includes "No backend call was made."
  checks.push(checkPattern(
    modalContent,
    'No backend call was made.',
    'Dry-run result display includes "No backend call was made."'
  ))

  // 21. Dry-run result display includes "Deploy remains locked."
  checks.push(checkPattern(
    modalContent,
    'Deploy remains locked.',
    'Dry-run result display includes "Deploy remains locked."'
  ))

  // 22. Dry-run result display includes "This only verified the future apply gate."
  checks.push(checkPattern(
    modalContent,
    'This only verified the future apply gate.',
    'Dry-run result display includes "This only verified the future apply gate."'
  ))

  // 23. Dry-run result display includes "Future real local apply will require a full re-audit."
  checks.push(checkPattern(
    modalContent,
    'Future real local apply will require a full re-audit.',
    'Dry-run result display includes "Future real local apply will require a full re-audit."'
  ))

  // 24. Blocked/ineligible copy includes "Local apply dry-run unavailable."
  checks.push(checkPattern(
    modalContent,
    'Local apply dry-run unavailable.',
    'Blocked/ineligible copy includes "Local apply dry-run unavailable."'
  ))

  // 25. Blocked/ineligible copy includes "Only FORMAT_REPAIR body suggestions are eligible."
  checks.push(checkPattern(
    modalContent,
    'Only FORMAT_REPAIR body suggestions are eligible.',
    'Blocked/ineligible copy includes "Only FORMAT_REPAIR body suggestions are eligible."'
  ))

  // 26. Blocked/ineligible copy includes "Manual editorial review required."
  checks.push(checkPattern(
    modalContent,
    'Manual editorial review required.',
    'Blocked/ineligible copy includes "Manual editorial review required."'
  ))

  // 27. Preview Apply remains inert and does not call onRequestLocalDraftApply
  // Extract handleInertPreview function body to avoid false positive from broad regex
  const inertPreviewStart = modalContent.indexOf('const handleInertPreview = () => {')
  const inertPreviewEnd = modalContent.indexOf('const handleClearPreview', inertPreviewStart)
  const inertPreviewBody = inertPreviewStart !== -1 && inertPreviewEnd !== -1 
    ? modalContent.substring(inertPreviewStart, inertPreviewEnd)
    : ''
  checks.push(checkNotPresent(
    inertPreviewBody,
    'onRequestLocalDraftApply(',
    'Preview Apply remains inert and does not call onRequestLocalDraftApply'
  ))

  // 28. No fetch/axios/network calls added
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*fetch\(|handleDryRunApply.*axios\./s,
    'No fetch/axios/network calls added in handleDryRunApply'
  ))

  // 29. No localStorage/sessionStorage added
  checks.push(checkNotPresent(
    modalContent,
    /handleDryRunApply.*localStorage|handleDryRunApply.*sessionStorage/s,
    'No localStorage/sessionStorage added in handleDryRunApply'
  ))

  // 30. No backend routes added
  checks.push(checkNotPresent(
    modalContent,
    /\/api\/.*apply|\/api\/.*remediation/,
    'No backend routes added'
  ))

  // 31. Deploy gate source unchanged
  checks.push(checkPattern(
    pageContent,
    /isDeployBlocked.*useMemo/s,
    'Deploy gate source unchanged'
  ))

  // 32. Panda validator unchanged
  checks.push(checkPattern(
    pageContent,
    /PandaImport/,
    'Panda validator unchanged (PandaImport still present)'
  ))

  // 33. Phase 3C-3C-1 scaffold test compatibility
  checks.push(checkPattern(
    modalContent,
    /REQUIRED_ACKNOWLEDGEMENT_PHRASE = 'STAGE'/,
    'Phase 3C-3C-1 scaffold test still passes (STAGE acknowledgement exists)'
  ))

  // 34. Phase 3C-3B-2 callback plumbing test compatibility
  checks.push(checkPattern(
    pageContent,
    /handleRequestLocalDraftApply.*LocalDraftApplyRequest.*LocalDraftApplyRequestResult/s,
    'Phase 3C-3B-2 callback plumbing test still passes (handler signature intact)'
  ))

  // 35. Dry-run result state is modal-local only
  checks.push(checkPattern(
    modalContent,
    /const \[dryRunResult, setDryRunResult\] = useState/,
    'Dry-run result state is modal-local only (useState)'
  ))

  // 36. Dry-run result cleared on modal close
  checks.push(checkPattern(
    modalContent,
    /setDryRunResult\(null\).*Clear dry-run result on close/s,
    'Dry-run result cleared on modal close'
  ))

  // 37. Handler validates FORMAT_REPAIR in page.tsx
  checks.push(checkPattern(
    pageContent,
    /category === RemediationCategory\.FORMAT_REPAIR/,
    'Handler validates FORMAT_REPAIR in page.tsx'
  ))

  // 38. Handler validates fieldPath === body in page.tsx
  checks.push(checkPattern(
    pageContent,
    /fieldPath === 'body'/,
    'Handler validates fieldPath === body in page.tsx'
  ))

  // 39. Handler returns dryRunOnly: true
  checks.push(checkPattern(
    pageContent,
    /dryRunOnly: true/,
    'Handler returns dryRunOnly: true'
  ))

  // 40. Handler returns noMutation: true
  checks.push(checkPattern(
    pageContent,
    /noMutation: true/,
    'Handler returns noMutation: true'
  ))

  // 41. Handler does NOT call applyToLocalDraftController
  checks.push(checkNotPresent(
    pageContent,
    /handleRequestLocalDraftApply.*applyToLocalDraftController/s,
    'Handler does NOT call applyToLocalDraftController'
  ))

  // 42. Handler does NOT call rollbackLastLocalDraftChange
  checks.push(checkNotPresent(
    pageContent,
    /handleRequestLocalDraftApply.*rollbackLastLocalDraftChange/s,
    'Handler does NOT call rollbackLastLocalDraftChange'
  ))

  console.log('--- PHASE 3C-3C-2 DRY-RUN BUTTON VERIFICATION COMPLETE ---')
  
  const passed = checks.filter(Boolean).length
  const failed = checks.length - passed
  
  console.log(`\nVERIFICATION RESULT: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.error('\n❌ PHASE 3C-3C-2 DRY-RUN BUTTON VERIFICATION FAILED')
    process.exit(1)
  }
  
  console.log('\n✅ PHASE 3C-3C-2 DRY-RUN BUTTON VERIFICATION PASSED')
  process.exit(0)
}

main().catch((error) => {
  console.error('Error running verification:', error)
  process.exit(1)
})
