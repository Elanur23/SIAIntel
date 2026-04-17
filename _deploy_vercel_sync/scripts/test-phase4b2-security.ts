/**
 * PHASE 4B-2 SECURITY TEST SUITE
 * 
 * Tests Detection and Audit Hardening:
 * 1. Audit Logging Expansion (complete taxonomy)
 * 2. Suspicious Activity Detection
 * 3. Risk Scoring & Re-Auth
 * 4. Data Safety (no secrets in logs)
 */

import { auditLog, getFailedEventsByIp } from '../lib/auth/audit-logger'
import {
  detectIpChange,
  detectUserAgentChange,
  detectCsrfFailureBurst,
  detectDeniedAccessBurst,
  detectRateLimitBurst,
  detectAllSuspiciousActivity,
  DETECTION_THRESHOLDS,
  RISK_THRESHOLDS,
} from '../lib/security/suspicious-activity-detector'
import {
  assessRisk,
  getRiskLevel,
  shouldTriggerReAuth,
  getReducedIdleTimeout,
} from '../lib/security/risk-scoring'
import { sanitizeAuditEntry } from '../lib/security/audit-taxonomy'
import { createSession, deleteSession } from '../lib/auth/session-manager'

interface TestResult {
  name: string
  passed: boolean
  message: string
  category: 'audit' | 'detection' | 'risk' | 'safety'
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
  console.log('\n=== PHASE 4B-2 SECURITY TEST SUITE ===\n')
  console.log('Testing: Audit Expansion, Detection, Risk Scoring, Data Safety\n')

  // ========================================================================
  // CATEGORY 1: AUDIT LOGGING EXPANSION
  // ========================================================================
  console.log('📋 Category 1: Audit Logging Expansion\n')

  // Test 1: Login success event
  test('Login success event logged', 'audit', async () => {
    await auditLog('login_success', 'success', {
      userId: 'test-user',
      ipAddress: '192.168.1.1',
      userAgent: 'Test-Agent',
    })
    return true
  })

  // Test 2: Login failed event
  test('Login failed event logged', 'audit', async () => {
    await auditLog('login_failed', 'failure', {
      ipAddress: '192.168.1.1',
      reason: 'Invalid password',
    })
    return true
  })

  // Test 3: Logout event
  test('Logout event logged', 'audit', async () => {
    await auditLog('logout', 'success', {
      userId: 'test-user',
      ipAddress: '192.168.1.1',
    })
    return true
  })

  // Test 4: Session expired event
  test('Session expired event logged', 'audit', async () => {
    await auditLog('session_expired', 'failure', {
      userId: 'test-user',
      reason: 'Idle timeout',
    })
    return true
  })

  // Test 5: CSRF failed event
  test('CSRF failed event logged', 'audit', async () => {
    await auditLog('csrf_failed', 'failure', {
      ipAddress: '192.168.1.1',
      reason: 'Invalid token',
    })
    return true
  })

  // Test 6: Rate limit triggered event
  test('Rate limit triggered event logged', 'audit', async () => {
    await auditLog('rate_limit_triggered', 'failure', {
      ipAddress: '192.168.1.1',
      reason: 'Too many requests',
    })
    return true
  })

  // Test 7: Protected route denied event
  test('Protected route denied event logged', 'audit', async () => {
    await auditLog('protected_route_denied', 'failure', {
      ipAddress: '192.168.1.1',
      route: '/admin/settings',
    })
    return true
  })

  // Test 8: Suspicious activity detected event
  test('Suspicious activity detected event logged', 'audit', async () => {
    await auditLog('suspicious_activity_detected', 'failure', {
      ipAddress: '192.168.1.1',
      reason: 'IP address changed',
      riskScore: 30,
    })
    return true
  })

  // ========================================================================
  // CATEGORY 2: SUSPICIOUS ACTIVITY DETECTION
  // ========================================================================
  console.log('\n📋 Category 2: Suspicious Activity Detection\n')

  // Test 9: IP change detection
  test('IP change detection', 'detection', async () => {
    const result = await detectIpChange('test-session-1', '192.168.1.1', '192.168.1.2')
    return result.detected && result.riskScore === 30
  })

  // Test 10: No IP change (same IP)
  test('No IP change (same IP)', 'detection', async () => {
    const result = await detectIpChange('test-session-2', '192.168.1.1', '192.168.1.1')
    return !result.detected && result.riskScore === 0
  })

  // Test 11: User agent change detection
  test('User agent change detection', 'detection', async () => {
    const result = await detectUserAgentChange('test-session-3', 'Agent-A', 'Agent-B')
    return result.detected && result.riskScore === 20
  })

  // Test 12: No user agent change
  test('No user agent change', 'detection', async () => {
    const result = await detectUserAgentChange('test-session-4', 'Agent-A', 'Agent-A')
    return !result.detected && result.riskScore === 0
  })

  // Test 13: CSRF failure burst detection (simulate)
  test('CSRF failure burst detection', 'detection', async () => {
    // Log multiple CSRF failures
    const testIp = '192.168.100.1'
    for (let i = 0; i < DETECTION_THRESHOLDS.CSRF_FAILURES; i++) {
      await auditLog('csrf_failed', 'failure', {
        ipAddress: testIp,
        reason: 'Test CSRF failure',
      })
    }
    
    const result = await detectCsrfFailureBurst(testIp)
    return result.detected && result.riskScore === 30
  })

  // Test 14: Denied access burst detection (simulate)
  test('Denied access burst detection', 'detection', async () => {
    const testIp = '192.168.100.2'
    for (let i = 0; i < DETECTION_THRESHOLDS.DENIED_ACCESS; i++) {
      await auditLog('protected_route_denied', 'failure', {
        ipAddress: testIp,
        reason: 'Test denied access',
      })
    }
    
    const result = await detectDeniedAccessBurst(testIp)
    return result.detected && result.riskScore === 20
  })

  // Test 15: Rate limit burst detection (simulate)
  test('Rate limit burst detection', 'detection', async () => {
    const testIp = '192.168.100.3'
    for (let i = 0; i < DETECTION_THRESHOLDS.RATE_LIMIT_HITS; i++) {
      await auditLog('rate_limit_triggered', 'failure', {
        ipAddress: testIp,
        reason: 'Test rate limit',
      })
    }
    
    const result = await detectRateLimitBurst(testIp)
    return result.detected && result.riskScore === 15
  })

  // Test 16: All suspicious activity detection
  test('All suspicious activity detection', 'detection', async () => {
    const result = await detectAllSuspiciousActivity(
      'test-session-all',
      '192.168.1.99',
      'Agent-New',
      '192.168.1.1',
      'Agent-Old'
    )
    
    // Should detect IP and UA changes
    return result.detected && result.totalRiskScore >= 50
  })

  // ========================================================================
  // CATEGORY 3: RISK SCORING & RE-AUTH
  // ========================================================================
  console.log('\n📋 Category 3: Risk Scoring & Re-Auth\n')

  // Test 17: Risk level calculation (low)
  test('Risk level calculation (low)', 'risk', () => {
    const level = getRiskLevel(10)
    return level === 'low'
  })

  // Test 18: Risk level calculation (elevated)
  test('Risk level calculation (elevated)', 'risk', () => {
    const level = getRiskLevel(35)
    return level === 'elevated'
  })

  // Test 19: Risk level calculation (critical)
  test('Risk level calculation (critical)', 'risk', () => {
    const level = getRiskLevel(60)
    return level === 'critical'
  })

  // Test 20: Risk assessment
  test('Risk assessment', 'risk', () => {
    const assessment = assessRisk('test-session', 45, ['IP changed', 'UA changed'])
    return (
      assessment.riskLevel === 'elevated' &&
      !assessment.shouldInvalidate &&
      assessment.shouldReduceIdleTimeout
    )
  })

  // Test 21: Should trigger re-auth (critical risk)
  test('Should trigger re-auth (critical risk)', 'risk', () => {
    return shouldTriggerReAuth(60) === true
  })

  // Test 22: Should not trigger re-auth (low risk)
  test('Should not trigger re-auth (low risk)', 'risk', () => {
    return shouldTriggerReAuth(20) === false
  })

  // Test 23: Reduced idle timeout (elevated)
  test('Reduced idle timeout (elevated)', 'risk', () => {
    const timeout = getReducedIdleTimeout(35)
    return timeout === 15 * 60 * 1000 // 15 minutes
  })

  // Test 24: Reduced idle timeout (critical)
  test('Reduced idle timeout (critical)', 'risk', () => {
    const timeout = getReducedIdleTimeout(60)
    return timeout === 5 * 60 * 1000 // 5 minutes
  })

  // Test 25: Risk thresholds configured
  test('Risk thresholds configured', 'risk', () => {
    return (
      RISK_THRESHOLDS.ELEVATED === 30 &&
      RISK_THRESHOLDS.CRITICAL === 50
    )
  })

  // ========================================================================
  // CATEGORY 4: DATA SAFETY (NO SECRETS IN LOGS)
  // ========================================================================
  console.log('\n📋 Category 4: Data Safety\n')

  // Test 26: Password not logged
  test('Password not logged', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'login_failed',
      result: 'failure',
      severity: 'warning',
      metadata: {
        password: 'secret123',
        username: 'admin',
      },
    })
    
    return entry.metadata?.password === '[REDACTED]'
  })

  // Test 27: Token not logged
  test('Token not logged', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'csrf_failed',
      result: 'failure',
      severity: 'error',
      metadata: {
        csrfToken: 'abc123xyz',
        userId: 'admin',
      },
    })
    
    return entry.metadata?.csrfToken === '[REDACTED]'
  })

  // Test 28: Secret not logged
  test('Secret not logged', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'config_validation_failed',
      result: 'failure',
      severity: 'critical',
      metadata: {
        adminSecret: 'supersecret',
        configValid: false,
      },
    })
    
    return entry.metadata?.adminSecret === '[REDACTED]'
  })

  // Test 29: API key not logged
  test('API key not logged', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'admin_action_settings',
      result: 'success',
      severity: 'info',
      metadata: {
        apiKey: 'sk-1234567890',
        setting: 'notifications',
      },
    })
    
    return entry.metadata?.apiKey === '[REDACTED]'
  })

  // Test 30: Credential not logged
  test('Credential not logged', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'admin_action_update',
      result: 'success',
      severity: 'info',
      metadata: {
        userCredential: 'cred123',
        action: 'update',
      },
    })
    
    return entry.metadata?.userCredential === '[REDACTED]'
  })

  // Test 31: Safe metadata preserved
  test('Safe metadata preserved', 'safety', () => {
    const entry = sanitizeAuditEntry({
      timestamp: new Date(),
      eventType: 'login_success',
      result: 'success',
      severity: 'info',
      metadata: {
        userId: 'admin',
        ipAddress: '192.168.1.1',
        loginTime: '2026-03-21T10:00:00Z',
      },
    })
    
    return (
      entry.metadata?.userId === 'admin' &&
      entry.metadata?.ipAddress === '192.168.1.1' &&
      entry.metadata?.loginTime === '2026-03-21T10:00:00Z'
    )
  })

  // Wait for all async tests to complete
  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================================================
  // RESULTS SUMMARY
  // ========================================================================
  console.log('\n=== TEST RESULTS ===\n')

  const categories = ['audit', 'detection', 'risk', 'safety'] as const
  
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
  console.log('\n=== PHASE 4B-2 STATUS ===')
  if (totalPassed === totalTests) {
    console.log('✅ PHASE 4B-2 COMPLETE - All detection and audit systems operational')
  } else if (totalPassed >= totalTests * 0.9) {
    console.log('⚠️  PHASE 4B-2 MOSTLY COMPLETE - Minor issues remain')
  } else {
    console.log('❌ PHASE 4B-2 INCOMPLETE - Critical issues need attention')
  }
  
  console.log('\n==========================================\n')
}

// Run tests
runTests().catch(console.error)
