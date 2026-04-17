/**
 * Production Deployment Verification Script
 * 
 * Verifies that all critical systems are working after deployment.
 * 
 * Usage:
 *   npm run verify:production
 *   
 * Or with custom URL:
 *   SITE_URL=https://your-domain.com npm run verify:production
 */

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: string
}

const results: CheckResult[] = []

function printResult(result: CheckResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.details) {
    console.log(`   ${result.details}`)
  }
}

async function checkSecurityHeaders(): Promise<CheckResult> {
  try {
    const response = await fetch(SITE_URL, { method: 'HEAD' })
    const headers = response.headers

    const requiredHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
    ]

    const missing = requiredHeaders.filter(h => !headers.get(h))

    if (missing.length === 0) {
      return {
        name: 'Security Headers',
        status: 'pass',
        message: 'All required security headers present',
      }
    } else {
      return {
        name: 'Security Headers',
        status: 'fail',
        message: `Missing ${missing.length} headers`,
        details: `Missing: ${missing.join(', ')}`,
      }
    }
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'fail',
      message: 'Failed to check headers',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkHSTS(): Promise<CheckResult> {
  try {
    const response = await fetch(SITE_URL, { method: 'HEAD' })
    const hsts = response.headers.get('strict-transport-security')

    if (hsts && hsts.includes('max-age')) {
      return {
        name: 'HSTS Header',
        status: 'pass',
        message: 'HSTS enabled',
        details: hsts,
      }
    } else if (process.env.NODE_ENV !== 'production') {
      return {
        name: 'HSTS Header',
        status: 'warn',
        message: 'HSTS not enabled (expected in development)',
      }
    } else {
      return {
        name: 'HSTS Header',
        status: 'fail',
        message: 'HSTS not enabled in production',
      }
    }
  } catch (error) {
    return {
      name: 'HSTS Header',
      status: 'fail',
      message: 'Failed to check HSTS',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkDatabaseConnection(): Promise<CheckResult> {
  try {
    // Dynamic import to avoid build-time errors
    const { prisma } = await import('../lib/db/turso')
    
    await prisma.$queryRaw`SELECT 1`
    
    const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')
    
    return {
      name: 'Database Connection',
      status: 'pass',
      message: `Connected to ${isTurso ? 'Turso' : 'SQLite'}`,
      details: isTurso ? process.env.TURSO_DATABASE_URL : 'file:./dev.db',
    }
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkRedisConnection(): Promise<CheckResult> {
  try {
    if (!process.env.REDIS_URL) {
      return {
        name: 'Redis Connection',
        status: 'warn',
        message: 'REDIS_URL not configured',
        details: 'BullMQ worker will not function',
      }
    }

    // Try to connect to Redis
    const Redis = (await import('ioredis')).default
    const redis = new Redis(process.env.REDIS_URL)
    
    await redis.ping()
    await redis.quit()

    return {
      name: 'Redis Connection',
      status: 'pass',
      message: 'Redis connected',
      details: process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@'), // Hide password
    }
  } catch (error) {
    return {
      name: 'Redis Connection',
      status: 'fail',
      message: 'Redis connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkAuthEndpoints(): Promise<CheckResult> {
  try {
    // Check login page
    const loginResponse = await fetch(`${SITE_URL}/admin/login`)
    
    if (loginResponse.status === 200) {
      return {
        name: 'Auth Endpoints',
        status: 'pass',
        message: 'Login page accessible',
      }
    } else {
      return {
        name: 'Auth Endpoints',
        status: 'fail',
        message: `Login page returned ${loginResponse.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'Auth Endpoints',
      status: 'fail',
      message: 'Failed to check auth endpoints',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkEnvironmentVariables(): Promise<CheckResult> {
  const required = [
    'NEXTAUTH_SECRET',
    'SESSION_SECRET',
    'DATABASE_URL',
  ]

  const missing = required.filter(v => !process.env[v])

  if (missing.length === 0) {
    return {
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required variables set',
    }
  } else {
    return {
      name: 'Environment Variables',
      status: 'fail',
      message: `Missing ${missing.length} required variables`,
      details: `Missing: ${missing.join(', ')}`,
    }
  }
}

async function checkSSL(): Promise<CheckResult> {
  if (!SITE_URL.startsWith('https://')) {
    return {
      name: 'SSL Certificate',
      status: 'warn',
      message: 'Not using HTTPS',
      details: 'Expected in development, required in production',
    }
  }

  try {
    const response = await fetch(SITE_URL)
    
    if (response.ok) {
      return {
        name: 'SSL Certificate',
        status: 'pass',
        message: 'HTTPS working',
      }
    } else {
      return {
        name: 'SSL Certificate',
        status: 'fail',
        message: `HTTPS returned ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'SSL Certificate',
      status: 'fail',
      message: 'SSL verification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkCronEndpoint(): Promise<CheckResult> {
  try {
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      return {
        name: 'Cron Endpoint',
        status: 'warn',
        message: 'CRON_SECRET not set',
        details: 'Cron jobs will not be protected',
      }
    }

    const response = await fetch(`${SITE_URL}/api/cron/audit-cleanup`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    })

    if (response.ok) {
      return {
        name: 'Cron Endpoint',
        status: 'pass',
        message: 'Cron endpoint accessible',
      }
    } else {
      return {
        name: 'Cron Endpoint',
        status: 'fail',
        message: `Cron endpoint returned ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'Cron Endpoint',
      status: 'fail',
      message: 'Failed to check cron endpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function main() {
  console.log('🔍 Production Deployment Verification\n')
  console.log(`Target: ${SITE_URL}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`)
  console.log('='.repeat(60))

  // Run all checks
  results.push(await checkEnvironmentVariables())
  results.push(await checkSSL())
  results.push(await checkSecurityHeaders())
  results.push(await checkHSTS())
  results.push(await checkDatabaseConnection())
  results.push(await checkRedisConnection())
  results.push(await checkAuthEndpoints())
  results.push(await checkCronEndpoint())

  console.log()

  // Print results
  results.forEach(printResult)

  // Summary
  console.log('\n' + '='.repeat(60))
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${warned} warnings`)

  if (failed > 0) {
    console.log('\n❌ Deployment verification FAILED')
    console.log('Fix the issues above before going to production')
    process.exit(1)
  } else if (warned > 0) {
    console.log('\n⚠️  Deployment verification passed with warnings')
    console.log('Review warnings before going to production')
    process.exit(0)
  } else {
    console.log('\n✅ Deployment verification PASSED')
    console.log('All systems operational!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('\n❌ Verification script failed:', error)
  process.exit(1)
})
