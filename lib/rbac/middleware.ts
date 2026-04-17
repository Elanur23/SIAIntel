/**
 * RBAC Middleware
 * 
 * Role-Based Access Control for API routes.
 * Prevents privilege escalation attacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export type UserRole = 'viewer' | 'editor' | 'admin'

export interface RBACConfig {
  allowedRoles: UserRole[]
  requireAuth?: boolean
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole)
}

/**
 * Get role hierarchy level (higher = more privileges)
 */
export function getRoleLevel(role: string): number {
  const levels: Record<string, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  }
  return levels[role] || 0
}

/**
 * RBAC Middleware Factory
 * 
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireRole(request, ['admin'])
 *   if (authResult.error) {
 *     return authResult.error
 *   }
 *   
 *   const { user } = authResult
 *   // ... your logic
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{
  user?: { id: string; role: string; username?: string }
  error?: NextResponse
}> {
  try {
    // Get token from request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    const userRole = token.role as string
    const userId = token.id as string

    // Validate role exists and is not tampered
    if (!userRole || !userId) {
      return {
        error: NextResponse.json(
          { error: 'Invalid session data' },
          { status: 401 }
        ),
      }
    }

    // Check if user has required role
    if (!hasRole(userRole, allowedRoles)) {
      return {
        error: NextResponse.json(
          {
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole,
          },
          { status: 403 }
        ),
      }
    }

    return {
      user: {
        id: userId,
        role: userRole,
        username: token.name as string | undefined,
      },
    }
  } catch (error) {
    console.error('[RBAC] Middleware error:', error)
    return {
      error: NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Check if role can be elevated to target role
 * Used to prevent privilege escalation
 */
export function canElevateRole(
  currentRole: string,
  targetRole: string
): boolean {
  const currentLevel = getRoleLevel(currentRole)
  const targetLevel = getRoleLevel(targetRole)

  // Can only elevate to same or lower level
  // Admin can create any role, editor can create viewer, viewer cannot create anyone
  return currentLevel >= targetLevel
}
