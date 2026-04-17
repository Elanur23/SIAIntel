/**
 * PHASE 4B-3 SECURITY TEST SUITE
 * 
 * Tests Admin Action Hardening and Scale Preparation:
 * 1. Critical Admin Action Hardening
 * 2. Anti-Double-Submit / Idempotency
 * 3. Server-Side Validation
 * 4. 2FA-Ready Architecture
 * 5. Database & Scale Preparation
 */

import {
  validateInput,
  publishContentSchema,
  deleteContentSchema,
  bulkDeleteSchema,
  updateSettingsSchema,
  securitySettingsSchema,
  validateArticleId,
  validateArticleIds,
  hasUnexpectedFields,
  sanitizeString,
} from '../lib/security/admin-validation'
import {
  checkIdempotency,
  completeIdempotency,
  generateIdempotencyKey,
  withIdempotency,
  cleanupExpiredIdempotencyKeys,
} from '../lib/security/idempotency'
import {
  isTwoFactorEnabled,
  getTwoFactorStatus,
  requiresTwoFactor,
  checkTwoFactorRequired,
} from '../lib/auth/totp'
import {
  getDatabaseStats,
  cleanupExpiredSessions,
  cleanupOldAuditLogs,
  cleanupExpiredRateLimits,
  checkDatabaseHealth,
  checkPostgreSQLReadiness,
  getRecommendedIndexes,
} from '../lib/db/optimization'

interface TestResult {
  name: string
  passed: boolean
  message: string
  category: 'validation' | 'idempotency' | '2fa' | 'database' | 'hardening'
}

const results: TestResult[] = []

function test(name: string, category: TestResult['category'], fn: () => Promise<boolean> | boolean): void {
  try {
    const result = fn()
    if (result instanceof Promise) {
      result.then(passed => {
        results.push({
          name,
          passed,
          message: passed ? 'PASS' : 'FAIL',
          category,
        })
      }).catch(error => {
        results.push({
          name,
          passed: false,
          message: `ERROR: ${error.message}`,
          category,
        })
      })
    } else {
      results.push({
        name,
        passed: result,
        message: result ? 'PASS' : 'FAIL',
        category,
      })
    }
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: `ERROR: ${error.message}`,
      category,
    })
  }
}

async function runTests() {
  console.log('\n=== PHASE 4B-3 SECURITY TEST SUITE ===\n')
  console.log('Testing: Validation, Idempotency, 2FA, Database, Hardening\n')

  // ========================================================================
  // CATEGORY 1: SERVER-SIDE VALIDATION
  // ========================================================================
  console.log('📋 Category 1: Server-Side Validation\n')

  // Test 1: Valid publish content
  test('Valid publish content', 'validation', () => {
    const result = validateInput(publishContentSchema, {
      articleId: 'test-123',
      confirmPublish: true,
    })
    return result.success === true
  })

  // Test 2: Invalid publish (missing confirmation)
  test('Invalid publish (missing confirmation)', 'validation', () => {
    const result = validateInput(publishContentSchema, {
      articleId: 'test-123',
      confirmPublish: false,
    })
    return result.success === false
  })

  // Test 3: Valid delete content
  test('Valid delete content', 'validation', () => {
    const result = validateInput(deleteContentSchema, {
      articleId: 'test-123',
      confirmDelete: true,
      reason: 'Test deletion',
    })
    return result.success === true
  })

  // Test 4: Invalid delete (short reason)
  test('Invalid delete (short reason)', 'validation', () => {
    const result = validateInput(deleteContentSchema, {
      articleId: 'test-123',
      confirmDelete: true,
      reason: 'ab', // Too short
    })
    return result.success === false
  })

  // Test 5: Valid bulk delete
  test('Valid bulk delete', 'validation', () => {
    const result = validateInput(bulkDeleteSchema, {
      articleIds: ['test-1', 'test-2', 'test-3'],
      confirmBulkDelete: true,
      reason: 'Bulk test deletion',
    })
    return result.success === true
  })

  // Test 6: Invalid bulk delete (too many)
  test('Invalid bulk delete (too many)', 'validation', () => {
    const articleIds = Array.from({ length: 51 }, (_, i) => `test-${i}`)
    const result = validateInput(bulkDeleteSchema, {
      articleIds,
      confirmBulkDelete: true,
      reason: 'Too many',
    })
    return result.success === false
  })

  // Test 7: Valid settings update
  test('Valid settings update', 'validation', () => {
    const result = validateInput(updateSettingsSchema, {
      settingKey: 'notifications',
      settingValue: true,
      confirmUpdate: true,
    })
    return result.success === true
  })

  // Test 8: Valid security settings
  test('Valid security settings', 'validation', () => {
    const result = validateInput(securitySettingsSchema, {
      action: 'change_password',
      confirmSecurityChange: true,
      currentPassword: 'current123',
      newValue: 'new123',
    })
    return result.success === true
  })

  // Test 9: Article ID validation
  test('Article ID validation', 'validation', () => {
    const valid = validateArticleId('test-article-123')
    const invalid = validateArticleId('test<script>')
    return valid === 'test-article-123' && invalid === null
  })

  // Test 10: Article IDs array validation
  test('Article IDs array validation', 'validation', () => {
    const valid = validateArticleIds(['test-1', 'test-2'])
    const invalid = validateArticleIds(['test-1', 'test<script>'])
    return valid !== null && invalid === null
  })

  // Test 11: Unexpected fields detection
  test('Unexpected fields detection', 'validation', () => {
    const result = hasUnexpectedFields(
      { articleId: 'test', malicious: 'data' },
      ['articleId']
    )
    return result.hasUnexpected && result.unexpectedFields.includes('malicious')
  })

  // Test 12: String sanitization
  test('String sanitization', 'validation', () => {
    const sanitized = sanitizeString('<script>alert("xss")</script>')
    return !sanitized.includes('<script>') && sanitized.includes('&lt;')
  })

  // ========================================================================
  // CATEGORY 2: IDEMPOTENCY
  // ========================================================================
  console.log('\n📋 Category 2: Idempotency\n')

  // Test 13: Idempotency key generation
  test('Idempotency key generation', 'idempotency', () => {
    const key = generateIdempotencyKey('user-1', 'publish', { articleId: 'test' })
    return key.includes('user-1') && key.includes('publish')
  })

  // Test 14: First request allowed
  test('First request allowed', 'idempotency', async () => {
    const key = `test-first-${Date.now()}`
    const result = await checkIdempotency(key, 'publish', 'user-1')
    return result.shouldProcess === true && result.isDuplicate === false
  })

  // Test 15: Duplicate request blocked
  test('Duplicate request blocked', 'idempotency', async () => {
    const key = `test-duplicate-${Date.now()}`
    
    // First request
    await checkIdempotency(key, 'publish', 'user-1')
    await completeIdempotency(key, { success: true })
    
    // Duplicate request
    const result = await checkIdempotency(key, 'publish', 'user-1')
    return result.isDuplicate === true && result.shouldProcess === false
  })

  // Test 16: Idempotency with operation
  test('Idempotency with operation', 'idempotency', async () => {
    const key = `test-operation-${Date.now()}`
    let executed = false
    
    const result = await withIdempotency(key, 'test', 'user-1', async () => {
      executed = true
      return { data: 'test' }
    })
    
    return result.success && executed
  })

  // Test 17: Idempotency prevents double execution
  test('Idempotency prevents double execution', 'idempotency', async () => {
    const key = `test-double-${Date.now()}`
    let executionCount = 0
    
    // First execution
    await withIdempotency(key, 'test', 'user-1', async () => {
      executionCount++
      return { data: 'test' }
    })
    
    // Second execution (should be blocked)
    await withIdempotency(key, 'test', 'user-1', async () => {
      executionCount++
      return { data: 'test' }
    })
    
    return executionCount === 1
  })

  // Test 18: Cleanup expired keys
  test('Cleanup expired keys', 'idempotency', async () => {
    const count = await cleanupExpiredIdempotencyKeys()
    return count >= 0
  })

  // ========================================================================
  // CATEGORY 3: 2FA-READY ARCHITECTURE
  // ========================================================================
  console.log('\n📋 Category 3: 2FA-Ready Architecture\n')

  // Test 19: 2FA status check
  test('2FA status check', '2fa', async () => {
    const enabled = await isTwoFactorEnabled('test-user')
    return typeof enabled === 'boolean'
  })

  // Test 20: Get 2FA status
  test('Get 2FA status', '2fa', async () => {
    const status = await getTwoFactorStatus('test-user')
    return status && typeof status.enabled === 'boolean'
  })

  // Test 21: High-risk actions require 2FA
  test('High-risk actions require 2FA', '2fa', () => {
    const changePassword = requiresTwoFactor('change_password')
    const disable2fa = requiresTwoFactor('disable_2fa')
    const bulkDelete = requiresTwoFactor('bulk_delete')
    const normalAction = requiresTwoFactor('view_dashboard')
    
    return changePassword && disable2fa && bulkDelete && !normalAction
  })

  // Test 22: 2FA challenge check
  test('2FA challenge check', '2fa', async () => {
    const challenge = await checkTwoFactorRequired('test-user', 'change_password')
    return challenge && typeof challenge.required === 'boolean'
  })

  // ========================================================================
  // CATEGORY 4: DATABASE & SCALE PREPARATION
  // ========================================================================
  console.log('\n📋 Category 4: Database & Scale Preparation\n')

  // Test 23: Database statistics
  test('Database statistics', 'database', async () => {
    const stats = await getDatabaseStats()
    return (
      stats &&
      typeof stats.sessions.total === 'number' &&
      typeof stats.auditLogs.total === 'number' &&
      typeof stats.rateLimits.total === 'number'
    )
  })

  // Test 24: Cleanup expired sessions
  test('Cleanup expired sessions', 'database', async () => {
    const count = await cleanupExpiredSessions()
    return count >= 0
  })

  // Test 25: Cleanup old audit logs
  test('Cleanup old audit logs', 'database', async () => {
    const count = await cleanupOldAuditLogs(90)
    return count >= 0
  })

  // Test 26: Cleanup expired rate limits
  test('Cleanup expired rate limits', 'database', async () => {
    const count = await cleanupExpiredRateLimits()
    return count >= 0
  })

  // Test 27: Database health check
  test('Database health check', 'database', async () => {
    const health = await checkDatabaseHealth()
    return (
      health &&
      typeof health.healthy === 'boolean' &&
      Array.isArray(health.issues)
    )
  })

  // Test 28: PostgreSQL readiness check
  test('PostgreSQL readiness check', 'database', () => {
    const readiness = checkPostgreSQLReadiness()
    return (
      readiness &&
      typeof readiness.schemaCompatible === 'boolean' &&
      Array.isArray(readiness.issues)
    )
  })

  // Test 29: Recommended indexes available
  test('Recommended indexes available', 'database', () => {
    const indexes = getRecommendedIndexes()
    return Array.isArray(indexes) && indexes.length > 0
  })

  // ========================================================================
  // CATEGORY 5: CRITICAL ACTION HARDENING
  // ========================================================================
  console.log('\n📋 Category 5: Critical Action Hardening\n')

  // Test 30: Confirmation required for publish
  test('Confirmation required for publish', 'hardening', () => {
    const withoutConfirm = validateInput(publishContentSchema, {
      articleId: 'test',
      confirmPublish: false,
    })
    return !withoutConfirm.success
  })

  // Test 31: Confirmation required for delete
  test('Confirmation required for delete', 'hardening', () => {
    const withoutConfirm = validateInput(deleteContentSchema, {
      articleId: 'test',
      confirmDelete: false,
      reason: 'test',
    })
    return !withoutConfirm.success
  })

  // Test 32: Confirmation required for bulk delete
  test('Confirmation required for bulk delete', 'hardening', () => {
    const withoutConfirm = validateInput(bulkDeleteSchema, {
      articleIds: ['test-1'],
      confirmBulkDelete: false,
      reason: 'test',
    })
    return !withoutConfirm.success
  })

  // Test 33: Reason required for destructive actions
  test('Reason required for destructive actions', 'hardening', () => {
    const withoutReason = validateInput(deleteContentSchema, {
      articleId: 'test',
      confirmDelete: true,
      reason: '',
    })
    return !withoutReason.success
  })

  // Test 34: Security actions require current password
  test('Security actions require current password', 'hardening', () => {
    const withoutPassword = validateInput(securitySettingsSchema, {
      action: 'change_password',
      confirmSecurityChange: true,
      currentPassword: '',
    })
    return !withoutPassword.success
  })

  // Wait for all async tests to complete
  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================================================
  // RESULTS SUMMARY
  // ========================================================================
  console.log('\n=== TEST RESULTS ===\n')

  const categories = ['validation', 'idempotency', '2fa', 'database', 'hardening'] as const
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category)
    const passed = categoryResults.filter(r => r.passed).length
    const total = categoryResults.length
    
    console.log(`\n${category.toUpperCase()}:`)
    categoryResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`  ${icon} ${result.name}: ${result.message}`)
    })
    console.log(`  Summary: ${passed}/${total} passed`)
  })

  const totalPassed = results.filter(r => r.passed).length
  const totalTests = results.length
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1)

  console.log('\n=== OVERALL SUMMARY ===')
  console.log(`Total: ${totalPassed}/${totalTests} passed (${passRate}%)`)
  console.log(`Failed: ${totalTests - totalPassed}`)

  // Final verdict
  console.log('\n=== PHASE 4B-3 STATUS ===')
  if (totalPassed === totalTests) {
    console.log('✅ PHASE 4B-3 COMPLETE - All admin hardening and scale prep operational')
  } else if (totalPassed >= totalTests * 0.9) {
    console.log('⚠️  PHASE 4B-3 MOSTLY COMPLETE - Minor issues remain')
  } else {
    console.log('❌ PHASE 4B-3 INCOMPLETE - Critical issues need attention')
  }
  
  console.log('\n==========================================\n')
}

// Run tests
runTests().catch(console.error)
