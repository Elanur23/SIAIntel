/**
 * SIA Intelligence — Reddit Pulse Fetcher
 *
 * Monitors key financial subreddits for unusual discussion velocity.
 * Uses Reddit's public JSON API — no OAuth required.
 *
 * Sources: r/wallstreetbets · r/investing · r/CryptoCurrency · r/economics
 * Scoring: upvotes + comments + awards + flair + high-signal keyword hits
 */

import type { RawSignal, SignalCategory } from './types'

interface SubredditFeed {
  url: string
  subreddit: string
  baseScore: number
  category: SignalCategory
}

const FEEDS: SubredditFeed[] = [
  {
    url: 'https://www.reddit.com/r/wallstreetbets/hot.json?limit=25',
    subreddit: 'wallstreetbets',
    baseScore: 62,
    category: 'STOCKS',
  },
  {
    url: 'https://www.reddit.com/r/investing/hot.json?limit=25',
    subreddit: 'investing',
    baseScore: 57,
    category: 'STOCKS',
  },
  {
    url: 'https://www.reddit.com/r/CryptoCurrency/hot.json?limit=25',
    subreddit: 'CryptoCurrency',
    baseScore: 57,
    category: 'CRYPTO',
  },
  {
    url: 'https://www.reddit.com/r/economics/hot.json?limit=25',
    subreddit: 'economics',
    baseScore: 52,
    category: 'ECONOMY',
  },
]

// High-signal financial terms that boost the score
const BOOST_KEYWORDS: Array<{ term: string; boost: number }> = [
  { term: 'earnings',      boost: 8  },
  { term: 'merger',        boost: 12 },
  { term: 'acquisition',   boost: 12 },
  { term: 'bankruptcy',    boost: 15 },
  { term: 'fraud',         boost: 12 },
  { term: 'investigation', boost: 10 },
  { term: 'delisted',      boost: 12 },
  { term: 'breaking',      boost: 8  },
  { term: 'ceo',           boost: 6  },
  { term: 'fired',         boost: 8  },
  { term: 'resign',        boost: 8  },
  { term: 'buyout',        boost: 12 },
  { term: 'ipo',           boost: 8  },
  { term: 'sec',           boost: 8  },
  { term: 'fda',           boost: 8  },
  { term: 'crash',         boost: 10 },
  { term: 'record',        boost: 5  },
  { term: 'rate cut',      boost: 10 },
  { term: 'rate hike',     boost: 10 },
  { term: 'federal reserve', boost: 8 },
  { term: 'inflation',     boost: 6  },
  { term: 'recession',     boost: 10 },
  { term: 'bitcoin',       boost: 5  },
  { term: 'lawsuit',       boost: 8  },
  { term: 'recall',        boost: 8  },
]

function scorePost(post: Record<string, unknown>, base: number): number {
  let score = base

  const title    = String(post.title ?? '').toLowerCase()
  const selftext = String(post.selftext ?? '').toLowerCase()
  const flair    = String(post.link_flair_text ?? '').toLowerCase()
  const ups      = Number(post.ups ?? 0)
  const comments = Number(post.num_comments ?? 0)
  const awards   = Number(post.total_awards_received ?? 0)
  const ratio    = Number(post.upvote_ratio ?? 0)

  // Logarithmic engagement boost (prevents viral low-quality posts from dominating)
  score += Math.min(Math.log10(Math.max(ups, 1)) * 5, 18)
  score += Math.min(Math.log10(Math.max(comments, 1)) * 3, 12)

  // Award signal: community-verified quality
  if (awards >= 10) score += 10
  else if (awards >= 3) score += 5

  // High upvote ratio with significant volume = quality content
  if (ratio >= 0.95 && ups >= 500) score += 6

  // Flair boosts
  if (flair.includes('news') || flair.includes('breaking')) score += 10
  if (flair.includes('dd') || flair.includes('analysis'))   score += 6
  if (flair.includes('discussion'))                          score += 3

  // Keyword analysis
  const combined = `${title} ${selftext}`
  for (const { term, boost } of BOOST_KEYWORDS) {
    if (combined.includes(term)) score += boost
  }

  return Math.min(Math.round(score), 95)
}

function extractTickers(text: string): string[] {
  const matches = text.match(/\$[A-Z]{2,5}\b/g) ?? []
  return [...new Set(matches.map(t => t.slice(1)))]
}

export async function fetchRedditSignals(): Promise<RawSignal[]> {
  const signals: RawSignal[] = []

  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: {
          // Reddit requires a descriptive User-Agent or returns 429
          'User-Agent': 'SIAIntel/1.0 financial-signal-aggregator (contact@siaintel.com)',
        },
        next: { revalidate: 600 }, // cache 10 min
      })

      if (!res.ok) throw new Error(`r/${feed.subreddit} responded ${res.status}`)

      const json = await res.json()
      const posts: Array<{ data: Record<string, unknown> }> =
        json?.data?.children ?? []

      for (const { data: post } of posts.slice(0, 15)) {
        // Skip pinned, stickied, or very-low-engagement posts
        if (post.stickied || post.pinned)        continue
        if (Number(post.ups ?? 0) < 100)         continue
        if (Number(post.upvote_ratio ?? 0) < 0.6) continue

        const score = scorePost(post, feed.baseScore)
        if (score < 55) continue // below minimum threshold

        const title    = String(post.title ?? '')
        const selftext = String(post.selftext ?? '')
        const tickers  = extractTickers(title)

        signals.push({
          id: `reddit_${String(post.id)}`,
          source: 'REDDIT_SPIKE',
          category: feed.category,
          title,
          summary: selftext
            ? selftext.substring(0, 220).trimEnd() + '…'
            : `Trending on r/${feed.subreddit} — ${Number(post.ups).toLocaleString()} upvotes · ${Number(post.num_comments)} comments`,
          entities: tickers,
          url: `https://reddit.com${String(post.permalink ?? '')}`,
          publishedAt: new Date(Number(post.created_utc ?? 0) * 1000).toISOString(),
          rawScore: score,
          metadata: {
            subreddit:  feed.subreddit,
            upvotes:    post.ups,
            comments:   post.num_comments,
            ratio:      post.upvote_ratio,
            flair:      post.link_flair_text,
            awards:     post.total_awards_received,
            tickers,
          },
        })
      }
    })
  )

  return signals
}
