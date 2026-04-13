/**
 * SIA AUTHOR PROFILES - E-E-A-T OPTIMIZATION
 * Centralized author entity data for structured data
 */

export interface AuthorProfile {
  name: string
  role: string
  description: string
  expertise: string[]
  sameAs?: string[] // Social profiles
}

export const SIA_AUTHORS: Record<string, AuthorProfile> = {
  'sia-intelligence': {
    name: 'SIA Intelligence',
    role: 'Financial Intelligence Analyst',
    description: 'AI-powered financial intelligence platform providing institutional-grade market analysis, on-chain data insights, and real-time signal detection.',
    expertise: [
      'Financial Markets Analysis',
      'Blockchain Intelligence',
      'Cryptocurrency Markets',
      'Quantitative Analysis',
      'Risk Assessment'
    ],
    sameAs: [
      // Add social profiles when available
      // 'https://twitter.com/SIAIntel',
      // 'https://linkedin.com/company/sia-intelligence'
    ]
  },
  'sia-sentinel': {
    name: 'SIA Sentinel',
    role: 'Senior Market Analyst',
    description: 'Proprietary AI system specializing in whale wallet tracking, exchange liquidity analysis, and institutional flow detection.',
    expertise: [
      'On-Chain Analysis',
      'Whale Tracking',
      'Exchange Flow Analysis',
      'Market Microstructure'
    ]
  },
  'sia-oracle': {
    name: 'SIA Oracle',
    role: 'Predictive Analytics Specialist',
    description: 'Advanced prediction engine combining multi-modal analysis, sentiment tracking, and historical correlation patterns.',
    expertise: [
      'Predictive Modeling',
      'Sentiment Analysis',
      'Pattern Recognition',
      'Statistical Probability'
    ]
  }
}

export const SIA_ORGANIZATION = {
  name: 'SIA Intelligence Protocol',
  description: 'Institutional-grade financial intelligence platform powered by advanced AI and blockchain analytics.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'}/logo.png`,
  sameAs: [
    // Add social profiles when available
    // 'https://twitter.com/SIAIntel',
    // 'https://linkedin.com/company/sia-intelligence'
  ]
}

/**
 * Get author profile by ID or default to SIA Intelligence
 */
export function getAuthorProfile(authorId?: string): AuthorProfile {
  if (!authorId) {
    return SIA_AUTHORS['sia-intelligence']
  }
  
  const normalizedId = authorId.toLowerCase().replace(/\s+/g, '-')
  return SIA_AUTHORS[normalizedId] || SIA_AUTHORS['sia-intelligence']
}

/**
 * Generate Person schema for author
 */
export function generateAuthorSchema(authorId?: string) {
  const author = getAuthorProfile(authorId)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  
  return {
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role,
    description: author.description,
    ...(author.sameAs && author.sameAs.length > 0 && { sameAs: author.sameAs }),
    url: `${baseUrl}/experts/${authorId || 'sia-intelligence'}`,
    knowsAbout: author.expertise
  }
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@type': 'Organization',
    name: SIA_ORGANIZATION.name,
    description: SIA_ORGANIZATION.description,
    url: SIA_ORGANIZATION.url,
    logo: {
      '@type': 'ImageObject',
      url: SIA_ORGANIZATION.logo,
      width: 600,
      height: 60
    },
    ...(SIA_ORGANIZATION.sameAs.length > 0 && { sameAs: SIA_ORGANIZATION.sameAs })
  }
}
