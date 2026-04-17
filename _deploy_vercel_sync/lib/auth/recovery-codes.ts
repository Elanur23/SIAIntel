/**
 * 2FA Recovery Codes
 * 
 * Generates and manages recovery codes for 2FA account recovery.
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

const RECOVERY_CODE_LENGTH = 16 // bytes (32 hex characters)
const RECOVERY_CODE_COUNT = 8
const BCRYPT_ROUNDS = 10

/**
 * Generate a single recovery code
 */
function generateRecoveryCode(): string {
  return crypto.randomBytes(RECOVERY_CODE_LENGTH).toString('hex')
}

/**
 * Generate multiple recovery codes
 */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(generateRecoveryCode())
  }
  return codes
}

/**
 * Hash a recovery code
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS)
}

/**
 * Verify a recovery code against hash
 */
export async function verifyRecoveryCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

/**
 * Save recovery codes to database
 * 
 * @param userId - User ID
 * @param codes - Plaintext recovery codes
 * @returns Number of codes saved
 */
export async function saveRecoveryCodes(
  userId: string,
  codes: string[]
): Promise<number> {
  // Delete existing recovery codes
  await prisma.$executeRaw`
    DELETE FROM RecoveryCode WHERE userId = ${userId}
  `

  // Hash and save new codes
  const hashedCodes = await Promise.all(
    codes.map(async (code) => ({
      userId,
      code: await hashRecoveryCode(code),
    }))
  )

  // Bulk insert
  await prisma.$executeRaw`
    INSERT INTO RecoveryCode (id, userId, code, used, createdAt)
    VALUES ${hashedCodes.map((hc) => `(
      '${crypto.randomBytes(16).toString('hex')}',
      '${hc.userId}',
      '${hc.code}',
      0,
      datetime('now')
    )`).join(', ')}
  `

  return hashedCodes.length
}

/**
 * Verify and mark recovery code as used
 * 
 * @param userId - User ID
 * @param code - Plaintext recovery code
 * @returns True if code is valid and unused
 */
export async function useRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  // Get all unused recovery codes for user
  const recoveryCodes = await prisma.$queryRaw<
    Array<{ id: string; code: string }>
  >`
    SELECT id, code FROM RecoveryCode
    WHERE userId = ${userId} AND used = 0
  `

  if (!recoveryCodes || recoveryCodes.length === 0) {
    return false
  }

  // Check each code
  for (const recoveryCode of recoveryCodes) {
    const isValid = await verifyRecoveryCode(code, recoveryCode.code)

    if (isValid) {
      // Mark as used
      await prisma.$executeRaw`
        UPDATE RecoveryCode
        SET used = 1, usedAt = datetime('now')
        WHERE id = ${recoveryCode.id}
      `

      return true
    }
  }

  return false
}

/**
 * Get remaining recovery code count
 */
export async function getRemainingRecoveryCodeCount(
  userId: string
): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count FROM RecoveryCode
    WHERE userId = ${userId} AND used = 0
  `

  return result[0]?.count || 0
}

/**
 * Check if user has any recovery codes
 */
export async function hasRecoveryCodes(userId: string): Promise<boolean> {
  const count = await getRemainingRecoveryCodeCount(userId)
  return count > 0
}

/**
 * Invalidate all recovery codes for user
 * (Used before regeneration)
 * 
 * @param userId - User ID
 */
export async function invalidateAllRecoveryCodes(userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE RecoveryCode
    SET invalidatedAt = datetime('now')
    WHERE userId = ${userId} AND invalidatedAt IS NULL
  `
}
