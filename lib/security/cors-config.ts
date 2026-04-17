/**
 * CORS CONFIGURATION - Secure Cross-Origin Resource Sharing
 * 
 * POLICY:
 * - Restrict origins (no wildcard *)
 * - Allow only necessary methods
 * - Secure credentials handling
 */

import { NextResponse } from 'next/server'

// Allowed origins (add your domains here)
const ALLOWED_ORIGINS = [
  'https://siaintel.com',
  'https://www.siaintel.com',
  // Add staging/preview domains as needed
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
]

// Development mode: allow localhost
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001')
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
): NextResponse {
  // Only set CORS headers if origin is allowed
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  }

  return response
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreFlight(
  origin: string | null,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response, origin, methods)
}

/**
 * Create CORS-enabled error response
 */
export function corsErrorResponse(
  error: string,
  status: number,
  origin: string | null
): NextResponse {
  const response = NextResponse.json({ error }, { status })
  return addCorsHeaders(response, origin)
}
