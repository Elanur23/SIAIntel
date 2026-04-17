/**
 * 2FA ENABLE API - Verify and Enable TOTP
 * 
 * Security:
 * - Requires existing authenticated session
 * - Verifies TOTP code before enabling
 * - Generates backup codes
 * - Rate limited (AUTH tier: 5 req/15min)
 * - Audit logged
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session-manager'
import { checkRateLimit } from '@/lib/auth/rate-limiter'
import { auditLog } from '@/lib/auth/audit-logger'
import { verifyTotpCode, enableTwoFactor } from '@/lib/auth/totp-manager'
import { generateBackupCodes } from '@/lib/auth/backup-codes'

const COOKIE_NAME = 'sia_admin_session'

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // 1. Validate existing session
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(clientIp, '2fa_enable')
    if (!rateLimitResult.allowed) {
      await auditLog('rate_limit_triggered', 'failure', {
        userId: session.userId,
        ipAddress: clientIp,
        userAgent,
        reason: '2FA enable rate limit exceeded',
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    // 3. Parse request
    const body = await request.json()
    const { secret, code } = body

    if (!secret || !code) {
      return NextResponse.json(
        { success: false, error: 'Secret and code are required' },
        { status: 400 }
      )
    }

    // 4. Verify TOTP code
    const isValid = await verifyTotpCode(secret, code)
    
    if (!isValid) {
      await auditLog('2fa_failed', 'failure', {
        userId: session.userId,
        ipAddress: clientIp,
        userAgent,
        reason: 'Invalid verification code during setup',
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      )
    }

    // 5. Enable 2FA for user
    await enableTwoFactor(session.userId, secret, clientIp, userAgent)

    // 6. Generate backup codes
    const backupCodes = await generateBackupCodes(session.userId, clientIp, userAgent)

    // 7. Return success with backup codes
    return NextResponse.json({
      success: true,
      backupCodes,
      message: '2FA enabled successfully. Save your backup codes in a secure location.',
    })

  } catch (error) {
    console.error('[2FA-ENABLE] Error:', error)
    
    return NextResponse.json(
      { success: false, error: '2FA enable failed. Please try again.' },
      { status: 500 }
    )
  }
}
