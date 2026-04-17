/**
 * G-Guard (Google Guard) Validator
 * 
 * Advanced content validator that checks for Google's 5 most hated issues:
 * 1. Thin Content (Low word count, shallow content)
 * 2. Keyword Stuffing (Excessive keyword density)
 * 3. Missing Image Alt Text (Poor visual SEO)
 * 4. Weak E-E-A-T Signals (Poor author authority)
 * 5. Ad Density (Too many ads vs content)
 */

export interface GGuardContent {
  title: string;
  body: string;
  keywords: string[];
  images: Array<{
    url: string;
    alt?: string;
  }>;
  author: {
    name: string;
    bio?: string;
    credentials?: string;
  };
  ads?: {
    count: number;
    totalHeight: number;
  };
  category: string;
  publishDate?: string;
}

export interface GGuardIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'thin_content' | 'keyword_stuffing' | 'image_seo' | 'eeat' | 'ad_density';
  message: string;
  recommendation: string;
  impact: number; // Points deducted
}

export interface GGuardResult {
  isSafe: boolean;
  score: number; // 0-100
  issues: GGuardIssue[];
  recommendations: string[];
  details: {
    wordCount: number;
    keywordDensity: number;
    imagesWithAlt: number;
    totalImages: number;
    authorScore: number;
    adDensity: number;
  };
}

/**
 * Check keyword density
 */
function checkKeywordDensity(body: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 0;

  const words = body.toLowerCase().split(/\s+/);
  const totalWords = words.length;

  let keywordCount = 0;
  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    keywordCount += words.filter((word) => word.includes(keywordLower)).length;
  });

  return (keywordCount / totalWords) * 100;
}

/**
 * Calculate author authority score
 */
function calculateAuthorScore(author: GGuardContent['author']): number {
  let score = 0;

  // Has bio
  if (author.bio && author.bio.length >= 50) {
    score += 40;
  } else if (author.bio && author.bio.length >= 20) {
    score += 20;
  }

  // Has credentials
  if (author.credentials && author.credentials.length > 0) {
    score += 30;
  }

  // Has name
  if (author.name && author.name.length > 0) {
    score += 30;
  }

  return score;
}

/**
 * Calculate ad density
 */
function calculateAdDensity(content: GGuardContent): number {
  if (!content.ads || content.ads.count === 0) return 0;

  const contentLength = content.body.length;
  const avgAdHeight = 280; // pixels
  const totalAdHeight = content.ads.totalHeight || content.ads.count * avgAdHeight;

  // Estimate content height (rough calculation)
  const avgCharsPerLine = 80;
  const avgLineHeight = 24;
  const contentHeight = (contentLength / avgCharsPerLine) * avgLineHeight;

  // Ad density = (total ad height) / (content height) * 100
  return (totalAdHeight / contentHeight) * 100;
}

/**
 * Main validation function
 */
export function validateForGoogle(content: GGuardContent): GGuardResult {
  console.log('🛡️ G-Guard: Validating content for Google compliance...');

  const issues: GGuardIssue[] = [];
  let score = 100;

  // Count words
  const wordCount = content.body.split(/\s+/).length;

  // 1. THIN CONTENT CHECK (Google hates short, empty content)
  if (wordCount < 300) {
    issues.push({
      severity: 'critical',
      category: 'thin_content',
      message: `⚠️ Thin Content Detected: ${wordCount} words (minimum 300 required)`,
      recommendation: 'Google may classify this as "Thin Content". Expand to at least 500 words with valuable information.',
      impact: 30,
    });
    score -= 30;
  } else if (wordCount < 500) {
    issues.push({
      severity: 'warning',
      category: 'thin_content',
      message: `⚠️ Low Word Count: ${wordCount} words (recommended 500+)`,
      recommendation: 'Content is short. Consider adding more depth, examples, and details.',
      impact: 15,
    });
    score -= 15;
  } else if (wordCount < 800) {
    issues.push({
      severity: 'info',
      category: 'thin_content',
      message: `ℹ️ Moderate Word Count: ${wordCount} words`,
      recommendation: 'Content length is acceptable. Consider expanding to 800+ words for better ranking.',
      impact: 5,
    });
    score -= 5;
  }

  // 2. KEYWORD STUFFING CHECK (Keyword density abuse)
  const keywordDensity = checkKeywordDensity(content.body, content.keywords);

  if (keywordDensity > 5) {
    issues.push({
      severity: 'critical',
      category: 'keyword_stuffing',
      message: `🚨 Keyword Stuffing Detected: ${keywordDensity.toFixed(2)}% density (maximum 3.5%)`,
      recommendation: 'SPAM RISK! Reduce keyword usage immediately. Natural density should be 1-3%.',
      impact: 35,
    });
    score -= 35;
  } else if (keywordDensity > 3.5) {
    issues.push({
      severity: 'warning',
      category: 'keyword_stuffing',
      message: `⚠️ High Keyword Density: ${keywordDensity.toFixed(2)}% (recommended 1-3%)`,
      recommendation: 'Keyword density is too high. Use synonyms and natural language.',
      impact: 20,
    });
    score -= 20;
  } else if (keywordDensity < 0.5) {
    issues.push({
      severity: 'info',
      category: 'keyword_stuffing',
      message: `ℹ️ Low Keyword Density: ${keywordDensity.toFixed(2)}%`,
      recommendation: 'Consider including target keywords more naturally in content.',
      impact: 5,
    });
    score -= 5;
  }

  // 3. IMAGE ALT TEXT CHECK (Accessibility and Visual SEO)
  const imagesWithAlt = content.images.filter(
    (img) => img.alt && img.alt.length > 5
  ).length;
  const totalImages = content.images.length;
  const altTextPercentage = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;

  if (totalImages > 0 && imagesWithAlt === 0) {
    issues.push({
      severity: 'critical',
      category: 'image_seo',
      message: `🖼️ Missing All Alt Text: 0/${totalImages} images have alt text`,
      recommendation: 'CRITICAL: Add descriptive alt text to all images for accessibility and SEO.',
      impact: 25,
    });
    score -= 25;
  } else if (altTextPercentage < 50) {
    issues.push({
      severity: 'warning',
      category: 'image_seo',
      message: `🖼️ Insufficient Alt Text: ${imagesWithAlt}/${totalImages} images (${altTextPercentage.toFixed(0)}%)`,
      recommendation: 'Add alt text to remaining images. Visual SEO score will improve.',
      impact: 15,
    });
    score -= 15;
  } else if (altTextPercentage < 100) {
    issues.push({
      severity: 'info',
      category: 'image_seo',
      message: `🖼️ Partial Alt Text: ${imagesWithAlt}/${totalImages} images`,
      recommendation: 'Complete alt text for all images for maximum SEO benefit.',
      impact: 5,
    });
    score -= 5;
  }

  // 4. E-E-A-T CHECK (Author Authority)
  const authorScore = calculateAuthorScore(content.author);

  if (authorScore < 30) {
    issues.push({
      severity: 'critical',
      category: 'eeat',
      message: `👤 Weak Author Authority: ${authorScore}/100 E-E-A-T score`,
      recommendation: 'CRITICAL: Add author bio (50+ characters) and credentials. Google requires strong E-E-A-T signals.',
      impact: 30,
    });
    score -= 30;
  } else if (authorScore < 60) {
    issues.push({
      severity: 'warning',
      category: 'eeat',
      message: `👤 Low Author Authority: ${authorScore}/100 E-E-A-T score`,
      recommendation: 'Improve author bio and add credentials to strengthen E-E-A-T signals.',
      impact: 15,
    });
    score -= 15;
  } else if (authorScore < 90) {
    issues.push({
      severity: 'info',
      category: 'eeat',
      message: `👤 Moderate Author Authority: ${authorScore}/100 E-E-A-T score`,
      recommendation: 'Consider adding more author credentials for stronger authority.',
      impact: 5,
    });
    score -= 5;
  }

  // 5. AD DENSITY CHECK (Too many ads vs content)
  const adDensity = calculateAdDensity(content);

  if (adDensity > 30) {
    issues.push({
      severity: 'critical',
      category: 'ad_density',
      message: `📊 Excessive Ad Density: ${adDensity.toFixed(1)}% (maximum 20%)`,
      recommendation: 'CRITICAL: Too many ads! Google may penalize for poor user experience. Reduce ad count.',
      impact: 25,
    });
    score -= 25;
  } else if (adDensity > 20) {
    issues.push({
      severity: 'warning',
      category: 'ad_density',
      message: `📊 High Ad Density: ${adDensity.toFixed(1)}% (recommended 10-15%)`,
      recommendation: 'Ad density is high. Consider reducing ads or increasing content length.',
      impact: 10,
    });
    score -= 10;
  } else if (adDensity > 15) {
    issues.push({
      severity: 'info',
      category: 'ad_density',
      message: `📊 Moderate Ad Density: ${adDensity.toFixed(1)}%`,
      recommendation: 'Ad density is acceptable but could be optimized.',
      impact: 5,
    });
    score -= 5;
  }

  // Generate recommendations
  const recommendations: string[] = [];

  // Critical issues first
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push('🚨 CRITICAL: Fix these issues immediately before publishing:');
    criticalIssues.forEach((issue) => {
      recommendations.push(`   - ${issue.message}`);
    });
  }

  // Warning issues
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  if (warningIssues.length > 0) {
    recommendations.push('⚠️ WARNINGS: Address these issues for better ranking:');
    warningIssues.forEach((issue) => {
      recommendations.push(`   - ${issue.message}`);
    });
  }

  // Info issues
  const infoIssues = issues.filter((i) => i.severity === 'info');
  if (infoIssues.length > 0) {
    recommendations.push('ℹ️ SUGGESTIONS: Optional improvements:');
    infoIssues.forEach((issue) => {
      recommendations.push(`   - ${issue.message}`);
    });
  }

  // All clear
  if (issues.length === 0) {
    recommendations.push('✅ EXCELLENT: Content passes all Google compliance checks!');
    recommendations.push('   - Ready to publish with confidence');
  }

  const result: GGuardResult = {
    isSafe: score >= 70 && criticalIssues.length === 0,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    details: {
      wordCount,
      keywordDensity,
      imagesWithAlt,
      totalImages,
      authorScore,
      adDensity,
    },
  };

  console.log(`🛡️ G-Guard Result: ${result.score}/100 (${result.isSafe ? 'SAFE' : 'UNSAFE'})`);
  console.log(`   Critical: ${criticalIssues.length} | Warnings: ${warningIssues.length} | Info: ${infoIssues.length}`);

  return result;
}

/**
 * Quick validation (returns boolean only)
 */
export function isGoogleSafe(content: GGuardContent): boolean {
  const result = validateForGoogle(content);
  return result.isSafe;
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: GGuardResult): string {
  const critical = result.issues.filter((i) => i.severity === 'critical').length;
  const warnings = result.issues.filter((i) => i.severity === 'warning').length;
  const info = result.issues.filter((i) => i.severity === 'info').length;

  return `Score: ${result.score}/100 | Critical: ${critical} | Warnings: ${warnings} | Info: ${info} | Status: ${result.isSafe ? 'SAFE ✅' : 'UNSAFE ❌'}`;
}

/**
 * Get category-specific issues
 */
export function getIssuesByCategory(
  result: GGuardResult,
  category: GGuardIssue['category']
): GGuardIssue[] {
  return result.issues.filter((i) => i.category === category);
}

/**
 * Get critical issues only
 */
export function getCriticalIssues(result: GGuardResult): GGuardIssue[] {
  return result.issues.filter((i) => i.severity === 'critical');
}

/**
 * Check if content needs improvement
 */
export function needsImprovement(result: GGuardResult): boolean {
  return result.score < 85 || result.issues.length > 0;
}

/**
 * Get improvement priority
 */
export function getImprovementPriority(result: GGuardResult): string {
  const critical = result.issues.filter((i) => i.severity === 'critical').length;
  const warnings = result.issues.filter((i) => i.severity === 'warning').length;

  if (critical > 0) return 'URGENT';
  if (warnings > 2) return 'HIGH';
  if (warnings > 0) return 'MEDIUM';
  return 'LOW';
}
