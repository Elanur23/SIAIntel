import Script from 'next/script'

interface NewsArticleSchema {
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  publisher?: {
    name: string
    logo?: string
  }
}

export default function StructuredData({ data }: { data: NewsArticleSchema }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: data.headline,
    description: data.description,
    image: data.image || `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Organization',
      name: data.author || 'SIA Intelligence',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com',
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher?.name || 'SIA Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: data.publisher?.logo || `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': typeof window !== 'undefined' ? window.location.href : '',
    },
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
