/**
 * WAR ROOM FEED API - Önce DB ve content-buffer, yoksa şablon
 * Veritabanı ve buffer’daki güncel haberler formatlanmış döner; ham/eski şablon sadece yedek.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getPublishedTitles } from '@/lib/warroom/database';
import { getBufferStats } from '@/lib/content/content-buffer-system';
import { getLocalizedArticleValue } from '@/lib/warroom/article-localization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const newsTemplates = [
  { title: 'Bitcoin ETF Inflows Surge 400% in 24 Hours', content: 'Institutional demand reaches new heights as spot ETFs absorb record liquidity.', titleTr: 'Bitcoin ETF Girişleri 24 Saatte %400 Arttı', contentTr: 'Kurumsal talep rekor likidite ile yeni zirvelere ulaşıyor.', priority: 10 },
  { title: 'Ethereum Network Activity Hits 2-Year High', content: 'On-chain metrics confirm massive surge in DeFi and Layer-2 utilization.', titleTr: 'Ethereum Ağ Aktivitesi 2 Yılın Zirvesinde', contentTr: 'On-chain veriler DeFi ve Layer-2 kullanımında büyük artışı gösteriyor.', priority: 9 },
  { title: 'Regulatory Update: New Crypto Tax Laws Proposed', content: 'New legislative framework aimed at digital asset reporting has been introduced.', titleTr: 'Yeni Kripto Vergi Yasası Önerisi', contentTr: 'Dijital varlık raporlaması için yeni yasal çerçeve gündemde.', priority: 8 },
  { title: 'Solana Breakout: Critical Resistance Flipped to Support', content: 'Technical analysis indicates a major trend shift for SOL ecosystem.', titleTr: 'Solana Kritik Direnç Desteğe Döndü', contentTr: 'Teknik analiz SOL ekosisteminde önemli trend değişimine işaret ediyor.', priority: 7 },
  { title: 'Whale Alert: 50,000 BTC Moved from Dormant Wallets', content: 'Satoshi-era wallets show signs of life, moving massive liquidity to CEX.', titleTr: 'Balina Uyarısı: 50.000 BTC Harekete Geçti', contentTr: 'Satoshi dönemi cüzdanlar borsalara büyük likidite taşıyor.', priority: 10 },
  { title: 'AI Tokens Leading the Market Rally', content: 'Growth in decentralized compute power driving demand for AI-related assets.', titleTr: 'AI Tokenları Piyasa Rallisinde Önde', contentTr: 'Merkeziyetsiz hesaplama gücündeki büyüme AI varlıklarına talebi artırıyor.', priority: 8 },
  { title: 'Global Central Banks Exploring CBDC Interoperability', content: 'Cross-border payment testing phase starts for major digital currencies.', titleTr: 'Merkez Bankaları CBDC Uyumluluğunu İnceliyor', contentTr: 'Büyük dijital para birimleri için sınır ötesi ödeme testleri başlıyor.', priority: 7 }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') || 'tr').toLowerCase();
  const data: any[] = [];

  try {
    const dbArticles = await getArticles();
    for (const a of dbArticles) {
      const localizedTitle = getLocalizedArticleValue(a, 'title', lang);
      const localizedContent = getLocalizedArticleValue(a, 'content', lang) || getLocalizedArticleValue(a, 'summary', lang);
      data.push({
        id: a.id,
        title: localizedTitle,
        content: localizedContent,
        titleTr: getLocalizedArticleValue(a, 'title', 'tr') || undefined,
        contentTr: getLocalizedArticleValue(a, 'content', 'tr') || undefined,
        titleEn: getLocalizedArticleValue(a, 'title', 'en') || undefined,
        contentEn: getLocalizedArticleValue(a, 'content', 'en') || undefined,
        priority: a.marketImpact ?? 7,
        source: 'SIA_WAR_ROOM_DB',
        published_at: a.publishedAt
      });
    }
  } catch (dbErr) {
    console.warn('[WAR_ROOM_FEED] DB read failed:', (dbErr as Error).message)
  }

  try {
    const stats = getBufferStats();
    const bufferList = (stats.articles || [])
      .filter((a) => a.publishStatus !== 'PUBLISHED')
      .slice(0, 15);
    for (const a of bufferList) {
      const headline = a.headline || '';
      const summary = (a.summary || a.fullContent || '').slice(0, 500);
      if (!headline) continue;
      data.push({
        id: a.bufferId || a.id,
        title: headline,
        content: summary,
        priority: a.priority ?? 7,
        source: 'SIA_CONTENT_BUFFER',
        published_at: a.createdAt
      });
    }
  } catch (bufErr) {
    console.warn('[WAR_ROOM_FEED] Buffer read failed:', (bufErr as Error).message)
  }

  if (data.length === 0) {
    const shuffled = [...newsTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6).map((item, i) => ({
      id: `tpl_${item.priority}_${i}`,
      title: lang === 'tr' ? (item.titleTr || item.title) : item.title,
      content: lang === 'tr' ? (item.contentTr || item.content) : item.content,
      titleTr: item.titleTr || item.title,
      contentTr: item.contentTr || item.content,
      titleEn: item.title,
      contentEn: item.content,
      priority: item.priority,
      source: 'SIA_LIVE_RADAR',
      published_at: new Date().toISOString()
    }));
    data.push(...selected);
  }

  const sorted = data.sort((a, b) => {
    const ta = new Date(a.published_at || 0).getTime();
    const tb = new Date(b.published_at || 0).getTime();
    return tb - ta;
  });

  // Fetch published titles for duplicate detection on client
  let publishedTitles: string[] = [];
  try {
    publishedTitles = await getPublishedTitles();
  } catch (titlesErr) {
    console.warn('[WAR_ROOM_FEED] Published titles fetch failed:', (titlesErr as Error).message)
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
