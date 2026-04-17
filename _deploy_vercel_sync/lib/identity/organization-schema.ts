/**
 * Organization Schema Generator
 * 
 * Generates Schema.org Organization and NewsMediaOrganization markup
 * for site-wide trust signals
 */

import { getAllExperts, generateExpertSchema } from './council-of-five'

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': string[]
  '@id': string
  name: string
  alternateName: string
  url: string
  logo: {
    '@type': 'ImageObject'
    url: string
    width: number
    height: number
  }
  description: string
  foundingDate: string
  address: {
    '@type': 'PostalAddress'
    addressCountry: string
  }
  contactPoint: {
    '@type': 'ContactPoint'
    contactType: string
    email: string
  }
  sameAs: string[]
  publishingPrinciples: string
  ethicsPolicy: string
  correctionsPolicy: string
  diversityPolicy: string
  employee: Array<{ '@type': 'Person'; '@id': string }>
}

/**
 * Generate complete Organization schema with all trust signals
 */
export function generateOrganizationSchema(language: string = 'en'): OrganizationSchema {
  const baseUrl = 'https://siaintel.com'
  const experts = getAllExperts()
  
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'NewsMediaOrganization'],
    '@id': `${baseUrl}/#organization`,
    name: 'SIA Intelligence',
    alternateName: 'SIA Intel',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 600,
      height: 60
    },
    description: 'AI-powered financial intelligence platform providing real-time market analysis across cryptocurrency, macro economy, commodities, technology, and emerging markets.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: 'editorial@siaintel.com'
    },
    sameAs: [
      'https://twitter.com/SIAIntel',
      'https://linkedin.com/company/sia-intelligence'
    ],
    publishingPrinciples: `${baseUrl}/${language}/editorial-policy`,
    ethicsPolicy: `${baseUrl}/${language}/ai-transparency`,
    correctionsPolicy: `${baseUrl}/legal/corrections`,
    diversityPolicy: `${baseUrl}/${language}/about#diversity`,
    employee: experts.map(expert => ({
      '@type': 'Person' as const,
      '@id': `${baseUrl}/experts/${expert.id}`
    }))
  }
}

/**
 * Generate all expert schemas for site-wide injection
 */
export function generateAllExpertSchemas() {
  const experts = getAllExperts()
  return experts.map(expert => generateExpertSchema(expert.category))
}

/**
 * Generate combined schema array for site header
 */
export function generateSiteWideSchemas(language: string = 'en') {
  return [
    generateOrganizationSchema(language),
    ...generateAllExpertSchemas()
  ]
}

export default generateOrganizationSchema
