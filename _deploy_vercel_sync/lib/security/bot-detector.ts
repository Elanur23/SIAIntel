/**
 * BOT DETECTOR - Advanced Bot Detection for Auth Routes
 * 
 * Detects:
 * - Suspicious user-agents
 * - Impossible request frequency
 * - Rotating login attempts
 * - Automation patterns
 * 
 * Integrates with risk scoring and audit logging
 */

import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'

export interface BotDetectionResult {
  isBot: boolean
  confidence: number // 0-100
  reasons: string[]
  riskScore: number // 0-100
  requiresCaptcha: boolean
}

interface RequestFingerprint {
  ip: string
  userAgent: string
  timestamp: number
}

// In-memory tracking for burst detection (production: use Redis)
const requestHistory = new Map<string, RequestFingerprint[]>()

/**
 * Detect bot behavior
 */
export async function detectBot(
  ip: string,
  userAgent: string,
  route: string
): Promise<BotDetectionResult> {
  const reasons: string[] = []
  let confidence = 0
  let riskScore = 0
  
  // 1. Check suspicious user-agent
  const uaCheck = checkSuspiciousUserAgent(userAgent)
  if (uaCheck.suspicious) {
    reasons.push(...uaCheck.reasons)
    confidence += uaCheck.confidence
    riskScore += 20
  }
  
  // 2. Check request frequency (burst detection)
  const burstCheck = await checkRequestBurst(ip, userAgent)
  if (burstCheck.isBurst) {
    reasons.push(burstCheck.reason)
    confidence += 30
    riskScore += 40
  }
  
  // 3. Check rotating attempts pattern
  const rotationCheck = await checkRotatingAttempts(ip)
  if (rotationCheck.isRotating) {
    reasons.push(rotationCheck.reason)
    confidence += 25
    riskScore += 30
  }
  
  // 4. Check automation patterns
  const automationCheck = checkAutomationPatterns(userAgent, route)
  if (automationCheck.isAutomation) {
    reasons.push(...automationCheck.reasons)
    confidence += 20
    riskScore += 25
  }
  
  const isBot = confidence >= 50 || riskScore >= 60
  const requiresCaptcha = riskScore >= 50
  
  // Log if bot detected
  if (isBot) {
    await auditLog('bot_detected', 'failure', {
      ipAddress: ip,
      userAgent,
      route,
      metadata: {
        confidence,
        riskScore,
        reasons,
      },
    })
  }
  
  return {
    isBot,
    confidence: Math.min(confidence, 100),
    reasons,
    riskScore: Math.min(riskScore, 100),
    requiresCaptcha,
  }
}

/**
 * Check for suspicious user-agent patterns
 */
function checkSuspiciousUserAgent(userAgent: string): {
  suspicious: boolean
  confidence: number
  reasons: string[]
} {
  const reasons: string[] = []
  let confidence = 0
  
  if (!userAgent || userAgent === 'unknown') {
    reasons.push('Missing user-agent')
    confidence += 40
  }
  
  // Known bot/scraper patterns (excluding legitimate search engine bots)
  const maliciousBotPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
  ]
  
  // Legitimate bots (lower confidence)
  const legitimateBotPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
  ]
  
  for (const pattern of maliciousBotPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Malicious bot pattern detected: ${pattern.source}`)
      confidence += 40
      break
    }
  }
  
  for (const pattern of legitimateBotPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Legitimate bot detected: ${pattern.source}`)
      confidence += 20
      break
    }
  }
  
  // Suspicious characteristics
  if (userAgent.length < 20) {
    reasons.push('Unusually short user-agent')
    confidence += 15
  }
  
  if (userAgent.length > 500) {
    reasons.push('Unusually long user-agent')
    confidence += 10
  }
  
  // Missing common browser indicators
  const hasBrowserIndicators = /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(userAgent)
  if (!hasBrowserIndicators && userAgent !== 'unknown') {
    reasons.push('No browser indicators')
    confidence += 25
  }
  
  return {
    suspicious: confidence >= 30,
    confidence,
    reasons,
  }
}

/**
 * Check for request burst (impossible frequency)
 */
async function checkRequestBurst(
  ip: string,
  userAgent: string
): Promise<{ isBurst: boolean; reason: string }> {
  const key = `${ip}:${userAgent}`
  const now = Date.now()
  const windowMs = 10 * 1000 // 10 seconds
  const maxRequests = 5 // Max 5 requests per 10 seconds
  
  // Get or create history
  let history = requestHistory.get(key) || []
  
  // Remove old entries
  history = history.filter(entry => now - entry.timestamp < windowMs)
  
  // Add current request
  history.push({ ip, userAgent, timestamp: now })
  
  // Update history
  requestHistory.set(key, history)
  
  // Check if burst
  if (history.length > maxRequests) {
    return {
      isBurst: true,
      reason: `${history.length} requests in ${windowMs / 1000}s (max: ${maxRequests})`,
    }
  }
  
  return { isBurst: false, reason: '' }
}

/**
 * Check for rotating login attempts (different usernames from same IP)
 */
async function checkRotatingAttempts(ip: string): Promise<{
  isRotating: boolean
  reason: string
}> {
  const windowMs = 5 * 60 * 1000 // 5 minutes
  const since = new Date(Date.now() - windowMs)
  
  // Count failed login attempts from this IP
  const failedAttempts = await prisma.auditLog.count({
    where: {
      action: 'login_failed',
      ipAddress: ip,
      timestamp: {
        gte: since,
      },
    },
  })
  
  // If more than 8 failed attempts in 5 minutes, likely rotating
  if (failedAttempts > 8) {
    return {
      isRotating: true,
      reason: `${failedAttempts} failed login attempts in 5 minutes`,
    }
  }
  
  return { isRotating: false, reason: '' }
}

/**
 * Check for automation patterns
 */
function checkAutomationPatterns(
  userAgent: string,
  route: string
): { isAutomation: boolean; reasons: string[] } {
  const reasons: string[] = []
  
  // Check for automation tools
  const automationPatterns = [
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /axios/i,
    /fetch/i,
    /node-fetch/i,
    /got/i,
    /request/i,
    /superagent/i,
  ]
  
  for (const pattern of automationPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Automation tool detected: ${pattern.source}`)
    }
  }
  
  // Check for missing Accept headers (common in automation)
  // Note: This would need to be passed from the request
  
  return {
    isAutomation: reasons.length > 0,
    reasons,
  }
}

/**
 * Check if CAPTCHA is required
 */
export async function requiresCaptcha(
  ip: string,
  userAgent: string
): Promise<boolean> {
  // Check if CAPTCHA is enabled
  if (process.env.CAPTCHA_ENABLED !== 'true') {
    return false
  }
  
  // Check recent failed attempts
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const since = new Date(Date.now() - windowMs)
  
  const failedAttempts = await prisma.auditLog.count({
    where: {
      action: 'login_failed',
      ipAddress: ip,
      timestamp: {
        gte: since,
      },
    },
  })
  
  // Require CAPTCHA after 3 failed attempts
  const threshold = parseInt(process.env.CAPTCHA_THRESHOLD || '3', 10)
  
  if (failedAttempts >= threshold) {
    await auditLog('captcha_required', 'success', {
      ipAddress: ip,
      userAgent,
      metadata: {
        failedAttempts,
        threshold,
      },
    })
    return true
  }
  
  return false
}

/**
 * Verify CAPTCHA token (hCaptcha or reCAPTCHA)
 */
export async function verifyCaptcha(
  token: string,
  ip: string
): Promise<boolean> {
  const captchaProvider = process.env.CAPTCHA_PROVIDER || 'hcaptcha'
  
  if (captchaProvider === 'hcaptcha') {
    return await verifyHCaptcha(token, ip)
  } else if (captchaProvider === 'recaptcha') {
    return await verifyReCaptcha(token, ip)
  }
  
  return false
}

/**
 * Verify hCaptcha token
 */
async function verifyHCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET
  if (!secret) {
    console.error('[BOT-DETECTOR] hCaptcha secret not configured')
    return false
  }
  
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    })
    
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[BOT-DETECTOR] hCaptcha verification failed:', error)
    return false
  }
}

/**
 * Verify reCAPTCHA token
 */
async function verifyReCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET
  if (!secret) {
    console.error('[BOT-DETECTOR] reCAPTCHA secret not configured')
    return false
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    })
    
    const data = await response.json()
    return data.success === true && data.score >= 0.5
  } catch (error) {
    console.error('[BOT-DETECTOR] reCAPTCHA verification failed:', error)
    return false
  }
}

/**
 * Cleanup old request history (call periodically)
 */
export function cleanupRequestHistory(): void {
  const now = Date.now()
  const maxAge = 60 * 1000 // 1 minute
  
  for (const [key, history] of requestHistory.entries()) {
    const filtered = history.filter(entry => now - entry.timestamp < maxAge)
    if (filtered.length === 0) {
      requestHistory.delete(key)
    } else {
      requestHistory.set(key, filtered)
    }
  }
}

// Cleanup every minute
setInterval(cleanupRequestHistory, 60 * 1000)
