/**
 * TELEGRAM SECURITY ALERTING - Real-Time Security Monitoring
 * 
 * Features:
 * - Real-time alerts for critical security events
 * - Structured, readable message format
 * - Anti-spam protection (deduplication, rate limiting)
 * - Failure-safe (non-blocking)
 * - No sensitive data in alerts
 * 
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 * - TELEGRAM_CHAT_ID: Chat ID to send alerts to
 */

import { AuditEventType } from './audit-taxonomy'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityAlert {
  eventType: AuditEventType
  severity: AlertSeverity
  timestamp: Date
  ipAddress?: string
  route?: string
  riskScore?: number
  explanation: string
  metadata?: Record<string, any>
}

// Alert deduplication cache (in-memory)
const alertCache = new Map<string, number>()
const DEDUP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ALERTS_PER_HOUR = 50

// Alert rate limiting
let alertCount = 0
let alertCountResetTime = Date.now() + 60 * 60 * 1000

/**
 * Determine if event should trigger alert
 */
export function shouldAlert(eventType: AuditEventType, riskScore?: number): boolean {
  // Always alert on critical events
  const criticalEvents: AuditEventType[] = [
    'suspicious_activity_detected',
    'session_invalidated',
    '2fa_disabled',
    'admin_action_security_change',
  ]
  
  if (criticalEvents.includes(eventType)) {
    return true
  }
  
  // Alert on high risk scores
  if (riskScore && riskScore >= 30) {
    return true
  }
  
  // Alert on failed login bursts (handled by caller)
  if (eventType === 'login_failed') {
    return false // Caller should check burst threshold
  }
  
  // Alert on 2FA failures
  if (eventType === '2fa_failed') {
    return true
  }
  
  // Alert on CSRF failures
  if (eventType === 'csrf_failed') {
    return true
  }
  
  // Alert on repeated denied access
  if (eventType === 'protected_route_denied') {
    return false // Caller should check threshold
  }
  
  // Alert on successful admin login
  if (eventType === 'login_success') {
    return true
  }
  
  return false
}

/**
 * Get alert severity for event
 */
export function getAlertSeverity(
  eventType: AuditEventType,
  riskScore?: number
): AlertSeverity {
  // Critical severity
  if (eventType === 'suspicious_activity_detected') return 'critical'
  if (eventType === 'session_invalidated') return 'critical'
  if (riskScore && riskScore >= 50) return 'critical'
  
  // High severity
  if (eventType === '2fa_disabled') return 'high'
  if (eventType === 'admin_action_security_change') return 'high'
  if (eventType === 'csrf_failed') return 'high'
  if (riskScore && riskScore >= 30) return 'high'
  
  // Medium severity
  if (eventType === '2fa_failed') return 'medium'
  if (eventType === 'login_failed') return 'medium'
  if (eventType === 'protected_route_denied') return 'medium'
  
  // Low severity
  if (eventType === 'login_success') return 'low'
  
  return 'low'
}

/**
 * Format alert message for Telegram
 */
export function formatAlertMessage(alert: SecurityAlert): string {
  const severityEmoji = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔴',
  }[alert.severity]
  
  const lines: string[] = []
  
  // Header
  lines.push(`${severityEmoji} **SECURITY ALERT**`)
  lines.push('')
  
  // Event details
  lines.push(`**Event**: ${alert.eventType}`)
  lines.push(`**Severity**: ${alert.severity.toUpperCase()}`)
  lines.push(`**Time**: ${alert.timestamp.toISOString()}`)
  
  if (alert.ipAddress) {
    lines.push(`**IP**: ${alert.ipAddress}`)
  }
  
  if (alert.route) {
    lines.push(`**Route**: ${alert.route}`)
  }
  
  if (alert.riskScore !== undefined) {
    lines.push(`**Risk Score**: ${alert.riskScore}`)
  }
  
  lines.push('')
  lines.push(`**Details**: ${alert.explanation}`)
  
  // Safe metadata (no secrets)
  if (alert.metadata && Object.keys(alert.metadata).length > 0) {
    lines.push('')
    lines.push('**Additional Info**:')
    for (const [key, value] of Object.entries(alert.metadata)) {
      // Skip sensitive fields
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('code')
      ) {
        continue
      }
      lines.push(`- ${key}: ${value}`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate deduplication key for alert
 */
function getDeduplicationKey(alert: SecurityAlert): string {
  return `${alert.eventType}:${alert.ipAddress || 'unknown'}:${alert.route || 'unknown'}`
}

/**
 * Check if alert should be deduplicated
 */
function shouldDeduplicate(alert: SecurityAlert): boolean {
  const key = getDeduplicationKey(alert)
  const lastSent = alertCache.get(key)
  
  if (!lastSent) {
    return false
  }
  
  const timeSinceLastAlert = Date.now() - lastSent
  return timeSinceLastAlert < DEDUP_WINDOW_MS
}

/**
 * Mark alert as sent (for deduplication)
 */
function markAlertSent(alert: SecurityAlert): void {
  const key = getDeduplicationKey(alert)
  alertCache.set(key, Date.now())
  
  // Cleanup old entries
  const cutoff = Date.now() - DEDUP_WINDOW_MS
  for (const [k, timestamp] of alertCache.entries()) {
    if (timestamp < cutoff) {
      alertCache.delete(k)
    }
  }
}

/**
 * Check rate limit for alerts
 */
function checkRateLimit(): boolean {
  // Reset counter if hour has passed
  if (Date.now() > alertCountResetTime) {
    alertCount = 0
    alertCountResetTime = Date.now() + 60 * 60 * 1000
  }
  
  return alertCount < MAX_ALERTS_PER_HOUR
}

/**
 * Send alert to Telegram
 */
async function sendToTelegram(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  
  if (!botToken || !chatId) {
    console.log('[TELEGRAM-ALERT] Not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)')
    return false
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[TELEGRAM-ALERT] Send failed:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('[TELEGRAM-ALERT] Error sending alert:', error)
    return false
  }
}

/**
 * Send security alert (main function)
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    // Check if alerting is enabled
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      // Silently skip if not configured
      return
    }
    
    // Check deduplication
    if (shouldDeduplicate(alert)) {
      console.log('[TELEGRAM-ALERT] Deduplicated:', alert.eventType)
      return
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      console.log('[TELEGRAM-ALERT] Rate limit exceeded, skipping alert')
      return
    }
    
    // Format message
    const message = formatAlertMessage(alert)
    
    // Send to Telegram (non-blocking)
    const sent = await sendToTelegram(message)
    
    if (sent) {
      markAlertSent(alert)
      alertCount++
      console.log(`[TELEGRAM-ALERT] ✅ Sent ${alert.severity} alert: ${alert.eventType}`)
    }
  } catch (error) {
    // Never throw - alerting must not break the system
    console.error('[TELEGRAM-ALERT] Error:', error)
  }
}

/**
 * Send grouped alert for repeated events
 */
export async function sendGroupedAlert(
  eventType: AuditEventType,
  count: number,
  timeWindow: string,
  ipAddress?: string
): Promise<void> {
  const alert: SecurityAlert = {
    eventType,
    severity: count >= 10 ? 'critical' : count >= 5 ? 'high' : 'medium',
    timestamp: new Date(),
    ipAddress,
    explanation: `${count} ${eventType} events detected in ${timeWindow}`,
    metadata: {
      count,
      timeWindow,
    },
  }
  
  await sendSecurityAlert(alert)
}

/**
 * Test Telegram configuration
 */
export async function testTelegramAlert(): Promise<boolean> {
  const testAlert: SecurityAlert = {
    eventType: 'login_success',
    severity: 'low',
    timestamp: new Date(),
    ipAddress: '127.0.0.1',
    route: '/api/admin/login',
    explanation: 'Test alert - Telegram integration is working correctly',
  }
  
  const message = formatAlertMessage(testAlert)
  return await sendToTelegram(message)
}
