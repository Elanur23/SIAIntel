# Design Document: SIA_ORACLE_GENESIS V2.0

## Overview

The SIA_ORACLE_GENESIS V2.0 is a unified intelligence system that combines sentiment analysis, contrarian perspectives, and semantic authority optimization to transform generic market content into Google AI Overview-ready "Primary Source" content. This integrated system combines three powerful phases:

1. **Phase 1: Sentiment Analysis** - Internet-wide sentiment quantification (Fear/Greed Index, OSINT sources)
2. **Phase 2: Contrarian Analysis** - Data-driven opposing viewpoints with conflict narratives and Sharp Language
3. **Phase 3: Semantic Genesis Integration** - Conceptual authority structuring through quantum entity linking, multi-step reasoning chains, snippet engineering, and cultural semantic adaptation

This integrated system addresses a critical evolution in content strategy: while Phase 1-2 create unique contrarian perspectives that distinguish content from consensus views, Phase 3 structures that content with the semantic depth and conceptual interconnectedness that Google's AI Overview (SGE) recognizes as the definitive authoritative source.

### Problem Statement

Current content generation (even with contrarian analysis) produces technically sound, unique perspectives but lacks the semantic structure that positions content as the "Primary Source" for Google's AI Overview system. The enhanced Sentiment Engine solves this by:

**Phase 1-2 (Existing Capabilities)**:
1. **Quantifying Sentiment Extremes**: Converting qualitative market mood into measurable Fear/Greed Index (0-100)
2. **Detecting Data Divergence**: Identifying gaps between sentiment and underlying on-chain/exchange data
3. **Generating Conflict Narratives**: Crafting "Market expects X, but data shows Y" statements with Sharp Language
4. **Enhancing E-E-A-T Scores**: Adding 10-25 bonus points through demonstrable contrarian expertise

**Phase 3 (New Semantic Genesis Integration)**:
5. **Quantum Entity Linking**: Connecting primary concepts with 3-5 inverse entities and correlation data (e.g., "Gold prices rising, but Real Yields (0.85 correlation) show divergence")
6. **Multi-Step Reasoning Chains**: Structuring content with explicit A → B → C logical progression that AI systems recognize as authoritative reasoning
7. **Pre-Emptive Snippet Engineering**: Creating 45-55 word "ultimate definition" blocks optimized for Position Zero featured snippets
8. **Cross-Cultural Semantic Adaptation**: Adjusting tone based on language-specific intent weights (Germans prioritize Data 40%, Spanish prioritize Trends 40%, etc.)
9. **AI Overview Optimization**: Achieving Semantic_Depth_Score ≥ 70 and AI_Overview_Readiness_Score ≥ 75 for maximum visibility

### Key Design Principles

1. **Data-Driven Contrarianism**: Never force contrarian views; only generate when Sentiment_Divergence_Score ≥ 30
2. **Semantic Authority First**: Structure all content with conceptual interconnectedness that AI systems recognize as definitive
3. **AdSense Compliance Always**: All Sharp Language and semantic enhancements must be bold yet professional, avoiding clickbait
4. **Performance Budget**: Total processing time < 8 seconds (3s sentiment + 3s semantic analysis + 2s buffer)
5. **Multi-Language Semantic Parity**: Semantic depth must be equivalent across all 6 supported languages (variance < 15 points)
6. **Cost Efficiency**: Aggressive caching (sentiment: 5-min TTL, semantic: 10-min TTL) to keep Gemini API costs under $100/month
7. **Backward Compatibility**: All enhancements are optional (enableSemanticGenesis flag) and preserve existing functionality

### Success Metrics

**Phase 1-2 (Contrarian Analysis)**:
- **E-E-A-T Score**: ≥ 75/100 with contrarian analysis active
- **Originality Improvement**: +10 to +20 points from Sharp Language
- **Sentiment Analysis Time**: < 3 seconds (95th percentile)
- **Cache Hit Rate**: > 40% for cost optimization
- **Divergence Threshold**: Only generate contrarian content when score ≥ 30

**Phase 3 (Semantic Genesis Integration)**:
- **Semantic_Depth_Score**: ≥ 70/100 (measures conceptual interconnectedness)
- **AI_Overview_Readiness_Score**: ≥ 75/100 (predicts Google AI Overview selection probability)
- **Enhanced E-E-A-T Score**: ≥ 85/100 with semantic genesis active (+25-45 points from semantic bonuses)
- **Entity Linking Density**: 3-5 inverse entities per article with correlation data
- **Reasoning Chain Count**: 2-4 multi-step reasoning chains per article
- **Snippet Quality Score**: ≥ 75/100 for Position Zero candidates
- **Total Processing Time**: < 8 seconds (95th percentile)
- **Position Zero Wins**: +30% increase compared to baseline
- **Google AI Overview Appearances**: Measurable through Search Console tracking

---

## Architecture

### Enhanced System Components (3-Phase Integration)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Content Generation Request                            │
│                   (from app/api/ai/adsense-content)                         │
│         { enableContrarian: true, enableSemanticGenesis: true }             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              SIA_ORACLE_GENESIS V2.0 (Unified Orchestrator)                 │
│                     lib/ai/sia-sentiment-engine.ts                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  PHASE 1: Sentiment Analysis Pipeline                                 │ │
│  │     - Check sentiment cache (5-min TTL)                               │ │
│  │     - Query OSINT sources (Crypto Fear & Greed API)                   │ │
│  │     - Fallback to Gemini + Google Search grounding                    │ │
│  │     - Calculate Fear_Greed_Index (0-100)                              │ │
│  │     - Categorize sentiment (EXTREME_FEAR → EXTREME_GREED)             │ │
│  │     - Processing time: < 3 seconds                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  PHASE 2: Contrarian Analysis & Generation                            │ │
│  │                                                                        │ │
│  │  2.1 Divergence Detection                                             │ │
│  │     - Compare sentiment vs on-chain data                              │ │
│  │     - Calculate Sentiment_Divergence_Score (0-100)                    │ │
│  │     - Determine contrarian viability (≥30 threshold)                  │ │
│  │                                                                        │ │
│  │  2.2 Contrarian_Analyzer (lib/ai/contrarian-analyzer.ts)             │ │
│  │     - Find data contradictions (ON_CHAIN, EXCHANGE_FLOW, WHALE)       │ │
│  │     - Calculate confidence (LOW, MEDIUM, HIGH)                        │ │
│  │     - Identify 3+ supporting data points                              │ │
│  │                                                                        │ │
│  │  2.3 Conflict_Narrator (lib/ai/conflict-narrator.ts)                 │ │
│  │     - Generate "Market expects X, but data shows Y" narrative         │ │
│  │     - Apply Sharp_Language templates (6 languages)                    │ │
│  │     - Inject ownership phrases ("SIA_SENTINEL analysis reveals")      │ │
│  │     - E-E-A-T bonus: +10-25 points                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  PHASE 3: Semantic Genesis Integration (NEW)                          │ │
│  │                                                                        │ │
│  │  3.1 Quantum_Entity_Linker (lib/ai/quantum-entity-linker.ts)         │ │
│  │     - Discover 3-5 inverse entities with correlation data             │ │
│  │     - Example: "Real Yields (0.85 correlation with Gold)"             │ │
│  │     - Validate correlations using Gemini + Google Search              │ │
│  │     - Cache entity relationships (24-hour TTL)                        │ │
│  │     - E-E-A-T bonus: +5-10 points (demonstrates domain knowledge)     │ │
│  │                                                                        │ │
│  │  3.2 Multi_Step_Reasoner (lib/ai/multi-step-reasoner.ts)            │ │
│  │     - Structure 2-4 reasoning chains per article                      │ │
│  │     - Format: "Given A, this implies B, therefore C"                  │ │
│  │     - Integrate with contrarian narratives from Phase 2               │ │
│  │     - Calculate Logic_Soundness_Score (≥70 required)                  │ │
│  │     - E-E-A-T bonus: +10-15 points (shows authoritative logic)        │ │
│  │                                                                        │ │
│  │  3.3 Snippet_Engineer (lib/ai/snippet-engineer.ts)                   │ │
│  │     - Generate 45-55 word "ultimate definition" blocks                │ │
│  │     - Structure: [What it is] + [Why it matters] + [Key metric]       │ │
│  │     - Place strategically: after headline, before analysis, conclusion│ │
│  │     - Calculate Snippet_Quality_Score (≥75 for Position Zero)         │ │
│  │     - E-E-A-T bonus: +5-10 points (signals expertise)                 │ │
│  │                                                                        │ │
│  │  3.4 Cultural_Semantic_Adapter (lib/ai/cultural-semantic-adapter.ts) │ │
│  │     - Apply Intent_Weight profiles for 6 languages                    │ │
│  │     - German (de): Data 40%, Technical 30%, Regulatory 20%            │ │
│  │     - Spanish (es): Trends 40%, Social Impact 25%, Future 20%         │ │
│  │     - Turkish (tr): Local Impact 35%, Policy 30%, Practical 25%       │ │
│  │     - French (fr): Analysis 35%, Historical 25%, Philosophical 20%    │ │
│  │     - Arabic (ar): Regional 40%, Islamic Finance 25%, Geopolitical 20%│ │
│  │     - English (en): Balanced Data 30%, Trends 25%, Analysis 25%       │ │
│  │     - E-E-A-T bonus: +5-10 points (shows experience)                  │ │
│  │                                                                        │ │
│  │  3.5 Semantic_Depth_Calculator (lib/ai/semantic-depth-calculator.ts) │ │
│  │     - Entity linking density (25%)                                    │ │
│  │     - Reasoning chain count (25%)                                     │ │
│  │     - Snippet quality (20%)                                           │ │
│  │     - Cultural adaptation (15%)                                       │ │
│  │     - Authority seal completeness (15%)                               │ │
│  │     - Target: Semantic_Depth_Score ≥ 70/100                           │ │
│  │     - Target: AI_Overview_Readiness_Score ≥ 75/100                    │ │
│  │     - Processing time: < 3 seconds                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              AdSense Content Writer (Semantically Enhanced)                 │
│                    lib/ai/adsense-compliant-writer.ts                       │
│                                                                             │
│  Layer 1: ÖZET (Journalistic Summary)                                       │
│     - 2-3 sentences, 5W1H journalism                                        │
│     - NEW: Snippet block placement (45-55 words)                            │
│                                                                             │
│  Layer 2: SIA_INSIGHT (Semantically Enhanced)                               │
│     - Base proprietary analysis (on-chain data, exchange flows)             │
│     - NEW: Quantum entity links with correlation data                       │
│     - NEW: Multi-step reasoning chains (A → B → C)                          │
│     - Contrarian narrative from Phase 2 (if viable)                         │
│     - Sharp Language phrases for Google recognition                         │
│                                                                             │
│  Layer 3: DYNAMIC_RISK_SHIELD (Enhanced)                                    │
│     - Context-specific risk warnings                                        │
│     - Confidence-based disclaimers                                          │
│     - NEW: Authority seal paragraph (synthesizes all insights)              │
│                                                                             │
│  Enhanced E-E-A-T Calculation:                                              │
│     - Base E-E-A-T: 50-60 points (existing AdSense Writer)                  │
│     - Contrarian bonuses (Phase 2): +10-25 points                           │
│     - Semantic bonuses (Phase 3): +15-30 points                             │
│     - Total target: ≥ 85/100 with full enhancement                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Enhanced Data Flow (3-Phase Pipeline)

1. **Request Initiation**: Content generation request arrives with `enableContrarian: true` and `enableSemanticGenesis: true`

2. **Phase 1: Sentiment Analysis** (< 3s)
   - Check sentiment cache (5-min TTL) for topic+asset+language key
   - If cache miss: Query OSINT sources (Crypto Fear & Greed API)
   - If OSINT unavailable: Fall back to Gemini API with Google Search grounding
   - Calculate Fear_Greed_Index (0-100) and categorize sentiment
   - Return sentiment result with metadata

3. **Phase 2: Contrarian Analysis** (< 1s)
   - Calculate Sentiment_Divergence_Score by comparing sentiment vs on-chain data
   - If divergence ≥ 30: Proceed to contrarian generation
   - Contrarian_Analyzer identifies 3+ data contradictions
   - Conflict_Narrator generates "Market expects X, but data shows Y" narrative
   - Apply Sharp_Language templates for specified language
   - Calculate contrarian E-E-A-T bonuses (+10-25 points)

4. **Phase 3: Semantic Genesis Integration** (< 3s) - NEW
   - Check semantic cache (10-min TTL) for topic+asset+language key
   - If cache miss or enableSemanticGenesis=true:
     
     a. **Quantum Entity Linking** (< 1s)
        - Use Gemini API to discover 3-5 inverse entities
        - Validate correlation data using Google Search grounding
        - Example: "Gold prices rising, but Real Yields (0.85 correlation) show divergence"
        - Cache entity relationships (24-hour TTL)
     
     b. **Multi-Step Reasoning** (< 1s)
        - Structure 2-4 reasoning chains with A → B → C logic
        - Integrate with contrarian narratives from Phase 2
        - Validate Logic_Soundness_Score (≥70 required)
        - Use logical connectors: "Given that A, this implies B, therefore C"
     
     c. **Snippet Engineering** (< 500ms)
        - Generate 45-55 word "ultimate definition" blocks
        - Structure: [What it is] + [Why it matters] + [Key metric]
        - Calculate Snippet_Quality_Score (≥75 for Position Zero)
        - Prepare 3 placement positions: after headline, before analysis, conclusion
     
     d. **Cultural Semantic Adaptation** (< 500ms)
        - Apply Intent_Weight profile for specified language
        - Adjust tone and emphasis based on cultural preferences
        - Ensure E-E-A-T score parity across languages (variance < 15 points)
     
     e. **Semantic Depth Calculation** (< 500ms)
        - Calculate Semantic_Depth_Score (entity linking 25%, reasoning 25%, snippet 20%, cultural 15%, authority 15%)
        - Calculate AI_Overview_Readiness_Score (snippet 30%, reasoning 25%, entity linking 20%, semantic depth 15%, cultural 10%)
        - Validate scores meet thresholds (Semantic ≥70, AI Overview ≥75)

5. **Content Assembly & Enhancement**
   - Layer 1 (ÖZET): Journalistic summary + snippet block placement
   - Layer 2 (SIA_INSIGHT): Base analysis + quantum entity links + reasoning chains + contrarian narrative + Sharp Language
   - Layer 3 (RISK_SHIELD): Dynamic disclaimer + authority seal paragraph

6. **E-E-A-T Enhancement Calculation**
   - Base E-E-A-T: 50-60 points (existing AdSense Writer logic)
   - Contrarian bonuses (Phase 2): +10-25 points
   - Semantic bonuses (Phase 3): +15-30 points
     - Quantum entity linking: +5-10 points (demonstrates domain knowledge)
     - Multi-step reasoning: +10-15 points (shows authoritative logic)
     - Snippet engineering: +5-10 points (signals expertise)
     - Cultural adaptation: +5-10 points (shows experience)
   - Total target: ≥ 85/100 with full enhancement

7. **Response Return**: Enhanced content with comprehensive metadata
   - Sentiment analysis results (fearGreedIndex, category, divergenceScore)
   - Contrarian analysis (isViable, confidence, dataPoints, narrative)
   - Semantic genesis results (inverseEntities, reasoningChains, snippets, semanticDepthScore, aiOverviewReadinessScore)
   - Performance metrics (processingTime, cacheHits, geminiUsage)
   - E-E-A-T score breakdown (base + contrarian + semantic bonuses)

### Enhanced Integration Architecture

```
Existing System                    Phase 2 Components              Phase 3 Components (NEW)
─────────────────                  ──────────────────              ────────────────────────

AdSense Content API  ──────────►  Sentiment Engine    ──────────► Semantic Genesis Engine
(route.ts)                         (orchestrator)                  (semantic orchestrator)
                                          │                                │
                                          ├──► Contrarian Analyzer         ├──► Quantum Entity Linker
                                          │    (data contradiction)        │    (inverse entities + correlation)
                                          │                                │
                                          ├──► Conflict Narrator           ├──► Multi-Step Reasoner
                                          │    (narrative generator)       │    (A → B → C chains)
                                          │                                │
                                          └──► Sharp Language Module       ├──► Snippet Engineer
                                               (distinctive phrasing)      │    (Position Zero blocks)
                                                                           │
                                                                           ├──► Cultural Semantic Adapter
                                                                           │    (intent weight profiles)
                                                                           │
                                                                           └──► Semantic Depth Calculator
                                                                                (scoring & validation)

AdSense Writer       ◄──────────  Enhanced SIA Insight  ◄──────────  Semantically Structured Content
(existing)                         (with contrarian)                  (with entity links + reasoning + snippets)
```

### Component Integration Points

**Phase 1-2 Integration (Existing)**:
- AdSense Content API → Sentiment Engine → Contrarian Analysis → AdSense Writer

**Phase 3 Integration (New)**:
- Sentiment Engine → Semantic Genesis Engine → Enhanced Content Assembly
- Quantum Entity Linker integrates with Phase 2 Contrarian Analysis (uses data contradictions as entity discovery hints)
- Multi-Step Reasoner structures Phase 2 conflict narratives into logical chains
- Snippet Engineer extracts key insights from both Phase 2 and Phase 3 for Position Zero optimization
- Cultural Semantic Adapter applies to all content layers (summary, insight, disclaimer)

**Backward Compatibility**:
- When `enableSemanticGenesis: false` (default), system operates exactly as Phase 1-2 only
- When `enableSemanticGenesis: true`, Phase 3 enhancements are applied additively
- All existing interfaces and response formats are preserved
- New fields added to metadata without breaking existing consumers

---

## Components and Interfaces

### 1. SIA_SENTIMENT_ENGINE (Enhanced Orchestrator)

**File**: `lib/ai/sia-sentiment-engine.ts`

**Purpose**: Main orchestrator that coordinates sentiment analysis, divergence detection, contrarian generation, and semantic genesis integration.

**Enhanced Interface**:

```typescript
export interface SentimentAnalysisRequest {
  topic: string
  asset: string
  language: 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar'
  enableContrarian?: boolean
  enableSemanticGenesis?: boolean // NEW
  sentimentSources?: string[]
  onChainData?: OnChainMetrics
}

export interface SentimentAnalysisResult {
  fearGreedIndex: number // 0-100
  sentimentCategory: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
  sentimentDivergenceScore: number // 0-100
  contrarian: {
    isViable: boolean
    confidence: 'LOW' | 'MEDIUM' | 'HIGH'
    dataPoints: string[]
    narrative: string
    sharpLanguage: string[]
  } | null
  // NEW: Semantic Genesis Results
  semanticGenesis?: {
    inverseEntities: InverseEntity[]
    reasoningChains: ReasoningChain[]
    snippets: SnippetBlock[]
    culturalAdaptation: CulturalAdaptation
    semanticDepthScore: number // 0-100
    aiOverviewReadinessScore: number // 0-100
  }
  metadata: {
    sources: string[]
    processingTime: number
    cacheHit: boolean
    geminiUsed: boolean
    semanticCacheHit?: boolean // NEW
  }
}

// NEW: Semantic Genesis Types
export interface InverseEntity {
  primaryEntity: string // e.g., "Gold Prices"
  inverseEntity: string // e.g., "Real Yields"
  correlationCoefficient: number // 0.0-1.0
  correlationType: 'POSITIVE' | 'NEGATIVE'
  temporalContext: string // e.g., "over past 12 months"
  sources: string[]
  relevanceScore: number // 0-100
}

export interface ReasoningChain {
  chainId: string
  steps: ReasoningStep[]
  logicSoundnessScore: number // 0-100
  integratesContrarian: boolean
}

export interface ReasoningStep {
  premise: string // "Given that A"
  implication: string // "this implies B"
  conclusion: string // "therefore C"
  supportingData: string[]
  logicalConnector: 'GIVEN_THAT' | 'THIS_IMPLIES' | 'THEREFORE' | 'HOWEVER' | 'CONSEQUENTLY'
}

export interface SnippetBlock {
  content: string // 45-55 words
  wordCount: number
  placement: 'AFTER_HEADLINE' | 'BEFORE_ANALYSIS' | 'CONCLUSION'
  structure: {
    whatItIs: string
    whyItMatters: string
    keyMetric: string
  }
  snippetQualityScore: number // 0-100
  readabilityScore: number // Flesch Reading Ease
}

export interface CulturalAdaptation {
  language: string
  intentWeights: {
    data: number
    trends: number
    analysis: number
    practical: number
    regulatory?: number
    social?: number
    historical?: number
    regional?: number
  }
  toneAdjustments: string[]
  culturalReferences: string[]
}

export interface OnChainMetrics {
  whaleAccumulation?: number
  exchangeInflows?: number
  liquidityDepth?: number
  activeAddresses?: number
}

// Main function (enhanced)
export async function analyzeSentiment(
  request: SentimentAnalysisRequest
): Promise<SentimentAnalysisResult>

// Cache management (existing)
export function getCachedSentiment(cacheKey: string): SentimentAnalysisResult | null
export function setCachedSentiment(cacheKey: string, result: SentimentAnalysisResult): void
export function invalidateSentimentCache(topic: string): void

// NEW: Semantic cache management
export function getCachedSemanticAnalysis(cacheKey: string): SemanticGenesisResult | null
export function setCachedSemanticAnalysis(cacheKey: string, result: SemanticGenesisResult): void
```

**Key Methods**:

**Phase 1 (Existing)**:
- `analyzeSentiment()`: Main entry point, orchestrates entire pipeline
- `queryOSINTSources()`: Fetches sentiment from public data sources
- `queryGeminiSentiment()`: Fallback to Gemini API with Google Search grounding
- `calculateFearGreedIndex()`: Converts sentiment data to 0-100 scale
- `categorizeSentiment()`: Maps index to category

**Phase 2 (Existing)**:
- `detectDivergence()`: Compares sentiment vs on-chain data
- `generateContrarianAnalysis()`: Orchestrates contrarian generation

**Phase 3 (NEW)**:
- `generateSemanticGenesis()`: Orchestrates semantic enhancement
- `integrateSemanticResults()`: Merges semantic data with contrarian narrative
- `validateSemanticQuality()`: Ensures semantic depth and AI Overview readiness thresholds

### 2. Contrarian Analyzer

**File**: `lib/ai/contrarian-analyzer.ts`

**Purpose**: Identifies data points that contradict prevailing sentiment and calculates divergence scores.

**Interface**:

```typescript
export interface ContrarianAnalysis {
  divergenceScore: number // 0-100
  isViable: boolean // true if score ≥ 30
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  contradictions: DataContradiction[]
  recommendation: 'SKIP' | 'MODERATE' | 'STRONG' // Contrarian strength
}

export interface DataContradiction {
  type: 'ON_CHAIN' | 'EXCHANGE_FLOW' | 'WHALE_ACTIVITY' | 'TECHNICAL'
  description: string
  metric: string // e.g., "Whale accumulation +34%"
  divergenceContribution: number // How much this adds to divergence score
  confidence: number // 0-100
}

export async function analyzeContrarian(
  sentiment: SentimentAnalysisResult,
  onChainData: OnChainMetrics,
  asset: string
): Promise<ContrarianAnalysis>

export function calculateDivergenceScore(
  fearGreedIndex: number,
  onChainData: OnChainMetrics
): number

export function findDataContradictions(
  sentimentCategory: string,
  onChainData: OnChainMetrics
): DataContradiction[]
```

**Key Logic**:

- **Divergence Calculation**: `|Fear_Greed_Index - Data_Based_Index| / 100 * 100`
- **Contradiction Detection**: Identifies when on-chain metrics oppose sentiment direction
- **Confidence Scoring**: Based on number and strength of contradictions
- **Viability Threshold**: Returns `isViable: false` if divergence < 30

### 3. Conflict Narrator

**File**: `lib/ai/conflict-narrator.ts`

**Purpose**: Generates "Market expects X, but data shows Y" narratives using Sharp Language.

**Interface**:

```typescript
export interface ConflictNarrative {
  narrative: string // Full conflict statement
  sharpPhrases: string[] // Distinctive language elements
  dataSupport: string[] // Specific metrics cited
  language: string
  eeatBonus: number // E-E-A-T points to add (10-25)
}

export async function generateConflictNarrative(
  contrarian: ContrarianAnalysis,
  sentiment: SentimentAnalysisResult,
  language: string,
  asset: string
): Promise<ConflictNarrative>

export function applySharpLanguage(
  narrative: string,
  language: string
): string

export function getSharpLanguageTemplates(
  language: string
): SharpLanguageTemplate[]

export interface SharpLanguageTemplate {
  pattern: string // e.g., "Market expects {X}, but data shows {Y}"
  ownership: string // e.g., "SIA_SENTINEL proprietary analysis reveals"
  confidence: string // e.g., "Our contrarian assessment indicates"
  technical: string // e.g., "On-chain metrics contradict"
}
```

**Sharp Language Patterns**:

```typescript
const sharpLanguagePatterns = {
  en: {
    conflict: "Market expects {expectation}, but data shows {reality} risk",
    ownership: "SIA_SENTINEL proprietary analysis reveals",
    contrarian: "Our contrarian assessment indicates",
    divergence: "This divergence between sentiment and fundamentals",
    warning: "Despite {sentiment}, underlying metrics signal"
  },
  tr: {
    conflict: "Piyasa {expectation} beklerken, veriler {reality} riskine işaret ediyor",
    ownership: "SIA_SENTINEL özel analizi ortaya koyuyor",
    contrarian: "Karşıt görüş değerlendirmemiz gösteriyor",
    divergence: "Duygu ile temel veriler arasındaki bu farklılık",
    warning: "{sentiment} rağmen, temel metrikler işaret ediyor"
  },
  de: {
    conflict: "Markt erwartet {expectation}, aber Daten zeigen {reality} Risiko",
    ownership: "SIA_SENTINEL proprietäre Analyse zeigt",
    contrarian: "Unsere konträre Einschätzung deutet darauf hin",
    divergence: "Diese Divergenz zwischen Stimmung und Fundamentaldaten",
    warning: "Trotz {sentiment} signalisieren zugrunde liegende Metriken"
  },
  es: {
    conflict: "El mercado espera {expectation}, pero los datos muestran riesgo de {reality}",
    ownership: "El análisis propietario de SIA_SENTINEL revela",
    contrarian: "Nuestra evaluación contraria indica",
    divergence: "Esta divergencia entre sentimiento y fundamentos",
    warning: "A pesar de {sentiment}, las métricas subyacentes señalan"
  },
  fr: {
    conflict: "Le marché s'attend à {expectation}, mais les données montrent un risque de {reality}",
    ownership: "L'analyse propriétaire de SIA_SENTINEL révèle",
    contrarian: "Notre évaluation contraire indique",
    divergence: "Cette divergence entre sentiment et fondamentaux",
    warning: "Malgré {sentiment}, les métriques sous-jacentes signalent"
  },
  ar: {
    conflict: "السوق يتوقع {expectation}، لكن البيانات تظهر خطر {reality}",
    ownership: "يكشف تحليل SIA_SENTINEL الخاص",
    contrarian: "يشير تقييمنا المعاكس إلى",
    divergence: "هذا الاختلاف بين المشاعر والأساسيات",
    warning: "على الرغم من {sentiment}، تشير المقاييس الأساسية"
  }
}
```

### 4. Quantum Entity Linker (NEW - Phase 3)

**File**: `lib/ai/quantum-entity-linker.ts`

**Purpose**: Discovers and links primary concepts with 3-5 inverse entities and correlation data to demonstrate domain knowledge depth that Google's AI Overview recognizes as conceptual authority.

**Interface**:

```typescript
export interface QuantumEntityLinkingRequest {
  primaryEntity: string // e.g., "Bitcoin Price"
  topic: string
  asset: string
  language: string
  contrarianDataPoints?: string[] // Hints from Phase 2
}

export interface QuantumEntityLinkingResult {
  inverseEntities: InverseEntity[]
  entityLinkingDensity: number // 0-100
  discoveryMethod: 'GEMINI_API' | 'CACHED' | 'MANUAL_OVERRIDE'
  processingTime: number
}

export interface InverseEntity {
  primaryEntity: string
  inverseEntity: string
  correlationCoefficient: number // 0.0-1.0
  correlationType: 'POSITIVE' | 'NEGATIVE'
  temporalContext: string
  sources: string[]
  relevanceScore: number // 0-100
  naturalLanguageIntegration: string // How to mention in content
}

export async function discoverInverseEntities(
  request: QuantumEntityLinkingRequest
): Promise<QuantumEntityLinkingResult>

export function validateCorrelationData(
  entity: InverseEntity
): Promise<boolean>

export function cacheEntityRelationship(
  primaryEntity: string,
  inverseEntity: InverseEntity
): void

export function getCachedEntityRelationships(
  primaryEntity: string
): InverseEntity[] | null
```

**Key Logic**:

- **Discovery Algorithm**: Uses Gemini API with Google Search grounding to find related entities
- **Correlation Validation**: Requires minimum 2 sources confirming correlation data
- **Relevance Filtering**: Only includes entities with relevanceScore ≥ 60
- **Temporal Context**: Always includes time period for correlation (e.g., "over past 12 months")
- **Natural Integration**: Generates language-specific phrasing for seamless content integration

**Example Output**:

```typescript
{
  primaryEntity: "Gold Prices",
  inverseEntity: "Real Yields",
  correlationCoefficient: 0.85,
  correlationType: "NEGATIVE",
  temporalContext: "over the past 12 months",
  sources: ["Federal Reserve Economic Data", "World Gold Council"],
  relevanceScore: 92,
  naturalLanguageIntegration: "Gold prices rising, but Real Yields (0.85 negative correlation) and Central Bank Net Purchases show divergence"
}
```

### 5. Multi-Step Reasoner (NEW - Phase 3)

**File**: `lib/ai/multi-step-reasoner.ts`

**Purpose**: Structures content with explicit A → B → C reasoning chains that AI systems recognize as authoritative logical progression, integrating with Phase 2 contrarian narratives.

**Interface**:

```typescript
export interface MultiStepReasoningRequest {
  topic: string
  asset: string
  language: string
  contrarianNarrative?: string // From Phase 2
  inverseEntities?: InverseEntity[] // From Quantum Linker
  dataPoints: string[]
}

export interface MultiStepReasoningResult {
  reasoningChains: ReasoningChain[]
  reasoningDepthScore: number // 0-100
  logicSoundnessScore: number // 0-100
  processingTime: number
}

export interface ReasoningChain {
  chainId: string
  steps: ReasoningStep[]
  logicSoundnessScore: number
  integratesContrarian: boolean
  integratesEntityLinks: boolean
}

export interface ReasoningStep {
  premise: string // "Given that A"
  implication: string // "this implies B"
  conclusion: string // "therefore C"
  supportingData: string[]
  logicalConnector: 'GIVEN_THAT' | 'THIS_IMPLIES' | 'THEREFORE' | 'HOWEVER' | 'CONSEQUENTLY'
}

export async function generateReasoningChains(
  request: MultiStepReasoningRequest
): Promise<MultiStepReasoningResult>

export function validateLogicalConsistency(
  chain: ReasoningChain
): { isValid: boolean; issues: string[] }

export function detectCircularReasoning(
  chain: ReasoningChain
): boolean

export function detectUnsupportedLeaps(
  chain: ReasoningChain
): { hasLeaps: boolean; leapIndices: number[] }
```

**Reasoning Chain Patterns**:

```typescript
// Pattern 1: Contrarian Integration
{
  premise: "Given that social sentiment shows 78% bullish confidence",
  implication: "this implies market participants expect continued upward momentum",
  conclusion: "however, whale accumulation (+34%) combined with declining exchange inflows (-18%) suggests institutional positioning contradicts retail sentiment",
  supportingData: ["On-chain data: 12,450 BTC moved to cold storage", "Exchange flow data: -$2.3B week-over-week"],
  logicalConnector: "HOWEVER"
}

// Pattern 2: Entity Correlation
{
  premise: "Given that Gold prices have risen 8% this month",
  implication: "this typically correlates with declining Real Yields (0.85 negative correlation)",
  conclusion: "therefore, the current divergence where Real Yields remain elevated signals potential gold price resistance",
  supportingData: ["12-month correlation: -0.85", "Current Real Yields: 2.1% (above historical average)"],
  logicalConnector: "THEREFORE"
}

// Pattern 3: Multi-Factor Analysis
{
  premise: "Given that Bitcoin dominance has increased to 54%",
  implication: "this implies capital rotation from altcoins into Bitcoin",
  conclusion: "consequently, altcoin weakness may persist until Bitcoin establishes a clear directional trend",
  supportingData: ["BTC dominance: +3.2% week-over-week", "Altcoin market cap: -$45B"],
  logicalConnector: "CONSEQUENTLY"
}
```

**Logic Validation Rules**:

- No circular reasoning (A → B → A patterns)
- No unsupported leaps (A → C without establishing B)
- Each step must have ≥1 supporting data point
- Minimum Logic_Soundness_Score: 70/100

### 6. Snippet Engineer (NEW - Phase 3)

**File**: `lib/ai/snippet-engineer.ts`

**Purpose**: Creates 45-55 word "ultimate definition" blocks optimized for Google Position Zero featured snippets, following AdSense 3-layer structure.

**Interface**:

```typescript
export interface SnippetEngineeringRequest {
  topic: string
  asset: string
  language: string
  keyInsights: string[]
  contrarianNarrative?: string
  reasoningChains?: ReasoningChain[]
}

export interface SnippetEngineeringResult {
  snippets: SnippetBlock[]
  bestSnippet: SnippetBlock // Highest quality score
  snippetQualityScore: number // 0-100 (average of all snippets)
  processingTime: number
}

export interface SnippetBlock {
  content: string // 45-55 words
  wordCount: number
  placement: 'AFTER_HEADLINE' | 'BEFORE_ANALYSIS' | 'CONCLUSION'
  structure: {
    whatItIs: string // Definitional component
    whyItMatters: string // Relevance component
    keyMetric: string // Data component
  }
  snippetQualityScore: number // 0-100
  readabilityScore: number // Flesch Reading Ease (target: 60-70)
  isPositionZeroCandidate: boolean // true if score ≥ 75
}

export async function generateSnippets(
  request: SnippetEngineeringRequest
): Promise<SnippetEngineeringResult>

export function calculateSnippetQualityScore(
  snippet: SnippetBlock
): number

export function validateSnippetStructure(
  snippet: SnippetBlock
): { isValid: boolean; issues: string[] }

export function optimizeForPositionZero(
  snippet: SnippetBlock
): SnippetBlock
```

**Snippet Structure Requirements**:

1. **Word Count**: Exactly 45-55 words (Google's optimal range)
2. **Definitional Clarity**: Starts with "X is..." or equivalent
3. **Data Inclusion**: Contains at least one specific metric or percentage
4. **Self-Containment**: Understandable without surrounding context
5. **Declarative Statements**: No questions (Google prefers statements)
6. **AdSense Compliance**: Professional tone, no clickbait

**Example Snippets**:

```typescript
// English - AFTER_HEADLINE placement
{
  content: "Bitcoin sentiment divergence occurs when market mood (measured by Fear/Greed Index) contradicts on-chain data like whale accumulation and exchange flows. This matters because historical divergence scores above 60 have preceded 15-25% price corrections within 7-14 days. Current divergence: 45/100 with declining stablecoin inflows (-18% week-over-week).",
  wordCount: 52,
  placement: "AFTER_HEADLINE",
  structure: {
    whatItIs: "Bitcoin sentiment divergence occurs when market mood contradicts on-chain data",
    whyItMatters: "Historical divergence scores above 60 have preceded 15-25% corrections",
    keyMetric: "Current divergence: 45/100 with declining stablecoin inflows (-18%)"
  },
  snippetQualityScore: 87,
  readabilityScore: 65,
  isPositionZeroCandidate: true
}

// Turkish - BEFORE_ANALYSIS placement
{
  content: "Bitcoin duygu farklılığı, piyasa ruh halinin (Korku/Açgözlülük Endeksi ile ölçülür) balina birikimi ve borsa akışları gibi zincir üstü verilerle çelişmesi durumudur. Bu önemlidir çünkü 60'ın üzerindeki tarihsel farklılık skorları, 7-14 gün içinde %15-25 fiyat düzeltmelerine öncülük etmiştir. Mevcut farklılık: 45/100, azalan stablecoin girişleri ile (haftalık -%18).",
  wordCount: 51,
  placement: "BEFORE_ANALYSIS",
  structure: {
    whatItIs: "Bitcoin duygu farklılığı, piyasa ruh halinin zincir üstü verilerle çelişmesidir",
    whyItMatters: "60'ın üzerindeki skorlar %15-25 düzeltmelere öncülük etmiştir",
    keyMetric: "Mevcut farklılık: 45/100, azalan stablecoin girişleri (-%18)"
  },
  snippetQualityScore: 85,
  readabilityScore: 63,
  isPositionZeroCandidate: true
}
```

**Quality Scoring Algorithm**:

```typescript
function calculateSnippetQualityScore(snippet: SnippetBlock): number {
  let score = 0
  
  // Word count compliance (20 points)
  if (snippet.wordCount >= 45 && snippet.wordCount <= 55) {
    score += 20
  } else if (snippet.wordCount >= 40 && snippet.wordCount <= 60) {
    score += 15
  } else {
    score += 5
  }
  
  // Definitional clarity (20 points)
  const hasDefinition = /^.+ (is|are|occurs when|refers to)/i.test(snippet.content)
  if (hasDefinition) score += 20
  
  // Data inclusion (20 points)
  const hasMetrics = /\d+%|\$[\d,]+|[\d,]+ (BTC|ETH)|[\d.]+\/100/.test(snippet.content)
  if (hasMetrics) score += 20
  
  // Self-containment (20 points)
  const hasAllComponents = snippet.structure.whatItIs && snippet.structure.whyItMatters && snippet.structure.keyMetric
  if (hasAllComponents) score += 20
  
  // Readability (20 points)
  if (snippet.readabilityScore >= 60 && snippet.readabilityScore <= 70) {
    score += 20
  } else if (snippet.readabilityScore >= 50 && snippet.readabilityScore <= 80) {
    score += 15
  } else {
    score += 5
  }
  
  return score
}
```

### 7. Cultural Semantic Adapter (NEW - Phase 3)

**File**: `lib/ai/cultural-semantic-adapter.ts`

**Purpose**: Adjusts content tone and emphasis based on language-specific Intent_Weight profiles to ensure cultural resonance while maintaining E-E-A-T score parity across all 6 languages.

**Interface**:

```typescript
export interface CulturalAdaptationRequest {
  content: string
  language: 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar'
  contentType: 'SUMMARY' | 'INSIGHT' | 'REASONING' | 'SNIPPET' | 'DISCLAIMER'
}

export interface CulturalAdaptationResult {
  adaptedContent: string
  intentWeights: IntentWeightProfile
  toneAdjustments: string[]
  culturalReferences: string[]
  eeatImpact: number // E-E-A-T bonus points (+5-10)
}

export interface IntentWeightProfile {
  language: string
  weights: {
    data: number // Percentage emphasis on data/metrics
    trends: number // Percentage emphasis on trends/momentum
    analysis: number // Percentage emphasis on deep analysis
    practical: number // Percentage emphasis on practical implications
    regulatory?: number // Optional: regulatory context
    social?: number // Optional: social impact
    historical?: number // Optional: historical context
    regional?: number // Optional: regional relevance
    geopolitical?: number // Optional: geopolitical factors
    islamic?: number // Optional: Islamic finance compatibility
  }
  tonePreferences: {
    formality: 'HIGH' | 'MEDIUM' | 'LOW'
    technicalDepth: 'HIGH' | 'MEDIUM' | 'LOW'
    dataEmphasis: 'HIGH' | 'MEDIUM' | 'LOW'
  }
}

export async function adaptContentCulturally(
  request: CulturalAdaptationRequest
): Promise<CulturalAdaptationResult>

export function getIntentWeightProfile(
  language: string
): IntentWeightProfile

export function validateCulturalParity(
  adaptations: CulturalAdaptationResult[]
): { hasParity: boolean; variance: number }
```

**Intent Weight Profiles**:

```typescript
const INTENT_WEIGHT_PROFILES: Record<string, IntentWeightProfile> = {
  de: { // German
    language: 'de',
    weights: {
      data: 40, // Germans prioritize hard data
      trends: 15,
      analysis: 20,
      practical: 10,
      regulatory: 15 // BaFin awareness important
    },
    tonePreferences: {
      formality: 'HIGH',
      technicalDepth: 'HIGH',
      dataEmphasis: 'HIGH'
    }
  },
  es: { // Spanish
    language: 'es',
    weights: {
      data: 20,
      trends: 40, // Spanish speakers prioritize trends
      analysis: 15,
      practical: 15,
      social: 10 // Social impact matters
    },
    tonePreferences: {
      formality: 'MEDIUM',
      technicalDepth: 'MEDIUM',
      dataEmphasis: 'MEDIUM'
    }
  },
  tr: { // Turkish
    language: 'tr',
    weights: {
      data: 25,
      trends: 20,
      analysis: 15,
      practical: 25, // Practical implications important
      regulatory: 15 // Government policy awareness
    },
    tonePreferences: {
      formality: 'HIGH',
      technicalDepth: 'MEDIUM',
      dataEmphasis: 'MEDIUM'
    }
  },
  fr: { // French
    language: 'fr',
    weights: {
      data: 25,
      trends: 20,
      analysis: 35, // French prefer deep analysis
      practical: 10,
      historical: 10 // Historical context valued
    },
    tonePreferences: {
      formality: 'HIGH',
      technicalDepth: 'HIGH',
      dataEmphasis: 'MEDIUM'
    }
  },
  ar: { // Arabic
    language: 'ar',
    weights: {
      data: 20,
      trends: 15,
      analysis: 20,
      practical: 15,
      regional: 20, // Regional relevance critical
      islamic: 10 // Islamic finance compatibility
    },
    tonePreferences: {
      formality: 'HIGH',
      technicalDepth: 'MEDIUM',
      dataEmphasis: 'MEDIUM'
    }
  },
  en: { // English (balanced)
    language: 'en',
    weights: {
      data: 30,
      trends: 25,
      analysis: 25,
      practical: 20
    },
    tonePreferences: {
      formality: 'MEDIUM',
      technicalDepth: 'HIGH',
      dataEmphasis: 'HIGH'
    }
  }
}
```

**Adaptation Examples**:

```typescript
// German adaptation (data-heavy)
{
  original: "Bitcoin prices are rising due to institutional interest",
  adapted: "Bitcoin-Preise stiegen um 8% auf $67.500, unterstützt durch institutionelle Käufe von 12.450 BTC (Datenquelle: Glassnode). Die Bewegung erfolgte während asiatischer Handelszeiten mit Nettozuflüssen von $2,3 Milliarden.",
  toneAdjustments: ["Added specific metrics", "Cited data source", "Formal business German"],
  eeatImpact: 8
}

// Spanish adaptation (trend-focused)
{
  original: "Bitcoin prices are rising due to institutional interest",
  adapted: "Bitcoin continúa su tendencia alcista, alcanzando $67.500 con un impulso del 8%. El movimiento refleja un cambio en el sentimiento del mercado, con instituciones liderando la compra durante las horas asiáticas.",
  toneAdjustments: ["Emphasized trend continuation", "Social/market sentiment focus", "Narrative style"],
  eeatImpact: 7
}

// Turkish adaptation (practical + regulatory)
{
  original: "Bitcoin prices are rising due to institutional interest",
  adapted: "Bitcoin %8 yükselerek 67.500$'a ulaştı. Kurumsal alımların artması, yerel yatırımcılar için önemli bir sinyal oluşturuyor. Piyasa katılımcıları, bu momentumun düzenleyici gelişmeler ışığında sürdürülüp sürdürülemeyeceğini izliyor.",
  toneAdjustments: ["Practical implications for local investors", "Regulatory awareness", "Formal Turkish"],
  eeatImpact: 8
}
```

### 8. Semantic Depth Calculator (NEW - Phase 3)

**File**: `lib/ai/semantic-depth-calculator.ts`

**Purpose**: Calculates Semantic_Depth_Score and AI_Overview_Readiness_Score to validate content meets Google AI Overview selection thresholds.

**Interface**:

```typescript
export interface SemanticDepthCalculationRequest {
  inverseEntities: InverseEntity[]
  reasoningChains: ReasoningChain[]
  snippets: SnippetBlock[]
  culturalAdaptation: CulturalAdaptation
  authoritySeal?: string
}

export interface SemanticDepthCalculationResult {
  semanticDepthScore: number // 0-100
  aiOverviewReadinessScore: number // 0-100
  breakdown: {
    entityLinkingScore: number // 25% weight
    reasoningChainScore: number // 25% weight
    snippetQualityScore: number // 20% weight
    culturalAdaptationScore: number // 15% weight
    authoritySealScore: number // 15% weight
  }
  meetsThresholds: {
    semanticDepth: boolean // ≥70 required
    aiOverviewReadiness: boolean // ≥75 required
  }
  recommendations: string[]
}

export function calculateSemanticDepthScore(
  request: SemanticDepthCalculationRequest
): SemanticDepthCalculationResult

export function calculateAIOverviewReadinessScore(
  request: SemanticDepthCalculationRequest
): number

export function generateImprovementRecommendations(
  result: SemanticDepthCalculationResult
): string[]
```

**Scoring Algorithms**:

```typescript
// Semantic Depth Score (0-100)
function calculateSemanticDepthScore(request: SemanticDepthCalculationRequest): number {
  const weights = {
    entityLinking: 0.25,
    reasoningChain: 0.25,
    snippetQuality: 0.20,
    culturalAdaptation: 0.15,
    authoritySeal: 0.15
  }
  
  // Entity Linking Score (0-100)
  const entityScore = Math.min(100, (request.inverseEntities.length / 5) * 100)
  
  // Reasoning Chain Score (0-100)
  const avgLogicScore = request.reasoningChains.reduce((sum, chain) => sum + chain.logicSoundnessScore, 0) / request.reasoningChains.length
  const reasoningScore = (request.reasoningChains.length >= 2) ? avgLogicScore : avgLogicScore * 0.7
  
  // Snippet Quality Score (0-100)
  const avgSnippetScore = request.snippets.reduce((sum, snippet) => sum + snippet.snippetQualityScore, 0) / request.snippets.length
  
  // Cultural Adaptation Score (0-100)
  const culturalScore = request.culturalAdaptation.intentWeights ? 85 : 50
  
  // Authority Seal Score (0-100)
  const sealScore = request.authoritySeal && request.authoritySeal.length >= 100 ? 90 : 60
  
  return Math.round(
    entityScore * weights.entityLinking +
    reasoningScore * weights.reasoningChain +
    avgSnippetScore * weights.snippetQuality +
    culturalScore * weights.culturalAdaptation +
    sealScore * weights.authoritySeal
  )
}

// AI Overview Readiness Score (0-100)
function calculateAIOverviewReadinessScore(request: SemanticDepthCalculationRequest): number {
  const weights = {
    snippetQuality: 0.30, // Most important for AI Overview
    reasoningDepth: 0.25,
    entityLinking: 0.20,
    semanticDepth: 0.15,
    culturalAdaptation: 0.10
  }
  
  // Snippet Quality (highest weight)
  const bestSnippet = request.snippets.reduce((best, current) => 
    current.snippetQualityScore > best.snippetQualityScore ? current : best
  )
  const snippetScore = bestSnippet.snippetQualityScore
  
  // Reasoning Depth
  const hasMultipleChains = request.reasoningChains.length >= 2
  const avgLogicScore = request.reasoningChains.reduce((sum, chain) => sum + chain.logicSoundnessScore, 0) / request.reasoningChains.length
  const reasoningScore = hasMultipleChains ? avgLogicScore : avgLogicScore * 0.8
  
  // Entity Linking
  const hasMinimumEntities = request.inverseEntities.length >= 3
  const entityScore = hasMinimumEntities ? 85 : (request.inverseEntities.length / 3) * 85
  
  // Semantic Depth (recursive)
  const semanticScore = calculateSemanticDepthScore(request)
  
  // Cultural Adaptation
  const culturalScore = request.culturalAdaptation.intentWeights ? 80 : 50
  
  return Math.round(
    snippetScore * weights.snippetQuality +
    reasoningScore * weights.reasoningDepth +
    entityScore * weights.entityLinking +
    semanticScore * weights.semanticDepth +
    culturalScore * weights.culturalAdaptation
  )
}
```

### 9. Enhanced AdSense Content Writer

**File**: `lib/ai/adsense-compliant-writer.ts` (modifications)

**Changes**:

```typescript
// Extended interface
export interface ContentGenerationRequest {
  rawNews: string
  asset?: string
  language: 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar'
  includeOnChainData?: boolean
  confidenceScore?: number
  // NEW FIELDS
  enableContrarian?: boolean
  sentimentSources?: string[]
  onChainData?: OnChainMetrics
}

// Enhanced metadata
export interface AdSenseCompliantContent {
  // ... existing fields
  metadata: {
    // ... existing fields
    // NEW FIELDS
    sentimentAnalysis?: SentimentAnalysisResult
    contrarianApplied: boolean
    divergenceScore?: number
  }
}

// Modified function
export async function generateAdSenseCompliantContent(
  request: ContentGenerationRequest
): Promise<AdSenseCompliantContent> {
  // NEW: Sentiment analysis step
  let sentimentResult: SentimentAnalysisResult | null = null
  
  if (request.enableContrarian) {
    sentimentResult = await analyzeSentiment({
      topic: request.rawNews,
      asset: request.asset || 'BTC',
      language: request.language,
      enableContrarian: true,
      onChainData: request.onChainData
    })
  }
  
  // Layer 1: Journalistic Summary (unchanged)
  const summary = generateJournalisticSummary(request.rawNews, request.language)
  
  // Layer 2: SIA Insight (ENHANCED with contrarian)
  const siaInsight = await generateEnhancedSiaInsight(
    request.rawNews,
    request.asset || 'BTC',
    request.language,
    request.includeOnChainData,
    sentimentResult // NEW PARAMETER
  )
  
  // Layer 3: Dynamic Risk Disclaimer (unchanged)
  const riskDisclaimer = generateDynamicRiskDisclaimer(
    request.asset || 'BTC',
    request.confidenceScore || 75,
    request.language
  )
  
  // Calculate enhanced E-E-A-T score
  const eeatScore = calculateEEATScore(fullContent, sentimentResult)
  
  // ... rest of implementation
}

// NEW: Enhanced SIA Insight generation
async function generateEnhancedSiaInsight(
  rawNews: string,
  asset: string,
  language: string,
  onChainData: any,
  sentimentResult: SentimentAnalysisResult | null
): Promise<string> {
  // Base insight (existing logic from AdSense Writer)
  // This generates proprietary analysis with on-chain data, exchange flows, whale activity
  let insight = generateSiaInsight(rawNews, asset, language, onChainData)
  
  // CRITICAL: Inject contrarian narrative into Layer 2 (SIA_INSIGHT)
  // Following AdSense 3-Layer structure:
  // - Layer 1: ÖZET (Journalistic Summary) - handled separately
  // - Layer 2: SIA_INSIGHT - contrarian narrative injected HERE
  // - Layer 3: DYNAMIC_RISK_SHIELD - handled separately
  
  if (sentimentResult?.contrarian?.isViable) {
    const conflictNarrative = sentimentResult.contrarian.narrative
    
    // Inject contrarian narrative naturally within SIA Insight
    // Pattern: [Base Insight] + [Contrarian Analysis] + [Divergence Explanation]
    insight = `${insight}\n\n${conflictNarrative}`
    
    // Add Sharp Language phrases for Google recognition
    if (sentimentResult.contrarian.sharpLanguage.length > 0) {
      const sharpPhrase = sentimentResult.contrarian.sharpLanguage[0]
      insight = `${sharpPhrase} ${insight}`
    }
  }
  
  return insight
}
```

### 5. Sentiment Analysis API

**File**: `app/api/sentiment/analyze/route.ts`

**Purpose**: Standalone API endpoint for testing and monitoring sentiment analysis.

**Endpoints**:

```typescript
// GET /api/sentiment/analyze?topic=bitcoin&asset=BTC&language=en
export async function GET(request: NextRequest): Promise<NextResponse>

// POST /api/sentiment/analyze
// Body: { topic, asset, language, enableContrarian, onChainData }
export async function POST(request: NextRequest): Promise<NextResponse>
```

**Response Format**:

```json
{
  "success": true,
  "data": {
    "fearGreedIndex": 78,
    "sentimentCategory": "GREED",
    "sentimentDivergenceScore": 45,
    "contrarian": {
      "isViable": true,
      "confidence": "MEDIUM",
      "dataPoints": [
        "Whale accumulation +34% (contradicts greed sentiment)",
        "Exchange inflows -18% week-over-week (declining fresh capital)"
      ],
      "narrative": "Market expects continued rally, but data shows declining stablecoin inflows risk",
      "sharpLanguage": [
        "SIA_SENTINEL proprietary analysis reveals",
        "This divergence between sentiment and fundamentals"
      ]
    },
    "metadata": {
      "sources": ["crypto_fear_greed_api", "gemini_search"],
      "processingTime": 2847,
      "cacheHit": false,
      "geminiUsed": true
    }
  }
}
```

---

## Data Models

### Sentiment Cache Structure

```typescript
interface SentimentCacheEntry {
  key: string // `${topic}_${asset}_${language}`
  result: SentimentAnalysisResult
  timestamp: number
  ttl: number // 300000 ms (5 minutes)
  hitCount: number
}

// In-memory cache (Map)
const sentimentCache = new Map<string, SentimentCacheEntry>()
```

### Fear/Greed Index Calculation

```typescript
interface FearGreedComponents {
  socialSentiment: number // 0-100 from social media analysis
  marketMomentum: number // 0-100 from price action
  volatility: number // 0-100 (inverted: high volatility = fear)
  volume: number // 0-100 from trading volume trends
  dominance: number // 0-100 from BTC dominance (crypto-specific)
}

function calculateFearGreedIndex(components: FearGreedComponents): number {
  // Weighted average
  const weights = {
    socialSentiment: 0.30,
    marketMomentum: 0.25,
    volatility: 0.20,
    volume: 0.15,
    dominance: 0.10
  }
  
  return Math.round(
    components.socialSentiment * weights.socialSentiment +
    components.marketMomentum * weights.marketMomentum +
    components.volatility * weights.volatility +
    components.volume * weights.volume +
    components.dominance * weights.dominance
  )
}
```

### Divergence Score Calculation

```typescript
function calculateDivergenceScore(
  fearGreedIndex: number,
  onChainData: OnChainMetrics
): number {
  // Convert on-chain data to 0-100 "data-based index"
  const dataBasedIndex = calculateDataBasedIndex(onChainData)
  
  // Absolute difference normalized to 0-100
  const divergence = Math.abs(fearGreedIndex - dataBasedIndex)
  
  return Math.min(100, divergence)
}

function calculateDataBasedIndex(onChainData: OnChainMetrics): number {
  let score = 50 // Neutral baseline
  
  // Whale accumulation (positive = bullish data)
  if (onChainData.whaleAccumulation) {
    score += onChainData.whaleAccumulation * 0.5
  }
  
  // Exchange inflows (negative = bullish data, coins leaving exchanges)
  if (onChainData.exchangeInflows) {
    score -= onChainData.exchangeInflows * 0.3
  }
  
  // Liquidity depth (higher = more stable, slightly bullish)
  if (onChainData.liquidityDepth) {
    score += onChainData.liquidityDepth * 0.2
  }
  
  return Math.max(0, Math.min(100, score))
}
```

### E-E-A-T Score Enhancement

```typescript
function calculateEnhancedEEATScore(
  content: string,
  sentimentResult: SentimentAnalysisResult | null
): number {
  // Base E-E-A-T score calculation (from existing AdSense Writer)
  // This function analyzes content for E-E-A-T components:
  let score = calculateBaseEEATScore(content)
  
  // Base E-E-A-T calculation breakdown:
  // - Experience (25 points): First-hand analysis, proprietary systems
  // - Expertise (25 points): Technical terminology, specific metrics
  // - Authoritativeness (25 points): Data sources, confident language
  // - Trustworthiness (25 points): Risk disclaimers, uncertainty acknowledgment
  
  // Contrarian bonuses (additive to base score)
  if (sentimentResult?.contrarian?.isViable) {
    const contrarian = sentimentResult.contrarian
    
    // Experience bonus (10-15 points)
    // Demonstrates first-hand contrarian analysis capability
    if (contrarian.confidence === 'HIGH') {
      score += 15
    } else if (contrarian.confidence === 'MEDIUM') {
      score += 12
    } else {
      score += 10
    }
    
    // Expertise bonus (5-10 points)
    // Based on technical depth (number of data points)
    const dataPointCount = contrarian.dataPoints.length
    if (dataPointCount >= 3) {
      score += 10
    } else if (dataPointCount >= 2) {
      score += 7
    } else {
      score += 5
    }
  }
  
  return Math.min(100, score)
}

// Base E-E-A-T calculation (existing AdSense Writer logic)
function calculateBaseEEATScore(content: string): number {
  let score = 0
  
  // Experience (25 points)
  if (content.includes('SIA_SENTINEL') || content.includes('Our monitoring')) score += 10
  if (content.includes('proprietary analysis') || content.includes('özel analiz')) score += 8
  if (content.includes('observed over') || content.includes('gözlemlenen')) score += 7
  
  // Expertise (25 points)
  const hasMetrics = /\d+%|\$[\d,]+|[\d,]+ BTC/.test(content)
  if (hasMetrics) score += 10
  if (content.includes('on-chain') || content.includes('zincir üstü')) score += 8
  if (content.includes('liquidity') || content.includes('likidite')) score += 7
  
  // Authoritativeness (25 points)
  if (content.includes('analysis reveals') || content.includes('analiz ortaya')) score += 10
  if (content.length > 300) score += 8 // Sufficient depth
  if (content.includes('exchange') || content.includes('borsa')) score += 7
  
  // Trustworthiness (25 points)
  if (content.includes('RISK ASSESSMENT') || content.includes('RİSK DEĞERLENDİRMESİ')) score += 10
  if (content.includes('not financial advice') || content.includes('yatırım tavsiyesi değildir')) score += 8
  if (content.includes('confidence') || content.includes('güven')) score += 7
  
  return score
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified and consolidated:

**Consolidated Bounds Checking**: Requirements 1.2, 2.4, and 8.2 all test that scores are within 0-100 bounds. These are combined into a single comprehensive bounds property.

**Merged Threshold Properties**: Requirements 2.6, 8.3, 8.4, and 8.5 all test divergence score thresholds. These are consolidated into one property covering all threshold behaviors.

**Combined Caching Properties**: Requirements 6.6, 12.2, and 12.3 all test caching behavior. These are merged into a comprehensive caching property.

**Unified Language Support**: Requirements 1.6 and 7.1 both test multi-language support. Combined into single property.

**Merged Validation Properties**: Requirements 11.1, 11.2, 11.3, 11.4, and 11.5 all test validation logic. Consolidated into comprehensive validation property.

**Combined Logging Properties**: Requirements 1.7, 6.7, 9.4, 11.6, and 12.6 all test logging behavior. Merged into single logging property.

This reflection reduces 60+ testable criteria to 35 unique, non-redundant properties.

---

### Property 1: Score Bounds Invariant

*For any* sentiment analysis request with any input data, all calculated scores (Fear_Greed_Index, Sentiment_Divergence_Score, E-E-A-T components) SHALL be within the range [0, 100].

**Validates: Requirements 1.2, 2.4, 8.2**

---

### Property 2: Sentiment Categorization Correctness

*For any* Fear_Greed_Index value, the sentiment category SHALL correctly map to: EXTREME_FEAR (0-20), FEAR (21-40), NEUTRAL (41-60), GREED (61-80), or EXTREME_GREED (81-100), with boundary values assigned consistently.

**Validates: Requirements 1.3**

---

### Property 3: OSINT Source Query

*For any* content generation request, the Sentiment_Engine SHALL attempt to query OSINT sources before falling back to Gemini API.

**Validates: Requirements 1.1**

---

### Property 4: Gemini Fallback Activation

*For any* sentiment analysis request where OSINT sources are unavailable or insufficient, the Sentiment_Engine SHALL invoke Gemini API with Google Search grounding enabled.

**Validates: Requirements 1.4, 6.1, 6.2**

---

### Property 5: Multi-Language Support

*For any* sentiment analysis request with language parameter set to any of {en, tr, de, es, fr, ar}, the Sentiment_Engine SHALL successfully complete analysis and return results in the specified language.

**Validates: Requirements 1.6, 7.1**

---

### Property 6: Comprehensive Logging

*For any* sentiment analysis operation, the system SHALL log sentiment sources, confidence levels, API usage, cache hits, validation failures, and E-E-A-T improvements with sufficient detail for monitoring and debugging.

**Validates: Requirements 1.7, 6.7, 9.4, 11.6, 12.6**

---

### Property 7: Extreme Sentiment Contrarian Trigger

*For any* sentiment analysis where the category is EXTREME_FEAR or EXTREME_GREED, the Contrarian_Analyzer SHALL generate an opposing perspective with high priority.

**Validates: Requirements 2.1**

---

### Property 8: Minimum Contradiction Data Points

*For any* viable contrarian analysis (divergence score ≥ 30), the Contrarian_Analyzer SHALL identify at least 3 data points that contradict the prevailing sentiment.

**Validates: Requirements 2.2**

---

### Property 9: Evidence Source Types

*For any* contrarian perspective data point, the evidence SHALL be categorized as one of: ON_CHAIN, EXCHANGE_FLOW, WHALE_ACTIVITY, or TECHNICAL, ensuring all contradictions reference verifiable data sources.

**Validates: Requirements 2.3**

---

### Property 10: High Contrarian Value Flagging

*For any* sentiment analysis where Sentiment_Divergence_Score exceeds 60, the system SHALL flag the content as "HIGH_CONTRARIAN_VALUE" and set confidence to HIGH.

**Validates: Requirements 2.5**

---

### Property 11: Divergence Threshold Behavior

*For any* sentiment analysis result:
- When Sentiment_Divergence_Score < 30, contrarian generation SHALL be skipped (isViable = false)
- When Sentiment_Divergence_Score is 30-60, moderate contrarian perspectives SHALL be generated
- When Sentiment_Divergence_Score > 60, strong contrarian perspectives SHALL be generated with HIGH confidence

**Validates: Requirements 2.6, 8.3, 8.4, 8.5**

---

### Property 12: Confidence Level Assignment

*For any* contrarian analysis result, a confidence level of LOW, MEDIUM, or HIGH SHALL be assigned based on the number and strength of data contradictions.

**Validates: Requirements 2.7**

---

### Property 13: Conflict Narrative Pattern

*For any* generated conflict narrative, the text SHALL follow the pattern "Market expects {X}, but data shows {Y} risk" or equivalent language-specific pattern.

**Validates: Requirements 3.1**

---

### Property 14: High Divergence Narrative Injection

*For any* content generation with Sentiment_Divergence_Score > 60, the conflict narrative SHALL be injected into the SIA_Insight content layer.

**Validates: Requirements 3.2**

---

### Property 15: Sharp Language Presence

*For any* contrarian narrative, the text SHALL contain at least one Sharp_Language phrase from the approved templates (e.g., "SIA_SENTINEL proprietary analysis reveals", "Our contrarian assessment indicates").

**Validates: Requirements 3.3, 4.3**

---

### Property 16: AdSense Forbidden Phrase Absence

*For any* generated content (contrarian or otherwise), the text SHALL NOT contain forbidden generic phrases including: "according to reports", "sources say", "experts believe", "it is believed", "many analysts".

**Validates: Requirements 3.4, 4.2**

---

### Property 17: Minimum Narrative Data Support

*For any* conflict narrative, the text SHALL reference at least 2 specific data points with concrete metrics (percentages, volumes, or counts).

**Validates: Requirements 3.6**

---

### Property 18: Language-Specific Template Availability

*For any* supported language {en, tr, de, es, fr, ar}, Sharp_Language templates SHALL exist and be retrievable for conflict narrative generation.

**Validates: Requirements 4.5**

---

### Property 19: Originality Score Improvement

*For any* content generated with Sharp_Language enabled, the originality score SHALL increase by at least 10 points compared to content without Sharp_Language.

**Validates: Requirements 4.6**

---

### Property 20: AdSense Policy Validation

*For any* generated content with contrarian analysis, the validation function SHALL verify AdSense policy compliance and return pass/fail status.

**Validates: Requirements 4.7**

---

### Property 21: Sentiment Analysis Before Insight Generation

*For any* content generation request with enableContrarian=true, sentiment analysis SHALL complete and return results before the generateSiaInsight function is invoked.

**Validates: Requirements 5.2**

---

### Property 22: Contrarian Enhancement of Insights

*For any* content generation with viable contrarian analysis (isViable=true), the SIA_Insight layer SHALL contain the contrarian narrative in addition to base insight content.

**Validates: Requirements 5.3**

---

### Property 23: Backward Compatibility

*For any* ContentGenerationRequest without the new optional fields (enableContrarian, sentimentSources), content generation SHALL succeed and produce valid output identical to pre-sentiment-engine behavior.

**Validates: Requirements 5.4**

---

### Property 24: E-E-A-T Base Score Preservation

*For any* content generation with contrarian disabled, the E-E-A-T score calculation SHALL produce identical results to the pre-sentiment-engine implementation.

**Validates: Requirements 5.6**

---

### Property 25: Gemini API Configuration

*For any* Gemini API call for sentiment analysis, the request SHALL use temperature=0.3 and enable Google Search grounding.

**Validates: Requirements 6.3, 6.2**

---

### Property 26: Gemini Prompt Structure

*For any* Gemini API sentiment analysis request, the prompt SHALL explicitly request sentiment scores, key narratives, and data contradictions in the response.

**Validates: Requirements 6.4**

---

### Property 27: Gemini Failure Graceful Fallback

*For any* Gemini API call that fails or times out, the Sentiment_Engine SHALL fall back to basic sentiment classification without throwing errors or blocking content generation.

**Validates: Requirements 6.5**

---

### Property 28: Sentiment Result Caching

*For any* sentiment analysis request with identical topic, asset, and language parameters, subsequent requests within 5 minutes SHALL return cached results without re-querying OSINT sources or Gemini API.

**Validates: Requirements 6.6, 12.2, 12.3**

---

### Property 29: Arabic Text Directionality

*For any* content generated with language=ar, conflict narratives and all Arabic text SHALL have right-to-left (RTL) text directionality markers.

**Validates: Requirements 7.4**

---

### Property 30: Cross-Language E-E-A-T Parity

*For any* identical content generated in different languages, the E-E-A-T scores SHALL have variance less than 10 points, ensuring quality parity across languages.

**Validates: Requirements 7.5**

---

### Property 31: Divergence Score Calculation Formula

*For any* sentiment analysis with Fear_Greed_Index F and data-based index D, the Sentiment_Divergence_Score SHALL equal |F - D| normalized to [0, 100] scale.

**Validates: Requirements 8.1**

---

### Property 32: Divergence Source Breakdown

*For any* sentiment analysis result, the metadata SHALL include a breakdown of divergence sources (on-chain vs sentiment, exchange flows vs social media, etc.) with contribution percentages.

**Validates: Requirements 8.7**

---

### Property 33: E-E-A-T Contrarian Bonuses

*For any* content with viable contrarian analysis:
- Experience component SHALL increase by 10-15 points
- Expertise component SHALL increase by 5-10 points when technical data supports contrarian views
- Total E-E-A-T score SHALL reach minimum 75/100

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 34: Data-Backed Trustworthiness

*For any* contrarian claim in generated content, the claim SHALL reference at least one specific data point, ensuring Trustworthiness scores are maintained.

**Validates: Requirements 9.5**

---

### Property 35: Conditional E-E-A-T Bonus Application

*For any* contrarian analysis with insufficient data support (< 2 data points), E-E-A-T bonuses SHALL NOT be applied.

**Validates: Requirements 9.6**

---

### Property 36: API Response Structure

*For any* successful API call to /api/sentiment/analyze (GET or POST), the response SHALL include fearGreedIndex, sentimentCategory, sentimentDivergenceScore, and metadata fields.

**Validates: Requirements 10.3**

---

### Property 37: POST Contrarian Response Completeness

*For any* POST request to /api/sentiment/analyze with enableContrarian=true, the response SHALL include the full contrarian object with isViable, confidence, dataPoints, narrative, and sharpLanguage fields.

**Validates: Requirements 10.4**

---

### Property 38: API Response Headers

*For any* API response from /api/sentiment/analyze, the headers SHALL include X-Sentiment-Sources, X-Divergence-Score, and X-Processing-Time.

**Validates: Requirements 10.6**

---

### Property 39: API Rate Limiting

*For any* IP address making requests to /api/sentiment/analyze, the system SHALL enforce a limit of 60 requests per minute, returning 429 status for excess requests.

**Validates: Requirements 10.7**

---

### Property 40: Comprehensive Content Validation

*For any* generated contrarian content, the validation function SHALL check:
- Minimum 2 data points supporting claims
- Divergence score ≥ 30
- Absence of forbidden phrases
- Originality score improvement ≥ 10 points
- AdSense policy compliance

And SHALL reject content failing any check.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

---

### Property 41: Validation Failure Fallback

*For any* content validation failure, the system SHALL log failure reasons and fall back to non-contrarian content generation without blocking the content pipeline.

**Validates: Requirements 11.6**

---

### Property 42: Validation Report Completeness

*For any* content validation operation, the system SHALL provide a report including all quality checks performed and their pass/fail status.

**Validates: Requirements 11.7**

---

### Property 43: Cache Invalidation on Market Events

*For any* detected significant market event (price movement > 5%, volume spike > 2x average), the sentiment cache for affected assets SHALL be invalidated immediately.

**Validates: Requirements 12.5**

---

### Property 44: Gemini API Rate Limiting

*For any* hour-long period, the system SHALL limit Gemini API calls to maximum 100 requests, queuing or rejecting excess requests to control costs.

**Validates: Requirements 12.7**

---

## Phase 3: Semantic Genesis Reasoning Properties

### Property 45: Inverse Entity Discovery Count

*For any* content generation request with enableSemanticGenesis=true, the Quantum_Entity_Linker SHALL discover between 3 and 5 inverse entities with correlation data for the primary entity.

**Validates: Semantic Genesis Requirements 1.1**

---

### Property 46: Correlation Coefficient Bounds

*For any* discovered inverse entity, the correlation coefficient SHALL be a numeric value within the range [0.0, 1.0] and SHALL be expressed quantitatively in the content.

**Validates: Semantic Genesis Requirements 1.2**

---

### Property 47: Correlation Source Validation

*For any* inverse entity correlation, the system SHALL validate the correlation data using at least 2 independent sources before including it in content.

**Validates: Semantic Genesis Requirements 1.5**

---

### Property 48: Semantic Depth Score Bounds

*For any* semantic genesis analysis, the calculated Semantic_Depth_Score SHALL be within the range [0, 100] and SHALL meet the minimum threshold of 70 for publication.

**Validates: Semantic Genesis Requirements 1.6, 10.2**

---

### Property 49: Multi-Language Entity Linking

*For any* content generation request with language parameter set to any of {en, tr, de, es, fr, ar}, the Quantum_Entity_Linker SHALL successfully discover inverse entities with culturally appropriate relationships.

**Validates: Semantic Genesis Requirements 1.7, 11.1**

---

### Property 50: Reasoning Chain Structure

*For any* generated reasoning chain, the chain SHALL contain explicit steps with premise ("Given that A"), implication ("this implies B"), and conclusion ("therefore C") components.

**Validates: Semantic Genesis Requirements 2.1**

---

### Property 51: Logical Connector Presence

*For any* reasoning step within a chain, the step SHALL use one of the approved logical connectors: GIVEN_THAT, THIS_IMPLIES, THEREFORE, HOWEVER, or CONSEQUENTLY.

**Validates: Semantic Genesis Requirements 2.2**

---

### Property 52: Reasoning Step Evidence Support

*For any* reasoning step, the step SHALL reference at least 1 specific data point or evidence source in the supportingData array.

**Validates: Semantic Genesis Requirements 2.3**

---

### Property 53: Minimum Reasoning Chain Count

*For any* article with semantic genesis enabled, the Multi_Step_Reasoner SHALL generate at least 2 reasoning chains, with a target of 3-4 chains.

**Validates: Semantic Genesis Requirements 2.4**

---

### Property 54: Logical Consistency Validation

*For any* reasoning chain, the validation function SHALL detect and reject chains containing circular reasoning (A → B → A patterns) or contradictory conclusions.

**Validates: Semantic Genesis Requirements 2.5, 15.1, 15.2**

---

### Property 55: Reasoning Depth Score Bounds

*For any* reasoning chain, the calculated Reasoning_Depth_Score and Logic_Soundness_Score SHALL be within the range [0, 100], with Logic_Soundness_Score meeting minimum threshold of 70.

**Validates: Semantic Genesis Requirements 2.7, 15.7**

---

### Property 56: Snippet Word Count Compliance

*For any* generated snippet block, the word count SHALL be exactly within the range [45, 55] words for optimal Position Zero selection.

**Validates: Semantic Genesis Requirements 3.1, 17.1**

---

### Property 57: Snippet Structure Completeness

*For any* snippet block, the structure SHALL contain all three required components: whatItIs (definitional), whyItMatters (relevance), and keyMetric (data point).

**Validates: Semantic Genesis Requirements 3.2**

---

### Property 58: Snippet Placement Validation

*For any* generated snippet, the placement field SHALL be one of the approved strategic positions: AFTER_HEADLINE, BEFORE_ANALYSIS, or CONCLUSION.

**Validates: Semantic Genesis Requirements 3.3**

---

### Property 59: Snippet Definitive Language

*For any* snippet block, the content SHALL contain at least one definitive language pattern such as "X is...", "The key factor is...", or "This means...".

**Validates: Semantic Genesis Requirements 3.4**

---

### Property 60: Snippet Readability Bounds

*For any* snippet block, the calculated readabilityScore (Flesch Reading Ease) SHALL be within the range [60, 70] for optimal accessibility.

**Validates: Semantic Genesis Requirements 3.5**

---

### Property 61: Snippet Quality Threshold

*For any* snippet block, the calculated Snippet_Quality_Score SHALL be within [0, 100], and snippets with scores ≥ 75 SHALL be marked as Position Zero candidates.

**Validates: Semantic Genesis Requirements 17.3**

---

### Property 62: Multi-Language Snippet Generation

*For any* content generation request with language parameter set to any of {en, tr, de, es, fr, ar}, the Snippet_Engineer SHALL generate language-specific snippets optimized for that language.

**Validates: Semantic Genesis Requirements 3.7, 11.3**

---

### Property 63: Intent Weight Profile Retrieval

*For any* supported language {en, tr, de, es, fr, ar}, the Cultural_Semantic_Adapter SHALL retrieve and apply the correct Intent_Weight profile with language-specific emphasis percentages.

**Validates: Semantic Genesis Requirements 4.1, 4.2-4.7, 18.1**

---

### Property 64: Cultural Adaptation Application

*For any* content with cultural adaptation enabled, the adapted content SHALL differ from the original based on the language-specific intent weight profile, with adjustments documented in toneAdjustments array.

**Validates: Semantic Genesis Requirements 4.1**

---

### Property 65: Prediction Hook Character Length

*For any* generated Prediction_Hook, the character length SHALL be within the range [60, 80] characters for optimal Google Discover display.

**Validates: Semantic Genesis Requirements 5.5**

---

### Property 66: Prediction Hook Numeric Data

*For any* Prediction_Hook, the text SHALL include at least one specific number or percentage for credibility.

**Validates: Semantic Genesis Requirements 5.4**

---

### Property 67: Prediction Hook AdSense Compliance

*For any* generated Prediction_Hook, the validation function SHALL verify AdSense policy compliance and reject hooks containing clickbait language.

**Validates: Semantic Genesis Requirements 5.3**

---

### Property 68: Multi-Language Prediction Hooks

*For any* content generation request with language parameter set to any of {en, tr, de, es, fr, ar}, the system SHALL generate language-specific Prediction_Hook variations.

**Validates: Semantic Genesis Requirements 5.7**

---

### Property 69: AI Overview Readiness Score Bounds

*For any* semantic genesis analysis, the calculated AI_Overview_Readiness_Score SHALL be within the range [0, 100] and SHALL meet the minimum threshold of 75 for optimal AI Overview selection.

**Validates: Semantic Genesis Requirements 14.1, 14.2**

---

### Property 70: Semantic E-E-A-T Enhancement

*For any* content with semantic genesis enabled:
- Expertise component SHALL increase by 15-20 points
- Authoritativeness component SHALL increase by 10-15 points when reasoning chains are present
- Experience component SHALL increase by 5-10 points when inverse entities demonstrate domain knowledge
- Total E-E-A-T score SHALL reach minimum 85/100

**Validates: Semantic Genesis Requirements 13.1, 13.2, 13.3, 13.4**

---

### Property 71: Semantic Cache TTL

*For any* semantic analysis request with identical topic, asset, and language parameters, subsequent requests within 10 minutes SHALL return cached results without re-querying Gemini API.

**Validates: Semantic Genesis Requirements 19.2**

---

### Property 72: Entity Relationship Cache Duration

*For any* discovered inverse entity relationship, the system SHALL cache the relationship for 24 hours to reduce API costs.

**Validates: Semantic Genesis Requirements 16.6, 19.3**

---

### Property 73: Semantic Processing Time Budget

*For any* semantic genesis analysis, the total processing time SHALL be less than 8 seconds for 95% of requests, maintaining the overall content generation performance budget.

**Validates: Semantic Genesis Requirements 8.7, 19.1**

---

### Property 74: Semantic Depth Score Calculation Components

*For any* semantic depth calculation, the score SHALL be computed using the weighted formula: entity linking (25%), reasoning chains (25%), snippet quality (20%), cultural adaptation (15%), authority seal (15%).

**Validates: Semantic Genesis Requirements 10.2**

---

### Property 75: Cross-Language Semantic Parity

*For any* identical content generated in different languages with semantic genesis enabled, the Semantic_Depth_Score variance SHALL be less than 15 points, ensuring quality parity across languages.

**Validates: Semantic Genesis Requirements 11.5**

---

### Property 76: Unsupported Reasoning Leap Detection

*For any* reasoning chain, the validation function SHALL detect and reject chains containing unsupported leaps (A → C without establishing B).

**Validates: Semantic Genesis Requirements 15.3**

---

### Property 77: Reasoning Step Evidence Requirement

*For any* reasoning step, the validation function SHALL ensure the step has at least one supporting data point, correlation, or established fact in the supportingData array.

**Validates: Semantic Genesis Requirements 15.4**

---

### Property 78: Inverse Entity Relevance Threshold

*For any* discovered inverse entity, the relevanceScore SHALL be ≥ 60 for the entity to be included in content, ensuring only meaningful relationships are presented.

**Validates: Semantic Genesis Requirements 16.2**

---

### Property 79: Snippet Self-Containment Validation

*For any* snippet block marked as isPositionZeroCandidate=true, the snippet SHALL be understandable without surrounding context, verified by having all three structure components (whatItIs, whyItMatters, keyMetric) populated.

**Validates: Semantic Genesis Requirements 17.4**

---

### Property 80: Semantic Genesis Backward Compatibility

*For any* ContentGenerationRequest without enableSemanticGenesis flag or with enableSemanticGenesis=false, content generation SHALL succeed and produce valid output identical to pre-semantic-genesis behavior.

**Validates: Semantic Genesis Requirements 8.4**

---

## Error Handling

### Error Categories

**Phase 1-2 Errors:**

1. **OSINT Source Failures**
   - **Cause**: External sentiment data sources unavailable or returning errors
   - **Handling**: Log warning, fall back to Gemini API with Google Search grounding
   - **User Impact**: None (transparent fallback)

2. **Gemini API Failures**
   - **Cause**: API timeout, rate limit, authentication error, or service outage
   - **Handling**: Log error, fall back to basic sentiment classification (neutral baseline)
   - **User Impact**: Reduced sentiment accuracy, no contrarian analysis
   - **Retry Strategy**: Exponential backoff (1s, 2s, 4s) for transient errors

3. **Insufficient Data for Contrarian Analysis**
   - **Cause**: Sentiment_Divergence_Score < 30
   - **Handling**: Skip contrarian generation, proceed with standard content
   - **User Impact**: None (content still generated, just without contrarian perspective)

4. **Validation Failures**
   - **Cause**: Generated content fails AdSense compliance, data support, or quality checks
   - **Handling**: Log validation report, regenerate without contrarian analysis
   - **User Impact**: Slight delay (< 2s) for regeneration

5. **Cache Corruption**
   - **Cause**: Invalid cached data structure or expired TTL
   - **Handling**: Clear corrupted entry, perform fresh analysis
   - **User Impact**: Slight delay for fresh analysis

6. **Language Template Missing**
   - **Cause**: Requested language not in Sharp_Language template database
   - **Handling**: Fall back to English templates, log warning
   - **User Impact**: Reduced language-specific quality

**Phase 3 Errors (Semantic Genesis):**

7. **Inverse Entity Discovery Failure**
   - **Cause**: Gemini API unable to discover sufficient inverse entities (< 3 entities)
   - **Handling**: Use cached entity relationships if available, otherwise skip entity linking for this request
   - **User Impact**: Reduced Semantic_Depth_Score, content still generated without entity links

8. **Correlation Data Validation Failure**
   - **Cause**: Discovered correlations lack sufficient source validation (< 2 sources)
   - **Handling**: Reject unvalidated correlations, only include entities with verified data
   - **User Impact**: Fewer inverse entities in content, but higher trustworthiness

9. **Reasoning Chain Logic Failure**
   - **Cause**: Generated reasoning chain fails Logic_Soundness_Score threshold (< 70)
   - **Handling**: Regenerate reasoning chain with stricter validation, or skip if regeneration fails
   - **User Impact**: Fewer reasoning chains, but higher logical consistency

10. **Snippet Quality Failure**
    - **Cause**: Generated snippet fails word count (not 45-55 words) or quality score (< 75)
    - **Handling**: Regenerate snippet up to 3 attempts, then use best available snippet
    - **User Impact**: Reduced Position Zero probability, but content still published

11. **Semantic Depth Threshold Failure**
    - **Cause**: Calculated Semantic_Depth_Score < 70 after all enhancements
    - **Handling**: Log warning, publish content with lower semantic depth, flag for manual review
    - **User Impact**: Content published but may not achieve AI Overview selection

12. **Cultural Adaptation Profile Missing**
    - **Cause**: Intent_Weight profile not found for requested language
    - **Handling**: Fall back to English (en) profile with logged warning
    - **User Impact**: Reduced cultural resonance, but content still generated

13. **AI Overview Readiness Failure**
    - **Cause**: Calculated AI_Overview_Readiness_Score < 75
    - **Handling**: Log detailed score breakdown, publish content, provide improvement recommendations
    - **User Impact**: Lower probability of AI Overview selection, but content still valuable

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string // User-friendly error message
  errorCode: string // Machine-readable error code
  details?: string // Technical details (dev mode only)
  fallbackApplied: boolean
  timestamp: string
}

// Error codes
const ERROR_CODES = {
  // Phase 1-2: Sentiment & Contrarian
  OSINT_UNAVAILABLE: 'SENT_001',
  GEMINI_FAILURE: 'SENT_002',
  INSUFFICIENT_DIVERGENCE: 'SENT_003',
  VALIDATION_FAILED: 'SENT_004',
  CACHE_CORRUPTED: 'SENT_005',
  RATE_LIMIT_EXCEEDED: 'SENT_006',
  LANGUAGE_UNSUPPORTED: 'SENT_007',
  
  // Phase 3: Semantic Genesis
  ENTITY_DISCOVERY_FAILED: 'SEM_001',
  CORRELATION_VALIDATION_FAILED: 'SEM_002',
  REASONING_LOGIC_FAILED: 'SEM_003',
  SNIPPET_QUALITY_FAILED: 'SEM_004',
  SEMANTIC_DEPTH_THRESHOLD_FAILED: 'SEM_005',
  CULTURAL_PROFILE_MISSING: 'SEM_006',
  AI_OVERVIEW_READINESS_LOW: 'SEM_007'
}
```

### Graceful Degradation Strategy

The system follows a degradation hierarchy to ensure content generation never fails completely:

1. **Full Feature (All 3 Phases)**: OSINT + Gemini + Contrarian Analysis + Semantic Genesis (Entity Linking + Reasoning Chains + Snippet Engineering + Cultural Adaptation)
2. **Degraded Level 1**: Gemini only (OSINT failed) + Contrarian Analysis + Semantic Genesis
3. **Degraded Level 2**: Basic sentiment + Contrarian Analysis + Partial Semantic Genesis (skip entity linking if discovery fails)
4. **Degraded Level 3**: Basic sentiment + No contrarian + Snippet Engineering only (skip entity linking and reasoning chains)
5. **Degraded Level 4**: Standard content generation (pre-sentiment-engine behavior, all enhancements disabled)

At each level, the system logs the degradation reason and continues processing. The goal is to provide maximum value while ensuring content is always published.

---

## Testing Strategy

### Dual Testing Approach

The SIA_ORACLE_GENESIS V2.0 requires both unit tests and property-based tests for comprehensive coverage across all 3 phases:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- **Phase 1-2**: Specific sentiment values (e.g., Fear_Greed_Index = 0, 50, 100), boundary conditions (divergence score exactly 30, 60), error scenarios (Gemini API timeout, OSINT failure), language-specific examples (Turkish phrases, Arabic RTL), integration with AdSense Writer
- **Phase 3**: Specific entity correlations (e.g., Gold/Real Yields at 0.85), reasoning chain examples (A → B → C validation), snippet word count boundaries (44, 45, 55, 56 words), cultural adaptation examples (German data-heavy vs Spanish trend-focused)

**Property Tests**: Verify universal properties across all inputs
- **Phase 1-2**: Score bounds invariants (all scores 0-100), threshold behaviors (divergence score ranges), caching correctness (cache hits return identical results), multi-language parity (E-E-A-T variance < 10 points), validation completeness (all checks performed)
- **Phase 3**: Semantic depth score bounds (0-100), entity count invariants (3-5 entities), reasoning chain structure (all chains have premise/implication/conclusion), snippet word count compliance (45-55 words), cultural parity (semantic depth variance < 15 points across languages)

### Property-Based Testing Configuration

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Seed-based reproducibility for debugging failures
- Shrinking enabled to find minimal failing cases

**Test Tagging Format**:
```typescript
// Phase 1-2 Example: Feature: sia-oracle-genesis-v2, Property 1: Score Bounds Invariant
test('all calculated scores remain within 0-100 bounds', () => {
  fc.assert(
    fc.property(
      fc.record({
        topic: fc.string(),
        asset: fc.constantFrom('BTC', 'ETH', 'SOL'),
        language: fc.constantFrom('en', 'tr', 'de', 'es', 'fr', 'ar'),
        onChainData: fc.record({
          whaleAccumulation: fc.float({ min: -100, max: 100 }),
          exchangeInflows: fc.float({ min: -1000000, max: 1000000 }),
          liquidityDepth: fc.float({ min: 0, max: 1000000 }),
          activeAddresses: fc.integer({ min: 0, max: 1000000 })
        })
      }),
      async (request) => {
        const result = await analyzeSentiment(request)
        
        // Property: All scores must be 0-100
        expect(result.fearGreedIndex).toBeGreaterThanOrEqual(0)
        expect(result.fearGreedIndex).toBeLessThanOrEqual(100)
        expect(result.sentimentDivergenceScore).toBeGreaterThanOrEqual(0)
        expect(result.sentimentDivergenceScore).toBeLessThanOrEqual(100)
      }
    ),
    { numRuns: 100 }
  )
})

// Phase 3 Example: Feature: sia-oracle-genesis-v2, Property 45: Inverse Entity Discovery Count
test('quantum entity linker discovers 3-5 inverse entities', () => {
  fc.assert(
    fc.property(
      fc.record({
        primaryEntity: fc.string({ minLength: 3 }),
        topic: fc.string(),
        asset: fc.constantFrom('BTC', 'ETH', 'GOLD', 'USD'),
        language: fc.constantFrom('en', 'tr', 'de', 'es', 'fr', 'ar')
      }),
      async (request) => {
        const result = await discoverInverseEntities(request)
        
        // Property: Must discover 3-5 inverse entities
        expect(result.inverseEntities.length).toBeGreaterThanOrEqual(3)
        expect(result.inverseEntities.length).toBeLessThanOrEqual(5)
        
        // Each entity must have correlation data
        result.inverseEntities.forEach(entity => {
          expect(entity.correlationCoefficient).toBeGreaterThanOrEqual(0.0)
          expect(entity.correlationCoefficient).toBeLessThanOrEqual(1.0)
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Test Examples

**Boundary Value Testing**:
```typescript
describe('Sentiment Categorization', () => {
  test('Fear_Greed_Index = 0 categorizes as EXTREME_FEAR', () => {
    expect(categorizeSentiment(0)).toBe('EXTREME_FEAR')
  })
  
  test('Fear_Greed_Index = 20 categorizes as EXTREME_FEAR', () => {
    expect(categorizeSentiment(20)).toBe('EXTREME_FEAR')
  })
  
  test('Fear_Greed_Index = 21 categorizes as FEAR', () => {
    expect(categorizeSentiment(21)).toBe('FEAR')
  })
  
  // ... test all boundaries
})
```

**Error Handling Testing**:
```typescript
describe('Gemini API Failure Handling', () => {
  test('falls back to basic classification on API timeout', async () => {
    // Mock Gemini API to timeout
    mockGeminiAPI.mockRejectedValue(new Error('Timeout'))
    
    const result = await analyzeSentiment({
      topic: 'Bitcoin rally',
      asset: 'BTC',
      language: 'en'
    })
    
    expect(result.metadata.geminiUsed).toBe(false)
    expect(result.sentimentCategory).toBeDefined()
  })
})
```

**Integration Testing**:
```typescript
describe('AdSense Writer Integration', () => {
  test('contrarian narrative appears in SIA Insight layer', async () => {
    const content = await generateAdSenseCompliantContent({
      rawNews: 'Bitcoin surges to new highs',
      asset: 'BTC',
      language: 'en',
      enableContrarian: true,
      onChainData: {
        whaleAccumulation: 34,
        exchangeInflows: -180000
      }
    })
    
    expect(content.siaInsight).toContain('Market expects')
    expect(content.siaInsight).toContain('but data shows')
    expect(content.metadata.contrarianApplied).toBe(true)
  })
  
  test('multi-language E-E-A-T parity maintained', async () => {
    const languages = ['en', 'tr', 'de', 'es', 'fr', 'ar']
    const scores: number[] = []
    
    for (const lang of languages) {
      const content = await generateAdSenseCompliantContent({
        rawNews: 'Bitcoin rally continues',
        asset: 'BTC',
        language: lang,
        enableContrarian: true,
        onChainData: {
          whaleAccumulation: 25,
          exchangeInflows: -100000
        }
      })
      scores.push(content.eeatScore)
    }
    
    // Verify variance < 10 points across all languages
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    expect(maxScore - minScore).toBeLessThan(10)
  })
  
  test('cache invalidation on market events', async () => {
    // First request - cache miss
    const result1 = await analyzeSentiment({
      topic: 'Bitcoin price',
      asset: 'BTC',
      language: 'en'
    })
    expect(result1.metadata.cacheHit).toBe(false)
    
    // Second request - cache hit
    const result2 = await analyzeSentiment({
      topic: 'Bitcoin price',
      asset: 'BTC',
      language: 'en'
    })
    expect(result2.metadata.cacheHit).toBe(true)
    
    // Simulate market event (5% price movement)
    await invalidateSentimentCache('Bitcoin price')
    
    // Third request - cache miss after invalidation
    const result3 = await analyzeSentiment({
      topic: 'Bitcoin price',
      asset: 'BTC',
      language: 'en'
    })
    expect(result3.metadata.cacheHit).toBe(false)
  })
})
```

### Test Coverage Goals

- **Line Coverage**: ≥ 85%
- **Branch Coverage**: ≥ 80%
- **Property Test Coverage**: All 80 correctness properties (44 Phase 1-2 + 36 Phase 3)
- **Integration Test Coverage**: All 7 integration points:
  - Phase 1-2: AdSense Writer, API endpoints, Gemini API, Cache
  - Phase 3: Quantum Entity Linker, Multi-Step Reasoner, Snippet Engineer, Cultural Semantic Adapter

### Performance Testing

While property-based tests focus on correctness, performance tests verify timing requirements:

```typescript
describe('Performance Requirements', () => {
  // Phase 1: Sentiment Analysis
  test('sentiment analysis completes within 3 seconds', async () => {
    const start = Date.now()
    
    await analyzeSentiment({
      topic: 'Ethereum price movement',
      asset: 'ETH',
      language: 'en'
    })
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(3000)
  })
  
  // Phase 2: Contrarian Analysis
  test('contrarian generation completes within 1 second', async () => {
    const sentiment = await analyzeSentiment({
      topic: 'Bitcoin rally',
      asset: 'BTC',
      language: 'en'
    })
    
    const start = Date.now()
    await generateContrarianAnalysis(sentiment, mockOnChainData, 'BTC')
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(1000)
  })
  
  // Phase 3: Semantic Genesis
  test('semantic genesis completes within 3 seconds', async () => {
    const start = Date.now()
    
    await generateSemanticGenesis({
      topic: 'Gold price analysis',
      asset: 'GOLD',
      language: 'en',
      enableQuantumLinking: true,
      enableMultiStepReasoning: true,
      enableSnippetEngineering: true
    })
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(3000)
  })
  
  // Total Pipeline
  test('complete 3-phase pipeline completes within 8 seconds', async () => {
    const start = Date.now()
    
    await generateAdSenseCompliantContent({
      rawNews: 'Bitcoin reaches new all-time high',
      asset: 'BTC',
      language: 'en',
      enableContrarian: true,
      enableSemanticGenesis: true
    })
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(8000)
  })
  
  test('cache hits return within 100ms', async () => {
    // Warm cache
    await analyzeSentiment({ topic: 'test', asset: 'BTC', language: 'en' })
    
    const start = Date.now()
    await analyzeSentiment({ topic: 'test', asset: 'BTC', language: 'en' })
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(100)
  })
  
  test('semantic cache hits return within 500ms', async () => {
    // Warm semantic cache
    await generateSemanticGenesis({ topic: 'test', asset: 'BTC', language: 'en' })
    
    const start = Date.now()
    await generateSemanticGenesis({ topic: 'test', asset: 'BTC', language: 'en' })
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(500)
  })
})
```

---

## Implementation Notes

### Phase 1: Core Sentiment Engine (Week 1)
- Implement `sia-sentiment-engine.ts` orchestrator
- OSINT source integration (Crypto Fear & Greed Index API)
- Fear_Greed_Index calculation and categorization
- Basic caching with 5-minute TTL
- Unit tests for core logic

### Phase 2: Gemini Integration & Contrarian Analysis (Week 1-2)
- Gemini API client with Google Search grounding
- Prompt engineering for sentiment analysis
- Error handling and fallback logic
- API usage logging and cost monitoring
- Integration tests with mocked Gemini responses

### Phase 2: Contrarian Analysis (Week 2)
- Implement `contrarian-analyzer.ts`
- Divergence score calculation
- Data contradiction detection
- Confidence level assignment
- Property tests for threshold behaviors

### Phase 2: Conflict Narrative Generation (Week 2-3)
- Implement `conflict-narrator.ts`
- Sharp_Language template system
- Multi-language narrative generation
- AdSense compliance validation
- Language-specific unit tests

### Phase 3: Quantum Entity Linking (Week 3)
- Implement `quantum-entity-linker.ts`
- Inverse entity discovery using Gemini API
- Correlation data validation (minimum 2 sources)
- Entity relationship caching (24-hour TTL)
- Property tests for entity count and correlation bounds

### Phase 3: Multi-Step Reasoning (Week 3-4)
- Implement `multi-step-reasoner.ts`
- Reasoning chain structure (premise → implication → conclusion)
- Logical consistency validation (detect circular reasoning, unsupported leaps)
- Integration with contrarian narratives
- Property tests for logic soundness

### Phase 3: Snippet Engineering (Week 4)
- Implement `snippet-engineer.ts`
- 45-55 word "ultimate definition" block generation
- Three-component structure (what it is + why it matters + key metric)
- Readability scoring (Flesch Reading Ease 60-70)
- Position Zero optimization
- Property tests for word count and quality

### Phase 3: Cultural Semantic Adaptation (Week 4)
- Implement `cultural-semantic-adapter.ts`
- Intent_Weight profiles for 6 languages
- Tone adjustment based on cultural preferences
- E-E-A-T parity validation across languages
- Property tests for cultural adaptation

### Phase 3: Semantic Depth Calculation (Week 4-5)
- Implement `semantic-depth-calculator.ts`
- Weighted scoring algorithm (entity linking 25%, reasoning 25%, snippet 20%, cultural 15%, authority 15%)
- AI_Overview_Readiness_Score calculation
- Improvement recommendation generation
- Property tests for score bounds and thresholds

### Phase 3: AdSense Writer Integration (Week 5)
- Extend ContentGenerationRequest interface with enableSemanticGenesis flag
- Enhance generateSiaInsight function with semantic enhancements
- Integrate entity links, reasoning chains, and snippets into content layers
- E-E-A-T score bonus calculation (semantic bonuses +15-30 points)
- Backward compatibility testing
- End-to-end integration tests

### Phase 3: API Endpoints (Week 5)
- Implement `/api/semantic-genesis/generate` POST endpoint
- Rate limiting middleware (30 requests/minute)
- Response header injection (X-Semantic-Depth-Score, X-Reasoning-Chains, etc.)
- API documentation
- API integration tests

### Phase 4: Validation & QA (Week 6)
- Comprehensive validation function for all 3 phases
- Validation report generation
- Fallback logic for validation failures
- Property-based test suite (all 80 properties)
- Performance testing and optimization
- Cross-language E-E-A-T parity validation

### Deployment Considerations

1. **Environment Variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   SENTIMENT_CACHE_TTL=300000 # 5 minutes
   SEMANTIC_CACHE_TTL=600000 # 10 minutes
   ENTITY_CACHE_TTL=86400000 # 24 hours
   GEMINI_RATE_LIMIT=100 # per hour
   API_RATE_LIMIT=60 # per minute (sentiment API)
   SEMANTIC_API_RATE_LIMIT=30 # per minute (semantic API)
   ENABLE_CONTRARIAN_ANALYSIS=true # Global feature flag
   ENABLE_SEMANTIC_GENESIS=true # Global feature flag
   ```

2. **Monitoring**:
   - **Phase 1-2**: Gemini API usage and costs, cache hit rates, sentiment analysis latency (p50, p95, p99), contrarian generation frequency, E-E-A-T score improvements
   - **Phase 3**: Semantic depth score distribution, AI Overview readiness trends, entity linking density, reasoning chain quality, snippet Position Zero wins, cross-language semantic parity

3. **Feature Flags**:
   - `ENABLE_CONTRARIAN_ANALYSIS`: Global on/off switch for Phase 2
   - `ENABLE_SEMANTIC_GENESIS`: Global on/off switch for Phase 3
   - `ENABLE_GEMINI_FALLBACK`: Control Gemini API usage
   - `STRICT_VALIDATION_MODE`: Enforce stricter quality checks
   - `ENABLE_ENTITY_LINKING`: Granular control for quantum entity linking
   - `ENABLE_REASONING_CHAINS`: Granular control for multi-step reasoning
   - `ENABLE_SNIPPET_ENGINEERING`: Granular control for snippet generation

4. **Cost Management**:
   - **Target Monthly Cost**: $100-150 total
     - Phase 1-2 (Sentiment + Contrarian): $30-40
     - Phase 3 (Semantic Genesis): $60-80
     - Buffer: $10-30
   - **Cost Optimization Strategies**:
     - Aggressive caching (sentiment: 5min, semantic: 10min, entities: 24hr)
     - Rate limiting (100 Gemini calls/hour)
     - Circuit breakers for API failures
     - Batch processing for bulk content generation

5. **Performance Targets**:
   - **Phase 1**: Sentiment analysis < 3 seconds (95th percentile)
   - **Phase 2**: Contrarian generation < 1 second (95th percentile)
   - **Phase 3**: Semantic genesis < 3 seconds (95th percentile)
   - **Total Pipeline**: < 8 seconds end-to-end (95th percentile)
   - **Cache Hits**: Sentiment > 40%, Semantic > 30%, Entities > 60%

6. **Quality Thresholds**:
   - **E-E-A-T Score**: ≥ 75/100 (Phase 1-2), ≥ 85/100 (Phase 3 enabled)
   - **Semantic Depth Score**: ≥ 70/100
   - **AI Overview Readiness Score**: ≥ 75/100
   - **Originality Score**: ≥ 70/100
   - **AdSense Compliance**: 100% (zero tolerance for violations)

---

## Appendix: Research Findings

### Sentiment Data Sources (OSINT)

1. **Crypto Fear & Greed Index API**
   - URL: https://api.alternative.me/fng/
   - Free tier: Unlimited requests
   - Data: Historical fear/greed index (0-100)
   - Latency: ~200ms average

2. **CoinGecko Sentiment API**
   - URL: https://api.coingecko.com/api/v3/coins/{id}
   - Free tier: 50 calls/minute
   - Data: Community sentiment, developer activity
   - Latency: ~300ms average

3. **Social Media Sentiment (Twitter/X)**
   - Requires API access (paid)
   - Alternative: Gemini with Google Search grounding (free with API key)
   - Data: Real-time social sentiment

### Gemini API Capabilities

- **Model**: Gemini 1.5 Pro 002
- **Context Window**: 2M tokens (sufficient for historical analysis)
- **Google Search Grounding**: Real-time web data access
- **Cost**: $0.00125 per 1K input tokens, $0.005 per 1K output tokens
- **Estimated Monthly Cost**: ~$30-40 for 1000 sentiment analyses

### Gemini Prompt Template for Sentiment Analysis

```typescript
const SENTIMENT_ANALYSIS_PROMPT = `You are a HIGH_AUTHORITY_FINANCIAL_ANALYST analyzing market sentiment.

TASK: Analyze sentiment for the following topic and provide structured output.

TOPIC: {topic}
ASSET: {asset}
LANGUAGE: {language}

REQUIREMENTS:
1. Calculate Fear/Greed Index (0-100 scale)
2. Identify sentiment category (EXTREME_FEAR, FEAR, NEUTRAL, GREED, EXTREME_GREED)
3. Find data contradictions (on-chain metrics vs sentiment)
4. Generate contrarian perspective if divergence exists

OUTPUT FORMAT (JSON):
{
  "fearGreedIndex": <number 0-100>,
  "sentimentCategory": "<category>",
  "keyNarratives": ["<narrative1>", "<narrative2>"],
  "dataContradictions": [
    {
      "type": "ON_CHAIN|EXCHANGE_FLOW|WHALE_ACTIVITY",
      "description": "<contradiction description>",
      "metric": "<specific metric with percentage/volume>"
    }
  ],
  "sources": ["<source1>", "<source2>"]
}

Use Google Search grounding to access real-time market data.
Temperature: 0.3 for consistency.
`
```

### On-Chain Data Sources

**Primary Sources**:
1. **Glassnode API** (Recommended)
   - URL: https://api.glassnode.com/v1/metrics/
   - Data: Whale accumulation, exchange flows, active addresses
   - Cost: Free tier (10 requests/day), Pro ($39/month)
   - Latency: ~500ms average

2. **CryptoQuant API**
   - URL: https://api.cryptoquant.com/v1/
   - Data: Exchange reserves, miner flows, stablecoin metrics
   - Cost: Free tier (limited), Pro ($49/month)
   - Latency: ~400ms average

3. **Etherscan API** (Ethereum only)
   - URL: https://api.etherscan.io/api
   - Data: Wallet balances, transaction volumes
   - Cost: Free tier (5 calls/sec)
   - Latency: ~300ms average

**Fallback Strategy**:
- If paid APIs unavailable, use Gemini with Google Search grounding to extract on-chain metrics from public sources (Glassnode Studio, CryptoQuant charts)
- Cache on-chain data for 15 minutes (longer TTL than sentiment due to slower change rate)

### Property-Based Testing Libraries

- **fast-check** (TypeScript): Mature, well-documented, 100+ generators
- **jsverify** (JavaScript): Older, less active maintenance
- **testcheck-js** (JavaScript): Inspired by QuickCheck, good for simple cases

**Recommendation**: fast-check for TypeScript compatibility and active development

### Multi-Language NLP Considerations

- **Turkish**: Agglutinative language, requires careful phrase construction
- **Arabic**: RTL text, different sentence structure, formal vs colloquial
- **German**: Compound words, formal business language
- **Spanish**: Regional variations (Latin America vs Spain)
- **French**: Formal business French, AMF compliance awareness

**Recommendation**: Use native speaker review for initial template creation, then property tests for consistency

---

## Summary: SIA_ORACLE_GENESIS V2.0 Integration

### System Overview

SIA_ORACLE_GENESIS V2.0 represents the complete integration of three powerful content generation phases:

1. **Phase 1: Sentiment Analysis** - Internet-wide sentiment quantification with Fear/Greed Index
2. **Phase 2: Contrarian Analysis** - Data-driven opposing viewpoints with conflict narratives
3. **Phase 3: Semantic Genesis Reasoning** - Conceptual authority structuring for Google AI Overview

### Key Achievements

**Content Quality Enhancement**:
- Base E-E-A-T Score: 50-60 points (standard AdSense Writer)
- With Phase 2 (Contrarian): +10-25 points → 60-85/100
- With Phase 3 (Semantic Genesis): +15-30 points → 75-115/100 (capped at 100)
- Target with all phases: ≥ 85/100

**Semantic Authority Metrics**:
- Semantic_Depth_Score: ≥ 70/100 (measures conceptual interconnectedness)
- AI_Overview_Readiness_Score: ≥ 75/100 (predicts Google AI Overview selection)
- Entity Linking Density: 3-5 inverse entities per article with correlation data
- Reasoning Chain Count: 2-4 multi-step chains per article
- Snippet Quality: ≥ 75/100 for Position Zero candidates

**Performance Budget**:
- Phase 1 (Sentiment): < 3 seconds
- Phase 2 (Contrarian): < 1 second  
- Phase 3 (Semantic Genesis): < 3 seconds
- Total Pipeline: < 8 seconds (95th percentile)

**Cost Management**:
- Target Monthly Cost: $100-150
  - Phase 1-2: $30-40
  - Phase 3: $60-80
  - Buffer: $10-30
- Optimization: Aggressive caching (sentiment: 5min, semantic: 10min, entities: 24hr)

### Integration Architecture

The unified system operates as a sequential enhancement pipeline:

```
Content Request
    ↓
Phase 1: Sentiment Analysis (OSINT + Gemini)
    ↓
Phase 2: Contrarian Analysis (if divergence ≥ 30)
    ↓
Phase 3: Semantic Genesis (if enabled)
    ├─ Quantum Entity Linking (3-5 inverse entities)
    ├─ Multi-Step Reasoning (2-4 chains)
    ├─ Snippet Engineering (45-55 words)
    └─ Cultural Semantic Adaptation (6 languages)
    ↓
Enhanced AdSense Content (3-Layer Structure)
    ├─ Layer 1: ÖZET (Journalistic Summary + Snippet)
    ├─ Layer 2: SIA_INSIGHT (Base + Entities + Reasoning + Contrarian)
    └─ Layer 3: DYNAMIC_RISK_SHIELD (Disclaimer + Authority Seal)
```

### Correctness Properties Coverage

**Total Properties**: 80 (44 Phase 1-2 + 36 Phase 3)

**Phase 1-2 Properties (1-44)**:
- Score bounds and thresholds (Properties 1, 2, 31)
- Multi-language support (Properties 5, 29, 30)
- Caching and performance (Properties 28, 43, 44)
- Contrarian generation logic (Properties 7-14)
- Sharp Language and AdSense compliance (Properties 15-20)
- E-E-A-T enhancement (Properties 33-35)
- API and validation (Properties 36-42)

**Phase 3 Properties (45-80)**:
- Entity linking (Properties 45-49, 78)
- Reasoning chains (Properties 50-55, 76-77)
- Snippet engineering (Properties 56-62, 79)
- Cultural adaptation (Properties 63-64)
- Prediction hooks (Properties 65-68)
- Semantic scoring (Properties 69, 74-75)
- E-E-A-T semantic bonuses (Property 70)
- Performance and caching (Properties 71-73)
- Backward compatibility (Property 80)

### Multi-Language Support

All 6 languages supported with equivalent quality:

| Language | Intent Weight Focus | E-E-A-T Variance | Semantic Parity |
|----------|---------------------|------------------|-----------------|
| English (en) | Balanced (Data 30%, Trends 25%, Analysis 25%) | Baseline | Baseline |
| German (de) | Data-heavy (Data 40%, Technical 30%) | < 10 points | < 15 points |
| Spanish (es) | Trend-focused (Trends 40%, Social 25%) | < 10 points | < 15 points |
| Turkish (tr) | Practical (Local Impact 35%, Policy 30%) | < 10 points | < 15 points |
| French (fr) | Analysis-deep (Analysis 35%, Historical 25%) | < 10 points | < 15 points |
| Arabic (ar) | Regional (Regional 40%, Islamic Finance 25%) | < 10 points | < 15 points |

### AdSense Compliance

**3-Layer Content Structure Maintained**:
- Layer 1 (ÖZET): Journalistic summary (2-3 sentences, 5W1H) + Snippet block placement
- Layer 2 (SIA_INSIGHT): Proprietary analysis + Entity links + Reasoning chains + Contrarian narrative
- Layer 3 (DYNAMIC_RISK_SHIELD): Context-specific disclaimer + Authority seal paragraph

**Quality Standards**:
- Word Count: 300+ words
- E-E-A-T Score: ≥ 85/100 (with all phases)
- Originality Score: ≥ 70/100
- Technical Depth: High (specific metrics, on-chain data, correlation coefficients)
- AdSense Compliance: 100% (zero tolerance for violations)

**Forbidden Practices Eliminated**:
- ❌ Generic phrases ("according to reports", "sources say")
- ❌ Clickbait headlines
- ❌ Thin content without unique insights
- ❌ Copy-paste disclaimers
- ❌ Robotic language patterns

**Required Elements Enforced**:
- ✅ Specific data points (percentages, volumes, correlation coefficients)
- ✅ SIA_SENTINEL attribution
- ✅ On-chain metrics and entity correlations
- ✅ Dynamic, context-specific risk warnings
- ✅ Professional journalism standards

### Testing Strategy

**Dual Approach**:
- Unit Tests: Specific examples, edge cases, integration points
- Property Tests: Universal properties across all inputs (100 iterations minimum)

**Coverage Goals**:
- Line Coverage: ≥ 85%
- Branch Coverage: ≥ 80%
- Property Coverage: All 80 properties
- Integration Coverage: All 7 integration points

**Framework**: fast-check (TypeScript property-based testing library)

### Deployment Readiness

**Feature Flags**:
- `ENABLE_CONTRARIAN_ANALYSIS`: Phase 2 control
- `ENABLE_SEMANTIC_GENESIS`: Phase 3 control
- Granular controls: Entity linking, reasoning chains, snippet engineering

**Monitoring Dashboards**:
- Sentiment analysis metrics (fear/greed distribution, divergence scores)
- Contrarian generation frequency and confidence levels
- Semantic depth score trends
- AI Overview readiness distribution
- Entity linking density and correlation quality
- Reasoning chain logic soundness
- Snippet Position Zero wins
- Cross-language performance parity

**Graceful Degradation**:
- Level 1: Full feature (all 3 phases)
- Level 2: Gemini only + Contrarian + Semantic
- Level 3: Basic sentiment + Contrarian + Partial semantic
- Level 4: Basic sentiment + Snippet engineering only
- Level 5: Standard content (pre-enhancement)

### Success Criteria

**Content Quality**:
- E-E-A-T Score: ≥ 85/100 (vs 60/100 baseline)
- Semantic Depth: ≥ 70/100
- AI Overview Readiness: ≥ 75/100
- Originality: ≥ 70/100

**Performance**:
- Total processing time: < 8 seconds (95th percentile)
- Cache hit rates: Sentiment > 40%, Semantic > 30%, Entities > 60%
- API costs: < $150/month

**Business Impact**:
- Position Zero wins: +30% increase
- Google AI Overview appearances: Measurable via Search Console
- Content uniqueness: Recognized as "Original Perspective" by Google
- Multi-language parity: < 15 point variance in semantic depth

### Next Steps

1. **Design Review**: Stakeholder approval of integrated architecture
2. **Task Creation**: Break down implementation into actionable tasks
3. **Phase 1 Implementation**: Core sentiment engine (Week 1)
4. **Phase 2 Implementation**: Contrarian analysis (Week 2-3)
5. **Phase 3 Implementation**: Semantic genesis (Week 3-5)
6. **Integration Testing**: End-to-end validation (Week 5-6)
7. **Deployment**: Staged rollout with feature flags (Week 6)

---

**Document Version**: 2.0.0  
**Created**: 2024  
**Updated**: 2024 (Semantic Genesis Integration Complete)  
**Status**: Ready for Review  
**Next Phase**: Task Creation

---

## Phase 3 Preview: SIA_GRAVITY_ENGINE (User Engagement Optimization)

**Note**: Phase 3 requirements will be added to requirements.md after current design review. This section provides architectural preview for upcoming features.

### Overview

SIA_GRAVITY_ENGINE extends the sentiment engine with user engagement optimization designed to complete the "Search Journey" on-site and signal user satisfaction to Google through behavioral metrics and structured data.

### Core Objectives

1. **End of Search Protocol**: Answer all related questions comprehensively
2. **Pattern Interrupts**: Mid-content engagement hooks using contrarian data
3. **Curiosity Gaps**: Strategic internal linking to deep reports
4. **UserInteraction Schema**: Google satisfaction signals via Schema.org

### Architectural Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Generation                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 1: Sentiment Analysis                     │
│              (Fear/Greed Index, OSINT, Gemini)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 2: Contrarian Generation                  │
│              (Conflict Narratives, Sharp Language)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 3: Gravity Engine (NEW)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Comprehensive Answer Generator                   │  │
│  │     - Anticipate follow-up questions                 │  │
│  │     - Full-spectrum analysis                         │  │
│  │     - Ethical transparency (real sources)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Pattern Interrupt Injector                       │  │
│  │     - Mid-content shocking data placement            │  │
│  │     - Contrarian insights from Phase 2               │  │
│  │     - "Aha moment" generation                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Curiosity Gap Generator                          │  │
│  │     - End-of-content unanswered question             │  │
│  │     - Internal link to SIA_DEEP_REPORT               │  │
│  │     - Honest next-step recommendation                │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  4. UserInteraction Schema Generator                 │  │
│  │     - Schema.org structured data                     │  │
│  │     - Engagement metrics tracking                    │  │
│  │     - Satisfaction scoring                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

**1. THE_FULL_TRUTH (Comprehensive Answer System)**

Purpose: Ensure users don't need to search elsewhere

Components:
- **Question Anticipation Engine**: Predicts 3-5 follow-up questions users might have
- **Full-Spectrum Analyzer**: Covers technical, fundamental, and sentiment angles
- **Ethical Transparency Module**: Real sources only, no fake hooks
- **Related Context Injector**: Adds relevant background (e.g., "How does this affect taxes?")

Example Output Structure:
```typescript
interface ComprehensiveAnswer {
  mainAnalysis: string // Core content from Phase 1-2
  anticipatedQuestions: {
    question: string
    answer: string
    sources: string[]
  }[]
  relatedContext: {
    topic: string
    explanation: string
    relevance: string
  }[]
  completenessScore: number // 0-100, target ≥ 85
}
```

**2. THE_MISSING_PIECE (Pattern Interrupt Generator)**

Purpose: Slow reading speed, increase time-on-page, create memorable moments

Placement Strategy:
- **Position**: 40-60% through content (after user is engaged but before fatigue)
- **Content Type**: Shocking contrarian data from Phase 2 sentiment analysis
- **Format**: Highlighted box or callout with specific on-chain metrics
- **Trigger**: Divergence score ≥ 50 (moderate to high contrarian value)

Example Pattern Interrupt:
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ HIDDEN PATTERN DETECTED                              │
│                                                          │
│ While social sentiment shows 78% bullish confidence,    │
│ SIA_SENTINEL on-chain analysis reveals:                 │
│                                                          │
│ • Whale wallets: +34% accumulation (12,450 BTC)        │
│ • Exchange inflows: -18% week-over-week                 │
│ • Stablecoin reserves: Declining for 9 consecutive days │
│                                                          │
│ This divergence historically precedes 15-25% corrections│
│ within 7-14 days (confidence: 73%, n=47 occurrences).   │
└─────────────────────────────────────────────────────────┘
```

**3. USER_JOURNEY_NEXT (Curiosity Gap + Internal Linking)**

Purpose: Guide users to next logical content without clickbait

Strategy:
- **Placement**: End of article, after full analysis provided
- **Format**: "If you understood X, the next step is Y" pattern
- **Link Target**: SIA_DEEP_REPORT, related analysis, or educational content
- **Honesty Principle**: Only link if genuinely relevant and valuable

Example Curiosity Gap:
```
## What's Next?

You now understand how sentiment divergence signals potential reversals. 
But how do professional traders actually position themselves when they 
detect these patterns?

Our "Liquidity Map Reading Guide" reveals the exact order book analysis 
techniques used by institutional desks to time entries within these 
divergence windows.

→ [Advanced: Reading Liquidity Maps During Sentiment Extremes]
```

**4. UserInteraction Schema (Google Signals)**

Purpose: Signal to Google that users found content satisfying

Schema.org Implementation:
```typescript
interface UserInteractionSchema {
  "@context": "https://schema.org"
  "@type": "UserInteraction"
  interactionType: "ReadAction" | "ViewAction" | "ConsumeAction"
  interactionService: {
    "@type": "WebSite"
    name: "SIA Intelligence"
    url: string
  }
  object: {
    "@type": "Article"
    headline: string
    url: string
  }
  // Engagement signals
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  actionStatus: "CompletedActionStatus" | "ActiveActionStatus"
  // Satisfaction indicators
  userInteractionCount: number // Scroll depth percentage
  interactionStatistic: {
    "@type": "InteractionCounter"
    interactionType: "ReadAction"
    userInteractionCount: number // Time on page in seconds
  }
}
```

Tracking Implementation:
```typescript
// Client-side tracking
const trackUserSatisfaction = () => {
  const metrics = {
    timeOnPage: calculateTimeOnPage(),
    scrollDepth: calculateScrollDepth(),
    clickedDeepLink: didClickInternalLink(),
    completedRead: scrollDepth > 80 && timeOnPage > 120
  }
  
  // Send to analytics
  sendUserInteractionSchema(metrics)
  
  // Update Schema.org JSON-LD
  updateInteractionSchema(metrics)
}
```

### Success Metrics (Phase 3)

| Metric | Current Baseline | Phase 3 Target | Industry Average |
|--------|------------------|----------------|------------------|
| Time on Page | 1.2 min | > 3 min | 1.5 min |
| Scroll Depth | 45% | > 80% | 55% |
| Click-Through to Deep Reports | 3% | > 15% | 5% |
| Bounce Rate | 65% | < 40% | 60% |
| Return Visitor (7 days) | 8% | > 25% | 12% |
| Pages per Session | 1.3 | > 2.5 | 1.8 |

### Integration with Existing Phases

**Phase 1 (Sentiment Engine) → Phase 3**:
- Fear/Greed Index used for pattern interrupt trigger
- Sentiment sources cited in comprehensive answers
- Divergence score determines interrupt placement

**Phase 2 (Contrarian Analysis) → Phase 3**:
- Conflict narratives become pattern interrupt content
- Sharp Language used in curiosity gap generation
- Data contradictions highlighted in "Missing Piece" boxes

**Phase 3 Output Enhancement**:
```typescript
export interface GravityEnhancedContent extends AdSenseCompliantContent {
  // Existing fields from Phase 1-2
  // ...
  
  // NEW Phase 3 fields
  gravityFeatures: {
    comprehensiveAnswer: ComprehensiveAnswer
    patternInterrupt: PatternInterrupt | null
    curiosityGap: CuriosityGap
    userInteractionSchema: UserInteractionSchema
  }
  engagementScore: number // 0-100, predicted engagement quality
}
```

### Implementation Phases

**Phase 3.1: Comprehensive Answer System** (Week 5)
- Question anticipation algorithm
- Related context injection
- Completeness scoring

**Phase 3.2: Pattern Interrupt Generator** (Week 5-6)
- Placement algorithm (40-60% position)
- Contrarian data formatting
- Visual design (highlighted boxes)

**Phase 3.3: Curiosity Gap System** (Week 6)
- Next-step recommendation engine
- Internal linking strategy
- Honesty validation (no clickbait)

**Phase 3.4: UserInteraction Schema** (Week 6-7)
- Schema.org implementation
- Client-side tracking
- Analytics integration

**Phase 3.5: Testing & Optimization** (Week 7)
- A/B testing framework
- Engagement metric validation
- Google Search Console monitoring

### Risk Considerations (Phase 3)

1. **Over-Engagement Risk**: Too many pattern interrupts may feel manipulative
   - Mitigation: Limit to 1 pattern interrupt per article, only when divergence ≥ 50

2. **Clickbait Perception**: Curiosity gaps may appear as clickbait
   - Mitigation: Enforce honesty principle, only link genuinely relevant content

3. **Schema Spam**: Excessive UserInteraction schema may trigger Google penalties
   - Mitigation: Only generate schema for articles with genuine engagement (time > 2min, scroll > 60%)

4. **Performance Impact**: Client-side tracking may slow page load
   - Mitigation: Lazy-load tracking scripts, use requestIdleCallback for non-critical metrics

---

**Phase 3 Status**: Requirements pending  
**Expected Requirements Document Update**: After Phase 1-2 design approval  
**Estimated Phase 3 Completion**: Week 7 (1 week after Phase 2 completion)
