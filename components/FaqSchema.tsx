/**
 * FAQ SCHEMA COMPONENT
 * 
 * Automatically injects FAQPage JSON-LD schema for articles with Q&A sections
 * Improves Google rich snippet eligibility and voice search optimization
 * 
 * Usage:
 * <FAQSchema faqs={faqItems} articleUrl={url} articleTitle={title} />
 */

import Script from 'next/script'
import { generateFAQSchema, validateFAQSchema, type FAQItem } from '@/lib/seo/faq-schema-generator'

interface FAQSchemaProps {
  faqs: FAQItem[]
  articleUrl?: string
  articleTitle?: string
  priority?: 'high' | 'low'
}

export default function FAQSchema({ 
  faqs, 
  articleUrl, 
  articleTitle,
  priority = 'low' 
}: FAQSchemaProps) {
  // Validate FAQ data
  const validation = validateFAQSchema(faqs)
  
  if (!validation.valid) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FAQ-SCHEMA] Validation errors:', validation.errors)
    }
    return null
  }

  // Generate schema
  const schema = generateFAQSchema({ faqs, articleUrl, articleTitle })

  if (!schema) {
    return null
  }

  // Log schema injection for monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 FAQ SCHEMA INJECTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 Article:', articleTitle || 'N/A')
    console.log('❓ FAQ Count:', faqs.length)
    console.log('🔗 URL:', articleUrl || 'N/A')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      strategy={priority === 'high' ? 'beforeInteractive' : 'afterInteractive'}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2),
      }}
    />
  )
}
