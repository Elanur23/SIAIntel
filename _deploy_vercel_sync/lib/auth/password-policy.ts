/**
 * Password Policy Enforcement
 * 
 * Implements strong password requirements and history tracking.
 */

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

// Password history limit
const PASSWORD_HISTORY_LIMIT = 5

/**
 * Password validation schema
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character (!@#$%^&*)'
  )

/**
 * Validate password against policy
 * 
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const result = passwordSchema.safeParse(password)

  if (result.success) {
    return { valid: true, errors: [] }
  }

  return {
    valid: false,
    errors: result.error.errors.map(err => err.message),
  }
}

/**
 * Check if password was used recently
 * 
 * @param userId - User ID
 * @param newPassword - New password to check
 * @returns True if password was used recently
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string
): Promise<boolean> {
  // Get recent password hashes
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { changedAt: 'desc' },
    take: PASSWORD_HISTORY_LIMIT,
  })

  // Check if new password matches any recent password
  for (const entry of history) {
    const matches = await bcrypt.compare(newPassword, entry.passwordHash)
    if (matches) {
      return true
    }
  }

  return false
}

/**
 * Add password to history
 * 
 * @param userId - User ID
 * @param passwordHash - Hashed password
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  // Add new password to history
  await prisma.passwordHistory.create({
    data: {
      userId,
      passwordHash,
      changedAt: new Date(),
    },
  })

  // Keep only last N passwords
  const allHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { changedAt: 'desc' },
  })

  if (allHistory.length > PASSWORD_HISTORY_LIMIT) {
    const toDelete = allHistory.slice(PASSWORD_HISTORY_LIMIT)
    await prisma.passwordHistory.deleteMany({
      where: {
        id: {
          in: toDelete.map(h => h.id),
        },
      },
    })
  }
}

/**
 * Change user password
 * 
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success status and error message
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{
  success: boolean
  error?: string
}> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isCurrentValid) {
    return { success: false, error: 'Current password is incorrect' }
  }

  // Validate new password
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    }
  }

  // Check if password was used recently
  const isReused = await isPasswordReused(userId, newPassword)
  if (isReused) {
    return {
      success: false,
      error: `Password was used recently. Please choose a different password (last ${PASSWORD_HISTORY_LIMIT} passwords cannot be reused)`,
    }
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
    },
  })

  // Add to password history
  await addPasswordToHistory(userId, newPasswordHash)

  return { success: true }
}

/**
 * Terminate all other sessions for user
 * (Called after password change)
 * 
 * @param userId - User ID
 * @param currentSessionToken - Current session token to keep
 */
export async function terminateOtherSessions(
  userId: string,
  currentSessionToken?: string
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      ...(currentSessionToken && {
        hashedToken: {
          not: currentSessionToken,
        },
      }),
    },
  })

  return result.count
}

/**
 * Check if password change is required
 * (e.g., password older than 90 days)
 * 
 * @param userId - User ID
 * @returns True if password change is required
 */
export async function isPasswordChangeRequired(
  userId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true },
  })

  if (!user || !user.passwordChangedAt) {
    return false // No password change date, don't force
  }

  const MAX_PASSWORD_AGE_DAYS = 90
  const passwordAge = Date.now() - user.passwordChangedAt.getTime()
  const maxAge = MAX_PASSWORD_AGE_DAYS * 24 * 60 * 60 * 1000

  return passwordAge > maxAge
}
