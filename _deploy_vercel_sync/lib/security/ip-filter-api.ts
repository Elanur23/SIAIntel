/**
 * IP Filtering for API Routes
 * 
 * Higher-Order Function to wrap API route handlers with IP filtering.
 * Uses Prisma to check BlockedIP table (Node.js runtime compatible).
 * 
 * Usage:
 * ```typescript
 * export const GET = withIpFilter(async (request) => {
 *   // Your handler logic
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Extract client IP from request headers
 */
export function extractClientIP(request: NextRequest): string {
  // Check Cloudflare header first
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Check X-Forwarded-For (can be comma-separated list)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim())
    return ips[0] // First IP is the original client
  }

  // Check X-Real-IP
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Fallback to unknown
  return 'unknown'
}

/**
 * Check if IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<{
  blocked: boolean
  reason?: string
  expiresAt?: Date | null
}> {
  if (!ip || ip === 'unknown') {
    return { blocked: false }
  }

  try {
    const blockedIP = await prisma.blockedIP.findUnique({
      where: { ip },
    })

    if (!blockedIP) {
      return { blocked: false }
    }

    // Check if block has expired
    if (blockedIP.expiresAt && blockedIP.expiresAt < new Date()) {
      // Block expired, remove it
      await prisma.blockedIP.delete({
        where: { ip },
      })
      return { blocked: false }
    }

    return {
      blocked: true,
      reason: blockedIP.reason,
      expiresAt: blockedIP.expiresAt,
    }
  } catch (error) {
    console.error('[IP_FILTER] Error checking blocked IP:', error)
    // Fail open: don't block on database errors
    return { blocked: false }
  }
}

/**
 * Higher-Order Function to wrap API route handlers with IP filtering
 * 
 * @param handler - Original API route handler
 * @returns Wrapped handler with IP filtering
 */
export function withIpFilter<T extends NextRequest>(
  handler: (request: T, context?: any) => Promise<NextResponse> | NextResponse
) {
  return async (request: T, context?: any): Promise<NextResponse> => {
    // Extract client IP
    const clientIP = extractClientIP(request)

    // Check if IP is blocked
    const blockInfo = await isIPBlocked(clientIP)

    if (blockInfo.blocked) {
      return NextResponse.json(
        {
          error: 'Access denied',
          reason: blockInfo.reason,
          expiresAt: blockInfo.expiresAt,
        },
        { status: 403 }
      )
    }

    // IP not blocked, proceed with original handler
    return handler(request, context)
  }
}

/**
 * Block an IP address
 * 
 * @param ip - IP address to block
 * @param reason - Reason for blocking
 * @param expiresAt - Optional expiration date (null = permanent)
 * @param blockedBy - Optional user ID who blocked the IP
 */
export async function blockIP(
  ip: string,
  reason: string,
  expiresAt: Date | null = null,
  blockedBy?: string
): Promise<void> {
  await prisma.blockedIP.upsert({
    where: { ip },
    create: {
      ip,
      reason,
      expiresAt,
      blockedBy,
    },
    update: {
      reason,
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
export async function unblockIP(ip: string): Promise<void> {
  await prisma.blockedIP.delete({
    where: { ip },
  }).catch(() => {
    // Ignore if IP not found
  })
}
