/**
 * AUTHENTICATION UTILITIES - Production-Safe API Key Validation
 * 
 * SECURITY NOTES:
 * - Removed hardcoded dev API key (was: 'dev-api-key-12345')
 * - Now requires proper environment variable configuration
 * - Rate limiting moved to dedicated rate-limiter.ts module
 */

import { checkRateLimit, resetRateLimit, type RateLimitResult } from './auth/rate-limiter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { updateLastActivity } from './auth/idle-timeout'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

// Re-export for backward compatibility
export type { RateLimitResult }

/**
 * Validate API key against environment variables
 * 
 * SECURITY: No hardcoded keys, environment variables only
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false
  
  // Only accept API keys from environment variables
  const validKeys = [
    process.env.AI_API_KEY,
    process.env.NEXT_PUBLIC_AI_API_KEY,
  ].filter(Boolean) // Remove undefined values
  
  if (validKeys.length === 0) {
    console.warn('[AUTH] No API keys configured in environment variables')
    return false
  }
  
  return validKeys.includes(apiKey)
}

/**
 * Rate limit check - delegates to dedicated rate limiter
 * 
 * @deprecated Use checkRateLimit from './auth/rate-limiter' directly
 */
export async function rateLimitCheck(
  clientId: string, 
  action: string, 
  limit: number = 100, 
  windowMs: number = 60 * 60 * 1000 // 1 hour
): Promise<RateLimitResult> {
  // Delegate to new rate limiter
  return checkRateLimit(clientId, action)
}

/**
 * NextAuth.js Configuration with Idle Timeout Support
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    // JWT callback: Add lastActivity to token
    async jwt({ token, user, trigger }) {
      // On sign in, initialize lastActivity
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'viewer'
        token.lastActivity = updateLastActivity()
      }

      // On session update or token refresh, update lastActivity
      if (trigger === 'update') {
        token.lastActivity = updateLastActivity()
      }

      return token
    },

    // Session callback: Add lastActivity to session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
      }
      
      // Add lastActivity to session for client-side access
      (session as any).lastActivity = token.lastActivity

      return session
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user || !user.enabled) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.username,
          email: user.username,
          role: user.role,
        }
      },
    }),
  ],
}

// Export new auth functions for convenience
export { checkRateLimit, resetRateLimit } from './auth/rate-limiter'
export { validateSession, createSession, deleteSession } from './auth/session-manager'
export { logAuditEvent, getRecentAuditLogs } from './auth/audit-logger'