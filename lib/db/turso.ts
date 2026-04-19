/**
 * Turso Database Client (Production)
 *
 * LibSQL adapter for Prisma Client.
 * Supports both local SQLite (development) and Turso (production).
 * 
 * NOTE: Uses lazy imports to avoid native module loading during Next.js build phase.
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Create Prisma Client with Turso adapter.
 *
 * Production (NODE_ENV=production OR TURSO_DATABASE_URL is set):
 *   - Requires TURSO_DATABASE_URL. Throws immediately if missing.
 *   - Uses PrismaLibSQL adapter over LibSQL/Turso.
 *
 * Development (local only):
 *   - Falls back to plain PrismaClient (SQLite via schema datasource).
 *   - Only allowed when NODE_ENV !== 'production' AND TURSO_DATABASE_URL is absent.
 */
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const isProduction = process.env.NODE_ENV === 'production'

  // Fail-closed: production must have a valid Turso URL.
  if (isProduction && !tursoUrl) {
    throw new Error(
      '[DATABASE] FATAL: TURSO_DATABASE_URL is not set. ' +
      'Production Prisma client cannot initialize without a Turso database URL. ' +
      'Set TURSO_DATABASE_URL (and optionally TURSO_AUTH_TOKEN) in your Vercel environment variables.'
    )
  }

  if (tursoUrl) {
    // Turso / LibSQL path (production or local dev with Turso configured)
    console.log('[DATABASE] Connecting to Turso LibSQL...')

    // Lazy import to avoid native module loading during build
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    
    // Use web client to avoid native module issues on Windows/Vercel
    let createClient
    try {
      // Try web client first (works everywhere, no native dependencies)
      createClient = require('@libsql/client/web').createClient
      console.log('[DATABASE] Using @libsql/client/web (platform-agnostic)')
    } catch {
      // Fallback to native client (local development on Unix-like systems)
      createClient = require('@libsql/client').createClient
      console.log('[DATABASE] Using @libsql/client (native)')
    }

    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    const adapter = new PrismaLibSQL(libsql)

    return new PrismaClient({
      adapter,
      log: isProduction ? ['error'] : ['query', 'error', 'warn'],
    })
  }

  // Local development only: plain PrismaClient (SQLite via schema datasource).
  // This path is intentionally unreachable in production due to the guard above.
  console.log('[DATABASE] Connecting to local SQLite (development only)...')
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  })
}

/**
 * Prisma Client Singleton
 *
 * Prevents multiple instances in development (hot reload).
 * Uses lazy initialization to avoid errors during build phase.
 */
let _prisma: PrismaClient | undefined

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    // Lazy initialize on first access
    if (!_prisma) {
      _prisma = global.prisma || createPrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        global.prisma = _prisma
      }
    }
    return (_prisma as any)[prop]
  }
})

/**
 * Graceful shutdown
 */
process.on('beforeExit', async () => {
  if (_prisma) {
    await _prisma.$disconnect()
  }
})

/**
 * Health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('[DATABASE] Connection failed:', error)
    return false
  }
}

/**
 * Get database info
 */
export async function getDatabaseInfo(): Promise<{
  type: 'sqlite' | 'turso'
  connected: boolean
  url?: string
}> {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const connected = await checkDatabaseConnection()

  return {
    type: tursoUrl ? 'turso' : 'sqlite',
    connected,
    url: tursoUrl ?? 'file:./dev.db',
  }
}
