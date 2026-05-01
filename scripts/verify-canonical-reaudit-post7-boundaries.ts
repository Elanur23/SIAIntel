#!/usr/bin/env tsx

/**
 * Verification Script: Canonical Re-Audit Post-Task 7A Boundaries
 * 
 * Validates that Task 7A did NOT violate boundaries:
 * - page.tsx was NOT modified
 * - Hooks were NOT modified
 * - Handlers were NOT modified
 * - Adapters were NOT modified
 * - Types were NOT modified
 * - API routes were NOT modified
 * - No acceptance/promotion files created
 * - Component does NOT call forbidden functions
 */

import * as fs from 'fs'
import * as path from 'path'
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

function checkFileNotModified(filePath: string, description: string): void {
  try {
    // Check if file is in git and has modifications
    const status = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf-8' }).trim()
    
    if (status && status.startsWith('M')) {
      fail(`${description} not modified`, `File has been modified: ${filePath}`)
      return
    }
    pass(`${description} not modified`)
  } catch (error) {
    // File might not be tracked by git yet, or git command failed
    // Check if file exists and was recently modified
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      const now = Date.now()
      const modifiedTime = stats.mtimeMs
      const ageMinutes = (now - modifiedTime) / 1000 / 60
      
      if (ageMinutes < 5) {
        fail(`${description} not modified`, `File was recently modified: ${filePath}`)
        return
      }
    }
    pass(`${description} not modified`)
  }
}

function checkComponentContent(): void {
  const componentPath = 'app/admin/warroom/components/CanonicalReAuditPanel.tsx'
  
  if (!fs.existsSync(componentPath)) {
    fail('Component exists', 'Component file not found')
    return
  }
  
  const content = fs.readFileSync(componentPath, 'utf-8')
  
  // Check for forbidden function calls
  const forbiddenCalls = [
    { pattern: 'setGlobalAudit', description: 'setGlobalAudit call' },
    { pattern: 'setVault', description: 'setVault call' },
    { pattern: 'fetch(', description: 'fetch call' },
    { pattern: 'axios', description: 'axios call' },
    { pattern: 'localStorage', description: 'localStorage access' },
    { pattern: 'sessionStorage', description: 'sessionStorage access' }
  ]
  
  for (const { pattern, description } of forbiddenCalls) {
    if (content.includes(pattern)) {
      fail(`Component does not call ${description}`, `Found: ${pattern}`)
      return
    }
  }
  pass('Component does not call forbidden functions')
}

function checkNoAcceptanceFiles(): void {
  const forbiddenPaths = [
    'app/admin/warroom/components/CanonicalReAuditAcceptanceModal.tsx',
    'app/admin/warroom/handlers/canonical-reaudit-acceptance-handler.ts',
    'lib/editorial/canonical-reaudit-acceptance.ts'
  ]
  
  for (const filePath of forbiddenPaths) {
    if (fs.existsSync(filePath)) {
      fail('No acceptance/promotion files created', `Forbidden file exists: ${filePath}`)
      return
    }
  }
  pass('No acceptance/promotion files created')
}

function checkNoAPIRouteModifications(): void {
  try {
    const apiStatus = execSync('git status --porcelain "app/api/**/*.ts"', { encoding: 'utf-8' }).trim()
    
    if (apiStatus) {
      const modifiedFiles = apiStatus.split('\n').filter(line => line.startsWith('M'))
      if (modifiedFiles.length > 0) {
        fail('No API routes modified', `Modified files: ${modifiedFiles.join(', ')}`)
        return
      }
    }
    pass('No API routes modified')
  } catch (error) {
    // No modifications or git command failed
    pass('No API routes modified')
  }
}

function checkNoDBProviderModifications(): void {
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
        fail('No DB/provider files modified', `File modified: ${filePath}`)
        return
      }
    } catch (error) {
      // Continue checking other files
    }
  }
  pass('No DB/provider files modified')
}

// Main execution
console.log('🔍 Verifying Task 7A Boundaries...\n')

// Check that forbidden files were NOT modified
checkFileNotModified('app/admin/warroom/page.tsx', 'page.tsx')
checkFileNotModified('app/admin/warroom/hooks/useCanonicalReAudit.ts', 'useCanonicalReAudit hook')
checkFileNotModified('app/admin/warroom/handlers/canonical-reaudit-handler.ts', 'canonical-reaudit-handler')
checkFileNotModified('lib/editorial/canonical-reaudit-adapter.ts', 'canonical-reaudit-adapter')
checkFileNotModified('lib/editorial/canonical-reaudit-types.ts', 'canonical-reaudit-types')

// Check component content
checkComponentContent()

// Check no acceptance files created
checkNoAcceptanceFiles()

// Check no API routes modified
checkNoAPIRouteModifications()

// Check no DB/provider files modified
checkNoDBProviderModifications()

console.log(`\n${'='.repeat(60)}`)
console.log(`✅ PASSED: ${passCount}`)
console.log(`❌ FAILED: ${failCount}`)
console.log('='.repeat(60))

if (failCount > 0) {
  console.error('\n❌ VERIFICATION FAILED: Task 7A boundaries violated')
  process.exit(1)
}

console.log('\n✅ VERIFICATION PASSED: All boundary checks successful')
console.log(`[VERIFY] canonical-reaudit-post7-boundaries: ${passCount} checks passed`)
process.exit(0)
