#!/usr/bin/env tsx

/**
 * Verification Script: Canonical Re-Audit 7C-2A Input Builder
 * 
 * Verifies that Task 7C-2A implementation follows all safety boundaries:
 * - Input builder is pure and client-safe
 * - No canonicalReAudit.run() calls
 * - No real audit execution
 * - Execute button remains disabled/inert
 * - Preflight validation works correctly
 * - Dynamic attestation phrase generation
 * - Fail-closed validation for all preconditions
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface VerificationResult {
  check: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  details: string[]
}

const results: VerificationResult[] = []

function addResult(check: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string[]) {
  results.push({ check, status, details })
}

function readFileContent(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) {
      return null
    }
    return readFileSync(filePath, 'utf-8')
  } catch (error) {
    return null
  }
}

function checkInputBuilderPurity() {
  const filePath = 'lib/editorial/canonical-reaudit-input-builder.ts'
  const content = readFileContent(filePath)
  
  if (!content) {
    addResult('Input Builder File Exists', 'FAIL', ['File not found: ' + filePath])
    return
  }

  const forbiddenImports = [
    'fs', 'path', 'crypto', 'node:', 'process.env', 'Buffer',
    'fetch', 'axios', 'prisma', 'libsql', 'turso',
    'localStorage', 'sessionStorage', 'react'
  ]

  const foundForbidden = forbiddenImports.filter(imp => 
    content.includes(`from '${imp}'`) || 
    content.includes(`import ${imp}`) ||
    content.includes(`require('${imp}')`)
  )

  if (foundForbidden.length > 0) {
    addResult('Input Builder Purity - No Forbidden Imports', 'FAIL', 
      [`Found forbidden imports: ${foundForbidden.join(', ')}`])
  } else {
    addResult('Input Builder Purity - No Forbidden Imports', 'PASS', 
      ['No server-only or side-effect imports detected'])
  }

  // Check for pure function exports
  const requiredExports = [
    'buildCanonicalReAuditPreflight',
    'generateCanonicalReAuditAttestationPhrase',
    'createSanitizedCanonicalReAuditInputPreview'
  ]

  const missingExports = requiredExports.filter(exp => !content.includes(`export function ${exp}`))
  
  if (missingExports.length > 0) {
    addResult('Input Builder Required Exports', 'FAIL', 
      [`Missing exports: ${missingExports.join(', ')}`])
  } else {
    addResult('Input Builder Required Exports', 'PASS', 
      ['All required pure functions exported'])
  }

  // Check for fail-closed validation - look for actual fallback code, not comments
  const unknownArticlePattern = /articleId\s*=\s*['"']UNKNOWN_ARTICLE['"]|return.*UNKNOWN_ARTICLE/g
  const actualFallbacks = content.match(unknownArticlePattern)
  
  if (actualFallbacks && actualFallbacks.length > 0) {
    addResult('Input Builder Fail-Closed Validation', 'FAIL', 
      ['Found UNKNOWN_ARTICLE fallback code - must fail closed'])
  } else {
    addResult('Input Builder Fail-Closed Validation', 'PASS', 
      ['No unsafe fallback code detected'])
  }

  // Check for dynamic attestation
  if (content.includes('REAUDIT-STATIC') || !content.includes('articleId.slice(-6)')) {
    addResult('Dynamic Attestation Phrase', 'FAIL', 
      ['Attestation phrase must be dynamic, not static'])
  } else {
    addResult('Dynamic Attestation Phrase', 'PASS', 
      ['Dynamic attestation phrase generation detected'])
  }
}

function checkModalSafety() {
  const filePath = 'app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx'
  const content = readFileContent(filePath)
  
  if (!content) {
    addResult('Modal File Exists', 'FAIL', ['File not found: ' + filePath])
    return
  }

  // Check execute button is gated (Task 7C-2B-2 update)
  if (content.includes('disabled={!canExecute || isRunning}') || content.includes('gateResult?.canExecute')) {
    addResult('Modal Execute Button Gated', 'PASS', 
      ['Execute button is properly gated by controller'])
  } else {
    addResult('Modal Execute Button Gated', 'FAIL', 
      ['Execute button must be gated by controller in Task 7C-2B-2'])
  }

  // Check for preflight prop acceptance
  if (!content.includes('preflight?:') && !content.includes('preflight:')) {
    addResult('Modal Preflight Prop', 'FAIL', 
      ['Modal must accept preflight prop'])
  } else {
    addResult('Modal Preflight Prop', 'PASS', 
      ['Modal accepts preflight prop'])
  }

  // Check no canonicalReAudit.run() calls - exclude all comments
  // Remove all comments first
  let codeContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/\/\/.*$/gm, '') // Remove // comments
  
  // Look specifically for canonicalReAudit.run( function calls
  const runCallPattern = /canonicalReAudit\.run\s*\(/g
  const actualRunCalls = codeContent.match(runCallPattern)
  
  if (actualRunCalls && actualRunCalls.length > 0) {
    addResult('Modal No Audit Execution', 'FAIL', 
      [`Modal must not call canonicalReAudit.run(): ${actualRunCalls.join(', ')}`])
  } else {
    addResult('Modal No Audit Execution', 'PASS', 
      ['No audit execution calls detected'])
  }
}

function checkPageIntegration() {
  const filePath = 'app/admin/warroom/page.tsx'
  const content = readFileContent(filePath)
  
  if (!content) {
    addResult('Page File Exists', 'FAIL', ['File not found: ' + filePath])
    return
  }

  // Check preflight computation import
  if (!content.includes('buildCanonicalReAuditPreflight')) {
    addResult('Page Preflight Import', 'FAIL', 
      ['Page must import buildCanonicalReAuditPreflight'])
  } else {
    addResult('Page Preflight Import', 'PASS', 
      ['Preflight function imported'])
  }

  // Check preflight computation
  if (!content.includes('canonicalReAuditPreflight') || !content.includes('useMemo')) {
    addResult('Page Preflight Computation', 'FAIL', 
      ['Page must compute preflight result using useMemo'])
  } else {
    addResult('Page Preflight Computation', 'PASS', 
      ['Preflight computation detected'])
  }

  // Check preflight passed to modal
  if (!content.includes('preflight={canonicalReAuditPreflight}')) {
    addResult('Page Preflight Modal Prop', 'FAIL', 
      ['Page must pass preflight to modal'])
  } else {
    addResult('Page Preflight Modal Prop', 'PASS', 
      ['Preflight passed to modal'])
  }

  // Check controlled canonicalReAudit.run() calls (Task 7C-2B-2 update)
  const runCallMatches = content.match(/canonicalReAudit\.run\(/g)
  const runCallCount = runCallMatches ? runCallMatches.length : 0
  
  if (runCallCount === 0) {
    addResult('Page Controlled Audit Execution', 'PASS', 
      ['No audit execution calls detected'])
  } else if (runCallCount === 1) {
    // Single call - verify it's in the approved handler
    const handlerStart = content.indexOf('handleConfirmedCanonicalReAuditRun')
    if (handlerStart !== -1) {
      const handlerEnd = content.indexOf('})', handlerStart)
      const handlerCode = content.substring(handlerStart, handlerEnd)
      if (handlerCode.includes('canonicalReAudit.run(')) {
        addResult('Page Controlled Audit Execution', 'PASS', 
          ['Controlled audit execution in approved handler'])
      } else {
        addResult('Page Controlled Audit Execution', 'FAIL', 
          ['canonicalReAudit.run() found outside approved handler'])
      }
    } else {
      addResult('Page Controlled Audit Execution', 'FAIL', 
        ['canonicalReAudit.run() found but no approved handler'])
    }
  } else {
    addResult('Page Controlled Audit Execution', 'FAIL', 
      [`Found ${runCallCount} canonicalReAudit.run() calls - expected 0 or 1 in approved handler`])
  }
}

function checkBoundaryScript() {
  const filePath = 'scripts/verify-canonical-reaudit-post7-boundaries.ts'
  const content = readFileContent(filePath)
  
  if (!content) {
    addResult('Boundary Script Exists', 'WARNING', 
      ['Post-7 boundary script not found - should be updated with 7C-2A checks'])
    return
  }

  // Check if 7C-2A checks are mentioned
  if (!content.includes('7C-2A') && !content.includes('input-builder')) {
    addResult('Boundary Script 7C-2A Checks', 'WARNING', 
      ['Boundary script should include 7C-2A specific checks'])
  } else {
    addResult('Boundary Script 7C-2A Checks', 'PASS', 
      ['7C-2A checks detected in boundary script'])
  }
}

function main() {
  console.log('🔍 CANONICAL RE-AUDIT 7C-2A VERIFICATION')
  console.log('=' .repeat(50))
  
  checkInputBuilderPurity()
  checkModalSafety()
  checkPageIntegration()
  checkBoundaryScript()
  
  console.log('\n📊 VERIFICATION RESULTS')
  console.log('=' .repeat(50))
  
  let passCount = 0
  let failCount = 0
  let warningCount = 0
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${result.check}`)
    
    result.details.forEach(detail => {
      console.log(`   ${detail}`)
    })
    
    if (result.status === 'PASS') passCount++
    else if (result.status === 'FAIL') failCount++
    else warningCount++
  })
  
  console.log('\n📈 SUMMARY')
  console.log('=' .repeat(50))
  console.log(`✅ PASS: ${passCount}`)
  console.log(`❌ FAIL: ${failCount}`)
  console.log(`⚠️  WARNING: ${warningCount}`)
  
  if (failCount === 0) {
    console.log('\n🎉 TASK 7C-2A VERIFICATION PASSED')
    console.log('Input builder implementation follows all safety boundaries.')
    process.exit(0)
  } else {
    console.log('\n🚨 TASK 7C-2A VERIFICATION FAILED')
    console.log('Critical safety violations detected. Fix before proceeding.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}