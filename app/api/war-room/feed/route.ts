/**
 * WAR ROOM FEED API - Minimal restoration
 */

import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') || 'en').toLowerCase();
  
  const data: any[] = [];

  // Return template data for now
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

  const sorted = data.sort((a, b) => {
    const ta = new Date(a.published_at || 0).getTime();
    const tb = new Date(b.published_at || 0).getTime();
    return tb - ta;
  });

  return NextResponse.json(
    { success: true, data: sorted, publishedTitles: [], timestamp: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
