/**
 * USER CREATE API - Create New User
 * 
 * Permission: manage_users
 * Creates a new user with specified role
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'
import { canManageRole, type Role } from '@/lib/rbac/permissions'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

interface CreateUserRequest {
  username: string
  password: string
  role: Role
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
      route: '/api/admin/users/create',
    })

    // Parse request
    const body: CreateUserRequest = await request.json()
    const { username, password, role } = body

    // Validate input
    if (!username?.trim() || !password?.trim() || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: Role[] = ['super_admin', 'admin', 'editor', 'analyst', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if actor can manage this role
    if (!canManageRole(actor.role, role)) {
      await auditLog('role_assignment_failed', 'failure', {
        userId: actor.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        route: '/api/admin/users/create',
        reason: `Cannot create user with role ${role}`,
        metadata: {
          actorRole: actor.role,
          targetRole: role,
        },
      })

      return NextResponse.json(
        { error: 'Cannot create user with higher or equal privilege level' },
        { status: 403 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        role,
        enabled: true,
        twoFactorEnabled: false,
      },
      select: {
        id: true,
        username: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    })

    // Audit log
    await auditLog('user_created', 'success', {
      userId: actor.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/users/create',
      metadata: {
        newUserId: newUser.id,
        newUsername: newUser.username,
        newUserRole: newUser.role,
        createdBy: actor.username,
      },
    })

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully',
    })

  } catch (error: any) {
    console.error('[USER-CREATE] Error:', error)

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
        error: 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
