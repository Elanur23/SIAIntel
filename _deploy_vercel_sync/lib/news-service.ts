export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
}

export async function fetchMultiSourceNews(): Promise<NewsArticle[]> {
  return [];
}

export async function fetchFromRSSFeeds(): Promise<NewsArticle[]> {
  return [];
}

/** Alias for API compatibility: multi-source route expects this name and optional keyword */
export const fetchNewsFromMultipleSources = (keyword?: string): Promise<NewsArticle[]> =>
  fetchMultiSourceNews()
