/**
 * DEBUG VERSION - Add console.log statements to diagnose slug resolution
 * Replace page.tsx temporarily with this file to debug
 */

// Add this at the top of resolveDetailArticle function:
export async function resolveDetailArticle(
  slugParam: string,
  routeLang: PublicRouteLocale
): Promise<ResolvedDetailArticle | null> {
  console.log('=== SLUG RESOLUTION DEBUG ===')
  console.log('Input slugParam:', slugParam)
  console.log('Input routeLang:', routeLang)
  console.log('slugParam length:', slugParam.length)
  console.log('isCanonicalNewsSlug:', isCanonicalNewsSlug(slugParam))
  
  const { idCandidates, slugCandidates } = parseRouteSlugParam(slugParam)
  console.log('ID candidates:', idCandidates)
  console.log('Slug candidates:', slugCandidates)
  
  const normalized = await resolveFromNormalizedModel(slugParam, routeLang)
  console.log('Normalized model result:', normalized ? 'FOUND' : 'NOT FOUND')
  if (normalized) {
    console.log('  - Article ID:', normalized.id)
    console.log('  - Canonical slug:', normalized.canonicalSlug)
    return normalized
  }

  const warroom = await resolveFromWarRoomModel(slugParam, routeLang)
  console.log('WarRoom model result:', warroom ? 'FOUND' : 'NOT FOUND')
  if (warroom) {
    console.log('  - Article ID:', warroom.id)
    console.log('  - Canonical slug:', warroom.canonicalSlug)
  }
  
  console.log('=== END DEBUG ===')
  return warroom
}

// Add this inside resolveFromNormalizedModel after each query:
async function resolveFromNormalizedModel(
  slugParam: string,
  routeLang: PublicRouteLocale
): Promise<ResolvedDetailArticle | null> {
  const { idCandidates, slugCandidates } = parseRouteSlugParam(slugParam)

  if (idCandidates.length > 0) {
    console.log('Querying by ID:', idCandidates)
    const byId = await prisma.article.findFirst({
      where: {
        id: { in: idCandidates },
        published: true,
      },
      include: {
        translations: true,
      },
    })
    console.log('By ID result:', byId ? 'FOUND' : 'NOT FOUND')
    if (byId) {
      return mapNormalizedArticle(byId as unknown as NormalizedArticleRecord, routeLang)
    }
  }

  const preferredLang = toSupportedArticleLang(routeLang)
  console.log('Preferred lang:', preferredLang)

  for (const slug of slugCandidates) {
    console.log('Trying slug:', slug)
    
    // Exact match
    const preferredTranslation = await prisma.articleTranslation.findUnique({
      where: {
        slug_lang: {
          slug,
          lang: preferredLang,
        },
      },
      include: {
        article: {
          include: {
            translations: true,
          },
        },
      },
    })
    console.log('  Exact match result:', preferredTranslation ? 'FOUND' : 'NOT FOUND')

    if (preferredTranslation?.article?.published) {
      return mapNormalizedArticle(
        preferredTranslation.article as unknown as NormalizedArticleRecord,
        routeLang,
        slug
      )
    }

    // Prefix match
    console.log('  Trying prefix match with:', slug)
    const prefixMatch = await prisma.articleTranslation.findFirst({
      where: {
        slug: {
          startsWith: slug,
        },
        lang: preferredLang,
        article: {
          published: true,
        },
      },
      include: {
        article: {
          include: {
            translations: true,
          },
        },
      },
    })
    console.log('  Prefix match result:', prefixMatch ? 'FOUND' : 'NOT FOUND')
    if (prefixMatch) {
      console.log('    Matched slug:', prefixMatch.slug)
      console.log('    Article ID:', prefixMatch.articleId)
    }

    if (prefixMatch?.article?.published) {
      return mapNormalizedArticle(
        prefixMatch.article as unknown as NormalizedArticleRecord,
        routeLang,
        prefixMatch.slug
      )
    }
  }

  return null
}
