/**
 * 2FA SETUP API - Initialize TOTP for Admin
 * 
 * Security:
 * - Requires existing authenticated session
 * - Rate limited (AUTH tier: 5 req/15min)
 * - Generates QR code for authenticator apps
 * - Audit logged
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session-manager'
import { checkRateLimit } from '@/lib/auth/rate-limiter'
import { auditLog } from '@/lib/auth/audit-logger'
import { generateTotpSecret, generateTotpQrCodeUrl } from '@/lib/auth/totp-manager'

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
    const rateLimitResult = await checkRateLimit(clientIp, '2fa_setup')
    if (!rateLimitResult.allowed) {
      await auditLog('rate_limit_triggered', 'failure', {
        userId: session.userId,
        ipAddress: clientIp,
        userAgent,
        reason: '2FA setup rate limit exceeded',
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

    // 3. Generate TOTP secret
    const secret = generateTotpSecret()
    
    // 4. Generate QR code URL
    const qrCodeUrl = generateTotpQrCodeUrl(secret, session.userId, 'SIA Intelligence')

    // 5. Log setup initiation
    await auditLog('2fa_setup_started', 'success', {
      userId: session.userId,
      ipAddress: clientIp,
      userAgent,
    })

    // 6. Return secret and QR code (user must verify before enabling)
    return NextResponse.json({
      success: true,
      secret,
      qrCodeUrl,
      message: 'Scan QR code with your authenticator app, then verify with a code to enable 2FA',
    })

  } catch (error) {
    console.error('[2FA-SETUP] Error:', error)
    
    return NextResponse.json(
      { success: false, error: '2FA setup failed. Please try again.' },
      { status: 500 }
    )
  }
}
