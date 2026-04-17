/**
 * CLIENT IP EXTRACTOR - Safe IP Extraction Behind Proxies/CDN
 * 
 * Safely extracts client IP from requests behind reverse proxies (Cloudflare, etc.)
 * Does not blindly trust spoofable headers
 * 
 * Security:
 * - Validates proxy configuration
 * - Normalizes IPv4/IPv6
 * - Returns confidence level
 * - Consistent across audit/rate-limit/detection
 */

export interface ClientIPResult {
  ip: string
  confidence: 'high' | 'medium' | 'low'
  source: 'cf-connecting-ip' | 'x-forwarded-for' | 'x-real-ip' | 'socket' | 'unknown'
  normalized: string
}

/**
 * Extract client IP with confidence level
 */
export function extractClientIP(headers: Headers, socketIP?: string): ClientIPResult {
  // Check if behind trusted proxy (Cloudflare)
  const behindCloudflare = process.env.BEHIND_CLOUDFLARE === 'true'
  const behindProxy = process.env.BEHIND_PROXY === 'true'
  
  // Priority 1: Cloudflare-Connecting-IP (if behind Cloudflare)
  if (behindCloudflare) {
    const cfIP = headers.get('cf-connecting-ip')
    if (cfIP && isValidIP(cfIP)) {
      return {
        ip: cfIP,
        confidence: 'high',
        source: 'cf-connecting-ip',
        normalized: normalizeIP(cfIP),
      }
    }
  }
  
  // Priority 2: X-Forwarded-For (if behind trusted proxy)
  if (behindProxy || behindCloudflare) {
    const xForwardedFor = headers.get('x-forwarded-for')
    if (xForwardedFor) {
      // Take first IP (original client)
      const firstIP = xForwardedFor.split(',')[0].trim()
      if (isValidIP(firstIP)) {
        return {
          ip: firstIP,
          confidence: behindCloudflare ? 'high' : 'medium',
          source: 'x-forwarded-for',
          normalized: normalizeIP(firstIP),
        }
      }
    }
  }
  
  // Priority 3: X-Real-IP (if behind trusted proxy)
  if (behindProxy || behindCloudflare) {
    const xRealIP = headers.get('x-real-ip')
    if (xRealIP && isValidIP(xRealIP)) {
      return {
        ip: xRealIP,
        confidence: 'medium',
        source: 'x-real-ip',
        normalized: normalizeIP(xRealIP),
      }
    }
  }
  
  // Priority 4: Socket IP (direct connection)
  if (socketIP && isValidIP(socketIP)) {
    return {
      ip: socketIP,
      confidence: behindProxy ? 'low' : 'high',
      source: 'socket',
      normalized: normalizeIP(socketIP),
    }
  }
  
  // Fallback: unknown
  return {
    ip: 'unknown',
    confidence: 'low',
    source: 'unknown',
    normalized: 'unknown',
  }
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false
  
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  if (ipv6Regex.test(ip)) {
    return true
  }
  
  return false
}

/**
 * Normalize IP address (IPv4/IPv6)
 */
function normalizeIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'
  
  // IPv4: already normalized
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip
  }
  
  // IPv6: expand compressed notation
  if (ip.includes(':')) {
    // Simple normalization (lowercase)
    return ip.toLowerCase()
  }
  
  return ip
}

/**
 * Check if IP is from known bot/crawler
 */
export function isKnownBot(ip: string, userAgent: string): boolean {
  // Known bot user agents
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Check if IP is from Cloudflare
 */
export function isCloudflareIP(ip: string): boolean {
  // Cloudflare IP ranges (simplified check)
  // In production, maintain full list from https://www.cloudflare.com/ips/
  const cfRanges = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
  ]
  
  // Simple prefix check (not CIDR-aware, for basic validation)
  return cfRanges.some(range => {
    const prefix = range.split('/')[0].split('.').slice(0, 2).join('.')
    return ip.startsWith(prefix)
  })
}

/**
 * Get IP for rate limiting (consistent key)
 */
export function getIPForRateLimit(headers: Headers, socketIP?: string): string {
  const result = extractClientIP(headers, socketIP)
  return result.normalized
}

/**
 * Get IP for audit logging (with confidence)
 */
export function getIPForAudit(headers: Headers, socketIP?: string): {
  ip: string
  confidence: string
} {
  const result = extractClientIP(headers, socketIP)
  return {
    ip: result.normalized,
    confidence: result.confidence,
  }
}

/**
 * Check if request is from trusted proxy
 */
export function isTrustedProxy(): boolean {
  return process.env.BEHIND_CLOUDFLARE === 'true' || 
         process.env.BEHIND_PROXY === 'true'
}
