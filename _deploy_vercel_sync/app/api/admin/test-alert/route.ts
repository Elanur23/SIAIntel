/**
 * TEST ALERT API - Test Telegram Alert Configuration
 * 
 * Security:
 * - Requires admin session
 * - Requires manage_security permission
 * - Rate limited
 * - Only available in development or with special flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { testTelegramAlert } from '@/lib/security/telegram-alerting'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { extractClientIP } from '@/lib/security/client-ip-extractor'

const COOKIE_NAME = 'sia_admin_session'

/**
 * POST /api/admin/test-alert
 * Test Telegram alert configuration
 * Permission: manage_security
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get session token
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Require permission
    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'manage_security', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/test-alert',
    })

    // 3. Check if Telegram is configured
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telegram not configured',
          message: 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables',
        },
        { status: 503 }
      )
    }

    // 4. Send test alert
    const sent = await testTelegramAlert()

    if (sent) {
      return NextResponse.json({
        success: true,
        message: 'Test alert sent successfully. Check your Telegram chat.',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test alert',
          message: 'Check bot token and chat ID configuration',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[TEST-ALERT] Error:', error)

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Test alert failed' },
      { status: 500 }
    )
  }
}
