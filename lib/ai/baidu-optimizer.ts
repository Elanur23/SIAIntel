/**
 * Baidu SEO Optimizer
 * Specialized content generation for Chinese market (Baidu search engine)
 * Includes Knowledge Graph entity tagging and social media optimization
 */

import { callGeminiCentral } from '../neural-assembly/gemini-central-provider'

export interface BaiduOptimizedRequest {
  topic: string
  asset?: string
  targetAudience?: 'retail' | 'institutional' | 'general'
  includeWeiboCaption?: boolean
}

export interface BaiduReoptimizeRequest {
  existingContent: string
  topic: string
  asset?: string
  targetAudience?: 'retail' | 'institutional' | 'general'
}

export interface EntityTag {
  name: string
  type: 'COMPANY' | 'GOVERNMENT_BODY' | 'PERSON' | 'ORGANIZATION' | 'LOCATION'
  chineseName: string
  description: string
  relevance: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface BaiduOptimizedContent {
  // Core content
  title: string // Keyword-rich, 20-30 Chinese characters
  metaDescription: string // 80-120 Chinese characters
  
  // Structured content with H2/H3 headers
  sections: Array<{
    header: string // H2 or H3
    level: 2 | 3
    content: string
    keywords: string[]
  }>
  
  // Full article
  fullContent: string
  
  // Social media
  weiboCaption: string // 140 characters max, hashtags included
  sinaCaption: string // Alternative for Sina Weibo
  
  // Entity tagging for Baidu Knowledge Graph
  entities: EntityTag[]
  
  // SEO metadata
  keywords: string[] // Primary + LSI keywords
  internalLinks: Array<{
    anchor: string
    target: string
    context: string
  }>
  
  // Quality metrics
  metadata: {
    wordCount: number
    readingTime: number
    keywordDensity: number // 2-3% optimal for Baidu
    headerCount: number
    entityCount: number
    generatedAt: string
  }
}

/**
 * Generate Baidu-optimized content for Chinese market
 */
export async function generateBaiduOptimizedContent(
  request: BaiduOptimizedRequest
): Promise<BaiduOptimizedContent> {
  const prompt = buildBaiduOptimizationPrompt(request)
  
  try {
    const centralResponse = await callGeminiCentral({
      context: {
        module: 'baidu-optimizer',
        function: 'generateBaiduOptimizedContent',
        purpose: 'other'
      },
      model: 'gemini-1.5-pro-002',
      prompt,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    })
    
    return parseBaiduOptimizedResponse(centralResponse.text, request)
  } catch (error) {
    console.error('Baidu optimization error:', error)
    throw new Error('Failed to generate Baidu-optimized content')
  }
}

/**
 * Re-optimize existing content for Baidu Search Engine
 * Takes existing content and enhances it with Baidu-specific optimizations
 */
export async function reoptimizeForBaidu(
  request: BaiduReoptimizeRequest
): Promise<BaiduOptimizedContent> {
  const prompt = buildBaiduReoptimizationPrompt(request)
  
  try {
    const centralResponse = await callGeminiCentral({
      context: {
        module: 'baidu-optimizer',
        function: 'reoptimizeForBaidu',
        purpose: 'other'
      },
      model: 'gemini-1.5-pro-002',
      prompt,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    })
    
    return parseBaiduOptimizedResponse(centralResponse.text, request)
  } catch (error) {
    console.error('Baidu re-optimization error:', error)
    throw new Error('Failed to re-optimize content for Baidu')
  }
}

/**
 * Build Baidu optimization prompt
 */
function buildBaiduOptimizationPrompt(request: BaiduOptimizedRequest): string {
  return `ACT AS: Asia-Pacific Market Analyst specializing in Chinese financial markets

TASK: Generate a Baidu-optimized report for the Chinese (zh) version of SIA Terminal regarding ${request.topic}

TARGET AUDIENCE: ${request.targetAudience || 'general'} investors in mainland China

BAIDU SEO REQUIREMENTS:

1. TITLE OPTIMIZATION:
   - 20-30 Chinese characters
   - Include primary keyword naturally
   - Clear, descriptive, professional
   - No clickbait or sensationalism
   - Example format: "比特币机构采用加速：2026年第一季度分析报告"

2. META DESCRIPTION:
   - 80-120 Chinese characters
   - Include 2-3 primary keywords
   - Summarize key findings
   - Call-to-action optional
   - Baidu snippet optimization

3. BAIDU PUSH STRUCTURE (LOGICAL DENSITY - CRITICAL):
   
   Baidu's algorithm HEAVILY favors clear hierarchical structures with frequent H2/H3 headers.
   MINIMUM 6-8 headers required for optimal ranking.
   
   Use this enhanced structure:
   
   ## H2: 市场概况 (Market Overview)
   - 2-3 paragraphs
   - Include primary keywords
   - Set context for analysis
   
   ## H2: 核心数据分析 (Core Data Analysis)
   ### H3: 价格走势 (Price Trends)
   - Specific metrics and percentages
   - Time-series data
   
   ### H3: 交易量分析 (Volume Analysis)
   - Trading volume data
   - Market liquidity indicators
   
   ### H3: 技术指标 (Technical Indicators)
   - RSI, MACD, moving averages
   - Support/resistance levels
   
   ## H2: 亚太市场影响 (APAC Market Impact)
   ### H3: 中国市场 (Chinese Market)
   - Mainland China specific implications
   - Regulatory considerations (CSRC)
   - A-share market correlations
   
   ### H3: 供应链影响 (Supply Chain Impact)
   - Manufacturing implications
   - Trade flow effects
   - Regional economic impact
   
   ## H2: 投资建议 (Investment Recommendations)
   ### H3: 风险评估 (Risk Assessment)
   - Downside scenarios
   - Risk mitigation strategies
   
   ### H3: 机会分析 (Opportunity Analysis)
   - Upside potential
   - Entry/exit strategies
   
   ## H2: 风险提示 (Risk Disclaimer)
   - CSRC-compliant disclaimer
   - Professional advice recommendation
   - Educational purpose statement

4. KEYWORD OPTIMIZATION:
   - Primary keyword density: 2-3%
   - LSI keywords: 10-15 related terms
   - Natural integration (no keyword stuffing)
   - Semantic relevance for Baidu's algorithm
   
   Primary keywords to include:
   - ${request.topic} (Chinese translation)
   - Related financial terms
   - Market indicators
   - Regional terms (亚太, 中国市场, etc.)

5. VIRAL WEIBO CAPTION (EMOJI-HEAVY, PUNCHY):
   
   Create a VIRAL Weibo caption (140 characters max):
   - 🚀 Attention-grabbing emoji opening
   - 💰 Key data point with shocking number
   - 📊 Visual emoji for data/charts
   - 2-3 trending hashtags (#比特币 #投资分析 #市场动态)
   - ❓ Question or 💡 insight to drive engagement
   - Professional but exciting tone
   - Example: "🚀比特币暴涨12%！机构资金流入达23亿美元💰 这波牛市能持续多久？📊 #比特币 #投资分析 #加密货币 点击查看完整分析👇"
   
   SINA CAPTION (Alternative, more professional):
   - Less emoji-heavy (1-2 max)
   - Headline-style opening
   - Key insight with data
   - Hashtags
   - Example: "📈 比特币机构采用加速：Q1流入资金增长34% | 深度分析报告 #比特币 #机构投资"

6. ENTITY TAGGING (Baidu Knowledge Graph - EXACTLY 5 KEY ENTITIES):
   
   Identify and highlight EXACTLY 5 key entities for Baidu Knowledge Graph:
   
   Priority order:
   1. Most relevant company/exchange
   2. Key government body (if applicable)
   3. Secondary company/organization
   4. Important person (CEO, official, analyst)
   5. Geographic location (market/region)
   
   Format for each entity:
   
   ENTITY 1 (COMPANY):
   - Chinese name: [公司中文名]
   - English name: [Company Name]
   - Type: COMPANY
   - Description: [Brief description in Chinese, 20-30 chars]
   - Relevance: HIGH
   
   ENTITY 2 (GOVERNMENT_BODY):
   - Chinese name: [政府机构中文名]
   - English name: [Government Body]
   - Type: GOVERNMENT_BODY
   - Description: [Role and relevance, 20-30 chars]
   - Relevance: HIGH/MEDIUM
   
   ENTITY 3 (ORGANIZATION):
   - Chinese name: [组织中文名]
   - English name: [Organization Name]
   - Type: ORGANIZATION
   - Description: [Description, 20-30 chars]
   - Relevance: MEDIUM
   
   ENTITY 4 (PERSON - if applicable):
   - Chinese name: [人名]
   - English name: [Name]
   - Role: [职位]
   - Type: PERSON
   - Relevance: MEDIUM/LOW
   
   ENTITY 5 (LOCATION):
   - Chinese name: [地点]
   - English name: [Location]
   - Type: LOCATION
   - Description: [Why mentioned, 20-30 chars]
   - Relevance: MEDIUM/LOW

7. INTERNAL LINKING:
   Suggest 3 internal links with Chinese anchor text:
   - Anchor: [关键词丰富的锚文本]
   - Target: /zh/[category]/[article]
   - Context: [Why relevant]

${request.asset ? `ASSET: ${request.asset}` : ''}

TONE: Professional, authoritative, data-driven, analytical (suitable for Chinese financial audience)

CSRC COMPLIANCE (CRITICAL):
- Avoid sensitive political topics (Taiwan, Hong Kong politics, Xinjiang, Tibet)
- No criticism of Chinese government policies
- No speculation on regulatory crackdowns
- Frame regulations as "guidance" or "oversight" not "restrictions"
- Use neutral language: "监管指导" (regulatory guidance) not "监管打压" (regulatory crackdown)
- Educational content only, not investment advice
- Prominent risk disclaimers
- Simplified Chinese (简体中文) only

OUTPUT FORMAT: JSON with the following structure:
{
  "title": "Keyword-rich Chinese title (20-30 chars)",
  "metaDescription": "SEO-optimized description (80-120 chars)",
  "sections": [
    {
      "header": "市场概况",
      "level": 2,
      "content": "Section content in Chinese...",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "fullContent": "Complete article with all sections",
  "weiboCaption": "🚀 Viral 140-char Weibo caption with emojis and hashtags",
  "sinaCaption": "📈 Professional Sina caption",
  "entities": [
    {
      "name": "Company Name",
      "type": "COMPANY",
      "chineseName": "公司中文名",
      "description": "Brief description",
      "relevance": "HIGH"
    }
    // Exactly 5 entities
  ],
  "keywords": ["primary", "keyword", "list"],
  "internalLinks": [
    {
      "anchor": "锚文本",
      "target": "/zh/category/article",
      "context": "Relevance explanation"
    }
  ]
}

QUALITY STANDARDS:
- Word count: 800+ Chinese characters
- Keyword density: 2-3%
- Header count: 6-8 minimum (H2/H3)
- Entity count: EXACTLY 5 tagged entities
- Reading time: 3-5 minutes
- Baidu SEO score: 85/100 minimum
- CSRC compliance: 100%`
}

/**
 * Build Baidu re-optimization prompt for existing content
 */
function buildBaiduReoptimizationPrompt(request: BaiduReoptimizeRequest): string {
  return `ACT AS: Asia-Pacific Market Specialist

TASK: Optimize the following intelligence for the Baidu Search Engine (zh): ${request.topic}

EXISTING CONTENT:
"""
${request.existingContent}
"""

OPTIMIZATION REQUIREMENTS:

1. LOGICAL DENSITY (CRITICAL):
   - Increase H2 and H3 header frequency
   - Baidu's algorithm favors clear hierarchical structures
   - MINIMUM 6-8 headers required
   - Break long sections into smaller subsections with H3 headers
   - Each section should be 150-250 Chinese characters

2. ENTITY TAGGING (EXACTLY 5 KEY ENTITIES):
   - Identify and highlight 5 key 'Entities' for Baidu Knowledge Graph
   - Priority: Companies > Government Bodies > Organizations > Persons > Locations
   - Each entity must have:
     * Chinese name (中文名)
     * English name
     * Type (COMPANY/GOVERNMENT_BODY/ORGANIZATION/PERSON/LOCATION)
     * Brief description (20-30 Chinese characters)
     * Relevance level (HIGH/MEDIUM/LOW)

3. VIRAL WEIBO CAPTION (EMOJI-HEAVY, PUNCHY):
   - Write a Weibo-style viral caption for internal distribution
   - 140 characters maximum
   - 3-5 emojis (🚀 💰 📊 📈 💡 ❓ 🔥 ⚡ 💎)
   - 2-3 trending hashtags
   - Shocking data point or question
   - Professional but exciting
   - Example: "🚀比特币暴涨12%！机构资金流入达23亿美元💰 这波牛市能持续多久？📊 #比特币 #投资分析 #加密货币"

4. CSRC COMPLIANCE (CRITICAL):
   - Ensure tone is analytical and professional
   - Avoid sensitive political triggers:
     * No Taiwan, Hong Kong, Xinjiang, Tibet political topics
     * No criticism of Chinese government
     * No speculation on regulatory crackdowns
   - Use neutral regulatory language:
     * ✅ "监管指导" (regulatory guidance)
     * ✅ "政策支持" (policy support)
     * ✅ "市场监督" (market supervision)
     * ❌ "监管打压" (regulatory crackdown)
     * ❌ "政府限制" (government restrictions)
   - Frame as educational content, not investment advice
   - Prominent risk disclaimers

5. KEYWORD OPTIMIZATION:
   - Maintain 2-3% keyword density
   - Add 10-15 LSI keywords naturally
   - Optimize for Baidu's semantic search

6. STRUCTURE ENHANCEMENT:
   - Add more H2/H3 headers for logical density
   - Ensure each section has clear purpose
   - Include data points and metrics
   - Add internal linking suggestions

${request.asset ? `ASSET: ${request.asset}` : ''}
TARGET AUDIENCE: ${request.targetAudience || 'general'} investors in mainland China

OUTPUT FORMAT: JSON with the following structure:
{
  "title": "Optimized Chinese title (20-30 chars)",
  "metaDescription": "SEO-optimized description (80-120 chars)",
  "sections": [
    {
      "header": "Section header",
      "level": 2 or 3,
      "content": "Section content...",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "fullContent": "Complete optimized article",
  "weiboCaption": "🚀 Viral Weibo caption with emojis",
  "sinaCaption": "📈 Professional Sina caption",
  "entities": [
    {
      "name": "Entity Name",
      "type": "COMPANY|GOVERNMENT_BODY|ORGANIZATION|PERSON|LOCATION",
      "chineseName": "实体中文名",
      "description": "Brief description (20-30 chars)",
      "relevance": "HIGH|MEDIUM|LOW"
    }
    // Exactly 5 entities
  ],
  "keywords": ["keyword1", "keyword2", ...],
  "internalLinks": [
    {
      "anchor": "锚文本",
      "target": "/zh/category/article",
      "context": "Relevance"
    }
  ],
  "optimizationNotes": [
    "Note 1: What was changed",
    "Note 2: Why it was changed",
    "Note 3: Expected impact"
  ]
}

QUALITY STANDARDS:
- Header count: 6-8 minimum (increased logical density)
- Entity count: EXACTLY 5 (Baidu Knowledge Graph)
- Weibo caption: Viral, emoji-heavy, punchy
- CSRC compliance: 100% (no political triggers)
- Keyword density: 2-3%
- Baidu SEO score: 85/100 minimum`
}

/**
 * Parse Baidu-optimized response
 */
function parseBaiduOptimizedResponse(
  response: string,
  request: BaiduOptimizedRequest
): BaiduOptimizedContent {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                     response.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // Calculate metadata
    const wordCount = parsed.fullContent.length // Chinese characters
    const readingTime = Math.ceil(wordCount / 400) // 400 chars per minute for Chinese
    const keywordDensity = calculateKeywordDensity(parsed.fullContent, parsed.keywords)
    const headerCount = parsed.sections.length
    const entityCount = parsed.entities.length
    
    return {
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      sections: parsed.sections,
      fullContent: parsed.fullContent,
      weiboCaption: parsed.weiboCaption,
      sinaCaption: parsed.sinaCaption,
      entities: parsed.entities,
      keywords: parsed.keywords,
      internalLinks: parsed.internalLinks,
      metadata: {
        wordCount,
        readingTime,
        keywordDensity,
        headerCount,
        entityCount,
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Parse error:', error)
    throw new Error('Failed to parse Baidu-optimized response')
  }
}

/**
 * Calculate keyword density for Baidu SEO
 */
function calculateKeywordDensity(content: string, keywords: string[]): number {
  const totalChars = content.length
  let keywordChars = 0
  
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'g')
    const matches = content.match(regex)
    if (matches) {
      keywordChars += matches.length * keyword.length
    }
  }
  
  return (keywordChars / totalChars) * 100
}

/**
 * Format entities for Baidu Knowledge Graph submission
 */
export function formatEntitiesForBaidu(entities: EntityTag[]): string {
  return entities
    .map(entity => {
      return `${entity.chineseName} (${entity.name}) - ${entity.type} - ${entity.relevance}`
    })
    .join('\n')
}

/**
 * Generate Baidu sitemap entry
 */
export function generateBaiduSitemapEntry(
  url: string,
  title: string,
  keywords: string[]
): object {
  return {
    loc: url,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.9,
    'baidu:title': title,
    'baidu:keywords': keywords.join(','),
  }
}

/**
 * Validate Baidu SEO compliance
 */
export function validateBaiduSEO(content: BaiduOptimizedContent): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100
  
  // Title length check
  if (content.title.length < 20 || content.title.length > 30) {
    issues.push('Title length should be 20-30 Chinese characters')
    score -= 10
  }
  
  // Meta description check
  if (content.metaDescription.length < 80 || content.metaDescription.length > 120) {
    issues.push('Meta description should be 80-120 Chinese characters')
    score -= 10
  }
  
  // Keyword density check
  if (content.metadata.keywordDensity < 2 || content.metadata.keywordDensity > 3) {
    issues.push(`Keyword density is ${content.metadata.keywordDensity.toFixed(2)}%, should be 2-3%`)
    score -= 15
  }
  
  // Header count check
  if (content.metadata.headerCount < 5) {
    recommendations.push('Add more H2/H3 headers for better structure')
    score -= 5
  }
  
  // Entity count check
  if (content.metadata.entityCount < 5) {
    recommendations.push('Tag more entities for Baidu Knowledge Graph')
    score -= 10
  }
  
  // Word count check
  if (content.metadata.wordCount < 800) {
    issues.push('Content should be at least 800 Chinese characters')
    score -= 15
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  }
}
