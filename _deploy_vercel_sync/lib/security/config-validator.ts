/**
 * PRODUCTION CONFIG VALIDATOR - Fail-Closed Security
 * 
 * Validates environment configuration on startup
 * Fails closed if critical security settings are weak/missing
 */

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100
}

/**
 * Validate production configuration
 * Returns validation result with errors and warnings
 */
export function validateProductionConfig(): ConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100

  // 1. Check ADMIN_SECRET
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    errors.push('ADMIN_SECRET is not set')
    score -= 30
  } else if (adminSecret.length < 16) {
    errors.push(`ADMIN_SECRET is too short (${adminSecret.length} chars, need 16+)`)
    score -= 20
  } else if (adminSecret.length < 32) {
    warnings.push(`ADMIN_SECRET should be 32+ characters (currently ${adminSecret.length})`)
    score -= 5
  }

  // Check for weak passwords
  const weakPasswords = ['admin', 'password', '123456', 'sia2026', 'test']
  if (adminSecret && weakPasswords.some(weak => adminSecret.toLowerCase().includes(weak))) {
    errors.push('ADMIN_SECRET contains common weak password patterns')
    score -= 25
  }

  // 2. Check SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret) {
    errors.push('SESSION_SECRET is not set')
    score -= 30
  } else if (sessionSecret.length < 32) {
    errors.push(`SESSION_SECRET is too short (${sessionSecret.length} chars, need 32+)`)
    score -= 20
  } else if (sessionSecret.length < 48) {
    warnings.push(`SESSION_SECRET should be 48+ characters (currently ${sessionSecret.length})`)
    score -= 5
  }

  // 3. Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV
  if (!nodeEnv) {
    warnings.push('NODE_ENV is not set (defaulting to development)')
    score -= 5
  } else if (nodeEnv === 'production') {
    // Additional production checks
    if (adminSecret && adminSecret.length < 32) {
      errors.push('Production requires ADMIN_SECRET with 32+ characters')
      score -= 15
    }
    if (sessionSecret && sessionSecret.length < 48) {
      errors.push('Production requires SESSION_SECRET with 48+ characters')
      score -= 15
    }
  }

  // 4. Check DATABASE_URL (if using PostgreSQL)
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && !databaseUrl.startsWith('file:')) {
    // Using external database
    if (!databaseUrl.includes('ssl=true') && nodeEnv === 'production') {
      warnings.push('DATABASE_URL should use SSL in production')
      score -= 5
    }
  }

  // 5. Check CSRF configuration
  const csrfEnabled = process.env.CSRF_ENABLED !== 'false'
  if (!csrfEnabled && nodeEnv === 'production') {
    errors.push('CSRF protection should not be disabled in production')
    score -= 20
  }

  // 6. Check rate limiting
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false'
  if (!rateLimitEnabled && nodeEnv === 'production') {
    warnings.push('Rate limiting should be enabled in production')
    score -= 10
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
  }
}

/**
 * Validate and log configuration on startup
 * Throws error if critical issues found in production
 */
export function validateAndEnforceConfig(): void {
  const result = validateProductionConfig()
  
  console.log('\n=== SIA Security Configuration Validation ===')
  console.log(`Score: ${result.score}/100`)
  
  if (result.errors.length > 0) {
    console.error('\n❌ ERRORS:')
    result.errors.forEach(error => console.error(`  - ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  WARNINGS:')
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (result.valid) {
    console.log('\n✅ Configuration valid')
  } else {
    console.error('\n❌ Configuration invalid')
    
    // Fail closed in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Production configuration validation failed. Fix errors before deploying:\n' +
        result.errors.join('\n')
      )
    } else {
      console.warn('\n⚠️  Development mode: Continuing despite errors')
    }
  }
  
  console.log('==========================================\n')
}

/**
 * Get configuration status for admin dashboard
 */
export function getConfigStatus(): {
  environment: string
  securityScore: number
  issues: { type: 'error' | 'warning'; message: string }[]
} {
  const result = validateProductionConfig()
  
  return {
    environment: process.env.NODE_ENV || 'development',
    securityScore: result.score,
    issues: [
      ...result.errors.map(msg => ({ type: 'error' as const, message: msg })),
      ...result.warnings.map(msg => ({ type: 'warning' as const, message: msg })),
    ],
  }
}
