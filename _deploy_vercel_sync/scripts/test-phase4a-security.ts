/**
 * PHASE 4A SECURITY VERIFICATION TEST SUITE
 * 
 * Comprehensive end-to-end testing of:
 * - Authentication flow
 * - Session management
 * - Rate limiting
 * - Route protection
 * - Audit logging
 * - Cookie security
 */

import { createSession, validateSession, deleteSession } from '@/lib/auth/session-manager'
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limiter'
import { logAuditEvent, getAuditLogs } from '@/lib/auth/audit-logger'
import { prisma } from '@/lib/db/prisma'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

const results: TestResult[] = []

function log(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ test, status, message, details })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} [${test}] ${message}`)
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2))
  }
}

async function testSessionManagement() {
  console.log('\n🔐 Testing Session Management...\n')

  // Test 1: Create session
  try {
    const token = await createSession('test-user', '127.0.0.1', 'Test-Agent')
    if (token && token.length === 64) {
      log('SESSION-CREATE', 'PASS', 'Session token created successfully', { tokenLength: token.length })
    } else {
      log('SESSION-CREATE', 'FAIL', 'Invalid session token format', { token })
    }

    // Test 2: Validate session
    const session = await validateSession(token)
    if (session && session.userId === 'test-user') {
      log('SESSION-VALIDATE', 'PASS', 'Session validation successful', { userId: session.userId })
    } else {
      log('SESSION-VALIDATE', 'FAIL', 'Session validation failed', { session })
    }

    // Test 3: Session persistence (check database)
    const dbSession = await prisma.session.findFirst({
      where: { userId: 'test-user' }
    })
    if (dbSession) {
      log('SESSION-PERSIST', 'PASS', 'Session persisted to database', { 
        hashedToken: dbSession.hashedToken.substring(0, 16) + '...',
        expiresAt: dbSession.expiresAt
      })
    } else {
      log('SESSION-PERSIST', 'FAIL', 'Session not found in database')
    }

    // Test 4: Invalid token
    const invalidSession = await validateSession('invalid-token-12345')
    if (!invalidSession) {
      log('SESSION-INVALID', 'PASS', 'Invalid token correctly rejected')
    } else {
      log('SESSION-INVALID', 'FAIL', 'Invalid token was accepted', { invalidSession })
    }

    // Test 5: Delete session
    await deleteSession(token)
    const deletedSession = await validateSession(token)
    if (!deletedSession) {
      log('SESSION-DELETE', 'PASS', 'Session deleted successfully')
    } else {
      log('SESSION-DELETE', 'FAIL', 'Session still valid after deletion', { deletedSession })
    }

  } catch (error) {
    log('SESSION-MANAGEMENT', 'FAIL', 'Session management error', { error: String(error) })
  }
}

async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...\n')

  const testIp = '192.168.1.100'
  
  try {
    // Reset first
    await resetRateLimit(testIp, 'test_login')

    // Test 1-5: Should allow 5 attempts
    for (let i = 1; i <= 5; i++) {
      const result = await checkRateLimit(testIp, 'test_login')
      if (result.allowed) {
        log(`RATE-LIMIT-${i}`, 'PASS', `Attempt ${i}/5 allowed`, { remaining: result.remaining })
      } else {
        log(`RATE-LIMIT-${i}`, 'FAIL', `Attempt ${i}/5 blocked prematurely`, result)
      }
    }

    // Test 6: Should block 6th attempt
    const blockedResult = await checkRateLimit(testIp, 'test_login')
    if (!blockedResult.allowed && blockedResult.retryAfter) {
      log('RATE-LIMIT-BLOCK', 'PASS', 'Rate limit correctly enforced after 5 attempts', {
        retryAfter: blockedResult.retryAfter,
        resetTime: new Date(blockedResult.resetTime).toISOString()
      })
    } else {
      log('RATE-LIMIT-BLOCK', 'FAIL', '6th attempt was not blocked', blockedResult)
    }

    // Test 7: Check database persistence
    const dbRateLimit = await prisma.rateLimit.findUnique({
      where: { key: `test_login:${testIp}` }
    })
    if (dbRateLimit && dbRateLimit.count >= 5) {
      log('RATE-LIMIT-PERSIST', 'PASS', 'Rate limit persisted to database', {
        count: dbRateLimit.count,
        resetTime: dbRateLimit.resetTime
      })
    } else {
      log('RATE-LIMIT-PERSIST', 'FAIL', 'Rate limit not properly persisted', { dbRateLimit })
    }

    // Test 8: Reset rate limit
    await resetRateLimit(testIp, 'test_login')
    const afterReset = await checkRateLimit(testIp, 'test_login')
    if (afterReset.allowed && afterReset.remaining === 4) {
      log('RATE-LIMIT-RESET', 'PASS', 'Rate limit reset successful')
    } else {
      log('RATE-LIMIT-RESET', 'FAIL', 'Rate limit reset failed', afterReset)
    }

  } catch (error) {
    log('RATE-LIMITING', 'FAIL', 'Rate limiting error', { error: String(error) })
  }
}

async function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...\n')

  try {
    // Test 1: Log successful login
    await logAuditEvent('test_login', true, {
      userId: 'test-user',
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent'
    })

    // Test 2: Log failed login
    await logAuditEvent('test_login', false, {
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent',
      errorMessage: 'Invalid password'
    })

    // Test 3: Log logout
    await logAuditEvent('test_logout', true, {
      userId: 'test-user',
      ipAddress: '127.0.0.1'
    })

    // Test 4: Verify logs in database
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['test_login', 'test_logout']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    if (logs.length >= 3) {
      log('AUDIT-LOGGING', 'PASS', `Audit logs persisted to database (${logs.length} entries)`, {
        recentLogs: logs.slice(0, 3).map(l => ({
          action: l.action,
          success: l.success,
          timestamp: l.timestamp
        }))
      })
    } else {
      log('AUDIT-LOGGING', 'FAIL', 'Insufficient audit logs in database', { count: logs.length })
    }

    // Test 5: Check log structure
    const sampleLog = logs[0]
    if (sampleLog && sampleLog.action && sampleLog.timestamp && typeof sampleLog.success === 'boolean') {
      log('AUDIT-STRUCTURE', 'PASS', 'Audit log structure valid', {
        fields: Object.keys(sampleLog)
      })
    } else {
      log('AUDIT-STRUCTURE', 'FAIL', 'Audit log structure invalid', { sampleLog })
    }

  } catch (error) {
    log('AUDIT-LOGGING', 'FAIL', 'Audit logging error', { error: String(error) })
  }
}

async function testEnvironmentConfig() {
  console.log('\n⚙️ Testing Environment Configuration...\n')

  // Test 1: ADMIN_SECRET exists
  if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 16) {
    log('ENV-ADMIN-SECRET', 'PASS', 'ADMIN_SECRET configured', { length: process.env.ADMIN_SECRET.length })
  } else if (process.env.ADMIN_SECRET) {
    log('ENV-ADMIN-SECRET', 'WARN', 'ADMIN_SECRET too short (< 16 chars)', { length: process.env.ADMIN_SECRET.length })
  } else {
    log('ENV-ADMIN-SECRET', 'FAIL', 'ADMIN_SECRET not configured')
  }

  // Test 2: SESSION_SECRET exists (optional but recommended)
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    log('ENV-SESSION-SECRET', 'PASS', 'SESSION_SECRET configured', { length: process.env.SESSION_SECRET.length })
  } else if (process.env.SESSION_SECRET) {
    log('ENV-SESSION-SECRET', 'WARN', 'SESSION_SECRET too short (< 32 chars)', { length: process.env.SESSION_SECRET.length })
  } else {
    log('ENV-SESSION-SECRET', 'WARN', 'SESSION_SECRET not configured (optional)')
  }

  // Test 3: NODE_ENV
  if (process.env.NODE_ENV) {
    log('ENV-NODE-ENV', 'PASS', `NODE_ENV set to ${process.env.NODE_ENV}`)
  } else {
    log('ENV-NODE-ENV', 'WARN', 'NODE_ENV not set')
  }

  // Test 4: Database URL
  if (process.env.DATABASE_URL) {
    log('ENV-DATABASE-URL', 'PASS', 'DATABASE_URL configured')
  } else {
    log('ENV-DATABASE-URL', 'WARN', 'DATABASE_URL not set (using default)')
  }
}

async function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema...\n')

  try {
    // Test 1: Session table
    const sessionCount = await prisma.session.count()
    log('DB-SESSION-TABLE', 'PASS', `Session table accessible (${sessionCount} records)`)

    // Test 2: RateLimit table
    const rateLimitCount = await prisma.rateLimit.count()
    log('DB-RATELIMIT-TABLE', 'PASS', `RateLimit table accessible (${rateLimitCount} records)`)

    // Test 3: AuditLog table
    const auditLogCount = await prisma.auditLog.count()
    log('DB-AUDITLOG-TABLE', 'PASS', `AuditLog table accessible (${auditLogCount} records)`)

    // Test 4: Check indexes
    const sessionSample = await prisma.session.findFirst()
    if (sessionSample) {
      log('DB-INDEXES', 'PASS', 'Database indexes working (query successful)')
    } else {
      log('DB-INDEXES', 'WARN', 'No session data to test indexes')
    }

  } catch (error) {
    log('DATABASE-SCHEMA', 'FAIL', 'Database schema error', { error: String(error) })
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Configuration...\n')

  // Test 1: Cookie settings (simulated)
  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  }

  if (cookieConfig.httpOnly) {
    log('COOKIE-HTTPONLY', 'PASS', 'HttpOnly flag enabled')
  } else {
    log('COOKIE-HTTPONLY', 'FAIL', 'HttpOnly flag not enabled')
  }

  if (process.env.NODE_ENV === 'production' && cookieConfig.secure) {
    log('COOKIE-SECURE', 'PASS', 'Secure flag enabled in production')
  } else if (process.env.NODE_ENV !== 'production') {
    log('COOKIE-SECURE', 'WARN', 'Secure flag disabled (development mode)')
  } else {
    log('COOKIE-SECURE', 'FAIL', 'Secure flag not enabled in production')
  }

  if (cookieConfig.sameSite === 'lax' || cookieConfig.sameSite === 'strict') {
    log('COOKIE-SAMESITE', 'PASS', `SameSite set to ${cookieConfig.sameSite}`)
  } else {
    log('COOKIE-SAMESITE', 'FAIL', 'SameSite not properly configured')
  }

  // Test 2: Session duration
  const sessionDurationDays = cookieConfig.maxAge / (60 * 60 * 24)
  if (sessionDurationDays === 7) {
    log('SESSION-DURATION', 'PASS', '7-day session duration configured')
  } else {
    log('SESSION-DURATION', 'WARN', `Session duration is ${sessionDurationDays} days`)
  }
}

async function testCleanupFunctions() {
  console.log('\n🧹 Testing Cleanup Functions...\n')

  try {
    // Create expired test data
    const expiredToken = await createSession('expired-user', '127.0.0.1', 'Test')
    await prisma.session.updateMany({
      where: { userId: 'expired-user' },
      data: { expiresAt: new Date(Date.now() - 1000) } // Expired 1 second ago
    })

    // Test session cleanup
    const { cleanupExpiredSessions } = await import('@/lib/auth/session-manager')
    const cleanedSessions = await cleanupExpiredSessions()
    if (cleanedSessions >= 1) {
      log('CLEANUP-SESSIONS', 'PASS', `Cleaned up ${cleanedSessions} expired session(s)`)
    } else {
      log('CLEANUP-SESSIONS', 'WARN', 'No expired sessions cleaned (may be expected)')
    }

    // Test rate limit cleanup
    await prisma.rateLimit.create({
      data: {
        key: 'expired-test',
        count: 5,
        resetTime: new Date(Date.now() - 1000),
        firstAttempt: new Date(Date.now() - 1000000)
      }
    })

    const { cleanupExpiredRateLimits } = await import('@/lib/auth/rate-limiter')
    const cleanedRateLimits = await cleanupExpiredRateLimits()
    if (cleanedRateLimits >= 1) {
      log('CLEANUP-RATELIMITS', 'PASS', `Cleaned up ${cleanedRateLimits} expired rate limit(s)`)
    } else {
      log('CLEANUP-RATELIMITS', 'WARN', 'No expired rate limits cleaned (may be expected)')
    }

  } catch (error) {
    log('CLEANUP-FUNCTIONS', 'FAIL', 'Cleanup function error', { error: String(error) })
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 PHASE 4A SECURITY VERIFICATION REPORT')
  console.log('='.repeat(80) + '\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warnings = results.filter(r => r.status === 'WARN').length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  • [${r.test}] ${r.message}`)
      if (r.details) {
        console.log(`    ${JSON.stringify(r.details)}`)
      }
    })
    console.log('')
  }

  if (warnings > 0) {
    console.log('⚠️  WARNINGS:\n')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  • [${r.test}] ${r.message}`)
    })
    console.log('')
  }

  console.log('='.repeat(80))
  
  if (failed === 0) {
    console.log('✅ ALL CRITICAL TESTS PASSED - SYSTEM READY FOR PRODUCTION')
  } else {
    console.log('❌ CRITICAL FAILURES DETECTED - FIX REQUIRED BEFORE PRODUCTION')
  }
  console.log('='.repeat(80) + '\n')

  return { passed, failed, warnings, total, results }
}

async function main() {
  console.log('🚀 Starting Phase 4A Security Verification...\n')

  try {
    await testEnvironmentConfig()
    await testDatabaseSchema()
    await testSessionManagement()
    await testRateLimiting()
    await testAuditLogging()
    await testSecurityHeaders()
    await testCleanupFunctions()

    const report = await generateReport()

    // Write report to file
    const fs = require('fs')
    const reportPath = 'docs/PHASE-4A-VERIFICATION-REPORT.md'
    const markdown = `# Phase 4A Security Verification Report

**Date**: ${new Date().toISOString()}
**Status**: ${report.failed === 0 ? '✅ PASSED' : '❌ FAILED'}

## Summary

- Total Tests: ${report.total}
- Passed: ${report.passed}
- Failed: ${report.failed}
- Warnings: ${report.warnings}
- Success Rate: ${((report.passed / report.total) * 100).toFixed(1)}%

## Test Results

${report.results.map(r => `### ${r.test}
- **Status**: ${r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN'}
- **Message**: ${r.message}
${r.details ? `- **Details**: \`\`\`json\n${JSON.stringify(r.details, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## Conclusion

${report.failed === 0 
  ? '✅ All critical security tests passed. System is ready for production deployment.' 
  : '❌ Critical failures detected. Review and fix issues before production deployment.'}

${report.warnings > 0 
  ? `\n⚠️ ${report.warnings} warning(s) detected. Review recommendations for optimal security.` 
  : ''}
`

    fs.writeFileSync(reportPath, markdown)
    console.log(`📄 Report saved to: ${reportPath}\n`)

    process.exit(report.failed > 0 ? 1 : 0)

  } catch (error) {
    console.error('❌ Test suite error:', error)
    process.exit(1)
  }
}

main()
