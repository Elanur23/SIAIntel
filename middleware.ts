import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isLocaleSegment, normalizePublicRouteLocale } from '@/lib/i18n/route-locales'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const isAdminPath =
    pathname.startsWith('/admin') ||
    (pathSegments.length > 1 && isLocaleSegment(pathSegments[0]) && pathSegments[1] === 'admin')

  // 1. Immediate 404 for known missing static assets to prevent hitting [lang] route
  if (
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    (pathname.endsWith('.txt') && pathname !== '/robots.txt')
  ) {
    // Only return 404 if it's not one of our known static assets
    const isKnownAsset =
      /favicon\.svg|logo\.svg|icon\.svg|apple-touch-icon\.svg|og-image\.svg|manifest\.json|site\.webmanifest|sw\.js|feed\.xml/.test(
        pathname
      )
    if (!isKnownAsset) {
      return new NextResponse(null, { status: 404 })
    }
  }

  const segments = pathname.split('/')
  const firstSegment = segments[1]

  if (firstSegment && isLocaleSegment(firstSegment.toLowerCase())) {
    const normalizedLocale = normalizePublicRouteLocale(firstSegment)
    if (firstSegment !== normalizedLocale) {
      const redirectUrl = request.nextUrl.clone()
      segments[1] = normalizedLocale
      redirectUrl.pathname = segments.join('/')
      return NextResponse.redirect(redirectUrl, 308)
    }
  }

  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Development mode için unsafe-eval ekle (Hot Reload için gerekli)
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.google.com https://*.googletagmanager.com https://*.google-analytics.com https://www.googletagmanager.com https://tagmanager.google.com`
    : `'self' 'unsafe-inline' https://*.googlesyndication.com https://*.google.com https://*.googletagmanager.com https://*.google-analytics.com https://www.googletagmanager.com https://tagmanager.google.com`

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: https://*.google-analytics.com https://*.googlesyndication.com https://*.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://*.google.com https://*.doubleclick.net https://*.googlesyndication.com https://*.adtrafficquality.google https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;
    connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://region1.google-analytics.com;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)

  if (isAdminPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.svg|logo.svg|icon.svg|apple-touch-icon.svg|og-image.svg|manifest.json|site.webmanifest|sw.js|feed.xml).*)',
  ],
}
