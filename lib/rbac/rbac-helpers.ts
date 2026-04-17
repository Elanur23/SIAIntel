/**
 * RBAC HELPERS - Server-Side Authorization Enforcement
 * 
 * Reusable helpers for checking permissions and enforcing authorization.
 * All privileged actions must use these helpers.
 * 
 * Security:
 * - Server-side only (never trust client)
 * - Session-based (requires valid session)
 * - Audit logged (all denials logged)
 * - Fail-closed (deny by default)
 */

import { prisma } from '@/lib/db/prisma'
import { validateSession } from '@/lib/auth/session-manager'
import { auditLog } from '@/lib/auth/audit-logger'
import { type Permission, type Role, roleHasPermission } from './permissions'

export interface UserWithRole {
  id: string
  username: string
  role: Role
  twoFactorEnabled: boolean
}

/**
 * Get current user with role from session token
 */
export async function getCurrentUserWithRole(
  sessionToken: string
): Promise<UserWithRole | null> {
  // Validate session
  const session = await validateSession(sessionToken)
  if (!session) {
    return null
  }

  // Get user with role
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      role: true,
      twoFactorEnabled: true,
    },
  })

  if (!user) {
    return null
  }

  return user as UserWithRole
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: UserWithRole, permission: Permission): boolean {
  return roleHasPermission(user.role, permission)
}

/**
 * Require permission (throw if not authorized)
 * Use in API routes and server actions
 */
export async function requirePermission(
  sessionToken: string,
  permission: Permission,
  options?: {
    ipAddress?: string
    userAgent?: string
    route?: string
  }
): Promise<UserWithRole> {
  // Get user
  const user = await getCurrentUserWithRole(sessionToken)
  
  if (!user) {
    // Log unauthorized attempt
    await auditLog('unauthorized_admin_attempt', 'failure', {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      route: options?.route,
      reason: 'No valid session',
    })
    
    throw new UnauthorizedError('Authentication required')
  }

  // Check permission
  if (!hasPermission(user, permission)) {
    // Log permission denied
    await auditLog('permission_denied', 'failure', {
      userId: user.id,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      route: options?.route,
      reason: `Missing permission: ${permission}`,
      metadata: {
        permission,
        userRole: user.role,
      },
    })
    
    throw new ForbiddenError(`Permission denied: ${permission}`)
  }

  return user
}

/**
 * Check permission without throwing (for conditional logic)
 */
export async function checkPermission(
  sessionToken: string,
  permission: Permission
): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole(sessionToken)
    if (!user) return false
    return hasPermission(user, permission)
  } catch {
    return false
  }
}

/**
 * Get all permissions for current user
 */
export async function getUserPermissions(
  sessionToken: string
): Promise<Permission[]> {
  const user = await getCurrentUserWithRole(sessionToken)
  if (!user) return []
  
  const { getRolePermissions } = await import('./permissions')
  return getRolePermissions(user.role)
}

/**
 * Custom error classes for RBAC
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Handle RBAC errors in API routes
 */
export function handleRBACError(error: unknown): { status: number; message: string } {
  if (error instanceof UnauthorizedError) {
    return { status: 401, message: error.message }
  }
  
  if (error instanceof ForbiddenError) {
    return { status: 403, message: error.message }
  }
  
  return { status: 500, message: 'Internal server error' }
}
