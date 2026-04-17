/**
 * ADMIN LOGOUT API - Session Cleanup
 * 
 * Security Features:
 * - CSRF protection
 * - Deletes session from store
 * - Audit logging for logout events
 * - Clears secure session cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, validateSession } from '@/lib/auth/session-manager'
import { auditLog } from '@/lib/auth/audit-logger'
import { validateRequestCsrf } from '@/lib/security/csrf'
import { hashToken } from '@/lib/auth/session-manager'

const COOKIE_NAME = 'sia_admin_session'

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Validate session first
    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Validate CSRF token
    const hashedToken = await hashToken(sessionToken)
    const csrfValidation = await validateRequestCsrf(request, hashedToken)
    
    if (!csrfValidation.valid) {
      await auditLog('csrf_failed', 'failure', {
        userId: session.userId,
        ipAddress: clientIp,
        userAgent,
        reason: `CSRF validation failed: ${csrfValidation.reason}`,
      })
      
      return NextResponse.json(
        { error: 'CSRF validation failed', reason: csrfValidation.reason },
        { status: 403 }
      )
    }

    // Delete session from store
    await deleteSession(sessionToken)

    // Log logout event
    await auditLog('logout', 'success', {
      userId: 'admin',
      ipAddress: clientIp,
      userAgent,
    })

    // Clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    return response

  } catch (error) {
    console.error('[ADMIN-LOGOUT] Error:', error)
    
    await auditLog('logout', 'failure', {
      ipAddress: clientIp,
      userAgent,
      reason: 'Logout error',
    })
    
    // Still clear cookie even if session deletion fails
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  }
}
