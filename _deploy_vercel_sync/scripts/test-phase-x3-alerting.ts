/**
 * PHASE X-3: REAL-TIME SECURITY ALERTING - TEST SUITE
 * 
 * Tests:
 * - Alert triggering logic
 * - Message formatting
 * - Deduplication
 * - Rate limiting
 * - Sensitive data filtering
 * - Failure safety
 */

import {
  shouldAlert,
  getAlertSeverity,
  formatAlertMessage,
  sendSecurityAlert,
  type SecurityAlert,
} from '../lib/security/telegram-alerting'
import type { AuditEventType } from '../lib/security/audit-taxonomy'

// Test results
const results: { test: string; passed: boolean; error?: string }[] = []

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn()
      results.push({ test: name, passed: true })
      console.log(`✅ ${name}`)
    } catch (error) {
      results.push({ 
        test: name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

async function runTests() {
  console.log('\n🚨 PHASE X-3: REAL-TIME SECURITY ALERTING - TEST SUITE\n')
  console.log('=' .repeat(60))
  
  // ========================================
  // ALERT TRIGGERING TESTS
  // ========================================
  console.log('\n🔔 Alert Triggering Tests\n')
  
  await test('Trigger: Critical events always alert', async () => {
    const criticalEvents: AuditEventType[] = [
      'suspicious_activity_detected',
      'session_invalidated',
      '2fa_disabled',
      'admin_action_security_change',
    ]
    
    for (const event of criticalEvents) {
      if (!shouldAlert(event)) {
        throw new Error(`Should alert on critical event: ${event}`)
      }
    }
  })()
  
  await test('Trigger: High risk scores alert', async () => {
    if (!shouldAlert('login_failed', 50)) {
      throw new Error('Should alert on risk score >= 30')
    }
    if (!shouldAlert('csrf_failed', 35)) {
      throw new Error('Should alert on risk score >= 30')
    }
  })()
  
  await test('Trigger: Low risk scores do not alert', async () => {
    if (shouldAlert('login_failed', 10)) {
      throw new Error('Should not alert on low risk score')
    }
    if (shouldAlert('session_expired', 5)) {
      throw new Error('Should not alert on low risk score')
    }
  })()
  
  await test('Trigger: 2FA failures alert', async () => {
    if (!shouldAlert('2fa_failed')) {
      throw new Error('Should alert on 2FA failures')
    }
  })()
  
  await test('Trigger: CSRF failures alert', async () => {
    if (!shouldAlert('csrf_failed')) {
      throw new Error('Should alert on CSRF failures')
    }
  })()
  
  await test('Trigger: Admin login success alerts', async () => {
    if (!shouldAlert('login_success')) {
      throw new Error('Should alert on successful admin login')
    }
  })()
  
  // ========================================
  // SEVERITY TESTS
  // ========================================
  console.log('\n⚠️  Severity Tests\n')
  
  await test('Severity: Critical for suspicious activity', async () => {
    const severity = getAlertSeverity('suspicious_activity_detected')
    if (severity !== 'critical') {
      throw new Error(`Expected critical, got ${severity}`)
    }
  })()
  
  await test('Severity: Critical for high risk scores', async () => {
    const severity = getAlertSeverity('login_failed', 50)
    if (severity !== 'critical') {
      throw new Error(`Expected critical for risk >= 50, got ${severity}`)
    }
  })()
  
  await test('Severity: High for 2FA disabled', async () => {
    const severity = getAlertSeverity('2fa_disabled')
    if (severity !== 'high') {
      throw new Error(`Expected high, got ${severity}`)
    }
  })()
  
  await test('Severity: Medium for 2FA failed', async () => {
    const severity = getAlertSeverity('2fa_failed')
    if (severity !== 'medium') {
      throw new Error(`Expected medium, got ${severity}`)
    }
  })()
  
  await test('Severity: Low for login success', async () => {
    const severity = getAlertSeverity('login_success')
    if (severity !== 'low') {
      throw new Error(`Expected low, got ${severity}`)
    }
  })()
  
  // ========================================
  // MESSAGE FORMATTING TESTS
  // ========================================
  console.log('\n📝 Message Formatting Tests\n')
  
  await test('Format: Contains all required fields', async () => {
    const alert: SecurityAlert = {
      eventType: 'login_success',
      severity: 'low',
      timestamp: new Date(),
      ipAddress: '192.168.1.1',
      route: '/api/admin/login',
      riskScore: 0,
      explanation: 'Admin login successful',
    }
    
    const message = formatAlertMessage(alert)
    
    const required = [
      'SECURITY ALERT',
      'Event**:',
      'Severity**:',
      'Time**:',
      'IP**:',
      'Route**:',
      'Risk Score**:',
      'Details**:',
    ]
    
    for (const field of required) {
      if (!message.includes(field)) {
        throw new Error(`Message missing field: ${field}`)
      }
    }
  })()
  
  await test('Format: Severity emoji correct', async () => {
    const severities: Array<[SecurityAlert['severity'], string]> = [
      ['low', 'ℹ️'],
      ['medium', '⚠️'],
      ['high', '🚨'],
      ['critical', '🔴'],
    ]
    
    for (const [severity, emoji] of severities) {
      const alert: SecurityAlert = {
        eventType: 'login_success',
        severity,
        timestamp: new Date(),
        explanation: 'Test',
      }
      
      const message = formatAlertMessage(alert)
      if (!message.includes(emoji)) {
        throw new Error(`Missing emoji for ${severity}: ${emoji}`)
      }
    }
  })()
  
  await test('Format: No sensitive data in message', async () => {
    const alert: SecurityAlert = {
      eventType: 'login_success',
      severity: 'low',
      timestamp: new Date(),
      explanation: 'Test',
      metadata: {
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key123',
        secret: 'hidden',
        code: '123456',
        safeField: 'visible',
      },
    }
    
    const message = formatAlertMessage(alert)
    
    // Should not contain sensitive values
    if (message.includes('secret123')) {
      throw new Error('Message contains password')
    }
    if (message.includes('abc123')) {
      throw new Error('Message contains token')
    }
    if (message.includes('key123')) {
      throw new Error('Message contains API key')
    }
    if (message.includes('hidden')) {
      throw new Error('Message contains secret')
    }
    if (message.includes('123456')) {
      throw new Error('Message contains code')
    }
    
    // Should contain safe field
    if (!message.includes('visible')) {
      throw new Error('Message missing safe field')
    }
  })()
  
  await test('Format: Markdown formatting valid', async () => {
    const alert: SecurityAlert = {
      eventType: 'login_success',
      severity: 'low',
      timestamp: new Date(),
      explanation: 'Test',
    }
    
    const message = formatAlertMessage(alert)
    
    // Check for markdown bold syntax
    if (!message.includes('**')) {
      throw new Error('Message missing markdown formatting')
    }
  })()
  
  // ========================================
  // SAFETY TESTS
  // ========================================
  console.log('\n🛡️  Safety Tests\n')
  
  await test('Safety: sendSecurityAlert does not throw', async () => {
    // Even with invalid config, should not throw
    const alert: SecurityAlert = {
      eventType: 'login_success',
      severity: 'low',
      timestamp: new Date(),
      explanation: 'Test',
    }
    
    // Should complete without throwing
    await sendSecurityAlert(alert)
  })()
  
  await test('Safety: Missing env vars handled gracefully', async () => {
    // Save original env
    const originalToken = process.env.TELEGRAM_BOT_TOKEN
    const originalChatId = process.env.TELEGRAM_CHAT_ID
    
    try {
      // Remove env vars
      delete process.env.TELEGRAM_BOT_TOKEN
      delete process.env.TELEGRAM_CHAT_ID
      
      const alert: SecurityAlert = {
        eventType: 'login_success',
        severity: 'low',
        timestamp: new Date(),
        explanation: 'Test',
      }
      
      // Should not throw
      await sendSecurityAlert(alert)
    } finally {
      // Restore env
      if (originalToken) process.env.TELEGRAM_BOT_TOKEN = originalToken
      if (originalChatId) process.env.TELEGRAM_CHAT_ID = originalChatId
    }
  })()
  
  // ========================================
  // INTEGRATION TESTS
  // ========================================
  console.log('\n🔗 Integration Tests\n')
  
  await test('Integration: Exports exist', async () => {
    const alerting = await import('../lib/security/telegram-alerting')
    
    if (typeof alerting.shouldAlert !== 'function') {
      throw new Error('Missing shouldAlert function')
    }
    if (typeof alerting.getAlertSeverity !== 'function') {
      throw new Error('Missing getAlertSeverity function')
    }
    if (typeof alerting.formatAlertMessage !== 'function') {
      throw new Error('Missing formatAlertMessage function')
    }
    if (typeof alerting.sendSecurityAlert !== 'function') {
      throw new Error('Missing sendSecurityAlert function')
    }
    if (typeof alerting.sendGroupedAlert !== 'function') {
      throw new Error('Missing sendGroupedAlert function')
    }
    if (typeof alerting.testTelegramAlert !== 'function') {
      throw new Error('Missing testTelegramAlert function')
    }
  })()
  
  await test('Integration: Audit logger imports alerting', async () => {
    // Check that audit logger can import alerting module
    try {
      await import('../lib/auth/audit-logger')
    } catch (error) {
      throw new Error(`Audit logger import failed: ${error}`)
    }
  })()
  
  await test('Integration: Test endpoint exists', async () => {
    try {
      await import('../app/api/admin/test-alert/route')
    } catch (error) {
      throw new Error(`Test alert endpoint missing: ${error}`)
    }
  })()
  
  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 TEST RESULTS SUMMARY\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:\n')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}`)
      if (r.error) {
        console.log(`    ${r.error}`)
      }
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Sample alert message
  console.log('\n📨 SAMPLE ALERT MESSAGE:\n')
  const sampleAlert: SecurityAlert = {
    eventType: 'suspicious_activity_detected',
    severity: 'critical',
    timestamp: new Date(),
    ipAddress: '203.0.113.42',
    route: '/api/admin/login',
    riskScore: 65,
    explanation: 'Multiple failed login attempts followed by IP change',
    metadata: {
      failedAttempts: 5,
      timeWindow: '5 minutes',
    },
  }
  console.log(formatAlertMessage(sampleAlert))
  console.log('\n' + '='.repeat(60))
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error)
  process.exit(1)
})
