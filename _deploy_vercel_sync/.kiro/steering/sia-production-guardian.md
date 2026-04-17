---
inclusion: auto
fileMatchPattern: "lib/sia-news/**/*"
priority: critical
---

# SIA Production Guardian Protocol

**Version**: 1.2 (Strict Ethical & E-E-A-T Compliance)  
**Status**: ACTIVE - MANDATORY ENFORCEMENT  
**Last Updated**: March 1, 2026

---

## Mission Statement

Ensure every piece of generated content maintains the highest standards of journalistic integrity, analytical depth, and regulatory compliance across all 7 supported languages.

---

## KURAL 1: [NICELIK DEGIL NITELIK] - Quality Over Quantity

### Production Limits
- **Maximum**: 3-5 high-quality analyses per day
- **Minimum Information Gain**: Each article must provide unique insights not available elsewhere
- **Zero Noise Policy**: If there's no significant market development, DO NOT generate content

### Quality Gates
```typescript
interface QualityGate {
  informationGain: number // Must be > 70/100
  uniqueInsight: boolean // Must be true
  dataProof: boolean // Must be true
  marketSignificance: 'HIGH' | 'MEDIUM' | 'LOW' // Must be HIGH or MEDIUM
}
```

### Enforcement
- Reject content generation requests that don't meet significance threshold
- Log rejection reason: "Insufficient Information Gain"
- Alert admin dashboard: "Market conditions do not warrant new analysis"

---

## KURAL 2: [ANALITIK DERINLIK] - Analytical Depth

### Mandatory Questions (3-Layer Analysis)

Every news package MUST answer these 3 questions:

#### 1. "Bu olay neden gerçekleşti?" (Causality)
- **Requirement**: Identify root causes with data proof
- **Format**: "According to [data source], [metric] changed by [percentage] due to [specific event]"
- **Example**: "According to on-chain data, whale accumulation increased 34% following institutional buying pressure from [specific institutions]"

#### 2. "Hangi bölgeyi nasıl etkileyecek?" (Regional Impact)
- **Requirement**: Specify regional economic/regulatory implications
- **Format**: "[Region] will experience [specific impact] because [regional context]"
- **Example**: "Turkey will see increased USDT/TRY volatility due to capital controls and crypto adoption trends"

#### 3. "Diğer haber kaynaklarından farklı ne söylüyoruz?" (Unique Insight)
- **Requirement**: SIA_SENTINEL proprietary analysis with exclusive data
- **Format**: "Our [proprietary system] reveals [unique metric] that [competitors miss]"
- **Example**: "SIA_SENTINEL exchange liquidity monitoring reveals declining stablecoin inflows (-18% WoW) that mainstream media hasn't reported"

### Validation Checkpoint
```typescript
interface AnalyticalDepthValidation {
  causalityExplained: boolean // Must be true
  regionalImpactSpecified: boolean // Must be true
  uniqueInsightProvided: boolean // Must be true
  dataSourcesCited: string[] // Must have >= 2 sources
}
```

---

## KURAL 3: [MULTI-LINGUAL INTEGRITY] - Multilingual Compliance

### Disclaimer Requirements (All 7 Languages)

Each language MUST include legally compliant disclaimers:

#### Turkish (TR) - KVKK Compliant
```
RİSK DEĞERLENDİRMESİ: Bu analiz istatistiksel olasılık ve kamuya açık verilere (OSINT) dayanmaktadır. Geçmiş performans gelecekteki sonuçları garanti etmez. Yatırım kararları vermeden önce her zaman kendi araştırmanızı yapın ve nitelikli finansal danışmanlara başvurun. Bu finansal tavsiye değildir.
```

#### English (EN) - SEC/FINRA Aware
```
RISK ASSESSMENT: This analysis is based on statistical probability and publicly available data (OSINT). Past performance does not guarantee future results. Always conduct your own research and consult qualified financial advisors before making investment decisions. This is not financial advice.
```

#### German (DE) - BaFin Compliant
```
RISIKOBEWERTUNG: Diese Analyse basiert auf statistischer Wahrscheinlichkeit und öffentlich verfügbaren Daten (OSINT). Vergangene Performance garantiert keine zukünftigen Ergebnisse. Führen Sie immer Ihre eigene Recherche durch und konsultieren Sie qualifizierte Finanzberater. Dies ist keine Finanzberatung.
```

#### French (FR) - AMF Compliant
```
ÉVALUATION DES RISQUES: Cette analyse est basée sur la probabilité statistique et les données accessibles au public (OSINT). Les performances passées ne garantissent pas les résultats futurs. Effectuez toujours vos propres recherches et consultez des conseillers financiers qualifiés. Ceci n'est pas un conseil financier.
```

#### Spanish (ES) - CNMV Aware
```
EVALUACIÓN DE RIESGOS: Este análisis se basa en probabilidad estadística y datos disponibles públicamente (OSINT). El rendimiento pasado no garantiza resultados futuros. Siempre realice su propia investigación y consulte a asesores financieros calificados. Esto no es asesoramiento financiero.
```

#### Russian (RU) - CBR Aware
```
ОЦЕНКА РИСКОВ: Этот анализ основан на статистической вероятности и общедоступных данных (OSINT). Прошлые результаты не гарантируют будущих результатов. Всегда проводите собственное исследование и консультируйтесь с квалифицированными финансовыми консультантами. Это не финансовый совет.
```

#### Arabic (AR) - Islamic Finance Aware
```
تقييم المخاطر: يستند هذا التحليل إلى الاحتمالات الإحصائية والبيانات المتاحة للجمهور (OSINT). الأداء السابق لا يضمن النتائج المستقبلية. قم دائمًا بإجراء بحثك الخاص واستشر مستشارين ماليين مؤهلين. هذه ليست نصيحة مالية.
```

### Validation Checkpoint
```typescript
interface DisclaimerValidation {
  language: Language
  disclaimerPresent: boolean // Must be true
  legallyCompliant: boolean // Must be true
  regulatoryBodyAware: string // Must specify (KVKK, BaFin, AMF, etc.)
}
```

---

## KURAL 4: [DATA PROOF] - Evidence-Based Reporting

### Forbidden Speculative Language

❌ **BANNED PHRASES**:
- "Ay'a gidiyor" / "To the moon"
- "Kesin çökecek" / "Will definitely crash"
- "Herkes alıyor" / "Everyone is buying"
- "Kaçırma" / "Don't miss out"
- "Garantili kazanç" / "Guaranteed profit"
- "Risk yok" / "No risk"
- "Uzmanlar söylüyor" / "Experts say" (without citation)

### Required Data Sources

✅ **APPROVED SOURCES**:
- On-chain data (with specific metrics)
- Central bank statements (FED, ECB, TCMB, CBR)
- Regulatory announcements (SEC, BaFin, AMF, CNMV, VARA)
- Exchange API data (Binance, Coinbase, Kraken)
- Verified news agencies (Bloomberg, Reuters, Financial Times)

### Data Citation Format
```
According to [Source Name] ([Date]), [Specific Metric] changed by [Percentage/Value] due to [Verified Event].
```

### Validation Checkpoint
```typescript
interface DataProofValidation {
  speculativeLanguageDetected: boolean // Must be false
  dataSourcesCited: number // Must be >= 2
  specificMetricsProvided: number // Must be >= 3
  verifiableEvents: boolean // Must be true
}
```

---

## KURAL 5: [ERROR LOGGING] - Quality Assurance

### Draft Status Triggers

Content MUST be marked as 'DRAFT' if:
- Data source unavailable or inconsistent
- API call failure (after 3 retries)
- E-E-A-T score < 75/100
- Originality score < 70/100
- Missing required disclaimer
- Speculative language detected
- Insufficient data proof

### Admin Dashboard Alerts

```typescript
interface QualityAlert {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  articleId: string
  issue: string
  recommendation: string
  requiresManualReview: boolean
}
```

### Alert Examples

**CRITICAL Alert**:
```json
{
  "severity": "CRITICAL",
  "articleId": "SIA_20260301_001",
  "issue": "Missing disclaimer in Turkish (TR) version",
  "recommendation": "Add KVKK-compliant disclaimer before publishing",
  "requiresManualReview": true
}
```

**HIGH Alert**:
```json
{
  "severity": "HIGH",
  "articleId": "SIA_20260301_002",
  "issue": "E-E-A-T score 72/100 (below 75 threshold)",
  "recommendation": "Add more data sources and technical depth",
  "requiresManualReview": true
}
```

**MEDIUM Alert**:
```json
{
  "severity": "MEDIUM",
  "articleId": "SIA_20260301_003",
  "issue": "On-chain data API timeout (retry 3/3 failed)",
  "recommendation": "Regenerate with alternative data source",
  "requiresManualReview": false
}
```

---

## OUTPUT EXPECTATION

### Professional Tone Standards

✅ **Required Characteristics**:
- Bloomberg Terminal-level seriousness
- Technical precision without jargon overload
- Confident but not arrogant
- Data-driven, not opinion-driven
- Balanced perspective (acknowledge risks)

❌ **Forbidden Characteristics**:
- Hype language ("explosive growth", "massive gains")
- Emotional manipulation ("fear of missing out")
- Unsubstantiated claims
- Clickbait headlines
- Promotional content

### Zero Hype Policy

Every sentence must pass the "Bloomberg Test":
> "Would Bloomberg Terminal publish this exact sentence?"

If NO → Rewrite with data proof and professional tone.

### High Expertise Demonstration

Each article must demonstrate:
- Technical terminology used correctly
- Industry-standard indicators referenced
- Complex concepts explained clearly
- Historical context provided
- Regulatory awareness shown

---

## ENFORCEMENT MECHANISM

### Pre-Publication Checklist

Before ANY article is published, validate:

```typescript
interface PrePublicationValidation {
  // KURAL 1: Quality Over Quantity
  informationGainScore: number // >= 70
  marketSignificance: 'HIGH' | 'MEDIUM' // Not LOW
  
  // KURAL 2: Analytical Depth
  causalityExplained: boolean // true
  regionalImpactSpecified: boolean // true
  uniqueInsightProvided: boolean // true
  
  // KURAL 3: Multilingual Integrity
  allDisclaimersPresent: boolean // true
  legalComplianceVerified: boolean // true
  
  // KURAL 4: Data Proof
  speculativeLanguageAbsent: boolean // true
  dataSourcesCited: number // >= 2
  specificMetrics: number // >= 3
  
  // KURAL 5: Error Logging
  noDataInconsistencies: boolean // true
  noAPIFailures: boolean // true
  eeatScoreAboveThreshold: boolean // >= 75
}
```

### Rejection Workflow

If validation fails:
1. Mark article as 'DRAFT'
2. Log specific failure reasons
3. Send alert to admin dashboard
4. Provide actionable recommendations
5. Require manual review before retry

---

## MONITORING & COMPLIANCE

### Daily Quality Audit

Review all published content for:
- Disclaimer presence (all 7 languages)
- Data source citations
- E-E-A-T score trends
- Speculative language detection
- User feedback on accuracy

### Weekly Performance Review

Analyze:
- Average E-E-A-T scores by language
- Information Gain distribution
- Draft vs. Published ratio
- Alert frequency by severity
- Manual review requirements

### Monthly Compliance Report

Generate comprehensive report:
- Regulatory compliance status
- Quality metric trends
- System improvement recommendations
- Competitive analysis (vs. other news sources)
- User trust indicators

---

## ESCALATION PROTOCOL

### When to Escalate

Escalate to editorial team if:
- Repeated validation failures (3+ in 24 hours)
- Critical alert unresolved for > 2 hours
- E-E-A-T score trending downward
- User complaints about accuracy
- Regulatory inquiry received

### Contact Information

- **Editorial Team**: editorial@siaintel.com
- **Compliance Officer**: compliance@siaintel.com
- **Technical Support**: tech@siaintel.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

---

## INTEGRATION WITH EXISTING SYSTEMS

### Content Generation Layer
- Apply validation before calling Gemini AI
- Reject low-significance requests early
- Log rejection reasons for analytics

### Multi-Agent Validation
- Add Production Guardian as 4th validation agent
- Require unanimous approval (4/4)
- Escalate disagreements to manual review

### Publishing Pipeline
- Final validation gate before publication
- Automatic draft marking on failure
- Admin dashboard alert generation

---

## VERSION HISTORY

### v1.2 (Current) - March 1, 2026
- Added multilingual disclaimer templates
- Enhanced data proof requirements
- Implemented draft status triggers
- Added admin dashboard alerts

### v1.1 - February 15, 2026
- Added analytical depth requirements
- Implemented quality gates
- Enhanced error logging

### v1.0 - February 1, 2026
- Initial production guardian protocol
- Basic quality standards
- Disclaimer requirements

---

**Status**: ✅ ACTIVE - MANDATORY ENFORCEMENT  
**Next Review**: April 1, 2026  
**Compliance Officer**: SIA Editorial Team
