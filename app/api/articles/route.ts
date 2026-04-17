/**
 * Articles API - List and Create
 * GET /api/articles?lang=tr&category=ECONOMY&limit=10
 * POST /api/articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getArticlesByLang } from '@/lib/articles/queries'
import { createArticle } from '@/lib/articles/mutations'
import type { SupportedLang, CreateArticleInput } from '@/lib/articles/types'
import {
  PUBLIC_ROUTE_LOCALES,
  normalizePublicRouteLocale,
  toDictionaryLocale,
  type PublicRouteLocale,
} from '@/lib/i18n/route-locales'
import { mapArticleLanguageToRouteLocale, submitUrlsToIndexNow } from '@/lib/seo/indexnow-submit'
import { buildGoldenKeywordAdvisory } from '@/lib/seo/golden-keyword-prelaunch'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestedLang = searchParams.get('lang') || 'en'
    const normalizedRequestedLang = requestedLang.toLowerCase()

    if (!PUBLIC_ROUTE_LOCALES.includes(normalizedRequestedLang as (typeof PUBLIC_ROUTE_LOCALES)[number])) {
      return NextResponse.json(
        { success: false, error: `Invalid language: ${requestedLang}` },
        { status: 400 }
      )
    }

    const routeLang = normalizePublicRouteLocale(normalizedRequestedLang)
    const lang = toDictionaryLocale(routeLang) as SupportedLang
    const category = searchParams.get('category') || undefined
    const featured = searchParams.get('featured') === 'true' ? true : undefined
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const articles = await getArticlesByLang({
      lang,
      category,
      featured,
      limit,
      offset,
    })

    const normalizedArticles = articles.map((article) => ({
      ...article,
      translation: {
        ...article.translation,
        lang: routeLang,
      },
    }))

    return NextResponse.json({
      success: true,
      data: normalizedArticles,
      meta: {
        lang: routeLang,
        category,
        limit,
        offset,
        count: normalizedArticles.length,
      },
    })
  } catch (error) {
    console.error('[API] Get articles error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateArticleInput

    // Validate required fields
    if (!body.category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      )
    }

    if (!body.translations?.en) {
      return NextResponse.json(
        { success: false, error: 'English translation is required' },
        { status: 400 }
      )
    }

    const goldenKeyword = buildGoldenKeywordAdvisory({
      routeLang: 'en',
      category: body.category,
      title: body.translations.en.title,
      summary: body.translations.en.excerpt,
      content: body.translations.en.content,
    })

    if (goldenKeyword.status === 'stuffing-risk') {
      console.warn('[API] Create article golden keyword restraint warning:', {
        category: goldenKeyword.category,
        keyword: goldenKeyword.primaryKeyword,
        recommendations: goldenKeyword.recommendations,
      })
    }

    const article = await createArticle(body)

    let indexNow: {
      attempted: boolean
      submitted: boolean
      success: boolean
      reason?: string
      urls: string[]
    } | undefined

    if (article.published && Array.isArray(article.translations) && article.translations.length > 0) {
      const routeSlugByLocale = new Map<PublicRouteLocale, string>()

      for (const translation of article.translations) {
        const routeLocale = mapArticleLanguageToRouteLocale(translation.lang)
        if (!routeLocale) continue
        if (!translation.slug || !translation.title || !translation.content) continue

        if (!routeSlugByLocale.has(routeLocale)) {
          routeSlugByLocale.set(routeLocale, translation.slug)
        }
      }

      if (routeSlugByLocale.has('en')) {
        routeSlugByLocale.set('pt-br', routeSlugByLocale.get('en') as string)
      }

      const baseUrl =
        (process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          'https://siaintel.com').replace(/\/+$/, '')

      const canonicalUrls = Array.from(routeSlugByLocale.entries()).map(
        ([routeLocale, slug]) => `${baseUrl}/${routeLocale}/news/${slug}`
      )

      if (canonicalUrls.length > 0) {
        const indexNowResult = await submitUrlsToIndexNow(canonicalUrls, 'articles-create')
        indexNow = {
          attempted: true,
          submitted: indexNowResult.submitted,
          success: indexNowResult.success,
          reason: indexNowResult.error || indexNowResult.reason,
          urls: indexNowResult.acceptedUrls,
        }

        if (!indexNowResult.success) {
          console.warn('[API] Create article IndexNow skipped/failed:', {
            reason: indexNowResult.reason,
            error: indexNowResult.error,
          })
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: article,
        goldenKeyword,
        indexNow,
        message: 'Article created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Create article error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create article',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    )
  }
}
