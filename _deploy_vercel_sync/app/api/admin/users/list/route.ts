/**
 * USER LIST API - List All Users
 * 
 * Permission: view_users
 * Returns list of all users with their roles and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'

export async function GET(request: NextRequest) {
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
    const user = await requirePermission(sessionToken, 'view_users', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/list',
    })

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        enabled: true,
        twoFactorEnabled: true,
        twoFactorEnabledAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Audit log
    await auditLog('admin_action_settings', 'success', {
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/list',
      metadata: {
        action: 'list_users',
        userCount: users.length,
      },
    })

    return NextResponse.json({
      success: true,
      users,
      metadata: {
        total: users.length,
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error: any) {
    console.error('[USER-LIST] Error:', error)

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
        error: 'Failed to list users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
