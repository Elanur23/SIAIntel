/**
 * IDEMPOTENCY SYSTEM - Prevent Duplicate Admin Actions
 * 
 * Ensures critical operations are executed only once
 * Prevents accidental double-submissions and race conditions
 */

import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'

export interface IdempotencyKey {
  key: string
  action: string
  userId: string
  createdAt: Date
  expiresAt: Date
  result?: any
  completed: boolean
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate idempotency key from request
 */
export function generateIdempotencyKey(
  userId: string,
  action: string,
  payload: any
): string {
  const timestamp = Date.now()
  const payloadHash = hashPayload(payload)
  return `${userId}:${action}:${payloadHash}:${timestamp}`
}

/**
 * Simple payload hash for idempotency
 */
function hashPayload(payload: any): string {
  const str = JSON.stringify(payload)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Check if request is duplicate (idempotency check)
 */
export async function checkIdempotency(
  idempotencyKey: string,
  action: string,
  userId: string
): Promise<{
  isDuplicate: boolean
  existingResult?: any
  shouldProcess: boolean
}> {
  try {
    // Check if key exists in database
    // Note: This would require adding IdempotencyKey model to Prisma schema
    // For now, using in-memory store (should be database in production)
    
    const existing = idempotencyStore.get(idempotencyKey)
    
    if (existing) {
      const now = new Date()
      
      // Check if expired
      if (now > existing.expiresAt) {
        // Expired, remove and allow processing
        idempotencyStore.delete(idempotencyKey)
        return {
          isDuplicate: false,
          shouldProcess: true,
        }
      }
      
      // Check if completed
      if (existing.completed) {
        // Duplicate request, return existing result
        await auditLog('admin_action_duplicate' as any, 'failure', {
          userId,
          reason: `Duplicate ${action} request blocked`,
          metadata: {
            idempotencyKey,
            action,
          },
        })
        
        return {
          isDuplicate: true,
          existingResult: existing.result,
          shouldProcess: false,
        }
      }
      
      // In progress, reject
      return {
        isDuplicate: true,
        shouldProcess: false,
      }
    }
    
    // New request, create idempotency record
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS)
    idempotencyStore.set(idempotencyKey, {
      key: idempotencyKey,
      action,
      userId,
      createdAt: new Date(),
      expiresAt,
      completed: false,
    })
    
    return {
      isDuplicate: false,
      shouldProcess: true,
    }
  } catch (error) {
    console.error('[IDEMPOTENCY] Check failed:', error)
    // On error, allow processing (fail open for availability)
    return {
      isDuplicate: false,
      shouldProcess: true,
    }
  }
}

/**
 * Mark idempotency key as completed with result
 */
export async function completeIdempotency(
  idempotencyKey: string,
  result: any
): Promise<void> {
  try {
    const existing = idempotencyStore.get(idempotencyKey)
    if (existing) {
      existing.completed = true
      existing.result = result
      idempotencyStore.set(idempotencyKey, existing)
    }
  } catch (error) {
    console.error('[IDEMPOTENCY] Complete failed:', error)
  }
}

/**
 * Cleanup expired idempotency keys
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const now = new Date()
    let cleaned = 0
    
    for (const [key, value] of idempotencyStore.entries()) {
      if (now > value.expiresAt) {
        idempotencyStore.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      await auditLog('session_cleanup', 'success', {
        metadata: {
          idempotencyKeysDeleted: cleaned,
        },
      })
    }
    
    return cleaned
  } catch (error) {
    console.error('[IDEMPOTENCY] Cleanup failed:', error)
    return 0
  }
}

/**
 * In-memory idempotency store
 * TODO: Replace with database-backed store for production
 */
const idempotencyStore = new Map<string, IdempotencyKey>()

/**
 * Get idempotency key from request header
 */
export function extractIdempotencyKey(request: Request): string | null {
  return request.headers.get('x-idempotency-key')
}

/**
 * Idempotency middleware wrapper
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  action: string,
  userId: string,
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; isDuplicate?: boolean; message?: string }> {
  // Check idempotency
  const check = await checkIdempotency(idempotencyKey, action, userId)
  
  if (check.isDuplicate) {
    return {
      success: false,
      isDuplicate: true,
      data: check.existingResult,
      message: 'Duplicate request detected',
    }
  }
  
  if (!check.shouldProcess) {
    return {
      success: false,
      message: 'Request already in progress',
    }
  }
  
  try {
    // Execute operation
    const result = await operation()
    
    // Mark as completed
    await completeIdempotency(idempotencyKey, result)
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    // On error, remove idempotency key to allow retry
    idempotencyStore.delete(idempotencyKey)
    throw error
  }
}
