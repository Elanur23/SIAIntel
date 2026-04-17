/**
 * AUDIT TAXONOMY - Complete Event Type Definitions
 * 
 * Centralized taxonomy for all security and admin events
 * Ensures consistent logging across the application
 */

export type AuditEventType =
  // Authentication Events
  | 'login_success'
  | 'login_failed'
  | 'logout'
  
  // Session Events
  | 'session_created'
  | 'session_expired'
  | 'session_rotated'
  | 'session_invalidated'
  
  // 2FA Events (Phase X-1)
  | '2fa_setup_started'
  | '2fa_enabled'
  | '2fa_verified'
  | '2fa_failed'
  | '2fa_disabled'
  | 'backup_code_used'
  | 'backup_codes_generated'
  | 'backup_codes_regenerated'
  
  // RBAC Events (Phase X-4)
  | 'permission_denied'
  | 'role_changed'
  | 'permission_changed'
  | 'user_created'
  | 'user_disabled'
  | 'user_enabled'
  | 'role_assignment_failed'
  | 'unauthorized_admin_attempt'
  
  // Security Events
  | 'csrf_failed'
  | 'rate_limit_triggered'
  | 'protected_route_denied'
  | 'suspicious_activity_detected'
  
  // Admin Actions
  | 'admin_action_publish'
  | 'admin_action_delete'
  | 'admin_action_update'
  | 'admin_action_settings'
  | 'admin_action_bulk_delete'
  
  // System Events
  | 'config_validation_failed'
  | 'secret_change'
  | 'session_cleanup'
  
  // Bot Detection Events (Phase X-2)
  | 'bot_detected'
  | 'bot_risk_elevated'
  | 'captcha_required'
  | 'captcha_verified'
  | 'captcha_failed'
  | 'waf_block_suspected'

export type AuditEventResult = 'success' | 'failure'

export type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Structured audit log entry
 */
export interface AuditLogEntry {
  // Core fields
  timestamp: Date
  eventType: AuditEventType
  result: AuditEventResult
  severity: AuditEventSeverity
  
  // Identity
  userId?: string
  sessionId?: string
  
  // Network
  ipAddress?: string
  userAgent?: string
  
  // Context
  route?: string
  path?: string
  
  // Error details
  reason?: string
  errorCode?: string
  
  // Risk assessment
  riskScore?: number
  
  // Additional metadata (safe, no secrets)
  metadata?: Record<string, any>
}

/**
 * Get severity for event type
 */
export function getEventSeverity(eventType: AuditEventType, result: AuditEventResult): AuditEventSeverity {
  // Critical events
  if (eventType === 'suspicious_activity_detected') return 'critical'
  if (eventType === 'config_validation_failed') return 'critical'
  if (eventType === 'session_invalidated') return 'critical'
  
  // Error events
  if (result === 'failure') {
    if (eventType === 'login_failed') return 'warning'
    if (eventType === 'csrf_failed') return 'error'
    if (eventType === 'protected_route_denied') return 'warning'
    return 'error'
  }
  
  // Warning events
  if (eventType === 'rate_limit_triggered') return 'warning'
  if (eventType === 'session_expired') return 'warning'
  
  // Info events (success)
  return 'info'
}

/**
 * Validate audit log entry (ensure no secrets)
 */
export function sanitizeAuditEntry(entry: AuditLogEntry): AuditLogEntry {
  const sanitized = { ...entry }
  
  // Remove any fields that might contain secrets
  if (sanitized.metadata) {
    const safeMetadata: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(sanitized.metadata)) {
      // Skip sensitive fields
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('credential')
      ) {
        safeMetadata[key] = '[REDACTED]'
      } else {
        safeMetadata[key] = value
      }
    }
    
    sanitized.metadata = safeMetadata
  }
  
  return sanitized
}

/**
 * Format audit entry as JSON string
 */
export function formatAuditEntry(entry: AuditLogEntry): string {
  const sanitized = sanitizeAuditEntry(entry)
  return JSON.stringify({
    timestamp: sanitized.timestamp.toISOString(),
    eventType: sanitized.eventType,
    result: sanitized.result,
    severity: sanitized.severity,
    userId: sanitized.userId,
    sessionId: sanitized.sessionId,
    ipAddress: sanitized.ipAddress,
    userAgent: sanitized.userAgent,
    route: sanitized.route,
    path: sanitized.path,
    reason: sanitized.reason,
    errorCode: sanitized.errorCode,
    riskScore: sanitized.riskScore,
    metadata: sanitized.metadata,
  })
}

/**
 * Event type descriptions for documentation
 */
export const EVENT_DESCRIPTIONS: Record<AuditEventType, string> = {
  // Authentication
  login_success: 'User successfully authenticated',
  login_failed: 'Authentication attempt failed',
  logout: 'User logged out',
  
  // Session
  session_created: 'New session created',
  session_expired: 'Session expired (idle or absolute timeout)',
  session_rotated: 'Session token rotated for security',
  session_invalidated: 'Session forcefully invalidated',
  
  // 2FA (Phase X-1)
  '2fa_setup_started': '2FA setup process initiated',
  '2fa_enabled': '2FA successfully enabled for user',
  '2fa_verified': '2FA code successfully verified',
  '2fa_failed': '2FA verification failed',
  '2fa_disabled': '2FA disabled for user',
  backup_code_used: 'Backup recovery code used',
  backup_codes_generated: 'New backup codes generated',
  backup_codes_regenerated: 'Backup codes regenerated (old codes invalidated)',
  
  // RBAC (Phase X-4)
  permission_denied: 'User attempted action without required permission',
  role_changed: 'User role was changed',
  permission_changed: 'Permission configuration changed',
  user_created: 'New user account created',
  user_disabled: 'User account disabled',
  user_enabled: 'User account enabled',
  role_assignment_failed: 'Role assignment attempt failed',
  unauthorized_admin_attempt: 'Unauthorized admin access attempt',
  
  // Security
  csrf_failed: 'CSRF token validation failed',
  rate_limit_triggered: 'Rate limit exceeded',
  protected_route_denied: 'Access denied to protected route',
  suspicious_activity_detected: 'Suspicious activity pattern detected',
  
  // Admin Actions
  admin_action_publish: 'Admin published content',
  admin_action_delete: 'Admin deleted content',
  admin_action_update: 'Admin updated content',
  admin_action_settings: 'Admin changed settings',
  admin_action_bulk_delete: 'Admin performed bulk delete',
  
  // System
  config_validation_failed: 'Configuration validation failed',
  secret_change: 'Security secret changed',
  session_cleanup: 'Expired sessions cleaned up',
  
  // Bot Detection (Phase X-2)
  bot_detected: 'Bot or automation detected',
  bot_risk_elevated: 'Bot risk score elevated',
  captcha_required: 'CAPTCHA challenge required',
  captcha_verified: 'CAPTCHA successfully verified',
  captcha_failed: 'CAPTCHA verification failed',
  waf_block_suspected: 'WAF block suspected',
}
