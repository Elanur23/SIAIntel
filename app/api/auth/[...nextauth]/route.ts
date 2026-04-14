import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

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
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to home page after sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      // Add user info to session
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const { handlers } = NextAuth(authOptions)
export const { GET, POST } = handlers
