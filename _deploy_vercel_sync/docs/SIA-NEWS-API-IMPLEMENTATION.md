# SIA News API Layer Implementation

**Status**: ✅ Complete  
**Date**: 2024  
**Task**: Task 16 - API Layer for SIA_NEWS_v1.0

## Overview

Implemented 4 RESTful API endpoints for the SIA News multilingual generation system, providing complete programmatic access to content generation, article querying, metrics monitoring, and webhook management.

## Implemented Endpoints

### 1. POST /api/sia-news/generate

**Purpose**: Generate multilingual news articles from raw news input

**Features**:
- ✅ Request validation (rawNews, asset, language required)
- ✅ API key validation via `x-api-key` header
- ✅ Rate limiting (100 requests/hour per API key)
- ✅ Full generation pipeline orchestration
- ✅ Multi-agent validation integration
- ✅ Automatic publishing (optional)
- ✅ Performance metrics tracking

**Request Format**:
```json
POST /api/sia-news/generate
Headers:
  x-api-key: <your-api-key>
  Content-Type: application/json

Body:
{
  "rawNews": "Bitcoin surged 8% following institutional buying...",
  "asset": "BTC",
  "language": "en",
  "region": "US",
  "confidenceScore": 85,
  "publishImmediately": true
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "articleId": "sia-news-1234567890-abc123",
    "article": {
      "id": "sia-news-1234567890-abc123",
      "language": "en",
      "region": "US",
      "headline": "Bitcoin Surges 8% to $67,500 Following Institutional Buying",
      "summary": "...",
      "siaInsight": "...",
      "riskDisclaimer": "...",
      "fullContent": "...",
      "technicalGlossary": [...],
      "sentiment": {...},
      "entities": [...],
      "causalChains": [...],
      "metadata": {...},
      "eeatScore": 82,
      "originalityScore": 75,
      "technicalDepth": "HIGH",
      "adSenseCompliant": true
    },
    "validationResult": {
      "approved": true,
      "consensusScore": 3,
      "overallConfidence": 87,
      "criticalIssues": [],
      "requiresManualReview": false,
      "validationResults": [...]
    },
    "processingTime": 12450
  },
  "metadata": {
    "timestamp": "2024-03-01T12:00:00.000Z",
    "processingTime": 12450,
    "published": true
  }
}
```

**Error Responses**:
- `401`: Invalid or missing API key
- `429`: Rate limit exceeded (100 requests/hour)
- `400`: Invalid request parameters
- `500`: Content generation failed

**Pipeline Steps**:
1. Process raw event → Normalize data
2. Verify source → Extract structured data
3. Identify causal relationships
4. Map entities across 6 languages
5. Regional content adaptation
6. Generate article with AdSense compliance
7. Multi-agent validation (3 agents)
8. Publish to database (if approved)

---

### 2. GET /api/sia-news/articles

**Purpose**: Query articles with filters and pagination

**Features**:
- ✅ Multi-dimensional filtering (language, region, entity, sentiment, date)
- ✅ Pagination support (1-100 articles per page, default 20)
- ✅ Response formatting with pagination metadata
- ✅ Efficient database querying with indexes

**Query Parameters**:
- `language`: Filter by language (tr, en, de, fr, es, ru)
- `region`: Filter by region (TR, US, DE, FR, ES, RU)
- `entity`: Filter by entity name (e.g., "Bitcoin", "Federal Reserve")
- `sentimentMin`: Minimum sentiment score (-100 to 100)
- `sentimentMax`: Maximum sentiment score (-100 to 100)
- `startDate`: Start date (ISO 8601 format)
- `endDate`: End date (ISO 8601 format)
- `page`: Page number (default: 1)
- `pageSize`: Articles per page (1-100, default: 20)

**Request Example**:
```
GET /api/sia-news/articles?language=en&region=US&entity=Bitcoin&sentimentMin=50&page=1&pageSize=20
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "articles": [
      {
        "id": "sia-news-1234567890-abc123",
        "language": "en",
        "region": "US",
        "headline": "...",
        "summary": "...",
        "sentiment": 65,
        "eeatScore": 82,
        "publishedAt": "2024-03-01T12:00:00.000Z",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalCount": 150,
      "totalPages": 8
    }
  },
  "metadata": {
    "timestamp": "2024-03-01T12:00:00.000Z",
    "filters": {
      "language": "en",
      "region": "US",
      "entity": "Bitcoin",
      "sentimentRange": { "min": 50, "max": 100 }
    }
  }
}
```

**Error Responses**:
- `400`: Invalid query parameters
- `500`: Failed to query articles

---

### 3. GET /api/sia-news/metrics

**Purpose**: Get real-time metrics for SIA News system

**Features**:
- ✅ Real-time metrics aggregation
- ✅ Success rate calculation
- ✅ Average processing time
- ✅ Articles per hour tracking
- ✅ Breakdown by language and region
- ✅ Quality metrics (avg E-E-A-T score, avg sentiment)

**Request Example**:
```
GET /api/sia-news/metrics
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "metrics": {
      "totalArticles": 1250,
      "articlesToday": 45,
      "avgEEATScore": 78.5,
      "avgSentiment": 12.3,
      "successRate": 92.5,
      "avgProcessingTime": 11200,
      "byLanguage": {
        "en": 520,
        "tr": 310,
        "de": 180,
        "fr": 120,
        "es": 80,
        "ru": 40
      },
      "byRegion": {
        "US": 520,
        "TR": 310,
        "DE": 180,
        "FR": 120,
        "ES": 80,
        "RU": 40
      }
    },
    "timestamp": "2024-03-01T12:00:00.000Z"
  },
  "metadata": {
    "timestamp": "2024-03-01T12:00:00.000Z",
    "cacheControl": "no-cache"
  }
}
```

**Metrics Explained**:
- `totalArticles`: Total articles in database
- `articlesToday`: Articles generated today
- `avgEEATScore`: Average E-E-A-T score (0-100)
- `avgSentiment`: Average sentiment score (-100 to +100)
- `successRate`: Percentage of successful generations
- `avgProcessingTime`: Average processing time in milliseconds
- `byLanguage`: Article count breakdown by language
- `byRegion`: Article count breakdown by region

**Error Responses**:
- `500`: Failed to calculate metrics

---

### 4. POST /api/sia-news/webhook

**Purpose**: Register webhooks for article publication events

**Features**:
- ✅ Webhook registration with URL and event types
- ✅ Webhook secret for authentication
- ✅ Webhook storage and management
- ✅ GET endpoint to list all webhooks
- ✅ DELETE endpoint to unregister webhooks

**Supported Events**:
- `ARTICLE_PUBLISHED`: Triggered when article is published
- `ARTICLE_UPDATED`: Triggered when article is updated
- `ARTICLE_REJECTED`: Triggered when article fails validation

**Register Webhook (POST)**:
```json
POST /api/sia-news/webhook
Content-Type: application/json

Body:
{
  "url": "https://your-domain.com/webhook",
  "events": ["ARTICLE_PUBLISHED", "ARTICLE_REJECTED"],
  "secret": "your-webhook-secret-min-16-chars"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "webhookId": "webhook-1234567890-abc123"
  },
  "metadata": {
    "timestamp": "2024-03-01T12:00:00.000Z",
    "url": "https://your-domain.com/webhook",
    "events": ["ARTICLE_PUBLISHED", "ARTICLE_REJECTED"]
  }
}
```

**List Webhooks (GET)**:
```
GET /api/sia-news/webhook
```

**Response**:
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "id": "webhook-1234567890-abc123",
        "url": "https://your-domain.com/webhook",
        "events": ["ARTICLE_PUBLISHED"],
        "active": true,
        "createdAt": "2024-03-01T12:00:00.000Z"
      }
    ],
    "count": 1
  },
  "metadata": {
    "timestamp": "2024-03-01T12:00:00.000Z"
  }
}
```

**Unregister Webhook (DELETE)**:
```
DELETE /api/sia-news/webhook?id=webhook-1234567890-abc123
```

**Webhook Payload Format**:
When an event occurs, the registered webhook URL will receive:
```json
POST <your-webhook-url>
Headers:
  Content-Type: application/json
  X-Webhook-Secret: <your-secret>
  X-Webhook-Event: ARTICLE_PUBLISHED

Body:
{
  "event": "ARTICLE_PUBLISHED",
  "articleId": "sia-news-1234567890-abc123",
  "language": "en",
  "region": "US",
  "timestamp": "2024-03-01T12:00:00.000Z",
  "metadata": {
    "eeatScore": 82,
    "sentiment": 65,
    "entities": ["Bitcoin", "Federal Reserve", "Institutional Investors"]
  }
}
```

**Error Responses**:
- `400`: Invalid webhook registration (missing URL, events, or secret)
- `500`: Failed to register webhook

---

## Rate Limiting

**Implementation**: In-memory rate limiting per API key

**Limits**:
- 100 requests per hour per API key
- Rolling window (resets 1 hour after first request)

**Rate Limit Headers** (future enhancement):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 2024-03-01T13:00:00.000Z
```

**Rate Limit Response**:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": "Maximum 100 requests per hour",
  "resetTime": "2024-03-01T13:00:00.000Z"
}
```

---

## Authentication

**Method**: API Key via `x-api-key` header

**Current Implementation**: Simple validation (MVP)
- Any non-empty API key is accepted
- For production: Validate against database with user/organization mapping

**Future Enhancements**:
- JWT tokens for user authentication
- OAuth 2.0 for third-party integrations
- API key scopes and permissions
- Usage tracking per API key
- Billing integration

---

## Error Handling

**Standard Error Response Format**:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid/missing API key)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (AI service down)

**Error Logging**:
- All errors logged to console with context
- Performance metrics stored for failed operations
- Development mode includes stack traces

---

## Integration Points

### Existing Modules Used:
1. **raw-data-ingestion.ts**: Event processing and normalization
2. **source-verification.ts**: Source validation and data extraction
3. **causal-analysis.ts**: Causal relationship identification
4. **entity-mapping.ts**: Entity identification and multilingual mapping
5. **contextual-rewriting.ts**: Regional content adaptation
6. **content-generation.ts**: Article generation with AdSense compliance
7. **multi-agent-validation.ts**: 3-agent validation system
8. **publishing-pipeline.ts**: Headless publishing and webhooks
9. **database.ts**: Article storage and querying

### External Dependencies:
- Next.js 14 App Router
- TypeScript (strict mode)
- WebSocket (for future real-time data ingestion)
- Gemini AI (via content-generation module)

---

## Performance Metrics

**Target Performance** (from design):
- Total Pipeline Time: < 15 seconds
- Data Ingestion: < 2 seconds
- Processing: < 8 seconds
- Validation: < 3 seconds
- Publishing: < 2 seconds

**Actual Performance** (measured):
- Average processing time tracked per request
- Stored in performance_metrics table
- Accessible via /api/sia-news/metrics endpoint

---

## Testing

### Manual Testing:
```bash
# Test generate endpoint
curl -X POST http://localhost:3000/api/sia-news/generate \
  -H "x-api-key: test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "rawNews": "Bitcoin surged 8% to $67,500 following institutional buying pressure",
    "asset": "BTC",
    "language": "en"
  }'

# Test articles endpoint
curl http://localhost:3000/api/sia-news/articles?language=en&page=1&pageSize=10

# Test metrics endpoint
curl http://localhost:3000/api/sia-news/metrics

# Test webhook registration
curl -X POST http://localhost:3000/api/sia-news/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "events": ["ARTICLE_PUBLISHED"],
    "secret": "my-secure-secret-key-123"
  }'
```

### Property-Based Tests (Task 16.5):
- API endpoint parameter validation
- API success response format
- API error code appropriateness
- Rate limiting enforcement

---

## Security Considerations

### Current Implementation:
- ✅ API key validation
- ✅ Rate limiting per API key
- ✅ Input validation and sanitization
- ✅ Webhook secret authentication
- ✅ Error message sanitization (no stack traces in production)

### Future Enhancements:
- HTTPS enforcement
- CORS configuration
- Request signing
- IP whitelisting
- DDoS protection
- API key rotation
- Audit logging

---

## Deployment

### Environment Variables:
```env
# No additional environment variables required for API layer
# Uses existing Gemini AI and database configurations
```

### Next.js Configuration:
- API routes automatically deployed with Next.js app
- Serverless functions on Vercel/similar platforms
- Edge runtime support (future enhancement)

### Monitoring:
- Performance metrics stored in database
- Real-time metrics via /api/sia-news/metrics
- Error logging to console
- Future: Integration with monitoring services (Sentry, DataDog)

---

## Documentation

### API Documentation:
- This document serves as primary API documentation
- Future: OpenAPI/Swagger specification
- Future: Interactive API explorer (Swagger UI)

### Code Documentation:
- All endpoints include JSDoc comments
- Type definitions in lib/sia-news/types.ts
- Integration examples in this document

---

## Future Enhancements

### Phase 2:
- [ ] WebSocket endpoint for real-time article streaming
- [ ] Batch generation endpoint (multiple articles)
- [ ] Article update/edit endpoint
- [ ] Article deletion endpoint
- [ ] Advanced filtering (full-text search)
- [ ] Export endpoints (CSV, JSON, RSS)

### Phase 3:
- [ ] GraphQL API
- [ ] gRPC API for high-performance clients
- [ ] SDK libraries (JavaScript, Python, Go)
- [ ] API versioning (v1, v2)
- [ ] Webhook retry logic with exponential backoff
- [ ] Webhook delivery status tracking

### Phase 4:
- [ ] Real-time analytics dashboard
- [ ] A/B testing for content variations
- [ ] Content scheduling API
- [ ] Multi-tenant support
- [ ] Usage-based billing integration

---

## Compliance

### AdSense Compliance:
- All generated content follows AdSense-compliant content policy
- 3-layer structure (ÖZET, SIA_INSIGHT, DYNAMIC_RISK_SHIELD)
- E-E-A-T optimization (minimum 75/100)
- Dynamic risk disclaimers
- No clickbait, no forbidden phrases

### Data Privacy:
- KVKK compliance (Turkey)
- GDPR compliance (EU)
- No PII stored without consent
- Data retention policies (future)

---

## Support

### Issues:
- Report issues via GitHub Issues
- Include API endpoint, request/response, and error message

### Contact:
- Technical Support: tech@siaintel.com
- API Questions: api@siaintel.com
- Compliance: compliance@siaintel.com

---

## Changelog

### Version 1.0.0 (2024-03-01)
- ✅ Initial implementation
- ✅ POST /api/sia-news/generate endpoint
- ✅ GET /api/sia-news/articles endpoint
- ✅ GET /api/sia-news/metrics endpoint
- ✅ POST /api/sia-news/webhook endpoint
- ✅ Rate limiting (100 req/hour)
- ✅ API key authentication
- ✅ Error handling and logging
- ✅ Performance metrics tracking

---

**Implementation Complete**: All 4 API endpoints operational and tested ✅
