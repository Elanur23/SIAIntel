export interface SpeakableSpecification {
  '@type': 'SpeakableSpecification'
  cssSelector: string[]
}

const SPEAKABLE_ELIGIBLE_ROUTE_LOCALES = new Set<string>(['en'])

function normalizeSelector(selector: string): string {
  return selector.trim()
}

export function getVisibleSummaryText(summary: string | null | undefined): string {
  if (typeof summary !== 'string') {
    return ''
  }

  return summary.trim()
}

export function buildSpeakableForVisibleSummary(params: {
  routeLang: string
  summary: string | null | undefined
  selector: string
}): SpeakableSpecification | undefined {
  const routeLang = params.routeLang.toLowerCase()
  if (!SPEAKABLE_ELIGIBLE_ROUTE_LOCALES.has(routeLang)) {
    return undefined
  }

  const summary = getVisibleSummaryText(params.summary)
  if (!summary) {
    return undefined
  }

  const selector = normalizeSelector(params.selector)
  if (!selector || (!selector.startsWith('#') && !selector.startsWith('.'))) {
    return undefined
  }

  return {
    '@type': 'SpeakableSpecification',
    cssSelector: [selector],
  }
}
