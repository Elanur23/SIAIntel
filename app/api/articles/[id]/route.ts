import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  PUBLIC_ROUTE_LOCALES,
  normalizePublicRouteLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

function getAvailableRouteLanguages(article: any): string[] {
  const available = new Set<string>()

  for (const lang of article.languages || []) {
    if (typeof lang !== 'string') continue
    available.add(normalizePublicRouteLocale(lang))
  }

  if (available.has('en')) {
    available.add('pt-br')
  }

  return PUBLIC_ROUTE_LOCALES.filter((lang) => available.has(lang))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const prefetchAll = searchParams.get('prefetch') === 'true'

    console.log(`[API] ===== REQUEST START =====`)
    console.log(`[API] Fetching article: ${id}`)
    console.log(`[API] Prefetch mode: ${prefetchAll}`)
    console.log(`[API] Full URL: ${request.url}`)
    console.log(`[API] ==========================`)

    // Read workspace file
    const workspacePath = path.join(process.cwd(), 'ai_workspace.json')
    console.log(`[API] Workspace path: ${workspacePath}`)
    
    const workspaceData = fs.readFileSync(workspacePath, 'utf-8')
    const workspace = JSON.parse(workspaceData)

    console.log(`[API] Workspace loaded successfully`)
    console.log(`[API] Workspace status: ${workspace.status}`)
    console.log(`[API] Articles count: ${workspace.articles?.length || 0}`)

    if (!workspace.articles || workspace.articles.length === 0) {
      console.error('[API] ❌ No articles found in workspace')
      return NextResponse.json(
        { success: false, error: 'No articles found in workspace' },
        { status: 404 }
      )
    }

    // Log all article IDs for debugging
    console.log('[API] Available article IDs:', workspace.articles.map((a: any) => a.id))

    // Find article by ID (case-sensitive exact match)
    const article = workspace.articles.find((a: any) => a.id === id)

    if (!article) {
      console.error(`[API] ❌ Article not found: ${id}`)
      console.error(`[API] Available IDs: ${workspace.articles.map((a: any) => a.id).join(', ')}`)
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    console.log(`[API] ✅ Article found: ${id}`)
    console.log(`[API] Article status: ${article.status}`)
    console.log(`[API] Available languages: ${getAvailableRouteLanguages(article).join(', ')}`)
    console.log(`[API] Article keys:`, Object.keys(article))

    // THE_FINAL_SEAL_V6: Return all 9 languages in a single fetch
    if (prefetchAll) {
      console.log('[API] 🔄 Prefetch mode: Loading all languages...')
      const allLanguages: Record<string, any> = {}
      
      for (const routeLang of PUBLIC_ROUTE_LOCALES) {
        const dictionaryLang = toDictionaryLocale(routeLang)
        console.log(`[API] Checking route language: ${routeLang} (dictionary: ${dictionaryLang})`)
        console.log(`[API] article[${dictionaryLang}] exists:`, !!article[dictionaryLang])

        if (article[dictionaryLang]) {
          console.log(`[API] article[${dictionaryLang}] keys:`, Object.keys(article[dictionaryLang]))
          console.log(
            `[API] article[${dictionaryLang}].content exists:`,
            !!article[dictionaryLang].content
          )
          console.log(
            `[API] article[${dictionaryLang}].content length:`,
            article[dictionaryLang].content?.length || 0
          )

          if (article[dictionaryLang].content) {
            console.log(
              `[API] ${routeLang} content preview:`,
              article[dictionaryLang].content.substring(0, 100)
            )
          }

          allLanguages[routeLang] = {
            title: article[dictionaryLang].title,
            summary: article[dictionaryLang].summary,
            content: article[dictionaryLang].content,
          }
          console.log(
            `[API] ✅ Loaded ${routeLang}: ${article[dictionaryLang].content?.length || 0} chars`
          )
        } else {
          console.warn(`[API] ⚠️ Language ${routeLang} not found in article`)
        }
      }

      const prefetchedLanguages = Object.keys(allLanguages)

      console.log('[API] ===== PREFETCH RESPONSE =====')
      console.log('[API] Total languages loaded:', prefetchedLanguages.length)
      console.log('[API] Languages:', prefetchedLanguages.join(', '))
      console.log('[API] Content sizes:', Object.entries(allLanguages).map(([k, v]: [string, any]) => `${k}: ${v.content?.length || 0}`).join(', '))
      console.log('[API] ===== THE_ARCHITECTS_SEAL_V13: EXACT PAYLOAD STRUCTURE =====')
      console.log('[API] Response will be: { success: true, data: { allLanguages: {...} } }')
      console.log('[API] Each language object has: { title, summary, content }')
      console.log('[API] Example - allLanguages.ja:', {
        title: allLanguages['ja']?.title?.substring(0, 50) + '...',
        summary: allLanguages['ja']?.summary?.substring(0, 50) + '...',
        contentLength: allLanguages['ja']?.content?.length || 0,
        contentPreview: allLanguages['ja']?.content?.substring(0, 100) || 'MISSING'
      })
      console.log('[API] ================================================================')
      console.log('[API] ==================================')

      return NextResponse.json(
        {
          success: true,
          data: {
            id: article.id,
            status: article.status,
            created_at: article.created_at,
            updated_at: article.updated_at,
            audit_score: article.audit_score,
            languages: prefetchedLanguages,
            verification: article.verification,
            allLanguages,
          },
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // Single language fetch
    const requestedLang = searchParams.get('lang') || 'en'
    const normalizedRequestedLang = requestedLang.toLowerCase()

    if (!PUBLIC_ROUTE_LOCALES.includes(normalizedRequestedLang as (typeof PUBLIC_ROUTE_LOCALES)[number])) {
      return NextResponse.json(
        { success: false, error: `Invalid language '${requestedLang}'` },
        { status: 400 }
      )
    }

    const routeLang = normalizePublicRouteLocale(normalizedRequestedLang)
    const dictionaryLang = toDictionaryLocale(routeLang)
    console.log(`[API] Single language mode: ${routeLang} (dictionary: ${dictionaryLang})`)

    if (!article[dictionaryLang]) {
      console.error(`[API] ❌ Language '${routeLang}' not available for article ${id}`)
      console.error(`[API] Available languages: ${getAvailableRouteLanguages(article).join(', ')}`)
      return NextResponse.json(
        { success: false, error: `Language '${routeLang}' not available for this article` },
        { status: 404 }
      )
    }

    console.log(
      `[API] ✅ Returning ${routeLang} content: ${article[dictionaryLang].content?.length || 0} chars`
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: article.id,
          status: article.status,
          created_at: article.created_at,
          updated_at: article.updated_at,
          audit_score: article.audit_score,
          languages: getAvailableRouteLanguages(article),
          requestedLanguage: routeLang,
          verification: article.verification,
          title: article[dictionaryLang].title,
          summary: article[dictionaryLang].summary,
          content: article[dictionaryLang].content,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('[API] ❌ ERROR:', error)
    console.error('[API] Error stack:', (error as Error).stack)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    )
  }
}
