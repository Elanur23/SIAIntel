import { NextRequest, NextResponse } from 'next/server'
import { backfillMultilingualArticles } from '@/lib/warroom/backfill-multilingual'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { extractClientIP } from '@/lib/security/client-ip-extractor'

/**
 * POST /api/admin/backfill-multilingual
 * Backfill multilingual content for articles
 * Permission: manage_integrations
 */
export async function POST(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'manage_integrations', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/backfill-multilingual',
    })

    const body = await request.json().catch(() => ({}))
    const limit = typeof body.limit === 'number' ? body.limit : 10
    const ids = Array.isArray(body.ids) ? body.ids : undefined
    const result = await backfillMultilingualArticles({ limit, ids })
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json({ success: false, error: error?.message || 'Backfill failed' }, { status: 500 })
  }
}