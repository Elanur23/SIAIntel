/**
 * IP Unblock Management API
 *
 * Allows admins to unblock IP addresses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac/middleware'
import { unblockIP, extractClientIP } from '@/lib/security/ip-filter'
import { logAuditEvent } from '@/lib/auth/audit-logger'

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireRole(request, ['admin'])
  if (authResult.error) {
    return authResult.error
  }

  const { user } = authResult

  try {
    const body = await request.json()
    const { ip } = body

    // Validate input
    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 })
    }

    // Unblock IP
    const success = await unblockIP(ip)

    if (!success) {
      return NextResponse.json({ error: 'IP address not found in blocklist' }, { status: 404 })
    }

    // Log action
    const clientIP = extractClientIP(request)
    await logAuditEvent('IP_UNBLOCKED', true, {
      userId: user?.id,
      ipAddress: clientIP,
      metadata: {
        unblockedIP: ip,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'IP address unblocked successfully',
      ip,
    })
  } catch (error) {
    console.error('[IP-UNBLOCK] Error:', error)

    return NextResponse.json({ error: 'Failed to unblock IP address' }, { status: 500 })
  }
}
