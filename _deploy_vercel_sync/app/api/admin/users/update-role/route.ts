/**
 * USER UPDATE ROLE API - Change User Role
 * 
 * Permission: manage_roles
 * Changes a user's role (with hierarchy enforcement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'
import { canManageRole, type Role } from '@/lib/rbac/permissions'

interface UpdateRoleRequest {
  userId: string
  newRole: Role
}

export async function POST(request: NextRequest) {
  try {
    // Get session token
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Require permission
    const actor = await requirePermission(sessionToken, 'manage_roles', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/update-role',
    })

    // Parse request
    const body: UpdateRoleRequest = await request.json()
    const { userId, newRole } = body

    // Validate input
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'userId and newRole are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: Role[] = ['super_admin', 'admin', 'editor', 'analyst', 'viewer']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-role change
    if (targetUser.id === actor.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 403 }
      )
    }

    // Check if actor can manage target's current role
    if (!canManageRole(actor.role, targetUser.role as Role)) {
      await auditLog('role_assignment_failed', 'failure', {
        userId: actor.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        route: '/api/admin/users/update-role',
        reason: `Cannot manage user with role ${targetUser.role}`,
        metadata: {
          actorRole: actor.role,
          targetRole: targetUser.role,
          targetUserId: targetUser.id,
        },
      })

      return NextResponse.json(
        { error: 'Cannot manage user with higher or equal privilege level' },
        { status: 403 }
      )
    }

    // Check if actor can assign new role
    if (!canManageRole(actor.role, newRole)) {
      await auditLog('role_assignment_failed', 'failure', {
        userId: actor.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        route: '/api/admin/users/update-role',
        reason: `Cannot assign role ${newRole}`,
        metadata: {
          actorRole: actor.role,
          newRole,
          targetUserId: targetUser.id,
        },
      })

      return NextResponse.json(
        { error: 'Cannot assign role with higher or equal privilege level' },
        { status: 403 }
      )
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    })

    // Audit log
    await auditLog('role_changed', 'success', {
      userId: actor.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/update-role',
      metadata: {
        targetUserId: updatedUser.id,
        targetUsername: updatedUser.username,
        oldRole: targetUser.role,
        newRole: updatedUser.role,
        changedBy: actor.username,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Role updated successfully',
    })

  } catch (error: any) {
    console.error('[USER-UPDATE-ROLE] Error:', error)

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update role',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
