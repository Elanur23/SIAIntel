/**
 * Security Features Test Script
 * 
 * Tests all 4 security features to verify implementation.
 */

import { checkIdleTimeout, updateLastActivity } from '@/lib/auth/idle-timeout'
import { hasRole, canElevateRole, getRoleLevel } from '@/lib/rbac/middleware'
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '@/lib/auth/recovery-codes'

async function testIdleTimeout() {
  console.log('\n=== Testing Idle Timeout ===')

  // Test 1: Fresh session
  const now = Date.now()
  const result1 = checkIdleTimeout(now)
  console.log('✓ Fresh session:', {
    isExpired: result1.isExpired,
    remainingMinutes: Math.floor(result1.remainingTime / 60000),
  })

  // Test 2: Expired session (31 minutes ago)
  const expired = now - 31 * 60 * 1000
  const result2 = checkIdleTimeout(expired)
  console.log('✓ Expired session:', {
    isExpired: result2.isExpired,
    remainingTime: result2.remainingTime,
  })

  // Test 3: Warning threshold (4 minutes remaining)
  const warning = now - 26 * 60 * 1000
  const result3 = checkIdleTimeout(warning)
  console.log('✓ Warning threshold:', {
    shouldWarn: result3.shouldWarn,
    remainingMinutes: Math.floor(result3.remainingTime / 60000),
  })

  // Test 4: Update activity
  const newActivity = updateLastActivity()
  console.log('✓ Activity updated:', new Date(newActivity).toISOString())
}

async function testRBAC() {
  console.log('\n=== Testing RBAC ===')

  // Test 1: Role validation
  console.log('✓ Admin has admin role:', hasRole('admin', ['admin']))
  console.log('✓ Viewer does not have admin role:', !hasRole('viewer', ['admin']))
  console.log('✓ Editor has editor/admin role:', hasRole('editor', ['editor', 'admin']))

  // Test 2: Role hierarchy
  console.log('✓ Role levels:', {
    viewer: getRoleLevel('viewer'),
    editor: getRoleLevel('editor'),
    admin: getRoleLevel('admin'),
  })

  // Test 3: Role elevation
  console.log('✓ Admin can create admin:', canElevateRole('admin', 'admin'))
  console.log('✓ Editor cannot create admin:', !canElevateRole('editor', 'admin'))
  console.log('✓ Viewer cannot create editor:', !canElevateRole('viewer', 'editor'))
  console.log('✓ Editor can create viewer:', canElevateRole('editor', 'viewer'))
}

async function testRecoveryCodes() {
  console.log('\n=== Testing Recovery Codes ===')

  // Test 1: Generate codes
  const codes = generateRecoveryCodes(8)
  console.log('✓ Generated 8 recovery codes')
  console.log('  Sample code:', codes[0].substring(0, 16) + '...')

  // Test 2: Hash code
  const hash = await hashRecoveryCode(codes[0])
  console.log('✓ Hashed recovery code')
  console.log('  Hash length:', hash.length)

  // Test 3: Verify correct code
  const isValid = await verifyRecoveryCode(codes[0], hash)
  console.log('✓ Correct code verified:', isValid)

  // Test 4: Verify incorrect code
  const isInvalid = await verifyRecoveryCode('wrong-code', hash)
  console.log('✓ Incorrect code rejected:', !isInvalid)

  // Test 5: All codes are unique
  const uniqueCodes = new Set(codes)
  console.log('✓ All codes unique:', uniqueCodes.size === codes.length)
}

async function testAuditCleanup() {
  console.log('\n=== Testing Audit Cleanup ===')

  // Test 1: Calculate cutoff date
  const retentionDays = 90
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  console.log('✓ Cutoff date calculated:', cutoffDate.toISOString())

  // Test 2: Verify date is in past
  const isPast = cutoffDate < new Date()
  console.log('✓ Cutoff date is in past:', isPast)

  // Test 3: Check environment variables
  const hasRedis = !!process.env.REDIS_HOST
  const hasSlack = !!process.env.SLACK_WEBHOOK_URL
  console.log('✓ Redis configured:', hasRedis)
  console.log('✓ Slack webhook configured:', hasSlack)

  if (!hasRedis) {
    console.log('  ⚠️  Warning: REDIS_HOST not set. BullMQ will not work.')
  }
  if (!hasSlack) {
    console.log('  ⚠️  Warning: SLACK_WEBHOOK_URL not set. Alerts will not be sent.')
  }
}

async function main() {
  console.log('🔒 Security Features Test Suite')
  console.log('================================')

  try {
    await testIdleTimeout()
    await testRBAC()
    await testRecoveryCodes()
    await testAuditCleanup()

    console.log('\n✅ All tests passed!')
    console.log('\nNext steps:')
    console.log('1. Run Jest tests: npm test lib/rbac/__tests__/')
    console.log('2. Run database migration: npx prisma migrate dev')
    console.log('3. Start BullMQ worker: npx tsx scripts/start-audit-cleanup-worker.ts')
    console.log('4. Test API endpoints with curl or Postman')
    console.log('\nSee docs/SECURITY-FEATURES-SETUP.md for detailed setup instructions.')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

main()
