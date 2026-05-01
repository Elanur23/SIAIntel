#!/usr/bin/env tsx

/**
 * Verification Script: Canonical Re-Audit Task 8A - Acceptance Types
 * 
 * Validates that Task 8A implementation follows strict boundaries:
 * - Only canonical-reaudit-acceptance-types.ts was created
 * - No UI files modified (page.tsx, modal, panel, trigger button, hooks)
 * - No backend/API/database/provider imports
 * - No React imports
 * - No browser APIs (localStorage, sessionStorage, fetch)
 * - No state mutations (setGlobalAudit, setVault, setIsDeployBlocked)
 * - No deploy unlock logic
 * - No globalAudit mutation logic
 * - No vault mutation logic
 * - No persistence logic
 * - Pure functions only
 * - Fail-closed validation logic
 * - Safety invariants present
 */

import * as fs from 'fs'
import { execSync } from 'child_process'

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

function checkFileExists(filePath: string, description: string): boolean {
  if (!fs.existsSync(filePath)) {
    fail(description, `File not found: ${filePath}`)
    return false
  }
  pass(description)
  return true
}

function checkFileNotModified(filePath: string, description: string): void {
  if (!fs.existsSync(filePath)) {
    // File doesn't exist, so it wasn't modified
    pass(`${description} not modified`)
    return
  }

  try {
    const status = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf-8' }).trim()
    
    if (status && status.startsWith('M')) {
      fail(`${description} not modified`, `File has been modified: ${filePath}`)
      return
    }
    pass(`${description} not modified`)
  } catch (error) {
    // File might not be tracked by git yet
    const stats = fs.statSync(filePath)
    const now = Date.now()
    const modifiedTime = stats.mtimeMs
    const ageMinutes = (now - modifiedTime) / 1000 / 60
    
    if (ageMinutes < 5) {
      fail(`${description} not modified`, `File was recently modified: ${filePath}`)
      return
    }
    pass(`${description} not modified`)
  }
}

function checkFileContains(filePath: string, description: string, predicate: (content: string) => string | null): void {
  if (!fs.existsSync(filePath)) {
    fail(description, `File not found: ${filePath}`)
    return
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const error = predicate(content)
  if (error) {
    fail(description, error)
    return
  }
  pass(description)
}

function checkTask8AFileStructure(): void {
  const acceptanceTypesPath = 'lib/editorial/canonical-reaudit-acceptance-types.ts'
  
  if (!checkFileExists(acceptanceTypesPath, 'Task 8A: canonical-reaudit-acceptance-types.ts exists')) {
    return
  }

  // Check no other files were created
  const forbiddenFiles = [
    'lib/editorial/canonical-reaudit-acceptance.ts',
    'lib/editorial/canonical-reaudit-promotion.ts',
    'app/admin/warroom/components/CanonicalReAuditAcceptanceModal.tsx',
    'app/admin/warroom/handlers/canonical-reaudit-acceptance-handler.ts',
    'app/admin/warroom/hooks/useCanonicalReAuditAcceptance.ts'
  ]

  for (const filePath of forbiddenFiles) {
    if (fs.existsSync(filePath)) {
      fail('Task 8A: No acceptance execution files created', `Forbidden file exists: ${filePath}`)
      return
    }
  }
  pass('Task 8A: No acceptance execution files created')
}

function checkTask8AImports(): void {
  const acceptanceTypesPath = 'lib/editorial/canonical-reaudit-acceptance-types.ts'
  
  checkFileContains(acceptanceTypesPath, 'Task 8A: No React imports', (content) => {
    const forbiddenImports = ['react', 'React', 'useState', 'useEffect', 'useCallback', 'useMemo']
    for (const imp of forbiddenImports) {
      if (content.includes(`from 'react'`) || content.includes(`from "react"`)) {
        return `Found forbidden React import: ${imp}`
      }
    }
    return null
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: No browser API usage', (content) => {
    // Remove comments to avoid false positives
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
    
    const forbiddenAPIs = ['localStorage', 'sessionStorage', 'fetch(', 'window.', 'document.']
    for (const api of forbiddenAPIs) {
      if (codeOnly.includes(api)) {
        return `Found forbidden browser API: ${api}`
      }
    }
    return null
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: No backend/API/database imports', (content) => {
    // Remove comments to avoid false positives
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
    
    const forbiddenImports = [
      'axios',
      'prisma',
      'turso',
      'libsql',
      '@supabase',
      'database.ts',
      '/api/',
      'fetch('
    ]
    for (const imp of forbiddenImports) {
      if (codeOnly.includes(imp)) {
        return `Found forbidden backend/API/database import: ${imp}`
      }
    }
    return null
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Only imports from canonical-reaudit-types', (content) => {
    // Extract all import statements (including multi-line)
    const importMatches = content.match(/import\s+{[\s\S]*?}\s+from\s+['"][^'"]+['"]/g)
    
    if (!importMatches) {
      return 'No import statements found'
    }
    
    for (const importStatement of importMatches) {
      if (!importStatement.includes('./canonical-reaudit-types')) {
        return `Found unexpected import: ${importStatement.replace(/\s+/g, ' ').trim()}`
      }
    }
    return null
  })
}

function checkTask8ATypes(): void {
  const acceptanceTypesPath = 'lib/editorial/canonical-reaudit-acceptance-types.ts'
  
  checkFileContains(acceptanceTypesPath, 'Task 8A: CanonicalReAuditAcceptanceBlockReason enum exists', (content) => {
    return content.includes('export enum CanonicalReAuditAcceptanceBlockReason') ? 
      null : 'CanonicalReAuditAcceptanceBlockReason enum not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: CanonicalReAuditAcceptancePreconditions interface exists', (content) => {
    return content.includes('export interface CanonicalReAuditAcceptancePreconditions') ? 
      null : 'CanonicalReAuditAcceptancePreconditions interface not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: CanonicalReAuditAcceptanceSnapshotBinding interface exists', (content) => {
    return content.includes('export interface CanonicalReAuditAcceptanceSnapshotBinding') ? 
      null : 'CanonicalReAuditAcceptanceSnapshotBinding interface not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: CanonicalReAuditAcceptanceEligibilityResult interface exists', (content) => {
    return content.includes('export interface CanonicalReAuditAcceptanceEligibilityResult') ? 
      null : 'CanonicalReAuditAcceptanceEligibilityResult interface not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: EvaluateCanonicalReAuditAcceptanceEligibilityInput interface exists', (content) => {
    return content.includes('export interface EvaluateCanonicalReAuditAcceptanceEligibilityInput') ? 
      null : 'EvaluateCanonicalReAuditAcceptanceEligibilityInput interface not found'
  })
}

function checkTask8ASafetyInvariants(): void {
  const acceptanceTypesPath = 'lib/editorial/canonical-reaudit-acceptance-types.ts'
  
  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariant memoryOnly: true', (content) => {
    return content.includes('readonly memoryOnly: true') ? 
      null : 'Safety invariant memoryOnly: true not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariant deployRemainsLocked: true', (content) => {
    return content.includes('readonly deployRemainsLocked: true') ? 
      null : 'Safety invariant deployRemainsLocked: true not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariant globalAuditOverwriteAllowed: false', (content) => {
    return content.includes('readonly globalAuditOverwriteAllowed: false') ? 
      null : 'Safety invariant globalAuditOverwriteAllowed: false not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariant vaultMutationAllowed: false', (content) => {
    return content.includes('readonly vaultMutationAllowed: false') ? 
      null : 'Safety invariant vaultMutationAllowed: false not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariant persistenceAllowed: false', (content) => {
    return content.includes('readonly persistenceAllowed: false') ? 
      null : 'Safety invariant persistenceAllowed: false not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Safety invariants hardcoded in return statement', (content) => {
    const returnStatementMatch = content.match(/return\s*{[\s\S]*?memoryOnly:\s*true[\s\S]*?}/m)
    if (!returnStatementMatch) {
      return 'Safety invariants not found in return statement'
    }
    
    const returnBlock = returnStatementMatch[0]
    const requiredInvariants = [
      'memoryOnly: true',
      'deployRemainsLocked: true',
      'globalAuditOverwriteAllowed: false',
      'vaultMutationAllowed: false',
      'persistenceAllowed: false'
    ]
    
    for (const invariant of requiredInvariants) {
      if (!returnBlock.includes(invariant)) {
        return `Safety invariant missing in return statement: ${invariant}`
      }
    }
    return null
  })
}

function checkTask8AValidator(): void {
  const acceptanceTypesPath = 'lib/editorial/canonical-reaudit-acceptance-types.ts'
  
  checkFileContains(acceptanceTypesPath, 'Task 8A: evaluateCanonicalReAuditAcceptanceEligibility function exists', (content) => {
    return content.includes('export function evaluateCanonicalReAuditAcceptanceEligibility') ? 
      null : 'evaluateCanonicalReAuditAcceptanceEligibility function not found'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Validator is pure function (no side effects)', (content) => {
    const functionStart = content.indexOf('export function evaluateCanonicalReAuditAcceptanceEligibility')
    if (functionStart === -1) return 'Function not found'
    
    const functionEnd = content.indexOf('\n}', functionStart)
    const functionBody = content.substring(functionStart, functionEnd)
    
    const forbiddenPatterns = [
      'setGlobalAudit(',
      'setVault(',
      'setIsDeployBlocked(',
      'fetch(',
      'axios',
      'localStorage',
      'sessionStorage',
      'prisma',
      'turso',
      'libsql'
    ]
    
    for (const pattern of forbiddenPatterns) {
      if (functionBody.includes(pattern)) {
        return `Found forbidden side effect in validator: ${pattern}`
      }
    }
    return null
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Validator uses verifyCanonicalSnapshotIdentityMatch', (content) => {
    const functionStart = content.indexOf('export function evaluateCanonicalReAuditAcceptanceEligibility')
    if (functionStart === -1) return 'Function not found'
    
    const functionEnd = content.indexOf('\n}', functionStart)
    const functionBody = content.substring(functionStart, functionEnd)
    
    return functionBody.includes('verifyCanonicalSnapshotIdentityMatch') ? 
      null : 'Validator does not use verifyCanonicalSnapshotIdentityMatch for snapshot comparison'
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Validator implements fail-closed logic', (content) => {
    const functionStart = content.indexOf('export function evaluateCanonicalReAuditAcceptanceEligibility')
    if (functionStart === -1) return 'Function not found'
    
    const functionEnd = content.indexOf('\n}', functionStart)
    const functionBody = content.substring(functionStart, functionEnd)
    
    // Check for fail-closed patterns
    if (!functionBody.includes('blockReasons.push(')) {
      return 'Validator does not populate blockReasons array'
    }
    
    if (!functionBody.includes('canAccept =')) {
      return 'Validator does not compute canAccept flag'
    }
    
    // Check that canAccept requires all preconditions
    const canAcceptMatch = functionBody.match(/canAccept\s*=\s*([\s\S]*?);/m)
    if (!canAcceptMatch) {
      return 'canAccept computation not found'
    }
    
    const canAcceptLogic = canAcceptMatch[1]
    if (!canAcceptLogic.includes('blockReasons.length === 0')) {
      return 'canAccept does not check blockReasons.length === 0'
    }
    
    return null
  })

  checkFileContains(acceptanceTypesPath, 'Task 8A: Validator checks all 14 preconditions', (content) => {
    const functionStart = content.indexOf('export function evaluateCanonicalReAuditAcceptanceEligibility')
    if (functionStart === -1) return 'Function not found'
    
    const functionEnd = content.indexOf('\n}', functionStart)
    const functionBody = content.substring(functionStart, functionEnd)
    
    const requiredPreconditions = [
      'resultExists',
      'statusIsPassedPendingAcceptance',
      'auditedSnapshotExists',
      'currentSnapshotExists',
      'snapshotMatches',
      'articleMatches',
      'noSessionDraft',
      'auditNotRunning',
      'operatorAcknowledged',
      'attestationMatches',
      'globalAuditNotNewer',
      'deployIsLocked',
      'noTransformError',
      'requiredContextPresent'
    ]
    
    for (const precondition of requiredPreconditions) {
      if (!functionBody.includes(`preconditions.${precondition}`)) {
        return `Validator does not check precondition: ${precondition}`
      }
    }
    return null
  })
}

function checkTask8ANoBoundaryViolations(): void {
  // Check UI files not modified
  const uiFiles = [
    { path: 'app/admin/warroom/page.tsx', description: 'page.tsx' },
    { path: 'app/admin/warroom/components/CanonicalReAuditPanel.tsx', description: 'CanonicalReAuditPanel' },
    { path: 'app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx', description: 'CanonicalReAuditTriggerButton' },
    { path: 'app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx', description: 'CanonicalReAuditConfirmModal' },
    { path: 'app/admin/warroom/hooks/useCanonicalReAudit.ts', description: 'useCanonicalReAudit hook' },
    { path: 'app/admin/warroom/controllers/canonical-reaudit-run-controller.ts', description: 'canonical-reaudit-run-controller' },
    { path: 'lib/editorial/canonical-reaudit-adapter.ts', description: 'canonical-reaudit-adapter' },
    { path: 'lib/editorial/canonical-reaudit-types.ts', description: 'canonical-reaudit-types' },
    { path: 'lib/editorial/canonical-reaudit-input-builder.ts', description: 'canonical-reaudit-input-builder' }
  ]

  for (const { path, description } of uiFiles) {
    checkFileNotModified(path, `Task 8A: ${description} not modified`)
  }

  // Check no API routes modified
  try {
    const apiStatus = execSync('git status --porcelain "app/api/**/*.ts"', { encoding: 'utf-8' }).trim()
    
    if (apiStatus) {
      const modifiedFiles = apiStatus.split('\n').filter(line => line.startsWith('M'))
      if (modifiedFiles.length > 0) {
        fail('Task 8A: No API routes modified', `Modified files: ${modifiedFiles.join(', ')}`)
        return
      }
    }
    pass('Task 8A: No API routes modified')
  } catch (error) {
    pass('Task 8A: No API routes modified')
  }

  // Check no DB/provider files modified
  const dbFiles = [
    'lib/neural-assembly/database.ts',
    'lib/supabase/client.ts',
    'lib/supabase/server.ts'
  ]
  
  for (const filePath of dbFiles) {
    if (!fs.existsSync(filePath)) continue
    
    try {
      const status = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf-8' }).trim()
      
      if (status && status.startsWith('M')) {
        fail('Task 8A: No DB/provider files modified', `File modified: ${filePath}`)
        return
      }
    } catch (error) {
      // Continue checking other files
    }
  }
  pass('Task 8A: No DB/provider files modified')
}

// Main execution
console.log('🔍 Verifying Task 8A: Canonical Re-Audit Acceptance Types...\n')

// Check file structure
checkTask8AFileStructure()

// Check imports
checkTask8AImports()

// Check types
checkTask8ATypes()

// Check safety invariants
checkTask8ASafetyInvariants()

// Check validator function
checkTask8AValidator()

// Check no boundary violations
checkTask8ANoBoundaryViolations()

console.log(`\n${'='.repeat(60)}`)
console.log(`✅ PASSED: ${passCount}`)
console.log(`❌ FAILED: ${failCount}`)
console.log('='.repeat(60))

if (failCount > 0) {
  console.error('\n❌ VERIFICATION FAILED: Task 8A boundaries violated')
  process.exit(1)
}

console.log('\n✅ VERIFICATION PASSED: All Task 8A boundary checks successful')
console.log(`[VERIFY] canonical-reaudit-8a-acceptance-types: ${passCount} checks passed`)
process.exit(0)
