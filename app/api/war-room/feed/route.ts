/**
 * WAR ROOM FEED API - Real Database Integration
 * Returns published articles from database, with template fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getPublishedTitles } from '@/lib/warroom/database';
import { ARTICLE_LANGS, getArticleFieldKey } from '@/lib/warroom/article-localization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const newsTemplates = [
  { title: 'Bitcoin ETF Inflows Surge 400% in 24 Hours', content: 'Institutional demand reaches new heights as spot ETFs absorb record liquidity.', priority: 10 },
  { title: 'Ethereum Network Activity Hits 2-Year High', content: 'On-chain metrics confirm massive surge in DeFi and Layer-2 utilization.', priority: 9 },
  { title: 'Regulatory Update: New Crypto Tax Laws Proposed', content: 'New legislative framework aimed at digital asset reporting has been introduced.', priority: 8 },
  { title: 'Solana Breakout: Critical Resistance Flipped to Support', content: 'Technical analysis indicates a major trend shift for SOL ecosystem.', priority: 7 },
  { title: 'Whale Alert: 50,000 BTC Moved from Dormant Wallets', content: 'Satoshi-era wallets show signs of life, moving massive liquidity to CEX.', priority: 10 },
  { title: 'AI Tokens Leading the Market Rally', content: 'Growth in decentralized compute power driving demand for AI-related assets.', priority: 8 },
];

function getLocalizedValue(article: any, field: string, lang: string): string | undefined {
  const fieldKey = getArticleFieldKey(field as any, lang as any);
  return article[fieldKey] || undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') || 'en').toLowerCase();
  
  const data: any[] = [];

  // Try to load from database first
  try {
    const dbArticles = await getArticles('published');
    for (const article of dbArticles) {
      const localizedTitle = getLocalizedValue(article, 'title', lang);
      const localizedContent = getLocalizedValue(article, 'content', lang) || getLocalizedValue(article, 'summary', lang);
      
      data.push({
        id: article.id,
        title: localizedTitle,
        content: localizedContent,
        titleEn: getLocalizedValue(article, 'title', 'en') || undefined,
        contentEn: getLocalizedValue(article, 'content', 'en') || undefined,
        priority: article.marketImpact ?? 7,
        source: 'SIA_WAR_ROOM_DB',
        published_at: article.publishedAt?.toISOString() || new Date().toISOString()
      });
    }
  } catch (dbErr) {
    console.warn('[WAR_ROOM_FEED] DB read failed:', (dbErr as Error).message);
  }

  // Fallback to templates if no database articles
  if (data.length === 0) {
    const shuffled = [...newsTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6).map((item, i) => ({
      id: `tpl_${item.priority}_${i}`,
      title: item.title,
      content: item.content,
      titleEn: item.title,
      contentEn: item.content,
      priority: item.priority,
      source: 'SIA_LIVE_RADAR',
      published_at: new Date().toISOString()
    }));
    data.push(...selected);
  }

  // Sort by published date (newest first)
  const sorted = data.sort((a, b) => {
    const ta = new Date(a.published_at || 0).getTime();
    const tb = new Date(b.published_at || 0).getTime();
    return tb - ta;
  });

  // Fetch published titles for duplicate detection
  let publishedTitles: string[] = [];
  try {
    publishedTitles = await getPublishedTitles();
  } catch (titlesErr) {
    console.warn('[WAR_ROOM_FEED] Published titles fetch failed:', (titlesErr as Error).message);
  }

  return NextResponse.json(
    { success: true, data: sorted, publishedTitles, timestamp: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
