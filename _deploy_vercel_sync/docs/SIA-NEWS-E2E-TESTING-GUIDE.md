# SIA News E2E Integration Testing Guide

## Overview

This document provides comprehensive guidance for running and interpreting the end-to-end integration tests for the SIA News Multilingual Generator system.

## Test Coverage

The E2E integration tests validate the complete pipeline from raw event ingestion to published article across all system components:

### 1. Complete Pipeline Test (Task 25.1)

Tests the full flow from WebSocket event to published article:

- ✅ Raw data ingestion and normalization
- ✅ Source verification and audit trail creation
- ✅ Causal relationship identification
- ✅ Entity mapping across 6 languages
- ✅ Contextual re-writing for regional adaptation
- ✅ Content generation with 3-layer structure
- ✅ Multi-agent validation (3 agents, 2/3 consensus)
- ✅ Autonomous publication with webhook notifications
- ✅ All 6 languages (EN, TR, DE, FR, ES, RU)

### 2. Performance Validation (Task 25.2)

Validates that the system meets performance budget requirements:

| Component | Target | Test |
|-----------|--------|------|
| Data Ingestion | < 2 seconds | ✅ Measured |
| Processing | < 8 seconds | ✅ Measured |
| Validation | < 3 seconds | ✅ Measured |
| Publishing | < 2 seconds | ✅ Measured |
| **Total Pipeline** | **< 15 seconds** | **✅ Measured** |

### 3. Quality Validation (Task 25.3)

Validates that generated content meets quality thresholds:

| Metric | Target | Test |
|--------|--------|------|
| E-E-A-T Score | ≥ 75/100 | ✅ All languages |
| Originality Score | ≥ 70/100 | ✅ All languages |
| AdSense Compliance | 100% | ✅ All languages |
| Technical Depth | Medium/High | ✅ Validated |
| Word Count | ≥ 300 words | ✅ Validated |
| Technical Glossary | ≥ 3 terms | ✅ Validated |

## Running the Tests

### Prerequisites

1. **Environment Setup**
   ```bash
   # Ensure all dependencies are installed
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Add required API keys (OPENAI_API_KEY, etc.)
   ```

2. **Database Setup**
   ```bash
   # Ensure database is running and migrations are applied
   npm run db:migrate
   ```

3. **Service Dependencies**
   - Gemini AI API access
   - Database connection
   - Webhook endpoints (optional for testing)

### Running Tests

#### Option 1: Run All E2E Tests

```bash
# Run complete E2E test suite
npm run test:sia-news:e2e

# Or directly with Jest
npx jest lib/sia-news/__tests__/e2e-integration.test.ts --verbose
```

#### Option 2: Run Specific Test Suites

```bash
# Run only pipeline tests
npx jest lib/sia-news/__tests__/e2e-integration.test.ts -t "Complete Pipeline Test"

# Run only performance tests
npx jest lib/sia-news/__tests__/e2e-integration.test.ts -t "Performance Validation"

# Run only quality tests
npx jest lib/sia-news/__tests__/e2e-integration.test.ts -t "Quality Validation"
```

#### Option 3: Run with Test Runner (Generates Report)

```bash
# Run with comprehensive reporting
npx tsx lib/sia-news/__tests__/run-e2e-tests.ts
```

This will:
- Execute all E2E tests
- Measure performance metrics
- Calculate quality metrics
- Generate a detailed markdown report in `docs/SIA-NEWS-E2E-TEST-REPORT.md`

### Test Timeouts

The E2E tests have extended timeouts due to the complexity of the pipeline:

- Individual tests: 20-30 seconds
- Full pipeline tests: 30-60 seconds
- Multi-language tests: 60-90 seconds

## Test Structure

### Test Data

The tests use a mock Bitcoin price surge event:

```typescript
{
  source: 'BINANCE',
  eventType: 'PRICE_CHANGE',
  asset: 'BTC',
  price: 67500,
  priceChange: 8.0,
  volume: 2300000000,
  time: 'Asian trading hours'
}
```

This event is processed through the entire pipeline to validate all components.

### Test Assertions

Each test validates specific aspects of the system:

#### Pipeline Tests
- ✅ Event normalization and validation
- ✅ Source verification and approval
- ✅ Causal chain structure and temporal ordering
- ✅ Entity identification (minimum 3 entities)
- ✅ Regional content adaptation
- ✅ Content generation for all 6 languages
- ✅ Multi-agent validation (3 agents)
- ✅ Publication success and webhook triggers

#### Performance Tests
- ✅ Component-level timing measurements
- ✅ Total pipeline time < 15 seconds
- ✅ Individual component budgets met

#### Quality Tests
- ✅ E-E-A-T score ≥ 75 for all languages
- ✅ Originality score ≥ 70 for all languages
- ✅ AdSense compliance (word count, no forbidden phrases, dynamic disclaimers)
- ✅ Technical depth scoring (HIGH/MEDIUM)
- ✅ Technical glossary completeness (3+ terms)
- ✅ SIA insight with specific metrics

## Interpreting Results

### Success Criteria

All tests must pass for the system to be considered production-ready:

1. **Functional Tests**: 100% pass rate
2. **Performance Tests**: All components within budget
3. **Quality Tests**: All metrics meet or exceed thresholds

### Example Output

```
📊 SIA NEWS E2E INTEGRATION TEST REPORT
================================================================================

Timestamp: 2024-03-01T10:30:00.000Z
Duration: 45.23s

Test Results:
  ✅ Passed: 18
  ❌ Failed: 0
  ⏭️  Skipped: 0
  📝 Total: 18

⚡ Performance Metrics:
  Data Ingestion: 1450ms (target: <2000ms)
  Processing: 6200ms (target: <8000ms)
  Validation: 2100ms (target: <3000ms)
  Publishing: 1300ms (target: <2000ms)
  Total Pipeline: 11050ms (target: <15000ms)

✨ Quality Metrics:
  Average E-E-A-T Score: 82.50/100 (target: ≥75)
  Average Originality: 78.33/100 (target: ≥70)
  AdSense Compliance: 100% (target: 100%)
  Languages Covered: 6/6

🎯 Performance Budget Validation:
  ✅ Data Ingestion: 1450ms / 2000ms (72.5%)
  ✅ Processing: 6200ms / 8000ms (77.5%)
  ✅ Validation: 2100ms / 3000ms (70.0%)
  ✅ Publishing: 1300ms / 2000ms (65.0%)
  ✅ Total Pipeline: 11050ms / 15000ms (73.7%)

🎯 Quality Threshold Validation:
  ✅ E-E-A-T Score: 82.5 / 75 (110.0%)
  ✅ Originality Score: 78.33 / 70 (111.9%)
  ✅ AdSense Compliance: 100 / 100 (100.0%)
  ✅ Language Coverage: 6 / 6 (100.0%)

================================================================================
🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION
================================================================================
```

### Failure Analysis

If tests fail, the report will show:

1. **Failed Test Details**
   - Test name and suite
   - Error message
   - Stack trace (in verbose mode)

2. **Performance Issues**
   - Which components exceeded budget
   - By how much (percentage over target)

3. **Quality Issues**
   - Which metrics fell below threshold
   - Specific language or component affected

## Troubleshooting

### Common Issues

#### 1. Timeout Errors

**Symptom**: Tests fail with "Exceeded timeout of X ms"

**Solutions**:
- Increase Jest timeout in test file
- Check network connectivity to external APIs
- Verify database performance
- Check Gemini AI API response times

#### 2. API Rate Limiting

**Symptom**: Tests fail with "Rate limit exceeded"

**Solutions**:
- Add delays between test runs
- Use test API keys with higher limits
- Mock external API calls for faster testing

#### 3. Quality Metric Failures

**Symptom**: E-E-A-T or Originality scores below threshold

**Solutions**:
- Review content generation prompts
- Check Gemini AI configuration (temperature, topP)
- Verify AdSense-compliant-writer integration
- Review E-E-A-T protocols integration

#### 4. Performance Budget Exceeded

**Symptom**: Pipeline takes > 15 seconds

**Solutions**:
- Profile individual components
- Optimize database queries
- Check network latency to external services
- Consider caching strategies
- Review parallel processing opportunities

### Debug Mode

Run tests with additional logging:

```bash
# Enable debug logging
DEBUG=sia-news:* npx jest lib/sia-news/__tests__/e2e-integration.test.ts --verbose

# Run single test for debugging
npx jest lib/sia-news/__tests__/e2e-integration.test.ts -t "should process full pipeline" --verbose
```

## Continuous Integration

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/sia-news-e2e.yml
name: SIA News E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run E2E tests
        run: npm run test:sia-news:e2e
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-report
          path: docs/SIA-NEWS-E2E-TEST-REPORT.md
```

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All E2E tests pass
- [ ] Performance budget met (< 15 seconds)
- [ ] Quality thresholds met (E-E-A-T ≥ 75, Originality ≥ 70)
- [ ] All 6 languages generate correctly
- [ ] Multi-agent validation working (2/3 consensus)
- [ ] Webhook notifications functional
- [ ] Database indexes optimized
- [ ] Monitoring and logging operational

## Maintenance

### Updating Tests

When adding new features:

1. Add test cases to `e2e-integration.test.ts`
2. Update performance budgets if needed
3. Update quality thresholds if needed
4. Run full test suite to ensure no regressions
5. Update this documentation

### Test Data Management

- Mock data is defined in test files
- Update mock data to reflect real-world scenarios
- Add edge cases as they are discovered
- Keep test data synchronized with production patterns

## Support

For issues or questions:

1. Check this documentation
2. Review test output and error messages
3. Check system logs in `lib/sia-news/monitoring.ts`
4. Review component-specific documentation
5. Contact the development team

---

**Last Updated**: March 1, 2024  
**Version**: 1.0.0  
**Status**: Active
