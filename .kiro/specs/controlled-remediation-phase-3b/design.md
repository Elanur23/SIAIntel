# Design Document — Controlled Remediation Phase 3B: Confirmation Modal Prototype

## Overview

Controlled Remediation Phase 3B implements a **UI-only confirmation modal prototype** for reviewing eligible remediation suggestions. This modal provides a side-by-side preview of current vs. suggested text changes, with mandatory human confirmation checkboxes and a disabled/mock apply control.

**Critical Phase 3B Constraints:**
- **Strictly UI prototype only** — no actual draft or vault mutation
- **No API routes, database writes, or server persistence**
- **No audit state changes or deploy gate modifications**
- **Preview future human-approved draft apply behavior without implementing it**

The modal serves as a **human review interface** that demonstrates the confirmation workflow for future phases while maintaining fail-closed safety posture.

---

## Architecture

### Component Hierarchy

```
RemediationPreviewPanel (existing, minimal modifications)
├── SuggestionCard (existing, add Review button for eligible suggestions)
└── RemediationConfirmModal (new, pure presentational component)
    ├── WarningBanner (non-dismissible safety notice)
    ├── SideBySideDiffPreview (original vs suggested text)
    ├── MandatoryConfirmationCheckboxes (human acknowledgment)
    └── DisabledApplyControl (prototype-only, non-mutating)
```

### File Structure

**Files to Create:**
- `app/admin/warroom/components/RemediationConfirmModal.tsx` — Main modal component

**Files to Modify Minimally:**
- `app/admin/warroom/components/RemediationPreviewPanel.tsx` — Add modal integration
- `app/admin/warroom/page.tsx` — Only if minimal prop wiring is required

**Files NOT to Modify:**
- `lib/editorial/remediation-engine.ts`
- `lib/editorial/remediation-apply-types.ts` (import-only usage)
- `lib/editorial/remediation-types.ts`
- Core audit/validator logic
- API routes or server components

### Data Flow

```
1. User clicks "Review Suggestion" on eligible suggestion
2. RemediationPreviewPanel opens RemediationConfirmModal
3. Modal displays side-by-side preview using existing suggestion data
4. User reviews diff and checks mandatory confirmation boxes
5. Apply button remains disabled/non-mutating (prototype only)
6. Modal closes without any mutation or side effects
```

---

## Component API Design

### RemediationConfirmModal Props

```typescript
interface RemediationConfirmModalProps {
  // Modal State
  isOpen: boolean;
  onClose: () => void;
  
  // Suggestion Data
  suggestion: RemediationSuggestion | null;
  originalText?: string | null;
  
  // Context (for display only)
  articleId?: string;
  packageId?: string;
  
  // Styling
  className?: string;
}
```

**Key Design Decisions:**
- **No `onApply` prop** — Phase 3B is prototype-only
- **No mutation callbacks** — maintains side-effect-free design
- **Minimal props** — uses existing suggestion data structure
- **Optional originalText** — handles cases where current text is unavailable

### State Management

```typescript
// Local UI state only (no persistence)
const [confirmations, setConfirmations] = useState({
  understandsDraftChange: false,
  reviewedDiff: false,
  understandsNoDeployUnlock: false
});

// Reset state when modal closes
useEffect(() => {
  if (!isOpen) {
    setConfirmations({
      understandsDraftChange: false,
      reviewedDiff: false,
      understandsNoDeployUnlock: false
    });
  }
}, [isOpen]);
```

---

## PreviewPanel Integration

### Minimal Changes to RemediationPreviewPanel

```typescript
// Add local state for modal
const [selectedSuggestion, setSelectedSuggestion] = useState<RemediationSuggestion | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// Add handler for opening modal
const handleReviewSuggestion = (suggestion: RemediationSuggestion) => {
  setSelectedSuggestion(suggestion);
  setIsModalOpen(true);
};

// Add handler for closing modal
const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedSuggestion(null);
};
```

### SuggestionCard Modifications

```typescript
// Add Review button for eligible suggestions only
{!isHumanOnly && isApplyEligibleSuggestion(suggestion) && (
  <button
    onClick={() => onReviewSuggestion(suggestion)}
    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
  >
    Review Suggestion
  </button>
)}

// Locked suggestions continue to show existing messaging
{isHumanOnly && (
  <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
    <Lock size={12} className="text-yellow-400" />
    <span className="text-xs text-yellow-300">Human review required</span>
  </div>
)}
```

---

## Eligibility Gating

### Phase 3A Helper Integration

```typescript
import {
  isApplyEligibleSuggestion,
  getApplyBlockReason,
  RemediationApplyStatus
} from '@/lib/editorial/remediation-apply-types';

// Check eligibility before showing Review button
const isEligible = isApplyEligibleSuggestion(suggestion);
const blockReason = getApplyBlockReason(suggestion);

// Locked categories (no Review button shown):
// - SOURCE_REVIEW
// - PROVENANCE_REVIEW  
// - PARITY_REVIEW
// - HUMAN_ONLY safety level
// - FORBIDDEN_TO_AUTOFIX safety level
// - Missing suggestedText
// - Fact/source/provenance/number sensitive suggestions
```

### Eligibility Display Logic

```typescript
const getEligibilityMessage = (suggestion: RemediationSuggestion): string => {
  const blockReason = getApplyBlockReason(suggestion);
  
  switch (blockReason) {
    case RemediationApplyStatus.BLOCKED_SOURCE_REVIEW:
      return "Evidence required — human must verify and add source attribution.";
    case RemediationApplyStatus.BLOCKED_PROVENANCE_REVIEW:
      return "Provenance required — human must verify provenance data.";
    case RemediationApplyStatus.BLOCKED_PARITY_REVIEW:
      return "Human truth-source required — numeric/entity verification needed.";
    case RemediationApplyStatus.BLOCKED_HUMAN_ONLY:
      return "Human review required — no automated suggestion.";
    case RemediationApplyStatus.BLOCKED_MISSING_SUGGESTED_TEXT:
      return "No automated suggestion available.";
    default:
      return "Human review required — no automated suggestion.";
  }
};
```

---

## Side-by-Side Diff Design

### Layout Structure

```typescript
<div className="grid grid-cols-2 gap-4">
  {/* Left Column: Original Text */}
  <div className="space-y-2">
    <h3 className="text-sm font-bold text-white/80">Current Text</h3>
    {originalText ? (
      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
        <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">
          {originalText}
        </pre>
      </div>
    ) : (
      <div className="p-3 bg-gray-900/50 border border-gray-500/30 rounded">
        <p className="text-xs text-gray-400 italic">
          Original text unavailable — apply disabled.
        </p>
      </div>
    )}
  </div>

  {/* Right Column: Suggested Text */}
  <div className="space-y-2">
    <h3 className="text-sm font-bold text-white/80">Suggested Text</h3>
    {suggestion.suggestedText ? (
      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
        <pre className="text-xs text-green-300 whitespace-pre-wrap font-mono">
          {suggestion.suggestedText}
        </pre>
      </div>
    ) : (
      <div className="p-3 bg-gray-900/50 border border-gray-500/30 rounded">
        <p className="text-xs text-gray-400 italic">
          No automated suggestion available.
        </p>
      </div>
    )}
  </div>
</div>
```

### Safety Constraints

- **Never fabricate originalText** — show "unavailable" message if missing
- **Never fabricate suggestedText** — show "no suggestion" message if null
- **Never fabricate sources, provenance, or numeric corrections**
- **Disable apply if originalText unavailable** — prevents blind application

---

## Confirmation Checkbox Design

### Required Confirmation Text

```typescript
const REQUIRED_CONFIRMATIONS = [
  {
    key: 'understandsDraftChange',
    text: 'I understand this changes the draft and requires re-audit.'
  },
  {
    key: 'reviewedDiff',
    text: 'I have reviewed the before/after diff.'
  },
  {
    key: 'understandsNoDeployUnlock',
    text: 'I understand this does not unlock Deploy.'
  }
] as const;
```

### Checkbox Implementation

```typescript
{REQUIRED_CONFIRMATIONS.map(({ key, text }) => (
  <label key={key} className="flex items-start gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={confirmations[key]}
      onChange={(e) => setConfirmations(prev => ({
        ...prev,
        [key]: e.target.checked
      }))}
      className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
    />
    <span className="text-xs text-white/80 leading-relaxed">
      {text}
    </span>
  </label>
))}
```

### Checkbox Behavior

- **Unchecked by default** — user must explicitly acknowledge each item
- **Local UI state only** — no persistence or server communication
- **Resets when modal closes** — fresh state for each review session
- **Checking does not trigger mutation** — purely UI feedback

---

## Disabled/Mock Apply Control

### Apply Button Design

```typescript
const allConfirmed = Object.values(confirmations).every(Boolean);
const canShowApply = originalText && suggestion.suggestedText;

<button
  disabled={true} // Always disabled in Phase 3B
  className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded cursor-not-allowed"
  title="Prototype only — no draft changes will be made"
>
  Apply to Draft — Disabled in Phase 3B
</button>

{/* Alternative: Conditionally enabled but still non-mutating */}
<button
  disabled={!allConfirmed || !canShowApply}
  onClick={() => {
    // Phase 3B: No-op prototype behavior
    console.log('Phase 3B: Mock apply - no mutation performed');
  }}
  className={`w-full px-4 py-2 rounded ${
    allConfirmed && canShowApply
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
  }`}
>
  Apply to Draft — Disabled in Phase 3B
</button>
```

### Safety Constraints

- **No API calls** — button performs no network requests
- **No save operations** — no draft or vault mutation
- **No publish triggers** — no deployment or publishing behavior
- **No deploy unlock** — deploy gates remain unchanged
- **Clear prototype labeling** — user understands this is non-functional

---

## Warning Banner Design

### Required Warning Text

```typescript
<div className="mb-4 p-4 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg">
  <div className="flex items-center gap-2 mb-2">
    <ShieldAlert size={16} className="text-yellow-400" />
    <h3 className="text-sm font-bold text-yellow-400 uppercase">
      Prototype Only — No Changes Made
    </h3>
  </div>
  <ul className="text-xs text-yellow-300/90 space-y-1 list-disc list-inside">
    <li>Prototype only — no draft change will be made.</li>
    <li>This does not unlock Deploy.</li>
    <li>Future apply will require re-audit.</li>
    <li>Human approval is required before any draft change.</li>
  </ul>
</div>
```

### Warning Behavior

- **Visible immediately when modal opens** — no delay or animation
- **Non-dismissible** — cannot be closed or hidden by user
- **Prominent styling** — yellow/amber colors for caution
- **Clear messaging** — explicitly states prototype-only nature

---

## Safe Wording Guidelines

### Allowed Terminology

- ✅ "Review Suggestion"
- ✅ "Suggested Draft Edit"
- ✅ "Preview Only"
- ✅ "Human Approval Required"
- ✅ "Apply to Draft — Disabled in Phase 3B"
- ✅ "Does not unlock Deploy"
- ✅ "Re-audit required before publish consideration"

### Forbidden Terminology

- ❌ "Auto-fix"
- ❌ "Fix Now"
- ❌ "Correct Automatically"
- ❌ "Resolve Gate"
- ❌ "Make Ready"
- ❌ "Verified Fix"
- ❌ "Safe to Deploy"
- ❌ "Source Added"
- ❌ "Provenance Verified"
- ❌ "Publish Ready"

---

## Side Effect Prevention

### Explicit Prohibitions

```typescript
// ❌ FORBIDDEN in Phase 3B:
// - fetch() calls
// - API route calls
// - Database operations
// - localStorage.setItem()
// - Clipboard API usage
// - Draft/vault state setters
// - Audit state mutations
// - Deploy gate modifications
// - Publish/save triggers

// ✅ ALLOWED in Phase 3B:
// - Local React state (useState)
// - Pure UI interactions
// - Console logging for debugging
// - Reading existing props/data
// - Modal open/close animations
```

### Implementation Safeguards

```typescript
// No mutation props accepted
interface RemediationConfirmModalProps {
  // ❌ onApply?: (suggestion: RemediationSuggestion) => void;
  // ❌ onSave?: () => void;
  // ❌ onPublish?: () => void;
  
  // ✅ Pure UI props only
  isOpen: boolean;
  onClose: () => void;
  suggestion: RemediationSuggestion | null;
}
```

---

## Accessibility Design

### Semantic Structure

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="fixed inset-0 z-50 flex items-center justify-center"
>
  <div className="fixed inset-0 bg-black/50" onClick={onClose} />
  
  <div className="relative bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
    <header className="flex items-center justify-between p-4 border-b border-white/10">
      <h2 id="modal-title" className="text-lg font-bold text-white">
        Review Suggestion
      </h2>
      <button
        onClick={onClose}
        className="p-1 text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-label="Close modal"
      >
        <X size={20} />
      </button>
    </header>
    
    <div id="modal-description" className="sr-only">
      Review remediation suggestion with side-by-side diff preview and confirmation checkboxes
    </div>
    
    {/* Modal content */}
  </div>
</div>
```

### Keyboard Support

```typescript
// ESC key support
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);

// Focus management
useEffect(() => {
  if (isOpen) {
    // Focus first interactive element when modal opens
    const firstButton = document.querySelector('[role="dialog"] button');
    if (firstButton instanceof HTMLElement) {
      firstButton.focus();
    }
  }
}, [isOpen]);
```

### Visual Accessibility

- **High contrast colors** — white text on dark backgrounds
- **Focus indicators** — visible focus rings on interactive elements
- **Readable text sizes** — minimum 12px for body text
- **No color-only meaning** — icons and text labels for all states
- **Screen reader support** — proper ARIA labels and descriptions

---

## Gate Preservation

### Deploy State Protection

```typescript
// ✅ These remain unchanged in Phase 3B:
// - isDeployBlocked logic
// - deployLockReasons array
// - globalAudit scoring
// - active-language audit requirements
// - transformedArticle requirements
// - Publish/Deploy button behavior
// - Deploy fail-closed posture

// Modal explicitly states no deploy impact
<p className="text-xs text-yellow-300/90">
  This does not unlock Deploy.
</p>
```

### Audit System Isolation

```typescript
// Phase 3B modal operates independently of:
// - Global audit scoring
// - Panda validation
// - Deploy gate logic
// - Publish readiness checks
// - Audit invalidation triggers

// No imports of audit mutation functions
// No calls to audit state setters
// No modification of audit results
```

---

## Validation Strategy

### Required Validation Commands

```bash
# Type checking
npm run type-check

# Remediation system verification
npx tsx scripts/verify-remediation-engine.ts
npx tsx scripts/verify-remediation-generator.ts
npx tsx scripts/verify-remediation-apply-protocol.ts

# Audit system verification
npx tsx scripts/verify-global-audit.ts
npx tsx scripts/verify-panda-intake.ts
```

### Manual Smoke Testing

**Test Cases:**
1. **Modal Opening** — Click "Review Suggestion" on eligible suggestion
2. **Warning Banner** — Verify non-dismissible warning is visible
3. **Side-by-Side Preview** — Verify original and suggested text display
4. **Checkbox Functionality** — Verify all three checkboxes work
5. **Apply Button State** — Verify button remains disabled/non-mutating
6. **Locked Categories** — Verify SOURCE_REVIEW, PROVENANCE_REVIEW, PARITY_REVIEW show no Review button
7. **Deploy State** — Verify deploy status unchanged after modal interaction
8. **Forbidden Wording** — Verify no auto-fix/publish-ready language appears

### Success Criteria

- ✅ Modal opens only for eligible suggestions
- ✅ Warning banner displays immediately and cannot be dismissed
- ✅ Side-by-side diff shows safely without fabrication
- ✅ All three confirmation checkboxes function correctly
- ✅ Apply button remains disabled/non-mutating
- ✅ Locked categories show appropriate messaging
- ✅ Deploy state remains unchanged
- ✅ No forbidden wording appears anywhere
- ✅ All validation scripts pass
- ✅ TypeScript compilation succeeds

---

## File Boundaries

### Files to Create

```
app/admin/warroom/components/RemediationConfirmModal.tsx
├── Main modal component
├── Warning banner
├── Side-by-side diff preview
├── Confirmation checkboxes
└── Disabled apply control
```

### Files to Modify Minimally

```
app/admin/warroom/components/RemediationPreviewPanel.tsx
├── Add modal state management
├── Add Review button for eligible suggestions
└── Integrate RemediationConfirmModal

app/admin/warroom/page.tsx (if needed)
└── Minimal prop wiring only
```

### Files NOT to Modify

- `lib/editorial/remediation-engine.ts`
- `lib/editorial/remediation-apply-types.ts` (import-only)
- `lib/editorial/remediation-types.ts`
- `lib/editorial/global-governance-audit.ts`
- `lib/editorial/panda-intake-validator.ts`
- `app/api/*` (no API routes)
- Publish/save routes
- Build artifacts

---

## Future Phases (Not Implemented)

### Phase 3C: Local Draft Apply
- Real Apply to Draft for RESIDUE_REMOVAL only
- Draft mutation with audit invalidation
- Rollback capability

### Phase 3D: Audit Invalidation Enforcement
- Automatic audit re-run after apply
- Deploy gate re-evaluation
- Audit state synchronization

### Phase 3E: Rollback & Ledger Persistence
- Apply event logging
- Rollback to previous state
- Audit trail persistence

**Phase 3B Scope:** UI prototype only — none of the above functionality is implemented.

---

## Implementation Notes

### Component Organization

```typescript
// RemediationConfirmModal.tsx structure
export default function RemediationConfirmModal(props) {
  // Local state management
  // Eligibility checking
  // Event handlers (UI-only)
  
  return (
    <Modal>
      <WarningBanner />
      <SideBySideDiff />
      <ConfirmationCheckboxes />
      <DisabledApplyControl />
    </Modal>
  );
}

// Sub-components as needed
function WarningBanner() { /* ... */ }
function SideBySideDiff() { /* ... */ }
function ConfirmationCheckboxes() { /* ... */ }
function DisabledApplyControl() { /* ... */ }
```

### Error Handling

```typescript
// Graceful degradation for missing data
if (!suggestion) {
  return null; // Modal not rendered
}

if (!suggestion.suggestedText) {
  // Show "No automated suggestion available"
}

if (!originalText) {
  // Show "Original text unavailable — apply disabled"
}
```

### Performance Considerations

- **Lazy loading** — Modal component only renders when `isOpen={true}`
- **Minimal re-renders** — Memoize expensive calculations
- **Local state only** — No server communication or persistence
- **Small bundle impact** — Pure UI component with minimal dependencies

---

This design document provides a comprehensive blueprint for implementing the Phase 3B confirmation modal prototype while maintaining strict UI-only constraints and fail-closed safety posture. The implementation will demonstrate future apply workflow capabilities without performing any actual mutations or side effects.