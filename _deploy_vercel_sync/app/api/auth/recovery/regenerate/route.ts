/**
 * 2FA Recovery Code Regeneration API
 * 
 * Allows authenticated users to regenerate their recovery codes.
 * Rate limited to 3 regenerations per 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { generateRecoveryCodes, invalidateAllRecoveryCodes, saveRecoveryCodes } from '@/lib/auth/recovery-codes'
import { logAuditEvent } from '@/lib/auth/audit-logger'
import { extractClientIP } from '@/lib/security/ip-filter'
import { prisma } from '@/lib/db/prisma'

// Rate limit: 3 regenerations per 24 hours
const MAX_REGENERATIONS = 3
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = token.id as string

    // Get client IP
    const clientIp = extractClientIP(request)

    // Check rate limit
    const rateLimitKey = `recovery-regen:${userId}`
    const now = new Date()
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)

    const recentRegenerations = await prisma.auditLog.count({
      where: {
        userId,
        action: '2FA_RECOVERY_REGENERATED',
        success: true,
        timestamp: {
          gte: windowStart,
        },
      },
    })

    if (recentRegenerations >= MAX_REGENERATIONS) {
      await logAuditEvent({
        action: '2FA_RECOVERY_REGENERATION_RATE_LIMITED',
        userId,
        ipAddress: clientIp,
        success: false,
        errorMessage: 'Rate limit exceeded',
      })

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You can only regenerate recovery codes ${MAX_REGENERATIONS} times per 24 hours`,
          retryAfter: Math.ceil((windowStart.getTime() + RATE_LIMIT_WINDOW_MS - now.getTime()) / 1000),
        },
        { status: 429 }
      )
    }

    // Verify user exists and has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Invalidate all existing recovery codes
    await invalidateAllRecoveryCodes(userId)

    // Generate new recovery codes
    const newCodes = generateRecoveryCodes(8)

    // Save to database
    await saveRecoveryCodes(userId, newCodes)

    // Log the regeneration
    await logAuditEvent({
      action: '2FA_RECOVERY_REGENERATED',
      userId: user.id,
      ipAddress: clientIp,
      success: true,
      metadata: JSON.stringify({
        username: user.username,
        codeCount: newCodes.length,
        remainingRegenerations: MAX_REGENERATIONS - recentRegenerations - 1,
      }),
    })

    // Return plaintext codes (one-time display)
    return NextResponse.json({
      success: true,
      recoveryCodes: newCodes,
      warning: 'Save these codes in a secure location. They will not be shown again.',
      message: 'Recovery codes regenerated successfully',
      remainingRegenerations: MAX_REGENERATIONS - recentRegenerations - 1,
    })

  } catch (error) {
    console.error('[2FA-RECOVERY-REGEN] Error:', error)

    return NextResponse.json(
      { error: 'Failed to regenerate recovery codes' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check recovery code status
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = token.id as string

    // Get recovery code count
    const result = await prisma.$queryRaw<Array<{ total: number; unused: number }>>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as unused
      FROM RecoveryCode
      WHERE userId = ${userId}
    `

    const stats = result[0] || { total: 0, unused: 0 }

    return NextResponse.json({
      total: stats.total,
      unused: stats.unused,
      used: stats.total - stats.unused,
    })

  } catch (error) {
    console.error('[2FA-RECOVERY-STATUS] Error:', error)

    return NextResponse.json(
      { error: 'Failed to get recovery code status' },
      { status: 500 }
    )
  }
}
