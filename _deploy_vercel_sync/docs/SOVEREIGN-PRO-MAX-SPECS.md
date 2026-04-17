# Sovereign Pro Max - Neural Analytics & Code Execution

This document defines the Ultra-Elite tier of the SIAIntel Terminal, introducing autonomous computational capabilities.

## 🚀 Pro Max Capabilities

### 1. Neural Code Execution (Python Sandbox)
- **Engine**: Gemini 2.0 Flash / 1.5 Pro with `code_execution` tool.
- **Capabilities**:
    - Real-time data processing (CSV/JSON analysis).
    - Complex financial math (Correlation, Volatility clusters, Black-Scholes).
    - On-the-fly chart generation (matplotlib/plotly logic).
- **Security**: Runs in Google's managed secure sandbox.

### 2. Deep Intelligence Grounding
- **Engine**: Integrated Google Search V2.
- **Mission**: Zero-hallucination factual verification for all terminal responses.
- **Protocol**: Every AI analyst response is cross-checked against live web data.

### 3. Integrated Global Multi-Tool Suite
- Unified access to:
    - `get_market_data`
    - `analyze_technical_indicators`
    - `convert_currency`
    - `generate_intelligence_report` (PDF)
    - `code_execution` (Analytics)

## 📡 Deployment Strategy
- Update `lib/sia-news/gemini-integration.ts` to register built-in tools (`code_execution`, `google_search_retrieval`).
- Refactor UI to display "Code Execution" output blocks (Markdown formatted).
- Enable "Thinking" models for better planning of multi-step agent tasks.
