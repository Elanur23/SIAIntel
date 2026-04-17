/**
 * NextAuth.js Configuration with Idle Timeout Support
 * 
 * Add this to your existing auth.ts or lib/auth.ts
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { updateLastActivity } from './idle-timeout';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    // JWT callback: Add lastActivity to token
    async jwt({ token, user, trigger }) {
      // On sign in, initialize lastActivity
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.lastActivity = updateLastActivity();
      }

      // On session update or token refresh, update lastActivity
      if (trigger === 'update') {
        token.lastActivity = updateLastActivity();
      }

      return token;
    },

    // Session callback: Add lastActivity to session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      
      // Add lastActivity to session for client-side access
      (session as any).lastActivity = token.lastActivity;

      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  // Add your providers here
  providers: [
    // ... your providers
  ],
};
