# Requirements Document: SIA_SENTIMENT_ENGINE

## Introduction

The SIA_SENTIMENT_ENGINE is a contrarian sentiment analysis system designed to generate unique, Google-recognizable content by analyzing internet-wide market sentiment and developing data-driven opposing perspectives. This system integrates with the existing AdSense-compliant content generation pipeline to inject "conflict narratives" that enhance E-E-A-T scores and originality metrics.

The engine addresses a critical gap in the current content generation system: while basic sentiment (BULLISH/BEARISH/NEUTRAL) exists, there is no contrarian analysis or conflict narrative generation. This feature will enable SIA to produce content that stands out as "Original Perspective" in Google's content quality algorithms.

## Glossary

- **Sentiment_Engine**: The core system that analyzes internet-wide sentiment and generates contrarian perspectives
- **Contrarian_Analyzer**: Component that develops opposing viewpoints based on data divergence
- **Conflict_Narrator**: Component that generates "Market expects X, but data shows Y" narratives
- **Fear_Greed_Index**: Numerical measure (0-100) of market sentiment extremes
- **Sentiment_Divergence_Score**: Metric measuring the gap between market sentiment and underlying data
- **OSINT**: Open Source Intelligence - publicly available data sources
- **E-E-A-T**: Experience, Expertise, Authoritativeness, Trustworthiness (Google's content quality framework)
- **AdSense_Writer**: Existing content generation system (lib/ai/adsense-compliant-writer.ts)
- **Gemini_API**: Google's Gemini 1.5 Pro AI model with Search grounding capability
- **Sharp_Language**: Distinctive, bold phrasing that signals original analysis to Google's algorithms
- **Content_Layer**: One of three content structure layers (Summary, SIA Insight, Risk Disclaimer)

## Requirements

### Requirement 1: Internet-Wide Sentiment Analysis

**User Story:** As a content generator, I want to analyze internet-wide sentiment for a given topic, so that I can identify market fear/greed extremes and develop contrarian perspectives.

#### Acceptance Criteria

1. WHEN a content generation request is received, THE Sentiment_Engine SHALL query multiple OSINT sources for sentiment data
2. THE Sentiment_Engine SHALL calculate a Fear_Greed_Index score between 0 (extreme fear) and 100 (extreme greed)
3. THE Sentiment_Engine SHALL categorize sentiment as "EXTREME_FEAR" (0-20), "FEAR" (21-40), "NEUTRAL" (41-60), "GREED" (61-80), or "EXTREME_GREED" (81-100)
4. WHEN sentiment data is unavailable, THE Sentiment_Engine SHALL use Gemini_API with Google Search grounding to analyze real-time market discussions
5. THE Sentiment_Engine SHALL complete sentiment analysis within 3 seconds for performance compliance
6. THE Sentiment_Engine SHALL support all 6 languages (en, tr, de, es, fr, ar) for sentiment source analysis
7. THE Sentiment_Engine SHALL log sentiment sources and confidence levels for transparency

### Requirement 2: Contrarian Perspective Generation

**User Story:** As a content strategist, I want to generate data-driven contrarian perspectives, so that content stands out as original analysis rather than following market consensus.

#### Acceptance Criteria

1. WHEN sentiment is categorized as "EXTREME_FEAR" or "EXTREME_GREED", THE Contrarian_Analyzer SHALL generate an opposing perspective with high priority
2. THE Contrarian_Analyzer SHALL identify at least 3 data points that contradict the prevailing sentiment
3. WHEN generating contrarian perspectives, THE Contrarian_Analyzer SHALL use on-chain data, exchange flows, or whale wallet activity as evidence
4. THE Contrarian_Analyzer SHALL calculate a Sentiment_Divergence_Score measuring the gap between sentiment and data (0-100 scale)
5. WHERE Sentiment_Divergence_Score exceeds 60, THE Contrarian_Analyzer SHALL flag the content as "HIGH_CONTRARIAN_VALUE"
6. THE Contrarian_Analyzer SHALL avoid generating contrarian perspectives when Sentiment_Divergence_Score is below 30 (insufficient divergence)
7. THE Contrarian_Analyzer SHALL provide confidence levels (LOW/MEDIUM/HIGH) for each contrarian perspective

### Requirement 3: Conflict Narrative Injection

**User Story:** As a content writer, I want to inject conflict narratives into content, so that Google recognizes the content as providing unique analytical value.

#### Acceptance Criteria

1. THE Conflict_Narrator SHALL generate narratives following the pattern "Market expects X, but data shows Y risk"
2. WHEN Sentiment_Divergence_Score exceeds 60, THE Conflict_Narrator SHALL inject conflict narratives into the SIA_Insight content layer
3. THE Conflict_Narrator SHALL use Sharp_Language with distinctive phrasing that signals original analysis
4. THE Conflict_Narrator SHALL maintain AdSense compliance by avoiding clickbait or sensationalist language
5. WHERE language is Turkish, THE Conflict_Narrator SHALL use culturally appropriate contrarian phrasing (e.g., "Piyasa X beklerken, veriler Y riskine işaret ediyor")
6. THE Conflict_Narrator SHALL ensure conflict narratives are supported by at least 2 specific data points
7. THE Conflict_Narrator SHALL integrate conflict narratives naturally within the 3-layer content structure without disrupting flow

### Requirement 4: Sharp Language Generation

**User Story:** As an SEO optimizer, I want content to use sharp, distinctive language, so that Google's algorithms recognize it as original perspective rather than generic analysis.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL generate Sharp_Language phrases that are bold yet professional
2. THE Sentiment_Engine SHALL avoid generic phrases like "according to reports", "sources say", "experts believe"
3. THE Sentiment_Engine SHALL use ownership language like "SIA_SENTINEL proprietary analysis reveals", "Our contrarian assessment indicates"
4. WHEN generating Sharp_Language, THE Sentiment_Engine SHALL maintain E-E-A-T compliance with authoritative tone
5. THE Sentiment_Engine SHALL provide language-specific Sharp_Language templates for all 6 supported languages
6. THE Sentiment_Engine SHALL ensure Sharp_Language increases originality scores by at least 10 points
7. THE Sentiment_Engine SHALL validate that Sharp_Language does not trigger AdSense policy violations

### Requirement 5: Integration with AdSense Content Writer

**User Story:** As a system integrator, I want the Sentiment_Engine to integrate seamlessly with the existing AdSense_Writer, so that contrarian analysis enhances content without breaking the current pipeline.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL integrate with AdSense_Writer at the content generation request stage
2. WHEN AdSense_Writer generates content, THE Sentiment_Engine SHALL provide sentiment analysis data before SIA_Insight generation
3. THE Sentiment_Engine SHALL enhance the existing generateSiaInsight function with contrarian perspectives
4. THE Sentiment_Engine SHALL maintain backward compatibility with existing ContentGenerationRequest interface
5. THE Sentiment_Engine SHALL add optional fields to ContentGenerationRequest: enableContrarian (boolean), sentimentSources (string[])
6. THE Sentiment_Engine SHALL preserve all existing E-E-A-T score calculations while adding contrarian bonus points
7. THE Sentiment_Engine SHALL ensure total content generation time remains under 5 seconds including sentiment analysis

### Requirement 6: Gemini API Integration for Sentiment Analysis

**User Story:** As a data analyst, I want to use Gemini API with Google Search grounding, so that sentiment analysis is based on real-time, current market data rather than stale information.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL use Gemini 1.5 Pro API for sentiment analysis when OSINT sources are insufficient
2. THE Sentiment_Engine SHALL enable Google Search grounding to access real-time market discussions
3. WHEN querying Gemini_API, THE Sentiment_Engine SHALL use temperature 0.3 for consistent sentiment classification
4. THE Sentiment_Engine SHALL structure Gemini prompts to return sentiment scores, key narratives, and data contradictions
5. THE Sentiment_Engine SHALL handle Gemini_API failures gracefully by falling back to basic sentiment classification
6. THE Sentiment_Engine SHALL cache Gemini sentiment results for 5 minutes to reduce API costs
7. THE Sentiment_Engine SHALL log Gemini API usage for cost monitoring and optimization

### Requirement 7: Multi-Language Contrarian Support

**User Story:** As a global content publisher, I want contrarian analysis in all 6 supported languages, so that non-English markets receive the same quality of unique perspective.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL support contrarian analysis generation in English, Turkish, German, Spanish, French, and Arabic
2. THE Sentiment_Engine SHALL use culturally appropriate contrarian phrasing for each language
3. WHEN language is Turkish, THE Sentiment_Engine SHALL use phrases like "Piyasa beklentisinin aksine" (contrary to market expectations)
4. WHEN language is Arabic, THE Sentiment_Engine SHALL ensure right-to-left text formatting for conflict narratives
5. THE Sentiment_Engine SHALL maintain equivalent E-E-A-T scores across all languages (variance < 10 points)
6. THE Sentiment_Engine SHALL provide language-specific Sharp_Language templates with native speaker quality
7. THE Sentiment_Engine SHALL validate that translated contrarian narratives maintain professional financial journalism standards

### Requirement 8: Sentiment Divergence Scoring

**User Story:** As a quality analyst, I want to measure sentiment divergence quantitatively, so that I can determine when contrarian perspectives add genuine value versus being forced.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL calculate Sentiment_Divergence_Score as the absolute difference between Fear_Greed_Index and data-based indicators
2. THE Sentiment_Engine SHALL normalize Sentiment_Divergence_Score to a 0-100 scale for consistency
3. WHEN Sentiment_Divergence_Score is below 30, THE Sentiment_Engine SHALL not generate contrarian content (insufficient divergence)
4. WHEN Sentiment_Divergence_Score is 30-60, THE Sentiment_Engine SHALL generate moderate contrarian perspectives
5. WHEN Sentiment_Divergence_Score exceeds 60, THE Sentiment_Engine SHALL generate strong contrarian perspectives with high confidence
6. THE Sentiment_Engine SHALL include Sentiment_Divergence_Score in content metadata for quality tracking
7. THE Sentiment_Engine SHALL provide a breakdown of divergence sources (on-chain vs sentiment, exchange flows vs social media, etc.)

### Requirement 9: E-E-A-T Score Enhancement

**User Story:** As an SEO specialist, I want contrarian analysis to boost E-E-A-T scores, so that content ranks higher in Google's quality assessments.

#### Acceptance Criteria

1. WHEN contrarian analysis is included, THE Sentiment_Engine SHALL add 10-15 bonus points to the Experience component of E-E-A-T
2. THE Sentiment_Engine SHALL add 5-10 bonus points to the Expertise component when technical data supports contrarian views
3. THE Sentiment_Engine SHALL ensure total E-E-A-T score reaches minimum 75/100 when contrarian analysis is active
4. THE Sentiment_Engine SHALL track E-E-A-T score improvements attributable to contrarian content
5. THE Sentiment_Engine SHALL maintain Trustworthiness scores by ensuring all contrarian claims are data-backed
6. WHERE contrarian analysis lacks sufficient data support, THE Sentiment_Engine SHALL not apply E-E-A-T bonuses
7. THE Sentiment_Engine SHALL validate that contrarian content does not reduce Authoritativeness by appearing speculative

### Requirement 10: API Endpoint for Sentiment Analysis

**User Story:** As a developer, I want a dedicated API endpoint for sentiment analysis, so that I can test and monitor the Sentiment_Engine independently of content generation.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL expose a GET endpoint at /api/sentiment/analyze accepting query parameters: topic, asset, language
2. THE Sentiment_Engine SHALL expose a POST endpoint at /api/sentiment/analyze accepting JSON body with detailed analysis options
3. WHEN the GET endpoint is called, THE Sentiment_Engine SHALL return Fear_Greed_Index, sentiment category, and Sentiment_Divergence_Score
4. WHEN the POST endpoint is called with enableContrarian=true, THE Sentiment_Engine SHALL return full contrarian analysis with conflict narratives
5. THE Sentiment_Engine SHALL return response within 3 seconds for GET requests and 5 seconds for POST requests
6. THE Sentiment_Engine SHALL include API usage metrics in response headers (X-Sentiment-Sources, X-Divergence-Score, X-Processing-Time)
7. THE Sentiment_Engine SHALL implement rate limiting of 60 requests per minute per IP address

### Requirement 11: Validation and Quality Assurance

**User Story:** As a quality assurance engineer, I want automated validation of contrarian content, so that only high-quality, data-backed perspectives are published.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL validate that all contrarian claims are supported by at least 2 specific data points
2. THE Sentiment_Engine SHALL reject contrarian content with Sentiment_Divergence_Score below 30
3. THE Sentiment_Engine SHALL ensure conflict narratives do not contain forbidden generic phrases
4. THE Sentiment_Engine SHALL validate that Sharp_Language increases originality scores by minimum 10 points
5. THE Sentiment_Engine SHALL check that contrarian content maintains AdSense policy compliance
6. WHEN validation fails, THE Sentiment_Engine SHALL log failure reasons and fall back to non-contrarian content generation
7. THE Sentiment_Engine SHALL provide a validation report including all quality checks and pass/fail status

### Requirement 12: Performance and Caching

**User Story:** As a system administrator, I want sentiment analysis to be performant and cost-effective, so that content generation remains fast and API costs stay controlled.

#### Acceptance Criteria

1. THE Sentiment_Engine SHALL complete sentiment analysis within 3 seconds for 95% of requests
2. THE Sentiment_Engine SHALL cache sentiment results for identical topics for 5 minutes
3. THE Sentiment_Engine SHALL cache Gemini_API responses to reduce redundant API calls
4. WHEN cache hit occurs, THE Sentiment_Engine SHALL return results within 100 milliseconds
5. THE Sentiment_Engine SHALL implement cache invalidation when new significant market events are detected
6. THE Sentiment_Engine SHALL log cache hit rates for optimization monitoring
7. THE Sentiment_Engine SHALL limit Gemini_API calls to maximum 100 per hour to control costs

## Quality Metrics

### Minimum Standards
- **Sentiment Analysis Time**: < 3 seconds (95th percentile)
- **Content Generation Time**: < 5 seconds total (including sentiment analysis)
- **E-E-A-T Score Improvement**: +10 to +25 points with contrarian analysis
- **Originality Score Improvement**: +10 to +20 points with Sharp_Language
- **Sentiment_Divergence_Score Threshold**: ≥ 30 for contrarian content generation
- **API Response Time**: < 3 seconds (GET), < 5 seconds (POST)
- **Cache Hit Rate**: > 40% for cost optimization
- **AdSense Compliance**: 100% (no policy violations)

### Success Criteria
- Contrarian content achieves E-E-A-T scores ≥ 75/100
- Originality scores increase by average 15 points
- Google recognizes content as "Original Perspective" (manual verification)
- Content generation pipeline remains under 5 seconds end-to-end
- API costs remain under $50/month for sentiment analysis
- Multi-language support maintains quality parity (< 10 point variance)

## Integration Points

### Existing Systems
1. **AdSense Content Writer** (`lib/ai/adsense-compliant-writer.ts`)
   - Enhance `generateSiaInsight()` function with contrarian analysis
   - Add sentiment data to `ContentGenerationRequest` interface
   - Integrate conflict narratives into Layer 2 (SIA Insight)

2. **AdSense Content API** (`app/api/ai/adsense-content/route.ts`)
   - Add optional `enableContrarian` parameter
   - Include sentiment metadata in API responses
   - Maintain backward compatibility

3. **Gemini API Integration**
   - Use existing API key from environment variables
   - Enable Google Search grounding for real-time data
   - Implement proper error handling and fallbacks

### New Components
1. **Sentiment Engine Library** (`lib/ai/sia-sentiment-engine.ts`)
2. **Sentiment Analysis API** (`app/api/sentiment/analyze/route.ts`)
3. **Contrarian Analyzer Module** (`lib/ai/contrarian-analyzer.ts`)
4. **Conflict Narrator Module** (`lib/ai/conflict-narrator.ts`)

## Technical Constraints

1. Must maintain AdSense policy compliance (no clickbait, professional tone)
2. Must preserve existing E-E-A-T calculation logic while adding bonuses
3. Must complete within 5-second total content generation time budget
4. Must support all 6 languages with equivalent quality
5. Must use Gemini 1.5 Pro API with Google Search grounding
6. Must implement caching to control API costs (< $50/month target)
7. Must maintain backward compatibility with existing content generation requests

## Risk Considerations

1. **Over-Contrarian Risk**: Generating contrarian perspectives when divergence is insufficient may appear forced or speculative
   - Mitigation: Enforce minimum Sentiment_Divergence_Score threshold of 30

2. **AdSense Policy Violation**: Sharp language or conflict narratives may be perceived as sensationalist
   - Mitigation: Validate all content against AdSense policies before publication

3. **API Cost Overrun**: Excessive Gemini API calls may exceed budget
   - Mitigation: Implement aggressive caching (5-minute TTL) and rate limiting (100 calls/hour)

4. **Performance Degradation**: Sentiment analysis may slow content generation
   - Mitigation: Set strict 3-second timeout for sentiment analysis, use cached results when available

5. **Language Quality Variance**: Non-English contrarian narratives may lack native speaker quality
   - Mitigation: Use language-specific templates reviewed by native speakers, validate E-E-A-T parity

6. **False Contrarian Signals**: Data may not actually contradict sentiment, leading to incorrect analysis
   - Mitigation: Require minimum 2 data points supporting contrarian view, calculate confidence levels

## Future Enhancements (Out of Scope)

1. Machine learning model for sentiment prediction based on historical patterns
2. Real-time sentiment streaming for breaking news events
3. Sentiment comparison across multiple assets for correlation analysis
4. User feedback loop to improve contrarian perspective quality
5. A/B testing framework to measure contrarian content performance
6. Integration with social media APIs (Twitter, Reddit) for broader sentiment coverage
7. Sentiment visualization dashboard for editorial team

---

**Document Version**: 2.0.0  
**Created**: 2024  
**Updated**: 2024 (Phase 3 Requirements Added)  
**Status**: Complete - All 3 Phases Defined  
**Next Phase**: Task Creation


---

## Phase 3: SIA_GRAVITY_ENGINE (User Engagement Optimization)

### Introduction

Phase 3 extends the SIA_SENTIMENT_ENGINE with user engagement optimization features designed to complete the "Search Journey" on-site, reduce bounce rates, and signal user satisfaction to Google through behavioral metrics and structured data. This phase transforms content from informative to magnetic, ensuring users don't need to search elsewhere.

### Glossary (Phase 3 Additions)

- **Gravity_Engine**: System that keeps users engaged and satisfied on-site
- **Comprehensive_Answer**: Full-spectrum analysis that anticipates follow-up questions
- **Pattern_Interrupt**: Mid-content engagement hook using shocking contrarian data
- **Curiosity_Gap**: Strategic unanswered question linking to deeper content
- **UserInteraction_Schema**: Schema.org structured data signaling user satisfaction to Google
- **End_of_Search**: Protocol ensuring users find complete answers without additional searches
- **Engagement_Score**: Metric predicting content's ability to retain users (0-100)
- **Satisfaction_Signal**: Behavioral metric (time, scroll, clicks) indicating content quality

---

## Phase 3 Requirements

### Requirement 13: Comprehensive Answer Generation

**User Story:** As a content consumer, I want all my related questions answered on one page, so that I don't need to search elsewhere for additional information.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL analyze the main topic and generate 3-5 anticipated follow-up questions users might have
2. FOR EACH anticipated question, THE Gravity_Engine SHALL provide a concise answer (50-100 words) with supporting data
3. THE Gravity_Engine SHALL inject related context naturally into content (e.g., "How does this affect taxes?" for regulatory news)
4. THE Gravity_Engine SHALL calculate a Completeness_Score (0-100) measuring how comprehensively the content addresses the topic
5. WHEN Completeness_Score is below 85, THE Gravity_Engine SHALL identify missing information and suggest additions
6. THE Gravity_Engine SHALL maintain AdSense compliance by ensuring all answers are factual and properly sourced
7. THE Gravity_Engine SHALL use ethical transparency (real sources only, no fake hooks or misleading claims)

### Requirement 14: Pattern Interrupt Injection

**User Story:** As a content strategist, I want to inject mid-content engagement hooks, so that users slow their reading speed and spend more time on page.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL identify optimal placement position for pattern interrupts (40-60% through content)
2. WHEN Sentiment_Divergence_Score exceeds 50, THE Gravity_Engine SHALL generate a pattern interrupt using contrarian data from Phase 2
3. THE Pattern_Interrupt SHALL be formatted as a visually distinct callout box with specific on-chain metrics
4. THE Pattern_Interrupt SHALL include at least 3 specific data points (percentages, volumes, or counts)
5. THE Pattern_Interrupt SHALL reference historical precedents when available (e.g., "This pattern preceded 15-25% corrections in 47 prior occurrences")
6. THE Gravity_Engine SHALL limit pattern interrupts to 1 per article to avoid manipulation perception
7. THE Pattern_Interrupt SHALL maintain professional tone and avoid sensationalism despite shocking data

### Requirement 15: Curiosity Gap Generation

**User Story:** As a user engagement optimizer, I want to create strategic curiosity gaps at content end, so that users click through to related deep analysis without feeling manipulated.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL generate an end-of-content curiosity gap linking to related SIA_DEEP_REPORT or educational content
2. THE Curiosity_Gap SHALL follow the pattern "If you understood X, the next step is Y" without clickbait language
3. THE Curiosity_Gap SHALL only link to genuinely relevant content (relevance score ≥ 70/100)
4. THE Gravity_Engine SHALL validate that linked content actually delivers on the curiosity gap promise (honesty check)
5. WHEN no relevant deep content exists, THE Gravity_Engine SHALL skip curiosity gap generation rather than force irrelevant links
6. THE Curiosity_Gap SHALL be positioned after full analysis is provided (not mid-content)
7. THE Curiosity_Gap SHALL include a brief preview (1 sentence) of what users will learn in the linked content

### Requirement 16: UserInteraction Schema Generation

**User Story:** As an SEO specialist, I want to signal user satisfaction to Google through structured data, so that content ranks higher based on engagement quality.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL generate Schema.org UserInteraction structured data for each article
2. THE UserInteraction_Schema SHALL include interactionType (ReadAction, ViewAction, or ConsumeAction)
3. THE UserInteraction_Schema SHALL track startTime and endTime for time-on-page calculation
4. THE UserInteraction_Schema SHALL include userInteractionCount representing scroll depth percentage
5. THE UserInteraction_Schema SHALL include InteractionCounter with time-on-page in seconds
6. THE Gravity_Engine SHALL only generate UserInteraction_Schema for articles with genuine engagement (time > 2min AND scroll > 60%)
7. THE Gravity_Engine SHALL update UserInteraction_Schema dynamically as user engagement progresses

### Requirement 17: Question Anticipation Algorithm

**User Story:** As a content analyst, I want to predict follow-up questions users might have, so that comprehensive answers can be provided proactively.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL analyze the main topic using Gemini API to identify 3-5 likely follow-up questions
2. THE Question_Anticipation SHALL consider user intent categories: "How does this affect me?", "What happens next?", "Why is this important?"
3. THE Gravity_Engine SHALL prioritize questions based on search volume data when available
4. THE Gravity_Engine SHALL generate answers for anticipated questions using the same E-E-A-T standards as main content
5. THE Gravity_Engine SHALL inject anticipated Q&A naturally within content flow (not as separate FAQ section)
6. THE Gravity_Engine SHALL validate that anticipated questions are genuinely relevant (relevance score ≥ 75/100)
7. THE Gravity_Engine SHALL support multi-language question anticipation for all 6 supported languages

### Requirement 18: Engagement Score Calculation

**User Story:** As a content quality analyst, I want to predict content's engagement potential, so that low-engagement content can be improved before publication.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL calculate an Engagement_Score (0-100) predicting content's ability to retain users
2. THE Engagement_Score SHALL consider factors: Completeness_Score, Pattern_Interrupt presence, Curiosity_Gap quality, content length
3. WHEN Engagement_Score is below 70, THE Gravity_Engine SHALL provide specific recommendations for improvement
4. THE Gravity_Engine SHALL track actual engagement metrics (time, scroll, clicks) and compare to predicted Engagement_Score
5. THE Gravity_Engine SHALL use historical engagement data to refine Engagement_Score algorithm over time
6. THE Engagement_Score SHALL be included in content metadata for quality tracking
7. THE Gravity_Engine SHALL ensure Engagement_Score calculation completes within 1 second (performance requirement)

### Requirement 19: Ethical Transparency Validation

**User Story:** As a compliance officer, I want to ensure all engagement tactics are ethical and transparent, so that users trust the content and AdSense policies are maintained.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL validate that all sources cited in comprehensive answers are real and verifiable
2. THE Gravity_Engine SHALL reject any content containing "fake hooks" (e.g., "Secret file reveals..." without actual file)
3. THE Gravity_Engine SHALL ensure curiosity gaps deliver on their promises (no clickbait)
4. THE Gravity_Engine SHALL maintain a "No Manipulation" policy: engagement tactics must provide genuine value
5. THE Gravity_Engine SHALL log all ethical validation checks for audit purposes
6. WHEN ethical validation fails, THE Gravity_Engine SHALL provide specific reasons and suggest corrections
7. THE Gravity_Engine SHALL ensure all engagement features comply with AdSense content policies

### Requirement 20: Pattern Interrupt Placement Algorithm

**User Story:** As a UX designer, I want pattern interrupts placed optimally, so that they maximize engagement without disrupting reading flow.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL calculate optimal placement position as 40-60% through content length
2. THE Placement_Algorithm SHALL avoid placing pattern interrupts mid-sentence or mid-paragraph
3. THE Placement_Algorithm SHALL prefer placement after a complete thought or section
4. THE Gravity_Engine SHALL adjust placement based on content structure (e.g., after Layer 2 SIA_INSIGHT)
5. WHEN content is too short (< 300 words), THE Gravity_Engine SHALL skip pattern interrupt placement
6. THE Placement_Algorithm SHALL ensure pattern interrupt doesn't interfere with AdSense ad placements
7. THE Gravity_Engine SHALL validate that placement position enhances rather than disrupts user experience

### Requirement 21: Client-Side Engagement Tracking

**User Story:** As an analytics engineer, I want to track user engagement metrics client-side, so that UserInteraction schema can be updated dynamically.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL provide client-side JavaScript for tracking time-on-page, scroll depth, and click-through events
2. THE Tracking_Script SHALL use requestIdleCallback for non-critical metrics to avoid performance impact
3. THE Tracking_Script SHALL lazy-load to prevent blocking page render
4. THE Tracking_Script SHALL send engagement data to analytics endpoint every 30 seconds
5. THE Tracking_Script SHALL update UserInteraction_Schema JSON-LD dynamically as engagement progresses
6. THE Tracking_Script SHALL respect user privacy (no PII collection, GDPR compliant)
7. THE Tracking_Script SHALL handle offline scenarios gracefully (queue metrics for later submission)

### Requirement 22: Curiosity Gap Relevance Scoring

**User Story:** As a content curator, I want to ensure curiosity gaps only link to highly relevant content, so that users aren't disappointed by irrelevant recommendations.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL calculate a Relevance_Score (0-100) for each potential curiosity gap link
2. THE Relevance_Score SHALL consider topic similarity, content depth, and logical progression
3. WHEN Relevance_Score is below 70, THE Gravity_Engine SHALL not generate a curiosity gap for that link
4. THE Gravity_Engine SHALL prioritize links to SIA_DEEP_REPORT over generic educational content
5. THE Gravity_Engine SHALL validate that linked content is accessible (not behind paywall or broken link)
6. THE Gravity_Engine SHALL track click-through rates and adjust Relevance_Score algorithm based on actual user behavior
7. THE Gravity_Engine SHALL support multi-language relevance scoring for all 6 supported languages

### Requirement 23: Comprehensive Answer Formatting

**User Story:** As a content designer, I want comprehensive answers formatted naturally within content, so that they enhance rather than disrupt reading flow.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL inject anticipated Q&A inline within relevant sections (not as separate FAQ)
2. THE Formatting_System SHALL use subtle visual cues (e.g., "You might be wondering...") to introduce anticipated questions
3. THE Formatting_System SHALL maintain consistent typography and spacing with main content
4. THE Gravity_Engine SHALL ensure comprehensive answers don't exceed 100 words each (conciseness requirement)
5. THE Formatting_System SHALL support multi-language formatting conventions for all 6 supported languages
6. THE Gravity_Engine SHALL validate that comprehensive answers don't interfere with AdSense ad viewability
7. THE Formatting_System SHALL ensure mobile responsiveness for all comprehensive answer elements

### Requirement 24: Engagement Metrics API

**User Story:** As a data analyst, I want an API endpoint for engagement metrics, so that I can monitor and optimize content performance.

#### Acceptance Criteria

1. THE Gravity_Engine SHALL expose a GET endpoint at /api/engagement/metrics accepting query parameters: articleId, timeRange
2. THE Engagement_API SHALL return metrics: average time-on-page, scroll depth distribution, click-through rate, bounce rate
3. THE Engagement_API SHALL provide comparison data (current article vs site average)
4. THE Engagement_API SHALL include Engagement_Score and actual engagement correlation analysis
5. THE Engagement_API SHALL return response within 2 seconds for performance compliance
6. THE Engagement_API SHALL implement rate limiting of 100 requests per minute per IP address
7. THE Engagement_API SHALL require API key authentication for access

---

## Phase 3 Quality Metrics

### Minimum Standards
- **Completeness Score**: ≥ 85/100 for comprehensive answer quality
- **Engagement Score**: ≥ 70/100 for content retention potential
- **Time on Page**: > 3 minutes average (vs industry 1.5 min)
- **Scroll Depth**: > 80% of users reach end (vs industry 55%)
- **Click-Through to Deep Reports**: > 15% conversion (vs industry 5%)
- **Bounce Rate**: < 40% (vs industry 60%)
- **Return Visitor Rate**: > 25% within 7 days (vs industry 12%)
- **Pattern Interrupt Effectiveness**: > 20% increase in time-on-page when present

### Success Criteria
- Comprehensive answers reduce external search queries by ≥ 30%
- Pattern interrupts increase average time-on-page by ≥ 45 seconds
- Curiosity gaps achieve ≥ 15% click-through rate to deep reports
- UserInteraction schema correlates with ≥ 10% improvement in search rankings
- Engagement Score predicts actual engagement with ≥ 75% accuracy
- Ethical transparency validation maintains 100% pass rate (no fake hooks)

## Phase 3 Integration Points

### Existing Systems
1. **Phase 1 (Sentiment Engine)** (`lib/ai/sia-sentiment-engine.ts`)
   - Fear/Greed Index used for pattern interrupt trigger
   - Sentiment sources cited in comprehensive answers
   - Divergence score determines interrupt placement

2. **Phase 2 (Contrarian Analysis)** (`lib/ai/contrarian-analyzer.ts`, `lib/ai/conflict-narrator.ts`)
   - Conflict narratives become pattern interrupt content
   - Sharp Language used in curiosity gap generation
   - Data contradictions highlighted in pattern interrupt boxes

3. **AdSense Content Writer** (`lib/ai/adsense-compliant-writer.ts`)
   - Comprehensive answers injected into content flow
   - Pattern interrupts placed within Layer 2 (SIA Insight)
   - Curiosity gaps added after Layer 3 (Risk Disclaimer)

### New Components
1. **Gravity Engine Library** (`lib/ai/sia-gravity-engine.ts`)
2. **Question Anticipation Module** (`lib/ai/question-anticipator.ts`)
3. **Pattern Interrupt Generator** (`lib/ai/pattern-interrupt-generator.ts`)
4. **Curiosity Gap Generator** (`lib/ai/curiosity-gap-generator.ts`)
5. **UserInteraction Schema Generator** (`lib/seo/user-interaction-schema.ts`)
6. **Engagement Tracking Script** (`public/engagement-tracker.js`)
7. **Engagement Metrics API** (`app/api/engagement/metrics/route.ts`)

## Phase 3 Technical Constraints

1. Must maintain AdSense policy compliance (no manipulation, ethical transparency)
2. Must preserve existing E-E-A-T scores while adding engagement bonuses
3. Must complete engagement score calculation within 1 second
4. Must support all 6 languages with equivalent engagement quality
5. Must not interfere with AdSense ad placements or viewability
6. Must respect user privacy (GDPR compliant, no PII collection)
7. Must maintain page load performance (< 3 second total load time)

## Phase 3 Risk Considerations

1. **Over-Engagement Risk**: Too many engagement tactics may feel manipulative
   - Mitigation: Limit to 1 pattern interrupt per article, enforce ethical transparency validation

2. **Clickbait Perception**: Curiosity gaps may appear as clickbait if not carefully crafted
   - Mitigation: Enforce honesty principle, only link genuinely relevant content (relevance ≥ 70)

3. **Schema Spam**: Excessive UserInteraction schema may trigger Google penalties
   - Mitigation: Only generate schema for articles with genuine engagement (time > 2min, scroll > 60%)

4. **Performance Impact**: Client-side tracking may slow page load
   - Mitigation: Lazy-load tracking scripts, use requestIdleCallback for non-critical metrics

5. **False Engagement Signals**: Bots or accidental engagement may skew metrics
   - Mitigation: Implement bot detection, require minimum engagement thresholds (time > 2min)

6. **Content Bloat**: Comprehensive answers may make content too long
   - Mitigation: Limit anticipated Q&A to 100 words each, maximum 5 questions per article

---

**Document Version**: 2.0.0  
**Created**: 2024  
**Updated**: 2024 (Phase 3 added)  
**Status**: Complete - Ready for Design Phase  
**Next Phase**: Design Document Update (Phase 3 components)
