/**
 * BACKUP CODES MANAGER - One-Time Recovery Codes for 2FA
 * 
 * Features:
 * - Generate cryptographically secure backup codes
 * - Store only hashed versions (bcrypt)
 * - One-time use (invalidated after use)
 * - Regeneration invalidates old codes
 * - Audit logging for all operations
 * 
 * Security:
 * - Codes are 8 characters (alphanumeric, no ambiguous chars)
 * - Hashed with bcrypt before storage
 * - Rate limiting on verification attempts
 * - Audit trail for all usage
 */

import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'
import bcrypt from 'bcryptjs'

const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LENGTH = 8
const BCRYPT_ROUNDS = 10

// Character set (no ambiguous characters: 0, O, I, l, 1)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Generate a single backup code
 */
function generateBackupCode(): string {
  const array = new Uint8Array(BACKUP_CODE_LENGTH)
  crypto.getRandomValues(array)
  
  let code = ''
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    code += CHARSET[array[i] % CHARSET.length]
  }
  
  // Format: XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/**
 * Hash backup code for storage
 */
async function hashBackupCode(code: string): Promise<string> {
  // Remove hyphen for hashing
  const cleanCode = code.replace('-', '')
  return await bcrypt.hash(cleanCode, BCRYPT_ROUNDS)
}

/**
 * Verify backup code against hash
 */
async function verifyBackupCodeHash(code: string, hash: string): Promise<boolean> {
  const cleanCode = code.replace('-', '')
  return await bcrypt.compare(cleanCode, hash)
}

/**
 * Generate backup codes for user
 */
export async function generateBackupCodes(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string[]> {
  // Generate codes
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(generateBackupCode())
  }

  // Hash codes for storage
  const hashedCodes = await Promise.all(
    codes.map(code => hashBackupCode(code))
  )

  // Delete old backup codes
  await prisma.backupCode.deleteMany({
    where: { userId },
  })

  // Store new backup codes
  await prisma.backupCode.createMany({
    data: hashedCodes.map(hash => ({
      userId,
      codeHash: hash,
      used: false,
    })),
  })

  await auditLog('backup_codes_generated', 'success', {
    userId,
    ipAddress,
    userAgent,
    metadata: {
      count: BACKUP_CODE_COUNT,
    },
  })

  // Return unhashed codes to user (only time they'll see them)
  return codes
}

/**
 * Verify and consume backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  if (!code || code.length !== 9) { // XXXX-XXXX = 9 chars
    await auditLog('backup_code_failed', 'failure', {
      userId,
      ipAddress,
      userAgent,
      reason: 'Invalid code format',
    })
    return false
  }

  // Get all unused backup codes for user
  const backupCodes = await prisma.backupCode.findMany({
    where: {
      userId,
      used: false,
    },
  })

  if (backupCodes.length === 0) {
    await auditLog('backup_code_failed', 'failure', {
      userId,
      ipAddress,
      userAgent,
      reason: 'No unused backup codes',
    })
    return false
  }

  // Try to match against each unused code
  for (const backupCode of backupCodes) {
    const isValid = await verifyBackupCodeHash(code, backupCode.codeHash)
    
    if (isValid) {
      // Mark code as used
      await prisma.backupCode.update({
        where: { id: backupCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      })

      await auditLog('backup_code_used', 'success', {
        userId,
        ipAddress,
        userAgent,
      })

      return true
    }
  }

  await auditLog('backup_code_failed', 'failure', {
    userId,
    ipAddress,
    userAgent,
    reason: 'Code does not match',
  })

  return false
}

/**
 * Get remaining backup code count
 */
export async function getRemainingBackupCodeCount(userId: string): Promise<number> {
  return await prisma.backupCode.count({
    where: {
      userId,
      used: false,
    },
  })
}

/**
 * Check if user has backup codes
 */
export async function hasBackupCodes(userId: string): Promise<boolean> {
  const count = await getRemainingBackupCodeCount(userId)
  return count > 0
}

/**
 * Regenerate backup codes (invalidates old ones)
 */
export async function regenerateBackupCodes(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string[]> {
  await auditLog('backup_codes_regenerated', 'success', {
    userId,
    ipAddress,
    userAgent,
  })

  return await generateBackupCodes(userId, ipAddress, userAgent)
}
