/**
 * IP Filtering System
 * 
 * Manages IP whitelist/blacklist with automatic rate limit blocking.
 * Handles X-Forwarded-For and CF-Connecting-IP headers.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Extract client IP from request headers
 * 
 * Priority order:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Real-IP (Nginx)
 * 3. X-Forwarded-For (first IP in chain)
 * 4. Socket remote address
 */
export function extractClientIP(request: NextRequest): string {
  // Cloudflare connecting IP (most reliable if using Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // Real IP (Nginx)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  // Forwarded For (take first IP in chain)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  // Fallback to unknown
  return 'unknown'
}

/**
 * Check if IP is blocked
 * 
 * @param ip - Client IP address
 * @returns Block info if blocked, null if allowed
 */
export async function isIPBlocked(ip: string): Promise<{
  blocked: boolean
  reason?: string
  expiresAt?: Date
} | null> {
  if (ip === 'unknown') {
    return null // Don't block unknown IPs
  }

  const now = new Date()

  const blockedIP = await prisma.blockedIP.findFirst({
    where: {
      ip,
      OR: [
        { expiresAt: null }, // Permanent block
        { expiresAt: { gt: now } }, // Temporary block not expired
      ],
    },
  })

  if (!blockedIP) {
    return null
  }

  return {
    blocked: true,
    reason: blockedIP.reason,
    expiresAt: blockedIP.expiresAt || undefined,
  }
}

/**
 * Block an IP address
 * 
 * @param ip - IP address to block
 * @param reason - Reason for blocking
 * @param durationMs - Block duration in milliseconds (null = permanent)
 * @param blockedBy - User ID who blocked the IP
 */
export async function blockIP(
  ip: string,
  reason: string,
  durationMs: number | null = null,
  blockedBy?: string
): Promise<void> {
  const now = new Date()
  const expiresAt = durationMs ? new Date(now.getTime() + durationMs) : null

  await prisma.blockedIP.upsert({
    where: { ip },
    create: {
      ip,
      reason,
      blockedAt: now,
      expiresAt,
      blockedBy,
    },
    update: {
      reason,
      blockedAt: now,
      expiresAt,
      blockedBy,
    },
  })
}

/**
 * Unblock an IP address
 * 
 * @param ip - IP address to unblock
 */
export async function unblockIP(ip: string): Promise<boolean> {
  try {
    await prisma.blockedIP.delete({
      where: { ip },
    })
    return true
  } catch {
    return false // IP not found
  }
}

/**
 * Auto-block IP after rate limit exceeded
 * 
 * @param ip - IP address to block
 * @param action - Action that triggered rate limit
 */
export async function autoBlockIPForRateLimit(
  ip: string,
  action: string
): Promise<void> {
  const ONE_HOUR = 60 * 60 * 1000

  await blockIP(
    ip,
    `Automatic block: Rate limit exceeded for ${action}`,
    ONE_HOUR,
    'system'
  )
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs(): Promise<Array<{
  ip: string
  reason: string
  blockedAt: Date
  expiresAt: Date | null
  blockedBy: string | null
}>> {
  return await prisma.blockedIP.findMany({
    orderBy: { blockedAt: 'desc' },
  })
}

/**
 * Cleanup expired IP blocks
 */
export async function cleanupExpiredIPBlocks(): Promise<number> {
  const result = await prisma.blockedIP.deleteMany({
    where: {
      expiresAt: {
        not: null,
        lt: new Date(),
      },
    },
  })

  return result.count
}

/**
 * Check if IP is in whitelist
 * (Optional feature - implement if needed)
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
  // TODO: Implement whitelist table if needed
  // For now, return false (no whitelist)
  return false
}
