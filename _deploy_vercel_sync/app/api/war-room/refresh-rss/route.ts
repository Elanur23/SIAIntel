/**
 * WAR ROOM - RSS Radar Refresh
 * RSS feed'lerden haber çeker, content buffer'a ekler.
 * Throttle: en fazla 60 saniyede bir çalışır.
 */

import { NextResponse } from 'next/server';
import { aggregateNews } from '@/lib/sovereign-core/scout';
import { addToBuffer, getBufferStats } from '@/lib/content/content-buffer-system';
import { newsItemToGeneratedArticle } from '@/lib/warroom/rss-to-buffer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const THROTTLE_MS = 60 * 1000; // 60 saniye
const MAX_SEEN_HASHES = 500;

let lastRefreshAt = 0;
const seenHashes = new Set<string>();

function pruneSeenHashes() {
  if (seenHashes.size > MAX_SEEN_HASHES) {
    const arr = Array.from(seenHashes);
    arr.slice(0, arr.length - MAX_SEEN_HASHES).forEach(h => seenHashes.delete(h));
  }
}

export async function GET() {
  const now = Date.now();
  if (now - lastRefreshAt < THROTTLE_MS) {
    const stats = getBufferStats();
    return NextResponse.json({
      success: true,
      throttled: true,
      added: 0,
      total: stats.total,
      nextRefreshIn: Math.ceil((THROTTLE_MS - (now - lastRefreshAt)) / 1000)
    });
  }

  lastRefreshAt = now;
  let added = 0;

  try {
    const items = await aggregateNews();
    for (const item of items) {
      if (seenHashes.has(item.hash)) continue;
      seenHashes.add(item.hash);
      pruneSeenHashes();
      const article = newsItemToGeneratedArticle(item);
      addToBuffer(article);
      added++;
    }

    const stats = getBufferStats();
    return NextResponse.json({
      success: true,
      throttled: false,
      added,
      total: stats.total,
      fetched: items.length
    });
  } catch (e) {
    console.error('[WAR_ROOM] refresh-rss error:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message, added: 0 },
      { status: 500 }
    );
  }
}
