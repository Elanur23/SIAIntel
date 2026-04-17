/**
 * NewsArticleSchema Component
 * Automatically injects JSON-LD structured data into news articles
 * 
 * Usage:
 * <NewsArticleSchema article={articleData} />
 */

import { generateNewsArticleSchema, type NewsArticleData } from '@/lib/seo/NewsArticleSchema'

interface NewsArticleSchemaProps {
  article: NewsArticleData
}

export default function NewsArticleSchema({ article }: NewsArticleSchemaProps) {
  const schema = generateNewsArticleSchema(article)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  )
}
