/**
 * USER DISABLE/ENABLE API - Toggle User Status
 * 
 * Permission: manage_users
 * Disables or enables a user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'
import { canManageRole, type Role } from '@/lib/rbac/permissions'

interface DisableUserRequest {
  userId: string
  enabled: boolean
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
    const actor = await requirePermission(sessionToken, 'manage_users', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/disable',
    })

    // Parse request
    const body: DisableUserRequest = await request.json()
    const { userId, enabled } = body

    // Validate input
    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'userId and enabled (boolean) are required' },
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
        enabled: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-disable
    if (targetUser.id === actor.id) {
      return NextResponse.json(
        { error: 'Cannot disable your own account' },
        { status: 403 }
      )
    }

    // Check if actor can manage target's role
    if (!canManageRole(actor.role, targetUser.role as Role)) {
      await auditLog('role_assignment_failed', 'failure', {
        userId: actor.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        route: '/api/admin/users/disable',
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

    // Update enabled status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { enabled },
      select: {
        id: true,
        username: true,
        role: true,
        enabled: true,
        updatedAt: true,
      },
    })

    // Invalidate all sessions if disabling
    if (!enabled) {
      await prisma.session.deleteMany({
        where: { userId },
      })
    }

    // Audit log
    await auditLog(enabled ? 'user_enabled' : 'user_disabled', 'success', {
      userId: actor.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/disable',
      metadata: {
        targetUserId: updatedUser.id,
        targetUsername: updatedUser.username,
        targetRole: updatedUser.role,
        enabled: updatedUser.enabled,
        changedBy: actor.username,
        sessionsInvalidated: !enabled,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: enabled ? 'User enabled successfully' : 'User disabled successfully',
    })

  } catch (error: any) {
    console.error('[USER-DISABLE] Error:', error)

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
        error: 'Failed to update user status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
