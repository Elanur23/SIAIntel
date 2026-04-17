/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  
  // Sitemap generation options
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  
  // Exclude paths
  exclude: [
    '/admin/*',
    '/api/*',
    '/private/*',
    '/404',
    '/500',
    '/server-sitemap-index.xml',
  ],
  
  // Additional paths - 9 dil için [lang] prefix Next.js sitemap.ts'de
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
  ],
  
  // Custom transformation for different page types
  transform: async (config, path) => {
    // Default transformation
    const defaultTransform = {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }

    // Custom priorities and change frequencies
    if (path === '/') {
      return {
        ...defaultTransform,
        priority: 1.0,
        changefreq: 'hourly',
      }
    }

    if (path.startsWith('/haber/')) {
      return {
        ...defaultTransform,
        priority: 0.9,
        changefreq: 'weekly',
      }
    }

    if (path.startsWith('/kategori/')) {
      return {
        ...defaultTransform,
        priority: 0.8,
        changefreq: 'daily',
      }
    }

    if (path.startsWith('/arama/')) {
      return {
        ...defaultTransform,
        priority: 0.3,
        changefreq: 'monthly',
      }
    }

    return defaultTransform
  },
  
  // Robots.txt options
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/', '/_next/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/sitemap.xml`,
      `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/news-sitemap.xml`,
    ],
  },
  
  // Alternate language versions - 9 dil
  alternateRefs: [
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/en`, hreflang: 'en' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/tr`, hreflang: 'tr' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/de`, hreflang: 'de' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/fr`, hreflang: 'fr' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/es`, hreflang: 'es' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/ru`, hreflang: 'ru' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/ar`, hreflang: 'ar' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/jp`, hreflang: 'ja' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/zh`, hreflang: 'zh' },
    { href: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/en`, hreflang: 'x-default' },
  ],
}