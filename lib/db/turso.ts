/**
 * Turso Database Client (Production)
 * 
 * LibSQL adapter for Prisma Client.
 * Supports both local SQLite (development) and Turso (production).
 */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Create Prisma Client with Turso adapter
 * 
 * Environment-aware:
 * - Development: Uses local SQLite (file:./dev.db)
 * - Production: Uses Turso LibSQL with auth token
 */
function createPrismaClient(): PrismaClient {
  // Check if we're using Turso (production)
  const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')
  
  if (isTurso) {
    // Production: Turso LibSQL
    console.log('[DATABASE] Connecting to Turso LibSQL...')
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    const adapter = new PrismaLibSql(libsql)
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } else {
    // Development: Local SQLite
    console.log('[DATABASE] Connecting to local SQLite...')
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
}

/**
 * Prisma Client Singleton
 * 
 * Prevents multiple instances in development (hot reload)
 */
export const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Graceful shutdown
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect()
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
  const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')
  const connected = await checkDatabaseConnection()
  
  return {
    type: isTurso ? 'turso' : 'sqlite',
    connected,
    url: isTurso ? process.env.TURSO_DATABASE_URL : 'file:./dev.db',
  }
}
