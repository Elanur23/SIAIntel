import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken, validateCsrfToken } from '@/lib/security/csrf'

export interface CsrfValidationSuccess {
  valid: true
  sessionId: string
}

type CsrfValidationFailure = NextResponse

function resolveSessionId(request: NextRequest): string | null {
  return (
    request.cookies.get('sia_admin_session')?.value ||
    request.cookies.get('session')?.value ||
    request.headers.get('x-session-id') ||
    request.headers.get('x-forwarded-for') ||
    null
  )
}

export async function csrfTokenResponse(request: NextRequest): Promise<NextResponse> {
  const sessionId = resolveSessionId(request) || 'anonymous-session'
  const token = await generateCsrfToken(sessionId)

  return NextResponse.json({
    success: true,
    csrfToken: token,
    expiresInSeconds: 3600,
  })
}

export async function generateCsrfTokenForSession(request: NextRequest): Promise<boolean> {
  const sessionId = resolveSessionId(request)
  const token = request.headers.get('x-csrf-token')

  if (!sessionId || !token) {
    return false
  }

  const validation = await validateCsrfToken(token, sessionId)
  return validation.valid
}

export async function requireCsrfToken(
  request: NextRequest
): Promise<CsrfValidationSuccess | CsrfValidationFailure> {
  const sessionId = resolveSessionId(request)
  const token = request.headers.get('x-csrf-token')

  if (!sessionId || !token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing CSRF token or session context',
      },
      { status: 403 }
    )
  }

  const validation = await validateCsrfToken(token, sessionId)
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.reason || 'Invalid CSRF token',
      },
      { status: 403 }
    )
  }

  return {
    valid: true,
    sessionId,
  }
}
