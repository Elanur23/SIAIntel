/**
 * Phase 3B FORMAT_REPAIR Smoke Verification Script
 * 
 * Verifies that string findings from Global Governance Audit
 * are correctly normalized and classified as FORMAT_REPAIR suggestions.
 * 
 * SAFETY: Read-only verification - no mutations, no API calls, no side effects.
 */

import { generateRemediationPlan } from '../lib/editorial/remediation-engine'
import { RemediationCategory, RemediationSafetyLevel } from '../lib/editorial/remediation-types'

// Mock globalAudit.languages structure with string findings
const mockGlobalAuditLanguages = {
  en: {
    score: 70,
    status: 'NEEDS_REVIEW',
    wordCount: 150,
    residueDetected: false,
    criticalIssues: ['Malformed markdown prefixes detected'], // STRING FINDING
    warnings: [],
    residueFindings: [],
    seoFindings: [],
    provenanceFindings: [],
    parityFindings: []
  },
  tr: {
    score: 70,
    status: 'NEEDS_REVIEW',
    wordCount: 150,
    residueDetected: false,
    criticalIssues: ['Malformed markdown prefixes detected'], // STRING FINDING
    warnings: [],
    residueFindings: [],
    seoFindings: [],
    provenanceFindings: [],
    parityFindings: []
  }
}

console.log('='.repeat(80))
console.log('PHASE 3B FORMAT_REPAIR SMOKE VERIFICATION')
console.log('='.repeat(80))
console.log()

// Generate remediation plan
console.log('📋 Generating remediation plan from mock audit data...')
const plan = generateRemediationPlan({
  articleId: 'test-format-repair-001',
  packageId: 'phase3b-smoke-test',
  globalAudit: mockGlobalAuditLanguages
})

console.log()
console.log('RESULTS:')
console.log('-'.repeat(80))
console.log(`Total Suggestions: ${plan.totalIssues}`)
console.log(`Safe Suggestions: ${plan.safeSuggestionCount}`)
console.log(`Requires Approval: ${plan.requiresApprovalCount}`)
console.log(`Human Only: ${plan.humanOnlyCount}`)
console.log(`Critical: ${plan.criticalCount}`)
console.log()

// Verification checks
let passed = 0
let failed = 0

function check(name: string, condition: boolean, expected: string, actual: string) {
  if (condition) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}`)
    console.log(`   Expected: ${expected}`)
    console.log(`   Actual: ${actual}`)
    failed++
  }
}

// Check 1: At least one suggestion generated
check(
  'Total suggestions >= 1',
  plan.totalIssues >= 1,
  '>= 1',
  String(plan.totalIssues)
)

if (plan.suggestions.length > 0) {
  const firstSuggestion = plan.suggestions[0]
  
  // Check 2: First suggestion is FORMAT_REPAIR
  check(
    'First suggestion category is FORMAT_REPAIR',
    firstSuggestion.category === RemediationCategory.FORMAT_REPAIR,
    'FORMAT_REPAIR',
    firstSuggestion.category
  )
  
  // Check 3: Suggestion requires approval
  check(
    'Suggestion requires human approval',
    firstSuggestion.requiresHumanApproval === true,
    'true',
    String(firstSuggestion.requiresHumanApproval)
  )
  
  // Check 4: Suggestion has suggestedText
  check(
    'Suggestion has suggestedText',
    !!firstSuggestion.suggestedText && firstSuggestion.suggestedText.trim().length > 0,
    'non-empty string',
    firstSuggestion.suggestedText || 'null'
  )
  
  // Check 5: Suggestion is not human-only fallback
  check(
    'Suggestion is not HUMAN_ONLY safety level',
    firstSuggestion.safetyLevel !== RemediationSafetyLevel.HUMAN_ONLY,
    'not HUMAN_ONLY',
    firstSuggestion.safetyLevel
  )
  
  // Check 6: Safety level is REQUIRES_HUMAN_APPROVAL
  check(
    'Safety level is REQUIRES_HUMAN_APPROVAL',
    firstSuggestion.safetyLevel === RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    'REQUIRES_HUMAN_APPROVAL',
    firstSuggestion.safetyLevel
  )
  
  // Check 7: Issue description is preserved
  check(
    'Issue description preserved from string finding',
    firstSuggestion.issueDescription === 'Malformed markdown prefixes detected',
    'Malformed markdown prefixes detected',
    firstSuggestion.issueDescription
  )
  
  // Check 8: No apply/mutation methods exist
  check(
    'No apply method on suggestion object',
    !('apply' in firstSuggestion) && !('applyToDraft' in firstSuggestion),
    'no apply methods',
    'verified'
  )
  
  // Check 9: Fail-closed safety flags
  check(
    'cannotAutoPublish is true',
    firstSuggestion.cannotAutoPublish === true,
    'true',
    String(firstSuggestion.cannotAutoPublish)
  )
  
  check(
    'cannotAutoDeploy is true',
    firstSuggestion.cannotAutoDeploy === true,
    'true',
    String(firstSuggestion.cannotAutoDeploy)
  )
  
  // Check 10: Content integrity flags
  check(
    'preservesFacts is true (FORMAT_REPAIR)',
    firstSuggestion.preservesFacts === true,
    'true',
    String(firstSuggestion.preservesFacts)
  )
  
  console.log()
  console.log('SUGGESTION DETAILS:')
  console.log('-'.repeat(80))
  console.log(`ID: ${firstSuggestion.id}`)
  console.log(`Category: ${firstSuggestion.category}`)
  console.log(`Severity: ${firstSuggestion.severity}`)
  console.log(`Safety Level: ${firstSuggestion.safetyLevel}`)
  console.log(`Issue Type: ${firstSuggestion.issueType}`)
  console.log(`Issue Description: ${firstSuggestion.issueDescription}`)
  console.log(`Suggested Text: ${firstSuggestion.suggestedText}`)
  console.log(`Rationale: ${firstSuggestion.rationale}`)
  console.log(`Requires Approval: ${firstSuggestion.requiresHumanApproval}`)
  console.log(`Can Apply to Draft: ${firstSuggestion.canApplyToDraft}`)
  console.log(`Cannot Auto Publish: ${firstSuggestion.cannotAutoPublish}`)
  console.log(`Cannot Auto Deploy: ${firstSuggestion.cannotAutoDeploy}`)
}

console.log()
console.log('='.repeat(80))
console.log(`VERIFICATION RESULT: ${passed} passed, ${failed} failed`)
console.log('='.repeat(80))

if (failed > 0) {
  console.error('\n❌ VERIFICATION FAILED')
  process.exit(1)
} else {
  console.log('\n✅ VERIFICATION PASSED')
  process.exit(0)
}
