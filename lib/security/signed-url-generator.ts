/**
 * SIA Signed URL Generator
 * 
 * Generates time-limited, cryptographically signed URLs for:
 * - Audio files (TTS)
 * - API endpoints
 * - Protected resources
 * 
 * Prevents:
 * - Hotlinking
 * - Unauthorized access
 * - Content theft
 */

import crypto from 'crypto'

// ============================================================================
// CONFIGURATION
// ============================================================================

const SECRET_KEY = process.env.SIGNED_URL_SECRET || 'sia-secret-key-change-in-production'
const DEFAULT_EXPIRY = 5 * 60 * 1000 // 5 minutes
const MAX_EXPIRY = 60 * 60 * 1000 // 1 hour

// ============================================================================
// TYPES
// ============================================================================

export interface SignedUrlOptions {
  expiresIn?: number // milliseconds
  maxUses?: number
  allowedIPs?: string[]
  metadata?: Record<string, any>
}

export interface SignedUrlData {
  url: string
  signature: string
  expiresAt: number
  maxUses?: number
  allowedIPs?: string[]
  metadata?: Record<string, any>
}

// ============================================================================
// URL SIGNING
// ============================================================================

/**
 * Generate signed URL for audio file
 */
export function generateSignedAudioUrl(
  articleId: string,
  language: string,
  options: SignedUrlOptions = {}
): string {
  const expiresIn = Math.min(options.expiresIn || DEFAULT_EXPIRY, MAX_EXPIRY)
  const expiresAt = Date.now() + expiresIn
  
  const baseUrl = `/api/sia-news/audio/${articleId}`
  const params = new URLSearchParams({
    lang: language,
    exp: expiresAt.toString()
  })
  
  if (options.maxUses) {
    params.set('maxUses', options.maxUses.toString())
  }
  
  if (options.metadata) {
    params.set('meta', Buffer.from(JSON.stringify(options.metadata)).toString('base64'))
  }
  
  const urlToSign = `${baseUrl}?${params.toString()}`
  const signature = generateSignature(urlToSign, expiresAt)
  
  params.set('sig', signature)
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate signed URL for any resource
 */
export function generateSignedUrl(
  path: string,
  options: SignedUrlOptions = {}
): string {
  const expiresIn = Math.min(options.expiresIn || DEFAULT_EXPIRY, MAX_EXPIRY)
  const expiresAt = Date.now() + expiresIn
  
  const url = new URL(path, 'https://siaintel.com')
  url.searchParams.set('exp', expiresAt.toString())
  
  if (options.maxUses) {
    url.searchParams.set('maxUses', options.maxUses.toString())
  }
  
  if (options.allowedIPs && options.allowedIPs.length > 0) {
    url.searchParams.set('ips', options.allowedIPs.join(','))
  }
  
  if (options.metadata) {
    url.searchParams.set('meta', Buffer.from(JSON.stringify(options.metadata)).toString('base64'))
  }
  
  const urlToSign = url.pathname + url.search
  const signature = generateSignature(urlToSign, expiresAt)
  
  url.searchParams.set('sig', signature)
  
  return url.pathname + url.search
}

/**
 * Verify signed URL
 */
export function verifySignedUrl(
  url: string,
  clientIP?: string
): {
  valid: boolean
  expired: boolean
  reason?: string
  metadata?: Record<string, any>
} {
  try {
    const urlObj = new URL(url, 'https://siaintel.com')
    const params = urlObj.searchParams
    
    const signature = params.get('sig')
    const expiresAt = parseInt(params.get('exp') || '0')
    const allowedIPs = params.get('ips')?.split(',')
    const metaBase64 = params.get('meta')
    
    // Check signature exists
    if (!signature || !expiresAt) {
      return {
        valid: false,
        expired: false,
        reason: 'Missing signature or expiry'
      }
    }
    
    // Check expiry
    if (Date.now() > expiresAt) {
      return {
        valid: false,
        expired: true,
        reason: 'URL expired'
      }
    }
    
    // Check IP restriction
    if (allowedIPs && clientIP && !allowedIPs.includes(clientIP)) {
      return {
        valid: false,
        expired: false,
        reason: 'IP not allowed'
      }
    }
    
    // Verify signature
    params.delete('sig')
    const urlToVerify = urlObj.pathname + '?' + params.toString()
    const expectedSignature = generateSignature(urlToVerify, expiresAt)
    
    if (signature !== expectedSignature) {
      return {
        valid: false,
        expired: false,
        reason: 'Invalid signature'
      }
    }
    
    // Parse metadata
    let metadata: Record<string, any> | undefined
    if (metaBase64) {
      try {
        metadata = JSON.parse(Buffer.from(metaBase64, 'base64').toString())
      } catch {
        // Ignore metadata parse errors
      }
    }
    
    return {
      valid: true,
      expired: false,
      metadata
    }
  } catch (error) {
    return {
      valid: false,
      expired: false,
      reason: 'Invalid URL format'
    }
  }
}

// ============================================================================
// SIGNATURE GENERATION
// ============================================================================

/**
 * Generate HMAC signature for URL
 */
function generateSignature(url: string, expiresAt: number): string {
  const data = `${url}:${expiresAt}:${SECRET_KEY}`
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('base64url')
}

// ============================================================================
// HOTLINK PROTECTION
// ============================================================================

/**
 * Check if request is hotlinking (referrer from external site)
 */
export function isHotlinking(request: Request): boolean {
  const referer = request.headers.get('referer')
  
  if (!referer) {
    // No referer - could be direct access or privacy-focused browser
    // Allow for now, but log for monitoring
    return false
  }
  
  try {
    const refererUrl = new URL(referer)
    const allowedDomains = [
      'siaintel.com',
      'www.siaintel.com',
      ...(process.env.NODE_ENV !== 'production' ? ['localhost'] : [])
    ]
    
    return !allowedDomains.some(domain => 
      refererUrl.hostname === domain || refererUrl.hostname.endsWith(`.${domain}`)
    )
  } catch {
    // Invalid referer URL
    return true
  }
}

/**
 * Generate anti-hotlink headers
 */
export function getAntiHotlinkHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Access-Control-Allow-Origin': 'https://siaintel.com',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Credentials': 'true'
  }
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

const usageTracker = new Map<string, number>()

/**
 * Track URL usage
 */
export function trackUrlUsage(signature: string): boolean {
  const count = usageTracker.get(signature) || 0
  usageTracker.set(signature, count + 1)
  return true
}

/**
 * Check if URL exceeded max uses
 */
export function checkMaxUses(signature: string, maxUses: number): boolean {
  const count = usageTracker.get(signature) || 0
  return count < maxUses
}

/**
 * Clean up expired usage tracking
 */
export function cleanupUsageTracking(): void {
  // In production, this would be handled by Redis with TTL
  // For now, clear all every hour
  usageTracker.clear()
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupUsageTracking, 60 * 60 * 1000)
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Generate signed URLs for multiple resources
 */
export function generateBatchSignedUrls(
  paths: string[],
  options: SignedUrlOptions = {}
): Map<string, string> {
  const signedUrls = new Map<string, string>()
  
  paths.forEach(path => {
    const signedUrl = generateSignedUrl(path, options)
    signedUrls.set(path, signedUrl)
  })
  
  return signedUrls
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

/**
 * Hash sensitive data
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
}
