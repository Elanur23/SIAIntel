/**
 * API SECURITY CONFIGURATION
 * 
 * Maps API routes to security tiers for rate limiting and access control
 */

import { RateLimitTier } from './api-rate-limiter'

export interface RouteSecurityConfig {
  tier: RateLimitTier
  requiresAuth?: boolean
  skipCors?: boolean
}

/**
 * Route patterns mapped to security tiers
 * 
 * STRICT (5 req/15min): Auth & destructive operations
 * MODERATE (30 req/min): AI generation & heavy operations
 * PUBLIC (60 req/min): Read operations & public APIs
 */
export const ROUTE_SECURITY_MAP: Record<string, RouteSecurityConfig> = {
  // ========================================================================
  // STRICT TIER - Authentication & Destructive Operations
  // ========================================================================
  '/api/admin/login': { tier: 'auth', skipCors: true },
  '/api/admin/logout': { tier: 'auth', requiresAuth: true, skipCors: true },
  '/api/admin/backfill-multilingual': { tier: 'auth', requiresAuth: true, skipCors: true },
  '/api/admin/normalize-workspace': { tier: 'auth', requiresAuth: true, skipCors: true },
  '/api/admin/sync-workspace': { tier: 'auth', requiresAuth: true, skipCors: true },
  '/api/war-room/wipe': { tier: 'auth', requiresAuth: true, skipCors: true },
  '/api/upload': { tier: 'auth', requiresAuth: true },

  // ========================================================================
  // MODERATE TIER - AI Generation & Heavy Operations
  // ========================================================================
  '/api/ai/generate': { tier: 'moderate' },
  '/api/ai/adsense-content': { tier: 'moderate' },
  '/api/ai/fallback': { tier: 'moderate' },
  '/api/sia-news/generate': { tier: 'moderate' },
  '/api/sia-gemini/process': { tier: 'moderate' },
  '/api/generate-image': { tier: 'moderate' },
  '/api/ghost-editor': { tier: 'moderate' },
  '/api/translate': { tier: 'moderate' },
  '/api/tts/generate': { tier: 'moderate' },
  '/api/deep-intelligence': { tier: 'moderate' },
  '/api/seo-architect': { tier: 'moderate' },
  '/api/seo-intelligence': { tier: 'moderate' },
  '/api/eeat-protocols/enhance': { tier: 'moderate' },
  '/api/intelligence/save': { tier: 'moderate' },
  '/api/war-room/save': { tier: 'moderate' },
  '/api/war-room/publish-breaking': { tier: 'moderate' },
  '/api/distribution/telegram/publish': { tier: 'moderate', requiresAuth: true },
  '/api/sia-news/batch-index': { tier: 'moderate' },
  '/api/sia-news/index-google': { tier: 'moderate' },
  '/api/signals/scan': { tier: 'moderate' },

  // ========================================================================
  // PUBLIC TIER - Read Operations & Public APIs
  // ========================================================================
  // Default tier for all other routes is 'public'
}

/**
 * Get security configuration for a route
 */
export function getRouteSecurityConfig(pathname: string): RouteSecurityConfig {
  // Check exact match first
  if (ROUTE_SECURITY_MAP[pathname]) {
    return ROUTE_SECURITY_MAP[pathname]
  }

  // Check prefix match for dynamic routes
  for (const [pattern, config] of Object.entries(ROUTE_SECURITY_MAP)) {
    if (pathname.startsWith(pattern)) {
      return config
    }
  }

  // Default to public tier
  return { tier: 'public' }
}

/**
 * Check if route should skip security (immutable routes)
 */
export function shouldSkipSecurity(pathname: string): boolean {
  // SEO routes are immutable - do not apply security middleware
  const immutablePrefixes = [
    '/api/seo/generate-schema',
    '/api/seo/news-sitemap',
  ]

  return immutablePrefixes.some(prefix => pathname.startsWith(prefix))
}

/**
 * Check if route requires authentication
 */
export function requiresAuthentication(pathname: string): boolean {
  const config = getRouteSecurityConfig(pathname)
  return config.requiresAuth === true
}
