/**
 * INTELLIGENCE DEDUPLICATION SYSTEM
 * Hash-based tracking to avoid reprocessing same news
 * Uses in-memory storage (production: SQLite/TinyDB)
 */

export interface SeenNews {
  hash: string;
  title: string;
  link: string;
  firstSeen: string;
  processedAt?: string;
  status: 'seen' | 'processed' | 'failed';
}

class DeduplicationSystem {
  private seenNews: Map<string, SeenNews> = new Map();
  private maxEntries = 10000; // Keep last 10k entries

  /**
   * Check if news has been seen before
   */
  isSeen(hash: string): boolean {
    return this.seenNews.has(hash);
  }

  /**
   * Mark news as seen
   */
  markAsSeen(hash: string, title: string, link: string): void {
    if (this.seenNews.size >= this.maxEntries) {
      // Remove oldest entries (FIFO)
      const firstKey = this.seenNews.keys().next().value;
      if (firstKey) {
        this.seenNews.delete(firstKey);
      }
    }

    this.seenNews.set(hash, {
      hash,
      title,
      link,
      firstSeen: new Date().toISOString(),
      status: 'seen'
    });

    console.log(`[DEDUP] Marked as seen: ${title.substring(0, 50)}...`);
  }

  /**
   * Mark news as processed
   */
  markAsProcessed(hash: string): void {
    const news = this.seenNews.get(hash);
    if (news) {
      news.status = 'processed';
      news.processedAt = new Date().toISOString();
      console.log(`[DEDUP] Marked as processed: ${hash}`);
    }
  }

  /**
   * Mark news as failed
   */
  markAsFailed(hash: string): void {
    const news = this.seenNews.get(hash);
    if (news) {
      news.status = 'failed';
      console.log(`[DEDUP] Marked as failed: ${hash}`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    seen: number;
    processed: number;
    failed: number;
  } {
    const stats = {
      total: this.seenNews.size,
      seen: 0,
      processed: 0,
      failed: 0
    };

    for (const news of this.seenNews.values()) {
      if (news.status === 'seen') stats.seen++;
      if (news.status === 'processed') stats.processed++;
      if (news.status === 'failed') stats.failed++;
    }

    return stats;
  }

  /**
   * Filter out seen news from array
   */
  filterUnseen<T extends { hash: string; title: string; link: string }>(
    newsItems: T[]
  ): T[] {
    const unseen = newsItems.filter(item => !this.isSeen(item.hash));
    
    // Mark new items as seen
    unseen.forEach(item => {
      this.markAsSeen(item.hash, item.title, item.link);
    });

    console.log(`[DEDUP] Filtered: ${newsItems.length} total → ${unseen.length} unseen`);
    
    return unseen;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.seenNews.clear();
    console.log('[DEDUP] Cleared all entries');
  }

  /**
   * Export data (for persistence)
   */
  export(): SeenNews[] {
    return Array.from(this.seenNews.values());
  }

  /**
   * Import data (from persistence)
   */
  import(data: SeenNews[]): void {
    this.seenNews.clear();
    data.forEach(item => {
      this.seenNews.set(item.hash, item);
    });
    console.log(`[DEDUP] Imported ${data.length} entries`);
  }
}

// Singleton instance
export const deduplicationSystem = new DeduplicationSystem();

/** Check if news hash was already seen */
export function isNewsSeen(hash: string): boolean {
  return deduplicationSystem.isSeen(hash);
}

/** Mark news as seen (adapter for object form from autonomous-engine) */
export function markNewsAsSeen(item: { hash: string; title: string; timestamp?: string; processedAt?: string; link?: string }): void {
  deduplicationSystem.markAsSeen(item.hash, item.title, item.link ?? item.timestamp ?? '');
  if (item.processedAt) deduplicationSystem.markAsProcessed(item.hash);
}

/** Stats for autonomous-engine */
export function getDeduplicationStats(): { total: number; seen: number; processed: number; failed: number } {
  return deduplicationSystem.getStats();
}

/** Remove entries older than given days (by firstSeen) */
export function cleanOldNews(daysOld: number): void {
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  const entries = deduplicationSystem.export();
  const recent = entries.filter((e) => new Date(e.firstSeen).getTime() >= cutoff);
  if (recent.length < entries.length) {
    deduplicationSystem.clear();
    deduplicationSystem.import(recent);
    console.log(`[DEDUP] cleanOldNews: removed ${entries.length - recent.length} entries older than ${daysOld} days`);
  }
}
