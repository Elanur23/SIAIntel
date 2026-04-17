import { DefaultSeoProps } from 'next-seo'

export const seoConfig: DefaultSeoProps = {
  titleTemplate: '%s | SIA Intelligence',
  defaultTitle: 'SIA Intelligence - Global AI, Macro & Crypto Terminal',
  description: 'Sovereign financial intelligence terminal providing real-time AI, macro, and crypto insights. Empowering global investors with neural analytics and deep research.',
  canonical: 'https://siaintel.com',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://siaintel.com',
    siteName: 'SIA Intelligence',
    title: 'SIA Intelligence - Global Financial Terminal',
    description: 'Autonomous financial intelligence powered by advanced neural models.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'SIA Intelligence Sovereign Terminal',
      },
    ],
  },
  
  twitter: {
    handle: '@SIAIntel',
    site: '@SIAIntel',
    cardType: 'summary_large_image',
  },
  
  ...(process.env.FACEBOOK_APP_ID && {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
    },
  }),
  
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'SIAIntel',
    },
    {
      name: 'application-name',
      content: 'SIA Intelligence Terminal',
    },
    {
      name: 'msapplication-TileColor',
      content: '#020203',
    },
    {
      name: 'msapplication-config',
      content: '/browserconfig.xml',
    },
    {
      name: 'theme-color',
      content: '#020203',
    },
    {
      name: 'format-detection',
      content: 'telephone=no, address=no, email=no',
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-touch-fullscreen',
      content: 'yes',
    },
  ],
  
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.svg',
      sizes: '180x180',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
    {
      rel: 'mask-icon',
      href: '/safari-pinned-tab.svg',
      color: '#2c3e50',
    },
    {
      rel: 'shortcut icon',
      href: '/favicon.ico',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preconnect',
      href: 'https://pagead2.googlesyndication.com',
    },
    {
      rel: 'preconnect',
      href: 'https://www.google-analytics.com',
    },
    {
      rel: 'dns-prefetch',
      href: '//images.unsplash.com',
    },
    {
      rel: 'dns-prefetch',
      href: '//cdnjs.cloudflare.com',
    },
  ],
}

// Article SEO configuration
export const articleSeoConfig = {
  type: 'article',
  publishedTime: new Date().toISOString(),
  modifiedTime: new Date().toISOString(),
  section: 'News',
  tags: ['AI', 'Macro', 'Crypto', 'Financial Intelligence'],
  authors: ['SIA Intelligence Unit'],
}

// Category SEO configuration
export const categorySeoConfig = {
  type: 'website',
  section: 'Category',
}

// Search SEO configuration
export const searchSeoConfig = {
  type: 'website',
  section: 'Search Results',
  noindex: true,
  nofollow: true,
}