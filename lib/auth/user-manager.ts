/**
 * USER MANAGER - Admin User Management with RBAC
 * 
 * Features:
 * - Create/update admin users
 * - Password hashing with bcrypt
 * - 2FA status management
 * - Role management (Phase X-4)
 * - Production-safe initialization
 */

import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import type { Role } from '@/lib/rbac/permissions'

const BCRYPT_ROUNDS = 10

/**
 * Initialize admin user (idempotent)
 */
export async function initializeAdminUser(): Promise<void> {
  const adminSecret = process.env.ADMIN_SECRET
  
  if (!adminSecret?.trim()) {
    throw new Error('ADMIN_SECRET not configured')
  }

  // Check if admin user exists
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (existingUser) {
    // Update password if changed
    const passwordMatch = await bcrypt.compare(adminSecret, existingUser.passwordHash)
    if (!passwordMatch) {
      const passwordHash = await bcrypt.hash(adminSecret, BCRYPT_ROUNDS)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash },
      })
      console.log('[USER-MANAGER] Admin password updated')
    }
    return
  }

  // Create admin user with super_admin role
  const passwordHash = await bcrypt.hash(adminSecret, BCRYPT_ROUNDS)
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'super_admin',
      twoFactorEnabled: false,
      enabled: true,
    },
  })

  console.log('[USER-MANAGER] Admin user created with super_admin role')
}

/**
 * Verify user password
 */
export async function verifyUserPassword(
  username: string,
  password: string
): Promise<{ valid: boolean; userId?: string; requires2FA?: boolean; role?: Role; enabled?: boolean }> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      passwordHash: true,
      twoFactorEnabled: true,
      role: true,
      enabled: true,
    },
  })

  if (!user) {
    return { valid: false }
  }

  // Check if user is enabled
  if (!user.enabled) {
    return { valid: false }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  
  if (!passwordMatch) {
    return { valid: false }
  }

  return {
    valid: true,
    userId: user.id,
    requires2FA: user.twoFactorEnabled,
    role: user.role as Role,
    enabled: user.enabled,
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorEnabledAt: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Check if 2FA is mandatory in production
 */
export function is2FAMandatory(): boolean {
  return process.env.NODE_ENV === 'production' && 
         process.env.REQUIRE_2FA !== 'false'
}
