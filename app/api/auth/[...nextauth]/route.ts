import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import type { NextRequest } from 'next/server'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GA4_CLIENT_ID!,
      clientSecret: process.env.GA4_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/en/admin/login',
    error: '/en/admin/login',
  },
  callbacks: {
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions) as any

export function GET(
  req: NextRequest,
  ctx: { params?: Record<string, string | string[]> }
): unknown {
  return handler(req, ctx)
}

export function POST(
  req: NextRequest,
  ctx: { params?: Record<string, string | string[]> }
): unknown {
  return handler(req, ctx)
}
