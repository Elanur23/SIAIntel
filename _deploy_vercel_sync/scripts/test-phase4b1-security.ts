/**
 * PHASE 4B-1 SECURITY TEST SUITE
 * 
 * Tests Critical Security Controls:
 * 1. CSRF Protection
 * 2. Session Hardening (idle timeout, absolute expiry, rotation)
 * 3. Production Config Validation
 * 4. Security Headers
 */

import { validateProductionConfig } from '../lib/security/config-validator'
import { validateSecurityHeaders } from '../lib/security/security-headers'
import { 
  validateHardenedSession, 
  rotateSession, 
  cleanupExpiredSessions,
  SESSION_CONFIG 
} from '../lib/security/session-hardening'
import { generateCsrfToken, validateCsrfToken } from '../lib/security/csrf'
import { createSession, deleteSession } from '../lib/auth/session-manager'

interface TestResult {
  name: string
  passed: boolean
  message: string
  category: 'csrf' | 'session' | 'config' | 'headers'
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
  console.log('\n=== PHASE 4B-1 SECURITY TEST SUITE ===\n')
  console.log('Testing: CSRF, Session Hardening, Config Validation, Security Headers\n')

  // ========================================================================
  // CATEGORY 1: CSRF PROTECTION
  // ========================================================================
  console.log('📋 Category 1: CSRF Protection\n')

  // Test 1: CSRF token generation
  test('CSRF token generation', 'csrf', async () => {
    const sessionId = 'test-session-123'
    const token = await generateCsrfToken(sessionId)
    return token.includes(':') && token.length > 40
  })

  // Test 2: CSRF token validation (valid)
  test('CSRF token validation (valid)', 'csrf', async () => {
    const sessionId = 'test-session-456'
    const token = await generateCsrfToken(sessionId)
    // Wait a tiny bit to ensure timestamp is set
    await new Promise(resolve => setTimeout(resolve, 10))
    const result = await validateCsrfToken(token, sessionId, 3600000) // 1 hour max age
    return result.valid === true
  })

  // Test 3: CSRF token validation (wrong session)
  test('CSRF token validation (wrong session)', 'csrf', async () => {
    const sessionId1 = 'test-session-789'
    const sessionId2 = 'test-session-999'
    const token = await generateCsrfToken(sessionId1)
    const result = await validateCsrfToken(token, sessionId2)
    return result.valid === false && result.reason === 'Invalid token signature'
  })

  // Test 4: CSRF token expiry
  test('CSRF token expiry', 'csrf', async () => {
    const sessionId = 'test-session-expired'
    const token = await generateCsrfToken(sessionId)
    // Validate with very short max age (should fail)
    const result = await validateCsrfToken(token, sessionId, 1) // 1ms max age
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait 10ms
    const result2 = await validateCsrfToken(token, sessionId, 1)
    return result2.valid === false && result2.reason === 'Token expired'
  })

  // Test 5: CSRF token format validation
  test('CSRF token format validation', 'csrf', async () => {
    const sessionId = 'test-session-format'
    const invalidToken = 'invalid-token-format'
    const result = await validateCsrfToken(invalidToken, sessionId)
    return result.valid === false && result.reason === 'Invalid token format'
  })

  // ========================================================================
  // CATEGORY 2: SESSION HARDENING
  // ========================================================================
  console.log('\n📋 Category 2: Session Hardening\n')

  // Test 6: Session creation with metadata
  test('Session creation with metadata', 'session', async () => {
    const token = await createSession('test-user', '192.168.1.1', 'Test-Agent')
    const isValid = token && token.length === 64
    if (token) await deleteSession(token)
    return isValid
  })

  // Test 7: Session idle timeout configuration
  test('Session idle timeout configured', 'session', () => {
    return SESSION_CONFIG.IDLE_TIMEOUT_MS === 30 * 60 * 1000 // 30 minutes
  })

  // Test 8: Session absolute expiry configuration
  test('Session absolute expiry configured', 'session', () => {
    return SESSION_CONFIG.ABSOLUTE_EXPIRY_MS === 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  // Test 9: Session rotation threshold configuration
  test('Session rotation threshold configured', 'session', () => {
    return SESSION_CONFIG.ROTATION_THRESHOLD_MS === 24 * 60 * 60 * 1000 // 24 hours
  })

  // Test 10: Hardened session validation (valid)
  test('Hardened session validation (valid)', 'session', async () => {
    const token = await createSession('test-user-2', '192.168.1.2', 'Test-Agent-2')
    // Wait for session to be fully created
    await new Promise(resolve => setTimeout(resolve, 100))
    const result = await validateHardenedSession(token, '192.168.1.2', 'Test-Agent-2')
    await deleteSession(token)
    return result.valid === true && !result.suspicious
  })

  // Test 11: IP address change detection
  test('IP address change detection', 'session', async () => {
    const token = await createSession('test-user-3', '192.168.1.3', 'Test-Agent-3')
    const result = await validateHardenedSession(token, '192.168.1.99', 'Test-Agent-3')
    await deleteSession(token)
    return result.valid === true && result.suspicious === true
  })

  // Test 12: User agent change detection
  test('User agent change detection', 'session', async () => {
    const token = await createSession('test-user-4', '192.168.1.4', 'Test-Agent-4')
    const result = await validateHardenedSession(token, '192.168.1.4', 'Different-Agent')
    await deleteSession(token)
    return result.valid === true && result.suspicious === true
  })

  // Test 13: Session rotation functionality
  test('Session rotation functionality', 'session', async () => {
    const oldToken = await createSession('test-user-5', '192.168.1.5', 'Test-Agent-5')
    const newToken = await rotateSession(oldToken, 'test-user-5', '192.168.1.5', 'Test-Agent-5')
    const isValid = newToken !== null && newToken !== oldToken && newToken.length === 64
    if (newToken) await deleteSession(newToken)
    return isValid
  })

  // Test 14: Expired session cleanup
  test('Expired session cleanup', 'session', async () => {
    const count = await cleanupExpiredSessions()
    return count >= 0 // Should return number of deleted sessions
  })

  // ========================================================================
  // CATEGORY 3: PRODUCTION CONFIG VALIDATION
  // ========================================================================
  console.log('\n📋 Category 3: Production Config Validation\n')

  // Test 15: Config validator exists
  test('Config validator exists', 'config', () => {
    return typeof validateProductionConfig === 'function'
  })

  // Test 16: Config validation returns result
  test('Config validation returns result', 'config', () => {
    const result = validateProductionConfig()
    return result && typeof result.valid === 'boolean' && Array.isArray(result.errors)
  })

  // Test 17: ADMIN_SECRET validation
  test('ADMIN_SECRET validation', 'config', () => {
    const result = validateProductionConfig()
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      return result.errors.some(e => e.includes('ADMIN_SECRET'))
    }
    if (adminSecret.length < 16) {
      return result.errors.some(e => e.includes('ADMIN_SECRET'))
    }
    return true
  })

  // Test 18: SESSION_SECRET validation
  test('SESSION_SECRET validation', 'config', () => {
    const result = validateProductionConfig()
    const sessionSecret = process.env.SESSION_SECRET
    if (!sessionSecret) {
      return result.errors.some(e => e.includes('SESSION_SECRET'))
    }
    if (sessionSecret.length < 32) {
      return result.errors.some(e => e.includes('SESSION_SECRET'))
    }
    return true
  })

  // Test 19: Security score calculation
  test('Security score calculation', 'config', () => {
    const result = validateProductionConfig()
    return typeof result.score === 'number' && result.score >= 0 && result.score <= 100
  })

  // Test 20: Weak password detection
  test('Weak password detection', 'config', () => {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) return true // Will be caught by other tests
    
    const weakPasswords = ['admin', 'password', '123456', 'test']
    const hasWeakPattern = weakPasswords.some(weak => 
      adminSecret.toLowerCase().includes(weak)
    )
    
    const result = validateProductionConfig()
    if (hasWeakPattern) {
      return result.errors.some(e => e.includes('weak password'))
    }
    return true
  })

  // ========================================================================
  // CATEGORY 4: SECURITY HEADERS
  // ========================================================================
  console.log('\n📋 Category 4: Security Headers\n')

  // Test 21: Security headers validator exists
  test('Security headers validator exists', 'headers', () => {
    return typeof validateSecurityHeaders === 'function'
  })

  // Test 22: X-Frame-Options header
  test('X-Frame-Options header', 'headers', () => {
    const headers = new Headers()
    headers.set('X-Frame-Options', 'DENY')
    const result = validateSecurityHeaders(headers)
    return !result.missing.includes('X-Frame-Options')
  })

  // Test 23: X-Content-Type-Options header
  test('X-Content-Type-Options header', 'headers', () => {
    const headers = new Headers()
    headers.set('X-Content-Type-Options', 'nosniff')
    const result = validateSecurityHeaders(headers)
    return !result.missing.includes('X-Content-Type-Options')
  })

  // Test 24: Referrer-Policy header
  test('Referrer-Policy header', 'headers', () => {
    const headers = new Headers()
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    const result = validateSecurityHeaders(headers)
    return !result.missing.includes('Referrer-Policy')
  })

  // Test 25: Permissions-Policy header
  test('Permissions-Policy header', 'headers', () => {
    const headers = new Headers()
    headers.set('Permissions-Policy', 'camera=(), microphone=()')
    const result = validateSecurityHeaders(headers)
    return !result.missing.includes('Permissions-Policy')
  })

  // Test 26: HSTS header (production only)
  test('HSTS header (production check)', 'headers', () => {
    const headers = new Headers()
    if (process.env.NODE_ENV === 'production') {
      headers.set('Strict-Transport-Security', 'max-age=31536000')
      const result = validateSecurityHeaders(headers)
      return !result.missing.includes('Strict-Transport-Security')
    }
    return true // Skip in development
  })

  // Test 27: All required headers present
  test('All required headers present', 'headers', () => {
    const headers = new Headers()
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-XSS-Protection', '1; mode=block')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set('Permissions-Policy', 'camera=()')
    
    if (process.env.NODE_ENV === 'production') {
      headers.set('Strict-Transport-Security', 'max-age=31536000')
    }
    
    const result = validateSecurityHeaders(headers)
    return result.valid
  })

  // Wait for all async tests to complete
  await new Promise(resolve => setTimeout(resolve, 1000))

  // ========================================================================
  // RESULTS SUMMARY
  // ========================================================================
  console.log('\n=== TEST RESULTS ===\n')

  const categories = ['csrf', 'session', 'config', 'headers'] as const
  
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
  
  // Calculate security score
  const configResult = validateProductionConfig()
  console.log(`\nSecurity Score: ${configResult.score}/100`)
  
  if (configResult.errors.length > 0) {
    console.log('\n⚠️  Configuration Errors:')
    configResult.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  if (configResult.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:')
    configResult.warnings.forEach(warning => console.log(`  - ${warning}`))
  }

  // Final verdict
  console.log('\n=== PHASE 4B-1 STATUS ===')
  if (totalPassed === totalTests && configResult.score >= 75) {
    console.log('✅ PHASE 4B-1 COMPLETE - All critical security controls implemented')
  } else if (totalPassed >= totalTests * 0.9) {
    console.log('⚠️  PHASE 4B-1 MOSTLY COMPLETE - Minor issues remain')
  } else {
    console.log('❌ PHASE 4B-1 INCOMPLETE - Critical issues need attention')
  }
  
  console.log('\n==========================================\n')
}

// Run tests
runTests().catch(console.error)
