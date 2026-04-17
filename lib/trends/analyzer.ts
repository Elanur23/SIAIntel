/**
 * Trends Analyzer
 * 
 * Analyzes trending keywords and suggests which ones to target for content creation
 * Based on:
 * - Search volume
 * - Velocity (growth rate)
 * - Competition level
 * - Relevance to site categories
 * - CPC potential
 */

import type { TrendKeyword, TrendCategory, TrendVelocity } from './fetcher';

export interface TrendOpportunity {
  keyword: TrendKeyword;
  opportunityScore: number; // 0-100
  reasoning: string[];
  recommendations: string[];
  estimatedTraffic: number; // Expected daily traffic
  estimatedRevenue: number; // Expected daily revenue ($)
  competitionLevel: 'low' | 'medium' | 'high';
  timeWindow: string; // How long this opportunity will last
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface TrendsAnalysis {
  timestamp: Date;
  opportunities: TrendOpportunity[];
  topOpportunities: TrendOpportunity[]; // Top 10
  urgentOpportunities: TrendOpportunity[]; // Explosive trends
  byCategory: Record<TrendCategory, TrendOpportunity[]>;
  totalOpportunities: number;
  recommendations: string[];
}

export class TrendsAnalyzer {
  // Site categories (from your news portal)
  private readonly SITE_CATEGORIES: TrendCategory[] = [
    'breaking_news',
    'politics',
    'business',
    'sports',
    'technology',
    'entertainment',
    'health',
    'science',
    'world',
  ];

  // High-CPC categories (better revenue potential)
  private readonly HIGH_CPC_CATEGORIES: TrendCategory[] = [
    'business',
    'technology',
    'health',
  ];

  /**
   * Analyze trends and identify opportunities
   */
  analyzeTrends(trends: TrendKeyword[]): TrendsAnalysis {
    console.log('🔍 Analyzing trends for opportunities...');

    const opportunities: TrendOpportunity[] = [];

    for (const trend of trends) {
      const opportunity = this.evaluateTrend(trend);
      
      // Only include if opportunity score is decent
      if (opportunity.opportunityScore >= 40) {
        opportunities.push(opportunity);
      }
    }

    // Sort by opportunity score (descending)
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Get top opportunities
    const topOpportunities = opportunities.slice(0, 10);

    // Get urgent opportunities (explosive trends)
    const urgentOpportunities = opportunities.filter(
      (opp) => opp.priority === 'urgent'
    );

    // Group by category
    const byCategory: Record<TrendCategory, TrendOpportunity[]> = {
      breaking_news: [],
      politics: [],
      business: [],
      sports: [],
      technology: [],
      entertainment: [],
      health: [],
      science: [],
      world: [],
      local: [],
      other: [],
    };

    for (const opportunity of opportunities) {
      byCategory[opportunity.keyword.category].push(opportunity);
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(opportunities);

    console.log(`✅ Found ${opportunities.length} opportunities`);
    console.log(`   Top 10: ${topOpportunities.length}`);
    console.log(`   Urgent: ${urgentOpportunities.length}`);

    return {
      timestamp: new Date(),
      opportunities,
      topOpportunities,
      urgentOpportunities,
      byCategory,
      totalOpportunities: opportunities.length,
      recommendations,
    };
  }

  /**
   * Evaluate a single trend and calculate opportunity score
   */
  private evaluateTrend(trend: TrendKeyword): TrendOpportunity {
    let score = 0;
    const reasoning: string[] = [];
    const recommendations: string[] = [];

    // 1. Search Volume Score (0-30 points)
    const volumeScore = this.calculateVolumeScore(trend.searchVolume);
    score += volumeScore;
    if (volumeScore >= 20) {
      reasoning.push(`High search volume: ${trend.searchVolume.toLocaleString()} searches/hour`);
    }

    // 2. Velocity Score (0-25 points)
    const velocityScore = this.calculateVelocityScore(trend.velocity);
    score += velocityScore;
    if (trend.velocity === 'explosive') {
      reasoning.push('Explosive growth - act fast!');
      recommendations.push('Create content within 1-2 hours');
    } else if (trend.velocity === 'rising') {
      reasoning.push('Rising trend - good timing');
      recommendations.push('Create content within 4-6 hours');
    }

    // 3. Category Relevance Score (0-20 points)
    const categoryScore = this.calculateCategoryScore(trend.category);
    score += categoryScore;
    if (this.SITE_CATEGORIES.includes(trend.category)) {
      reasoning.push(`Matches site category: ${trend.category}`);
    }

    // 4. CPC Potential Score (0-15 points)
    const cpcScore = this.calculateCPCScore(trend.category);
    score += cpcScore;
    if (this.HIGH_CPC_CATEGORIES.includes(trend.category)) {
      reasoning.push('High CPC potential - better revenue');
    }

    // 5. Confidence Score (0-10 points)
    const confidenceScore = (trend.confidence / 100) * 10;
    score += confidenceScore;
    if (trend.confidence >= 80) {
      reasoning.push('High confidence trend');
    }

    // Calculate competition level
    const competitionLevel = this.estimateCompetition(trend);

    // Adjust score based on competition
    if (competitionLevel === 'low') {
      score += 10;
      reasoning.push('Low competition - easier to rank');
      recommendations.push('Target this keyword aggressively');
    } else if (competitionLevel === 'high') {
      score -= 5;
      reasoning.push('High competition - harder to rank');
      recommendations.push('Focus on long-tail variations');
    }

    // Estimate traffic and revenue
    const estimatedTraffic = this.estimateTraffic(trend, competitionLevel);
    const estimatedRevenue = this.estimateRevenue(estimatedTraffic, trend.category);

    // Add revenue reasoning
    if (estimatedRevenue > 50) {
      reasoning.push(`High revenue potential: $${estimatedRevenue.toFixed(2)}/day`);
    }

    // Determine time window
    const timeWindow = this.calculateTimeWindow(trend.velocity);

    // Determine priority
    const priority = this.calculatePriority(trend.velocity, score);

    // Add priority-based recommendations
    if (priority === 'urgent') {
      recommendations.push('⚡ URGENT: Create content immediately');
      recommendations.push('Use AI content engine for speed');
      recommendations.push('Notify Google Indexing API instantly');
    } else if (priority === 'high') {
      recommendations.push('High priority: Create content today');
      recommendations.push('Include related keywords for broader reach');
    }

    // Add SEO recommendations
    recommendations.push(`Target keyword: "${trend.keyword}"`);
    if (trend.relatedKeywords.length > 0) {
      recommendations.push(
        `Related keywords: ${trend.relatedKeywords.slice(0, 3).join(', ')}`
      );
    }

    return {
      keyword: trend,
      opportunityScore: Math.round(score),
      reasoning,
      recommendations,
      estimatedTraffic,
      estimatedRevenue,
      competitionLevel,
      timeWindow,
      priority,
    };
  }

  /**
   * Calculate volume score (0-30 points)
   */
  private calculateVolumeScore(volume: number): number {
    if (volume >= 100000) return 30;
    if (volume >= 50000) return 25;
    if (volume >= 20000) return 20;
    if (volume >= 10000) return 15;
    if (volume >= 5000) return 10;
    return 5;
  }

  /**
   * Calculate velocity score (0-25 points)
   */
  private calculateVelocityScore(velocity: TrendVelocity): number {
    switch (velocity) {
      case 'explosive':
        return 25;
      case 'rising':
        return 20;
      case 'steady':
        return 10;
      case 'declining':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate category relevance score (0-20 points)
   */
  private calculateCategoryScore(category: TrendCategory): number {
    if (this.SITE_CATEGORIES.includes(category)) {
      return 20;
    }
    if (category === 'other') {
      return 5;
    }
    return 10; // Partially relevant
  }

  /**
   * Calculate CPC potential score (0-15 points)
   */
  private calculateCPCScore(category: TrendCategory): number {
    if (this.HIGH_CPC_CATEGORIES.includes(category)) {
      return 15;
    }
    if (category === 'breaking_news' || category === 'politics') {
      return 10; // Medium CPC
    }
    return 5; // Low CPC
  }

  /**
   * Estimate competition level
   */
  private estimateCompetition(trend: TrendKeyword): 'low' | 'medium' | 'high' {
    // Breaking news and explosive trends have lower competition (timing advantage)
    if (trend.velocity === 'explosive' || trend.category === 'breaking_news') {
      return 'low';
    }

    // High search volume usually means high competition
    if (trend.searchVolume > 100000) {
      return 'high';
    }

    // News source trends have medium competition
    if (trend.source === 'news' && trend.metadata.newsCount && trend.metadata.newsCount > 5) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Estimate daily traffic
   */
  private estimateTraffic(
    trend: TrendKeyword,
    competition: 'low' | 'medium' | 'high'
  ): number {
    // Base traffic from search volume (hourly to daily)
    let dailySearches = trend.searchVolume * 24;

    // Adjust for competition
    let captureRate = 0.05; // 5% default
    if (competition === 'low') captureRate = 0.15; // 15%
    if (competition === 'high') captureRate = 0.02; // 2%

    // Adjust for velocity
    if (trend.velocity === 'explosive') captureRate *= 1.5;
    if (trend.velocity === 'declining') captureRate *= 0.5;

    return Math.round(dailySearches * captureRate);
  }

  /**
   * Estimate daily revenue
   */
  private estimateRevenue(traffic: number, category: TrendCategory): number {
    // CPC by category (estimated)
    const cpcRates: Record<TrendCategory, number> = {
      business: 2.5,
      technology: 2.0,
      health: 1.8,
      politics: 1.2,
      breaking_news: 1.0,
      sports: 0.8,
      entertainment: 0.7,
      science: 1.5,
      world: 1.0,
      local: 0.9,
      other: 0.5,
    };

    const cpc = cpcRates[category] || 0.5;
    const ctr = 0.02; // 2% ad CTR
    const clicks = traffic * ctr;

    return clicks * cpc;
  }

  /**
   * Calculate time window
   */
  private calculateTimeWindow(velocity: TrendVelocity): string {
    switch (velocity) {
      case 'explosive':
        return '2-6 hours';
      case 'rising':
        return '6-24 hours';
      case 'steady':
        return '1-3 days';
      case 'declining':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculate priority
   */
  private calculatePriority(
    velocity: TrendVelocity,
    score: number
  ): 'urgent' | 'high' | 'medium' | 'low' {
    if (velocity === 'explosive' && score >= 70) return 'urgent';
    if (velocity === 'explosive' || score >= 80) return 'high';
    if (velocity === 'rising' || score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(opportunities: TrendOpportunity[]): string[] {
    const recommendations: string[] = [];

    // Count urgent opportunities
    const urgentCount = opportunities.filter((o) => o.priority === 'urgent').length;
    if (urgentCount > 0) {
      recommendations.push(
        `⚡ ${urgentCount} URGENT opportunities - create content immediately`
      );
    }

    // High revenue opportunities
    const highRevenue = opportunities.filter((o) => o.estimatedRevenue > 50);
    if (highRevenue.length > 0) {
      recommendations.push(
        `💰 ${highRevenue.length} high-revenue opportunities (>$50/day)`
      );
    }

    // Low competition opportunities
    const lowComp = opportunities.filter((o) => o.competitionLevel === 'low');
    if (lowComp.length > 0) {
      recommendations.push(
        `🎯 ${lowComp.length} low-competition opportunities - easier to rank`
      );
    }

    // Category distribution
    const topCategory = this.getTopCategory(opportunities);
    if (topCategory) {
      recommendations.push(
        `📊 Most opportunities in: ${topCategory.category} (${topCategory.count} keywords)`
      );
    }

    // General recommendations
    recommendations.push('Use AI Content Engine for fast content creation');
    recommendations.push('Enable Google Indexing API for instant indexing');
    recommendations.push('Monitor trends every 2-4 hours for new opportunities');

    return recommendations;
  }

  /**
   * Get category with most opportunities
   */
  private getTopCategory(
    opportunities: TrendOpportunity[]
  ): { category: string; count: number } | null {
    const counts = new Map<string, number>();

    for (const opp of opportunities) {
      const category = opp.keyword.category;
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    let topCategory: string | null = null;
    let maxCount = 0;

    for (const [category, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    }

    return topCategory ? { category: topCategory, count: maxCount } : null;
  }

  /**
   * Use GPT-4 to select the best trend for content creation
   */
  async selectBestTrendWithAI(
    opportunities: TrendOpportunity[]
  ): Promise<{
    selected: TrendOpportunity;
    reasoning: string;
    alternatives: TrendOpportunity[];
  } | null> {
    if (opportunities.length === 0) {
      return null;
    }

    try {
      console.log('🤖 Using GPT-4 to select best trend...');

      // Prepare trend data for GPT-4
      const trendData = opportunities.slice(0, 10).map((opp, index) => ({
        index: index + 1,
        keyword: opp.keyword.keyword,
        category: opp.keyword.category,
        searchVolume: opp.keyword.searchVolume,
        velocity: opp.keyword.velocity,
        opportunityScore: opp.opportunityScore,
        estimatedTraffic: opp.estimatedTraffic,
        estimatedRevenue: opp.estimatedRevenue,
        competitionLevel: opp.competitionLevel,
        timeWindow: opp.timeWindow,
        priority: opp.priority,
      }));

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert content strategist for a US news website. Your job is to analyze trending topics and select the ONE topic with the highest viral potential and traffic opportunity. Consider:
- Search volume and velocity
- Competition level
- Revenue potential
- Time sensitivity
- Viral potential (shareability, controversy, novelty)
- Relevance to US news audience

Return your response in JSON format with:
{
  "selectedIndex": number (1-10),
  "reasoning": "detailed explanation of why this topic is the best choice",
  "viralScore": number (0-100),
  "expectedImpact": "brief description of expected impact"
}`,
            },
            {
              role: 'user',
              content: `Analyze these trending topics and select the ONE with highest viral potential for a US news website:

${JSON.stringify(trendData, null, 2)}

Which topic should we create content for RIGHT NOW? Consider viral potential, timing, and revenue opportunity.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse GPT-4 response');
      }

      const result = JSON.parse(jsonMatch[0]);
      const selectedIndex = result.selectedIndex - 1; // Convert to 0-based index

      if (selectedIndex < 0 || selectedIndex >= opportunities.length) {
        throw new Error('Invalid selected index from GPT-4');
      }

      const selected = opportunities[selectedIndex];
      const alternatives = opportunities
        .filter((_, index) => index !== selectedIndex)
        .slice(0, 3);

      console.log(`✅ GPT-4 selected: "${selected.keyword.keyword}"`);
      console.log(`   Viral Score: ${result.viralScore}/100`);
      console.log(`   Reasoning: ${result.reasoning}`);

      return {
        selected,
        reasoning: `${result.reasoning}\n\nViral Score: ${result.viralScore}/100\nExpected Impact: ${result.expectedImpact}`,
        alternatives,
      };
    } catch (error) {
      console.error('❌ GPT-4 trend selection failed:', error);
      
      // Fallback to highest scoring opportunity
      return {
        selected: opportunities[0],
        reasoning: 'Fallback: Selected highest scoring opportunity (GPT-4 unavailable)',
        alternatives: opportunities.slice(1, 4),
      };
    }
  }
}

// Export singleton instance
export const trendsAnalyzer = new TrendsAnalyzer();
