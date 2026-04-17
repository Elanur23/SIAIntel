export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSchemaOptions {
  faqs: FAQItem[]
  articleUrl?: string
  articleTitle?: string
}

export interface FAQValidationResult {
  valid: boolean
  errors: string[]
}

export function validateFAQSchema(faqs: FAQItem[]): FAQValidationResult {
  const errors: string[] = []

  if (!Array.isArray(faqs) || faqs.length === 0) {
    errors.push('At least one FAQ item is required')
  }

  for (const [index, item] of faqs.entries()) {
    if (!item.question || item.question.trim().length < 5) {
      errors.push(`FAQ #${index + 1}: question is too short`)
    }
    if (!item.answer || item.answer.trim().length < 5) {
      errors.push(`FAQ #${index + 1}: answer is too short`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function generateFAQSchema(options: FAQSchemaOptions): Record<string, unknown> | null {
  const validation = validateFAQSchema(options.faqs)
  if (!validation.valid) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: options.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    ...(options.articleUrl ? { url: options.articleUrl } : {}),
    ...(options.articleTitle ? { name: options.articleTitle } : {}),
  }
}
