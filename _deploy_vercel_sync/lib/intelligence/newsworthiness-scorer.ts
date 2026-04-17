/**
 * SIA Newsworthiness Scoring Engine
 * 
 * Evaluates intelligence radar items and determines which headlines
 * are worth turning into full news articles.
 * 
 * Score: 0-100 → Tier: CRITICAL / HIGH / MEDIUM / LOW
 */

// ============================================================================
// TYPES
// ============================================================================

export type NewsworthinessTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PUBLISHED';

export interface NewsworthinessResult {
  score: number;           // 0-100
  tier: NewsworthinessTier;
  tierLabel: string;       // Turkish label
  tierColor: string;       // Tailwind-compatible color class
  tierBg: string;          // Background class
  reasons: string[];       // Why this score
  badge: string;           // Emoji badge
  alreadyPublished: boolean; // Duplicate detection flag
}

export interface ScoredFeedItem {
  item: any;
  nw: NewsworthinessResult;
}

// ============================================================================
// KEYWORD DICTIONARIES
// ============================================================================

/** Market-shaking keywords → highest points */
const CRITICAL_KEYWORDS = [
  'sec ', 'sec,', 'sec.', 'securities and exchange',
  'fed ', 'fed,', 'fed.', 'federal reserve', 'fomc',
  'hack', 'exploit', 'breach', 'stolen',
  'crash', 'collapse', 'plummet', 'panic',
  'ban', 'prohibit', 'crackdown',
  'approval', 'approved', 'etf approval', 'spot etf',
  'halving', 'halvening',
  'default', 'bankruptcy', 'insolvent',
  'war ', 'war,', 'invasion', 'sanction', 'embargo',
  'emergency', 'breaking', 'urgent', 'flash',
  'rate cut', 'rate hike', 'interest rate decision',
  'cpi ', 'cpi,', 'inflation data', 'jobs report', 'nonfarm',
  'all-time high', 'ath', 'new record',
  // Turkish critical keywords
  'acil', 'son dakika', 'çöküş', 'kriz', 'yasakla',
  'tcmb', 'merkez bankası', 'faiz kararı',
];

/** High-impact keywords */
const HIGH_KEYWORDS = [
  'surge', 'soar', 'skyrocket', 'rally', 'pump',
  'plunge', 'dump', 'drop', 'tumble', 'sell-off',
  'record', 'milestone', 'historic',
  'regulation', 'regulatory', 'compliance', 'framework',
  'lawsuit', 'legal', 'indictment', 'investigation',
  'partnership', 'collaboration', 'alliance',
  'acquisition', 'merger', 'buyout', 'takeover',
  'whale', 'whale alert', 'large transfer',
  'breakout', 'breakdown', 'resistance', 'support flip',
  'institutional', 'blackrock', 'fidelity', 'grayscale',
  'elon musk', 'trump', 'gensler', 'powell',
  'listing', 'delist', 'binance', 'coinbase',
  'stablecoin', 'usdt', 'usdc', 'depeg',
  'inflow', 'outflow', 'etf flow',
  // Turkish high keywords
  'rekor', 'tarihi', 'patlama', 'yükseliş', 'düşüş',
  'dava', 'soruşturma', 'ortaklık', 'satın alma',
];

/** Moderate interest keywords */
const MEDIUM_KEYWORDS = [
  'update', 'upgrade', 'launch', 'release',
  'adoption', 'integration', 'deploy',
  'network', 'protocol', 'layer-2', 'l2',
  'defi', 'nft', 'gamefi', 'metaverse',
  'airdrop', 'staking', 'yield',
  'report', 'analysis', 'forecast', 'outlook',
  'mining', 'hashrate', 'difficulty',
  'testnet', 'mainnet', 'hard fork',
  // Turkish medium keywords
  'güncelleme', 'lansman', 'rapor', 'analiz',
];

/** Known credible sources */
const PREMIUM_SOURCES = [
  'reuters', 'bloomberg', 'coindesk', 'cointelegraph',
  'the block', 'decrypt', 'wsj', 'wall street journal',
  'financial times', 'ft.com', 'cnbc', 'bbc',
  'associated press', 'ap news', 'nytimes', 'new york times',
  'guardian', 'economist', 'forbes',
  'binance', 'coinbase', 'kraken',
  'chainalysis', 'glassnode', 'messari',
];

const STANDARD_SOURCES = [
  'cryptoslate', 'bitcoinist', 'newsbtc', 'u.today',
  'ambcrypto', 'beincrypto', 'crypto.news',
  'investing.com', 'tradingview', 'seekingalpha',
  'yahoo finance', 'marketwatch',
];

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score based on market-moving keywords (0-30)
 */
function scoreKeywords(text: string): { score: number; reasons: string[] } {
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Critical keywords (15 pts each, max 30)
  let criticalHits = 0;
  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      criticalHits++;
      if (criticalHits <= 2) {
        score += 15;
        reasons.push(`Critical keyword: "${kw.trim()}"`);
      }
    }
  }

  // High keywords (8 pts each, max 24)
  if (score < 30) {
    let highHits = 0;
    for (const kw of HIGH_KEYWORDS) {
      if (lower.includes(kw)) {
        highHits++;
        if (highHits <= 3) {
          score += 8;
          reasons.push(`High-impact: "${kw.trim()}"`);
        }
      }
    }
  }

  // Medium keywords (4 pts each, max 12)
  if (score < 20) {
    let medHits = 0;
    for (const kw of MEDIUM_KEYWORDS) {
      if (lower.includes(kw)) {
        medHits++;
        if (medHits <= 3) {
          score += 4;
          reasons.push(`Relevant: "${kw.trim()}"`);
        }
      }
    }
  }

  return { score: Math.min(30, score), reasons };
}

/**
 * Score based on freshness (0-20)
 */
function scoreFreshness(publishedAt: string | undefined): { score: number; reasons: string[] } {
  if (!publishedAt) return { score: 5, reasons: ['No timestamp (default freshness)'] };

  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageMin = ageMs / 60000;

  if (ageMin < 30) return { score: 20, reasons: ['🔥 Breaking: < 30 min ago'] };
  if (ageMin < 60) return { score: 16, reasons: ['Very fresh: < 1 hour'] };
  if (ageMin < 180) return { score: 12, reasons: ['Fresh: < 3 hours'] };
  if (ageMin < 360) return { score: 7, reasons: ['Recent: < 6 hours'] };
  if (ageMin < 720) return { score: 3, reasons: ['Aging: < 12 hours'] };
  return { score: 0, reasons: ['Old: > 12 hours'] };
}

/**
 * Score based on title/content quality and specificity (0-20)
 */
function scoreQuality(title: string, content: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const combined = `${title} ${content}`;

  // Has specific numbers or percentages
  if (/\d+%|\$[\d,.]+|€[\d,.]+|\d+\s*(billion|million|thousand|milyar|milyon)/i.test(combined)) {
    score += 7;
    reasons.push('Contains specific data/numbers');
  }

  // Title is good length (informative but not too vague)
  const titleLen = title.length;
  if (titleLen >= 30 && titleLen <= 140) {
    score += 5;
    reasons.push('Well-formed headline');
  } else if (titleLen < 20) {
    reasons.push('Title too short/vague');
  }

  // Has named entities (uppercase words that look like proper nouns)
  const entities = title.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
  if (entities && entities.length >= 1) {
    score += 5;
    reasons.push(`Named entities: ${entities.slice(0, 3).join(', ')}`);
  }

  // Content has substance
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 20) {
    score += 3;
    reasons.push('Detailed content');
  }

  return { score: Math.min(20, score), reasons };
}

/**
 * Score based on source credibility (0-15)
 */
function scoreSource(source: string | undefined): { score: number; reasons: string[] } {
  if (!source) return { score: 3, reasons: ['Unknown source'] };

  const lower = source.toLowerCase();

  for (const s of PREMIUM_SOURCES) {
    if (lower.includes(s)) {
      return { score: 15, reasons: [`Premium source: ${source}`] };
    }
  }

  for (const s of STANDARD_SOURCES) {
    if (lower.includes(s)) {
      return { score: 10, reasons: [`Known source: ${source}`] };
    }
  }

  return { score: 5, reasons: [`Standard source: ${source || 'N/A'}`] };
}

/**
 * Score based on existing priority from buffer system (0-15)
 */
function scorePriority(priority: number | undefined): { score: number; reasons: string[] } {
  const p = priority ?? 5;
  if (p >= 9) return { score: 15, reasons: [`System priority P${p}`] };
  if (p >= 7) return { score: 10, reasons: [`System priority P${p}`] };
  if (p >= 5) return { score: 5, reasons: [`System priority P${p}`] };
  return { score: 2, reasons: [`Low system priority P${p}`] };
}

/**
 * Detect near-duplicate titles and penalize
 */
function deduplicationPenalty(title: string, allTitles: string[]): { penalty: number; reason: string | null } {
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  const norm = normalize(title);
  const words = new Set(norm.split(' '));

  for (const other of allTitles) {
    if (other === title) continue;
    const otherNorm = normalize(other);
    if (otherNorm === norm) return { penalty: -40, reason: 'Exact duplicate detected' };

    const otherWords = new Set(otherNorm.split(' '));
    const intersection = [...words].filter(w => otherWords.has(w) && w.length > 3);
    const similarity = intersection.length / Math.max(words.size, otherWords.size);

    if (similarity > 0.7) {
      return { penalty: -20, reason: `Very similar to: "${other.slice(0, 50)}..."` };
    }
  }

  return { penalty: 0, reason: null };
}

/**
 * Check if this headline was already published (exists in DB)
 */
function checkAlreadyPublished(
  title: string,
  publishedTitles: string[]
): boolean {
  if (publishedTitles.length === 0) return false;
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\sçğıöşü]/g, '').replace(/\s+/g, ' ').trim();

  const norm = normalize(title);
  const words = new Set(norm.split(' ').filter(w => w.length > 3));

  for (const pub of publishedTitles) {
    const pubNorm = normalize(pub);
    // Exact match
    if (norm === pubNorm) return true;
    // High word overlap
    const pubWords = new Set(pubNorm.split(' ').filter(w => w.length > 3));
    if (words.size === 0 || pubWords.size === 0) continue;
    const intersection = [...words].filter(w => pubWords.has(w));
    const similarity = intersection.length / Math.max(words.size, pubWords.size);
    if (similarity > 0.7) return true;
  }

  return false;
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score a single feed item for newsworthiness
 */
export function scoreNewsworthiness(
  item: { title?: string; content?: string; published_at?: string; source?: string; priority?: number; titleEn?: string; contentEn?: string; titleTr?: string; contentTr?: string },
  allTitles: string[],
  publishedTitles: string[] = []
): NewsworthinessResult {
  const title = item.titleEn || item.title || '';
  const titleTr = item.titleTr || '';
  const content = item.contentEn || item.content || '';
  const combined = `${title} ${content}`;

  // Check if already published
  const alreadyPublished = checkAlreadyPublished(title, publishedTitles) ||
    (titleTr ? checkAlreadyPublished(titleTr, publishedTitles) : false);

  if (alreadyPublished) {
    return {
      score: 0,
      tier: 'PUBLISHED',
      tierLabel: 'Zaten Yayınlandı',
      tierColor: 'text-emerald-400',
      tierBg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: '✅',
      reasons: ['Bu haber zaten yayınlanmış'],
      alreadyPublished: true,
    };
  }

  const kw = scoreKeywords(combined);
  const fresh = scoreFreshness(item.published_at);
  const quality = scoreQuality(title, content);
  const source = scoreSource(item.source);
  const priority = scorePriority(item.priority);
  const dedup = deduplicationPenalty(title, allTitles);

  const reasons = [...kw.reasons, ...fresh.reasons, ...quality.reasons, ...source.reasons, ...priority.reasons];
  if (dedup.reason) reasons.push(dedup.reason);

  const rawScore = kw.score + fresh.score + quality.score + source.score + priority.score + dedup.penalty;
  const score = Math.max(0, Math.min(100, rawScore));

  const tier = getTier(score);

  return {
    score,
    ...tier,
    reasons,
    alreadyPublished: false,
  };
}

/**
 * Score and sort entire feed by newsworthiness.
 * Published items sink to the bottom.
 */
export function rankFeed(feed: any[], publishedTitles: string[] = []): ScoredFeedItem[] {
  const allTitles = feed.map(item => item.titleEn || item.title || '');

  return feed
    .map(item => ({
      item,
      nw: scoreNewsworthiness(item, allTitles, publishedTitles),
    }))
    .sort((a, b) => {
      // Published items always go to bottom
      if (a.nw.alreadyPublished !== b.nw.alreadyPublished) {
        return a.nw.alreadyPublished ? 1 : -1;
      }
      return b.nw.score - a.nw.score;
    });
}

/**
 * Get only recommended items (CRITICAL + HIGH)
 */
export function getRecommended(feed: any[], publishedTitles: string[] = []): ScoredFeedItem[] {
  return rankFeed(feed, publishedTitles).filter(s => s.nw.tier === 'CRITICAL' || s.nw.tier === 'HIGH');
}

// ============================================================================
// HELPERS
// ============================================================================

function getTier(score: number): { tier: NewsworthinessTier; tierLabel: string; tierColor: string; tierBg: string; badge: string } {
  if (score >= 70) {
    return {
      tier: 'CRITICAL',
      tierLabel: 'Hemen Yayınla',
      tierColor: 'text-red-400',
      tierBg: 'bg-red-500/20 border-red-500/40',
      badge: '🔴',
    };
  }
  if (score >= 45) {
    return {
      tier: 'HIGH',
      tierLabel: 'Önerilen',
      tierColor: 'text-orange-400',
      tierBg: 'bg-orange-500/15 border-orange-500/30',
      badge: '🟠',
    };
  }
  if (score >= 25) {
    return {
      tier: 'MEDIUM',
      tierLabel: 'Değerlendir',
      tierColor: 'text-yellow-400',
      tierBg: 'bg-yellow-500/10 border-yellow-500/20',
      badge: '🟡',
    };
  }
  return {
    tier: 'LOW',
    tierLabel: 'Düşük Öncelik',
    tierColor: 'text-white/40',
    tierBg: 'bg-white/5 border-white/10',
    badge: '⚪',
  };
}
