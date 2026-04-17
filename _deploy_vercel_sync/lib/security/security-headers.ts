/**
 * Security Headers Configuration
 * 
 * Implements comprehensive security headers for Next.js 14 App Router.
 * Includes CSP with nonce support for inline scripts.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API (Edge Runtime compatible)
 */
export function generateNonce(): string {
  // Edge Runtime compatible: Use Web Crypto API instead of Node.js crypto
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

/**
 * Build Content Security Policy header
 * 
 * CSP prevents XSS attacks by controlling which resources can be loaded.
 * Uses nonce for inline scripts (required for Next.js App Router).
 */
export function buildCSP(nonce: string): string {
  const cspDirectives = [
    // Default: Only allow resources from same origin
    `default-src 'self'`,
    
    // Scripts: Allow same origin, nonce for inline, and specific CDNs
    // 'unsafe-eval' needed for Next.js development (remove in production if possible)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`,
    
    // Styles: Allow same origin, inline styles (Next.js requirement), and Google Fonts
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    
    // Images: Allow same origin, data URIs, and external image sources
    `img-src 'self' data: https: blob:`,
    
    // Fonts: Allow same origin and Google Fonts
    `font-src 'self' data: https://fonts.gstatic.com`,
    
    // Connect: Allow same origin and API endpoints
    `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com`,
    
    // Frame: Disallow embedding (clickjacking protection)
    `frame-src 'none'`,
    
    // Object: Disallow plugins (Flash, Java, etc.)
    `object-src 'none'`,
    
    // Base URI: Restrict base tag to same origin
    `base-uri 'self'`,
    
    // Form actions: Only allow forms to submit to same origin
    `form-action 'self'`,
    
    // Frame ancestors: Prevent site from being framed (additional clickjacking protection)
    `frame-ancestors 'none'`,
    
    // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
    process.env.NODE_ENV === 'production' ? `upgrade-insecure-requests` : '',
  ]

  return cspDirectives.filter(Boolean).join('; ')
}

/**
 * Apply security headers to response
 * 
 * @param response - NextResponse object
 * @param nonce - CSP nonce for inline scripts
 */
export function applySecurityHeaders(
  response: NextResponse,
  nonce: string
): NextResponse {
  const headers = response.headers

  // Content-Security-Policy: Prevents XSS, clickjacking, and other code injection attacks
  headers.set('Content-Security-Policy', buildCSP(nonce))

  // X-Frame-Options: Prevents clickjacking by disallowing iframe embedding
  // DENY = cannot be embedded in any frame
  headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: Prevents MIME type sniffing
  // nosniff = browser must respect declared Content-Type
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Controls how much referrer information is sent
  // strict-origin-when-cross-origin = send full URL for same-origin, only origin for cross-origin
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Controls which browser features can be used
  // Disables potentially dangerous features like camera, microphone, geolocation
  headers.set(
    'Permissions-Policy',
    [
      'camera=()',           // Disable camera access
      'microphone=()',       // Disable microphone access
      'geolocation=()',      // Disable geolocation
      'interest-cohort=()',  // Disable FLoC (privacy)
      'payment=()',          // Disable payment API
      'usb=()',              // Disable USB access
    ].join(', ')
  )

  // Strict-Transport-Security (HSTS): Forces HTTPS connections
  // Only set in production to avoid localhost issues
  if (process.env.NODE_ENV === 'production') {
    // max-age=31536000 = 1 year
    // includeSubDomains = apply to all subdomains
    // preload = allow inclusion in browser HSTS preload lists
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-DNS-Prefetch-Control: Controls DNS prefetching
  // on = allow DNS prefetching for better performance
  headers.set('X-DNS-Prefetch-Control', 'on')

  // X-XSS-Protection: Legacy XSS protection (mostly superseded by CSP)
  // 1; mode=block = enable XSS filter and block page if attack detected
  headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

/**
 * Extract nonce from request headers (for use in components)
 */
export function getNonceFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-nonce')
}

/**
 * Store nonce in request headers for access in components
 */
export function setNonceHeader(
  response: NextResponse,
  nonce: string
): NextResponse {
  response.headers.set('x-nonce', nonce)
  return response
}
