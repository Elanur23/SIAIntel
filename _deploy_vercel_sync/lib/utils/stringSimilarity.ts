// lib/utils/stringSimilarity.ts

/**
 * İki string arasındaki benzerlik skorunu hesaplar (Gelişmiş Jaccard Index)
 * @param str1 - İlk string
 * @param str2 - İkinci string
 * @returns 0-1 arası benzerlik skoru
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const clean = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2)
  const words1 = clean(str1)
  const words2 = clean(str2)

  const intersection = words1.filter(w => words2.includes(w))
  const union = new Set([...words1, ...words2])

  // Jaccard Benzerlik İndeksi (0 ile 1 arası değer döner)
  return intersection.length / union.size
}

/**
 * Haberleri benzerliklerine göre gruplar
 * @param articles - Haber listesi
 * @param threshold - Benzerlik eşiği (0-1 arası, varsayılan 0.3)
 * @returns Gruplanmış haberler
 */
export function groupSimilarArticles<T extends { id: string; title: string }>(
  articles: T[],
  threshold: number = 0.3
): Array<{ main: T; similar: T[] }> {
  const processed = new Set<string>()
  const groups: Array<{ main: T; similar: T[] }> = []

  for (const article of articles) {
    if (processed.has(article.id)) continue

    const similar: T[] = []
    processed.add(article.id)

    for (const other of articles) {
      if (other.id === article.id || processed.has(other.id)) continue

      const similarity = calculateSimilarity(article.title, other.title)
      if (similarity >= threshold) {
        similar.push(other)
        processed.add(other.id)
      }
    }

    groups.push({ main: article, similar })
  }

  return groups
}
