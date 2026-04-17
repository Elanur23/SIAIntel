/**
 * Password Change API
 * 
 * Allows authenticated users to change their password.
 * Enforces password policy and terminates other sessions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { changePassword, terminateOtherSessions } from '@/lib/auth/password-policy'
import { logAuditEvent } from '@/lib/auth/audit-logger'
import { extractClientIP } from '@/lib/security/ip-filter'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = token.id as string

    // Parse request body
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      )
    }

    // Change password
    const result = await changePassword(userId, currentPassword, newPassword)

    if (!result.success) {
      // Log failed attempt
      const clientIP = extractClientIP(request)
      await logAuditEvent({
        action: 'PASSWORD_CHANGE_FAILED',
        userId,
        ipAddress: clientIP,
        success: false,
        errorMessage: result.error,
      })

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Terminate all other sessions
    const terminatedCount = await terminateOtherSessions(userId)

    // Log successful password change
    const clientIP = extractClientIP(request)
    await logAuditEvent({
      action: 'PASSWORD_CHANGED',
      userId,
      ipAddress: clientIP,
      success: true,
      metadata: JSON.stringify({
        terminatedSessions: terminatedCount,
      }),
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      terminatedSessions: terminatedCount,
      warning: terminatedCount > 0
        ? `${terminatedCount} other session(s) have been terminated for security`
        : undefined,
    })

  } catch (error) {
    console.error('[PASSWORD-CHANGE] Error:', error)

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
