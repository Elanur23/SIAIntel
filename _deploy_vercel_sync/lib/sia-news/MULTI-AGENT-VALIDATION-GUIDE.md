# Multi-Agent Validation System - Implementation Guide

## Overview

The Multi-Agent Validation System is a critical component of the SIA_NEWS_v1.0 platform that ensures content quality, accuracy, and compliance before publication. It implements a 3-agent consensus mechanism with comprehensive quality scoring.

## Architecture

### Three Validation Agents

1. **ACCURACY_VERIFIER**
   - Verifies factual accuracy against source data
   - Validates numerical values and timestamps
   - Checks entity references
   - Ensures causal relationships are supported by data
   - Minimum confidence: 70%

2. **IMPACT_ASSESSOR**
   - Assesses market significance and relevance
   - Evaluates technical depth (HIGH/MEDIUM/LOW)
   - Validates unique insights (SIA_Insight)
   - Checks sentiment analysis reasonableness
   - Verifies ownership attribution
   - Minimum confidence: 70%

3. **COMPLIANCE_CHECKER**
   - Validates AdSense policy compliance
   - Checks word count (minimum 300 words)
   - Verifies headline-content matching
   - Detects forbidden phrases
   - Validates dynamic risk disclaimers
   - Calculates E-E-A-T score (minimum 75/100)
   - Checks originality score (minimum 70/100)
   - Minimum confidence: 70%

### Consensus Mechanism

- **Approval Threshold**: Requires 2/3 agent approval (at least 2 out of 3 agents must approve)
- **Consensus Score**: 0-3 (number of agents approving)
- **Overall Confidence**: Weighted average of all agent confidence scores
- **Critical Issues**: Any CRITICAL severity issues prevent publication

### Manual Review Triggers

Content is flagged for manual review if:
1. Consensus is exactly 2/3 (borderline case)
2. Any critical issues exist
3. Overall confidence is below 80%

## Usage

### Basic Validation

```typescript
import { validateArticle } from '@/lib/sia-news/multi-agent-validation'

const consensusResult = await validateArticle(
  article,
  verifiedData,
  causalChains
)

if (consensusResult.approved && !consensusResult.requiresManualReview) {
  // Publish article
  await publishArticle(article)
} else {
  // Queue for manual review
  await queueForManualReview(article, consensusResult)
}
```

### E-E-A-T Enhancement

```typescript
import { enhanceArticleWithEEATProtocols } from '@/lib/sia-news/multi-agent-validation'

const { enhancedArticle, eeATScore } = await enhanceArticleWithEEATProtocols(
  article,
  verifiedData,
  causalChains
)

console.log(`Enhanced E-E-A-T Score: ${eeATScore}/100`)
```

## Validation Criteria

### ACCURACY_VERIFIER Checks

✅ **Data Accuracy** (30 points)
- Numerical values match source data
- Timestamps are correct
- Entity references are valid

✅ **Entity Coverage** (10 points)
- All key entities from source are included

✅ **Causal Analysis** (20 points)
- At least one causal relationship established
- Relationships are supported by data

✅ **Timeliness** (5 points)
- Content generated within 24 hours of source event

### IMPACT_ASSESSOR Checks

✅ **Technical Depth** (25 points)
- Content has MEDIUM or HIGH technical depth
- Specific metrics and analysis included

✅ **Unique Value** (30 points)
- SIA_Insight section is comprehensive (≥100 chars)
- Contains proprietary analysis

✅ **Ownership Attribution** (15 points)
- Uses ownership language (SIA_SENTINEL, "our analysis", etc.)

✅ **Sentiment Analysis** (30 points)
- Sentiment score within valid range (-100 to +100)
- Causal chain confidence ≥60%

### COMPLIANCE_CHECKER Checks

✅ **Word Count** (40 points)
- Minimum 300 words required

✅ **Headline Matching** (20 points)
- Headline accurately represents content
- At least 50% of headline words appear in content

✅ **Forbidden Phrases** (35 points)
- No generic phrases: "according to reports", "sources say", "experts believe"

✅ **Dynamic Disclaimer** (15 points)
- Risk disclaimer is content-specific
- Includes confidence score

✅ **E-E-A-T Score** (30 points)
- Minimum 75/100 required
- Calculated across 4 dimensions (Experience, Expertise, Authoritativeness, Trustworthiness)

✅ **Originality Score** (20 points)
- Minimum 70/100 required

## E-E-A-T Scoring Algorithm

The system calculates E-E-A-T scores across 4 dimensions (25 points each):

### Experience (25 points)
- First-hand analysis language: "Our monitoring shows...", "We observed..."
- Proprietary system references: "SIA_SENTINEL detected..."
- Ongoing tracking indicators: "Over the past 72 hours..."

### Expertise (25 points)
- Technical glossary: 3+ terms (15 points)
- Specific metrics: 5+ data points (10 points)
- Correct technical terminology

### Authoritativeness (25 points)
- Source citations: 1+ sources (15 points)
- Confident professional language
- Unique insights: SIA_Insight ≥100 chars (10 points)

### Trustworthiness (25 points)
- Risk disclaimer: ≥50 chars (15 points)
- Uncertainty acknowledgment: confidence score mentioned (10 points)
- Clear "not financial advice" statement

**Target Score**: 75/100 minimum for publication

## AdSense Compliance

### Forbidden Phrases Detection

The system automatically detects and flags these phrases:
- "according to reports"
- "sources say"
- "experts believe"
- "it is rumored"
- "allegedly"
- "unconfirmed reports"
- "insider sources"
- "anonymous sources"

### Content Quality Standards

✅ **Minimum Length**: 300+ words
✅ **No Clickbait**: Title must match content 100%
✅ **Technical Depth**: Include specific metrics, percentages, data points
✅ **Dynamic Disclaimers**: Context-specific risk warnings
✅ **Professional Language**: Bloomberg/Reuters journalism standards

## Integration with E-E-A-T Protocols Orchestrator

The validation system integrates with the existing E-E-A-T Protocols Orchestrator to enhance content quality:

### Protocol Bonuses

- **Authority Manifesto**: +3-5 points (if score ≥60)
- **Quantum Expertise**: +3-5 points (if score ≥60)
- **Transparency Layer**: +2-5 points (if citation density ≥3/100 words)
- **Entity Mapping**: +2-5 points (if entity count ≥10)

### Enhancement Process

1. Convert article data to E-E-A-T protocol format
2. Generate reasoning chains from causal chains
3. Create inverse entity relationships
4. Run all 6 E-E-A-T protocols in parallel
5. Calculate enhanced E-E-A-T score with bonuses
6. Return enhanced article with updated score

## Validation Result Structure

```typescript
interface ConsensusResult {
  approved: boolean                    // 2/3 consensus reached
  consensusScore: number               // 0-3 (number of approvals)
  overallConfidence: number            // Weighted average confidence
  criticalIssues: ValidationIssue[]    // CRITICAL severity issues
  requiresManualReview: boolean        // Manual review flag
  validationResults: ValidationResult[] // Individual agent results
}

interface ValidationResult {
  agent: ValidationAgentName
  approved: boolean
  confidence: number                   // 0-100
  issues: ValidationIssue[]
  recommendations: string[]
  processingTime: number               // milliseconds
}

interface ValidationIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  description: string
  suggestedFix?: string
}
```

## Performance Considerations

- **Parallel Execution**: All 3 agents run simultaneously
- **Timeout**: Each agent has independent timeout handling
- **Caching**: E-E-A-T protocol results can be cached
- **Target Processing Time**: <3 seconds for validation

## Error Handling

The system gracefully handles errors:
- Individual agent failures don't block other agents
- E-E-A-T enhancement failures fall back to basic scoring
- All errors are logged with context
- Critical errors prevent publication

## Best Practices

1. **Always validate before publishing**: Never bypass validation
2. **Review manual review queue regularly**: Address borderline cases
3. **Monitor validation metrics**: Track approval rates and common issues
4. **Update forbidden phrases**: Keep AdSense compliance list current
5. **Calibrate thresholds**: Adjust confidence thresholds based on performance

## Monitoring & Metrics

Track these key metrics:
- **Approval Rate**: % of articles passing validation
- **Average Confidence**: Mean confidence across all agents
- **Manual Review Rate**: % of articles requiring manual review
- **E-E-A-T Score Distribution**: Histogram of scores
- **Common Issues**: Most frequent validation failures

## Future Enhancements

- [ ] Machine learning-based confidence calibration
- [ ] Dynamic threshold adjustment based on content type
- [ ] Multi-language forbidden phrase detection
- [ ] Real-time validation feedback during content generation
- [ ] A/B testing of validation criteria

## Support

For issues or questions:
- **Technical**: dev@siaintel.com
- **Editorial**: editorial@siaintel.com
- **Compliance**: compliance@siaintel.com

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
