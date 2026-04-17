// @ts-nocheck — Comment model pending Prisma schema migration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/warroom/database'
import { applyApiSecurity, addSecurityHeaders } from '@/lib/security/api-middleware'
import { logError } from '@/lib/utils/logger'

/**
 * SIA COMMUNITY COMMENTS API
 * POST: Submit a new comment (pending by default)
 * GET: Fetch approved comments for an article
 */

export async function POST(request: NextRequest) {
  // Apply security (rate limiting, CORS)
  const securityCheck = await applyApiSecurity(request, { rateLimitTier: 'public' })
  if (securityCheck) return securityCheck

  try {
    const data = await request.json()
    const { articleId, content, authorName, lang } = data

    if (!articleId || !content) {
      const response = NextResponse.json({ success: false, error: 'Missing articleId or content' }, { status: 400 })
      return addSecurityHeaders(response, request)
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        content,
        authorName: authorName || 'Anonymous Analyst',
        lang: lang || 'en',
        status: 'pending' // Moderasyon için beklemeye alıyoruz
      }
    })

    const response = NextResponse.json({ success: true, data: comment })
    return addSecurityHeaders(response, request)
  } catch (error: any) {
    logError('COMMENTS_POST', error, { articleId: 'redacted' })
    const response = NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 500 })
    return addSecurityHeaders(response, request)
  }
}

export async function GET(request: NextRequest) {
  // Apply security (rate limiting, CORS)
  const securityCheck = await applyApiSecurity(request, { rateLimitTier: 'public' })
  if (securityCheck) return securityCheck

  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get('articleId')

  if (!articleId) {
    const response = NextResponse.json({ success: false, error: 'articleId required' }, { status: 400 })
    return addSecurityHeaders(response, request)
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        status: 'approved'
      },
      orderBy: { createdAt: 'desc' }
    })

    const response = NextResponse.json({ success: true, data: comments })
    return addSecurityHeaders(response, request)
  } catch (error: any) {
    logError('COMMENTS_GET', error, { articleId: 'redacted' })
    const response = NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 })
    return addSecurityHeaders(response, request)
  }
}
