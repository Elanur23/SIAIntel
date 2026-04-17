/**
 * CSRF TOKEN GENERATION API
 * 
 * Generates CSRF tokens for authenticated admin sessions
 * Tokens are session-bound and expire after 1 hour
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session-manager'
import { generateCsrfToken } from '@/lib/security/csrf'

const COOKIE_NAME = 'sia_admin_session'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Validate session
    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Generate CSRF token bound to session
    const csrfToken = await generateCsrfToken(session.hashedToken)

    return NextResponse.json({
      success: true,
      csrfToken,
      expiresIn: 3600, // 1 hour in seconds
    })

  } catch (error) {
    console.error('[CSRF-TOKEN] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
