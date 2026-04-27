/**
 * PHASE 3C-3C-1: UI Safety Scaffold Verification Script
 *
 * This script ensures that:
 * 1. Typed acknowledgement input scaffold exists (text input for "STAGE")
 * 2. Local-only warning block with all required safety copy exists
 * 3. Ineligible suggestion copy exists for non-FORMAT_REPAIR suggestions
 * 4. No invocation of onRequestLocalDraftApply from UI
 * 5. No calls to handleRequestLocalDraftApply, applyToLocalDraftController, or rollbackLastLocalDraftChange
 * 6. Real Apply button remains disabled
 * 7. Preview Apply remains inert
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx');

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    process.exit(1);
  }
}

console.log("--- PHASE 3C-3C-1 UI SAFETY SCAFFOLD VERIFICATION START ---");

// 1. File exists
check('RemediationConfirmModal.tsx exists', existsSync(modalPath));

const modalContent = readFileSync(modalPath, 'utf8');

// 2. Typed Acknowledgement Scaffold
check('Typed acknowledgement state exists', modalContent.includes('const [typedAcknowledgement, setTypedAcknowledgement] = useState'));
check('Required acknowledgement phrase constant exists', modalContent.includes('const REQUIRED_ACKNOWLEDGEMENT_PHRASE'));
check('Required phrase is exactly "STAGE"', modalContent.includes("REQUIRED_ACKNOWLEDGEMENT_PHRASE = 'STAGE'"));
check('Acknowledgement validation logic exists', modalContent.includes('const isAcknowledgementValid'));
check('Typed acknowledgement input field exists', modalContent.includes('type="text"') && modalContent.includes('value={typedAcknowledgement}'));
check('Typed acknowledgement onChange handler exists', modalContent.includes('onChange={(e) => setTypedAcknowledgement(e.target.value)}'));
check('Typed acknowledgement cleared on modal close', modalContent.includes("setTypedAcknowledgement('')"));

// 3. Local-Only Warning Block
check('Future Local Draft Copy Only heading exists', modalContent.includes('Future Local Draft Copy Only'));
check('Local Draft Copy Only warning exists', modalContent.includes('Local Draft Copy Only'));
check('Vault remains unchanged warning exists', modalContent.includes('Vault remains unchanged'));
check('This will not save or publish warning exists', modalContent.includes('This will not save or publish'));
check('Deploy remains locked warning exists', modalContent.includes('Deploy remains locked'));
check('Future local apply will invalidate audit warning exists', modalContent.includes('Future local apply will invalidate the current Global Audit'));
check('Full re-audit required warning exists', modalContent.includes('A full re-audit will be required before deploy'));
check('FORMAT_REPAIR + body only constraint exists', modalContent.includes('FORMAT_REPAIR + body only'));

// 4. Eligibility Explanation
check('Eligibility section exists', modalContent.includes('Eligibility:'));
check('Category display exists', modalContent.includes('Category:') && modalContent.includes('{suggestion.category}'));
check('Field display exists', modalContent.includes('Field:') && modalContent.includes('{suggestion.affectedField'));
check('Eligible status display exists', modalContent.includes('Eligible for future local apply'));

// 5. Acknowledgement Status Display
check('Acknowledgement status display exists', modalContent.includes('Acknowledgement prepared'));
check('Acknowledgement validation feedback exists', modalContent.includes('isAcknowledgementValid'));
check('UI scaffold only notice in acknowledgement exists', modalContent.includes('UI scaffold only — no action enabled'));

// 6. Phase 3C-3C-1 Scaffold Notice
check('Phase 3C-3C-1 scaffold notice exists', modalContent.includes('Phase 3C-3C-1 Scaffold Notice'));
check('UI-only safety scaffold notice exists', modalContent.includes('This is UI-only safety scaffold'));
check('No apply action enabled notice exists', modalContent.includes('No apply action is enabled'));
check('No controller invocation notice exists', modalContent.includes('No controller invocation'));
check('No vault mutation notice exists', modalContent.includes('No vault mutation'));

// 7. Ineligible Suggestion Explanation
check('Not eligible heading exists', modalContent.includes('Not Eligible for Local Draft Apply'));
check('Block reason display exists', modalContent.includes('{blockReason.replace(/_/g'));
check('Manual review required section exists', modalContent.includes('Manual Review Required'));
check('Human judgment explanation exists', modalContent.includes('This suggestion requires human judgment and manual editing'));
check('FORMAT_REPAIR eligibility explanation exists', modalContent.includes('Only FORMAT_REPAIR suggestions on body field are eligible'));
check('High-risk categories explanation exists', modalContent.includes('High-risk categories') && modalContent.includes('must be handled manually'));

// 8. Safety Invariants - Phase 3C-3C-2 Update
// The modal may now invoke onRequestLocalDraftApply from the dry-run button
// Check that old Apply button and Preview Apply do NOT invoke it
const hasOldApplyInvocation = modalContent.match(/Apply to Draft — Disabled in Phase 3B[\s\S]{0,200}onRequestLocalDraftApply\(/);
const hasPreviewApplyInvocation = modalContent.match(/handleInertPreview[\s\S]{0,500}onRequestLocalDraftApply\(/);
check('Old Apply button does NOT invoke onRequestLocalDraftApply', !hasOldApplyInvocation);
check('Preview Apply does NOT invoke onRequestLocalDraftApply', !hasPreviewApplyInvocation);
check('Modal does NOT call handleRequestLocalDraftApply', !modalContent.includes('handleRequestLocalDraftApply('));
check('Modal does NOT call applyToLocalDraftController', !modalContent.includes('applyToLocalDraftController'));
check('Modal does NOT call rollbackLastLocalDraftChange', !modalContent.includes('rollbackLastLocalDraftChange'));

// 9. Existing Controls Preserved
check('Real Apply button remains disabled', modalContent.includes('disabled={true}') && modalContent.includes('Apply to Draft — Disabled in Phase 3B'));
check('Preview Apply remains inert', modalContent.includes('Preview Apply (No Draft Change)'));

// Extract handleInertPreview function body to check it doesn't call onRequestLocalDraftApply
const inertPreviewStart = modalContent.indexOf('const handleInertPreview = () => {');
const inertPreviewEnd = modalContent.indexOf('const handleClearPreview', inertPreviewStart);
const inertPreviewBody = inertPreviewStart !== -1 && inertPreviewEnd !== -1 
  ? modalContent.substring(inertPreviewStart, inertPreviewEnd)
  : '';
check('Preview handler does not invoke onRequestLocalDraftApply', !inertPreviewBody.includes('onRequestLocalDraftApply('));

console.log("--- PHASE 3C-3C-1 UI SAFETY SCAFFOLD VERIFICATION COMPLETE ---");
process.exit(0);
