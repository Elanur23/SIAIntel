import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Next.js 14'ün istediği format:
export { handler as GET, handler as POST }
