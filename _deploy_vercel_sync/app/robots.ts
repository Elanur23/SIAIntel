import { MetadataRoute } from 'next'

const BASE_URL = 'https://siaintel.com'

// AI content-scraping bots that train LLMs without permission
const AI_SCRAPERS = [
  'GPTBot',           // OpenAI
  'ChatGPT-User',     // OpenAI browsing
  'CCBot',            // Common Crawl (used by many AI trainers)
  'anthropic-ai',     // Anthropic
  'Claude-Web',       // Anthropic Claude
  'Bytespider',       // ByteDance/TikTok
  'Amazonbot',        // Amazon Alexa AI
  'omgili',           // Social media scraper
  'Diffbot',          // AI data extraction
  'ImagesiftBot',     // Image AI training
  'YouBot',           // You.com AI
  'PerplexityBot',    // Perplexity AI
  'cohere-ai',        // Cohere
  'AI2Bot',           // Allen Institute
  'FacebookBot',      // Meta AI training
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all crawlers, block private paths
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/test-',
          '/*.old',
          '/auth/',
        ],
      },
      // Googlebot: full access with standard restrictions
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test-', '/auth/'],
      },
      // Googlebot-Image: allow article images
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Bingbot: full access
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/auth/'],
      },
      // Block all known AI training scrapers
      ...AI_SCRAPERS.map(bot => ({
        userAgent: bot,
        disallow: '/',
      })),
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/news-sitemap.xml`,  // Google News Sitemap
    ],
  }
}
