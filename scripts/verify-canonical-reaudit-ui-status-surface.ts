#!/usr/bin/env tsx

/**
 * Verification Script: Canonical Re-Audit UI Status Surface
 * 
 * Validates that CanonicalReAuditPanel.tsx meets all Task 7A requirements:
 * - Component exists and exports correctly
 * - Props are read-only (no callbacks)
 * - No forbidden wording
 * - PASSED_PENDING_ACCEPTANCE uses amber (not green)
 * - Mandatory warnings present
 * - No internal field exposure
 * - No persistence/network/backend calls
 */

import * as fs from 'fs'
import * as path from 'path'

const COMPONENT_PATH = 'app/admin/warroom/components/CanonicalReAuditPanel.tsx'

let passCount = 0
let failCount = 0

function pass(check: string) {
  console.log(`✅ PASS: ${check}`)
  passCount++
}

function fail(check: string, reason: string) {
  console.error(`❌ FAIL: ${check}`)
  console.error(`   Reason: ${reason}`)
  failCount++
}

function checkFileExists(): boolean {
  if (!fs.existsSync(COMPONENT_PATH)) {
    fail('Component file exists', `File not found: ${COMPONENT_PATH}`)
    return false
  }
  pass('Component file exists')
  return true
}

function checkComponentExport(content: string): void {
  if (!content.includes('export default function CanonicalReAuditPanel')) {
    fail('Component exports CanonicalReAuditPanel', 'Default export not found')
    return
  }
  pass('Component exports CanonicalReAuditPanel')
}

function checkPropsInterface(content: string): void {
  const propsMatch = content.match(/interface\s+CanonicalReAuditPanelProps\s*{([^}]+)}/s)
  if (!propsMatch) {
    fail('Props interface exists', 'CanonicalReAuditPanelProps interface not found')
    return
  }
  
  const propsContent = propsMatch[1]
  
  // Check for required read-only props
  const requiredProps = [
    'visible',
    'articleId',
    'status',
    'result',
    'error',
    'isRunning',
    'snapshotIdentity'
  ]
  
  for (const prop of requiredProps) {
    if (!propsContent.includes(prop)) {
      fail(`Props interface has ${prop}`, `Property ${prop} not found`)
      return
    }
  }
  pass('Props interface has all required read-only fields')
}

function checkNoCallbackProps(content: string): void {
  const forbiddenCallbacks = [
    'onStatusChange',
    'onResult',
    'onRun',
    'onReset',
    'onAccept',
    'onPromote',
    'onDeploy',
    'onSave',
    'onChange',
    'onClick',
    'onTrigger'
  ]
  
  const propsMatch = content.match(/interface\s+CanonicalReAuditPanelProps\s*{([^}]+)}/s)
  if (!propsMatch) {
    fail('No callback props', 'Props interface not found')
    return
  }
  
  const propsContent = propsMatch[1]
  
  for (const callback of forbiddenCallbacks) {
    if (propsContent.includes(callback)) {
      fail('No callback props', `Forbidden callback found: ${callback}`)
      return
    }
  }
  pass('No callback props in interface')
}

function checkNoForbiddenWording(content: string): void {
  const forbiddenTerms = [
    { term: 'Deploy Ready', context: null },
    { term: 'Ready to Publish', context: null },
    { term: 'Approved', context: null },
    { term: 'Accepted', context: null },
    { term: 'Unlocked', context: null },
    { term: 'Saved', context: 'Not Saved' }, // Allow "Not Saved to Vault"
    { term: 'Finalized', context: null },
    { term: 'Global Audit Updated', context: null },
    { term: 'Live', context: null }
  ]
  
  for (const { term, context } of forbiddenTerms) {
    if (content.includes(term)) {
      // If context is specified, check if the term appears in that context
      if (context && content.includes(context)) {
        continue // Allow this usage
      }
      fail('No forbidden wording', `Forbidden term found: "${term}"`)
      return
    }
  }
  pass('No forbidden wording in component')
}

function checkAmberColorForPassed(content: string): void {
  // Check for PASSED_PENDING_ACCEPTANCE status handling
  const passedMatch = content.match(/case\s+CanonicalReAuditStatus\.PASSED_PENDING_ACCEPTANCE[\s\S]*?colorClass:\s*'([^']+)'/m)
  
  if (!passedMatch) {
    fail('PASSED_PENDING_ACCEPTANCE color', 'Status case not found')
    return
  }
  
  const colorClass = passedMatch[1]
  
  // Must use amber, NOT emerald/green
  if (colorClass.includes('emerald') || colorClass.includes('green')) {
    fail('PASSED_PENDING_ACCEPTANCE uses amber (not green)', `Found forbidden color: ${colorClass}`)
    return
  }
  
  if (!colorClass.includes('amber') && !colorClass.includes('yellow')) {
    fail('PASSED_PENDING_ACCEPTANCE uses amber (not green)', `Expected amber/yellow, found: ${colorClass}`)
    return
  }
  
  pass('PASSED_PENDING_ACCEPTANCE uses amber color (not green)')
}

function checkMandatoryWarnings(content: string): void {
  const requiredWarnings = [
    'In-memory only',
    'Deploy remains locked',
    'Global audit has not been updated',
    'Acceptance is a later phase'
  ]
  
  for (const warning of requiredWarnings) {
    if (!content.includes(warning)) {
      fail('Mandatory warnings present', `Missing warning: "${warning}"`)
      return
    }
  }
  pass('All 4 mandatory warnings present for PASSED_PENDING_ACCEPTANCE')
}

function checkMandatoryFooters(content: string): void {
  const requiredFooters = [
    'In-Memory Only — Not Saved to Vault',
    'Deploy Remains Locked',
    'Global Audit Not Updated — Acceptance Required'
  ]
  
  for (const footer of requiredFooters) {
    if (!content.includes(footer)) {
      fail('Mandatory footers present', `Missing footer: "${footer}"`)
      return
    }
  }
  pass('All 3 mandatory footers present')
}

function checkNoInternalFieldExposure(content: string): void {
  const forbiddenFields = [
    'contentHash',
    'ledgerSequence',
    'promotionId'
  ]
  
  // Check if these fields are displayed (not just imported from types)
  const displayRegex = /{[^}]*\.(contentHash|ledgerSequence|promotionId)[^}]*}/g
  const matches = content.match(displayRegex)
  
  if (matches) {
    fail('No internal field exposure', `Internal fields exposed: ${matches.join(', ')}`)
    return
  }
  pass('No internal fields (contentHash, ledgerSequence, promotionId) exposed')
}

function checkNoPersistenceOrNetworkCalls(content: string): void {
  const forbiddenCalls = [
    'localStorage',
    'sessionStorage',
    'fetch(',
    'axios',
    'setGlobalAudit',
    'setVault'
  ]
  
  for (const call of forbiddenCalls) {
    if (content.includes(call)) {
      fail('No persistence/network calls', `Forbidden call found: ${call}`)
      return
    }
  }
  pass('No persistence/network/backend calls in component')
}

function checkUseClientDirective(content: string): void {
  if (!content.startsWith("'use client'")) {
    fail("Component has 'use client' directive", 'Directive not found at top of file')
    return
  }
  pass("Component has 'use client' directive")
}

// Main execution
console.log('🔍 Verifying Canonical Re-Audit UI Status Surface...\n')

if (!checkFileExists()) {
  console.error('\n❌ VERIFICATION FAILED: Component file does not exist')
  process.exit(1)
}

const content = fs.readFileSync(COMPONENT_PATH, 'utf-8')

checkUseClientDirective(content)
checkComponentExport(content)
checkPropsInterface(content)
checkNoCallbackProps(content)
checkNoForbiddenWording(content)
checkAmberColorForPassed(content)
checkMandatoryWarnings(content)
checkMandatoryFooters(content)
checkNoInternalFieldExposure(content)
checkNoPersistenceOrNetworkCalls(content)

console.log(`\n${'='.repeat(60)}`)
console.log(`✅ PASSED: ${passCount}`)
console.log(`❌ FAILED: ${failCount}`)
console.log('='.repeat(60))

if (failCount > 0) {
  console.error('\n❌ VERIFICATION FAILED')
  process.exit(1)
}

console.log('\n✅ VERIFICATION PASSED: All checks successful')
console.log(`[VERIFY] canonical-reaudit-ui-status-surface: ${passCount} checks passed`)
process.exit(0)
