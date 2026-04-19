/**
 * ADMIN LOGIN API - Production-Safe Authentication with Mandatory 2FA
 * 
 * Security Features:
 * - Rate limiting (5 attempts per 15 minutes)
 * - Audit logging for all attempts
 * - Secure session tokens (not plain passwords)
 * - HttpOnly, Secure, SameSite cookies
 * - IP-based tracking
 * - Session hardening (idle timeout, absolute expiry)
 * - CSRF token generation
 * - Mandatory 2FA in production (Phase X-1)
 * 
 * Flow:
 * 1. Verify password
 * 2. If 2FA enabled: create pending session, require 2FA verification
 * 3. If 2FA not enabled in production: fail closed (require 2FA setup)
 * 4. If 2FA not enabled in dev: allow login (backward compatibility)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth/session-manager'
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limiter'
import { auditLog } from '@/lib/auth/audit-logger'
import { generateCsrfToken } from '@/lib/security/csrf'
import { hashToken } from '@/lib/auth/session-manager'
import { verifyUserPassword, is2FAMandatory, initializeAdminUser } from '@/lib/auth/user-manager'
import { extractClientIP } from '@/lib/security/client-ip-extractor'
import { detectBot, requiresCaptcha, verifyCaptcha } from '@/lib/security/bot-detector'

const COOKIE_NAME = 'sia_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: NextRequest) {
  // Extract client IP safely
  const ipResult = extractClientIP(request.headers)
  const clientIp = ipResult.normalized
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // 0. Initialize admin user if needed
    await initializeAdminUser()

    // 0.5. Bot detection
    const botDetection = await detectBot(clientIp, userAgent, '/api/admin/login')
    if (botDetection.isBot && botDetection.confidence >= 80) {
      await auditLog('bot_detected', 'failure', {
        ipAddress: clientIp,
        userAgent,
        route: '/api/admin/login',
        metadata: {
          confidence: botDetection.confidence,
          riskScore: botDetection.riskScore,
          reasons: botDetection.reasons,
        },
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Suspicious activity detected. Please try again later.',
        },
        { status: 403 }
      )
    }

    // 1. Rate limiting check
    const rateLimitResult = await checkRateLimit(clientIp, 'admin_login')
    if (!rateLimitResult.allowed) {
      await auditLog('rate_limit_triggered', 'failure', {
        ipAddress: clientIp,
        userAgent,
        reason: 'Rate limit exceeded',
        metadata: {
          retryAfter: rateLimitResult.retryAfter,
        },
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    // 2. Parse and validate request
    const body = await request.json()
    const password = typeof body?.password === 'string' ? body.password.trim() : ''
    const captchaToken = typeof body?.captchaToken === 'string' ? body.captchaToken : null
    
    if (!password) {
      await auditLog('login_failed', 'failure', {
        ipAddress: clientIp,
        userAgent,
        reason: 'Empty password',
      })
      
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      )
    }

    // 2.5. Check if CAPTCHA is required
    const captchaRequired = await requiresCaptcha(clientIp, userAgent)
    if (captchaRequired) {
      if (!captchaToken) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'CAPTCHA verification required.',
            requiresCaptcha: true,
          },
          { status: 403 }
        )
      }
      
      // Verify CAPTCHA
      const captchaValid = await verifyCaptcha(captchaToken, clientIp)
      if (!captchaValid) {
        await auditLog('captcha_failed', 'failure', {
          ipAddress: clientIp,
          userAgent,
          route: '/api/admin/login',
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'CAPTCHA verification failed. Please try again.',
            requiresCaptcha: true,
          },
          { status: 403 }
        )
      }
      
      await auditLog('captcha_verified', 'success', {
        ipAddress: clientIp,
        userAgent,
        route: '/api/admin/login',
      })
    }

    // 3. Verify password
    const verification = await verifyUserPassword('admin', password)
    
    if (!verification.valid) {
      await auditLog('login_failed', 'failure', {
        ipAddress: clientIp,
        userAgent,
        reason: 'Invalid password',
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid password.' },
        { status: 401 }
      )
    }

    const userId = verification.userId!
    const requires2FA = verification.requires2FA

    // 4. Check 2FA requirements
    const mandatory2FA = is2FAMandatory()
    
    if (mandatory2FA && !requires2FA) {
      // Production: 2FA is mandatory but not enabled
      await auditLog('login_failed', 'failure', {
        userId,
        ipAddress: clientIp,
        userAgent,
        reason: '2FA not enabled (mandatory in production)',
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: '2FA is mandatory in production. Please contact administrator.',
          requires2FASetup: true,
        },
        { status: 403 }
      )
    }

    // 5. Create session
    const sessionToken = await createSession(userId, clientIp, userAgent)

    // 6. If 2FA required, return pending status
    if (requires2FA) {
      await auditLog('login_success', 'success', {
        userId,
        ipAddress: clientIp,
        userAgent,
        metadata: {
          requires2FA: true,
        },
      })

      return NextResponse.json({
        success: true,
        requires2FA: true,
        sessionToken, // Temporary token for 2FA verification
        message: 'Password verified. Please enter your 2FA code.',
      })
    }

    // 7. No 2FA required (dev mode) - complete login
    await resetRateLimit(clientIp, 'admin_login')

    await auditLog('login_success', 'success', {
      userId,
      ipAddress: clientIp,
      userAgent,
    })

    // 8. Generate CSRF token
    const hashedToken = await hashToken(sessionToken)
    const csrfToken = await generateCsrfToken(hashedToken)

    // 9. Set secure session cookie
    const response = NextResponse.json({ 
      success: true,
      csrfToken,
      requires2FA: false,
    })
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return response

  } catch (error) {
    console.error('[ADMIN-LOGIN] Error:', error)
    
    await auditLog('login_failed', 'failure', {
      ipAddress: clientIp,
      userAgent,
      reason: 'Server error',
    })
    
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
