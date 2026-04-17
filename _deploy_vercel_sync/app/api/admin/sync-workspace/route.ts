// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/warroom/database';
import { sendArticleToDiscord } from '@/lib/discord/webhook';
import { postTweet } from '@/lib/twitter/publisher';
import { readWorkspace } from '@/lib/ai/workspace-io';
import { revalidatePath } from 'next/cache';
import { runLISAWorkspaceAudit } from '@/lib/sia-news/lisa-audit-engine';
import { requirePermission } from '@/lib/rbac/rbac-helpers';
import { extractClientIP } from '@/lib/security/client-ip-extractor';

/**
 * SIA GLOBAL SYNC ENGINE V6.2 - MANDATORY LISA AUDIT & CACHE PURGE
 */

/**
 * POST /api/admin/sync-workspace
 * Sync workspace configuration
 * Permission: publish_content
 */
export async function POST(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'publish_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/sync-workspace',
    })

    let ws;
    try {
      ws = await readWorkspace();
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 404 });
    }

    if (!ws.en?.title) {
      return NextResponse.json({ success: false, error: 'English master title is required for parity sync.' }, { status: 400 });
    }

    // ========================================================================
    // MANDATORY SIA_LISA AUDIT (Final Gate)
    // ========================================================================
    const audit = await runLISAWorkspaceAudit(ws);

    if (!audit.allPassed) {
      const failedLangs = Object.entries(audit.results)
        .filter(([_, res]) => !res.passed)
        .map(([lang, _]) => lang.toUpperCase())
        .join(', ');

      console.error(`[SIA_SYNC] LISA Audit Failed for nodes: ${failedLangs}`);

      return NextResponse.json({
        success: false,
        error: 'LISA_AUDIT_FAILURE',
        message: `Quality threshold not met for nodes: ${failedLangs}`,
        auditResults: audit.results
      }, { status: 422 });
    }

    // Use a date slightly in the past to ensure immediate visibility in filters (LTE now)
    const syncTime = new Date(Date.now() - 5000);

    // 1. Prepare Payload
    const payload: any = {
      source: 'SIA_WORKSPACE',
      status: 'published',
      publishedAt: syncTime,
      imageUrl: ws.imageUrl || ws.en?.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200',
      category: ws.category || 'ECONOMY',
      confidence: ws.verification?.confidenceScore || 98,
      marketImpact: ws.marketImpact || 9,
      authorName: 'SIA Intelligence Unit',
      authorRole: 'Senior Analyst'
    };

    const configs = [
      { s: 'En', k: 'en' }, { s: 'Tr', k: 'tr' }, { s: 'De', k: 'de' },
      { s: 'Fr', k: 'fr' }, { s: 'Es', k: 'es' }, { s: 'Ru', k: 'ru' },
      { s: 'Ar', k: 'ar' }, { s: 'Jp', k: 'jp' }, { s: 'Zh', k: 'zh' }
    ];

    configs.forEach(({ s, k }) => {
      if (ws[k]) {
        payload[`title${s}`] = ws[k].title || '';
        payload[`summary${s}`] = ws[k].summary || '';
        payload[`content${s}`] = ws[k].content || '';
        payload[`siaInsight${s}`] = ws[k].siaInsight || '';
        payload[`riskShield${s}`] = ws[k].riskShield || '';
        payload[`socialSnippet${s}`] = ws[k].socialSnippet || '';
      }
    });

    // 2. DEDUPLICATION LOGIC
    const matches = await prisma.warRoomArticle.findMany({
      where: { titleEn: ws.en.title },
      orderBy: { createdAt: 'desc' }
    });

    let article;
    if (matches.length > 0) {
      const masterId = matches[0].id;
      article = await prisma.warRoomArticle.update({
        where: { id: masterId },
        data: payload
      });

      if (matches.length > 1) {
        const idsToRemove = matches.slice(1).map(m => m.id);
        await prisma.warRoomArticle.deleteMany({
          where: { id: { in: idsToRemove } }
        });
      }
      console.log(`[SIA_SYNC] Updated article ${masterId} and purged ${matches.length - 1} duplicates.`);
    } else {
      article = await prisma.warRoomArticle.create({ data: payload });
      console.log(`[SIA_SYNC] Created new article ${article.id}`);
    }

    // Dağıtım
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
    const articleUrl = `${baseUrl}/en/news/${article.id}`

    const distributionPayload = {
      titleEn: ws.en.title,
      summaryEn: ws.en.summary || '',
      category: payload.category,
      confidence: payload.confidence,
      articleUrl,
    }

    const [discordResult, twitterResult] = await Promise.allSettled([
      sendArticleToDiscord({
        ...distributionPayload,
        marketImpact: payload.marketImpact,
        imageUrl: payload.imageUrl,
        authorName: payload.authorName,
        publishedAt: new Date(),
      }),
      postTweet(distributionPayload),
    ])

    const discordSent = discordResult.status === 'fulfilled' && discordResult.value === true
    const twitterSent = twitterResult.status === 'fulfilled' && (twitterResult.value as any)?.success === true

    // 🚀 CACHE PURGE
    try {
      revalidatePath('/');
      revalidatePath('/en');
      revalidatePath('/tr');
      console.log('[SIA_SYNC] Global cache purged.');
    } catch (e) {
      console.warn('[SIA_SYNC] Cache purge failed:', e);
    }

    return NextResponse.json({
      success: true,
      message: `9-NODE VIRAL SYNC COMPLETE: ${matches.length > 0 ? 'Updated' : 'Created'} article ${article.id}`,
      id: article.id,
      distribution: {
        discord: discordSent ? 'SENT' : 'SKIPPED',
        twitter: twitterSent ? 'SENT' : 'SKIPPED',
      },
    });

  } catch (error: any) {
    console.error('[CRITICAL_SYNC_ERROR]', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/sync-workspace
 * Get workspace sync status
 * Permission: view_content
 */
export async function GET(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'view_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/sync-workspace',
    })

    const ws = await readWorkspace();
    return NextResponse.json({ success: true, data: ws });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 404 });
  }
}
