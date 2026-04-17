/**
 * 2FA VERIFY API - Verify TOTP or Backup Code During Login
 * 
 * Security:
 * - Requires pending 2FA session (password verified, 2FA pending)
 * - Rate limited (AUTH tier: 5 req/15min)
 * - Supports both TOTP codes and backup codes
 * - Audit logged
 * - Only creates final session after successful 2FA
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/auth/rate-limiter'
import { auditLog } from '@/lib/auth/audit-logger'
import { verifyUserTotpCode } from '@/lib/auth/totp-manager'
import { verifyBackupCode } from '@/lib/auth/backup-codes'
import { prisma } from '@/lib/db/prisma'
import { hashToken } from '@/lib/auth/session-manager'

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // 1. Parse request
    const body = await request.json()
    const { sessionToken, code, useBackupCode } = body

    if (!sessionToken || !code) {
      return NextResponse.json(
        { success: false, error: 'Session token and code are required' },
        { status: 400 }
      )
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(clientIp, '2fa_verify')
    if (!rateLimitResult.allowed) {
      await auditLog('rate_limit_triggered', 'failure', {
        ipAddress: clientIp,
        userAgent,
        reason: '2FA verify rate limit exceeded',
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

    // 3. Validate pending session
    const hashedToken = await hashToken(sessionToken)
    const session = await prisma.session.findUnique({
      where: { hashedToken },
    })

    if (!session || session.twoFactorVerified) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // 4. Verify code (TOTP or backup)
    let isValid = false
    
    if (useBackupCode) {
      isValid = await verifyBackupCode(session.userId, code, clientIp, userAgent)
    } else {
      isValid = await verifyUserTotpCode(session.userId, code, clientIp, userAgent)
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 401 }
      )
    }

    // 5. Mark session as 2FA verified
    await prisma.session.update({
      where: { hashedToken },
      data: { twoFactorVerified: true },
    })

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
    })

  } catch (error) {
    console.error('[2FA-VERIFY] Error:', error)
    
    return NextResponse.json(
      { success: false, error: '2FA verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
