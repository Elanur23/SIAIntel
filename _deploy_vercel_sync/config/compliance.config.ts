/**
 * Compliance Configuration
 * Google AdSense, FTC, GDPR, and Brand Safety Compliance
 */

export interface ComplianceSettings {
  // Ad Compliance
  ads: {
    maxAdRefreshPerSession: number // Max ad refreshes per user session
    viewabilityDuration: number // Min milliseconds ad must be visible before refresh
    minViewabilityPercentage: number // Min % of ad that must be visible
    preventFrequencyCapping: boolean // Prevent showing same ad too often
    enableAdLabel: boolean // Show "Ad" label on ads
    respectDoNotTrack: boolean // Respect DNT header
  }

  // Content Compliance
  content: {
    enableAIContentLabel: boolean // Show "AI-generated" badge on AI content
    factCheckBeforePublish: boolean // Require fact-checking before publishing
    preventMisinformation: boolean // Block known misinformation patterns
    requireSourceAttribution: boolean // Require source attribution
    enableContentWarnings: boolean // Show content warnings when needed
    maxClaimsPerArticle: number // Max unverified claims per article
  }

  // Performance & UX
  performance: {
    preventLayoutShift: boolean // Prevent Cumulative Layout Shift (CLS)
    maxCLS: number // Max allowed CLS score
    preventAdBlockingContent: boolean // Don't block content with ads
    enableResponsiveAds: boolean // Use responsive ad sizes
    maxAdDensity: number // Max ads per 1000 words
  }

  // Privacy & Data
  privacy: {
    requireConsentBeforeTracking: boolean // GDPR consent required
    respectUserPrivacy: boolean // Don't track sensitive data
    enableDataMinimization: boolean // Collect only necessary data
    enableRightToBeForotten: boolean // Support GDPR right to be forgotten
    enableDataPortability: boolean // Support GDPR data portability
    cookieConsentRequired: boolean // Show cookie consent banner
    maxCookieRetention: number // Days to keep cookies
  }

  // Brand Safety
  brandSafety: {
    preventAdNextToHarmfulContent: boolean // Don't show ads next to harmful content
    preventAdNextToViolence: boolean // Don't show ads next to violence
    preventAdNextToHate: boolean // Don't show ads next to hate speech
    preventAdNextToAdult: boolean // Don't show ads next to adult content
    preventAdNextToMisinformation: boolean // Don't show ads next to misinformation
    enableBrandSafetyScanning: boolean // Scan content for brand safety
  }

  // Transparency
  transparency: {
    enableDisclosures: boolean // Show required disclosures
    enablePrivacyPolicy: boolean // Link to privacy policy
    enableTermsOfService: boolean // Link to terms of service
    enableContactInfo: boolean // Show contact information
    enableAboutPage: boolean // Show about page
    enableCorrectionPolicy: boolean // Show correction policy
  }

  // Monitoring
  monitoring: {
    enableComplianceMonitoring: boolean // Monitor compliance violations
    enableAuditLogging: boolean // Log all compliance events
    enableAlerts: boolean // Alert on compliance violations
    enableReporting: boolean // Generate compliance reports
    complianceCheckInterval: number // Minutes between compliance checks
  }
}

/**
 * Default Compliance Configuration
 * Optimized for Google AdSense, FTC, and GDPR compliance
 */
export const ComplianceConfig: ComplianceSettings = {
  // Ad Compliance
  ads: {
    maxAdRefreshPerSession: 5, // Max 5 refreshes per session (Google AdSense limit)
    viewabilityDuration: 30000, // Ad must be visible for 30 seconds before refresh
    minViewabilityPercentage: 50, // At least 50% of ad must be visible
    preventFrequencyCapping: true, // Prevent ad fatigue
    enableAdLabel: true, // Show "Ad" label (FTC requirement)
    respectDoNotTrack: true, // Respect user privacy
  },

  // Content Compliance
  content: {
    enableAIContentLabel: true, // Show "AI-generated" badge (FTC requirement)
    factCheckBeforePublish: true, // Verify facts before publishing
    preventMisinformation: true, // Block misinformation
    requireSourceAttribution: true, // Cite sources
    enableContentWarnings: true, // Show warnings for sensitive content
    maxClaimsPerArticle: 10, // Max 10 unverified claims per article
  },

  // Performance & UX
  performance: {
    preventLayoutShift: true, // Prevent CLS (Google ranking factor)
    maxCLS: 0.1, // Max CLS score (Google Core Web Vitals)
    preventAdBlockingContent: true, // Don't block content with ads
    enableResponsiveAds: true, // Use responsive ads
    maxAdDensity: 3, // Max 3 ads per 1000 words
  },

  // Privacy & Data
  privacy: {
    requireConsentBeforeTracking: true, // GDPR requirement
    respectUserPrivacy: true, // Don't track sensitive data
    enableDataMinimization: true, // Collect only necessary data
    enableRightToBeForotten: true, // GDPR requirement
    enableDataPortability: true, // GDPR requirement
    cookieConsentRequired: true, // Show cookie banner
    maxCookieRetention: 365, // Keep cookies for 1 year max
  },

  // Brand Safety
  brandSafety: {
    preventAdNextToHarmfulContent: true, // Protect advertiser brand
    preventAdNextToViolence: true, // Don't show ads next to violence
    preventAdNextToHate: true, // Don't show ads next to hate speech
    preventAdNextToAdult: true, // Don't show ads next to adult content
    preventAdNextToMisinformation: true, // Don't show ads next to misinformation
    enableBrandSafetyScanning: true, // Scan content
  },

  // Transparency
  transparency: {
    enableDisclosures: true, // Show disclosures
    enablePrivacyPolicy: true, // Link to privacy policy
    enableTermsOfService: true, // Link to terms
    enableContactInfo: true, // Show contact info
    enableAboutPage: true, // Show about page
    enableCorrectionPolicy: true, // Show correction policy
  },

  // Monitoring
  monitoring: {
    enableComplianceMonitoring: true, // Monitor violations
    enableAuditLogging: true, // Log events
    enableAlerts: true, // Alert on violations
    enableReporting: true, // Generate reports
    complianceCheckInterval: 60, // Check every hour
  },
}

/**
 * Compliance Validator
 * Checks if content/ads comply with settings
 */
export class ComplianceValidator {
  private config: ComplianceSettings

  constructor(config: ComplianceSettings = ComplianceConfig) {
    this.config = config
  }

  /**
   * Validate ad placement
   */
  validateAdPlacement(params: {
    adCount: number
    wordCount: number
    isNextToHarmfulContent: boolean
    isNextToViolence: boolean
    isNextToHate: boolean
    isNextToAdult: boolean
    isNextToMisinformation: boolean
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check ad density
    const adDensity = (params.adCount / params.wordCount) * 1000
    if (adDensity > this.config.performance.maxAdDensity) {
      errors.push(
        `Ad density ${adDensity.toFixed(2)} exceeds max ${this.config.performance.maxAdDensity}`
      )
    }

    // Check brand safety
    if (this.config.brandSafety.preventAdNextToHarmfulContent && params.isNextToHarmfulContent) {
      errors.push('Ad cannot be placed next to harmful content')
    }
    if (this.config.brandSafety.preventAdNextToViolence && params.isNextToViolence) {
      errors.push('Ad cannot be placed next to violence')
    }
    if (this.config.brandSafety.preventAdNextToHate && params.isNextToHate) {
      errors.push('Ad cannot be placed next to hate speech')
    }
    if (this.config.brandSafety.preventAdNextToAdult && params.isNextToAdult) {
      errors.push('Ad cannot be placed next to adult content')
    }
    if (this.config.brandSafety.preventAdNextToMisinformation && params.isNextToMisinformation) {
      errors.push('Ad cannot be placed next to misinformation')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate content
   */
  validateContent(params: {
    content: string
    claimCount: number
    verifiedClaimCount: number
    hasAILabel: boolean
    hasSources: boolean
    hasWarnings: boolean
  }): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check AI label
    if (this.config.content.enableAIContentLabel && !params.hasAILabel) {
      errors.push('AI-generated content must have AI label')
    }

    // Check fact-checking
    if (this.config.content.factCheckBeforePublish) {
      const unverifiedClaims = params.claimCount - params.verifiedClaimCount
      if (unverifiedClaims > this.config.content.maxClaimsPerArticle) {
        errors.push(
          `Too many unverified claims (${unverifiedClaims} > ${this.config.content.maxClaimsPerArticle})`
        )
      }
    }

    // Check source attribution
    if (this.config.content.requireSourceAttribution && !params.hasSources) {
      warnings.push('Content should have source attribution')
    }

    // Check content warnings
    if (this.config.content.enableContentWarnings && !params.hasWarnings) {
      warnings.push('Sensitive content should have warnings')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate privacy compliance
   */
  validatePrivacy(params: {
    hasConsentBanner: boolean
    hasPrivacyPolicy: boolean
    hasTermsOfService: boolean
    respectsDNT: boolean
    minimalDataCollection: boolean
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.config.privacy.requireConsentBeforeTracking && !params.hasConsentBanner) {
      errors.push('Consent banner required (GDPR)')
    }

    if (this.config.privacy.enableRightToBeForotten && !params.hasPrivacyPolicy) {
      errors.push('Privacy policy required (GDPR)')
    }

    if (!params.hasTermsOfService) {
      errors.push('Terms of service required')
    }

    if (this.config.privacy.respectUserPrivacy && !params.respectsDNT) {
      errors.push('Must respect Do Not Track header')
    }

    if (this.config.privacy.enableDataMinimization && !params.minimalDataCollection) {
      errors.push('Must minimize data collection')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate transparency
   */
  validateTransparency(params: {
    hasDisclosures: boolean
    hasPrivacyPolicy: boolean
    hasTermsOfService: boolean
    hasContactInfo: boolean
    hasAboutPage: boolean
    hasCorrectionPolicy: boolean
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.config.transparency.enableDisclosures && !params.hasDisclosures) {
      errors.push('Disclosures required')
    }

    if (this.config.transparency.enablePrivacyPolicy && !params.hasPrivacyPolicy) {
      errors.push('Privacy policy required')
    }

    if (this.config.transparency.enableTermsOfService && !params.hasTermsOfService) {
      errors.push('Terms of service required')
    }

    if (this.config.transparency.enableContactInfo && !params.hasContactInfo) {
      errors.push('Contact information required')
    }

    if (this.config.transparency.enableAboutPage && !params.hasAboutPage) {
      errors.push('About page required')
    }

    if (this.config.transparency.enableCorrectionPolicy && !params.hasCorrectionPolicy) {
      errors.push('Correction policy required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get compliance score
   */
  getComplianceScore(params: {
    adPlacementValid: boolean
    contentValid: boolean
    privacyValid: boolean
    transparencyValid: boolean
    contentWarnings: number
  }): number {
    let score = 100

    if (!params.adPlacementValid) score -= 25
    if (!params.contentValid) score -= 25
    if (!params.privacyValid) score -= 25
    if (!params.transparencyValid) score -= 25
    score -= params.contentWarnings * 5

    return Math.max(0, score)
  }
}

/**
 * Singleton instance
 */
export const complianceValidator = new ComplianceValidator()
