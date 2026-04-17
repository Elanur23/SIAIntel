import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session-manager'

export interface PermissionAuthResult {
  userId: string
  role: 'admin' | 'service'
  permissions: string[]
}

export interface AuthOrApiKeyResult {
  userId: string
  method: 'session' | 'apikey'
  apiKey?: string
}

type AuthFailure = NextResponse

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader) {
    return null
  }

  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) {
    return null
  }

  return authHeader.slice(prefix.length).trim() || null
}

function getSessionToken(request: NextRequest): string | null {
  return (
    request.cookies.get('sia_admin_session')?.value ||
    request.cookies.get('session')?.value ||
    getBearerToken(request)
  )
}

function getKnownApiKeys(): string[] {
  return [
    process.env.AI_API_KEY,
    process.env.NEXT_PUBLIC_AI_API_KEY,
    process.env.NEURAL_SEARCH_API_KEY,
    process.env.SIA_INTERNAL_API_KEY,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0))
}

function isValidApiKey(apiKey: string | null): boolean {
  if (!apiKey) {
    return false
  }

  const known = getKnownApiKeys()

  // In development, allow non-empty API keys to keep local tooling operable.
  if (known.length === 0 && process.env.NODE_ENV !== 'production') {
    return apiKey.trim().length > 0
  }

  return known.includes(apiKey)
}

function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  )
}

export async function requireApiPermission(
  request: NextRequest,
  permission: string
): Promise<PermissionAuthResult | AuthFailure> {
  const apiKey = request.headers.get('x-api-key')
  if (isValidApiKey(apiKey)) {
    return {
      userId: 'api-key-service',
      role: 'service',
      permissions: [permission],
    }
  }

  const token = getSessionToken(request)
  if (!token) {
    return unauthorizedResponse('Authentication required')
  }

  const session = await validateSession(token)
  if (!session) {
    return unauthorizedResponse('Invalid or expired session')
  }

  return {
    userId: session.userId,
    role: 'admin',
    permissions: [permission],
  }
}

export async function requireAuthOrApiKey(
  request: NextRequest
): Promise<AuthOrApiKeyResult | AuthFailure> {
  const token = getSessionToken(request)
  if (token) {
    const session = await validateSession(token)
    if (session) {
      return {
        userId: session.userId,
        method: 'session',
      }
    }
  }

  const apiKey = request.headers.get('x-api-key')
  if (isValidApiKey(apiKey)) {
    return {
      userId: 'api-key-service',
      method: 'apikey',
      apiKey: apiKey || undefined,
    }
  }

  return unauthorizedResponse('Valid admin session or API key required')
}
