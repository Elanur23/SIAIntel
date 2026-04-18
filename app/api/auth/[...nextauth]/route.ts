import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Force type bypass for Vercel's strict compiler
export const GET = handler as any;
export const POST = handler as any;
