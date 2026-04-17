/**
 * 2FA Recovery Code Verification API
 * 
 * Allows users to log in using a recovery code when 2FA device is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { useRecoveryCode } from '@/lib/auth/recovery-codes'
import { logAuditEvent } from '@/lib/auth/audit-logger'
import { createSession } from '@/lib/auth/session-manager'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, recoveryCode } = body

    // Validate input
    if (!username || !password || !recoveryCode) {
      return NextResponse.json(
        { error: 'Username, password, and recovery code are required' },
        { status: 400 }
      )
    }

    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.enabled) {
      await logAuditEvent({
        action: '2FA_RECOVERY_FAILED',
        userId: username,
        ipAddress: clientIp,
        success: false,
        errorMessage: 'User not found or disabled',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      await logAuditEvent({
        action: '2FA_RECOVERY_FAILED',
        userId: user.id,
        ipAddress: clientIp,
        success: false,
        errorMessage: 'Invalid password',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      await logAuditEvent({
        action: '2FA_RECOVERY_FAILED',
        userId: user.id,
        ipAddress: clientIp,
        success: false,
        errorMessage: '2FA not enabled',
      })

      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Verify and use recovery code
    const isRecoveryCodeValid = await useRecoveryCode(user.id, recoveryCode)

    if (!isRecoveryCodeValid) {
      await logAuditEvent({
        action: '2FA_RECOVERY_FAILED',
        userId: user.id,
        ipAddress: clientIp,
        success: false,
        errorMessage: 'Invalid recovery code',
      })

      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 401 }
      )
    }

    // Create session
    const session = await createSession({
      userId: user.id,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      twoFactorVerified: true,
    })

    // Log successful recovery
    await logAuditEvent({
      action: '2FA_RECOVERY_USED',
      userId: user.id,
      ipAddress: clientIp,
      success: true,
      metadata: JSON.stringify({
        method: 'recovery_code',
        username: user.username,
      }),
    })

    return NextResponse.json({
      success: true,
      sessionToken: session.token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      warning: 'Recovery code used. Please regenerate your recovery codes.',
    })

  } catch (error) {
    console.error('[2FA-RECOVERY] Error:', error)

    return NextResponse.json(
      { error: 'Recovery verification failed' },
      { status: 500 }
    )
  }
}
