/**
 * IP Block Management API
 *
 * Allows admins to block IP addresses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac/middleware'
import { blockIP, extractClientIP } from '@/lib/security/ip-filter'
import { logAuditEvent } from '@/lib/auth/audit-logger'

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireRole(request, ['admin'])
  if (authResult.error) {
    return authResult.error
  }

  const { user } = authResult

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ip, reason, durationHours } = body

    // Validate input
    if (!ip || !reason) {
      return NextResponse.json({ error: 'IP address and reason are required' }, { status: 400 })
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 })
    }

    // Calculate duration
    const durationMs = durationHours ? durationHours * 60 * 60 * 1000 : null // null = permanent

    // Block IP
    await blockIP(ip, reason, durationMs, user.id)

    // Log action
    const clientIP = extractClientIP(request)
    await logAuditEvent('IP_BLOCKED', true, {
      userId: user?.id,
      ipAddress: clientIP,
      metadata: {
        blockedIP: ip,
        reason,
        durationHours: durationHours || 'permanent',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'IP address blocked successfully',
      ip,
      expiresAt: durationMs ? new Date(Date.now() + durationMs) : null,
    })
  } catch (error) {
    console.error('[IP-BLOCK] Error:', error)

    return NextResponse.json({ error: 'Failed to block IP address' }, { status: 500 })
  }
}
