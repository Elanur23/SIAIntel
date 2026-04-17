/**
 * Next.js Configuration with Security Headers
 * 
 * Includes PWA support and comprehensive security headers.
 */

import type { NextConfig } from 'next'

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { 
        cacheName: 'google-fonts-webfonts', 
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } 
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { 
        cacheName: 'google-fonts-stylesheets', 
        expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 } 
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: 'CacheFirst',
      options: { 
        cacheName: 'static-images', 
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 } 
      },
    },
  ],
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ESLint runs separately via CI – don't block the build on warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },
  
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  output: 'standalone',

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // X-DNS-Prefetch-Control: Enable DNS prefetching for performance
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            // X-Frame-Options: Prevent clickjacking (DENY = no iframe embedding)
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            // X-Content-Type-Options: Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            // Referrer-Policy: Control referrer information
            // strict-origin-when-cross-origin = full URL for same-origin, origin only for cross-origin
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Permissions-Policy: Disable potentially dangerous browser features
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()'
          },
        ],
      },
      {
        // HSTS for production only (forces HTTPS)
        source: '/:path*',
        headers: process.env.NODE_ENV === 'production' ? [
          {
            // Strict-Transport-Security: Force HTTPS for 1 year
            // includeSubDomains = apply to all subdomains
            // preload = allow inclusion in browser HSTS preload lists
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ] : [],
      },
    ]
  }
}

module.exports = withPWA(nextConfig)
