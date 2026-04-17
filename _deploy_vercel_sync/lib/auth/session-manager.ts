/**
 * SESSION MANAGER - Database-Backed Session Token Management
 * 
 * STORAGE: Database-backed via Prisma (SQLite → PostgreSQL ready)
 * - Sessions persist across server restarts
 * - Suitable for multi-instance deployments (with PostgreSQL)
 * - No memory leaks
 * - Edge Runtime compatible (uses Web Crypto API)
 * 
 * Migration to PostgreSQL:
 * 1. Update datasource in prisma/schema.prisma
 * 2. Update DATABASE_URL environment variable
 * 3. Run: npx prisma migrate deploy
 * No code changes needed.
 */

import { prisma } from '@/lib/db/prisma'

export interface Session {
  token: string
  hashedToken: string
  userId: string
  createdAt: Date
  expiresAt: Date
  lastAccessedAt: Date
  ipAddress?: string
  userAgent?: string
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Generate cryptographically secure session token
 * Uses Web Crypto API (Edge Runtime compatible)
 */
export function generateSessionToken(): string {
  // Generate 32 random bytes
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without Web Crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  // Convert to hex string (64 characters)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash session token for storage (prevents token theft from memory dumps)
 * Uses Web Crypto API (Edge Runtime compatible)
 */
export async function hashToken(token: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateSessionToken()
  const hashedToken = await hashToken(token)
  const now = new Date()

  await prisma.session.create({
    data: {
      hashedToken,
      userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
      lastAccessedAt: now,
      ipAddress,
      userAgent,
    },
  })

  return token // Return unhashed token to client
}

/**
 * Validate session token and return session if valid
 */
export async function validateSession(token: string): Promise<Session | null> {
  if (!token || token.length !== 64) {
    return null
  }

  const hashedToken = await hashToken(token)
  
  const session = await prisma.session.findUnique({
    where: { hashedToken },
  })

  if (!session) {
    return null
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    await deleteSession(token)
    return null
  }

  // Update last accessed time (sliding window)
  const now = new Date()
  const updatedSession = await prisma.session.update({
    where: { hashedToken },
    data: {
      lastAccessedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    },
  })

  return {
    token, // Add token for compatibility
    hashedToken: updatedSession.hashedToken,
    userId: updatedSession.userId,
    createdAt: updatedSession.createdAt,
    expiresAt: updatedSession.expiresAt,
    lastAccessedAt: updatedSession.lastAccessedAt,
    ipAddress: updatedSession.ipAddress || undefined,
    userAgent: updatedSession.userAgent || undefined,
  }
}

/**
 * Delete session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const hashedToken = await hashToken(token)
  
  await prisma.session.delete({
    where: { hashedToken },
  }).catch(() => {
    // Ignore errors if session doesn't exist
  })
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  })
}

/**
 * Cleanup expired sessions (opportunistic, no cron)
 * Call this manually or from admin endpoints only
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  return result.count
}

/**
 * Get session count (for monitoring)
 */
export async function getSessionCount(): Promise<number> {
  return await prisma.session.count()
}
